import React, { Suspense, useEffect, useMemo, useRef } from 'https://esm.sh/react@19';
import { createRoot } from 'https://esm.sh/react-dom@19/client';
import * as THREE from 'https://esm.sh/three@0.179';
import { Canvas, useFrame } from 'https://esm.sh/@react-three/fiber?deps=react@19,react-dom@19,three@0.179';
import { ContactShadows, Float, MeshTransmissionMaterial, PerspectiveCamera, Sparkles, useGLTF, useTexture } from 'https://esm.sh/@react-three/drei?deps=react@19,react-dom@19,three@0.179,@react-three/fiber';

const asset = (path) => new URL(path, import.meta.url).toString();
const MODEL_URL = asset('../models/digital_portal.glb');
const PORTAL_TEXTURES = [
  asset('../textures/polyhaven/blue-metal-plate/blue_metal_plate_diff_1k.jpg'),
  asset('../textures/polyhaven/blue-metal-plate/blue_metal_plate_nor_gl_1k.jpg'),
  asset('../textures/polyhaven/blue-metal-plate/blue_metal_plate_arm_1k.jpg')
];
const PROJECT_TEXTURES = [
  asset('../images/optimized/CX-Bets-1280.jpg'),
  asset('../images/optimized/Digify-CX-1200.jpg'),
  asset('../images/Google-Helpdesk.png')
];
const stageRoots = new Map();
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

initExperience();

function initExperience() {
  const stageNodes = document.querySelectorAll('[data-r3f-root]');

  if (!stageNodes.length || reducedMotionQuery.matches || window.innerWidth < 1100 || !supportsWebGL()) {
    return;
  }

  useGLTF.preload(MODEL_URL);
  useTexture.preload(PORTAL_TEXTURES);

  mountStages();

  window.addEventListener('resize', debounce(mountStages, 180), { passive: true });
}

function mountStages() {
  const canRender = !reducedMotionQuery.matches && supportsWebGL() && window.innerWidth >= 1100;
  let activeCount = 0;

  document.querySelectorAll('[data-r3f-root]').forEach((element) => {
    const stageType = element.getAttribute('data-r3f-root');
    const minWidth = stageType === 'projects-hero' ? 1180 : 1100;
    const enabled = canRender && window.innerWidth >= minWidth;

    if (enabled) {
      activeCount += 1;
    }

    if (enabled && !stageRoots.has(element)) {
      const root = createRoot(element);
      root.render(React.createElement(StageMount, { type: stageType }));
      stageRoots.set(element, root);
      element.classList.add('is-mounted');
    } else if (!enabled && stageRoots.has(element)) {
      stageRoots.get(element).unmount();
      stageRoots.delete(element);
      element.classList.remove('is-mounted');
    }
  });

  document.documentElement.classList.toggle('has-webgl-experience', activeCount > 0);
}

function supportsWebGL() {
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
}

function StageMount({ type }) {
  return (
    React.createElement(
      'div',
      { className: `immersive-stage immersive-stage--${type}` },
      React.createElement(
        Canvas,
        {
          dpr: [1, 1.25],
          shadows: true,
          gl: { antialias: false, alpha: true, powerPreference: 'high-performance' },
          camera: { position: [0, 0.3, type === 'hero-portal' ? 6.45 : 5.85], fov: type === 'hero-portal' ? 31 : 34 },
          onCreated: ({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = type === 'hero-portal' ? 1.1 : 1.02;
            gl.setClearColor(0x000000, 0);
          }
        },
        React.createElement(Suspense, { fallback: null }, type === 'hero-portal'
          ? React.createElement(HeroPortalScene)
          : React.createElement(ProjectArchiveScene)
        )
      )
    )
  );
}

function HeroPortalScene() {
  return (
    React.createElement(React.Fragment, null,
      React.createElement(PerspectiveCamera, { makeDefault: true, position: [0, 0.28, 6.45], fov: 31 }),
      React.createElement(SceneLights, { mode: 'hero' }),
      React.createElement(CameraRig, { lookAtY: 0.14, intensity: 0.22 }),
      React.createElement(PortalRig, { scale: 0.9 }),
      React.createElement(PortalCore, { mode: 'hero' }),
      React.createElement(StageFloor, { scale: 3.6, position: [0, -2.24, 0.1] }),
      React.createElement(Sparkles, {
        count: 16,
        scale: [3.8, 4.8, 2.8],
        size: 2,
        speed: 0.18,
        opacity: 0.25,
        color: '#91ebff'
      }),
      React.createElement(ContactShadows, { position: [0, -2.22, 0], opacity: 0.36, scale: 7.4, blur: 2.2, far: 4.4 })
    )
  );
}

function ProjectArchiveScene() {
  const textures = useProjectScreens();

  return (
    React.createElement(React.Fragment, null,
      React.createElement(PerspectiveCamera, { makeDefault: true, position: [0, 0.34, 5.9], fov: 34 }),
      React.createElement(SceneLights, { mode: 'projects' }),
      React.createElement(CameraRig, { lookAtY: 0.18, intensity: 0.14 }),
      React.createElement(PortalRig, { scale: 0.56, position: [0, -0.18, 0] }),
      React.createElement(PortalCore, { mode: 'projects' }),
      React.createElement(FloatingCard, {
        texture: textures[0],
        position: [-1.8, 0.56, -1.02],
        rotation: [0.08, 0.4, -0.04]
      }),
      React.createElement(FloatingCard, {
        texture: textures[1],
        position: [1.76, 0.18, -1.2],
        rotation: [0.05, -0.38, 0.03]
      }),
      React.createElement(FloatingCard, {
        texture: textures[2],
        position: [0.12, 1.34, -1.52],
        rotation: [0.02, -0.02, 0]
      }),
      React.createElement(StageFloor, { scale: 3, position: [0, -2, 0.1] }),
      React.createElement(Sparkles, {
        count: 10,
        scale: [3.8, 3.8, 2.6],
        size: 1.7,
        speed: 0.14,
        opacity: 0.18,
        color: '#88dfff'
      }),
      React.createElement(ContactShadows, { position: [0, -1.98, 0], opacity: 0.28, scale: 6, blur: 2, far: 3.8 })
    )
  );
}

function SceneLights({ mode }) {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('color', { attach: 'background', args: ['#04070f'] }),
      React.createElement('fog', { attach: 'fog', args: ['#04070f', 7, 16] }),
      React.createElement('ambientLight', { intensity: mode === 'hero' ? 0.7 : 0.58, color: '#7fb9ff' }),
      React.createElement('directionalLight', {
        castShadow: true,
        position: [4.2, 5.8, 4.5],
        intensity: mode === 'hero' ? 1.45 : 1.18,
        color: '#d8f1ff',
        shadow: { mapSize: { width: 768, height: 768 }, bias: -0.00008 }
      }),
      React.createElement('pointLight', {
        position: [0, 0.65, 1.22],
        intensity: mode === 'hero' ? 7.2 : 4.4,
        distance: 7,
        decay: 2,
        color: '#7fe8ff'
      }),
      React.createElement('pointLight', {
        position: [0, -1.48, 1.72],
        intensity: mode === 'hero' ? 2.2 : 1.4,
        distance: 5.6,
        decay: 2,
        color: '#ffcc94'
      })
    )
  );
}

function CameraRig({ lookAtY, intensity }) {
  useFrame((state) => {
    const targetX = state.pointer.x * intensity;
    const targetY = 0.24 + (state.pointer.y * intensity * 0.75);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.04);
    state.camera.lookAt(0, lookAtY, 0);
  });

  return null;
}

function PortalRig({ scale, position = [0, 0, 0] }) {
  const group = useRef(null);

  useFrame((state) => {
    if (!group.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (state.pointer.x * 0.18) + (Math.sin(t * 0.28) * 0.05), 0.04);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, (-state.pointer.y * 0.08) + (Math.cos(t * 0.22) * 0.02), 0.04);
    group.current.position.y = position[1] + (Math.sin(t * 0.62) * 0.05);
  });

  return (
    React.createElement(
      'group',
      { ref: group, position, scale },
      React.createElement(Float, { floatIntensity: 0.24, rotationIntensity: 0.12, speed: 0.8 },
        React.createElement(PortalModel, null)
      )
    )
  );
}

function PortalCore({ mode }) {
  const glowMaterial = useRef(null);

  useFrame((state) => {
    if (glowMaterial.current) {
      glowMaterial.current.opacity = 0.1 + (Math.sin(state.clock.elapsedTime * 1.2) * 0.02);
    }
  });

  return (
    React.createElement(React.Fragment, null,
      React.createElement('mesh', { position: [0, 0, -0.68] },
        React.createElement('planeGeometry', { args: [2.6, 3.6, 1, 1] }),
        React.createElement('meshBasicMaterial', { ref: glowMaterial, color: '#7de8ff', transparent: true, opacity: 0.12 })
      ),
      React.createElement('mesh', { position: [0, 0.05, -0.48], scale: mode === 'hero' ? [1.5, 2.9, 0.08] : [1.26, 2.38, 0.08] },
        React.createElement('boxGeometry', { args: [1, 1, 1] }),
        React.createElement(MeshTransmissionMaterial, {
          backside: true,
          samples: 4,
          resolution: 128,
          thickness: 0.24,
          anisotropicBlur: 0.14,
          distortion: 0.05,
          temporalDistortion: 0.05,
          roughness: 0.1,
          clearcoat: 1,
          chromaticAberration: 0.015,
          color: '#8ce6ff',
          attenuationColor: '#7be4ff',
          attenuationDistance: 0.9
        })
      )
    )
  );
}

function PortalModel() {
  const { scene } = useGLTF(MODEL_URL);
  const [colorMap, normalMap, armMap] = useTexture(PORTAL_TEXTURES);

  const portal = useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    [colorMap, normalMap, armMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });

    const material = new THREE.MeshStandardMaterial({
      color: '#c9defd',
      map: colorMap,
      normalMap,
      aoMap: armMap,
      metalnessMap: armMap,
      roughnessMap: armMap,
      metalness: 1,
      roughness: 0.7,
      envMapIntensity: 1.05
    });

    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry?.attributes?.uv && !child.geometry.attributes.uv2) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }

        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }, [scene, colorMap, normalMap, armMap]);

  return React.createElement('primitive', { object: portal });
}

function StageFloor({ scale, position }) {
  return (
    React.createElement('group', { position },
      React.createElement('mesh', { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true },
        React.createElement('circleGeometry', { args: [scale, 80] }),
        React.createElement('meshStandardMaterial', {
          color: '#0d1624',
          metalness: 0.68,
          roughness: 0.46
        })
      ),
      React.createElement('mesh', { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.02, 0] },
        React.createElement('ringGeometry', { args: [scale * 0.62, scale * 0.78, 80] }),
        React.createElement('meshBasicMaterial', { color: '#8ee9ff', transparent: true, opacity: 0.09, side: THREE.DoubleSide })
      )
    )
  );
}

function FloatingCard({ texture, position, rotation }) {
  return (
    React.createElement(Float, { floatIntensity: 0.22, rotationIntensity: 0.1, speed: 0.8 },
      React.createElement('group', { position, rotation },
        React.createElement('mesh', { position: [0, 0, -0.08], castShadow: true, receiveShadow: true },
          React.createElement('boxGeometry', { args: [1.82, 1.08, 0.12] }),
          React.createElement('meshStandardMaterial', {
            color: '#0a1320',
            metalness: 0.8,
            roughness: 0.42
          })
        ),
        React.createElement('mesh', { castShadow: true },
          React.createElement('planeGeometry', { args: [1.64, 0.92] }),
          React.createElement('meshStandardMaterial', {
            map: texture,
            color: '#ffffff',
            roughness: 0.36,
            metalness: 0.05,
            emissive: new THREE.Color('#12394d'),
            emissiveIntensity: 0.12
          })
        )
      )
    )
  );
}

function useProjectScreens() {
  const textures = useTexture(PROJECT_TEXTURES);

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });
  }, [textures]);

  return textures;
}

function debounce(callback, delay) {
  let timer = 0;

  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(callback, delay);
  };
}
