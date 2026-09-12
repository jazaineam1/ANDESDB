(() => {
  'use strict';
  const root = document.getElementById('extra-labs');
  if (!root) return;

  const LABS = [
    {
      code:'s1-diagnostico', session:1, title:'S1 · Diagnóstico que sí deja evidencia', subtitle:'Distingue conceptos antes de memorizar nombres.',
      questions:[
        ['¿Cuál describe mejor una base de datos?',['Una carpeta con archivos','Datos organizados administrados por un sistema que permite consultar y controlar','Cualquier Excel','Un dashboard'],1,'La base no es solo el archivo: importa el sistema que organiza, consulta y protege los datos.'],
        ['¿Qué hace SQL principalmente?',['Diseña imágenes','Permite definir, consultar y modificar datos en sistemas relacionales','Convierte todo a JSON','Reemplaza al motor de base de datos'],1,'SQL es un lenguaje para trabajar con datos y estructuras relacionales.'],
        ['Una carga que registra pedidos uno por uno es principalmente…',['OLTP','OLAP','Data lake','Streaming por definición'],0,'Registrar transacciones individuales es un patrón OLTP.']
      ]
    },
    {
      code:'s6-reglas-evidencia', session:6, title:'S6 · Regla, evidencia o hipótesis', subtitle:'Evita convertir un patrón de datos en una “ley del negocio”.',
      questions:[
        ['En los datos históricos ninguna reserva supera 8 personas. ¿Qué puedes afirmar?',['La empresa prohíbe reservas > 8','Es evidencia observada; falta confirmar si es una regla','Debe ponerse CHECK <= 8 inmediatamente','Es una clave primaria'],1,'Un patrón observado no demuestra por sí solo una regla normativa.'],
        ['“Todo pedido debe pertenecer a un cliente existente” viene confirmado por negocio. ¿Qué es?',['Regla de negocio','Hipótesis','Error de SQL','Agregación'],0,'Es una regla explícita que luego puede traducirse a integridad referencial.'],
        ['No sabemos si una mesa puede cambiar de mesero en un mismo turno. ¿Qué conviene hacer?',['Inventar 1:1','Marcar la cardinalidad como hipótesis y preguntar','Eliminar Mesero','Usar NoSQL'],1,'La incertidumbre debe quedar explícita antes de fijar el modelo.']
      ]
    },
    {
      code:'s9-constraints', session:9, title:'S9 · Constraints que protegen reglas', subtitle:'Elige la restricción por el fallo que quieres impedir.',
      questions:[
        ['Impedir un pedido para un cliente que no existe.',['CHECK','FOREIGN KEY','DEFAULT','ORDER BY'],1,'FOREIGN KEY protege la integridad referencial.'],
        ['Impedir precio <= 0.',['CHECK','UNIQUE','FOREIGN KEY','SERIAL'],0,'CHECK valida una condición sobre el valor.'],
        ['Evitar dos usuarios con el mismo correo.',['UNIQUE','DEFAULT','BOOLEAN','GROUP BY'],0,'UNIQUE impide duplicados según la clave definida.'],
        ['Exigir que nombre siempre tenga valor.',['NOT NULL','LIMIT','HAVING','INDEX por sí solo'],0,'NOT NULL impide ausencia de valor en la columna.']
      ]
    },
    {
      code:'s11-documentos', session:11, title:'S11 · Embed, reference o híbrido', subtitle:'Decide por patrón de acceso, cambio y fuente de verdad.',
      questions:[
        ['Un carrito se lee y actualiza casi siempre completo y cambia rápido antes del checkout.',['Documento embebido','Normalizarlo siempre en 12 tablas','Archivo CSV','Solo una vista SQL'],0,'El agregado completo y mutable encaja naturalmente como documento.'],
        ['Al confirmar la compra necesitas integridad entre pedido, líneas y pago.',['Mantener solo el carrito como fuente final','Persistir la venta en una fuente transaccional con reglas explícitas','Guardar una captura de pantalla','Eliminar IDs'],1,'La fuente de verdad de la venta necesita garantías transaccionales.'],
        ['Un catálogo de productos se comparte entre miles de carritos y cambia de forma independiente.',['Duplicarlo ciegamente en cada documento','Referenciar el producto y guardar solo datos necesarios del contexto','No guardar producto','Usar siempre N:M relacional'],1,'Cuando la entidad tiene ciclo de vida propio y alta reutilización, una referencia suele ser más defendible.']
      ]
    },
    {
      code:'s15-integrador', session:15, title:'S15 · Arquitectura sin receta', subtitle:'Elige componentes por responsabilidad y riesgo.',
      questions:[
        ['Necesitas registrar ventas válidas, analizar históricos y conservar archivos crudos. ¿Qué arquitectura es más razonable?',['Una sola hoja Excel','OLTP relacional + almacenamiento/lago + capa analítica','Solo documentos para todo','Solo Power BI'],1,'Separar responsabilidades evita forzar una sola tecnología para cargas distintas.'],
        ['Una consulta duplica ingresos después de dos JOIN 1:N. ¿Qué revisas primero?',['Cambiar de nube','El grano y la multiplicación de filas','Comprar más CPU','Crear un índice sin mirar la consulta'],1,'El error conceptual de grano no se corrige cambiando de proveedor.'],
        ['¿Qué evidencia fortalece más una decisión técnica?',['“Siempre se hace así”','Patrón de acceso, consistencia requerida, volumen/latencia y costo de fallo','El logo del proveedor','La herramienta más nueva'],1,'La decisión defendible parte de requisitos y consecuencias.']
      ]
    },
    {
      code:'s16-dp900', session:16, title:'S16 · Transferencia DP-900', subtitle:'Reconoce el servicio después de entender el escenario.',
      questions:[
        ['Archivos Parquet históricos a gran escala. ¿Qué familia Azure reconocerías?',['Azure Blob Storage / Data Lake Storage','Azure SQL Database exclusivamente','Power BI como almacenamiento','Azure Functions como base'],0,'El escenario es almacenamiento de objetos/archivos analíticos.'],
        ['Base SQL administrada sin gestionar SO/VM.',['Azure SQL Database','Azure Blob Storage','Event Hubs','Cosmos DB siempre'],0,'Azure SQL Database es un servicio relacional administrado.'],
        ['Eventos que deben procesarse a medida que llegan.',['Batch','Streaming','Normalización','Backup'],1,'La característica decisiva es el procesamiento continuo/casi en tiempo real.'],
        ['Documentos distribuidos globalmente con baja latencia.',['Azure Cosmos DB puede encajar','Excel','Solo Azure Files','Un índice B-tree resuelve todo'],0,'Los requisitos de distribución y modelo documental orientan hacia Cosmos DB.'],
        ['Gerencia necesita modelo semántico y dashboards interactivos.',['Power BI','PostgreSQL como visualizador','Blob Storage','DNS'],0,'Power BI es la herramienta de analítica/visualización del escenario.']
      ]
    }
  ];

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const local=()=>{try{return JSON.parse(localStorage.getItem('andesdb.lms.local.v1')||'{}')}catch{return{}}};

  function card(lab){
    const done=local().completed?.[lab.code];
    const qs=lab.questions.map((q,qi)=>`<fieldset class="xl-q"><legend>${qi+1}. ${esc(q[0])}</legend>${q[1].map((o,oi)=>`<label><input type="radio" name="${lab.code}-${qi}" value="${oi}"> <span>${esc(o)}</span></label>`).join('')}<div class="xl-explain" data-explain="${qi}"></div></fieldset>`).join('');
    return `<article class="xl-card" data-lab="${lab.code}" data-session="${lab.session}"><header><div><span class="xl-kicker">Micro-laboratorio · ${lab.questions.length} preguntas</span><h2>${esc(lab.title)}</h2><p>${esc(lab.subtitle)}</p></div><span class="xl-status ${done?'done':''}">${done?'✓ logrado':'pendiente'}</span></header><form>${qs}<div class="xl-actions"><button class="xl-btn" type="submit">Validar respuestas</button><a class="xl-btn alt" href="${new URL(`Presentaciones/M${lab.session===1?'1':lab.session<=5?'2':lab.session<=9?'3':lab.session<=11?'4':lab.session<=14?'5':'6'}/sesion-${lab.session}${lab.session===1?'-diagnostico':lab.session===6?'-reglas-de-negocio':lab.session===9?'-ddl-supabase':lab.session===11?'-documentos-de-verdad':lab.session===15?'-desafio-final':'-cierre-dp900'}.html`, window.ANDES_LMS?.ROOT || location.href).href}">Abrir sesión ${lab.session}</a></div><div class="xl-feedback"></div></form></article>`;
  }

  root.innerHTML=LABS.map(card).join('');

  root.querySelectorAll('.xl-card').forEach(cardEl=>{
    const lab=LABS.find(x=>x.code===cardEl.dataset.lab);
    cardEl.querySelector('form').onsubmit=async e=>{
      e.preventDefault();
      let correct=0, answered=0;
      lab.questions.forEach((q,qi)=>{
        const picked=cardEl.querySelector(`input[name="${lab.code}-${qi}"]:checked`);
        const box=cardEl.querySelector(`[data-explain="${qi}"]`);
        if(!picked){box.textContent='Elige una opción.';box.className='xl-explain bad';return;}
        answered++;
        const ok=Number(picked.value)===q[2]; if(ok)correct++;
        box.textContent=(ok?'✓ ':'✗ ')+q[3]; box.className='xl-explain '+(ok?'ok':'bad');
      });
      const score=correct/lab.questions.length;
      const fb=cardEl.querySelector('.xl-feedback');
      await window.ANDES_LMS?.attempt(lab.code,{answered,correct,total:lab.questions.length,source:'learning-hub'},lab.session);
      if(score>=0.8){
        fb.className='xl-feedback ok';fb.innerHTML=`<b>✓ Reto logrado.</b> ${correct}/${lab.questions.length} correctas (${Math.round(score*100)}%).`;
        cardEl.querySelector('.xl-status').className='xl-status done';cardEl.querySelector('.xl-status').textContent='✓ logrado';
        await window.ANDES_LMS?.complete(lab.code,score,{correct,total:lab.questions.length,source:'learning-hub'},lab.session);
      }else{
        fb.className='xl-feedback bad';fb.innerHTML=`Aún no. ${correct}/${lab.questions.length} correctas. Revisa las explicaciones y vuelve a intentar.`;
        await window.ANDES_LMS?.fail(lab.code,{score,correct,total:lab.questions.length,source:'learning-hub'},lab.session);
      }
    };
  });
})();
