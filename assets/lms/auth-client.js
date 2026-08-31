/* ANDESDB · Auth mínimo para el piloto LMS.
 * Sin dependencias externas. La sesión vive en sessionStorage; el estado
 * académico vive en PostgreSQL. Nunca registrar access_token/refresh_token.
 */
(function () {
  'use strict';

  function cfg() {
    var c = window.ANDESDB_LMS_CONFIG || {};
    if (!c.enabled) throw new Error('LMS_DISABLED');
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(c.supabaseUrl || '')) {
      throw new Error('LMS_BAD_SUPABASE_URL');
    }
    var key = String(c.supabasePublishableKey || '');
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
      throw new Error('LMS_BAD_PUBLISHABLE_KEY');
    }
    if (/service[_-]?role|sb_secret_/i.test(key)) {
      throw new Error('LMS_PRIVILEGED_KEY_FORBIDDEN');
    }
    return c;
  }

  function storageKey() {
    return (window.ANDESDB_LMS_CONFIG && window.ANDESDB_LMS_CONFIG.sessionStorageKey) || 'andesdb:lms:session:v1';
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function readSessionRaw() {
    try {
      var raw = sessionStorage.getItem(storageKey());
      if (!raw) return null;
      var value = JSON.parse(raw);
      if (!value || typeof value !== 'object') return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function saveSession(value) {
    if (!value || !value.access_token || !value.refresh_token) {
      throw new Error('LMS_INVALID_SESSION');
    }
    var expiresAt = Number(value.expires_at || 0);
    if (!expiresAt && value.expires_in) {
      expiresAt = Math.floor(Date.now() / 1000) + Number(value.expires_in);
    }
    var safe = {
      access_token: value.access_token,
      refresh_token: value.refresh_token,
      expires_at: expiresAt,
      token_type: value.token_type || 'bearer',
      user: value.user ? {
        id: value.user.id,
        email: value.user.email || null
      } : null
    };
    sessionStorage.setItem(storageKey(), JSON.stringify(safe));
    return safe;
  }

  function clearSession() {
    try { sessionStorage.removeItem(storageKey()); } catch (_) {}
  }

  async function authFetch(path, options) {
    options = options || {};
    var c = cfg();
    var headers = {
      apikey: c.supabasePublishableKey,
      'Content-Type': 'application/json'
    };
    if (options.accessToken) {
      headers.Authorization = 'Bearer ' + options.accessToken;
    }

    var response = await fetch(c.supabaseUrl + '/auth/v1' + path, {
      method: options.method || 'POST',
      headers: headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });

    var payload = null;
    var text = await response.text();
    if (text) {
      try { payload = JSON.parse(text); } catch (_) { payload = { message: 'Respuesta inválida del servidor de identidad.' }; }
    }

    if (!response.ok) {
      var err = new Error((payload && (payload.msg || payload.message || payload.error_description)) || 'Error de autenticación.');
      err.status = response.status;
      err.code = payload && (payload.error_code || payload.code || payload.error);
      throw err;
    }
    return payload;
  }

  async function requestOtp(email) {
    var clean = normalizeEmail(email);
    if (!/^\S+@\S+\.\S+$/.test(clean)) throw new Error('EMAIL_INVALID');
    await authFetch('/otp', {
      body: {
        email: clean,
        create_user: false
      }
    });
    // Mensaje deliberadamente genérico para no confirmar si una cuenta existe.
    return { ok: true, email: clean };
  }

  async function verifyOtp(email, token) {
    var clean = normalizeEmail(email);
    var code = String(token || '').trim();
    if (!/^\d{6,10}$/.test(code)) throw new Error('OTP_INVALID');
    var data = await authFetch('/verify', {
      body: {
        email: clean,
        token: code,
        type: 'email'
      }
    });
    return saveSession(data);
  }

  async function refreshSession(session) {
    session = session || readSessionRaw();
    if (!session || !session.refresh_token) return null;
    try {
      var data = await authFetch('/token?grant_type=refresh_token', {
        body: { refresh_token: session.refresh_token }
      });
      return saveSession(data);
    } catch (err) {
      clearSession();
      throw err;
    }
  }

  async function getSession() {
    var session = readSessionRaw();
    if (!session) return null;
    var now = Math.floor(Date.now() / 1000);
    if (!session.expires_at || session.expires_at <= now + 60) {
      session = await refreshSession(session);
    }
    return session;
  }

  async function getAccessToken() {
    var session = await getSession();
    return session ? session.access_token : null;
  }

  async function getUser() {
    var session = await getSession();
    if (!session) return null;
    var data = await authFetch('/user', {
      method: 'GET',
      accessToken: session.access_token
    });
    if (data && data.id) {
      session.user = { id: data.id, email: data.email || null };
      sessionStorage.setItem(storageKey(), JSON.stringify(session));
    }
    return data;
  }

  async function signOut() {
    var session = readSessionRaw();
    try {
      if (session && session.access_token) {
        await authFetch('/logout', {
          accessToken: session.access_token,
          body: {}
        });
      }
    } finally {
      clearSession();
    }
  }

  function isConfigured() {
    try { cfg(); return true; } catch (_) { return false; }
  }

  window.ANDESDBAuth = Object.freeze({
    isConfigured: isConfigured,
    requestOtp: requestOtp,
    verifyOtp: verifyOtp,
    getSession: getSession,
    getAccessToken: getAccessToken,
    getUser: getUser,
    signOut: signOut,
    clearSession: clearSession
  });
})();
