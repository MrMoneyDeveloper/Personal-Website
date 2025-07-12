(function(){
function createCanvas(){
    var canvas = document.createElement('canvas');
    canvas.className = 'zdog-canvas';
    canvas.width = 120;
    canvas.height = 120;
    canvas.style.cursor = 'grab';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto 1rem';
    return canvas;
  }

    function spin(illo){
    (function animate(){
      illo.rotate.y += 0.03;
      illo.updateRenderGraph();
      requestAnimationFrame(animate);
    })();
  }

     function addOShape(target){
    var canvas = createCanvas();
    target.insertBefore(canvas, target.firstChild);

   var illo = new Zdog.Illustration({ element: canvas, dragRotate: true, resize: false, zoom: 1.2 });
    new Zdog.Ellipse({ addTo: illo, diameter: 60, stroke: 12, color: '#d4af37' });
    for(var i=0;i<8;i++){
      new Zdog.Shape({
        addTo: illo,
        path: [ {x:0,y:0}, {x:0,y:-36} ],
        stroke: 4,
        color: '#d4af37',
        rotate: { z: (Math.PI*2/8)*i }
      });
    }
    spin(illo);
  }

      function addVShape(target){
    var canvas = createCanvas();
    target.insertBefore(canvas, target.firstChild);

   var illo = new Zdog.Illustration({ element: canvas, dragRotate: true, resize: false, zoom: 1.2 });
    new Zdog.Cone({ addTo: illo, diameter: 60, length: 60, stroke: false, color: '#d4af37', fill: true, rotate:{x:Math.PI} });
    spin(illo);
  }

      function init(){
    if(!window.Zdog){
      console.warn('Zdog library failed to load');
      return;
    }

    var hero = document.querySelector('.hero-content');
    if(hero){
      var path = location.pathname.replace(/^\/+|\/+$/g,'');
      var isHome = path === '' || path.endsWith('index.html');
      if(isHome) addVShape(hero); else addOShape(hero);
    }
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();