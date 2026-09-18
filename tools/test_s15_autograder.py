# -*- coding: utf-8 -*-
"""Compatibilidad histórica. La evaluación vigente es S15 v7.

La clave de respuestas ya no se publica en los tests del sitio. Ejecuta
`python tools/test_s15_v7.py` para la batería de aceptación actual.
"""
from pathlib import Path
import runpy
if __name__=="__main__":
    runpy.run_path(str(Path(__file__).with_name("test_s15_v7.py")),run_name="__main__")
