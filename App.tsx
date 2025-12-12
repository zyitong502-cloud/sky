import React from 'react';
import Scene from './components/Scene';
import { UI } from './components/UI';
import { HandTracker } from './components/HandTracker';

function App() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* 3D Background Scene */}
      <Scene />
      
      {/* Interaction Layer */}
      <HandTracker />
      
      {/* User Interface */}
      <UI />
    </div>
  );
}

export default App;