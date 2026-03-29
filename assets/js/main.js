document.addEventListener('DOMContentLoaded', () => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = reducedMotionQuery.matches;
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const soundToggle = document.querySelector('.sound-toggle');
  const progressBar = document.querySelector('.scroll-progress');
  const siteAtmosphere = document.querySelector('.site-atmosphere');
  const vantaTarget = document.querySelector('#vanta-bg');
  const scriptTag = document.querySelector('script[src*="assets/js/main.js"]');
  const assetBase = scriptTag
    ? scriptTag.src.replace(/assets\/js\/main\.js(?:\?.*)?$/, 'assets/')
    : `${window.location.origin}/assets/`;
  const sceneControllers = [];
  const soundKey = 'placeholder-studio-sound';
  let layoutFrame = 0;
  let atmosphereFrame = 0;
  let vantaResizeTimer = 0;
  let lastSceneCueAt = 0;
  let soundsEnabled = false;
  let vantaEffect = null;

  const atmosphereState = {
    pointerX: 0,
    pointerY: 0,
    currentX: 0,
    currentY: 0,
    scroll: 0,
    currentScroll: 0
  };

  const soundConfig = {
    hover: { path: 'sounds/hover.wav', volume: 0.06, playbackRate: 1.06 },
    click: { path: 'sounds/click.wav', volume: 0.12, playbackRate: 1 },
    cue: { path: 'sounds/cue.wav', volume: 0.1, playbackRate: 0.98 },
    reveal: { path: 'sounds/reveal.wav', volume: 0.08, playbackRate: 0.94 },
    flip: { path: 'sounds/flip.wav', volume: 0.08, playbackRate: 1.02 }
  };

  Object.keys(soundConfig).forEach((key) => {
    soundConfig[key].url = new URL(soundConfig[key].path, assetBase).toString();
  });

  markCurrentRoute();
  initMenu();
  initSound();
  initAtmosphere();
  initVanta();
  initScenes();
  initAnimations();
  scheduleLayoutUpdate();

  window.addEventListener('scroll', scheduleLayoutUpdate, { passive: true });
  window.addEventListener('resize', () => {
    scheduleLayoutUpdate();
    scheduleVantaRefresh();
  });

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

  function initAtmosphere() {
    if (!siteAtmosphere || prefersReducedMotion) {
      return;
    }

    if (finePointer) {
      window.addEventListener('pointermove', (event) => {
        atmosphereState.pointerX = clamp(((event.clientX / window.innerWidth) * 2) - 1, -1, 1);
        atmosphereState.pointerY = clamp(((event.clientY / window.innerHeight) * 2) - 1, -1, 1);
        queueAtmosphereRender();
      }, { passive: true });

      window.addEventListener('pointerleave', () => {
        atmosphereState.pointerX = 0;
        atmosphereState.pointerY = 0;
        queueAtmosphereRender();
      });
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
    try {
      soundsEnabled = window.localStorage.getItem(soundKey) === 'on';
    } catch (error) {
      soundsEnabled = false;
    }

    updateSoundToggle();

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        soundsEnabled = !soundsEnabled;

        try {
          window.localStorage.setItem(soundKey, soundsEnabled ? 'on' : 'off');
        } catch (error) {
          // Storage access is optional.
        }

        updateSoundToggle();

        if (soundsEnabled) {
          playSound('cue', { force: true, volume: 0.1 });
        }
      });
    }

    const hoverTargets = document.querySelectorAll('.btn, .site-nav a, .brand, .sound-toggle, .menu-toggle, .frame-panel, .project-card, .news-item');
    const clickTargets = document.querySelectorAll('.btn, .site-nav a, .brand, .menu-toggle, .frame-panel, .project-card, .news-item');
    hoverTargets.forEach((element) => {
      let lastHoverAt = 0;

      if (supportsHover) {
        element.addEventListener('pointerenter', () => {
          const now = Date.now();

          if (now - lastHoverAt < 140) {
            return;
          }

          lastHoverAt = now;
          playSound('hover');
        });
      }

    });

    clickTargets.forEach((element) => {
      element.addEventListener('click', () => {
        playSound('click');
      });
    });

    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const cueName = entry.target.getAttribute('data-sound-scene') || 'reveal';
        const now = Date.now();

        if (now - lastSceneCueAt > 1600) {
          lastSceneCueAt = now;
          playSound(cueName);
        }

        sceneObserver.unobserve(entry.target);
      });
    }, { threshold: 0.66 });

    document.querySelectorAll('[data-sound-scene]').forEach((scene) => {
      sceneObserver.observe(scene);
    });
  }

  function updateSoundToggle() {
    if (!soundToggle) {
      return;
    }

    const label = soundToggle.querySelector('.sound-toggle__label');
    soundToggle.classList.toggle('is-active', soundsEnabled);
    soundToggle.setAttribute('aria-pressed', String(soundsEnabled));
    soundToggle.setAttribute('aria-label', soundsEnabled ? 'Disable interface sound' : 'Enable interface sound');

    if (label) {
      label.textContent = soundsEnabled ? 'Sound On' : 'Sound Off';
    }
  }

  function playSound(name, overrides = {}) {
    if (!overrides.force && (!soundsEnabled || prefersReducedMotion)) {
      return;
    }

    const config = soundConfig[name];

    if (!config) {
      return;
    }

    const audio = new Audio(config.url);
    audio.volume = Math.max(0, Math.min(1, overrides.volume ?? config.volume));
    audio.playbackRate = overrides.playbackRate ?? config.playbackRate;
    audio.preload = 'auto';
    audio.play().catch(() => {
      // Ignore autoplay and navigation interruptions.
    });
  }

  function initVanta() {
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
        color: 0x8be7ff,
        backgroundColor: 0x04070d,
        points: 15,
        maxDistance: 22,
        spacing: 16,
        showDots: false,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        scale: 1,
        scaleMobile: 1
      });
      document.documentElement.classList.add('has-vanta');
    } catch (error) {
      destroyVanta();
    }
  }

  function scheduleVantaRefresh() {
    window.clearTimeout(vantaResizeTimer);
    vantaResizeTimer = window.setTimeout(refreshVanta, 140);
  }

  function destroyVanta() {
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      vantaEffect.destroy();
    }

    vantaEffect = null;
    document.documentElement.classList.remove('has-vanta');
  }

  function canUseVanta() {
    return Boolean(
      !prefersReducedMotion
      && vantaTarget
      && window.VANTA
      && window.VANTA.NET
      && window.innerWidth >= 720
    );
  }

  function initScenes() {
    document.querySelectorAll('[data-depth-scene]').forEach((scene) => {
      assignAutoDepth(scene);

      const layers = Array.from(scene.querySelectorAll('[data-depth]')).map((element) => ({
        element,
        depth: clamp(parseFloat(element.dataset.depth) || 0.45, 0.1, 1.2)
      }));

      const controller = {
        scene,
        layers,
        pointerX: 0,
        pointerY: 0,
        currentX: 0,
        currentY: 0,
        scrollOffset: 0,
        currentScroll: 0,
        frame: 0
      };

      if (finePointer && !prefersReducedMotion) {
        scene.addEventListener('pointermove', (event) => {
          const rect = scene.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
          controller.pointerX = clamp(x, -1, 1);
          controller.pointerY = clamp(y, -1, 1);
          queueSceneRender(controller);
        });

        scene.addEventListener('pointerleave', () => {
          controller.pointerX = 0;
          controller.pointerY = 0;
          queueSceneRender(controller);
        });
      }

      sceneControllers.push(controller);
      queueSceneRender(controller);
    });
  }

  function assignAutoDepth(scene) {
    const autoDepths = [0.28, 0.38, 0.48, 0.58];
    const candidates = scene.querySelectorAll(
      '.hero-layout > *, .page-hero-layout > *, .section-copy, .scene-copy, .summary-grid > *, .project-showcase-grid > *, .timeline-shell > *, .capability-grid > *, .link-grid > *, .cert-grid > *, .contact-grid > *, .metric-grid > *, .telemetry-wall > *, .repo-groups > *'
    );

    let depthIndex = 0;

    candidates.forEach((element) => {
      if (element.hasAttribute('data-depth')) {
        return;
      }

      const parentDepth = element.parentElement?.closest('[data-depth]');
      if (parentDepth && scene.contains(parentDepth)) {
        return;
      }

      element.dataset.depth = String(autoDepths[depthIndex % autoDepths.length]);
      element.dataset.depthAuto = 'true';
      depthIndex += 1;
    });
  }

  function queueSceneRender(controller) {
    if (controller.frame) {
      return;
    }

    controller.frame = window.requestAnimationFrame(() => renderScene(controller));
  }

  function renderScene(controller) {
    controller.frame = 0;
    controller.currentX += (controller.pointerX - controller.currentX) * 0.12;
    controller.currentY += (controller.pointerY - controller.currentY) * 0.12;
    controller.currentScroll += (controller.scrollOffset - controller.currentScroll) * 0.1;

    const x = prefersReducedMotion ? 0 : controller.currentX;
    const y = prefersReducedMotion ? 0 : controller.currentY;
    const scroll = prefersReducedMotion ? 0 : controller.currentScroll;
    const sceneRotateX = (-y * 5) + (scroll * 6);
    const sceneRotateY = x * 7;
    const sceneLift = scroll * -26;

    controller.scene.style.transform = `translate3d(0, ${sceneLift}px, 0) rotateX(${sceneRotateX}deg) rotateY(${sceneRotateY}deg)`;
    controller.scene.style.setProperty('--scene-light-x', `${50 + (x * 18)}%`);
    controller.scene.style.setProperty('--scene-light-y', `${24 + (y * 14) - (scroll * 8)}%`);
    controller.scene.style.setProperty('--scene-light-opacity', String(0.18 + (Math.abs(x) * 0.08) + (Math.abs(scroll) * 0.12)));

    controller.layers.forEach(({ element, depth }) => {
      const layerX = x * depth * 28;
      const layerY = (y * depth * -18) + (scroll * depth * -42);
      const layerZ = depth * 72;
      const rotateX = -y * depth * 8;
      const rotateY = x * depth * 10;
      element.style.transform = `translate3d(${layerX}px, ${layerY}px, ${layerZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    const stillMoving = Math.abs(controller.pointerX - controller.currentX) > 0.002
      || Math.abs(controller.pointerY - controller.currentY) > 0.002
      || Math.abs(controller.scrollOffset - controller.currentScroll) > 0.002;

    if (stillMoving) {
      queueSceneRender(controller);
    }
  }

  function initAnimations() {
    if (!window.gsap) {
      revealImmediately();
      return;
    }

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    window.gsap.utils.toArray('.scene-shell').forEach((scene) => {
      window.gsap.fromTo(scene, {
        opacity: 0.38,
        filter: 'blur(16px) brightness(0.74)'
      }, {
        opacity: 1,
        filter: 'blur(0px) brightness(1)',
        duration: 1.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: scene,
          start: 'top 86%',
          once: true
        }
      });
    });

    window.gsap.utils.toArray('.reveal').forEach((item, index) => {
      window.gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.88,
        delay: (index % 4) * 0.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
          once: true
        }
      });
    });

    window.gsap.utils.toArray('.reveal-inline').forEach((item, index) => {
      window.gsap.to(item, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.82,
        delay: (index % 3) * 0.04,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
          once: true
        }
      });
    });
  }

  function revealImmediately() {
    document.querySelectorAll('.reveal').forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });

    document.querySelectorAll('.reveal-inline').forEach((element) => {
      element.style.opacity = '1';
      element.style.filter = 'none';
    });
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

  function updateAtmosphere() {
    if (!siteAtmosphere || prefersReducedMotion) {
      return;
    }

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    atmosphereState.scroll = clamp(window.scrollY / maxScroll, 0, 1);
    queueAtmosphereRender();
  }

  function queueAtmosphereRender() {
    if (atmosphereFrame || !siteAtmosphere) {
      return;
    }

    atmosphereFrame = window.requestAnimationFrame(renderAtmosphere);
  }

  function renderAtmosphere() {
    atmosphereFrame = 0;
    atmosphereState.currentX += (atmosphereState.pointerX - atmosphereState.currentX) * 0.08;
    atmosphereState.currentY += (atmosphereState.pointerY - atmosphereState.currentY) * 0.08;
    atmosphereState.currentScroll += (atmosphereState.scroll - atmosphereState.currentScroll) * 0.08;

    const x = atmosphereState.currentX;
    const y = atmosphereState.currentY;
    const scroll = atmosphereState.currentScroll;

    document.documentElement.style.setProperty('--atmosphere-shift-x', `${x * 34}px`);
    document.documentElement.style.setProperty('--atmosphere-shift-y', `${y * 24}px`);
    document.documentElement.style.setProperty('--atmosphere-scroll', `${scroll * -48}px`);
    document.documentElement.style.setProperty('--atmosphere-intensity', String(0.9 + (Math.abs(x) * 0.08) + (scroll * 0.12)));

    const stillMoving = Math.abs(atmosphereState.pointerX - atmosphereState.currentX) > 0.002
      || Math.abs(atmosphereState.pointerY - atmosphereState.currentY) > 0.002
      || Math.abs(atmosphereState.scroll - atmosphereState.currentScroll) > 0.002;

    if (stillMoving) {
      queueAtmosphereRender();
    }
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
    const viewportHeight = window.innerHeight || 1;

    sceneControllers.forEach((controller) => {
      const rect = controller.scene.getBoundingClientRect();
      const centerOffset = (rect.top + (rect.height * 0.5) - (viewportHeight * 0.5)) / (viewportHeight * 0.85);
      controller.scrollOffset = clamp(centerOffset * -0.65, -1, 1);
      queueSceneRender(controller);
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
});
