# Soluciones cifradas · S7, S10 y S13

Este directorio guarda las soluciones **antes de la clase**, pero únicamente cifradas. El repositorio es público: aquí no se versiona jamás una solución en texto plano.

El texto plano vive en `soluciones_privadas/`, que está en `.gitignore`. De este directorio solo se hace commit del archivo `.enc`.

---

## Estado

| Sesión | Fecha | Publica | Texto plano | Cifrada |
|---|---|---|---|---|
| **S7** · De las reglas al modelo | 2026-09-01 | **20:15** | `soluciones_privadas/S7.sql` ✅ | **pendiente de cifrar** |
| S10 · ¿SQL o NoSQL? | 2026-09-08 | 20:00 | — | — |
| S13 · Laboratorio BigQuery | 2026-09-15 | 20:00 | — | — |

La S7 ya tiene su modelo de referencia escrito y probado contra SQLite. **Falta un solo comando**, el de cifrar, que solo puedes ejecutar tú porque hace falta la contraseña.

---

## Lo que hay que hacer para la S7

Desde Git Bash, con el secret ya configurado en tu máquina:

```bash
export SOLUTIONS_PASSPHRASE='la frase que guardaste en GitHub'

openssl enc -aes-256-cbc -pbkdf2 -salt \
  -in  soluciones_privadas/S7.sql \
  -out soluciones_cifradas/S7.sql.enc \
  -pass env:SOLUTIONS_PASSPHRASE
```

Comprueba que se descifra bien **antes** de subirlo, que es el único momento en que puedes darte cuenta:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in soluciones_cifradas/S7.sql.enc \
  -pass env:SOLUTIONS_PASSPHRASE | head -20
```

Y luego:

```bash
git add soluciones_cifradas/S7.sql.enc
git commit -m "Solución cifrada de la sesión 7"
```

Si `git status` llega a mostrar `soluciones_privadas/`, **para**: algo se rompió en el `.gitignore`.

---

## Configuración, una sola vez

En GitHub: `Settings → Secrets and variables → Actions → New repository secret`.

- Nombre: `SOLUTIONS_PASSPHRASE`
- Valor: una frase larga y aleatoria que no uses en ningún otro sitio.

Guárdala también donde puedas recuperarla: **sin ella, un `.enc` ya subido no se puede volver a abrir.**

---

## Qué ocurre el día de la clase

El workflow `.github/workflows/publicar-soluciones.yml` se dispara todos los días a las 19:45 de Bogotá. Lee `assets/learning/learning-plan.json` y:

1. busca una sesión cuya `fecha` sea hoy, con `solucion.modo = "programada"`;
2. **espera hasta la hora que diga `solucion.publicar`** de esa sesión;
3. comprueba que exista `soluciones_cifradas/SN.sql.enc` y el secret;
4. descifra y genera `Scripts/SN-solucion.sql`;
5. hace commit y push de la solución ya pública.

> **La hora sale del plan, no del workflow.** Hasta el 30 de agosto el workflow comparaba contra `"20:00"` literal, así que la S7 —programada a las **20:15**, después de su debrief— no se habría publicado nunca. Ahora acepta cualquier hora **a partir de las 20:00**, que es el suelo que fija `AGENTS.md`. `tools/validar_curso.py` comprueba ese suelo y rechaza cualquier hora anterior.

También hay `Run workflow` manual, indicando el número de sesión, por si la dinámica de la clase lo exige. En manual no espera: publica al momento.

---

## La S7 no es una consulta, es un esquema

Las S10 y S13 entregan SQL de consulta. La S7 entrega un **modelo conceptual**, así que su «solución» es el modelo de referencia escrito como `CREATE TABLE` comentado:

- corre tal cual en SQLite (11 tablas, 10 claves foráneas, 3 índices);
- **cada** columna obligatoria, restricción y clave foránea cita el número de la regla que la justifica, y las que no citan ninguna van marcadas «sin regla»;
- lleva una sección final con **las ocho reglas de las diez que el esquema no puede defender**, y dónde tiene que vivir cada una;
- y otra con **las cinco preguntas que siguen sin respuesta**, para llevárselas a la dueña.

Encaja en el mecanismo sin tocarlo —el workflow solo descifra un archivo y lo escribe en `Scripts/`— y adelanta medio paso de la sesión 9, donde ese mismo esquema se lleva a Azure SQL.

Se abre a las **20:15** a propósito: el debrief termina a las 20:02, y publicarla antes la dejaría disponible mientras todavía se está discutiendo.
