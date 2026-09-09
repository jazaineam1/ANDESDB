/* Consultas de solo lectura. Usa la configuración pública de la app de clase.
   SDK modular aislado; no modifica las Rules ni la autenticación del carrito. */
(() => {
  "use strict";
  const pick = document.getElementById("consulta-carta");
  const button = document.getElementById("ejecutar-consulta");
  const status = document.getElementById("consulta-estado");
  const result = document.getElementById("consulta-resultado");
  const snippets = {
    base: 'const base = query(carta, where("plato_id", "in", [1, 8]));\nconst r = await getDocsFromServer(base);\nconsole.table(r.docs.map(d => d.data()));',
    horario: 'const q = query(carta, where("disponible_desde", "==", "06:00"));\nconst r = await getDocsFromServer(q);',
    barato: 'const q = query(carta, orderBy("precio_actual", "asc"), limit(1));\nconst r = await getDocsFromServer(q);',
    resumen: 'const base = query(carta, where("plato_id", "in", [1, 8]));\nconst r = await getAggregateFromServer(base, {\n  cantidad: count(), suma: sum("precio_actual"),\n  promedio: average("precio_actual")\n});\nconsole.log(r.data());',
    ajiaco: 'const base = query(carta, where("plato_id", "==", 1));\nconst r = await getAggregateFromServer(base, {\n  cantidad: count(), suma: sum("precio_actual"),\n  promedio: average("precio_actual")\n});'
  };
  const expected = {
    base: 'Esperado con el catálogo original: Ajiaco y Tamal, 2 documentos (sin orden garantizado).',
    horario: 'Esperado: Tamal. Un documento sin disponible_desde no coincide.',
    barato: 'Esperado en los 24 productos originales: Pan de bono, $5.000. No es la consulta sobre los dos platos base.',
    resumen: 'Esperado: cantidad 2, suma 50000, promedio 25000. Resume precios del catálogo, no ventas.',
    ajiaco: 'Esperado: cantidad 1, suma 28000 y promedio 28000. Al quedar un precio, suma y promedio coinciden.'
  };
  function show() {
    document.getElementById("consulta-codigo").textContent = snippets[pick.value];
    document.getElementById("consulta-prediccion").textContent = expected[pick.value];
    result.textContent = "";
    status.textContent = "Predice y pulsa Ejecutar. Si los datos cambiaron, el resultado real puede cambiar.";
  }
  let runtime;
  async function connect() {
    if (!window.firebase || !window.firebase.apps.length) throw new Error("Espera a que el carrito termine de conectar con Firebase.");
    const [apps, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);
    const app = apps.getApps().find(a => a.name === "consultas-s11") || apps.initializeApp(window.firebase.app().options, "consultas-s11");
    return { fs, db: fs.getFirestore(app) };
  }
  pick.addEventListener("change", show);
  button.addEventListener("click", async () => {
    button.disabled = true; pick.disabled = true;
    result.textContent = ""; status.textContent = "Consultando Firestore…";
    try {
      if (!runtime) runtime = await connect();
      const { fs, db } = runtime;
      const { collection, query, where, orderBy, limit, getDocsFromServer,
        getAggregateFromServer, count, sum, average } = fs;
      const carta = collection(db, "carta");
      const mode = pick.value;
      let q = query(carta, where("plato_id", "in", [1, 8]));
      if (mode === "horario") q = query(carta, where("disponible_desde", "==", "06:00"));
      if (mode === "barato") q = query(carta, orderBy("precio_actual", "asc"), limit(1));
      if (mode === "ajiaco") q = query(carta, where("plato_id", "==", 1));
      let data;
      if (mode === "resumen" || mode === "ajiaco") {
        data = (await getAggregateFromServer(q, {cantidad: count(), suma: sum("precio_actual"), promedio: average("precio_actual")})).data();
      } else {
        const snapshot = await getDocsFromServer(q);
        data = snapshot.docs.map(d => ({documento_id: d.id, ...d.data()}));
      }
      result.textContent = JSON.stringify(data, null, 2);
      status.textContent = "Respuesta del servidor. " + expected[mode] + " Si difiere, revisa campos numéricos, duplicados y cambios de catálogo.";
    } catch (e) {
      status.textContent = "No se obtuvo un resultado. " + (e.code || "Error") + ": " + e.message + " Si pide un índice, el docente debe prepararlo y esperar a que esté listo; no cambies Rules. Un fallo no significa cero documentos.";
    } finally { button.disabled = false; pick.disabled = false; }
  });
  show();
})();
