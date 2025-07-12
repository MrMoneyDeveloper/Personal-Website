(function(){
  function init(){
    if (!window.Zdog) {
      console.warn('Zdog library failed to load');
      return;
    }

    var cards = document.querySelectorAll('.card');
    if (!cards.length) return;

    var used = [];
    var maxShapes = Math.min(3, cards.length);
    for (var s = 0; s < maxShapes; s++) {
      var idx;
      do {
        idx = Math.floor(Math.random() * cards.length);
      } while (used.includes(idx));
      used.push(idx);

    var canvas = document.createElement('canvas');
      canvas.className = 'zdog-canvas';
      canvas.width = 120;
      canvas.height = 120;
      canvas.style.cursor = 'grab';
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto 1rem';

      cards[idx].insertBefore(canvas, cards[idx].firstChild);

    var illo = new Zdog.Illustration({
        element: canvas,
        dragRotate: true,
        resize: false,
        zoom: 1.2
      });

      var shapeName = document.body.dataset.zdogShape || 'box';
      switch(shapeName.toLowerCase()){
        case 'box':
          new Zdog.Box({ addTo: illo, width: 40, height: 40, depth: 40, stroke: false, color: '#d4af37', fill: true });
          break;
        case 'cone':
          new Zdog.Cone({ addTo: illo, diameter: 60, length: 60, stroke: false, color: '#d4af37', fill: true });
          break;
        case 'cylinder':
          new Zdog.Cylinder({ addTo: illo, diameter: 60, length: 60, stroke: false, color: '#d4af37', fill: true });
          break;
        case 'ellipse':
          new Zdog.Ellipse({ addTo: illo, diameter: 60, stroke: 20, color: '#d4af37', fill: true });
          break;
        case 'roundedrect':
          new Zdog.RoundedRect({ addTo: illo, width: 60, height: 40, stroke: 20, cornerRadius: 12, color: '#d4af37', fill: true });
          break;
        case 'hemisphere':
          new Zdog.Hemisphere({ addTo: illo, diameter: 60, stroke: false, color: '#d4af37', backface: '#4b4b4b', fill: true });
          break;
        default:
          new Zdog.Box({ addTo: illo, width: 40, height: 40, depth: 40, stroke: false, color: '#d4af37', fill: true });
      }

   (function animate(){
        illo.rotate.y += 0.03;
        illo.updateRenderGraph();
        requestAnimationFrame(animate);
      })();
    }
  }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();