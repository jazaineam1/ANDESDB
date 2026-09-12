(() => {
  'use strict';
  const S=window.ANDES_LAB_CONTENT?.sessions;
  if(!S)return;
  for(const session of Object.values(S)){
    for(const task of (session.tasks||[])){
      if(task.type==='sql') task.starter='-- Escribe tu consulta aquí\n';
    }
  }
  if(S[15]?.tasks?.[0]) S[15].tasks[0].requirements=[['qué|cuál|cuánto|cómo'],['dato|venta|cliente|pedido|producto']];
})();