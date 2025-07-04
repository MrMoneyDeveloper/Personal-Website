// Basic Three.js setup for the home page model
// Loads a game controller model (GameController.glb) and rotates it

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('index-model');
  if (!container || !window.THREE) return;

  const spinner = document.createElement('div');
  spinner.className = 'model-loader';
  container.appendChild(spinner);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(ambient);

  // GLTF loader for GameController.glb (replace with your model file)
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/models/GameController.glb',
    gltf => {
      container.removeChild(spinner);
      const model = gltf.scene;
      model.rotation.y = Math.PI; // face forward
      scene.add(model);
      animate();
    },
    undefined,
    () => container.removeChild(spinner)
  );

  function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += 0.003;
    renderer.render(scene, camera);
  }
});