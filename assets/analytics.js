(() => {
  'use strict';

  const cfg = window.ANDES_PUBLIC_ANALYTICS_CONFIG || {};
  const id = String(cfg.ga4MeasurementId || '').trim();
  const VALID_ID = /^G-[A-Z0-9]+$/i.test(id);
  const MAX_TEXT = 100;
  const BLOCK_KEY = /email|mail|name|nombre|username|usuario|user_id|userid|phone|telefono|password|token|documento|answer|respuesta|sql|query|prompt|texto/i;
  const BLOCK_VALUE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\d[ -]*?){8,}\b)/i;

  const safeText = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, MAX_TEXT);
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

  const path = location.pathname;
  const isPresentation = /\/Presentaciones\/M\d+\/sesion-\d+/i.test(path);
  const isHome = /\/ANDESDB\/?(?:index\.html)?$/i.test(path);
  const moduleMatch = path.match(/\/Presentaciones\/(M\d+)\//i);
  const sessionMatch = path.match(/sesion-(\d+)/i);
  const moduleCode = moduleMatch ? moduleMatch[1].toUpperCase() : null;
  const sessionNumber = sessionMatch ? Number(sessionMatch[1]) : null;
  const safeLocation = () => location.origin + location.pathname;
  const safeReferrer = () => {
    if (!document.referrer) return '';
    try {
      const u = new URL(document.referrer);
      return u.origin + u.pathname;
    } catch { return ''; }
  };

  function event(name, params = {}) {
    if (!cfg.enabled || !VALID_ID || typeof window.gtag !== 'function') return false;
    const eventName = safeText(name).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (!/^[a-zA-Z]/.test(eventName)) return false;
    window.gtag('event', eventName, safeParams({ site_layer: 'public', ...params }));
    return true;
  }

  window.ANDES_PUBLIC_ANALYTICS = {
    event,
    enabled: () => !!(cfg.enabled && VALID_ID),
    measurementId: () => VALID_ID ? id : null
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
    page_location: safeLocation(),
    page_referrer: safeReferrer(),
    cookie_flags: 'SameSite=Lax;Secure'
  });

  if (cfg.sendPageViews !== false) {
    event('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      page_type: isPresentation ? 'public_presentation' : isHome ? 'public_home' : 'public_other'
    });
  }

  if (isHome) event('public_home_opened');

  if (cfg.trackOutboundLinks !== false) {
    document.addEventListener('click', ev => {
      const a = ev.target.closest?.('a[href]');
      if (!a) return;
      let u;
      try { u = new URL(a.href, location.href); } catch { return; }
      if (!/^https?:$/i.test(u.protocol)) return;
      if (u.origin !== location.origin) {
        event('outbound_click', { link_domain: u.hostname });
      } else if (/\/Presentaciones\/M\d+\/sesion-\d+/i.test(u.pathname)) {
        const sm = u.pathname.match(/sesion-(\d+)/i);
        event('presentation_link_click', { target_session_number: sm ? Number(sm[1]) : undefined });
      }
    }, { capture: true, passive: true });
  }

  if (!isPresentation || cfg.trackSlides === false) return;

  const slides = [...document.querySelectorAll('.slide')];
  const slideCount = slides.length;
  const indexOf = slide => Math.max(0, slides.indexOf(slide)) + 1;
  const titleOf = slide => safeText(slide?.dataset?.title || slide?.querySelector?.('h1,h2')?.textContent || `Diapositiva ${indexOf(slide)}`);
  let active = null;
  let activeSince = performance.now();
  let maxSlide = 0;
  let completedSent = false;
  const milestones = new Set();

  event('presentation_opened', {
    session_number: sessionNumber,
    module_code: moduleCode,
    slide_count: slideCount,
    presentation_title: document.title
  });

  function currentSlide() {
    return document.querySelector('.slide.active') || slides.find(s => getComputedStyle(s).display !== 'none') || slides[0] || null;
  }

  function flushSlide(reason = 'change') {
    if (!active) return;
    const seconds = Math.max(0, Math.min(1800, Math.round((performance.now() - activeSince) / 1000)));
    if (seconds > 0) {
      event('slide_engagement', {
        session_number: sessionNumber,
        module_code: moduleCode,
        slide_number: indexOf(active),
        slide_title: titleOf(active),
        slide_seconds: seconds,
        exit_reason: reason
      });
    }
    activeSince = performance.now();
  }

  function emitMilestones(n) {
    if (!slideCount) return;
    const pct = Math.min(100, Math.round((n / slideCount) * 100));
    for (const m of [25, 50, 75, 100]) {
      if (pct >= m && !milestones.has(m)) {
        milestones.add(m);
        event('presentation_progress', {
          session_number: sessionNumber,
          module_code: moduleCode,
          progress_percent: m,
          max_slide_number: n,
          slide_count: slideCount
        });
      }
    }
    if (pct >= 100 && !completedSent) {
      completedSent = true;
      event('presentation_completed', {
        session_number: sessionNumber,
        module_code: moduleCode,
        slide_count: slideCount
      });
    }
  }

  function enterSlide(slide, source = 'navigation') {
    if (!slide || slide === active) return;
    flushSlide('slide_change');
    active = slide;
    activeSince = performance.now();
    const n = indexOf(slide);
    maxSlide = Math.max(maxSlide, n);
    event('slide_viewed', {
      session_number: sessionNumber,
      module_code: moduleCode,
      slide_number: n,
      slide_title: titleOf(slide),
      slide_count: slideCount,
      navigation_source: source
    });
    emitMilestones(maxSlide);
  }

  active = currentSlide();
  if (active) {
    activeSince = performance.now();
    const n = indexOf(active);
    maxSlide = n;
    event('slide_viewed', {
      session_number: sessionNumber,
      module_code: moduleCode,
      slide_number: n,
      slide_title: titleOf(active),
      slide_count: slideCount,
      navigation_source: 'initial'
    });
    emitMilestones(maxSlide);
  }

  const observer = new MutationObserver(() => {
    const now = currentSlide();
    if (now && now !== active) enterSlide(now, 'deck');
  });
  observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSlide('hidden');
    else activeSince = performance.now();
  });

  document.addEventListener('fullscreenchange', () => {
    event('fullscreen_change', {
      session_number: sessionNumber,
      module_code: moduleCode,
      fullscreen: !!document.fullscreenElement
    });
  });

  addEventListener('pagehide', () => {
    flushSlide('pagehide');
    event('presentation_exit', {
      session_number: sessionNumber,
      module_code: moduleCode,
      max_slide_number: maxSlide,
      slide_count: slideCount,
      completion_percent: slideCount ? Math.round((maxSlide / slideCount) * 100) : 0
    });
  });
})();
