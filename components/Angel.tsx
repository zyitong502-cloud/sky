import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, angelRegistry } from '../store';
import { ANGEL_PARTICLE_COUNT } from '../constants';
import { AngelStatus } from '../types';

// Procedural Wing Geometry
const WingShape = () => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.5, 0.5, 1.5, 1.0, 2.5, 1.5);
    shape.bezierCurveTo(2.8, 1.2, 2.8, 0.8, 2.6, 0.5);
    shape.bezierCurveTo(2.0, 0.2, 1.8, -0.5, 1.2, -0.8);
    shape.bezierCurveTo(0.8, -1.0, 0.4, -0.8, 0, -0.5);
    return shape;
};

interface AngelModelProps {
  id?: string;
  position?: [number, number, number];
  scale?: number;
  colorOverride?: string | null;
  isMain?: boolean;
  timeOffset?: number;
  status?: AngelStatus;
  manualUpdate?: boolean; 
}

const AngelModel: React.FC<AngelModelProps> = ({ 
  id,
  position = [0, 0, 0], 
  scale = 1, 
  colorOverride = null, 
  isMain = false,
  timeOffset = 0,
  status = 'IDLE',
  manualUpdate = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  
  const theme = useStore(state => state.theme);
  const flightSpeed = useStore(state => state.flightSpeed);
  const gamePhase = useStore(state => state.gamePhase);

  const wingShape = useMemo(() => WingShape(), []);
  
  // Register/Unregister
  useEffect(() => {
    if (id && groupRef.current && !isMain) {
        angelRegistry[id] = groupRef.current;
    }
    return () => {
        if (id && !isMain) delete angelRegistry[id];
    };
  }, [id, isMain]);

  // Colors
  const bodyColor = colorOverride ? colorOverride : theme.accent;
  const haloColor = colorOverride ? colorOverride : theme.primary;
  const wingPrimary = colorOverride ? colorOverride : theme.secondary;
  const wingSecondary = colorOverride ? colorOverride : theme.primary;
  const sparkleColor = colorOverride ? colorOverride : theme.primary;

  // Dissolve State for Main Angel
  const dissolveRef = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime() + timeOffset;
      const hoverY = Math.sin(t * 1.5) * 0.3;
      
      if (!manualUpdate) {
        groupRef.current.position.x = position[0];
        groupRef.current.position.y = position[1] + hoverY;
        groupRef.current.position.z = position[2];
      }

      // Main Angel Dissolve Logic during ASCENDING
      if (isMain) {
          if (gamePhase === 'ASCENDING') {
              dissolveRef.current += delta * 0.5; // Dissolve over ~2 seconds
          } else {
              dissolveRef.current = 0;
          }

          const dissolve = Math.min(1, dissolveRef.current);
          
          // Shrink and Fade
          const s = Math.max(0, 1 - dissolve);
          groupRef.current.scale.setScalar(scale * s);
          
          // Tilt
          groupRef.current.rotation.x = THREE.MathUtils.lerp(
            groupRef.current.rotation.x,
            flightSpeed * 0.5,
            delta * 2
          );
      } else {
          groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
      }
    }
    
    // Flapping
    if (leftWingRef.current && rightWingRef.current) {
      const t = state.clock.getElapsedTime() + timeOffset;
      const effectiveSpeed = isMain ? flightSpeed : 0.2 + (flightSpeed * 0.5); 
      const flapSpeed = 2 + effectiveSpeed * 5;
      const flapAngle = Math.sin(t * flapSpeed) * (0.3 + effectiveSpeed * 0.2);
      
      leftWingRef.current.rotation.y = -flapAngle; 
      leftWingRef.current.rotation.z = flapAngle * 0.5; 
      rightWingRef.current.rotation.y = flapAngle;
      rightWingRef.current.rotation.z = -flapAngle * 0.5;
    }
  });

  if (!isMain && status === 'COLLECTED') return null;
  if (isMain && dissolveRef.current >= 1) return null;

  return (
    <group ref={groupRef}>
       <Sparkles count={isMain ? 40 : 15} scale={4 * scale} size={3 * scale} speed={0.4} opacity={0.5} color={sparkleColor} />
       
       <group scale={[scale, scale, scale]}>
          <mesh position={[0, 0, 0]}>
             <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
             <meshBasicMaterial color={bodyColor} transparent opacity={1 - dissolveRef.current} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
             <sphereGeometry args={[0.25, 16, 16]} />
             <meshBasicMaterial color={bodyColor} transparent opacity={1 - dissolveRef.current} />
          </mesh>
          <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.4, 0.04, 16, 48]} />
              <meshBasicMaterial color={haloColor} toneMapped={false} transparent opacity={1 - dissolveRef.current} />
          </mesh>
          <group position={[0, 0.2, -0.1]}>
            <group ref={leftWingRef} position={[-0.1, 0, 0]}>
                 <mesh position={[0, 0, 0]} rotation={[0, 0, 0.2]}>
                    <shapeGeometry args={[wingShape]} />
                    <meshBasicMaterial color={wingPrimary} transparent opacity={0.6 * (1 - dissolveRef.current)} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
                 </mesh>
                 <mesh position={[0, 0, 0.05]} scale={[0.8, 0.8, 1]} rotation={[0, 0, 0.3]}>
                    <shapeGeometry args={[wingShape]} />
                    <meshBasicMaterial color={wingSecondary} transparent opacity={0.4 * (1 - dissolveRef.current)} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
                 </mesh>
            </group>
            <group ref={rightWingRef} position={[0.1, 0, 0]}>
                 <group scale={[-1, 1, 1]}>
                    <mesh position={[0, 0, 0]} rotation={[0, 0, 0.2]}>
                        <shapeGeometry args={[wingShape]} />
                        <meshBasicMaterial color={wingPrimary} transparent opacity={0.6 * (1 - dissolveRef.current)} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
                    </mesh>
                     <mesh position={[0, 0, 0.05]} scale={[0.8, 0.8, 1]} rotation={[0, 0, 0.3]}>
                        <shapeGeometry args={[wingShape]} />
                        <meshBasicMaterial color={wingSecondary} transparent opacity={0.4 * (1 - dissolveRef.current)} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
                     </mesh>
                 </group>
            </group>
          </group>
       </group>
    </group>
  );
};

const MovingAngel: React.FC<{ angel: any }> = ({ angel }) => {
    const groupRef = useRef<THREE.Group>(null);
    const flightSpeed = useStore(state => state.flightSpeed);
    
    const homePos = useMemo(() => new THREE.Vector3(...angel.position), [angel.position]);
    const randomOffset = useMemo(() => Math.random() * 100, []);

    useEffect(() => {
        if (angel.id && groupRef.current) {
            angelRegistry[angel.id] = groupRef.current;
        }
    }, [angel.id]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        if (angel.status === 'COLLECTED') return;

        const time = state.clock.getElapsedTime();
        const t = time + randomOffset;

        if (angel.status === 'COLLECTING') {
            const target = new THREE.Vector3(0, 0, -4.5); 
            groupRef.current.position.lerp(target, delta * 3);
            groupRef.current.rotation.y += delta * 2;
        } else {
            const driftX = Math.sin(t * 0.5) * 2;
            const driftY = Math.cos(t * 0.3) * 1.5;
            const driftZ = Math.sin(t * 0.2) * 2;
            const speedLag = (flightSpeed - 0.1) * -5.0; 
            
            let targetX = homePos.x + driftX;
            let targetY = homePos.y + driftY;
            const targetZ = homePos.z + driftZ + speedLag;

            const distSq = targetX*targetX + targetY*targetY;
            const minRadSq = 4.5 * 4.5;
            if (distSq < minRadSq) {
                const dist = Math.sqrt(distSq);
                const pushFactor = 4.5 / (dist + 0.01);
                targetX *= pushFactor;
                targetY *= pushFactor;
            }

            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 2);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 2);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 2);

            const bankAngle = driftX * 0.05;
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -bankAngle, delta);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta);
        }
    });

    return (
        <group ref={groupRef} position={angel.position}>
             <AngelModel 
                id={angel.id}
                scale={angel.scale} 
                colorOverride="#FFFFFF" 
                timeOffset={parseInt(angel.id.split('-')[1]) * 10}
                isMain={false}
                status={angel.status}
                manualUpdate={true} 
            />
        </group>
    )
}

const AmbientAngelsGroup = () => {
    const ambientAngels = useStore(state => state.ambientAngels);
    return (
        <>
            {ambientAngels.map((angel) => (
                <MovingAngel key={angel.id} angel={angel} />
            ))}
        </>
    );
};

const AmbientSpirits = () => {
    const count = 40; 
    const { flightSpeed, theme, gamePhase } = useStore();
    const ref = useRef<THREE.InstancedMesh>(null);
    
    const initialData = useMemo(() => {
        return Array.from({ length: count }).map(() => {
            let x, y, dist;
            do {
                x = (Math.random() - 0.5) * 80;
                y = (Math.random() - 0.5) * 60;
                dist = Math.sqrt(x*x + y*y);
            } while (dist < 8); 

            return {
                x, y,
                z: -100 - Math.random() * 200,
                scale: 0.2 + Math.random() * 0.4,
                speedOffset: Math.random() * 0.5
            }
        });
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        if (gamePhase !== 'PLAYING') {
            ref.current.visible = false;
            return;
        }
        ref.current.visible = true;

        for (let i = 0; i < count; i++) {
            const data = initialData[i];
            
            data.z += (flightSpeed * 40 + 5 + data.speedOffset) * delta;
            
            if (data.z > 10) {
                data.z = -200; 
                let x, y, dist;
                do {
                    x = (Math.random() - 0.5) * 80;
                    y = (Math.random() - 0.5) * 60;
                    dist = Math.sqrt(x*x + y*y);
                } while (dist < 8);
                data.x = x;
                data.y = y;
            }

            dummy.position.set(data.x, data.y, data.z);
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            ref.current.setMatrixAt(i, dummy.matrix);
        }
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[undefined, undefined, count]}>
             <planeGeometry args={[1, 1]} />
             <meshBasicMaterial color={theme.secondary} transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
    );
}

const CollectionParticles = () => {
  const { activeCollectionId, collectionTargetPosition, theme, finishCollection } = useStore();
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const [progress, setProgress] = useState(0);

  const particleAttributes = useMemo(() => {
    const data = new Float32Array(ANGEL_PARTICLE_COUNT * 4); 
    for (let i = 0; i < ANGEL_PARTICLE_COUNT; i++) {
      const r = 1 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      data[i * 4] = r * Math.sin(phi) * Math.cos(theta); 
      data[i * 4 + 1] = r * Math.sin(phi) * Math.sin(theta); 
      data[i * 4 + 2] = r * Math.cos(phi); 
      
      data[i * 4 + 3] = 0.8 + Math.random() * 0.4; 
    }
    return data;
  }, []);

  useEffect(() => {
    if (activeCollectionId) {
        setProgress(0);
    }
  }, [activeCollectionId]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cTheme = useMemo(() => new THREE.Color(theme.primary), [theme]);
  const cWhite = useMemo(() => new THREE.Color('#FFFFFF'), []);

  useFrame((state, delta) => {
    if (!activeCollectionId || !collectionTargetPosition || !particlesRef.current) return;

    const nextProgress = progress + delta * 0.7; 
    setProgress(nextProgress);

    if (nextProgress >= 1.2) {
       finishCollection();
       return;
    }

    const [ax, ay, az] = collectionTargetPosition;
    const tx = 0, ty = 0, tz = -5; 

    for (let i = 0; i < ANGEL_PARTICLE_COUNT; i++) {
        const ox = particleAttributes[i*4];
        const oy = particleAttributes[i*4+1];
        const oz = particleAttributes[i*4+2];
        const speedMod = particleAttributes[i*4+3];

        const p = Math.max(0, nextProgress * speedMod);
        
        let x, y, z, scale;
        let colorMix = 0;
        
        if (p < 1.0) {
            const t = p;
            let spreadStrength = 1.0;
            if (t < 0.3) {
                spreadStrength = 1.0 + (t / 0.3) * 2.0;
            } else {
                spreadStrength = 3.0 * (1.0 - (t - 0.3)/0.7);
            }
            spreadStrength = Math.max(0, spreadStrength);

            const easeT = t * t * t; 
            const mx = THREE.MathUtils.lerp(ax, tx, easeT);
            const my = THREE.MathUtils.lerp(ay, ty, easeT);
            const mz = THREE.MathUtils.lerp(az, tz, easeT);

            const spin = t * 20 + i * 0.1;
            
            x = mx + (ox + Math.cos(spin)) * spreadStrength * 0.5;
            y = my + (oy + Math.sin(spin)) * spreadStrength * 0.5;
            z = mz + oz * spreadStrength * 0.5;

            if (t > 0.8) {
                 scale = (1.0 - t) * 5.0; 
                 colorMix = (t - 0.8) * 5.0; 
            } else {
                 scale = 1.0 + t;
                 colorMix = 0;
            }

        } else {
            scale = 0; 
            x = tx; y = ty; z = tz;
        }
        
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale * 0.08); 
        dummy.rotation.set(state.clock.elapsedTime, i, 0);
        dummy.updateMatrix();
        
        const finalColor = cTheme.clone().lerp(cWhite, colorMix);
        particlesRef.current.setColorAt(i, finalColor);
        particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    if (particlesRef.current.instanceColor) {
        particlesRef.current.instanceColor.needsUpdate = true;
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!activeCollectionId || !collectionTargetPosition) return null;

  return (
    <>
        <instancedMesh ref={particlesRef} args={[undefined, undefined, ANGEL_PARTICLE_COUNT]}>
            <sphereGeometry args={[1, 8, 8]} /> 
            <meshBasicMaterial 
                toneMapped={false} 
                transparent 
                opacity={0.9} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    </>
  );
};

const FinalEnergyCore = () => {
    const gamePhase = useStore(state => state.gamePhase);
    const setGamePhase = useStore(state => state.setGamePhase);
    const ref = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);

    useFrame((state, delta) => {
        if (gamePhase !== 'ASCENDING' && gamePhase !== 'ENDED') {
            if (ref.current) ref.current.scale.setScalar(0);
            if (glowRef.current) glowRef.current.scale.setScalar(0);
            return;
        }

        timeRef.current += delta;
        
        // Grow Sequence
        // 0-3s: Accumulate
        // 3s: Done
        const t = Math.min(1, timeRef.current / 4.0);
        const easeT = t * t * (3 - 2 * t);
        
        const coreSize = easeT * 3.0; // Grows to 3.0 size
        
        if (ref.current) {
            ref.current.scale.setScalar(coreSize);
            ref.current.rotation.y += delta;
            ref.current.rotation.z += delta * 0.5;
        }
        if (glowRef.current) {
            glowRef.current.scale.setScalar(coreSize * 1.5);
        }

        if (t >= 1 && gamePhase === 'ASCENDING') {
            setGamePhase('ENDED');
        }
    });

    if (gamePhase === 'PLAYING') return null;

    return (
        <group position={[0, 0, -5]}>
            {/* Core */}
            <mesh ref={ref}>
                <icosahedronGeometry args={[1, 2]} />
                <meshBasicMaterial color="#FFFFFF" wireframe transparent opacity={0.5} />
            </mesh>
            {/* Inner Glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
            </mesh>
            {/* Outer burst particles could go here */}
        </group>
    )
}

const Angel: React.FC = () => {
  return (
    <>
      <AngelModel isMain position={[0, 0, -5]} />
      <AmbientAngelsGroup />
      <AmbientSpirits />
      <CollectionParticles />
      <FinalEnergyCore />
    </>
  );
};

export default Angel;