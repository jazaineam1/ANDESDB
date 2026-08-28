# Soluciones cifradas · S7, S10 y S13

Este directorio puede contener las soluciones **antes de la clase**, pero únicamente cifradas. El repositorio es público: nunca se debe versionar aquí una solución en texto plano.

## Configuración una sola vez

En GitHub: `Settings → Secrets and variables → Actions → New repository secret`.

Crea el secret:

- Nombre: `SOLUTIONS_PASSPHRASE`
- Valor: una frase larga y aleatoria que no uses en ningún otro sitio.

## Preparar una solución antes de clase

Guarda temporalmente la solución en `soluciones_privadas/S7.sql` (esa carpeta está en `.gitignore`) y desde Git Bash, WSL, macOS o Linux ejecuta:

```bash
mkdir -p soluciones_cifradas
openssl enc -aes-256-cbc -pbkdf2 -salt \
  -in soluciones_privadas/S7.sql \
  -out soluciones_cifradas/S7.sql.enc \
  -pass env:SOLUTIONS_PASSPHRASE
```

Repite cambiando `S7` por `S10` o `S13`.

Solo se hace commit del archivo `.enc`.

## Qué ocurre a las 20:00

El workflow `.github/workflows/publicar-soluciones.yml` se ejecuta todos los días a la hora equivalente a las 20:00 de Bogotá. Lee `assets/learning/learning-plan.json`; si la fecha corresponde a S7, S10 o S13:

1. verifica que exista `soluciones_cifradas/SN.sql.enc`;
2. usa el secret `SOLUTIONS_PASSPHRASE`;
3. genera `Scripts/SN-solucion.sql`;
4. hace commit y push de la solución pública.

Así el grupo tiene al menos una hora larga de trabajo antes de poder comparar con la solución.

## Publicación manual

El workflow también tiene `Run workflow`. Se puede indicar un número de sesión y publicar antes/después si la dinámica de la clase lo exige.
