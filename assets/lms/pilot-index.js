/* ANDESDB · Portal del piloto LMS */
(function () {
  'use strict';

  var loginCard = document.getElementById('loginCard');
  var dashboardCard = document.getElementById('dashboardCard');
  var configCard = document.getElementById('configCard');
  var emailInput = document.getElementById('email');
  var otpInput = document.getElementById('otp');
  var requestButton = document.getElementById('requestOtp');
  var verifyButton = document.getElementById('verifyOtp');
  var authMessage = document.getElementById('authMessage');
  var userLabel = document.getElementById('userLabel');
  var activityList = document.getElementById('activityList');
  var logoutButton = document.getElementById('logoutButton');
  var teacherLink = document.getElementById('teacherLink');
  var pendingEmail = '';

  function show(node, yes) { if (node) node.hidden = !yes; }
  function text(node, value) { if (node) node.textContent = value; }

  function clearChildren(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function progressCard(row) {
    var card = document.createElement('article');
    card.className = 'card';

    var title = document.createElement('h3');
    title.textContent = row.activity_title;
    card.appendChild(title);

    var percent = Math.max(0, Math.min(100, Number(row.percent || 0)));
    var meta = document.createElement('p');
    meta.className = 'muted';
    meta.textContent = 'Paso ' + Number(row.current_step || 0) + ' de ' + Number(row.max_step || 0) +
      ' · ' + percent + '%';
    card.appendChild(meta);

    var meter = document.createElement('progress');
    meter.className = 'meter';
    meter.max = 100;
    meter.value = percent;
    meter.setAttribute('aria-label', 'Avance ' + percent + '%');
    card.appendChild(meter);

    var actions = document.createElement('div');
    actions.className = 'row actions';

    if (row.activity_slug === window.ANDESDB_LMS_CONFIG.s7ActivitySlug) {
      var link = document.createElement('a');
      link.className = 'btn primary';
      link.href = './s7.html';
      link.textContent = Number(row.current_step || 0) > 0 ? 'Continuar donde quedé' : 'Comenzar';
      actions.appendChild(link);
    }

    var attempts = document.createElement('span');
    attempts.className = 'muted';
    attempts.textContent = 'Entregas: ' + Number(row.submitted_attempts || 0);
    actions.appendChild(attempts);
    card.appendChild(actions);
    return card;
  }

  async function loadDashboard() {
    var session = await window.ANDESDBAuth.getSession();
    if (!session) {
      show(loginCard, true);
      show(dashboardCard, false);
      return;
    }

    var user = await window.ANDESDBAuth.getUser();
    var rows = await window.ANDESDBLMS.getDashboard();
    text(userLabel, user && user.email ? user.email : 'Sesión activa');

    clearChildren(activityList);
    if (!rows.length) {
      var note = document.createElement('div');
      note.className = 'notice warn';
      note.textContent = 'Tu cuenta está autenticada, pero no tiene una matrícula activa en el piloto.';
      activityList.appendChild(note);
    } else {
      rows.forEach(function (row) { activityList.appendChild(progressCard(row)); });
    }

    var role = await window.ANDESDBLMS.getOwnRole();
    show(teacherLink, role === 'teacher' || role === 'admin');
    show(loginCard, false);
    show(dashboardCard, true);
  }

  async function requestOtp() {
    pendingEmail = String(emailInput.value || '').trim().toLowerCase();
    requestButton.disabled = true;
    text(authMessage, 'Solicitando código…');
    try {
      await window.ANDESDBAuth.requestOtp(pendingEmail);
      text(authMessage, 'Si la cuenta pertenece al piloto, recibirás un código. Revísalo e ingrésalo aquí.');
      otpInput.disabled = false;
      verifyButton.disabled = false;
      otpInput.focus();
    } catch (_) {
      // Mismo mensaje para evitar enumeración de cuentas.
      text(authMessage, 'Si la cuenta pertenece al piloto, recibirás un código. Revísalo e ingrésalo aquí.');
    } finally {
      requestButton.disabled = false;
    }
  }

  async function verifyOtp() {
    var email = pendingEmail || String(emailInput.value || '').trim().toLowerCase();
    verifyButton.disabled = true;
    text(authMessage, 'Verificando…');
    try {
      await window.ANDESDBAuth.verifyOtp(email, otpInput.value);
      otpInput.value = '';
      await loadDashboard();
    } catch (_) {
      text(authMessage, 'El código no es válido o ya venció. Solicita uno nuevo.');
      verifyButton.disabled = false;
    }
  }

  if (requestButton) requestButton.addEventListener('click', requestOtp);
  if (verifyButton) verifyButton.addEventListener('click', verifyOtp);
  if (logoutButton) logoutButton.addEventListener('click', async function () {
    await window.ANDESDBAuth.signOut();
    location.reload();
  });

  (async function init() {
    if (!window.ANDESDBAuth.isConfigured()) {
      show(configCard, true);
      show(loginCard, false);
      show(dashboardCard, false);
      return;
    }
    show(configCard, false);
    await loadDashboard();
  })().catch(function () {
    text(authMessage, 'No se pudo conectar con el piloto. Intenta nuevamente.');
    show(loginCard, true);
    show(dashboardCard, false);
  });
})();
