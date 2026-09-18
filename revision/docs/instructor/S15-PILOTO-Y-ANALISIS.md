# S15 v7 · Protocolo de piloto y análisis de ítems

Este protocolo operacionaliza la fase 3 de la auditoría. No sustituye estudiantes reales: prepara una prueba reproducible antes de la cohorte y define qué mirar después de aplicar.

## Piloto think-aloud

Muestra mínima: 3–5 personas.

Incluye obligatoriamente:
- al menos una persona que resuelva desde teléfono;
- al menos una persona sin experiencia previa en bases de datos;
- al menos una persona con experiencia en SQL o analítica.

No enseñes la solución. Pide que verbalicen qué creen que significa cada control, qué dato usan para decidir y por qué cambian una respuesta.

### Guion

1. Abrir S15 en modo evaluación sin explicar la interfaz.
2. Pedir que identifique qué haría primero.
3. Observar Estación 0, Q1/Q2, Modelo, DDL, BigQuery, Nested y Boss.
4. Registrar:
   - control que no entiende;
   - supuesto que hace;
   - momento en que usa ensayo y error;
   - mensaje de feedback que cambia su razonamiento;
   - bloqueo móvil;
   - respuesta correcta que la herramienta rechaza;
   - respuesta incorrecta que la herramienta acepta.
5. Cerrar con una defensa de una decisión.

## Criterios de parada

No publicar como nota si aparece cualquiera de estos:
- una resolución correcta no puede alcanzar el máximo por UI;
- un starter obtiene crédito sin modificación;
- un error conceptual típico obtiene crédito completo;
- el puntaje cambia antes de Comprobar en modo evaluación;
- el Boss puede resolverse copiando una clave pública;
- una interacción esencial no funciona en teléfono.

## Análisis después de aplicar

El panel S15 v7 calcula:
- dificultad por checkpoint (tasa de éxito en primer intento);
- mejor tasa alcanzada;
- mejora primer → mejor intento;
- discriminación aproximada de cada checkpoint;
- correlación dominio–Boss;
- tiempo por estación;
- nivel de justificación 0–2;
- distribución de variantes del Boss.

Interpretación recomendada:
- discriminación < 0 puede señalar un ítem defectuoso o un contrato confuso;
- discriminación alrededor de 0.3 o mayor es una señal útil, no una regla absoluta;
- mejora muy alta con éxito final alto sugiere aprendizaje mediante feedback;
- éxito inicial alto con baja discriminación puede indicar un ítem demasiado fácil;
- Boss sin correlación con dominio exige revisar si mide transferencia o azar.

## Registro manual del piloto

| Participante | Dispositivo | Experiencia | Bloqueo principal | Falso positivo | Falso negativo | Tiempo Boss | Defensa satisfactoria |
|---|---|---|---|---|---|---:|---|
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |

## Decisión docente

Antes de usar S16, revisa los checkpoints con baja discriminación, contratos ambiguos o fallos de UI. Si una estación tuvo un defecto conocido durante la aplicación, no la uses como evidencia diagnóstica en S16.
