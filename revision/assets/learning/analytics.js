(() => {
  'use strict';
  if (window.__ANDES_GA4_LMS_V5__) return;
  window.__ANDES_GA4_LMS_V5__ = true;

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
    if (p.endsWith('/reading.html')) return 'reading';
    if (p.endsWith('/calendar.html')) return 'calendar';
    if (p.endsWith('/assignment.html')) return 'assignment';
    if (p.endsWith('/capstone.html')) return 'capstone';
    if (p.includes('/presentaciones/')) return 'presentation';
    if (p.endsWith('/teacher-dashboard.html')) return 'teacher_dashboard';
    if (p.endsWith('/verify.html')) return 'certificate_verify';
    if (p.endsWith('/access.html')) return 'access';
    if (p.endsWith('/index.html') || /\/revision\/?$/.test(p)) return 'revision_home';
    return 'other';
  };
  const safePagePath = () => {
    const s = sessionNumber();
    const type = pageType();
    if (s && ['lab','reading'].includes(type)) return `${location.pathname}?session=${s}`;
    return location.pathname;
  };
  const safeLocation = () => location.origin + safePagePath();
  const safeReferrer = () => {
    if (!document.referrer) return '';
    try {
      const u = new URL(document.referrer);
      return u.origin + u.pathname;
    } catch { return ''; }
  };
  const contentKey = () => {
    const type = pageType();
    const s = sessionNumber();
    if (s && ['lab','reading','presentation'].includes(type)) return `${type}_s${s}`;
    return type;
  };
  const theme = () => document.documentElement.dataset.andesTheme || (matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light');
  const context = () => {
    const out = {
      course_code: 'andesdb',
      page_type: pageType(),
      content_key: contentKey(),
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
    context,
    safePagePath
  };

  if (!cfg.enabled || !VALID_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${CSS.escape(id)}"]`)) {
    const loader = document.createElement('script');
    loader.async = true;
    loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    loader.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(loader);
  }

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
      page_path: safePagePath(),
      page_title: document.title
    });
  }

  event('content_view', {
    content_kind: pageType(),
    current_theme: theme()
  });

  const openedEvent = {
    portal: 'portal_opened',
    course: 'course_opened',
    lab: 'lab_opened',
    reading: 'reading_opened',
    calendar: 'calendar_opened',
    assignment: 'assignment_opened',
    capstone: 'capstone_opened',
    presentation: 'presentation_opened',
    teacher_dashboard: 'teacher_dashboard_opened',
    certificate_verify: 'certificate_verify_opened',
    access: 'access_opened'
  }[pageType()];
  if (openedEvent) event(openedEvent);

  // Profundidad de lectura: hitos una sola vez por carga de página.
  const scrollMilestones = new Set();
  let scrollQueued = false;
  function measureScroll() {
    scrollQueued = false;
    const root = document.documentElement;
    const max = Math.max(0, root.scrollHeight - innerHeight);
    if (max <= 40) return;
    const pct = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
    for (const mark of [25, 50, 75, 90]) {
      if (pct >= mark && !scrollMilestones.has(mark)) {
        scrollMilestones.add(mark);
        event('scroll_depth', { depth_percent: mark });
      }
    }
  }
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(measureScroll);
  }, { passive: true });

  // Tiempo activo: solo suma mientras la pestaña está visible.
  let visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
  let activeMs = 0;
  const timeMilestones = new Set();
  function activeSeconds() {
    const running = visibleSince == null ? 0 : performance.now() - visibleSince;
    return Math.floor((activeMs + running) / 1000);
  }
  function emitTimeMilestones() {
    const seconds = activeSeconds();
    for (const mark of [30, 120, 300, 600]) {
      if (seconds >= mark && !timeMilestones.has(mark)) {
        timeMilestones.add(mark);
        event('engaged_time_milestone', { engaged_seconds: mark });
      }
    }
  }
  const engagementTimer = setInterval(emitTimeMilestones, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && visibleSince != null) {
      activeMs += performance.now() - visibleSince;
      visibleSince = null;
      emitTimeMilestones();
    } else if (document.visibilityState === 'visible' && visibleSince == null) {
      visibleSince = performance.now();
    }
  });
  addEventListener('pagehide', () => {
    emitTimeMilestones();
    clearInterval(engagementTimer);
  });

  addEventListener('andesdb:theme-changed', ev => {
    if (!ev?.detail?.theme) return;
    event('theme_changed', { current_theme: ev.detail.theme });
  });

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
    if (!/^https?:$/i.test(u.protocol)) return;
    if (u.origin !== location.origin) {
      event('outbound_click', {
        link_domain: u.hostname,
        link_purpose: /zoom\.us$/i.test(u.hostname) ? 'class_meeting' : 'external_resource'
      });
      return;
    }
    if (!u.pathname.includes('/ANDESDB/revision/')) return;
    let destination = 'other';
    const p = u.pathname.toLowerCase();
    if (p.endsWith('/learning-hub.html')) destination = 'course';
    else if (p.endsWith('/lab.html')) destination = 'lab';
    else if (p.endsWith('/reading.html')) destination = 'reading';
    else if (p.includes('/presentaciones/')) destination = 'presentation';
    else if (p.endsWith('/portal.html')) destination = 'portal';
    else if (p.endsWith('/teacher-dashboard.html')) destination = 'teacher_dashboard';
    const targetSession = Number(u.searchParams.get('session') || (u.pathname.match(/sesion-(\d+)/i) || [])[1] || 0);
    event('navigation_click', {
      destination_type: destination,
      target_session_number: targetSession >= 1 && targetSession <= 16 ? targetSession : undefined
    });
  }, { capture: true, passive: true });
})();
