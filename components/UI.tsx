import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { THEMES, TOTAL_ANGEL_COUNT } from '../constants';
import { Maximize, Settings2, Hand, Wind, Grab, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { audioManager } from '../utils/audio';

export const UI: React.FC = () => {
  const { 
      theme, setTheme, flightSpeed, gesture, 
      tutorialStep, setTutorialStep, isMusicPlaying, toggleMusic, 
      collectedCount, gamePhase,
      tarotCard, drawTarotCard, finalMessageVisible, setFinalMessageVisible
  } = useStore();
  
  const [showColors, setShowColors] = useState(false);

  // Trigger Tarot Draw when game ends
  useEffect(() => {
    if (gamePhase === 'ENDED' && !tarotCard) {
        // Short delay before drawing to allow ascension animation to settle
        const timer = setTimeout(() => {
            drawTarotCard();
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [gamePhase, tarotCard, drawTarotCard]);

  // Handle 15s timer after card is drawn
  useEffect(() => {
      if (gamePhase === 'ENDED' && tarotCard && !finalMessageVisible) {
          const timer = setTimeout(() => {
              setFinalMessageVisible(true);
          }, 15000); // 15 seconds
          return () => clearTimeout(timer);
      }
  }, [gamePhase, tarotCard, finalMessageVisible, setFinalMessageVisible]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleBegin = async () => {
      try {
        await audioManager.play();
        useStore.setState({ isMusicPlaying: true });
      } catch (e) {
          console.error("Audio failed to start", e);
      }
      setTutorialStep('FLY');
  };

  const isTutorialActive = tutorialStep !== 'COMPLETED';
  const isGameEnding = gamePhase === 'ENDED';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10 overflow-hidden">
      
      {/* --- DECORATIVE FRAME --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute inset-0 opacity-60"
            style={{ 
                background: `radial-gradient(circle at center, transparent 10%, ${theme.background} 140%)` 
            }}
          />
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />

          {/* Frame opacity fades out at end game for pure sky look */}
          <div 
            className={`absolute inset-3 sm:inset-5 border-2 border-white/30 rounded-[2rem] sm:rounded-[2.5rem] transition-opacity duration-1000 ${isGameEnding ? 'opacity-0' : 'opacity-100'}`}
            style={{ boxShadow: `0 0 30px ${theme.primary}20, inset 0 0 30px ${theme.primary}10` }}
          />
          
          {!isGameEnding && (
              <>
                <div className="absolute top-6 left-6 w-20 h-20 border-t-2 border-l-2 border-white/60 rounded-tl-2xl" 
                    style={{ filter: `drop-shadow(0 0 5px ${theme.primary})` }} />
                <div className="absolute top-6 right-6 w-20 h-20 border-t-2 border-r-2 border-white/60 rounded-tr-2xl" 
                    style={{ filter: `drop-shadow(0 0 5px ${theme.primary})` }} />
                <div className="absolute bottom-6 left-6 w-20 h-20 border-b-2 border-l-2 border-white/60 rounded-bl-2xl" 
                    style={{ filter: `drop-shadow(0 0 5px ${theme.primary})` }} />
                <div className="absolute bottom-6 right-6 w-20 h-20 border-b-2 border-r-2 border-white/60 rounded-br-2xl" 
                    style={{ filter: `drop-shadow(0 0 5px ${theme.primary})` }} />
              </>
          )}
      </div>

      {/* --- HEADER --- */}
      <div className={`relative z-10 flex justify-between items-start transition-opacity duration-1000 ${isTutorialActive || isGameEnding ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col gap-2">
            <h1 className="text-white text-xl sm:text-2xl font-light tracking-widest opacity-90" style={{ textShadow: `0 0 15px ${theme.primary}` }}>
            SKY JOURNEY
            </h1>
            <div className="text-white/50 text-xs sm:text-sm max-w-xs space-y-1 font-light tracking-wide">
                <div className="flex items-center gap-2">
                    <Hand size={14} className="text-white/70" /> <span>Open palm to fly</span>
                </div>
                <div className="flex items-center gap-2">
                    <Grab size={14} className="text-white/70" /> <span>Fist to collect</span>
                </div>
            </div>
        </div>
        
        {/* PROGRESS COUNTER */}
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Sparkles size={16} className={collectedCount > 0 ? "text-yellow-400" : "text-white/50"} />
                <span className="text-white font-mono tracking-widest text-sm">
                    {collectedCount} / {TOTAL_ANGEL_COUNT}
                </span>
            </div>
        </div>

        <button 
          onClick={toggleFullscreen}
          className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105 ml-4"
        >
          <Maximize className="text-white/80" size={20} />
        </button>
      </div>

      {/* --- TAROT ENDING SCREEN --- */}
      {isGameEnding && tarotCard && !finalMessageVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-in fade-in duration-[2000ms] pointer-events-auto">
              {/* Card Container */}
              <div className="bg-black/40 backdrop-blur-md border border-white/20 p-8 sm:p-12 rounded-lg max-w-md w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.2)] transform transition-transform animate-in zoom-in-95 duration-[1500ms]">
                  
                  {/* Decorative Card Icon */}
                  <div className="mb-6 relative w-24 h-32 mx-auto border-2 border-white/40 rounded flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                        <div className="absolute inset-1 border border-white/20 rounded-sm" />
                        <span className="text-3xl font-serif text-white/80">{tarotCard.id}</span>
                  </div>

                  <h2 className="text-white text-3xl sm:text-4xl font-light tracking-widest mb-2 font-serif">
                      {tarotCard.nameCN}
                  </h2>
                  <h3 className="text-white/50 text-sm tracking-[0.3em] uppercase mb-8">
                      {tarotCard.name}
                  </h3>
                  
                  <div className="w-16 h-[1px] bg-white/30 mx-auto mb-8" />
                  
                  <p className="text-white/90 text-lg sm:text-xl font-light leading-relaxed tracking-wide font-serif">
                      {tarotCard.meaning}
                  </p>
              </div>
          </div>
      )}

      {/* --- FINAL MESSAGE (BLACK SCREEN) --- */}
      {finalMessageVisible && (
        <div className="absolute inset-0 bg-black z-[100] flex items-center justify-center animate-in fade-in duration-[3000ms]">
            <h1 className="text-white text-2xl sm:text-4xl font-light tracking-[0.5em] font-serif opacity-80 animate-pulse" style={{ animationDuration: '4s' }}>
                彼之心火，吾之新生。
            </h1>
        </div>
      )}

      {/* --- TUTORIAL OVERLAY --- */}
      {isTutorialActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 transition-all duration-700">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
             
             <div className="relative z-10 flex flex-col items-center">
              {/* WELCOME STEP */}
              {tutorialStep === 'WELCOME' && (
                  <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 px-6">
                      <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-8" />
                      <h1 className="text-5xl md:text-8xl font-thin text-white tracking-[0.2em] ml-[0.2em]" style={{ textShadow: `0 0 40px ${theme.primary}` }}>
                          SKY
                      </h1>
                      <p className="text-white/60 text-lg font-light tracking-widest uppercase max-w-md mx-auto">
                          Journey Through Starlight
                      </p>
                      
                      <div className="pt-8">
                        <button 
                            onClick={handleBegin}
                            className="pointer-events-auto px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-md"
                        >
                            BEGIN
                        </button>
                      </div>
                  </div>
              )}

              {/* FLY STEP */}
              {tutorialStep === 'FLY' && (
                  <div className="text-center space-y-8 animate-in zoom-in duration-500 px-6">
                      <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                          <div className="absolute inset-0 bg-white/5 rounded-full animate-ping" />
                          <div className="absolute inset-0 border border-white/20 rounded-full" />
                          <Hand size={64} className="text-white relative z-10 animate-bounce" strokeWidth={1} />
                      </div>
                      <div>
                        <h2 className="text-3xl text-white font-light tracking-[0.2em] mb-2">FLIGHT</h2>
                        <div className="w-12 h-[1px] bg-white/30 mx-auto" />
                      </div>
                      <p className="text-white/70 text-lg font-light max-w-sm mx-auto leading-relaxed">
                          Raise your <span className="text-white font-normal border-b border-white/40">Open Hand</span> and wave gently to accelerate through the stars.
                      </p>
                      <button 
                          onClick={() => setTutorialStep('COLLECT')} 
                          className="pointer-events-auto mt-8 text-white/30 text-xs uppercase tracking-widest hover:text-white/80 transition-colors"
                      >
                          Skip Tutorial
                      </button>
                  </div>
              )}

              {/* COLLECT STEP */}
              {tutorialStep === 'COLLECT' && (
                  <div className="text-center space-y-8 animate-in zoom-in duration-500 px-6">
                      <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                          <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_4s_linear_infinite]" />
                          <div className="absolute inset-2 border border-white/10 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                          <Grab size={64} className="text-white relative z-10 animate-pulse" strokeWidth={1} />
                      </div>
                      <div>
                        <h2 className="text-3xl text-white font-light tracking-[0.2em] mb-2">GATHER</h2>
                        <div className="w-12 h-[1px] bg-white/30 mx-auto" />
                      </div>
                      <p className="text-white/70 text-lg font-light max-w-sm mx-auto leading-relaxed">
                          When spirits are near, clench your <span className="text-white font-normal border-b border-white/40">Fist</span> to guide them home.
                      </p>
                       <button 
                          onClick={() => setTutorialStep('COMPLETED')} 
                          className="pointer-events-auto mt-8 text-white/30 text-xs uppercase tracking-widest hover:text-white/80 transition-colors"
                      >
                          Skip Tutorial
                      </button>
                  </div>
              )}
             </div>
          </div>
      )}

      {/* --- CENTER FEEDBACK (Gameplay) --- */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-20">
         {gesture === 'CLOSED_FIST' && !isTutorialActive && !isGameEnding && (
             <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-50 bg-white/20 rounded-full" />
                <div className="text-white text-xl font-light tracking-[0.3em] animate-pulse" style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}>
                    COLLECTING
                </div>
             </div>
         )}
      </div>

      {/* --- FOOTER --- */}
      <div className={`relative z-10 flex justify-between items-end transition-opacity duration-1000 ${isTutorialActive || isGameEnding ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Left: Speed Indicator & Audio Toggle */}
        <div className="flex items-center gap-4">
             {/* Audio Toggle */}
             <button 
                onClick={toggleMusic}
                className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/10 transition-all text-white/80 hover:text-white hover:scale-105"
             >
                {isMusicPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
             </button>

             {/* Speed */}
            <div className="hidden sm:flex items-center gap-4 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
                <Wind className="text-white/50" size={16} />
                <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full transition-all duration-300 ease-out shadow-[0_0_10px_currentColor]"
                        style={{ 
                            width: `${(flightSpeed / 2.0) * 100}%`,
                            backgroundColor: theme.primary,
                            color: theme.primary
                        }}
                    />
                </div>
            </div>
        </div>

        {/* Color Picker */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
             {showColors && (
                 <div className="bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex gap-3 animate-in fade-in slide-in-from-bottom-4 mb-2">
                     {Object.entries(THEMES).map(([name, t]) => (
                         name !== 'ASCENSION' && (
                             <button
                                key={name}
                                onClick={() => setTheme(t)}
                                className="w-6 h-6 rounded-full border transition-transform hover:scale-125 hover:shadow-[0_0_15px_currentColor]"
                                style={{ 
                                    backgroundColor: t.primary,
                                    borderColor: theme === t ? '#fff' : 'transparent',
                                    color: t.primary 
                                }}
                                title={name}
                            />
                         )
                     ))}
                     <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                     <div className="relative w-6 h-6 overflow-hidden rounded-full border border-white/20 group">
                        <input 
                            type="color" 
                            value={theme.primary}
                            onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                            className="absolute inset-[-4px] w-[150%] h-[150%] p-0 cursor-pointer"
                        />
                     </div>
                 </div>
             )}
             <button 
                onClick={() => setShowColors(!showColors)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/10 transition-all text-white/80 hover:text-white"
                style={{ 
                    boxShadow: showColors ? `0 0 20px ${theme.primary}40` : 'none',
                    borderColor: showColors ? theme.primary : 'rgba(255,255,255,0.1)'
                }}
             >
                 <Settings2 size={20} className="transition-transform duration-500" style={{ transform: showColors ? 'rotate(90deg)' : 'rotate(0deg)' }} />
             </button>
        </div>

      </div>
    </div>
  );
};