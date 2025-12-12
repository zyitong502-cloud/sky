import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store';
import { Galaxy } from './Galaxy';
import Angel from './Angel';
import { THEMES } from '../constants';

// Component to handle Camera movement logic & Background Color & Fog
const SceneEffects = () => {
    const flightSpeed = useStore(state => state.flightSpeed);
    const theme = useStore(state => state.theme);
    const gamePhase = useStore(state => state.gamePhase);
    const { scene } = useThree();
    
    // Internal color references for smooth lerping
    const bgRef = useRef(new THREE.Color(theme.background));
    
    useEffect(() => {
        // Instant update when theme changes manually, unless ascending
        if (gamePhase === 'PLAYING') {
            bgRef.current.set(theme.background);
        }
    }, [theme, gamePhase]);

    useFrame((state, delta) => {
        // 1. Dynamic FOV
        const targetFov = 60 + (flightSpeed * 15); 
        const camera = state.camera as THREE.PerspectiveCamera;
        
        if (camera.isPerspectiveCamera) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05);
            camera.updateProjectionMatrix();
        }

        // 2. Camera Shake
        if (flightSpeed > 0.8) {
            const shakeIntensity = (flightSpeed - 0.8) * 0.02;
            state.camera.position.x = Math.sin(state.clock.elapsedTime * 20) * shakeIntensity;
            state.camera.position.y = Math.cos(state.clock.elapsedTime * 25) * shakeIntensity;
        } else {
            state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.1);
            state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.1);
        }

        // 3. Background Color Transition
        let targetColorStr = theme.background;
        if (gamePhase === 'ASCENDING' || gamePhase === 'ENDED') {
            targetColorStr = THEMES.ASCENSION.background;
        }

        const targetColor = new THREE.Color(targetColorStr);
        // Lerp background for smooth transition
        scene.background = bgRef.current.lerp(targetColor, delta * 0.8);
        
        // 4. Update Fog
        // Use a slightly lighter version of background for fog to create depth
        const fogColor = bgRef.current.clone().lerp(new THREE.Color(theme.secondary), 0.2);
        if (scene.fog) {
            (scene.fog as THREE.Fog).color.copy(fogColor);
            
            // Adjust fog density based on theme (Rainforest = dense)
            let near = 5;
            let far = 140;
            
            // Heuristic to detect rainforest by color (dark blue background)
            if (theme.background === THEMES.RAINFOREST.background) {
                far = 90; // Closer fog for moody atmosphere
            } else if (theme.background === THEMES.DESERT.background) {
                far = 110; // Dusty
            }

             if (gamePhase === 'ASCENDING' || gamePhase === 'ENDED') {
                near = 0;
                far = 200; // Clear sky
             }

             (scene.fog as THREE.Fog).near = THREE.MathUtils.lerp((scene.fog as THREE.Fog).near, near, delta);
             (scene.fog as THREE.Fog).far = THREE.MathUtils.lerp((scene.fog as THREE.Fog).far, far, delta);
        }
    });

    return <fog attach="fog" args={['#000', 5, 140]} />;
}

const SceneContent = () => {
    const theme = useStore(state => state.theme);

    return (
        <>
            <SceneEffects />
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color={theme.accent} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color={theme.secondary} />

            <group>
                <Galaxy />
                <Angel />
            </group>

            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
            </EffectComposer>
        </>
    );
};

const Scene: React.FC = () => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]} 
        gl={{ antialias: false, alpha: false }} 
      >
        <Suspense fallback={null}>
           <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;