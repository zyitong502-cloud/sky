import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

// Helper to generate a soft glow texture programmatically
const generateCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); 
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); 
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

// 1. Distant Background Stars / Dust
const BackgroundStars = () => {
  const count = 2000;
  const ref = useRef<THREE.Points>(null);
  const theme = useStore(state => state.theme);
  const gamePhase = useStore(state => state.gamePhase);

  // Store original random values to re-compute colors dynamically
  const randoms = useMemo(() => {
     return new Float32Array(count).map(() => Math.random());
  }, []);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 150 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);
  
  // Dynamic colors buffer
  const colors = useMemo(() => new Float32Array(count * 3), []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.015;
      ref.current.rotation.z += delta * 0.005;

      const mat = ref.current.material as THREE.PointsMaterial;
      if (gamePhase === 'ASCENDING' || gamePhase === 'ENDED') {
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta);
      } else {
          mat.opacity = 0.8;
      }

      // Update colors based on current theme
      const cPrimary = new THREE.Color(theme.primary);
      const cSecondary = new THREE.Color(theme.secondary);
      const cAccent = new THREE.Color(theme.accent);
      
      const colorAttr = ref.current.geometry.attributes.color;
      if (colorAttr) {
        // Check first particle to see if we need to drift (optimization)
        
        for(let i=0; i<count; i++) {
            const rVal = randoms[i];
            let target;
            if (rVal > 0.6) target = cPrimary;
            else if (rVal > 0.3) target = cSecondary;
            else target = cAccent;
            
            // Simple linear interpolation
            const idx = i * 3;
            colorAttr.array[idx] = THREE.MathUtils.lerp(colorAttr.array[idx], target.r, delta * 2);
            colorAttr.array[idx+1] = THREE.MathUtils.lerp(colorAttr.array[idx+1], target.g, delta * 2);
            colorAttr.array[idx+2] = THREE.MathUtils.lerp(colorAttr.array[idx+2], target.b, delta * 2);
        }
        colorAttr.needsUpdate = true;
      }
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.6} vertexColors transparent opacity={0.8} sizeAttenuation={false} depthWrite={false} />
    </points>
  );
};

// 2. High Speed Velocity Particles
const VelocityParticles = () => {
    const count = 800;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const flightSpeed = useStore(state => state.flightSpeed);
    const theme = useStore(state => state.theme);
    const gamePhase = useStore(state => state.gamePhase);
    
    const initialData = useMemo(() => {
        return Array.from({ length: count }).map(() => ({
            x: (Math.random() - 0.5) * 120, 
            y: (Math.random() - 0.5) * 80,
            z: (Math.random() - 0.5) * 200 - 50,
            scale: Math.random(),
            speedOffset: Math.random() * 0.5
        }));
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        if (gamePhase !== 'PLAYING') {
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 2);
            if (mat.opacity < 0.01) meshRef.current.visible = false;
        } else {
            meshRef.current.visible = true;
            mat.opacity = 0.3 + (flightSpeed * 0.3);
        }
        
        if (!meshRef.current.visible) return;

        const stretchFactor = Math.max(0, flightSpeed - 0.2); 
        const stretch = 1 + stretchFactor * 15; 
        const baseSize = 0.05 + (flightSpeed * 0.05);

        for (let i = 0; i < count; i++) {
            const data = initialData[i];
            const moveSpeed = 2 + (flightSpeed * 100 + data.speedOffset * 20);
            data.z += moveSpeed * delta;

            if (data.z > 20) {
                data.z = -180; 
                data.x = (Math.random() - 0.5) * 120;
                data.y = (Math.random() - 0.5) * 80;
            }

            dummy.position.set(data.x, data.y, data.z);
            dummy.scale.set(baseSize, baseSize, baseSize * stretch);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        
        // Update global color based on theme
        if (mat) {
            const targetC = new THREE.Color(theme.accent);
            // Blend slightly to white at high speed
            mat.color.lerp(targetC.lerp(new THREE.Color('#FFF'), flightSpeed * 0.5), delta * 2);
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} /> 
            <meshBasicMaterial transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
    );
}

// 3. Volumetric Nebula Clouds
const NebulaClouds = () => {
    const count = 50; 
    const flightSpeed = useStore(state => state.flightSpeed);
    const theme = useStore(state => state.theme);
    const gamePhase = useStore(state => state.gamePhase);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    const cloudTexture = useMemo(() => generateCloudTexture(), []);

    const clouds = useMemo(() => {
        return Array.from({ length: count }).map(() => {
            let x = (Math.random() - 0.5) * 160;
            let y = (Math.random() - 0.5) * 100;
            if (Math.abs(x) < 20 && Math.abs(y) < 20) {
                x += (x > 0 ? 30 : -30);
            }

            return {
                x, y,
                z: -50 - Math.random() * 300, 
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                scaleBase: 20 + Math.random() * 30, 
                colorMix: Math.random(), 
                phase: Math.random() * Math.PI * 2
            };
        });
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const cPrimary = useMemo(() => new THREE.Color(), []);
    const cSecondary = useMemo(() => new THREE.Color(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const t = state.clock.getElapsedTime();
        
        if (gamePhase === 'ASCENDING' || gamePhase === 'ENDED') {
             cPrimary.set('#FFFFFF');
             cSecondary.set('#FFFFFF');
        } else {
             // Lerp towards current theme colors
             cPrimary.lerp(new THREE.Color(theme.primary), delta);
             cSecondary.lerp(new THREE.Color(theme.secondary), delta);
        }

        for (let i = 0; i < count; i++) {
            const cloud = clouds[i];
            
            const speed = 2 + flightSpeed * 40;
            cloud.z += speed * delta;
            
            if (cloud.z > 30) {
                cloud.z = -300 - Math.random() * 50;
                let x = (Math.random() - 0.5) * 160;
                let y = (Math.random() - 0.5) * 100;
                if (Math.abs(x) < 20 && Math.abs(y) < 20) {
                     x += (x > 0 ? 30 : -30);
                }
                cloud.x = x;
                cloud.y = y;
            }

            const breathing = Math.sin(t * 0.5 + cloud.phase) * 0.1; 
            const currentScale = cloud.scaleBase * (1 + breathing);
            
            cloud.rotation += cloud.rotationSpeed * delta;

            dummy.position.set(cloud.x, cloud.y, cloud.z);
            dummy.rotation.set(0, 0, cloud.rotation);
            dummy.scale.setScalar(currentScale);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);

            const finalColor = cPrimary.clone().lerp(cSecondary, cloud.colorMix);
            meshRef.current.setColorAt(i, finalColor);
        }
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
                map={cloudTexture}
                transparent 
                opacity={0.08} 
                depthWrite={false} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    )
}

// 4. Dynamic Ribbons
const ParticleRibbon: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const flightSpeed = useStore(state => state.flightSpeed);
  const theme = useStore(state => state.theme);
  const gamePhase = useStore(state => state.gamePhase);
  const ref = useRef<THREE.Points>(null);
  
  const curve = useMemo(() => {
    const points = [];
    const segments = 80; 
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const angle = (t * Math.PI * 8) + (index / total) * Math.PI * 2;
      const r = 15 + Math.sin(t * 15 + index) * 5; 
      points.push(new THREE.Vector3(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        (t - 0.5) * 400 
      ));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [index, total]);

  const particleCount = 1200;
  
  // Create buffers
  const positions = useMemo(() => {
      const pos = new Float32Array(particleCount * 3);
      // Initialize...
       for (let i = 0; i < particleCount; i++) {
          const t = Math.random(); 
          const point = curve.getPoint(t);
          const rDist = Math.random() * 3.5;
          const angle = Math.random() * Math.PI * 2;
          pos[i * 3] = point.x + Math.cos(angle) * rDist;
          pos[i * 3 + 1] = point.y + Math.sin(angle) * rDist;
          pos[i * 3 + 2] = point.z + (Math.random() - 0.5) * 8.0;
       }
      return pos;
  }, [curve]);

  const colors = useMemo(() => new Float32Array(particleCount * 3), []);
  const randoms = useMemo(() => new Float32Array(particleCount).map(()=>Math.random()), []);

  useFrame((state, delta) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      
      ref.current.rotation.z -= delta * (0.05 + flightSpeed * 0.6);
      
      const breathe = 1 + Math.sin(time * 1.5 + index) * 0.03 + flightSpeed * 0.1;
      ref.current.scale.setScalar(breathe);
      
      ref.current.position.x = Math.sin(time * 0.4 + index) * 1.5;
      ref.current.position.y = Math.cos(time * 0.2 + index) * 1.5;

      const mat = ref.current.material as THREE.PointsMaterial;
      
      if (gamePhase !== 'PLAYING') {
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta);
      } else {
           mat.opacity = 0.5 + (flightSpeed * 0.5);
      }
      mat.size = 0.2 + Math.sin(time * 3 + index) * 0.05 + (flightSpeed * 0.1); 

      // Update Ribbon Colors dynamically
      const cPrimary = new THREE.Color(theme.primary);
      const cSecondary = new THREE.Color(theme.secondary);
      const cAccent = new THREE.Color(theme.accent);
      
      const colorAttr = ref.current.geometry.attributes.color;
      if (colorAttr) {
          for(let i=0; i<particleCount; i++) {
             const rVal = randoms[i];
             let target;
             if (rVal > 0.8) target = cAccent;
             else target = (rVal > 0.5) ? cPrimary : cSecondary;

             const idx = i*3;
             colorAttr.array[idx] = THREE.MathUtils.lerp(colorAttr.array[idx], target.r, delta * 2);
             colorAttr.array[idx+1] = THREE.MathUtils.lerp(colorAttr.array[idx+1], target.g, delta * 2);
             colorAttr.array[idx+2] = THREE.MathUtils.lerp(colorAttr.array[idx+2], target.b, delta * 2);
          }
          colorAttr.needsUpdate = true;
      }
    }
  });

  return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial 
                vertexColors 
                size={0.25} 
                transparent 
                opacity={0.6} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
                sizeAttenuation 
            />
        </points>
  );
};

export const Galaxy: React.FC = () => {
  return (
    <group>
      <BackgroundStars />
      <VelocityParticles />
      <NebulaClouds />
      
      {Array.from({ length: 5 }).map((_, i) => (
        <ParticleRibbon key={i} index={i} total={5} />
      ))}
    </group>
  );
};