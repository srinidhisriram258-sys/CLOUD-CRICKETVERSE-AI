import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FielderPosition } from '../types';
import { Eye, RotateCcw, Target, Play, Pause, Compass, Layers } from 'lucide-react';

interface CricketGround3DProps {
  fielders: FielderPosition[];
  onSelectFielder?: (fielder: FielderPosition) => void;
  selectedFielderId?: number | null;
  ballTrajectory?: { x: number; y: number; z: number; frame: number }[] | null;
  showHeatmap?: boolean;
  highlightZone?: string | null;
}

export const CricketGround3D: React.FC<CricketGround3DProps> = ({
  fielders,
  onSelectFielder,
  selectedFielderId,
  ballTrajectory,
  showHeatmap = false,
  highlightZone = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraView, setCameraView] = useState<'broadcast' | 'bowler' | 'bird' | 'batter'>('broadcast');
  const [isPlayingBall, setIsPlayingBall] = useState(true);
  const [webGLError, setWebGLError] = useState(false);
  const [hoveredFielder, setHoveredFielder] = useState<FielderPosition | null>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const fielderMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const ballTrailRef = useRef<THREE.Line | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLError(true);
        return;
      }
    } catch (e) {
      setWebGLError(true);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080b15);
    scene.fog = new THREE.FogExp2(0x080b15, 0.008);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 48, 62);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Do not go below ground
    controls.minDistance = 15;
    controls.maxDistance = 160;
    controls.target.set(0, 0, 0);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xdcf0ff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 180;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 4 Stadium Floodlight Towers with soft emissive colored light
    const floodlightPositions = [
      [-65, 38, -65],
      [65, 38, -65],
      [-65, 38, 65],
      [65, 38, 65]
    ];
    floodlightPositions.forEach(([fx, fy, fz]) => {
      const pLight = new THREE.PointLight(0xa855f7, 0.9, 120, 1.5);
      pLight.position.set(fx, fy, fz);
      scene.add(pLight);

      // Tower truss
      const towerGeo = new THREE.CylinderGeometry(0.5, 1.2, fy, 6);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e2438, metalness: 0.8, roughness: 0.3 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(fx, fy / 2, fz);
      scene.add(tower);

      // Tower Lamp Head
      const lampGeo = new THREE.BoxGeometry(4, 3, 2);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, emissive: 0xa855f7, emissiveIntensity: 0.8 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(fx, fy, fz);
      lamp.lookAt(0, 0, 0);
      scene.add(lamp);
    });

    // Outer Stadium Tiered Seating Bowl
    const stadiumOuterGeo = new THREE.CylinderGeometry(76, 68, 14, 64, 1, true);
    const stadiumOuterMat = new THREE.MeshStandardMaterial({
      color: 0x11162b,
      roughness: 0.8,
      side: THREE.BackSide
    });
    const stadium = new THREE.Mesh(stadiumOuterGeo, stadiumOuterMat);
    stadium.position.y = 7;
    scene.add(stadium);

    // Tiered stadium ring stripes (purple/cyan ambient seat glow)
    const seatRingGeo = new THREE.RingGeometry(67.5, 75, 64);
    const seatRingMat = new THREE.MeshBasicMaterial({ color: 0x1c2444, side: THREE.DoubleSide });
    const seatRing = new THREE.Mesh(seatRingGeo, seatRingMat);
    seatRing.rotation.x = -Math.PI / 2;
    seatRing.position.y = 13.9;
    scene.add(seatRing);

    // Turf Oval (Lawn mower alternating striping)
    const turfGeo = new THREE.CircleGeometry(65, 64);
    const turfMat = new THREE.MeshStandardMaterial({
      color: 0x184a2c,
      roughness: 0.85,
      metalness: 0.05
    });
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.rotation.x = -Math.PI / 2;
    turf.receiveShadow = true;
    scene.add(turf);

    // Concentric mower stripes for authentic cricket ground turf pattern
    [15, 30, 45, 60].forEach((radius, i) => {
      const stripeGeo = new THREE.RingGeometry(radius - 5, radius, 64);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x1e5a36 : 0x154326,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.y = 0.02;
      scene.add(stripe);
    });

    // 30-Yard Circle (white dotted ring)
    const circle30Geo = new THREE.RingGeometry(27.3, 27.6, 64);
    const circle30Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const circle30 = new THREE.Mesh(circle30Geo, circle30Mat);
    circle30.rotation.x = -Math.PI / 2;
    circle30.position.y = 0.03;
    scene.add(circle30);

    // Boundary Rope & Cushions
    const ropeGeo = new THREE.TorusGeometry(64, 0.4, 8, 64);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4, emissive: 0x06b6d4, emissiveIntensity: 0.2 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.25;
    scene.add(rope);

    // Pitch Strip (Clay/Turf center rectangle, 20.12m x 3.05m)
    const pitchGeo = new THREE.PlaneGeometry(3.6, 22.0);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xc4a36d, // Clay soil hue
      roughness: 0.9,
      metalness: 0.05
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0.04, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Crease Markings (Popping crease, bowling crease, return creases at both ends)
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-10.06, 10.06].forEach((zPos) => {
      // Bowling crease
      const bCreaseGeo = new THREE.PlaneGeometry(2.64, 0.08);
      const bCrease = new THREE.Mesh(bCreaseGeo, creaseMat);
      bCrease.rotation.x = -Math.PI / 2;
      bCrease.position.set(0, 0.05, zPos);
      scene.add(bCrease);

      // Popping crease (1.22m in front)
      const pOffset = zPos > 0 ? -1.22 : 1.22;
      const pCreaseGeo = new THREE.PlaneGeometry(3.6, 0.08);
      const pCrease = new THREE.Mesh(pCreaseGeo, creaseMat);
      pCrease.rotation.x = -Math.PI / 2;
      pCrease.position.set(0, 0.05, zPos + pOffset);
      scene.add(pCrease);

      // Return creases
      [-1.32, 1.32].forEach((xSide) => {
        const rCreaseGeo = new THREE.PlaneGeometry(0.08, 1.4);
        const rCrease = new THREE.Mesh(rCreaseGeo, creaseMat);
        rCrease.rotation.x = -Math.PI / 2;
        rCrease.position.set(xSide, 0.05, zPos + pOffset / 2);
        scene.add(rCrease);
      });
    });

    // 3D Wooden Wickets (Stumps & Bails) at both ends
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0xdfad6b, roughness: 0.5 });
    const bailMat = new THREE.MeshStandardMaterial({ color: 0xdfad6b, roughness: 0.4 });
    [-10.06, 10.06].forEach((zPos) => {
      [-0.11, 0, 0.11].forEach((xOff) => {
        const stumpGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.75, 8);
        const stump = new THREE.Mesh(stumpGeo, stumpMat);
        stump.position.set(xOff, 0.38, zPos);
        stump.castShadow = true;
        scene.add(stump);
      });
      // Bails
      const bailGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 6);
      const bail = new THREE.Mesh(bailGeo, bailMat);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(0, 0.76, zPos);
      scene.add(bail);
    });

    // Batters & Umpire models
    // Striker at z = 9.0
    const strikerGroup = createPlayerMesh('Striker (Batting)', 0x22d3ee, true);
    strikerGroup.position.set(0.2, 0, 8.8);
    scene.add(strikerGroup);

    // Non-Striker at z = -9.2
    const nonStrikerGroup = createPlayerMesh('Non-Striker', 0x22d3ee, false);
    nonStrikerGroup.position.set(-1.2, 0, -9.2);
    scene.add(nonStrikerGroup);

    // Bowler's end Umpire at z = -12.5
    const umpireGroup = createPlayerMesh('Umpire', 0xf1f5f9, false);
    umpireGroup.position.set(0, 0, -12.5);
    scene.add(umpireGroup);

    // Animated Ball Mesh
    const ballGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.4
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.position.set(0, 1.8, -10.0);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Raycaster for fielder selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const clickableObjects: THREE.Object3D[] = [];
      fielderMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) clickableObjects.push(child);
        });
      });

      const intersects = raycaster.intersectObjects(clickableObjects);
      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.fielderId && parentGroup.parent) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.fielderId) {
          const fielderId = parentGroup.userData.fielderId;
          const found = fielders.find((f) => f.id === fielderId);
          if (found && onSelectFielder) {
            onSelectFielder(found);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation loop
    let ballClock = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // Animate Ball Delivery if playing
      if (ballMeshRef.current && isPlayingBall) {
        ballClock += 0.02;
        const cycle = ballClock % 3.0; // 3-second loop
        if (cycle < 1.4) {
          // Delivery flight: z from -10 to +8.8
          const progress = cycle / 1.4;
          const z = -10.0 + progress * 18.8;
          let y = 1.8;
          let x = -0.1 + progress * 0.2;

          // Parabolic bounce around progress = 0.65 (z ~ 2.2)
          if (progress < 0.65) {
            const p1 = progress / 0.65;
            y = 2.0 - 1.95 * (p1 * p1); // drops to 0.05
          } else {
            const p2 = (progress - 0.65) / 0.35;
            y = 0.05 + 0.85 * Math.sin(p2 * Math.PI / 2); // rises to 0.9m
          }
          ballMeshRef.current.position.set(x, Math.max(0.08, y), z);
        } else if (cycle < 2.5) {
          // Off-drive shot off the bat racing to Cover boundary!
          const shotProgress = (cycle - 1.4) / 1.1;
          const x = 0.1 + shotProgress * 42.0; // flies towards cover
          const z = 8.8 + shotProgress * 12.0;
          const y = 0.7 * Math.sin(shotProgress * Math.PI) * (1 - shotProgress) + 0.1;
          ballMeshRef.current.position.set(x, Math.max(0.08, y), z);
        } else {
          // Pause and reset
          ballMeshRef.current.position.set(0, 1.8, -10.0);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Helper to construct low-poly stylized cricket player model
  function createPlayerMesh(name: string, accentColor: number, hasBat: boolean = false): THREE.Group {
    const group = new THREE.Group();
    group.userData = { name };

    // Glowing base ring
    const ringGeo = new THREE.RingGeometry(0.7, 0.9, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: accentColor, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);

    // Torso (Jersey)
    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.85, 8);
    const torsoMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Head / Cap / Helmet
    const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    // Legs (Pads/Trousers)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    [-0.12, 0.12].forEach((lx) => {
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.45, 0);
      leg.castShadow = true;
      group.add(leg);
    });

    // Bat if applicable
    if (hasBat) {
      const batGeo = new THREE.BoxGeometry(0.1, 0.8, 0.03);
      const batMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
      const bat = new THREE.Mesh(batGeo, batMat);
      bat.position.set(0.35, 0.65, 0.2);
      bat.rotation.x = 0.25;
      group.add(bat);
    }

    return group;
  }

  // Update Fielder Meshes when fielders prop changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous fielder meshes
    fielderMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    fielderMeshesRef.current.clear();

    fielders.forEach((f) => {
      const isSelected = selectedFielderId === f.id;
      const color = isSelected ? 0x22d3ee : (f.role === 'Keeper' ? 0xf59e0b : 0xa855f7);
      const mesh = createPlayerMesh(f.name, color);
      mesh.position.set(f.x, 0, f.z);
      mesh.userData = { fielderId: f.id, label: f.label };

      // Add label sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.9)' : 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect(0, 0, 256, 64, 16);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(f.label, 128, 40);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 2.3, 0);
      sprite.scale.set(4, 1, 1);
      mesh.add(sprite);

      scene.add(mesh);
      fielderMeshesRef.current.set(f.id, mesh);
    });
  }, [fielders, selectedFielderId]);

  // Camera Presets
  const handleSwitchCamera = (view: 'broadcast' | 'bowler' | 'bird' | 'batter') => {
    setCameraView(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'broadcast') {
      camera.position.set(0, 48, 62);
      controls.target.set(0, 0, 0);
    } else if (view === 'bowler') {
      camera.position.set(0, 8, -26);
      controls.target.set(0, 1.2, 10);
    } else if (view === 'bird') {
      camera.position.set(0, 95, 0.1);
      controls.target.set(0, 0, 0);
    } else if (view === 'batter') {
      camera.position.set(0.3, 1.6, 9.5);
      controls.target.set(0, 1.5, -12);
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden glass-panel border border-purple-500/20 shadow-2xl">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Fallback if device lacks hardware acceleration */}
      {webGLError && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
          <Layers className="w-12 h-12 text-cyan-400 mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Tactical 2D Ground View</h3>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            WebGL acceleration is inactive. Rendering tactical 2D vector field layout with active fielder markers.
          </p>
          <div className="relative w-72 h-72 rounded-full border-2 border-dashed border-purple-500/40 bg-emerald-950/30 flex items-center justify-center">
            <div className="w-6 h-28 bg-amber-700/60 rounded border border-amber-400/50" />
            {fielders.map((f) => (
              <div
                key={f.id}
                style={{
                  left: `${50 + (f.x / 65) * 45}%`,
                  top: `${50 + (f.z / 65) * 45}%`,
                }}
                className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedFielderId === f.id ? 'bg-cyan-400 ring-4 ring-cyan-400/40' : 'bg-purple-500'
                }`}
                title={f.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Viewport Control Bar */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 bg-slate-950/70 backdrop-blur-md p-1.5 rounded-lg border border-white/10 z-10">
        <span className="text-xs font-semibold px-2 text-slate-400 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-purple-400" /> Camera:
        </span>
        <button
          onClick={() => handleSwitchCamera('broadcast')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
            cameraView === 'broadcast' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Broadcast
        </button>
        <button
          onClick={() => handleSwitchCamera('bowler')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
            cameraView === 'bowler' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Bowler's View
        </button>
        <button
          onClick={() => handleSwitchCamera('batter')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
            cameraView === 'batter' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Batter POV
        </button>
        <button
          onClick={() => handleSwitchCamera('bird')}
          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
            cameraView === 'bird' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          2D Tactical
        </button>
      </div>

      {/* Trajectory Play / Pause & Telemetry */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-10">
        <button
          onClick={() => setIsPlayingBall(!isPlayingBall)}
          className="flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 transition"
        >
          {isPlayingBall ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlayingBall ? 'Pause Trajectory' : 'Replay Delivery'}
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <span className="text-xs font-mono text-purple-300">138.4 kph</span>
      </div>

      {/* Selected Fielder Pill / Telemetry Drawer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 pointer-events-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            {selectedFielderId
              ? `Selected: ${fielders.find((f) => f.id === selectedFielderId)?.label || 'Fielder'}`
              : 'Click any fielder marker to inspect or drag position'}
          </span>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto text-[11px] text-slate-400 flex items-center gap-2">
          <span>Boundary: <b className="text-white">65m</b></span>
          <span>•</span>
          <span>Pitch: <b className="text-white">22 yds</b></span>
          <span>•</span>
          <span>Fielders Out: <b className="text-purple-400">{fielders.filter(f => Math.sqrt(f.x*f.x + f.z*f.z) > 27.4).length} / 5</b></span>
        </div>
      </div>
    </div>
  );
};
