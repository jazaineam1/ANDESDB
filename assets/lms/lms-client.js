/* ANDESDB · Cliente académico del piloto.
 * La autorización real está en PostgreSQL/RLS/RPC. Este módulo no contiene
 * secretos ni toma decisiones de permiso en el navegador.
 */
(function () {
  'use strict';

  function cfg() {
    var c = window.ANDESDB_LMS_CONFIG || {};
    if (!c.enabled || !c.supabaseUrl || !c.supabasePublishableKey) {
      throw new Error('LMS_NOT_CONFIGURED');
    }
    return c;
  }

  async function apiFetch(path, options) {
    options = options || {};
    var c = cfg();
    var token = await window.ANDESDBAuth.getAccessToken();
    if (!token) {
      var authErr = new Error('AUTH_REQUIRED');
      authErr.status = 401;
      throw authErr;
    }

    var headers = {
      apikey: c.supabasePublishableKey,
      Authorization: 'Bearer ' + token,
      Accept: 'application/json'
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.prefer) headers.Prefer = options.prefer;

    var response = await fetch(c.supabaseUrl + '/rest/v1/' + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });

    var text = await response.text();
    var payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch (_) { payload = text; }
    }

    if (!response.ok) {
      var message = payload && typeof payload === 'object'
        ? (payload.message || payload.details || payload.hint || payload.code)
        : String(payload || 'Error del servicio académico.');
      var err = new Error(message || 'Error del servicio académico.');
      err.status = response.status;
      err.code = payload && typeof payload === 'object' ? payload.code : null;
      err.details = payload && typeof payload === 'object' ? payload.details : null;
      throw err;
    }
    return payload;
  }

  async function rpc(name, args) {
    return apiFetch('rpc/' + encodeURIComponent(name), {
      method: 'POST',
      body: args || {},
      prefer: 'return=representation'
    });
  }

  function firstRow(payload) {
    if (Array.isArray(payload)) return payload.length ? payload[0] : null;
    return payload || null;
  }

  async function getDashboard() {
    var rows = await rpc('get_my_dashboard', {});
    return Array.isArray(rows) ? rows : [];
  }

  async function getOwnRole() {
    var user = await window.ANDESDBAuth.getUser();
    if (!user || !user.id) return null;
    var path = 'user_roles?select=role&user_id=eq.' + encodeURIComponent(user.id) + '&limit=1';
    var rows = await apiFetch(path);
    return Array.isArray(rows) && rows[0] ? rows[0].role : null;
  }

  async function resolveActivityBySlug(slug, version) {
    var rows = await getDashboard();
    var found = rows.filter(function (row) {
      return row.activity_slug === slug && (version == null || Number(row.activity_version) === Number(version));
    });
    if (!found.length) return null;
    found.sort(function (a, b) { return Number(b.activity_version) - Number(a.activity_version); });
    return found[0];
  }

  async function loadActivityState(activityId) {
    var rows = await rpc('load_my_activity_state', { p_activity_id: activityId });
    return firstRow(rows);
  }

  async function saveActivityState(activityId, state, expectedRevision, currentStep) {
    var rows = await rpc('save_activity_state', {
      p_activity_id: activityId,
      p_state: state,
      p_expected_revision: expectedRevision == null ? null : Number(expectedRevision),
      p_current_step: Number(currentStep || 0)
    });
    return firstRow(rows);
  }

  async function submitActivity(activityId, expectedRevision) {
    var rows = await rpc('submit_activity', {
      p_activity_id: activityId,
      p_expected_revision: Number(expectedRevision)
    });
    return firstRow(rows);
  }

  async function getAssignedCohorts() {
    var user = await window.ANDESDBAuth.getUser();
    if (!user || !user.id) return [];
    var path = 'teacher_cohorts?select=cohort_id,cohorts(id,name,slug)&teacher_id=eq.' + encodeURIComponent(user.id);
    var rows = await apiFetch(path);
    return Array.isArray(rows) ? rows : [];
  }

  async function getTeacherProgress(cohortId) {
    var rows = await rpc('get_teacher_cohort_progress', { p_cohort_id: cohortId });
    return Array.isArray(rows) ? rows : [];
  }

  async function getEnrollmentForStudent(cohortId, studentId) {
    var path = 'enrollments?select=id,user_id,cohort_id,status&cohort_id=eq.' + encodeURIComponent(cohortId) +
      '&user_id=eq.' + encodeURIComponent(studentId) + '&limit=1';
    var rows = await apiFetch(path);
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function getTeacherSubmission(enrollmentId, activityId, attemptNo) {
    var rows = await rpc('get_teacher_submission', {
      p_enrollment_id: enrollmentId,
      p_activity_id: activityId,
      p_attempt_no: attemptNo == null ? null : Number(attemptNo)
    });
    return firstRow(rows);
  }

  function isRevisionConflict(err) {
    return !!err && (err.code === '40001' || /revision conflict/i.test(err.message || ''));
  }

  window.ANDESDBLMS = Object.freeze({
    apiFetch: apiFetch,
    rpc: rpc,
    getDashboard: getDashboard,
    getOwnRole: getOwnRole,
    resolveActivityBySlug: resolveActivityBySlug,
    loadActivityState: loadActivityState,
    saveActivityState: saveActivityState,
    submitActivity: submitActivity,
    getAssignedCohorts: getAssignedCohorts,
    getTeacherProgress: getTeacherProgress,
    getEnrollmentForStudent: getEnrollmentForStudent,
    getTeacherSubmission: getTeacherSubmission,
    isRevisionConflict: isRevisionConflict
  });
})();
