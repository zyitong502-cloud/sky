import { create } from 'zustand';
import { AppState, GestureType, AmbientAngelData } from './types';
import { THEMES, TOTAL_ANGEL_COUNT, COLLECTION_DISTANCE_THRESHOLD, MAJOR_ARCANA } from './constants';
import * as THREE from 'three';
import { audioManager } from './utils/audio';

// Registry to track real-time positions of angel meshes
export const angelRegistry: Record<string, THREE.Object3D> = {};

const GENERATE_ANGELS = (count: number): AmbientAngelData[] => {
  return Array.from({ length: count }).map((_, i) => {
    let x, y, dist;
    do {
      x = (Math.random() - 0.5) * 55;
      y = (Math.random() - 0.5) * 35;
      dist = Math.sqrt(x * x + y * y);
    } while (dist < 8);
    
    const z = -5 - Math.random() * 30;

    return {
      id: `angel-${i}`,
      position: [x, y, z],
      scale: 0.35 + Math.random() * 0.4,
      status: 'IDLE'
    };
  });
};

export const useStore = create<AppState>((set, get) => ({
  gamePhase: 'PLAYING',
  setGamePhase: (phase) => set({ gamePhase: phase }),

  flightSpeed: 0.1,
  setFlightSpeed: (speed) => set({ flightSpeed: speed }),

  gesture: GestureType.NONE,
  setGesture: (gesture) => set({ gesture }),

  ambientAngels: GENERATE_ANGELS(TOTAL_ANGEL_COUNT),
  collectedCount: 0,
  activeCollectionId: null,
  collectionTargetPosition: null,

  triggerCollection: () => {
    const { activeCollectionId, ambientAngels, gamePhase } = get();
    
    if (activeCollectionId || gamePhase !== 'PLAYING') return;

    const PLAYER_POS = new THREE.Vector3(0, 0, -5);

    let closestId: string | null = null;
    let minDistance = Infinity;

    ambientAngels.forEach(angel => {
      if (angel.status !== 'IDLE') return;

      const mesh = angelRegistry[angel.id];
      if (mesh) {
        const dist = mesh.position.distanceTo(PLAYER_POS);
        if (dist < COLLECTION_DISTANCE_THRESHOLD) {
            if (dist < minDistance) {
                minDistance = dist;
                closestId = angel.id;
            }
        }
      }
    });

    if (closestId) {
      const mesh = angelRegistry[closestId];
      const currentPos: [number, number, number] = mesh 
        ? [mesh.position.x, mesh.position.y, mesh.position.z] 
        : [0, 0, 0];

      set({
        activeCollectionId: closestId,
        collectionTargetPosition: currentPos,
        ambientAngels: ambientAngels.map(a => 
          a.id === closestId ? { ...a, status: 'COLLECTING' } : a
        )
      });
    }
  },
  
  finishCollection: () => {
    const { activeCollectionId, ambientAngels, collectedCount } = get();
    if (!activeCollectionId) return;

    const newAngels = ambientAngels.map(a => 
      a.id === activeCollectionId ? { ...a, status: 'COLLECTED' as const } : a
    );

    const newCount = collectedCount + 1;

    // THEME SWITCHING LOGIC
    let newTheme = get().theme;
    if (newCount < 3) newTheme = THEMES.DESERT;
    else if (newCount === 3) newTheme = THEMES.GRASSLAND;
    else if (newCount === 6) newTheme = THEMES.RAINFOREST;
    else if (newCount === 9) newTheme = THEMES.VALLEY;
    else if (newCount === 12) newTheme = THEMES.GALAXY;

    set({
      activeCollectionId: null,
      collectionTargetPosition: null,
      ambientAngels: newAngels,
      collectedCount: newCount,
      theme: newTheme
    });

    if (newCount >= TOTAL_ANGEL_COUNT) {
        set({ gamePhase: 'ASCENDING' });
    }
  },
  
  resetAllAngels: () => set({ 
    ambientAngels: GENERATE_ANGELS(TOTAL_ANGEL_COUNT),
    collectedCount: 0,
    activeCollectionId: null,
    collectionTargetPosition: null,
    flightSpeed: 0.1,
    gamePhase: 'PLAYING',
    theme: THEMES.DESERT,
    tarotCard: null,
    finalMessageVisible: false
  }),

  theme: THEMES.DESERT, // Start in Desert
  setTheme: (theme) => set({ theme }),

  isMusicPlaying: false,
  toggleMusic: () => {
    const newState = audioManager.toggle();
    set({ isMusicPlaying: newState });
  },

  tutorialStep: 'WELCOME',
  setTutorialStep: (step) => set({ tutorialStep: step }),

  // Tarot Logic
  tarotCard: null,
  finalMessageVisible: false,
  setFinalMessageVisible: (visible) => set({ finalMessageVisible: visible }),
  drawTarotCard: () => {
    if (get().tarotCard) return;
    const randomIndex = Math.floor(Math.random() * MAJOR_ARCANA.length);
    set({ tarotCard: MAJOR_ARCANA[randomIndex] });
  }
}));