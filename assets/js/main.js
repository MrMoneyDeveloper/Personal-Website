document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const body = document.body;
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
    hover: { path: 'sounds/hover.wav', volume: 0.05, playbackRate: 1.06 },
    click: { path: 'sounds/click.wav', volume: 0.1, playbackRate: 1 },
    cue: { path: 'sounds/cue.wav', volume: 0.08, playbackRate: 0.98 },
    reveal: { path: 'sounds/reveal.wav', volume: 0.07, playbackRate: 0.94 },
    flip: { path: 'sounds/flip.wav', volume: 0.07, playbackRate: 1.02 }
  };
  const sceneControllers = [];
  const revealObservers = [];
  const currentDeviceMemory = Number(window.navigator.deviceMemory || 0);
  const currentConcurrency = Number(window.navigator.hardwareConcurrency || 0);
  const hardLowPower = (currentDeviceMemory > 0 && currentDeviceMemory <= 2)
    || (currentConcurrency > 0 && currentConcurrency <= 2);
  const lowPower = hardLowPower || window.innerWidth < 768;
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
  initShellFirstPaint();
  initLinkTransitions();
  initMedia();
  initRevealSystem();
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
      duration = Math.max(0, 10000 - (Date.now() - initialStart));
    } else if (initialMode === 'route') {
      const pendingRoute = readRouteLoader();
      duration = pendingRoute ? Math.max(0, pendingRoute.expires - Date.now()) : 0;
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
    document.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!shouldHandleRouteTransition(link, event)) {
          return;
        }

        const targetUrl = new URL(link.href, window.location.href);
        const pendingRoute = {
          startedAt: Date.now(),
          expires: Date.now() + 5000,
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

    if (prefersReducedMotion) {
      return;
    }

    const hoverTargets = document.querySelectorAll('.btn, .site-nav a, .brand, .menu-toggle, .frame-panel, .project-card, .news-item');
    const clickTargets = document.querySelectorAll('.btn, .site-nav a, .brand, .menu-toggle, .frame-panel, .project-card, .news-item');

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

    clickTargets.forEach((element) => {
      element.addEventListener('click', () => {
        playSound('click');
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
  }

  function playSound(name, overrides = {}) {
    if (!overrides.force && (!soundsEnabled || prefersReducedMotion || root.classList.contains('is-loader-active'))) {
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

    images.forEach((image) => {
      image.decoding = 'async';
      image.setAttribute('draggable', 'false');

      if (image.closest('.hero, .page-hero-shell, .site-header')) {
        image.loading = 'eager';
        image.fetchPriority = 'high';
      } else {
        image.loading = 'lazy';
        image.fetchPriority = 'low';
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

    videos.forEach((video) => {
      const mediaShell = video.closest('.project-media');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';

      if (mediaShell) {
        mediaShell.classList.add('is-loaded');
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
    if (prefersReducedMotion) {
      revealImmediately();
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -10% 0px'
    });

    document.querySelectorAll('.reveal, .reveal-inline').forEach((element) => {
      observer.observe(element);
    });

    revealObservers.push(observer);
  }

  function revealImmediately() {
    document.querySelectorAll('.reveal, .reveal-inline').forEach((element) => {
      element.classList.add('is-visible');
    });
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
    scheduleVantaRefresh();
    maybeLoadImmersiveExperience();
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
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }
});
