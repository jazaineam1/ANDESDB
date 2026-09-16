# -*- coding: utf-8 -*-
"""Mantiene S15 como un workbench integrador autoevaluado.

Fuentes de verdad:
- evaluador-s15.html
- assets/learning/s15-autograder.js
- assets/learning/s15-workbench.css
- Presentaciones/M6/sesion-15-desafio-final.html
- capstone.html
- Plantillas/proyecto-final/{README.md,criterios.md}

El script sincroniza esas piezas a /revision y alinea curso.json y
learning-plan.json sin volver a incrustar HTML antiguo.
También protege la experiencia móvil: drag & drop de escritorio siempre debe
tener una alternativa tap → destino y los editores deben ser utilizables con
teclado móvil.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOBILE_MARKER = "S15_MOBILE_TAP_V1"


def copy(rel: str) -> None:
    src = ROOT / rel
    dst = ROOT / "revision" / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"No se encontró ancla para parche móvil S15: {label}")
    return text.replace(old, new, 1)


def ensure_mobile_workbench() -> None:
    """Añade una ruta táctil real sin eliminar drag & drop de escritorio."""
    html_path = ROOT / "evaluador-s15.html"
    js_path = ROOT / "assets" / "learning" / "s15-autograder.js"
    css_path = ROOT / "assets" / "learning" / "s15-workbench.css"

    html = html_path.read_text(encoding="utf-8")
    js = js_path.read_text(encoding="utf-8")
    css = css_path.read_text(encoding="utf-8")

    # Evita que el teléfono conserve los assets anteriores y elimina minutaje
    # visible ajeno a la pausa de las presentaciones.
    html = html.replace("s15-workbench.css?v=s15w3", "s15-workbench.css?v=s15w4")
    html = html.replace("s15-autograder.js?v=s15w3", "s15-autograder.js?v=s15w4")
    html = html.replace(
        "<span>Reto evaluado · 2 h orientativas</span>",
        "<span>Reto integrador · evidencia automática</span>",
    )
    html = html.replace(
        "La ruta está pensada para unas 2 horas de trabajo activo. Puedes volver atrás, corregir y volver a probar. La nota final usa tu mejor estado verificado en cada dimensión.",
        "La ruta está pensada como trabajo activo y corregible. Puedes volver atrás, reparar y volver a probar. La nota final usa tu mejor estado verificado en cada dimensión.",
    )
    html = html.replace(
        "arrastra cada fuente al rol correcto",
        "arrastra cada fuente al rol correcto; en celular, toca la ficha y luego el destino",
    )
    html = html.replace(
        "arrastra la clave de cada fuente al slot",
        "arrastra la clave de cada fuente; en celular, toca la clave y luego el slot",
    )
    html = html.replace(
        "Arrastra a la entidad correcta. Haz clic en un campo ya colocado para marcar/desmarcar PK.",
        "Arrastra a la entidad correcta. En celular, toca un campo y luego la entidad. Toca un campo colocado para marcar/desmarcar PK.",
    )
    html = html.replace(
        "Arrastra nodos a las capas. Luego pulsa un nodo origen y después un nodo destino para crear una conexión. Pulsa una conexión para eliminarla.",
        "Arrastra nodos a las capas. En celular, toca un nodo sin ubicar y luego la capa. Para conectar, toca un nodo ubicado y después otro. Toca una conexión para eliminarla.",
    )
    if 'id="mobileHelp"' not in html:
        html = replace_once(
            html,
            '    <div id="engineStatus" class="status work">Preparando datos y motor SQL…</div>\n',
            '    <div id="engineStatus" class="status work">Preparando datos y motor SQL…</div>\n'
            '    <div id="mobileHelp" class="mobile-help"><b>Modo táctil:</b> toca una ficha y luego su destino. No necesitas arrastrar. En SQL, el código ya parte de un bug pequeño para que puedas repararlo también desde el celular.</div>\n',
            "ayuda móvil",
        )
    html_path.write_text(html, encoding="utf-8")

    if MOBILE_MARKER not in css:
        css += r'''

/* S15_MOBILE_TAP_V1 · soporte táctil y ergonomía móvil */
.mobile-help{display:none;margin:0 0 12px;padding:10px 12px;border:1px solid #b2ddff;border-left:4px solid #175cd3;border-radius:12px;background:#eff8ff;color:#1849a9;font-size:.8rem}
.drag-card,.flow-node{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.drag-card.tap-selected,.flow-node.tap-selected{outline:3px solid #175cd366;border-color:#175cd3;background:#eff8ff!important}
.dropzone.tap-ready{border-color:#84adff}
.model-field-actions{display:flex;align-items:center;gap:5px;margin-left:auto}
.model-remove{width:30px;height:30px;border-radius:8px;background:#fef3f2;color:#b42318;border:1px solid #fecdca;font-weight:950;display:grid;place-items:center;padding:0}
@media(max-width:760px),(pointer:coarse){
  .mobile-help{display:block}
  .drag-card,.flow-node,.primary,.secondary,.danger,.final-btn,.ghost,.data-tabs button,.edge-chip{min-height:44px}
  .drag-card,.flow-node,.chip{padding:10px 12px}
  .dropzone{min-height:72px}
  .code{font-size:16px;line-height:1.45;min-height:220px}
  .code.tall{min-height:300px}
  .table-wrap,.query-result{-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
  .mission-actions{align-items:stretch}
  .mission-actions>button{width:100%}
  .feedback{min-width:0;width:100%}
}
'''
        css_path.write_text(css, encoding="utf-8")

    if MOBILE_MARKER not in js:
        js = replace_once(
            js,
            "let SQL=null,baseData=null,dragPayload=null,selectedFlowNode=null;",
            "let SQL=null,baseData=null,dragPayload=null,tapPayload=null,selectedFlowNode=null;\nconst S15_MOBILE_TAP_V1=true;",
            "estado táctil",
        )
        js = replace_once(
            js,
            "f.innerHTML=`<span>${esc(label)}</span>${state.model.pk[ent]===id?'<span class=\"badge pk\">PK</span>':''}`;z.appendChild(f)",
            "f.innerHTML=`<span>${esc(label)}</span><span class=\"model-field-actions\">${state.model.pk[ent]===id?'<span class=\"badge pk\">PK</span>':''}<button type=\"button\" class=\"model-remove\" data-remove-model=\"${esc(id)}\" aria-label=\"Devolver ${esc(label)} al banco de campos\">×</button></span>`;z.appendChild(f)",
            "botón quitar campo",
        )
        anchor = "function bindEvents(){\n"
        mobile_functions = r'''function clearTapPlacement(){
  tapPayload=null;
  $$('.tap-selected').forEach(el=>{el.classList.remove('tap-selected');el.setAttribute?.('aria-pressed','false')});
  $$('.dropzone.tap-ready').forEach(z=>z.classList.remove('tap-ready'));
}
function selectTapPlacement(el){
  if(!el)return false;
  const next={kind:el.dataset.kind,id:el.dataset.id};
  if(tapPayload&&tapPayload.kind===next.kind&&tapPayload.id===next.id){clearTapPlacement();return true}
  clearTapPlacement();tapPayload=next;el.classList.add('tap-selected');el.setAttribute?.('aria-pressed','true');
  $$('.dropzone').forEach(z=>z.classList.add('tap-ready'));
  setEngine(`Seleccionaste ${el.textContent.trim().slice(0,60)}. Ahora toca el destino.`, 'work');
  return true;
}
function decorateTapTargets(){
  $$('[draggable="true"][data-kind]').forEach(el=>{
    if(el.tagName!=='BUTTON'){el.setAttribute('role','button');el.tabIndex=0}
    el.setAttribute('aria-pressed',tapPayload&&tapPayload.kind===el.dataset.kind&&tapPayload.id===el.dataset.id?'true':'false');
  });
}
function finishTapDrop(zone){
  if(!tapPayload||!zone)return false;
  const payload={...tapPayload};handleDrop(zone,payload);clearTapPlacement();decorateTapTargets();return true;
}

'''
        js = replace_once(js, anchor, mobile_functions + anchor, "funciones tap")
        js = replace_once(
            js,
            "  document.addEventListener('dragstart',e=>{\n    const el=e.target.closest('[draggable=\"true\"][data-kind]');if(!el)return;",
            "  document.addEventListener('dragstart',e=>{\n    clearTapPlacement();\n    const el=e.target.closest('[draggable=\"true\"][data-kind]');if(!el)return;",
            "drag limpia tap",
        )
        old_click = """  document.addEventListener('click',async e=>{\n    const tab=e.target.closest('[data-dataset]');if(tab&&tab.closest('#dataTabs')){previewDataset(tab.dataset.dataset);return}\n    const mf=e.target.closest('.model-field');if(mf){const ent=mf.dataset.entity,id=mf.dataset.id;state.model.pk[ent]=state.model.pk[ent]===id?null:id;renderModel();save();updateScores();return}\n    const fn=e.target.closest('.flow-node');if(fn){\n      const id=fn.dataset.id;if(!selectedFlowNode){selectedFlowNode=id}else if(selectedFlowNode===id){selectedFlowNode=null}else{if(!edge(selectedFlowNode,id))state.flow.edges.push([selectedFlowNode,id]);selectedFlowNode=null}renderFlow();save();updateScores();return\n    }\n"""
        new_click = """  document.addEventListener('click',async e=>{\n    const tab=e.target.closest('[data-dataset]');if(tab&&tab.closest('#dataTabs')){previewDataset(tab.dataset.dataset);return}\n    const rm=e.target.closest('[data-remove-model]');if(rm){removeModelField(rm.dataset.removeModel);decorateTapTargets();return}\n    const tapCard=e.target.closest('[draggable=\"true\"][data-kind]');\n    if(tapCard&&!tapCard.classList.contains('model-field')&&!tapCard.classList.contains('flow-node')){selectTapPlacement(tapCard);return}\n    const mf=e.target.closest('.model-field');if(mf){const ent=mf.dataset.entity,id=mf.dataset.id;state.model.pk[ent]=state.model.pk[ent]===id?null:id;renderModel();decorateTapTargets();save();updateScores();return}\n    const fn=e.target.closest('.flow-node');if(fn){\n      const id=fn.dataset.id;\n      if(!state.flow.placements[id]){selectTapPlacement(fn);return}\n      clearTapPlacement();if(!selectedFlowNode){selectedFlowNode=id}else if(selectedFlowNode===id){selectedFlowNode=null}else{if(!edge(selectedFlowNode,id))state.flow.edges.push([selectedFlowNode,id]);selectedFlowNode=null}renderFlow();decorateTapTargets();save();updateScores();return\n    }\n    const zone=e.target.closest('.dropzone');\n    if(zone&&tapPayload){finishTapDrop(zone);return}\n    if(zone?.classList.contains('flow-lane')&&selectedFlowNode&&!e.target.closest('.flow-node')){state.flow.placements[selectedFlowNode]=zone.dataset.lane;selectedFlowNode=null;renderFlow();decorateTapTargets();save();updateScores();return}\n"""
        js = replace_once(js, old_click, new_click, "click tap fallback")
        js = replace_once(
            js,
            "  document.addEventListener('dblclick',e=>{const mf=e.target.closest('.model-field');if(mf){removeModelField(mf.dataset.id);return}});\n",
            "  document.addEventListener('dblclick',e=>{const mf=e.target.closest('.model-field');if(mf){removeModelField(mf.dataset.id);decorateTapTargets();return}});\n"
            "  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[draggable=\"true\"][data-kind]')){e.preventDefault();e.target.click()}});\n",
            "teclado accesible",
        )
        js = replace_once(
            js,
            "    renderAll();previewDataset('casos');bindEvents();\n",
            "    renderAll();previewDataset('casos');decorateTapTargets();bindEvents();\n",
            "decorar targets al iniciar",
        )
        js_path.write_text(js, encoding="utf-8")


def find_session(course: dict, n: int) -> dict | None:
    for module in course.get("modulos", []):
        for session in module.get("sesiones", []):
            if session.get("n") == n:
                return session
    return None


def update_course() -> None:
    path = ROOT / "tools" / "curso.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    s = find_session(data, 15)
    if not s:
        raise RuntimeError("No se encontró S15 en tools/curso.json")
    s.update({
        "fecha": "2026-09-18",
        "duracionUtil": 165,
        "modo": "workbench_integrador_autoevaluado",
        "trabajoAutonomoMin": 120,
        "titulo": "Desafío final · Workbench integrador",
        "estado": s.get("estado", "pendiente"),
        "desc": (
            "Reto de trabajo activo: inspector de datos, modelador ER interactivo, "
            "constructor de flujo, DDL con pruebas, SQL Debug Arena, modelo estrella y Chaos Lab. "
            "37 checkpoints automáticos generan retroalimentación y registran reintentos en el LMS."
        ),
        "tags": [
            "workbench", "drag-and-drop", "touch", "modelado ER", "arquitectura",
            "DDL", "SQL debugging", "modelo estrella", "chaos testing",
            "evaluación automática", "LMS"
        ],
        "href": "Presentaciones/M6/sesion-15-desafio-final.html",
        "recursos": [
            {"txt": "🧪 S15 Workbench · 7 estaciones / 37 checkpoints", "href": "evaluador-s15.html"},
            {"txt": "🧭 Tablero del desafío", "href": "capstone.html"},
            {"txt": "✅ Contrato y rúbrica del workbench", "href": "Plantillas/proyecto-final/criterios.md"},
        ],
    })
    for module in data.get("modulos", []):
        if module.get("n") == 6:
            module["desc"] = (
                "Integrar el recorrido en un caso nuevo construyendo una solución ejecutable, "
                "sometiéndola a pruebas y cambios automáticos, y cerrar después con transferencia hacia DP-900."
            )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("tools/curso.json")


def update_learning_plan() -> None:
    path = ROOT / "assets" / "learning" / "learning-plan.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    s = data.setdefault("sesiones", {}).setdefault("15", {})
    dp900 = s.get("dp900", [])
    s.update({
        "fecha": "2026-09-18",
        "titulo": "Desafío final · Workbench integrador",
        "duracion_util": 165,
        "modo": "workbench_integrador_autoevaluado",
        "trabajo_autonomo_min": 120,
        "objetivo": (
            "Integrar grano, modelado, integridad, SQL, arquitectura y analítica construyendo "
            "una solución que sobreviva pruebas y cambios de requisitos."
        ),
        "nucleo": {
            "titulo": "Construye y prueba una solución completa",
            "minutos": 90,
            "instrucciones": (
                "Completa Inspector, ER Builder, Flow Builder, DDL Lab y SQL Debug Arena. "
                "Cada estación genera evidencia automática y puede corregirse antes de continuar."
            ),
            "criterios": [
                "clasifica fuentes y claves desde evidencia",
                "construye el modelo ER por manipulación directa",
                "crea un flujo de datos coherente",
                "implementa integridad ejecutable",
                "repara consultas que sobreviven a variaciones",
            ],
        },
        "reto": {
            "titulo": "Transferencia analítica + Chaos Lab",
            "minutos": 30,
            "instrucciones": (
                "Construye el modelo estrella y ejecuta el Chaos Lab. La prueba final reutiliza "
                "el DDL, las consultas y el flujo; no agrega preguntas de selección."
            ),
            "criterios": [
                "define grano, medidas y dimensiones",
                "acepta evolución legítima sin perder integridad",
                "mantiene resultados al cambiar los datos",
                "conserva un camino para evidencia semiestructurada",
            ],
        },
        "solucion": {
            "modo": "automatica",
            "evaluador": "evaluador-s15.html",
            "version": "s15-workbench-v3",
            "checkpoints": 37,
            "puntaje_maximo": 100,
            "interaccion_movil": "tap_then_destination",
        },
    })
    if dp900:
        s["dp900"] = dp900
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy("assets/learning/learning-plan.json")


def sync_assets() -> None:
    for rel in (
        "evaluador-s15.html",
        "assets/learning/s15-autograder.js",
        "assets/learning/s15-workbench.css",
        "Presentaciones/M6/sesion-15-desafio-final.html",
        "capstone.html",
        "Plantillas/proyecto-final/README.md",
        "Plantillas/proyecto-final/criterios.md",
    ):
        copy(rel)


def main() -> int:
    ensure_mobile_workbench()
    update_course()
    update_learning_plan()
    sync_assets()
    print("S15 Workbench v3 sincronizado: desktop drag + móvil tap → destino + revisión.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
