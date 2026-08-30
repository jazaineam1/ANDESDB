/* ANDESDB · Vista docente del piloto. Todo contenido de estudiante se pinta
 * con textContent; no se interpreta HTML proveniente de estados/entregas.
 */
(function () {
  'use strict';

  var userLabel = document.getElementById('teacherUser');
  var cohortSelect = document.getElementById('cohortSelect');
  var tableBody = document.getElementById('progressBody');
  var message = document.getElementById('teacherMessage');
  var detail = document.getElementById('submissionDetail');
  var detailTitle = document.getElementById('submissionTitle');
  var detailMeta = document.getElementById('submissionMeta');
  var detailState = document.getElementById('submissionState');
  var logoutButton = document.getElementById('logoutButton');
  var cohorts = [];

  function text(node, value) { if (node) node.textContent = value; }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function td(value) {
    var cell = document.createElement('td');
    cell.textContent = value == null ? '' : String(value);
    return cell;
  }

  async function viewSubmission(row, cohortId) {
    detail.hidden = false;
    text(detailTitle, (row.display_name || row.student_id) + ' · ' + row.activity_title);
    text(detailMeta, 'Buscando última entrega…');
    text(detailState, '');
    try {
      var enrollment = await window.ANDESDBLMS.getEnrollmentForStudent(cohortId, row.student_id);
      if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
      var submission = await window.ANDESDBLMS.getTeacherSubmission(enrollment.id, row.activity_id, null);
      if (!submission) {
        text(detailMeta, 'El estudiante todavía no ha entregado esta actividad.');
        return;
      }
      text(detailMeta, 'Intento ' + submission.attempt_no + ' · ' + new Date(submission.submitted_at).toLocaleString());
      text(detailState, JSON.stringify(submission.state_snapshot, null, 2));
    } catch (_) {
      text(detailMeta, 'No fue posible consultar la entrega.');
    }
  }

  function renderRows(rows, cohortId) {
    clear(tableBody);
    if (!rows.length) {
      var tr0 = document.createElement('tr');
      var empty = td('No hay estudiantes activos o actividades para esta cohorte.');
      empty.colSpan = 7;
      tr0.appendChild(empty);
      tableBody.appendChild(tr0);
      return;
    }

    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.appendChild(td(row.display_name || row.student_id));
      tr.appendChild(td(row.activity_title));
      tr.appendChild(td((row.current_step || 0) + ' / 7'));
      tr.appendChild(td((row.percent || 0) + '%'));
      tr.appendChild(td(row.status || 'not_started'));
      tr.appendChild(td(row.submitted_attempts || 0));
      var action = document.createElement('td');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn secondary';
      button.textContent = 'Ver entrega';
      button.addEventListener('click', function () { viewSubmission(row, cohortId); });
      action.appendChild(button);
      tr.appendChild(action);
      tableBody.appendChild(tr);
    });
  }

  async function loadCohort() {
    var cohortId = cohortSelect.value;
    if (!cohortId) return;
    text(message, 'Cargando cohorte…');
    detail.hidden = true;
    try {
      var rows = await window.ANDESDBLMS.getTeacherProgress(cohortId);
      renderRows(rows, cohortId);
      text(message, rows.length + ' filas de progreso.');
    } catch (_) {
      clear(tableBody);
      text(message, 'No tienes acceso a esa cohorte o el servicio no está disponible.');
    }
  }

  async function init() {
    if (!window.ANDESDBAuth.isConfigured()) {
      text(message, 'El piloto aún no está conectado a Supabase.');
      return;
    }
    var session = await window.ANDESDBAuth.getSession();
    if (!session) {
      location.replace('./index.html');
      return;
    }
    var user = await window.ANDESDBAuth.getUser();
    text(userLabel, user && user.email ? user.email : 'Sesión docente');

    var role = await window.ANDESDBLMS.getOwnRole();
    if (role !== 'teacher' && role !== 'admin') {
      text(message, 'Tu cuenta no tiene rol docente para este piloto.');
      cohortSelect.disabled = true;
      return;
    }

    cohorts = await window.ANDESDBLMS.getAssignedCohorts();
    clear(cohortSelect);
    var first = document.createElement('option');
    first.value = '';
    first.textContent = 'Selecciona una cohorte';
    cohortSelect.appendChild(first);
    cohorts.forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.cohort_id;
      option.textContent = item.cohorts && item.cohorts.name ? item.cohorts.name : item.cohort_id;
      cohortSelect.appendChild(option);
    });
    text(message, cohorts.length ? 'Selecciona una cohorte.' : 'No tienes cohortes asignadas.');
  }

  cohortSelect.addEventListener('change', loadCohort);
  logoutButton.addEventListener('click', async function () {
    await window.ANDESDBAuth.signOut();
    location.replace('./index.html');
  });

  init().catch(function () { text(message, 'No se pudo inicializar la vista docente.'); });
})();
