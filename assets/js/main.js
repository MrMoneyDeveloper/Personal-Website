// Global site enhancements: sound & tilt effects
// Requires Howler.js and GSAP already loaded

(function(){
  document.addEventListener('DOMContentLoaded', function(){
    // ---- Click sound ----
    var clickSound = new Howl({
      src: ['assets/sounds/click.wav'],
      volume: 0.4
    });
    document.body.addEventListener('click', function(e){
      if(e.target.closest('a, button')) {
        clickSound.play();
      }
    });

    // ---- Hover sound placeholder ----
    var hoverSound = new Howl({ src: ['assets/sounds/hover.wav'], volume: 0.4 });
    document.querySelectorAll('a, button').forEach(function(el){
      el.addEventListener('mouseenter', function(){ hoverSound.play(); });
    });

    // ---- Tilt effect ----
    document.querySelectorAll('[data-tilt]').forEach(function(el){
      var height = el.clientHeight;
      var width  = el.clientWidth;
      el.addEventListener('mousemove', function(ev){
        var x = (ev.offsetX - width/2) / width * 20;
        var y = (ev.offsetY - height/2) / height * -20;
        el.style.transform = 'rotateX(' + y + 'deg) rotateY(' + x + 'deg)';
      });
      el.addEventListener('mouseleave', function(){
        el.style.transform = '';
      });
    });

    // ---- Hero parallax depth ----
    var heroBg = document.querySelector('.hero-bg');
    if(heroBg && window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(heroBg, {
        scale: 1.1,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
    
    // ---- Particles effect ----
    var particleEl = document.getElementById('particles-js');
    if(particleEl && window.tsParticles){
      tsParticles.load('particles-js', {
        background: { color: 'transparent' },
        particles: {
          number:  { value: 40 },
          shape:   { type: 'circle' },
          size:    { value: 2.5, random: { enable: true, minimumValue: 1 } },
          opacity: { value: 0.5, random: { enable: true, minimumValue: 0.1 } },
          move:    { enable: true, speed: 0.6, outModes: 'out' },
          color:   { value: ['#ffffff', '#d4af37'] }
        },
        interactivity: {
          events: { onhover: { enable: true, mode: 'repulse' } },
          modes:  { repulse: { distance: 100 } }
        },
        detectRetina: true
      }).catch(function(err){
        console.warn('tsParticles load failed:', err);
      });
    }

    // ---- Scroll reveal animations ----
    if(window.gsap && window.ScrollTrigger){
      gsap.utils.toArray('.reveal-on-scroll').forEach(function(el){
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });
    }
     if(window.ScrollTrigger){
      ScrollTrigger.refresh();
    }
  });
})();

window.addEventListener('load', function(){
  if(window.ScrollTrigger){
    ScrollTrigger.refresh(true);
    // mobile browsers sometimes need an extra tick
    setTimeout(function(){ ScrollTrigger.refresh(true); }, 200);
  }
});

window.addEventListener('orientationchange', function(){
  if(window.ScrollTrigger){
    setTimeout(function(){ ScrollTrigger.refresh(true); }, 200);
  }
});