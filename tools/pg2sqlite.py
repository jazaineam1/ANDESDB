"""Convierte el volcado de PostgreSQL dvdrental.sql en una base SQLite.

Uso: py pg2sqlite.py <entrada.sql> <salida.db>
"""
import re, sys, os, sqlite3

TYPE_MAP = [
    (r'^character varying(\(\d+\))?$', 'TEXT'),
    (r'^character(\(\d+\))?$', 'TEXT'),
    (r'^text$', 'TEXT'),
    (r'^text\[\]$', 'TEXT'),
    (r'^integer$', 'INTEGER'),
    (r'^smallint$', 'INTEGER'),
    (r'^bigint$', 'INTEGER'),
    (r'^boolean$', 'INTEGER'),
    (r'^numeric(\(\d+,\s*\d+\))?$', 'REAL'),
    (r'^real$', 'REAL'),
    (r'^double precision$', 'REAL'),
    (r'^date$', 'TEXT'),
    (r'^timestamp.*$', 'TEXT'),
    (r'^time.*$', 'TEXT'),
    (r'^bytea$', 'BLOB'),
    (r'^tsvector$', 'TEXT'),
    (r'^public\.mpaa_rating$', 'TEXT'),
    (r'^public\.year$', 'INTEGER'),
]


def map_type(pgtype):
    t = pgtype.strip().lower()
    for pat, out in TYPE_MAP:
        if re.match(pat, t):
            return out
    return 'TEXT'


def unescape(v):
    if v == r'\N':
        return None
    out, i = [], 0
    while i < len(v):
        ch = v[i]
        if ch == '\\' and i + 1 < len(v):
            n = v[i + 1]
            mapping = {'t': '\t', 'n': '\n', 'r': '\r', '\\': '\\',
                       'b': '\b', 'f': '\f', 'v': '\v'}
            if n in mapping:
                out.append(mapping[n]); i += 2; continue
            out.append(n); i += 2; continue
        out.append(ch); i += 1
    return ''.join(out)


def main(src, dst):
    raw = open(src, encoding='utf-8', errors='replace').read()

    # --- 1. tablas ---------------------------------------------------------
    tables = {}
    for m in re.finditer(r'CREATE TABLE public\.(\w+)\s*\((.*?)\n\);', raw, re.S):
        name, body = m.group(1), m.group(2)
        cols = []
        for line in body.split('\n'):
            line = line.strip().rstrip(',').strip()
            if not line or line.upper().startswith(('CONSTRAINT', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')):
                continue
            cm = re.match(r'^(\w+)\s+(.+)$', line)
            if not cm:
                continue
            cname, rest = cm.group(1), cm.group(2)
            rest = re.sub(r'\s+DEFAULT\s+.*$', '', rest, flags=re.I)
            notnull = bool(re.search(r'NOT NULL', rest, re.I))
            rest = re.sub(r'\s*NOT NULL\s*', '', rest, flags=re.I).strip()
            cols.append((cname, map_type(rest), notnull))
        if cols:
            tables[name] = cols

    # --- 2. llaves primarias ----------------------------------------------
    pks = {}
    for m in re.finditer(r'ALTER TABLE ONLY public\.(\w+)\s*\n?\s*ADD CONSTRAINT \w+ PRIMARY KEY \(([^)]+)\);', raw):
        pks[m.group(1)] = [c.strip() for c in m.group(2).split(',')]

    if os.path.exists(dst):
        os.remove(dst)
    con = sqlite3.connect(dst)
    cur = con.cursor()
    cur.execute('PRAGMA journal_mode=OFF')
    cur.execute('PRAGMA synchronous=OFF')

    for name, cols in tables.items():
        parts = []
        for cname, ctype, notnull in cols:
            parts.append('  "%s" %s%s' % (cname, ctype, ' NOT NULL' if notnull else ''))
        if name in pks:
            parts.append('  PRIMARY KEY (%s)' % ', '.join('"%s"' % c for c in pks[name]))
        cur.execute('CREATE TABLE "%s" (\n%s\n);' % (name, ',\n'.join(parts)))
    con.commit()

    # --- 3. datos (bloques COPY ... FROM stdin) ---------------------------
    counts = {}
    for m in re.finditer(r'COPY public\.(\w+) \(([^)]*)\) FROM stdin;\n(.*?)\n\\\.\n', raw, re.S):
        name, collist, data = m.group(1), m.group(2), m.group(3)
        if name not in tables:
            continue
        cols = [c.strip() for c in collist.split(',')]
        types = {c: t for c, t, _ in tables[name]}
        rows = []
        for line in data.split('\n'):
            if line == '' or line == '\\.':
                continue
            vals = line.split('\t')
            if len(vals) != len(cols):
                continue
            rec = []
            for c, v in zip(cols, vals):
                val = unescape(v)
                if val is not None and types.get(c) == 'INTEGER':
                    if val == 't':
                        val = 1
                    elif val == 'f':
                        val = 0
                    else:
                        try:
                            val = int(val)
                        except ValueError:
                            pass
                elif val is not None and types.get(c) == 'REAL':
                    try:
                        val = float(val)
                    except ValueError:
                        pass
                elif val is not None and types.get(c) == 'BLOB':
                    val = None
                rec.append(val)
            rows.append(rec)
        if rows:
            ph = ','.join('?' * len(cols))
            cur.executemany('INSERT INTO "%s" (%s) VALUES (%s)' % (
                name, ','.join('"%s"' % c for c in cols), ph), rows)
        counts[name] = len(rows)
    con.commit()

    # --- 4. indices utiles -------------------------------------------------
    for tbl, col in [('customer', 'store_id'), ('film', 'language_id'),
                     ('inventory', 'film_id'), ('rental', 'customer_id'),
                     ('payment', 'customer_id'), ('film_actor', 'actor_id')]:
        try:
            cur.execute('CREATE INDEX "idx_%s_%s" ON "%s" ("%s")' % (tbl, col, tbl, col))
        except sqlite3.Error:
            pass
    con.commit()
    cur.execute('VACUUM')
    con.close()

    print('Tablas creadas: %d' % len(tables))
    for t in sorted(counts):
        print('   %-16s %6d filas' % (t, counts[t]))
    print('Archivo: %s  (%.1f MB)' % (dst, os.path.getsize(dst) / 1024 / 1024))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
