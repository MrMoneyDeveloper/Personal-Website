(function(){
  function init(){
    if(!window.Zdog) return;

    var size = 120;
    var canvas = document.createElement('canvas');
    canvas.id = 'zdog-canvas';
    canvas.width = size;
    canvas.height = size;
    canvas.style.position = 'fixed';
    canvas.style.zIndex = '5000';
    canvas.style.cursor = 'grab';

    // Random location within viewport
    var x = Math.floor(Math.random() * (window.innerWidth - size));
    var y = Math.floor(Math.random() * (window.innerHeight - size));
    canvas.style.left = x + 'px';
    canvas.style.top = y + 'px';

    document.body.appendChild(canvas);

    var illo = new Zdog.Illustration({
      element: canvas,
      dragRotate: true,
      resize: true,
      zoom: 1.2
    });

    var shapeName = document.body.dataset.zdogShape || 'box';
    switch(shapeName.toLowerCase()){
      case 'box':
        new Zdog.Box({ addTo: illo, width: 40, height: 40, depth: 40, stroke: false, color: '#C25', fill: true });
        break;
      case 'cone':
        new Zdog.Cone({ addTo: illo, diameter: 60, length: 60, stroke: false, color: '#E62', fill: true });
        break;
      case 'cylinder':
        new Zdog.Cylinder({ addTo: illo, diameter: 60, length: 60, stroke: false, color: '#EA0', fill: true });
        break;
      case 'ellipse':
        new Zdog.Ellipse({ addTo: illo, diameter: 60, stroke: 20, color: '#636', fill: true });
        break;
      case 'roundedrect':
        new Zdog.RoundedRect({ addTo: illo, width: 60, height: 40, stroke: 20, cornerRadius: 12, color: '#0BC', fill: true });
        break;
      case 'hemisphere':
        new Zdog.Hemisphere({ addTo: illo, diameter: 60, stroke: false, color: '#19F', backface: '#636', fill: true });
        break;
      default:
        new Zdog.Box({ addTo: illo, width: 40, height: 40, depth: 40, stroke: false, color: '#C25', fill: true });
    }

    function animate(){
      illo.rotate.y += 0.03;
      illo.updateRenderGraph();
      requestAnimationFrame(animate);
    }
    animate();
  }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();