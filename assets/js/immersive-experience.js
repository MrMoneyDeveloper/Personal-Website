import React, { Suspense, useEffect, useMemo, useRef } from 'https://esm.sh/react@19';
import { createRoot } from 'https://esm.sh/react-dom@19/client';
import { animate, hover } from 'https://esm.sh/motion@12';
import { motion, useReducedMotion, useScroll, useTransform } from 'https://esm.sh/motion@12/react?deps=react@19,react-dom@19';
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
  asset('../images/CX Bets.png'),
  asset('../images/Digify CX Helpcenter.png'),
  asset('../images/Google-Helpdesk.png')
];

const stageRoots = new Map();
const hoverCleanups = [];
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

initExperience();

function initExperience() {
  if (!document.querySelector('[data-r3f-root]')) {
    initMotionPolish();
    return;
  }

  useGLTF.preload(MODEL_URL);
  useTexture.preload(PORTAL_TEXTURES);
  useTexture.preload(PROJECT_TEXTURES);

  initMotionPolish();
  refreshStages();

  let resizeTimer = 0;
  const scheduleRefresh = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshStages, 140);
  };

  window.addEventListener('resize', scheduleRefresh, { passive: true });
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', refreshStages);
  }
}

function initMotionPolish() {
  if (!window.matchMedia('(hover: hover)').matches) {
    return;
  }

  document.querySelectorAll('.project-showcase, .repo-card, .timeline-card, .metric').forEach((card) => {
    const target = card.querySelector('.project-media') || card;
    const restingTransform = target.classList.contains('project-media')
      ? 'translate3d(0, 0, 28px)'
      : 'translate3d(0, 0, 0)';
    const hoverTransform = target.classList.contains('project-media')
      ? 'translate3d(0, -8px, 34px) scale(1.015)'
      : 'translate3d(0, -8px, 0) scale(1.015)';

    const cancel = hover(card, () => {
      animate(target, {
        transform: [restingTransform, hoverTransform]
      }, {
        duration: 0.34,
        easing: [0.16, 1, 0.3, 1],
        fill: 'forwards'
      });

      return () => {
        animate(target, {
          transform: [hoverTransform, restingTransform]
        }, {
          duration: 0.42,
          easing: [0.22, 1, 0.36, 1],
          fill: 'forwards'
        });
      };
    });

    hoverCleanups.push(cancel);
  });
}

function refreshStages() {
  const canRender = supportsWebGL() && !reducedMotionQuery.matches;
  let activeCount = 0;

  document.querySelectorAll('[data-r3f-root]').forEach((element) => {
    const stageType = element.getAttribute('data-r3f-root');
    const minWidth = stageType === 'projects-hero' ? 960 : 760;
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
  const wrapperRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [36, -34]);
  const rotateX = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [8, -6]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.88, 1], [0.84, 1, 1, 0.92]);

  return (
    React.createElement(
      motion.div,
      {
        ref: wrapperRef,
        className: `immersive-stage immersive-stage--${type}`,
        style: { y, rotateX, opacity },
        initial: { opacity: 0, scale: 0.94, filter: 'blur(14px)' },
        whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        whileHover: prefersReducedMotion ? undefined : { scale: 1.015 },
        viewport: { once: true, amount: 0.35 },
        transition: { duration: 0.82, ease: [0.16, 1, 0.3, 1] }
      },
      React.createElement(
        Canvas,
        {
          shadows: true,
          dpr: [1, 1.6],
          gl: { antialias: true, alpha: true, powerPreference: 'high-performance' },
          onCreated: ({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = type === 'hero-portal' ? 1.18 : 1.05;
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
      React.createElement(PerspectiveCamera, { makeDefault: true, position: [0, 0.3, 6.6], fov: 31 }),
      React.createElement(SceneLights, { mode: 'hero' }),
      React.createElement(CameraRig, { lookAtY: 0.15, intensity: 0.34 }),
      React.createElement(PortalRig, { scale: 0.92 }),
      React.createElement(PortalCore, { mode: 'hero' }),
      React.createElement(StageFloor, { scale: 3.8, position: [0, -2.28, 0.15] }),
      React.createElement(Sparkles, {
        count: 28,
        scale: [4.4, 5.6, 3.4],
        size: 2.3,
        speed: 0.28,
        opacity: 0.42,
        color: '#91ebff'
      }),
      React.createElement(ContactShadows, { position: [0, -2.26, 0], opacity: 0.52, scale: 8, blur: 2.8, far: 4.8 })
    )
  );
}

function ProjectArchiveScene() {
  const textures = useProjectScreens();

  return (
    React.createElement(React.Fragment, null,
      React.createElement(PerspectiveCamera, { makeDefault: true, position: [0, 0.4, 6], fov: 34 }),
      React.createElement(SceneLights, { mode: 'projects' }),
      React.createElement(CameraRig, { lookAtY: 0.18, intensity: 0.26 }),
      React.createElement(PortalRig, { scale: 0.62, position: [0, -0.15, 0] }),
      React.createElement(PortalCore, { mode: 'projects' }),
      React.createElement(FloatingCard, {
        texture: textures[0],
        position: [-1.95, 0.62, -1.15],
        rotation: [0.08, 0.44, -0.04]
      }),
      React.createElement(FloatingCard, {
        texture: textures[1],
        position: [1.92, 0.15, -1.3],
        rotation: [0.06, -0.4, 0.03]
      }),
      React.createElement(FloatingCard, {
        texture: textures[2],
        position: [0.15, 1.52, -1.7],
        rotation: [0.02, -0.02, 0]
      }),
      React.createElement(StageFloor, { scale: 3.2, position: [0, -2.05, 0.15] }),
      React.createElement(Sparkles, {
        count: 18,
        scale: [4.2, 4, 3],
        size: 2.1,
        speed: 0.24,
        opacity: 0.36,
        color: '#88dfff'
      }),
      React.createElement(ContactShadows, { position: [0, -2.04, 0], opacity: 0.42, scale: 6.5, blur: 2.5, far: 4.2 })
    )
  );
}

function SceneLights({ mode }) {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('color', { attach: 'background', args: ['#04070f'] }),
      React.createElement('fog', { attach: 'fog', args: ['#04070f', 7, 17] }),
      React.createElement('ambientLight', { intensity: mode === 'hero' ? 0.8 : 0.68, color: '#7fb9ff' }),
      React.createElement('directionalLight', {
        castShadow: true,
        position: [4.5, 6.5, 4.5],
        intensity: mode === 'hero' ? 1.9 : 1.45,
        color: '#d8f1ff',
        shadow: { mapSize: { width: 1024, height: 1024 }, bias: -0.00008 }
      }),
      React.createElement('pointLight', {
        position: [0, 0.65, 1.25],
        intensity: mode === 'hero' ? 11.5 : 7.2,
        distance: 8,
        decay: 2,
        color: '#7fe8ff'
      }),
      React.createElement('pointLight', {
        position: [0, -1.6, 1.8],
        intensity: mode === 'hero' ? 3.8 : 2.4,
        distance: 6,
        decay: 2,
        color: '#ffcc94'
      }),
      React.createElement('spotLight', {
        position: [-4.6, 5.8, 4.1],
        angle: 0.36,
        penumbra: 0.65,
        intensity: mode === 'hero' ? 2.4 : 1.75,
        color: '#97dcff'
      })
    )
  );
}

function CameraRig({ lookAtY, intensity }) {
  useFrame((state) => {
    const targetX = state.pointer.x * intensity;
    const targetY = 0.25 + (state.pointer.y * intensity * 0.8);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.06);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.06);
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
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (state.pointer.x * 0.3) + (Math.sin(t * 0.35) * 0.08), 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, (-state.pointer.y * 0.12) + (Math.cos(t * 0.28) * 0.03), 0.06);
    group.current.position.y = position[1] + (Math.sin(t * 0.72) * 0.08);
  });

  return (
    React.createElement(
      'group',
      { ref: group, position, scale },
      React.createElement(Float, { floatIntensity: 0.42, rotationIntensity: 0.18, speed: 1.1 },
        React.createElement(PortalModel, null)
      )
    )
  );
}

function PortalCore({ mode }) {
  const glowMaterial = useRef(null);

  useFrame((state) => {
    if (glowMaterial.current) {
      glowMaterial.current.opacity = 0.12 + (Math.sin(state.clock.elapsedTime * 1.5) * 0.03);
    }
  });

  return (
    React.createElement(React.Fragment, null,
      React.createElement('mesh', { position: [0, 0, -0.68] },
        React.createElement('planeGeometry', { args: [2.8, 3.95, 1, 1] }),
        React.createElement('meshBasicMaterial', { ref: glowMaterial, color: '#7de8ff', transparent: true, opacity: 0.15 })
      ),
      React.createElement('mesh', { position: [0, 0.05, -0.48], scale: mode === 'hero' ? [1.62, 3.05, 0.08] : [1.35, 2.55, 0.08] },
        React.createElement('boxGeometry', { args: [1, 1, 1] }),
        React.createElement(MeshTransmissionMaterial, {
          backside: true,
          samples: 6,
          resolution: 256,
          thickness: 0.28,
          anisotropicBlur: 0.18,
          distortion: 0.08,
          temporalDistortion: 0.08,
          roughness: 0.08,
          clearcoat: 1,
          chromaticAberration: 0.02,
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
      texture.anisotropy = 8;
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
      roughness: 0.68,
      envMapIntensity: 1.15
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
        React.createElement('circleGeometry', { args: [scale, 96] }),
        React.createElement('meshStandardMaterial', {
          color: '#0d1624',
          metalness: 0.72,
          roughness: 0.44
        })
      ),
      React.createElement('mesh', { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.02, 0] },
        React.createElement('ringGeometry', { args: [scale * 0.62, scale * 0.78, 96] }),
        React.createElement('meshBasicMaterial', { color: '#8ee9ff', transparent: true, opacity: 0.12, side: THREE.DoubleSide })
      )
    )
  );
}

function FloatingCard({ texture, position, rotation }) {
  return (
    React.createElement(Float, { floatIntensity: 0.48, rotationIntensity: 0.18, speed: 1.2 },
      React.createElement('group', { position, rotation },
        React.createElement('mesh', { position: [0, 0, -0.08], castShadow: true, receiveShadow: true },
          React.createElement('boxGeometry', { args: [1.82, 1.08, 0.12] }),
          React.createElement('meshStandardMaterial', {
            color: '#0a1320',
            metalness: 0.82,
            roughness: 0.42
          })
        ),
        React.createElement('mesh', { castShadow: true },
          React.createElement('planeGeometry', { args: [1.64, 0.92] }),
          React.createElement('meshStandardMaterial', {
            map: texture,
            color: '#ffffff',
            roughness: 0.34,
            metalness: 0.06,
            emissive: new THREE.Color('#16495e'),
            emissiveIntensity: 0.22
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
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
  }, [textures]);

  return textures;
}
