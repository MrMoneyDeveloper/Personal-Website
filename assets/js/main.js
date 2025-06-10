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
  });
})();