(()=>{
'use strict';
const R=window.ANDES_READINGS;if(!R?.sessions)return;
const C={
1:[
 ['Dato, información y decisión','La clase parte de que un dato aislado no crea valor: necesita contexto, una pregunta y una decisión que pueda cambiar.'],
 ['Archivo, base de datos y SGBD','Se distinguen almacenamiento simple, colección organizada y el software que administra consultas, concurrencia, seguridad, recuperación e integridad.'],
 ['Formas del dato','Se reconocen datos estructurados, semiestructurados y no estructurados como formas distintas de representar información.'],
 ['Roles del ecosistema','Se ubican responsabilidades de analista, científico, ingeniero de datos, DBA y otros actores del flujo de datos.'],
 ['Preparación técnica','La sesión deja listo el entorno que se utilizará después: Beekeeper y la base dvdrental.']
],
2:[
 ['Del dato almacenado a la primera respuesta','La sesión retoma el almacenamiento de S1 y pregunta cómo obtener una respuesta sin alterar los datos.'],
 ['Tres formas del dato','Se vuelve sobre estructurado, semiestructurado y no estructurado para conectar la forma del dato con las familias de almacenamiento.'],
 ['Base de datos, SGBD y cliente','La base guarda estructura y contenido; el SGBD interpreta y administra; Beekeeper es el cliente desde el que enviamos instrucciones.'],
 ['Excel y bases de datos','Se comparan fortalezas y límites: exploración pequeña y rápida frente a concurrencia, reglas, seguridad, volumen y consultas reproducibles.'],
 ['Relacional y NoSQL','Se introduce por qué existen distintas familias y por qué la decisión depende del problema, no de escoger un “bando”.'],
 ['SQL y su arquitectura mínima','SQL se presenta como lenguaje declarativo; se ubica la cadena usuario → cliente → motor → base → resultado y se mencionan motores como SQLite, PostgreSQL, MySQL, SQL Server y Oracle.'],
 ['Explorar antes de consultar','Se abre dvdrental, se reconocen sus tablas y columnas y se trabaja con el diccionario para entender qué representa cada campo.'],
 ['Primeras consultas','Se practican SELECT/FROM, DISTINCT, COUNT, WHERE, AND/OR/NOT, ORDER BY y LIMIT con preguntas de negocio y un checkpoint independiente.']
],
3:[
 ['Recuperación de S2','La sesión comienza reconstruyendo consultas con ORDER BY, LIMIT y COUNT sin copiar el ejemplo anterior.'],
 ['Tipos, literales y NULL','Texto, enteros, decimales, fechas, booleanos y nulos determinan cómo se escribe una condición; NULL se trata con IS NULL y no con = NULL.'],
 ['BETWEEN, IN y LIKE','Se afinan filtros por rangos, listas y patrones; BETWEEN incluye extremos e LIKE usa % y _ en SQL.'],
 ['Diferencias de dialecto','Se muestra que SQLite y PostgreSQL no se comportan igual en todos los detalles, por ejemplo LIKE/ILIKE y algunas validaciones.'],
 ['Funciones de agregación','COUNT, SUM, AVG, MIN y MAX convierten muchas filas en medidas; COUNT(*) y COUNT(columna) no significan exactamente lo mismo cuando hay NULL.'],
 ['GROUP BY y la regla de oro','Agrupar cambia el grano. Cada columna seleccionada debe estar agrupada o agregada; SQLite puede aceptar consultas ambiguas que PostgreSQL rechaza.'],
 ['WHERE frente a HAVING','WHERE filtra filas antes de agrupar; HAVING filtra grupos después de calcular.'],
 ['Orden lógico de ejecución','Se razona FROM → WHERE → GROUP BY → HAVING → SELECT para explicar por qué cada filtro pertenece a una etapa distinta.']
],
4:[
 ['Combinar resultados compatibles','UNION y UNION ALL apilan resultados con estructura compatible; la diferencia está en conservar o eliminar duplicados.'],
 ['Relacionar tablas','INNER JOIN responde con coincidencias; LEFT JOIN conserva el lado izquierdo y hace visible la ausencia mediante NULL.'],
 ['RIGHT y FULL OUTER','Se reconocen variantes para conservar el lado derecho o ambos lados cuando el motor y el problema lo justifican.'],
 ['Claves y condición ON','Las relaciones se implementan comparando claves; un ON incorrecto puede producir combinaciones falsas aunque la consulta ejecute.'],
 ['Cardinalidad y multiplicación','Una relación 1:N o N:M cambia cuántas filas representa una entidad después del JOIN y puede inflar conteos o sumas.'],
 ['Validación del resultado','Antes y después de unir se revisan grano, filas, nulos y duplicación para comprobar que la consulta sigue respondiendo la pregunta.']
],
5:[
 ['Dibujar la salida antes del SQL','La sesión propone definir columnas y significado de una fila antes de escoger sintaxis.'],
 ['Nivel de agregación','Cada etapa debe declarar su grano para evitar mezclar hechos a niveles incompatibles.'],
 ['WITH y CTE','Las consultas complejas se dividen en tablas intermedias nombradas que pueden ejecutarse y validarse por separado.'],
 ['COUNT(DISTINCT)','Se diferencia contar filas de contar entidades cuando una entidad aparece varias veces.'],
 ['COALESCE y ausencia','Los NULL se tratan de forma explícita cuando el resultado necesita un valor de sustitución con significado conocido.'],
 ['CASE','Se introducen reglas condicionales dentro de una consulta para clasificar o transformar valores.'],
 ['Agregar antes de unir','Se muestra por qué resumir cada fuente al grano correcto antes del JOIN puede evitar multiplicaciones silenciosas.'],
 ['DISTINCT no repara un mal modelo','Quitar duplicados visibles no reemplaza entender por qué aparecieron.']
],
6:[
 ['De evidencia a regla','La clase distingue lo observado en datos de una afirmación normativa que el sistema debe cumplir.'],
 ['Certeza, hipótesis y fuente','Una regla necesita una fuente autorizada y un alcance; “nunca ocurrió” no significa “está prohibido”.'],
 ['Redacción verificable','Las reglas se expresan con vocabulario preciso, obligatoriedad y límites que luego puedan traducirse a modelo o restricción.'],
 ['Vocabulario de arquitectura','Se recuperan OLTP, OLAP, lago, bodega, ETL y ELT como conceptos transferibles, sin confundirlos con marcas de nube.'],
 ['Puente hacia el modelado','Las reglas confirmadas se convierten en insumo para entidades, relaciones, cardinalidades y restricciones de las siguientes sesiones.']
],
7:[
 ['Entidades desde las reglas','No todo sustantivo se convierte en tabla: se identifica qué conceptos necesitan identidad propia.'],
 ['Atributos y hechos','Se separan propiedades de entidades y datos que pertenecen a una relación o evento.'],
 ['Relaciones','Cada línea del modelo debe poder explicarse con una regla del negocio.'],
 ['Cardinalidad','Se trabajan 1:1, 1:N y N:M desde frases del caso Restaurante ABC.'],
 ['Opcionalidad','Se pregunta si una participación puede ser cero o debe existir, preparando NOT NULL y claves foráneas.'],
 ['Entidad asociativa','Las relaciones N:M se resuelven con una entidad que puede almacenar atributos propios de la asociación.']
],
8:[
 ['Completar el modelo','La sesión retoma entidades y relaciones para fijar atributos, identificadores y un modelo-base antes de normalizar.'],
 ['Dependencias funcionales','La normalización se razona preguntando de qué clave depende cada hecho.'],
 ['Primera forma normal','Se revisan grupos repetidos y valores que deben representarse de manera atómica en el modelo.'],
 ['Segunda forma normal','Con claves compuestas se detectan dependencias parciales respecto a solo una parte de la clave.'],
 ['Tercera forma normal','Se separan dependencias transitivas entre atributos no clave.'],
 ['Anomalías y reconstrucción','Cada descomposición debe explicar qué anomalía evita y demostrar que la información puede reconstruirse sin inventar hechos.']
],
9:[
 ['Del modelo a PostgreSQL','El Restaurante ABC se implementa en una base real de Supabase/PostgreSQL.'],
 ['Tipos de datos','Se eligen tipos compatibles con el significado y las operaciones esperadas de cada atributo.'],
 ['CREATE TABLE y claves','PRIMARY KEY identifica filas y FOREIGN KEY implementa referencias entre tablas.'],
 ['Restricciones','NOT NULL, UNIQUE y CHECK convierten reglas del modelo en garantías del motor.'],
 ['DML y cambios de estructura','INSERT, UPDATE, DELETE, DROP y ALTER se ubican dentro del ciclo de creación y prueba.'],
 ['Pruebas positivas y negativas','La evidencia no es que el SQL “corra”: también se intenta insertar estados inválidos para comprobar que la base los rechaza.']
],
10:[
 ['Problema antes que tecnología','La sesión parte de requisitos y no de una lista de motores.'],
 ['Patrón de acceso','Se pregunta cómo se lee y escribe el dato, qué consultas dominan y qué latencia importa.'],
 ['Consistencia y CAP','Se introduce el costo de distintas garantías cuando el sistema está distribuido.'],
 ['Familias NoSQL','Clave-valor, documentos, grafos y series de tiempo se relacionan con problemas distintos.'],
 ['Costo operativo','Escala, backups, observabilidad, seguridad y conocimiento del equipo cuentan tanto como el rendimiento.'],
 ['Arquitectura híbrida y fuente de verdad','Usar varias tecnologías puede ser válido si se define cuál sistema manda y cómo se sincronizan los demás.']
],
11:[
 ['Documento como unidad','Firestore y MongoDB permiten representar agregados con estructura flexible y datos anidados.'],
 ['Embeber frente a referenciar','La decisión depende de qué se consulta junto, qué cambia junto y cuánto puede crecer el documento.'],
 ['Firebase / Firestore','El carrito se lleva a un servicio real para observar colecciones, documentos, escrituras y consultas.'],
 ['MongoDB Atlas','La misma lógica documental se explora con otro servicio y su modelo de colecciones.'],
 ['Consultas y transformaciones','Se practican filtros, proyecciones y operaciones sobre documentos sin volver a pensar todo como JOIN relacional.'],
 ['Puente a Cosmos DB','Se separa el concepto documental del nombre del proveedor para preparar el vocabulario transferible de DP-900.']
],
12:[
 ['OLTP frente a analítica','Se explica por qué un modelo cómodo para registrar operaciones no es necesariamente el mejor para analizar historia.'],
 ['Data warehouse','Se define la bodega como sistema analítico integrado y orientado a consulta, no como sinónimo de “base grande”.'],
 ['Grano','Antes de diseñar una tabla de hechos se declara exactamente qué representa una fila.'],
 ['Hechos y dimensiones','Las medidas del proceso se separan del contexto descriptivo con el que se filtran y comparan.'],
 ['Esquema estrella','Se conecta una tabla de hechos con dimensiones y se explica qué pregunta facilita ese diseño.'],
 ['Batch y streaming','Se diferencian procesamiento por lotes y flujo continuo según latencia y naturaleza del proceso.'],
 ['Mapa de nube','Fabric, Databricks y equivalentes se nombran para reconocer servicios, manteniendo separado concepto de marca.']
],
13:[
 ['BigQuery real','La práctica lleva el razonamiento de rendimiento a un servicio analítico administrado.'],
 ['Partición','Los datos se dividen por una clave adecuada para reducir el volumen que ciertas consultas necesitan leer.'],
 ['Pruning','El motor evita particiones irrelevantes cuando el filtro permite descartarlas.'],
 ['Clusterización','El orden físico aproximado dentro de la tabla ayuda a reducir lectura para determinados filtros.'],
 ['Bytes procesados','El costo se hace observable: una consulta correcta también se evalúa por cuánto dato escanea.'],
 ['Diseño según patrón de consulta','No existe una partición o cluster universalmente “mejor”; debe justificarse desde las consultas reales.']
],
14:[
 ['Dato jerárquico','Se trabaja con estructuras anidadas donde una fila puede contener objetos o listas.'],
 ['RECORD / STRUCT','Un objeto anidado conserva campos relacionados sin aplanarlos artificialmente.'],
 ['ARRAY / REPEATED','Una lista permite varios elementos dentro de un mismo registro.'],
 ['Acceso a campos','Se navega la jerarquía con rutas de campos y se distingue acceder a un objeto de expandir una colección.'],
 ['UNNEST','Las listas se convierten en filas cuando la pregunta necesita trabajar elemento por elemento.'],
 ['Grano después de expandir','UNNEST cambia el significado de una fila y puede multiplicar registros; por eso se vuelve a declarar el grano.']
],
15:[
 ['Problema nuevo sin receta','La sesión integra el curso: primero se entiende la pregunta y luego se escogen modelo, consultas y validaciones.'],
 ['Descomposición','El problema se divide en fuentes, transformaciones y resultados verificables.'],
 ['Grano y relaciones','Se controla qué representa cada fila y qué ocurre al unir o expandir datos.'],
 ['Elección tecnológica','SQL, documentos, warehouse o cloud se justifican por requisitos, no por haber aparecido antes en el curso.'],
 ['Validación','Se exige evidencia reproducible: conteos, casos borde, restricciones y explicación del resultado.'],
 ['Comunicación','La solución debe poder defenderse frente a otra persona con supuestos explícitos y límites conocidos.']
],
16:[
 ['Concepto antes que marca','La sesión final reconoce el mismo razonamiento bajo vocabulario de Azure y otras plataformas.'],
 ['Relacional y NoSQL administrado','Se mapean cargas y modelos a familias de servicios sin confundir servicio con concepto.'],
 ['Analítica y warehouse','Se reconocen servicios para procesamiento, almacenamiento y consulta analítica.'],
 ['Batch y streaming','Se conectan patrones de ingesta/procesamiento con categorías de servicios cloud.'],
 ['DP-900','Se recupera el vocabulario del examen desde situaciones ya trabajadas durante el curso.'],
 ['Transferencia','La meta no es memorizar catálogos sino poder reconocer qué capacidad resuelve cada necesidad aunque cambie el proveedor.']
]};
for(const [n,topics] of Object.entries(C)){const s=R.sessions[Number(n)];if(!s)continue;s.classRecap=topics.map(([title,body])=>({title,body}));s.readingContract={class:'Este bloque recupera los conceptos trabajados en las diapositivas y actividades sin copiar la presentación.',extension:'Todo lo marcado como NUEVO / AMPLIACIÓN añade matices, límites o conexiones que no se desarrollaron completos en clase.'};}
R.version='7.0.0';
})();