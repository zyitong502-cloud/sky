export type ThemeColor = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export enum GestureType {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM', // Flying
  CLOSED_FIST = 'CLOSED_FIST', // Collecting
}

export type AngelStatus = 'IDLE' | 'COLLECTING' | 'COLLECTED';

export type TutorialStep = 'WELCOME' | 'FLY' | 'COLLECT' | 'COMPLETED';

export type GamePhase = 'PLAYING' | 'ASCENDING' | 'ENDED';

export interface AmbientAngelData {
  id: string;
  position: [number, number, number]; // Initial position (X, Y, InitialZ)
  scale: number;
  status: AngelStatus;
}

export interface TarotCard {
  id: number;
  name: string;
  nameCN: string;
  meaning: string;
}

export interface AppState {
  // Game Flow
  gamePhase: GamePhase;
  setGamePhase: (phase: GamePhase) => void;

  // Flight
  flightSpeed: number;
  setFlightSpeed: (speed: number) => void;
  
  // Interaction
  gesture: GestureType;
  setGesture: (gesture: GestureType) => void;
  
  // Angel State
  ambientAngels: AmbientAngelData[];
  collectedCount: number;
  activeCollectionId: string | null;
  collectionTargetPosition: [number, number, number] | null; // Snapshot of position when collection starts
  
  triggerCollection: () => void;
  finishCollection: () => void;
  resetAllAngels: () => void;
  
  // Visuals
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;

  // Audio
  isMusicPlaying: boolean;
  toggleMusic: () => void;

  // Tutorial
  tutorialStep: TutorialStep;
  setTutorialStep: (step: TutorialStep) => void;

  // Tarot Ending
  tarotCard: TarotCard | null;
  drawTarotCard: () => void;
  finalMessageVisible: boolean;
  setFinalMessageVisible: (visible: boolean) => void;
}

// Global JSX Intrinsic Elements for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      points: any;
      instancedMesh: any;
      bufferGeometry: any;
      bufferAttribute: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      capsuleGeometry: any;
      torusGeometry: any;
      shapeGeometry: any;
      pointsMaterial: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
      fog: any;
      color: any;
      shaderMaterial: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      icosahedronGeometry: any;
      cylinderGeometry: any;
      extrudeGeometry: any;
      object3D: any;
    }
  }
}