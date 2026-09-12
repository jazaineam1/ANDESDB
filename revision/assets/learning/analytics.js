(() => {
  'use strict';

  const cfg = window.ANDES_ANALYTICS_CONFIG || {};
  const id = String(cfg.ga4MeasurementId || '').trim();
  const VALID_ID = /^G-[A-Z0-9]+$/i.test(id);
  const MAX = 100;
  const STORE = 'andesdb.lms.auth.v1';
  const BLOCK_KEY = /email|mail|name|nombre|username|usuario|user_id|userid|phone|telefono|password|token|documento|answer|respuesta|sql|query|prompt|text|texto|error/i;
  const BLOCK_VALUE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\d[ -]*?){8,}\b)/i;
  const ALLOWED_META = new Set(['source','action','type','strategy','correct','score','model']);
  const MIRROR = new Map([
    ['challenge_attempt','practice_attempt'],
    ['challenge_failed','practice_failed'],
    ['hint_requested','hint_requested'],
    ['challenge_completed','practice_completed'],
    ['activity_started','activity_started'],
    ['activity_completed','activity_completed'],
    ['session_completed','session_completed'],
    ['lab_opened','lab_opened']
  ]);

  const safeText = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, MAX);
  const safePrimitive = value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = safeText(value);
      if (!v || BLOCK_VALUE.test(v)) return undefined;
      return v;
    }
    return undefined;
  };
  const safeParams = (params = {}) => {
    const out = {};
    for (const [key, value] of Object.entries(params || {})) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) || BLOCK_KEY.test(key)) continue;
      const v = safePrimitive(value);
      if (v !== undefined) out[key] = v;
    }
    return out;
  };
  const readAuth = () => {
    try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; }
  };
  const actorType = () => {
    if (cfg.collectActorType === false) return 'unknown';
    const role = String(readAuth()?.user?.role || '').toLowerCase();
    if (role === 'teacher' || role === 'admin') return 'teacher';
    if (role === 'student') return 'student';
    return 'anonymous';
  };
  const sessionNumber = () => {
    const q = Number(new URLSearchParams(location.search).get('session'));
    if (Number.isInteger(q) && q >= 1 && q <= 16) return q;
    const m = (location.pathname + ' ' + document.title).match(/sesion[-_\s]*(\d{1,2})/i);
    const n = m ? Number(m[1]) : null;
    return Number.isInteger(n) && n >= 1 && n <= 16 ? n : null;
  };
  const pageType = () => {
    const p = location.pathname.toLowerCase();
    if (p.endsWith('/portal.html')) return 'portal';
    if (p.endsWith('/learning-hub.html')) return 'course';
    if (p.endsWith('/lab.html')) return 'lab';
    if (p.includes('/presentaciones/')) return 'presentation';
    if (p.endsWith('/teacher-dashboard.html')) return 'teacher_dashboard';
    if (p.endsWith('/access.html')) return 'access_compat';
    if (p.endsWith('/index.html') || /\/revision\/?$/.test(p)) return 'revision_home';
    return 'other';
  };
  const safeLocation = () => location.origin + location.pathname;
  const safeReferrer = () => {
    if (!document.referrer) return '';
    try {
      const u = new URL(document.referrer);
      return u.origin + u.pathname;
    } catch { return ''; }
  };
  const context = () => {
    const out = {
      course_code: 'andesdb',
      page_type: pageType(),
      actor_type: actorType()
    };
    const s = sessionNumber();
    if (s) out.session_number = s;
    return out;
  };
  const practiceIndex = (activityCode, session) => {
    const code = String(activityCode || '');
    const m = code.match(/^s(\d+)-r(\d+)$/i);
    if (m) return Number(m[2]);
    if (session && code) return 10;
    return undefined;
  };

  function event(name, params = {}) {
    if (!cfg.enabled || !VALID_ID || typeof window.gtag !== 'function') return false;
    const eventName = safeText(name).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (!/^[a-zA-Z]/.test(eventName)) return false;
    window.gtag('event', eventName, safeParams({ ...context(), ...params }));
    return true;
  }

  window.ANDES_ANALYTICS = {
    event,
    enabled: () => !!(cfg.enabled && VALID_ID),
    measurementId: () => VALID_ID ? id : null,
    context
  };

  if (!cfg.enabled || !VALID_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  const loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  loader.referrerPolicy = 'strict-origin-when-cross-origin';
  document.head.appendChild(loader);

  window.gtag('js', new Date());
  window.gtag('config', id, {
    send_page_view: false,
    allow_google_signals: cfg.allowGoogleSignals === true,
    allow_ad_personalization_signals: cfg.allowAdPersonalization === true,
    ads_data_redaction: true,
    page_location: cfg.safePageLocation === false ? location.href : safeLocation(),
    page_referrer: safeReferrer(),
    cookie_flags: 'SameSite=Lax;Secure'
  });

  if (cfg.sendPageViews !== false) {
    event('page_view', {
      page_path: location.pathname,
      page_title: document.title
    });
  }

  const openedEvent = {
    portal: 'portal_opened',
    course: 'course_opened',
    lab: 'lab_opened',
    presentation: 'presentation_opened',
    teacher_dashboard: 'teacher_dashboard_opened'
  }[pageType()];
  if (openedEvent) event(openedEvent);

  function mirror(name, activityCode, metadata, session) {
    const gaName = MIRROR.get(name);
    if (!gaName) return;
    const params = {};
    const s = Number(session || sessionNumber() || 0);
    if (s >= 1 && s <= 16) params.session_number = s;
    const code = safePrimitive(activityCode);
    if (code !== undefined) params.activity_code = code;
    const idx = practiceIndex(activityCode, s || null);
    if (idx !== undefined) params.practice_number = idx;
    for (const key of ALLOWED_META) {
      if (metadata && Object.prototype.hasOwnProperty.call(metadata, key)) {
        const v = safePrimitive(metadata[key]);
        if (v !== undefined) params[key === 'type' ? 'practice_type' : key] = v;
      }
    }
    event(gaName, params);
  }

  function patchLms() {
    const api = window.ANDES_LMS;
    if (!api || api.__ga4Patched) return false;
    api.__ga4Patched = true;

    if (typeof api.attempt === 'function') {
      const original = api.attempt.bind(api);
      api.attempt = function (activityCode, metadata = {}, session = null) {
        mirror('challenge_attempt', activityCode, metadata, session);
        return original(activityCode, metadata, session);
      };
    }
    if (typeof api.hint === 'function') {
      const original = api.hint.bind(api);
      api.hint = function (activityCode, metadata = {}, session = null) {
        mirror('hint_requested', activityCode, metadata, session);
        return original(activityCode, metadata, session);
      };
    }
    if (typeof api.fail === 'function') {
      const original = api.fail.bind(api);
      api.fail = function (activityCode, metadata = {}, session = null) {
        mirror('challenge_failed', activityCode, metadata, session);
        return original(activityCode, metadata, session);
      };
    }
    if (typeof api.complete === 'function') {
      const original = api.complete.bind(api);
      api.complete = function (activityCode, score = 1, metadata = {}, session = null) {
        mirror('challenge_completed', activityCode, { ...metadata, score }, session);
        return original(activityCode, score, metadata, session);
      };
    }
    if (typeof api.track === 'function') {
      const original = api.track.bind(api);
      api.track = function (eventType, metadata = {}, overrides = {}) {
        if (MIRROR.has(eventType) && !['challenge_attempt','challenge_failed','hint_requested','challenge_completed'].includes(eventType)) {
          mirror(eventType, overrides.activity_code || null, metadata, overrides.session_number || null);
        }
        return original(eventType, metadata, overrides);
      };
    }
    return true;
  }

  if (cfg.mirrorLmsEvents !== false) {
    if (!patchLms()) {
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (patchLms() || tries >= 50) clearInterval(timer);
      }, 100);
    }
  }

  document.addEventListener('click', ev => {
    const a = ev.target.closest?.('a[href]');
    if (!a) return;
    let u;
    try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin || !u.pathname.includes('/ANDESDB/revision/')) return;
    let destination = 'other';
    const p = u.pathname.toLowerCase();
    if (p.endsWith('/learning-hub.html')) destination = 'course';
    else if (p.endsWith('/lab.html')) destination = 'lab';
    else if (p.includes('/presentaciones/')) destination = 'presentation';
    else if (p.endsWith('/portal.html')) destination = 'portal';
    else if (p.endsWith('/teacher-dashboard.html')) destination = 'teacher_dashboard';
    event('navigation_click', { destination_type: destination });
  }, { capture: true, passive: true });
})();
