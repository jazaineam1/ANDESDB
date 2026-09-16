# -*- coding: utf-8 -*-
from __future__ import annotations
import csv,json,re,sqlite3
from copy import deepcopy
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'Plantillas/proyecto-final/Datos'

def read_csv(n):
    with (DATA/n).open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))
def load():return {'casos':read_csv('casos.csv'),'eventos':read_csv('eventos.csv'),'evidencias':json.loads((DATA/'evidencias.json').read_text(encoding='utf-8'))}
def db(data):
    c=sqlite3.connect(':memory:');c.executescript('CREATE TABLE casos_src(caso_id INTEGER,fecha_creacion TEXT,ciudadano_id TEXT,tipo TEXT,prioridad TEXT,estado TEXT,canal TEXT,barrio TEXT);CREATE TABLE eventos_src(evento_id TEXT,caso_id INTEGER,fecha_evento TEXT,estado TEXT,agente_id TEXT,minutos_desde_anterior INTEGER);')
    c.executemany('INSERT INTO casos_src VALUES(?,?,?,?,?,?,?,?)',[(int(r['caso_id']),r['fecha_creacion'],r.get('ciudadano_id'),r['tipo'],r['prioridad'],r['estado'],r.get('canal'),r['barrio']) for r in data['casos']])
    c.executemany('INSERT INTO eventos_src VALUES(?,?,?,?,?,?)',[(r['evento_id'],int(r['caso_id']),r['fecha_evento'],r['estado'],r.get('agente_id'),int(r['minutos_desde_anterior'])) for r in data['eventos']]);return c

def visible_counterexample():
    d=deepcopy(load());next(c for c in d['casos'] if c['caso_id']=='1007')['estado']='Cerrado';d['eventos'].append({'evento_id':'E099','caso_id':'1007','fecha_evento':'2026-08-05 12:00','estado':'Cerrado','agente_id':'A03','minutos_desde_anterior':'170'});return d

def test_q2_mutant_killed():
    c=db(visible_counterexample());mutant="SELECT c.caso_id,c.estado AS estado_actual,MAX(e.estado) AS ultimo_estado FROM casos_src c LEFT JOIN eventos_src e ON e.caso_id=c.caso_id GROUP BY c.caso_id,c.estado";correct="WITH ult AS (SELECT caso_id,estado,ROW_NUMBER() OVER(PARTITION BY caso_id ORDER BY fecha_evento DESC,evento_id DESC) rn FROM eventos_src) SELECT c.caso_id,c.estado,u.estado FROM casos_src c LEFT JOIN ult u ON u.caso_id=c.caso_id AND u.rn=1";m=c.execute(mutant).fetchall();g=c.execute(correct).fetchall();c.close();assert m!=g,'MAX(estado) volvió a sobrevivir al dataset visible'

def test_interface_contract():
    html=(ROOT/'evaluador-s15-v6.html').read_text(encoding='utf-8');js=(ROOT/'assets/learning/s15-autograder-v6b.js').read_text(encoding='utf-8');css=(ROOT/'assets/learning/s15-workbench-v6.css').read_text(encoding='utf-8');ui=html+js
    assert '80 puntos corregibles' in html and 'Boss 20 puntos' in html
    for token in ('SQL Arena','Modelo ER + laboratorio de normalización','DDL Mutation Lab','Document Lab','Warehouse Builder','BigQuery Physical Lab','Nested BigQuery Lab','Boss · pedidos omnicanal'):assert token in html,token
    for token in ('PARTITION BY','CLUSTER BY','UNNEST','ARRAY&lt;STRUCT&gt;','Parquet','OLTP','OLAP','Mutation Hunter'):assert token in ui,token
    assert 'type="radio"' not in html.lower();assert "VERSION='s15-workbench-v6'" in js;assert 'reference:' not in js.lower(),'No publicar queries de referencia finales';assert 'v3.casos' in js and 'E099' in js,'Falta contraejemplo visible temporal';assert 'bqEstimate' in js and 'unnestOk' in js and 'dwScore' in js;assert 'data-drop' in html and 'dragstart' in js and 'touch' in css;assert 'min-height:44px' in css and 'font-size:16px' in css

def test_stable_routes():
    ev=(ROOT/'evaluador-s15.html').read_text(encoding='utf-8');pr=(ROOT/'Presentaciones/M6/sesion-15-desafio-final.html').read_text(encoding='utf-8');assert 'evaluador-s15-v6.html' in ev and 'v5.html' not in ev;assert 'sesion-15-desafio-final-v6.html' in pr and 'v5.html' not in pr

def test_presentation():
    p=(ROOT/'Presentaciones/M6/sesion-15-desafio-final-v6.html').read_text(encoding='utf-8');assert p.count('class="slide')==14
    no_scripts=re.sub(r'<script[\s\S]*?</script>','',p,flags=re.I);mins=re.findall(r'\b\d+\s*(?:minutos|min)\b',no_scripts,flags=re.I);assert mins==['15 minutos','15 minutos'],f'Minutaje visible inesperado: {mins}'
    for t in ('Warehouse','BigQuery','ARRAY','STRUCT','UNNEST','Boss'):assert t in p
    rp=ROOT/'revision/Presentaciones/M6/sesion-15-desafio-final-v6.html'
    if rp.exists():assert p==rp.read_text(encoding='utf-8'),'Presentación v6 pública/revision difieren'

def test_manifest_contract():
    c=json.loads((ROOT/'tools/curso.json').read_text(encoding='utf-8'));s=next(s for m in c['modulos'] for s in m['sesiones'] if s['n']==15);txt=json.dumps(s,ensure_ascii=False)
    for t in ('Data Warehouse','BigQuery','UNNEST','server-side'):assert t in txt,t
    assert s['href']=='Presentaciones/M6/sesion-15-desafio-final.html'

def main():
    test_q2_mutant_killed();test_interface_contract();test_stable_routes();test_presentation();test_manifest_contract();print('S15 v6 integral: cobertura S2–S14, mutantes, móvil y rutas OK')
if __name__=='__main__':main()
