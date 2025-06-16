(function(){
  let revealSound;
  /* ---------------- GLOBAL READY ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('ready');

    const carouselEl = document.getElementById('gameCarousel');
    const carousel = carouselEl ? new bootstrap.Carousel(carouselEl, { interval: false }) : null;
    carouselEl?.addEventListener('slide.bs.carousel', () => {
      stopTetris?.();
      stopSnake?.();
      stopBreakout?.();
    });

    function sendKey(code, type='keydown') {
      const evt = new KeyboardEvent(type, { keyCode: code, which: code, bubbles: true });
      document.dispatchEvent(evt);
    }

    document.querySelectorAll('.touch-controls button').forEach(btn => {
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        sendKey(parseInt(btn.dataset.key), 'keydown');
      });
      btn.addEventListener('touchend', e => {
        e.preventDefault();
        sendKey(parseInt(btn.dataset.key), 'keyup');
      });
      btn.addEventListener('mousedown', () => sendKey(parseInt(btn.dataset.key), 'keydown'));
      btn.addEventListener('mouseup', () => sendKey(parseInt(btn.dataset.key), 'keyup'));
    });

    document.getElementById('tetris-start')?.addEventListener('click', startTetris);
    document.getElementById('tetris-stop')?.addEventListener('click', stopTetris);
    document.getElementById('snake-start')?.addEventListener('click', startSnake);
    document.getElementById('snake-stop')?.addEventListener('click', stopSnake);
    document.getElementById('breakout-start')?.addEventListener('click', startBreakout);
    document.getElementById('breakout-stop')?.addEventListener('click', stopBreakout);
  });

  /* ---------------- WINDOW LOAD ---------------- */
  window.addEventListener('load', () => {
    // Tilt on buttons & links (desktop only)
    if (window.matchMedia('(min-width: 768px)').matches) {
      VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
        max: 10, speed: 400, glare: true, 'max-glare': 0.20
      });
    }

    // Howler.js sounds
    const heroSound    = new Howl({ src: ['assets/sounds/reveal.wav'], volume: 0.5 });
    const flipSound    = new Howl({ src: ['assets/sounds/flip.wav'],   volume: 0.5 });
    const cueSound     = new Howl({ src: ['assets/sounds/cue.wav'],    volume: 0.5 });
    const gallerySound = new Howl({ src: ['assets/sounds/hover.wav'],  volume: 0.5 });
    revealSound = new Howl({ src: ['assets/sounds/reveal.wav'], volume: 0.4 });

    heroSound.play();
    document.querySelector('.scroll-cue')?.addEventListener('click', () => cueSound.play());
    document.querySelectorAll('#gallery img').forEach(img =>
      img.addEventListener('mouseenter', () => gallerySound.play())
    );

    // play revealSound on hover of our Call-to-Adventure block
    document.querySelector('#call-to-adventure')?.addEventListener('mouseenter', () => revealSound.play());
  });

  /* ---------------- tsParticles ---------------- */
  if (window.tsParticles) {
    tsParticles.load('particles-js', {
      background: { color: 'transparent' },
      particles: {
        number:  { value: 45 },
        shape:   { type: 'circle' },
        size:    { value: 2.5, random: { enable: true, minimumValue: 1 } },
        opacity: { value: 0.45, random: { enable: true, minimumValue: 0.1 } },
        move:    { enable: true, speed: 0.7, outModes: 'out' },
        color:   { value: ['#ffffff', '#d4af37'] },
      },
      detectRetina: true,
    }).catch(err => console.warn('tsParticles load failed:', err));
  } else {
    console.warn('tsParticles library not loaded');
  }

  /* ---------------- GSAP ANIMATIONS ---------------- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.registerPlugin(ScrollTrigger);

    // Hero parallax
    gsap.to('.hero-bg', {
      yPercent: 15, ease: 'none',
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Headline fade-in
    gsap.from('.hero-content', {
      opacity: 0, y: 40, duration: 1, ease: 'power2.out', delay: 0.2
    });

    // Section fade-ins + revealSound trigger
    gsap.utils.toArray('section').forEach(sec => {
      gsap.from(sec, {
        opacity: 0, y: 30, duration: 0.8,
        scrollTrigger: {
          trigger: sec,
          start: 'top 80%',
          onEnter: () => revealSound.play()
        }
      });
    });

   // Game canvas entrance
    gsap.from('#gameCarousel canvas', {
      opacity: 0, y: 40, duration: 0.6, ease: 'power1.out',
      scrollTrigger: { trigger: '#gameCarousel', start: 'top 85%' }
    });
  }
})();