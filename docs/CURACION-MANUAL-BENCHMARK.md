# Curación manual de la rama benchmark

Este archivo marca el cambio de estrategia de la rama `mejoras-benchmark-pedagogico`.

A partir de esta revisión:

- el contenido pedagógico no se autoedita en CI;
- `main` es la fuente de recuperación para cualquier sesión degradada;
- los validadores son controles de regresión, no sustitutos de revisión humana;
- las mejoras se aceptan solo después de contrastar el archivo resultante con el original;
- no se cambia el estilo visual de las presentaciones.

La auditoría adversarial posterior a la primera aplicación automática detectó regresiones reales en S6 y S9; por eso se abandona el enfoque de transformaciones encadenadas por reemplazo de texto.
