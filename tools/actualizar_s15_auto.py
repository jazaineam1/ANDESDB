# -*- coding: utf-8 -*-
"""Sincroniza los artefactos públicos/revision de S15 v7 sin publicar claves de respuesta."""
from __future__ import annotations
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

FILES=(
  'evaluador-s15.html','evaluador-s15-v7.html',
  'assets/learning/s15-autograder-v7.js',
  'assets/learning/s15-nested-duckdb-v1.mjs',
  'assets/learning/s15-workbench-v7.css',
  'Presentaciones/M6/sesion-15-desafio-final.html',
  'Presentaciones/M6/sesion-15-desafio-final-v7.html',
  'Plantillas/proyecto-final/criterios.md',
  'Plantillas/proyecto-final/Datos/casos.csv',
  'Plantillas/proyecto-final/Datos/eventos.csv',
  'Plantillas/proyecto-final/Datos/evidencias.json',
  'Plantillas/proyecto-final/Datos/casos_dirty.csv',
  'Plantillas/proyecto-final/Datos/eventos_dirty.csv',
  'tools/curso.json','assets/learning/learning-plan.json',
)

def copy(rel:str)->None:
    src=ROOT/rel
    if not src.exists():
        raise FileNotFoundError(rel)
    dst=ROOT/'revision'/rel
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)

def main()->int:
    for rel in FILES:
        copy(rel)
    print('S15 v7 sincronizada: interfaz, datos, evaluación, presentación y contratos públicos.')
    return 0

if __name__=='__main__':
    raise SystemExit(main())
