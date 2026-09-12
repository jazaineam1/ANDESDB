(() => {
  'use strict';
  const S=window.ANDES_LAB_CONTENT?.sessions;
  if(!S)return;
  if(S[15]?.tasks?.[0]) S[15].tasks[0].requirements=[['qué|cuál|cuánto|cómo'],['dato|venta|cliente|pedido|producto']];
})();