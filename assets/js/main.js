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

 // ---- Ensure ScrollTrigger registered for any page using GSAP ----
    if(window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
    }


    // ---- Hero parallax depth ----
    var heroBg = document.querySelector('.hero-bg');
    if(heroBg && window.gsap && window.ScrollTrigger){
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
    
 // ---- Particles effect removed ----

 // ---- Vanta Topology background ----
    if(window.VANTA){
      document.querySelectorAll('#vanta-bg').forEach(function(el){
        VANTA.TOPOLOGY({
          el: el,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xf6f6aa,
          backgroundColor: 0x222121
        });
      });
    }

    // ---- Scroll reveal animations ----
    if(window.gsap && window.ScrollTrigger){
      gsap.utils.toArray('.reveal-on-scroll').forEach(function(el){
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.8,
           scrollTrigger: { trigger: el, start: 'top 85%' },
          immediateRender: false
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