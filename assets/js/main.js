document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const body = document.body;
  const editorialAutoplayRevision = '2026-03-31-r7';
  root.dataset.editorialAutoplayRevision = editorialAutoplayRevision;
  root.classList.add('js-ready');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = reducedMotionQuery.matches;
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const progressBar = document.querySelector('.scroll-progress');
  const siteAtmosphere = document.querySelector('.site-atmosphere');
  const vantaTarget = document.querySelector('#vanta-bg');
  const loader = document.querySelector('[data-site-loader]');
  const loaderStatus = document.querySelector('[data-loader-status]');
  const scriptTag = document.querySelector('script[src*="assets/js/main.js"]');
  const assetBase = scriptTag
    ? scriptTag.src.replace(/assets\/js\/main\.js(?:\?.*)?$/, 'assets/')
    : `${window.location.origin}/assets/`;
  const routeLoaderKey = 'portfolio-route-loader';
  const firstVisitKey = 'portfolio-first-visit-complete';
  const soundConfig = {
    hover: { path: 'sounds/Card-slide.wav', volume: 0.045, playbackRate: 1.02 },
    button: { path: 'sounds/Click-Button.wav', volume: 0.24, playbackRate: 1 },
    link: { path: 'sounds/Click-Link.wav', volume: 0.12, playbackRate: 1 },
    cue: { path: 'sounds/Card-slide.wav', volume: 0.055, playbackRate: 0.9 },
    reveal: { path: 'sounds/Card-slide.wav', volume: 0.065, playbackRate: 0.96 },
    flip: { path: 'sounds/Card-slide.wav', volume: 0.075, playbackRate: 1.05 },
    loaderEnd: { path: 'sounds/End-Loading.wav', volume: 0.22, playbackRate: 1 },
    footer: { path: 'sounds/Reveal-Footer.wav', volume: 0.08, playbackRate: 1 }
  };
  const preloadedSounds = new Map();
  const sceneControllers = [];
  const carouselControllers = [];
  const revealObservers = [];
  const pendingRevealElements = new Set();
  const scrollBlockKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Space', 'Spacebar']);
  let revealObserver = null;
  const scrollLockState = {
    locked: false,
    timer: 0,
    wheelHandler: null,
    touchHandler: null,
    keyHandler: null,
    bodyPaddingRight: ''
  };
  const currentDeviceMemory = Number(window.navigator.deviceMemory || 0);
  const currentConcurrency = Number(window.navigator.hardwareConcurrency || 0);
  const hardLowPower = (currentDeviceMemory > 0 && currentDeviceMemory <= 2)
    || (currentConcurrency > 0 && currentConcurrency <= 2);
  const lowPower = hardLowPower || window.innerWidth < 768;
  const routeLoaderEnabled = !lowPower;
  const loaderDurations = {
    first: lowPower ? 1200 : 2600,
    route: lowPower ? 280 : 520
  };
  const hasImmersiveMount = false;
  const canUseSceneDepth = finePointer && !prefersReducedMotion && !hardLowPower && window.innerWidth >= 1024;
  const canUseAtmosphereMotion = !prefersReducedMotion && window.innerWidth >= 900;
  const canUseImmersiveStage = false;
  const atmosphereState = {
    pointerX: 0,
    pointerY: 0,
    currentX: 0,
    currentY: 0,
    scroll: 0,
    currentScroll: 0,
    frame: 0
  };
  let layoutFrame = 0;
  let vantaResizeTimer = 0;
  let vantaEffect = null;
  let lastSceneCueAt = 0;
  let soundsEnabled = true;
  let immersiveExperienceLoaded = false;
  let immersiveExperiencePending = false;
  let editorialVisibilityBound = false;

  Object.keys(soundConfig).forEach((key) => {
    soundConfig[key].url = new URL(soundConfig[key].path, assetBase).toString();
  });

  if (lowPower) {
    root.classList.add('is-low-power');
  }

  const loaderDone = initLoaders();

  markCurrentRoute();
  initMenu();
  initSound();
  if (!lowPower) {
    queueIdleTask(() => {
      initSemanticHighlights();
    }, 420);
  }
  initShellFirstPaint();
  initLinkTransitions();
  initMedia();
  initRevealSystem();
  initScrollPacing();
  try {
    initEditorialSwipers();
  } catch (error) {
    console.error('Editorial swiper initialization failed.', error);
  }
  initScenes();
  initAtmosphere();
  scheduleLayoutUpdate();
  if (!hasImmersiveMount) {
    initVanta();
  }

  window.addEventListener('scroll', scheduleLayoutUpdate, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('load', () => {
    if (!hasImmersiveMount) {
      initVanta();
      refreshVanta();
    }
  }, { once: true });

  loaderDone.then(() => {
    if (hasImmersiveMount) {
      maybeLoadImmersiveExperience();
      window.setTimeout(() => {
        initVanta();
        refreshVanta();
      }, 1200);
      return;
    }

    refreshVanta();
  });

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', () => {
      destroyVanta();
    });
  }

  function markCurrentRoute() {
    const normalizePath = (value) => value.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('.site-nav a').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href).pathname);

      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initLoaders() {
    if (!loader) {
      return Promise.resolve();
    }

    const initialMode = root.dataset.loaderMode || '';
    const initialStart = Number(root.dataset.loaderStart || Date.now());
    let duration = 0;

    if (initialMode === 'first') {
      duration = Math.max(0, loaderDurations.first - (Date.now() - initialStart));
    } else if (initialMode === 'route') {
      if (!routeLoaderEnabled) {
        duration = 0;
      } else {
        const pendingRoute = readRouteLoader();
        duration = pendingRoute ? Math.max(0, pendingRoute.expires - Date.now()) : 0;
      }
    }

    if (!duration) {
      try {
        if (initialMode === 'route') {
          window.sessionStorage.removeItem(routeLoaderKey);
        }
      } catch (error) {
        // Storage access is optional.
      }

      loader.classList.remove('is-active');
      loader.setAttribute('aria-hidden', 'true');
      root.classList.remove('is-loader-active');
      body.classList.remove('is-loader-active');
      return Promise.resolve();
    }

    activateLoader(initialMode || 'route');

    return new Promise((resolve) => {
      window.setTimeout(() => {
        deactivateLoader();

        try {
          if (initialMode === 'first') {
            window.localStorage.setItem(firstVisitKey, 'complete');
          }

          if (initialMode === 'route') {
            window.sessionStorage.removeItem(routeLoaderKey);
          }
        } catch (error) {
          // Storage access is optional.
        }

        delete root.dataset.loaderMode;
        delete root.dataset.loaderStart;
        resolve();
      }, duration);
    });
  }

  function activateLoader(mode) {
    if (!loader) {
      return;
    }

    const copy = {
      first: 'Loading immersive workspace',
      route: 'Transitioning to next scene'
    };

    root.classList.add('is-loader-active');
    body.classList.add('is-loader-active');
    loader.classList.add('is-active');
    loader.classList.remove('is-exiting');
    loader.dataset.mode = mode;
    loader.setAttribute('aria-hidden', 'false');

    if (loaderStatus) {
      loaderStatus.textContent = copy[mode] || 'Loading interface layers';
    }
  }

  function deactivateLoader() {
    if (!loader) {
      return;
    }

    playSound('loaderEnd', { force: true });
    loader.classList.add('is-exiting');
    window.setTimeout(() => {
      root.classList.remove('is-loader-active');
      body.classList.remove('is-loader-active');
      root.classList.remove('is-route-loading');
      loader.classList.remove('is-active', 'is-exiting');
      loader.setAttribute('aria-hidden', 'true');
      delete loader.dataset.mode;
    }, 420);
  }

  function initLinkTransitions() {
    if (!routeLoaderEnabled) {
      return;
    }

    document.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!shouldHandleRouteTransition(link, event)) {
          return;
        }

        const targetUrl = new URL(link.href, window.location.href);
        const pendingRoute = {
          startedAt: Date.now(),
          expires: Date.now() + loaderDurations.route,
          target: `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
        };

        try {
          window.sessionStorage.setItem(routeLoaderKey, JSON.stringify(pendingRoute));
        } catch (error) {
          // Storage access is optional.
        }

        event.preventDefault();
        activateLoader('route');
        root.classList.add('is-route-loading');

        window.setTimeout(() => {
          window.location.href = targetUrl.href;
        }, 80);
      });
    });
  }

  function shouldHandleRouteTransition(link, event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    if (link.target && link.target !== '_self') {
      return false;
    }

    if (link.hasAttribute('download')) {
      return false;
    }

    const href = link.getAttribute('href') || '';

    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }

    const targetUrl = new URL(link.href, window.location.href);

    if (targetUrl.origin !== window.location.origin) {
      return false;
    }

    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
      return false;
    }

    return true;
  }

  function readRouteLoader() {
    try {
      const raw = window.sessionStorage.getItem(routeLoaderKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function initMenu() {
    if (!menuToggle || !nav) {
      return;
    }

    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initSound() {
    primeAudio();
    preloadSoundAssets();

    const hoverTargets = document.querySelectorAll('.frame-panel, .project-card, .news-item, .repo-group, .timeline-item, .project-showcase');
    const buttonTargets = document.querySelectorAll('.btn, .menu-toggle');
    const linkTargets = document.querySelectorAll('.text-link, .site-nav a, .brand, .contact-list a');

    hoverTargets.forEach((element) => {
      let lastHoverAt = 0;

      if (!supportsHover) {
        return;
      }

      element.addEventListener('pointerenter', () => {
        const now = Date.now();

        if (now - lastHoverAt < 160) {
          return;
        }

        lastHoverAt = now;
        playSound('hover');
      });
    });

    buttonTargets.forEach((element) => {
      element.addEventListener('click', () => {
        playSound('button');
      });
    });

    linkTargets.forEach((element) => {
      element.addEventListener('click', () => {
        playSound('link');
      });
    });

    const sceneObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const cueName = entry.target.getAttribute('data-sound-scene') || 'reveal';
        const now = Date.now();

        if (now - lastSceneCueAt > 1800) {
          lastSceneCueAt = now;
          playSound(cueName);
        }

        observer.unobserve(entry.target);
      });
    }, { threshold: 0.66 });

    document.querySelectorAll('[data-sound-scene]').forEach((scene) => {
      sceneObserver.observe(scene);
    });

    const footer = document.querySelector('.site-footer');
    if (footer) {
      const footerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          playSound('footer');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });

      footerObserver.observe(footer);
    }
  }

  async function initSemanticHighlights() {
    const semanticMapUrl = new URL('data/portfolio_word_color_map.md', assetBase).toString();

    try {
      const response = await fetch(semanticMapUrl, { cache: 'force-cache' });

      if (!response.ok) {
        return;
      }

      const markdown = await response.text();
      const semanticMap = parseSemanticColorMap(markdown);

      if (!semanticMap.rules.length || !semanticMap.tokens.length) {
        return;
      }

      injectSemanticColorStyles(semanticMap.tokens);
      applySemanticHighlights(semanticMap.rules);
    } catch (error) {
      // Semantic highlighting is optional.
    }
  }

  function parseSemanticColorMap(markdown) {
    const tokenMap = new Map();
    const ruleMap = new Map();
    const lines = markdown.split(/\r?\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed.startsWith('|') || /^\|(?:\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        return;
      }

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());

      if (cells.length < 3) {
        return;
      }

      const phrase = normalizeSemanticPhrase(cells[0]);
      const token = cells[1].replace(/`/g, '').trim();
      const hex = cells[2].replace(/`/g, '').trim();

      if (!phrase || phrase.toLowerCase() === 'word / phrase' || !token.startsWith('--word-') || !/^#?[0-9a-f]{6}$/i.test(hex)) {
        return;
      }

      tokenMap.set(token, hex.startsWith('#') ? hex : `#${hex}`);
      addSemanticRule(ruleMap, phrase, token);
    });

    addSemanticAliasRules(lines, ruleMap);

    const tokens = Array.from(tokenMap.entries()).map(([token, hex]) => ({
      token,
      hex,
      className: tokenToSemanticClass(token)
    }));

    const rules = Array.from(ruleMap.values()).sort((left, right) => {
      const phraseDelta = right.phrase.length - left.phrase.length;

      if (phraseDelta !== 0) {
        return phraseDelta;
      }

      return right.wordCount - left.wordCount;
    });

    return { tokens, rules };
  }

  function addSemanticAliasRules(lines, ruleMap) {
    const familyTokenMap = {
      'Zendesk family': '--word-zendesk',
      'CX Experts family': '--word-cxexperts-soft',
      'Google / Apps Script family': '--word-google',
      'Data / SQL family': '--word-sql-soft',
      'AI / automation family': '--word-automation',
      'Front-end family': '--word-frontend'
    };
    let inAliasSection = false;
    let currentFamily = '';

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed === '## Aliases and Phrase Matching') {
        inAliasSection = true;
        return;
      }

      if (inAliasSection && trimmed.startsWith('## ') && trimmed !== '## Aliases and Phrase Matching') {
        inAliasSection = false;
        currentFamily = '';
        return;
      }

      if (!inAliasSection) {
        return;
      }

      if (trimmed.startsWith('### ')) {
        currentFamily = trimmed.slice(4).trim();
        return;
      }

      if (!trimmed.startsWith('- ')) {
        return;
      }

      const phrase = normalizeSemanticPhrase(trimmed.slice(2));
      const token = resolveSemanticAliasToken(currentFamily, phrase, familyTokenMap);

      if (!token) {
        return;
      }

      addSemanticRule(ruleMap, phrase, token);
    });
  }

  function resolveSemanticAliasToken(family, phrase, familyTokenMap) {
    const lowered = phrase.toLowerCase();

    if (lowered === 'customer experience') {
      return '--word-cxexperts-soft';
    }

    if (lowered === 'database') {
      return '--word-sql-soft';
    }

    return familyTokenMap[family] || null;
  }

  function addSemanticRule(ruleMap, phrase, token) {
    const normalized = normalizeSemanticPhrase(phrase);

    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();

    if (ruleMap.has(key)) {
      return;
    }

    ruleMap.set(key, {
      phrase: normalized,
      phraseLower: normalized.toLowerCase(),
      token,
      className: tokenToSemanticClass(token),
      wordCount: normalized.split(/\s+/).length
    });
  }

  function normalizeSemanticPhrase(value) {
    return value
      .replace(/[`*_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenToSemanticClass(token) {
    return `semantic-token--${token.replace(/^--/, '')}`;
  }

  function injectSemanticColorStyles(tokens) {
    const styleId = 'semantic-color-map';
    const existingStyle = document.getElementById(styleId);

    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;

    const rootVariables = tokens
      .map(({ token, hex }) => `  ${token}: ${hex};`)
      .join('\n');

    const utilityClasses = tokens
      .map(({ token, className }) => `.${className} { --semantic-color: var(${token}); }`)
      .join('\n');

    style.textContent = `:root {\n${rootVariables}\n}\n${utilityClasses}`;
    document.head.append(style);
  }

  function applySemanticHighlights(rules) {
    const targets = Array.from(new Set(document.querySelectorAll([
      'h1',
      'h2',
      'h3',
      '.lead',
      'p',
      'li',
      '.btn',
      '.text-link',
      '.site-nav a',
      '.brand',
      '.hero-meta span',
      '.telemetry-strip span',
      '.site-footer p'
    ].join(', '))));

    targets.forEach((target) => {
      if (shouldSkipSemanticTarget(target)) {
        return;
      }

      const budget = getSemanticHighlightBudget(target);

      if (!budget) {
        return;
      }

      highlightSemanticTerms(target, rules, budget, getSemanticHighlightMode(target));
    });
  }

  function shouldSkipSemanticTarget(element) {
    if (!element || element.closest('.site-loader, script, style, noscript, code, pre, svg, .project-media, .brand-chip__mark, .semantic-term')) {
      return true;
    }

    const text = element.textContent.replace(/\s+/g, ' ').trim();
    return !text;
  }

  function getSemanticHighlightBudget(element) {
    if (element.matches('.display, .display-sm, .section-title')) {
      return 3;
    }

    if (element.matches('h1, h2, h3, .lead, .btn, .text-link, .hero-meta span, .telemetry-strip span')) {
      return 2;
    }

    return 1;
  }

  function getSemanticHighlightMode(element) {
    if (element.matches('.display, .display-sm, .section-title')) {
      return 'glow';
    }

    if (element.matches('h1, h2, h3, .btn, .text-link, .hero-meta span, .telemetry-strip span, .tag, .panel-index')) {
      return 'strong';
    }

    return 'soft';
  }

  function highlightSemanticTerms(element, rules, budget, mode) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        if (node.parentElement && node.parentElement.closest('.semantic-term, script, style, noscript, code, pre, svg')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    let remainingBudget = budget;

    textNodes.forEach((node) => {
      if (!remainingBudget) {
        return;
      }

      const matches = collectSemanticMatches(node.nodeValue, rules, remainingBudget);

      if (!matches.length) {
        return;
      }

      const fragment = document.createDocumentFragment();
      let cursor = 0;

      matches.forEach((match) => {
        if (match.start > cursor) {
          fragment.append(document.createTextNode(node.nodeValue.slice(cursor, match.start)));
        }

        const span = document.createElement('span');
        span.className = `semantic-term ${match.className} semantic-term--${mode}`;
        span.textContent = node.nodeValue.slice(match.start, match.end);
        fragment.append(span);
        cursor = match.end;
      });

      if (cursor < node.nodeValue.length) {
        fragment.append(document.createTextNode(node.nodeValue.slice(cursor)));
      }

      node.parentNode.replaceChild(fragment, node);
      remainingBudget = Math.max(0, remainingBudget - matches.length);
    });
  }

  function collectSemanticMatches(text, rules, limit) {
    const loweredText = text.toLowerCase();
    const matches = [];

    rules.forEach((rule) => {
      if (matches.length >= limit) {
        return;
      }

      let searchFrom = 0;

      while (searchFrom < loweredText.length && matches.length < limit) {
        const index = loweredText.indexOf(rule.phraseLower, searchFrom);

        if (index === -1) {
          break;
        }

        const end = index + rule.phrase.length;

        if (isSemanticBoundary(text, index, end, rule.phrase) && !matches.some((match) => index < match.end && end > match.start)) {
          matches.push({
            start: index,
            end,
            className: rule.className
          });
        }

        searchFrom = index + rule.phrase.length;
      }
    });

    return matches.sort((left, right) => left.start - right.start);
  }

  function isSemanticBoundary(text, start, end, phrase) {
    const previousChar = start > 0 ? text[start - 1] : '';
    const nextChar = end < text.length ? text[end] : '';
    const isShortToken = phrase.length <= 2;

    if (isSemanticWordChar(previousChar) || isSemanticWordChar(nextChar)) {
      return false;
    }

    if (isShortToken && (previousChar === '-' || nextChar === '-')) {
      return false;
    }

    return true;
  }

  function isSemanticWordChar(value) {
    return /[A-Za-z0-9]/.test(value);
  }

  function preloadSoundAssets() {
    Object.entries(soundConfig).forEach(([name, config]) => {
      if (preloadedSounds.has(name)) {
        return;
      }

      const audio = new Audio(config.url);
      audio.preload = 'auto';
      audio.load();
      preloadedSounds.set(name, audio);
    });
  }

  function playSound(name, overrides = {}) {
    if (!overrides.force && (!soundsEnabled || root.classList.contains('is-loader-active'))) {
      return;
    }

    const config = soundConfig[name];

    if (!config) {
      return;
    }

    const audio = new Audio(config.url);
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, overrides.volume ?? config.volume));
    audio.playbackRate = overrides.playbackRate ?? config.playbackRate;
    audio.play().catch(() => {
      // Ignore autoplay interruptions.
    });
  }

  function initMedia() {
    const images = document.querySelectorAll('img');
    const videos = document.querySelectorAll('video');
    const lazyImages = [];

    images.forEach((image) => {
      image.decoding = 'async';
      image.setAttribute('draggable', 'false');

      if (image.closest('.hero, .page-hero-shell, .site-header')) {
        image.loading = 'eager';
        image.fetchPriority = 'high';
      } else if (image.closest('[data-editorial-swiper]')) {
        image.loading = lowPower ? 'lazy' : 'eager';
        image.fetchPriority = lowPower ? 'low' : 'auto';
      } else {
        image.loading = 'lazy';
        image.fetchPriority = 'low';
        lazyImages.push(image);
      }

      const mediaShell = image.closest('.project-media');
      if (mediaShell) {
        if (image.complete) {
          mediaShell.classList.add('is-loaded');
        } else {
          image.addEventListener('load', () => {
            mediaShell.classList.add('is-loaded');
          }, { once: true });
          image.addEventListener('error', () => {
            mediaShell.classList.add('is-loaded');
          }, { once: true });
        }
      }
    });

    if (lazyImages.length) {
      const preloadObserver = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const image = entry.target;
          image.loading = 'eager';
          image.fetchPriority = 'high';

          if (typeof image.decode === 'function' && !image.complete) {
            image.decode().catch(() => {
              // Ignore decode interruptions.
            });
          }

          currentObserver.unobserve(image);
        });
      }, {
        threshold: 0.01,
        rootMargin: lowPower ? '880px 0px' : '1400px 0px'
      });

      lazyImages.forEach((image) => preloadObserver.observe(image));
      revealObservers.push(preloadObserver);
    }

    videos.forEach((video) => {
      const mediaShell = video.closest('.project-media');
      const carouselShell = video.closest('[data-editorial-swiper]');
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.preload = lowPower ? 'none' : (carouselShell ? 'metadata' : 'none');

      if (mediaShell) {
        mediaShell.classList.add('is-loaded');
      }

      if (carouselShell) {
        video.autoplay = false;
        video.pause();
        return;
      }

      if (prefersReducedMotion || lowPower) {
        video.autoplay = false;
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.play().catch(() => {
              // Ignore autoplay interruptions.
            });
          } else {
            entry.target.pause();
          }
        });
      }, {
        threshold: 0.45,
        rootMargin: '240px 0px'
      });

      observer.observe(video);
      revealObservers.push(observer);
    });
  }

  function initEditorialSwipers() {
    const carousels = Array.from(document.querySelectorAll('[data-editorial-swiper]'));

    if (!carousels.length || typeof window.Swiper !== 'function') {
      return;
    }

    if (!editorialVisibilityBound) {
      editorialVisibilityBound = true;

      document.addEventListener('visibilitychange', () => {
        const isHidden = document.visibilityState !== 'visible';

        carouselControllers.forEach((controller) => {
          if (!controller.swiper || controller.swiper.destroyed) {
            return;
          }

          if (isHidden) {
            pauseEditorialVideos(controller);
            pauseEditorialAutoplay(controller);
            return;
          }

          resumeEditorialAutoplay(controller);

          if (controller.active) {
            syncEditorialVideos(controller);
          }
        });
      });
    }

    carousels.forEach((carousel) => {
      const swiperElement = carousel.querySelector('.swiper');

      if (!swiperElement) {
        return;
      }

      const baseSlides = Array.from(swiperElement.querySelectorAll('.swiper-slide'));

      if (!baseSlides.length) {
        return;
      }

      const autoplayDisabled = (carousel.dataset.editorialAutoplay || '').toLowerCase() === 'false'
        || (carousel.dataset.editorialAutoplay || '').toLowerCase() === 'off';

      const controller = {
        element: carousel,
        slides: baseSlides,
        progressBar: carousel.querySelector('[data-editorial-progress]'),
        prevButton: carousel.querySelector('[data-editorial-prev]'),
        nextButton: carousel.querySelector('[data-editorial-next]'),
        pagination: carousel.querySelector('.swiper-pagination'),
        delay: clamp(Number(carousel.dataset.editorialDelay || 3800), 2600, 7200),
        focusSeen: false,
        active: false,
        swiper: null,
        activeVideo: null,
        autoEnabled: !autoplayDisabled && baseSlides.length > 1,
        autoTimer: 0,
        progressFrame: 0,
        cycleStartedAt: 0
      };
      const hasNavigation = Boolean(controller.prevButton && controller.nextButton);

      controller.swiper = new window.Swiper(swiperElement, {
        effect: 'slide',
        loop: baseSlides.length > 1,
        rewind: false,
        speed: 760,
        allowTouchMove: baseSlides.length > 1,
        watchOverflow: true,
        observer: false,
        observeParents: false,
        preventInteractionOnTransition: false,
        loopPreventsSliding: false,
        navigation: hasNavigation
          ? {
              enabled: true,
              prevEl: controller.prevButton,
              nextEl: controller.nextButton
            }
          : {
              enabled: false
            },
        pagination: controller.pagination
          ? {
              el: controller.pagination,
              clickable: true,
              bulletClass: 'editorial-module__bullet',
              bulletActiveClass: 'is-active',
              renderBullet(index, className) {
                return `<button class="${className}" type="button" aria-label="Go to slide ${index + 1}"></button>`;
              }
            }
          : undefined,
        on: {
          init(swiper) {
            updateEditorialProgress(controller, controller.autoEnabled ? 0 : 1);
            syncEditorialVideos(controller, swiper);

            if (controller.active) {
              resumeEditorialAutoplay(controller);
            }
          },
          slideChangeTransitionStart(swiper) {
            controller.cycleStartedAt = performance.now();
            updateEditorialProgress(controller, controller.autoEnabled ? 0 : 1);
            syncEditorialVideos(controller, swiper);
          },
          slideChangeTransitionEnd(swiper) {
            syncEditorialVideos(controller, swiper);
            controller.cycleStartedAt = performance.now();
            startEditorialProgressTicker(controller);

            if (controller.active) {
              resumeEditorialAutoplay(controller);
            }
          }
        }
      });

      const initialRect = controller.element.getBoundingClientRect();
      controller.active = initialRect.bottom > 0 && initialRect.top < window.innerHeight;
      controller.element.classList.toggle('is-editorial-active', controller.active);

      if (controller.active) {
        syncEditorialVideos(controller);
        resumeEditorialAutoplay(controller);
      } else if (!controller.autoEnabled) {
        updateEditorialProgress(controller, 1);
      } else {
        resumeEditorialAutoplay(controller);
      }

      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== controller.element) {
            return;
          }

          controller.active = entry.isIntersecting;
          controller.element.classList.toggle('is-editorial-active', entry.isIntersecting);

          if (entry.isIntersecting) {
            if (controller.swiper && !controller.swiper.destroyed) {
              controller.swiper.update();
            }
            syncEditorialVideos(controller);
            resumeEditorialAutoplay(controller);
          } else {
            pauseEditorialVideos(controller);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '260px 0px'
      });

      visibilityObserver.observe(controller.element);
      revealObservers.push(visibilityObserver);

      if (controller.element.dataset.editorialLock === 'true') {
        const focusObserver = new IntersectionObserver((entries, currentObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || controller.focusSeen) {
              return;
            }

            controller.focusSeen = true;
            triggerCarouselFocusMoment(controller);
            currentObserver.unobserve(entry.target);
          });
        }, {
          threshold: 0.68
        });

        focusObserver.observe(controller.element);
        revealObservers.push(focusObserver);
      }

      carouselControllers.push(controller);
    });
  }

  function updateEditorialProgress(controller, value) {
    if (!controller.progressBar) {
      return;
    }

    const safeValue = Math.max(0, Math.min(1, value));
    controller.progressBar.style.transform = `scaleX(${safeValue})`;
  }

  function syncEditorialVideos(controller, activeSwiper = controller.swiper) {
    const allowPlayback = controller.active && !root.classList.contains('is-loader-active');
    const maxIndex = Math.max(controller.slides.length - 1, 0);
    const requestedIndex = activeSwiper && Number.isInteger(activeSwiper.realIndex)
      ? activeSwiper.realIndex
      : activeSwiper && Number.isInteger(activeSwiper.activeIndex)
        ? activeSwiper.activeIndex
      : 0;
    const safeIndex = clamp(requestedIndex, 0, maxIndex);
    let nextActiveVideo = null;

    controller.slides.forEach((slide, index) => {
      slide.querySelectorAll('video').forEach((video) => {
        const isActiveSlide = index === safeIndex;

        if (allowPlayback && isActiveSlide) {
          const shouldRestart = controller.activeVideo !== video;

          if (shouldRestart) {
            seekVideoToStart(video);
          }

          playEditorialVideo(video);
          nextActiveVideo = video;
          return;
        }

        video.pause();

        if (!isActiveSlide) {
          seekVideoToStart(video);
        }
      });
    });

    controller.activeVideo = nextActiveVideo;

    if (!controller.autoEnabled) {
      updateEditorialProgress(controller, 1);
    }
  }

  function playEditorialVideo(video) {
    const attemptPlayback = () => {
      video.play().catch(() => {
        const handleCanPlay = () => {
          video.removeEventListener('canplay', handleCanPlay);
          video.play().catch(() => {
            // Ignore autoplay interruptions.
          });
        };

        video.addEventListener('canplay', handleCanPlay, { once: true });
      });
    };

    if (video.readyState >= 2) {
      attemptPlayback();
      return;
    }

    const waitForCanPlay = () => {
      video.removeEventListener('canplay', waitForCanPlay);
      attemptPlayback();
    };

    video.addEventListener('canplay', waitForCanPlay, { once: true });
  }

  function seekVideoToStart(video) {
    try {
      video.currentTime = 0;
    } catch (error) {
      void error;
    }
  }

  function pauseEditorialVideos(controller) {
    controller.activeVideo = null;
    controller.element.querySelectorAll('video').forEach((video) => {
      video.pause();
    });
  }

  function stopEditorialProgressTicker(controller) {
    if (controller.progressFrame) {
      window.cancelAnimationFrame(controller.progressFrame);
      controller.progressFrame = 0;
    }
  }

  function startEditorialProgressTicker(controller) {
    stopEditorialProgressTicker(controller);

    if (!controller.autoEnabled || !controller.active || !controller.progressBar) {
      return;
    }

    if (!controller.cycleStartedAt) {
      controller.cycleStartedAt = performance.now();
    }

    const render = () => {
      controller.progressFrame = 0;

      if (!controller.autoEnabled || !controller.active || !controller.swiper || controller.swiper.destroyed) {
        return;
      }

      const elapsed = Math.max(0, performance.now() - controller.cycleStartedAt);
      const ratio = Math.min(1, elapsed / controller.delay);
      updateEditorialProgress(controller, ratio);
      controller.progressFrame = window.requestAnimationFrame(render);
    };

    controller.progressFrame = window.requestAnimationFrame(render);
  }

  function resumeEditorialAutoplay(controller) {
    if (!controller.swiper || controller.swiper.destroyed || !controller.autoEnabled || controller.slides.length <= 1) {
      return;
    }

    if (controller.autoTimer) {
      return;
    }

    controller.cycleStartedAt = performance.now();
    startEditorialProgressTicker(controller);

    controller.autoTimer = window.setInterval(() => {
      if (!controller.swiper || controller.swiper.destroyed) {
        return;
      }

      controller.swiper.slideNext();
      controller.cycleStartedAt = performance.now();
    }, controller.delay);
  }

  function pauseEditorialAutoplay(controller) {
    if (controller.autoTimer) {
      window.clearInterval(controller.autoTimer);
      controller.autoTimer = 0;
    }

    stopEditorialProgressTicker(controller);
  }

  function triggerCarouselFocusMoment(controller) {
    const focusDuration = clamp(Number(controller.element.dataset.editorialFocusDuration || 1900), 1400, 2600);

    controller.element.classList.add('is-focus-active');
    window.setTimeout(() => {
      controller.element.classList.remove('is-focus-active');
    }, focusDuration + 260);

    if (prefersReducedMotion || lowPower || window.innerWidth < 980 || root.classList.contains('is-loader-active')) {
      return;
    }

    lockScroll(focusDuration);
  }

  function lockScroll(duration = 1900) {
    if (scrollLockState.locked) {
      return;
    }

    scrollLockState.locked = true;
    scrollLockState.bodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(window.innerWidth - document.documentElement.clientWidth, 0);

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    scrollLockState.wheelHandler = (event) => {
      event.preventDefault();
    };

    scrollLockState.touchHandler = (event) => {
      event.preventDefault();
    };

    scrollLockState.keyHandler = (event) => {
      if (scrollBlockKeys.has(event.key) || scrollBlockKeys.has(event.code)) {
        event.preventDefault();
      }
    };

    root.classList.add('is-scroll-locked');
    body.classList.add('is-scroll-locked');

    window.addEventListener('wheel', scrollLockState.wheelHandler, { passive: false, capture: true });
    window.addEventListener('touchmove', scrollLockState.touchHandler, { passive: false, capture: true });
    window.addEventListener('keydown', scrollLockState.keyHandler, { capture: true });

    scrollLockState.timer = window.setTimeout(unlockScroll, duration);
  }

  function unlockScroll() {
    if (!scrollLockState.locked) {
      return;
    }

    scrollLockState.locked = false;
    window.clearTimeout(scrollLockState.timer);
    scrollLockState.timer = 0;
    root.classList.remove('is-scroll-locked');
    body.classList.remove('is-scroll-locked');
    body.style.paddingRight = scrollLockState.bodyPaddingRight || '';

    if (scrollLockState.wheelHandler) {
      window.removeEventListener('wheel', scrollLockState.wheelHandler, true);
    }

    if (scrollLockState.touchHandler) {
      window.removeEventListener('touchmove', scrollLockState.touchHandler, true);
    }

    if (scrollLockState.keyHandler) {
      window.removeEventListener('keydown', scrollLockState.keyHandler, true);
    }

    scrollLockState.wheelHandler = null;
    scrollLockState.touchHandler = null;
    scrollLockState.keyHandler = null;
    scrollLockState.bodyPaddingRight = '';
  }

  function initShellFirstPaint() {
    const shellTargets = Array.from(document.querySelectorAll('.scene-shell, .frame-panel, .repo-group, .timeline-item, .project-showcase'));

    if (!shellTargets.length) {
      return;
    }

    const markReady = (element) => {
      element.classList.remove('is-content-pending');
      element.classList.add('is-content-ready');
    };

    const readyInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight * 1.28;
    };

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        markReady(entry.target);
        currentObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.01,
      rootMargin: '360px 0px'
    });

    shellTargets.forEach((element) => {
      element.classList.add('is-shell-ready');

      if (prefersReducedMotion || readyInViewport(element)) {
        markReady(element);
        return;
      }

      element.classList.add('is-content-pending');
      observer.observe(element);
    });

    revealObservers.push(observer);
  }

  function initRevealSystem() {
    if (prefersReducedMotion || lowPower) {
      revealImmediately();
      return;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        markRevealVisible(entry.target);
      });
    }, {
      threshold: 0.01,
      rootMargin: '220px 0px -8% 0px'
    });

    document.querySelectorAll('.reveal, .reveal-inline').forEach((element) => {
      pendingRevealElements.add(element);
      revealObserver.observe(element);
    });

    revealObservers.push(revealObserver);
    flushPendingReveals();
  }

  function revealImmediately() {
    document.querySelectorAll('.reveal, .reveal-inline').forEach((element) => {
      markRevealVisible(element);
    });
  }

  function markRevealVisible(element) {
    if (!element || element.classList.contains('is-visible')) {
      return;
    }

    element.classList.add('is-visible');
    pendingRevealElements.delete(element);
    if (revealObserver) {
      revealObserver.unobserve(element);
    }
  }

  function flushPendingReveals() {
    if (!pendingRevealElements.size) {
      return;
    }

    const revealLine = (window.innerHeight || 1) * 1.45;
    Array.from(pendingRevealElements).forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < revealLine) {
        markRevealVisible(element);
      }
    });
  }

  function initScrollPacing() {
    if (prefersReducedMotion || !supportsHover || !finePointer || window.innerWidth < 980) {
      return;
    }

    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      if (scrollLockState.locked || root.classList.contains('is-loader-active')) {
        return;
      }

      const deltaX = event.deltaX;
      const deltaY = event.deltaY;
      const unitScale = event.deltaMode === 1
        ? 18
        : event.deltaMode === 2
          ? (window.innerHeight || 1)
          : 1;
      const normalizedX = deltaX * unitScale;
      const normalizedY = deltaY * unitScale;

      if (Math.abs(normalizedX) < 0.4 && Math.abs(normalizedY) < 0.4) {
        return;
      }

      event.preventDefault();
      const pacedX = clamp(normalizedX * 0.05, -10, 10);
      const pacedY = clamp(normalizedY * 0.05, -10, 10);
      window.scrollBy({
        left: pacedX,
        top: pacedY,
        behavior: 'auto'
      });
    }, { passive: false });
  }

  function initScenes() {
    if (!canUseSceneDepth) {
      return;
    }

    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const controller = sceneControllers.find((item) => item.scene === entry.target);

        if (!controller) {
          return;
        }

        controller.active = entry.isIntersecting;
        controller.scene.classList.toggle('is-active-depth', entry.isIntersecting);

        if (entry.isIntersecting) {
          controller.scene.style.willChange = 'transform';
          updateSingleSceneOffset(controller);
          queueSceneRender(controller);
        } else {
          controller.scene.style.willChange = '';
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '24% 0px'
    });

    document.querySelectorAll('[data-depth-scene]').forEach((scene) => {
      assignAutoDepth(scene);

      const controller = {
        scene,
        active: false,
        pointerX: 0,
        pointerY: 0,
        currentX: 0,
        currentY: 0,
        scrollOffset: 0,
        currentScroll: 0,
        frame: 0,
        layers: Array.from(scene.querySelectorAll('[data-depth]')).map((element) => ({
          element,
          depth: clamp(parseFloat(element.dataset.depth) || 0.32, 0.1, 0.8)
        }))
      };

      scene.addEventListener('pointermove', (event) => {
        if (!controller.active) {
          return;
        }

        const rect = scene.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        controller.pointerX = clamp(x, -1, 1);
        controller.pointerY = clamp(y, -1, 1);
        queueSceneRender(controller);
      }, { passive: true });

      scene.addEventListener('pointerleave', () => {
        controller.pointerX = 0;
        controller.pointerY = 0;
        queueSceneRender(controller);
      }, { passive: true });

      sceneControllers.push(controller);
      sceneObserver.observe(scene);
    });

    revealObservers.push(sceneObserver);
  }

  function assignAutoDepth(scene) {
    const autoDepths = [0.18, 0.26, 0.34, 0.42];
    const candidates = scene.querySelectorAll(
      '.hero-layout > *, .page-hero-layout > *, .section-copy, .scene-copy, .summary-grid > *, .project-showcase-grid > *, .timeline-shell > .timeline-item, .capability-grid > *, .link-grid > *, .cert-grid > *, .contact-grid > *, .metric-grid > *, .telemetry-wall > *, .repo-groups > .repo-group'
    );
    let depthIndex = 0;

    candidates.forEach((element) => {
      if (element.hasAttribute('data-depth')) {
        return;
      }

      element.dataset.depth = String(autoDepths[depthIndex % autoDepths.length]);
      element.dataset.depthAuto = 'true';
      depthIndex += 1;
    });
  }

  function queueSceneRender(controller) {
    if (!controller.active || controller.frame) {
      return;
    }

    controller.frame = window.requestAnimationFrame(() => renderScene(controller));
  }

  function renderScene(controller) {
    controller.frame = 0;
    controller.currentX += (controller.pointerX - controller.currentX) * 0.1;
    controller.currentY += (controller.pointerY - controller.currentY) * 0.1;
    controller.currentScroll += (controller.scrollOffset - controller.currentScroll) * 0.055;

    const x = controller.currentX;
    const y = controller.currentY;
    const scroll = controller.currentScroll;
    const sceneRotateX = (-y * 2.2) + (scroll * 1.7);
    const sceneRotateY = x * 3;
    const sceneLift = scroll * -9;

    controller.scene.style.transform = `translate3d(0, ${sceneLift}px, 0) rotateX(${sceneRotateX}deg) rotateY(${sceneRotateY}deg)`;
    controller.scene.style.setProperty('--scene-light-x', `${50 + (x * 10)}%`);
    controller.scene.style.setProperty('--scene-light-y', `${24 + (y * 8) - (scroll * 5)}%`);
    controller.scene.style.setProperty('--scene-light-opacity', String(0.18 + (Math.abs(x) * 0.05) + (Math.abs(scroll) * 0.08)));

    controller.layers.forEach(({ element, depth }) => {
      const layerX = x * depth * 14;
      const layerY = y * depth * -8;
      const layerZ = depth * 20;
      const rotateX = -y * depth * 3.5;
      const rotateY = x * depth * 4.5;
      element.style.transform = `translate3d(${layerX}px, ${layerY}px, ${layerZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    const stillMoving = Math.abs(controller.pointerX - controller.currentX) > 0.002
      || Math.abs(controller.pointerY - controller.currentY) > 0.002
      || Math.abs(controller.scrollOffset - controller.currentScroll) > 0.002;

    if (stillMoving) {
      queueSceneRender(controller);
    }
  }

  function initAtmosphere() {
    if (!siteAtmosphere || !canUseAtmosphereMotion) {
      root.style.setProperty('--atmosphere-intensity', lowPower ? '0.7' : '0.84');
      return;
    }

    window.addEventListener('pointermove', (event) => {
      atmosphereState.pointerX = clamp(((event.clientX / window.innerWidth) * 2) - 1, -1, 1);
      atmosphereState.pointerY = clamp(((event.clientY / window.innerHeight) * 2) - 1, -1, 1);
      queueAtmosphereRender();
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      atmosphereState.pointerX = 0;
      atmosphereState.pointerY = 0;
      queueAtmosphereRender();
    }, { passive: true });
  }

  function updateAtmosphere() {
    if (!siteAtmosphere || !canUseAtmosphereMotion) {
      return;
    }

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    atmosphereState.scroll = clamp(window.scrollY / maxScroll, 0, 1);
    queueAtmosphereRender();
  }

  function queueAtmosphereRender() {
    if (!siteAtmosphere || atmosphereState.frame) {
      return;
    }

    atmosphereState.frame = window.requestAnimationFrame(renderAtmosphere);
  }

  function renderAtmosphere() {
    atmosphereState.frame = 0;
    atmosphereState.currentX += (atmosphereState.pointerX - atmosphereState.currentX) * 0.07;
    atmosphereState.currentY += (atmosphereState.pointerY - atmosphereState.currentY) * 0.07;
    atmosphereState.currentScroll += (atmosphereState.scroll - atmosphereState.currentScroll) * 0.04;

    const x = atmosphereState.currentX;
    const y = atmosphereState.currentY;
    const scroll = atmosphereState.currentScroll;

    root.style.setProperty('--atmosphere-shift-x', `${x * 18}px`);
    root.style.setProperty('--atmosphere-shift-y', `${y * 14}px`);
    root.style.setProperty('--atmosphere-scroll', `${scroll * -16}px`);
    root.style.setProperty('--atmosphere-intensity', String(0.82 + (Math.abs(x) * 0.05) + (scroll * 0.08)));

    const stillMoving = Math.abs(atmosphereState.pointerX - atmosphereState.currentX) > 0.002
      || Math.abs(atmosphereState.pointerY - atmosphereState.currentY) > 0.002
      || Math.abs(atmosphereState.scroll - atmosphereState.currentScroll) > 0.002;

    if (stillMoving) {
      queueAtmosphereRender();
    }
  }

  function scheduleLayoutUpdate() {
    if (layoutFrame) {
      return;
    }

    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      updateProgressBar();
      updateSceneScrollOffsets();
      updateAtmosphere();
      flushPendingReveals();
    });
  }

  function updateProgressBar() {
    if (!progressBar) {
      return;
    }

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    progressBar.style.transform = `scaleY(${Math.max(progress, 0.02)})`;
  }

  function updateSceneScrollOffsets() {
    if (!sceneControllers.length) {
      return;
    }

    sceneControllers.forEach((controller) => {
      if (!controller.active) {
        return;
      }

      updateSingleSceneOffset(controller);
      queueSceneRender(controller);
    });
  }

  function updateSingleSceneOffset(controller) {
    const viewportHeight = window.innerHeight || 1;
    const rect = controller.scene.getBoundingClientRect();
    const centerOffset = (rect.top + (rect.height * 0.5) - (viewportHeight * 0.5)) / viewportHeight;
    controller.scrollOffset = clamp(centerOffset * -0.42, -1, 1);
  }

  function handleResize() {
    scheduleLayoutUpdate();
    updateEditorialSwiperLayouts();
    scheduleVantaRefresh();
    maybeLoadImmersiveExperience();
  }

  function updateEditorialSwiperLayouts() {
    carouselControllers.forEach((controller) => {
      if (!controller.swiper || controller.swiper.destroyed) {
        return;
      }

      controller.swiper.update();

      if (controller.active) {
        syncEditorialVideos(controller);
        resumeEditorialAutoplay(controller);
      }
    });
  }

  function initVanta(attempt = 0) {
    if (!canUseVanta()) {
      return;
    }

    if (!(window.VANTA && window.VANTA.NET)) {
      if (attempt < 24) {
        window.setTimeout(() => initVanta(attempt + 1), 320);
      }
      return;
    }

    refreshVanta();
  }

  function refreshVanta() {
    if (!canUseVanta()) {
      destroyVanta();
      return;
    }

    if (vantaEffect) {
      if (typeof vantaEffect.resize === 'function') {
        vantaEffect.resize();
      }
      return;
    }

    try {
      vantaEffect = window.VANTA.NET({
        el: vantaTarget,
        color: 0x9befff,
        backgroundColor: 0x04070d,
        points: lowPower ? 8 : 13,
        maxDistance: lowPower ? 20 : 25,
        spacing: lowPower ? 18 : 16,
        showDots: true,
        mouseControls: finePointer,
        touchControls: false,
        gyroControls: false,
        scale: 1,
        scaleMobile: 1
      });
      root.classList.add('has-vanta');
    } catch (error) {
      destroyVanta();
    }
  }

  function scheduleVantaRefresh() {
    window.clearTimeout(vantaResizeTimer);
    vantaResizeTimer = window.setTimeout(refreshVanta, 180);
  }

  function destroyVanta() {
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      vantaEffect.destroy();
    }

    vantaEffect = null;
    root.classList.remove('has-vanta');
  }

  function canUseVanta() {
    return false;
  }

  function maybeLoadImmersiveExperience() {
    if (!canUseImmersiveStage || immersiveExperienceLoaded || immersiveExperiencePending) {
      return;
    }

    if (!document.querySelector('[data-r3f-root]')) {
      return;
    }

    immersiveExperiencePending = true;
    const moduleBase = scriptTag ? scriptTag.src : `${window.location.origin}/assets/js/main.js`;
    const moduleUrl = new URL('immersive-experience.js', moduleBase);

    import(moduleUrl.toString())
      .then(() => {
        immersiveExperienceLoaded = true;
        root.classList.remove('immersive-stage-failed');
        root.classList.add('has-immersive-stage');
      })
      .catch((error) => {
        immersiveExperienceLoaded = false;
        root.classList.add('immersive-stage-failed');
        console.error('Immersive experience failed to load.', error);
      })
      .finally(() => {
        immersiveExperiencePending = false;
      });
  }

  function queueIdleTask(task, timeout = 200) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(task, { timeout });
      return;
    }

    window.setTimeout(task, timeout);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function primeAudio() {
    const unlockAudio = () => {
      if (!soundsEnabled) {
        detachUnlockListeners();
        return;
      }

      playSound('cue', { force: true, volume: 0.01 });
      detachUnlockListeners();
    };

    const detachUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true, capture: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true, capture: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }
});
