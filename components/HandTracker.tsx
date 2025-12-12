import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { MAX_SPEED, MIN_SPEED, ACCELERATION_RATE, DECELERATION_RATE } from '../constants';
import { GestureType } from '../types';

export const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const setGesture = useStore((state) => state.setGesture);
  const setFlightSpeed = useStore((state) => state.setFlightSpeed);
  const triggerCollection = useStore((state) => state.triggerCollection);
  const flightSpeed = useStore((state) => state.flightSpeed);
  
  const activeCollectionId = useStore((state) => state.activeCollectionId);
  
  // Tutorial State
  const tutorialStep = useStore((state) => state.tutorialStep);
  const setTutorialStep = useStore((state) => state.setTutorialStep);

  // Refs for logic loop
  const speedRef = useRef(flightSpeed);
  const collectingRef = useRef(!!activeCollectionId);
  const tutorialStepRef = useRef(tutorialStep);
  const tutorialProgressCounter = useRef(0); // Used to debounce tutorial steps
  
  // Sync refs
  useEffect(() => { speedRef.current = flightSpeed; }, [flightSpeed]);
  useEffect(() => { collectingRef.current = !!activeCollectionId; }, [activeCollectionId]);
  useEffect(() => { tutorialStepRef.current = tutorialStep; }, [tutorialStep]);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    // Movement tracking variables
    let previousY = 0;
    const historySize = 5;
    const yHistory: number[] = [];

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startCamera();
      } catch (err) {
        console.error(err);
        setError("Failed to load hand tracking.");
        setLoading(false);
      }
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          setLoading(false);
          predict();
        };
      } catch (err) {
        setError("Camera permission denied.");
        setLoading(false);
      }
    };

    const detectGesture = (landmarks: any[]) => {
      const wrist = landmarks[0];
      const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
      
      let totalDist = 0;
      tips.forEach(tip => {
        const d = Math.sqrt(
            Math.pow(tip.x - wrist.x, 2) + 
            Math.pow(tip.y - wrist.y, 2) + 
            Math.pow(tip.z - wrist.z, 2)
        );
        totalDist += d;
      });
      const avgDist = totalDist / 5;

      // Threshold: < 0.25 is fist, > 0.25 is open
      const isClosed = avgDist < 0.25; 
      
      return { isClosed, wristY: wrist.y };
    };

    const predict = () => {
      if (videoRef.current && handLandmarker) {
        const nowInMs = Date.now();
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = handLandmarker.detectForVideo(videoRef.current, nowInMs);

          let currentGesture = GestureType.NONE;
          let currentSpeed = speedRef.current;

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const { isClosed, wristY } = detectGesture(landmarks);

            if (isClosed) {
              currentGesture = GestureType.CLOSED_FIST;
              if (!collectingRef.current) {
                 triggerCollection();
              }
              currentSpeed -= DECELERATION_RATE * 2;

              // TUTORIAL CHECK: COLLECT
              if (tutorialStepRef.current === 'COLLECT') {
                  tutorialProgressCounter.current += 1;
                  // If held for ~60 frames (approx 1-2 sec)
                  if (tutorialProgressCounter.current > 40) {
                      setTutorialStep('COMPLETED');
                      tutorialProgressCounter.current = 0;
                  }
              }

            } else {
              currentGesture = GestureType.OPEN_PALM;
              
              yHistory.push(wristY);
              if (yHistory.length > historySize) yHistory.shift();

              const delta = Math.abs(wristY - previousY);
              previousY = wristY;

              if (delta > 0.01) {
                currentSpeed += ACCELERATION_RATE * (delta * 50); 
              } else {
                currentSpeed -= DECELERATION_RATE * 0.5;
              }

              // TUTORIAL CHECK: FLY
              if (tutorialStepRef.current === 'FLY') {
                  // Check if user is actually flapping/speeding up
                  if (currentSpeed > 0.5) {
                      tutorialProgressCounter.current += 1;
                      if (tutorialProgressCounter.current > 40) {
                          setTutorialStep('COLLECT');
                          tutorialProgressCounter.current = 0;
                      }
                  }
              }
            }
          } else {
            currentSpeed -= DECELERATION_RATE;
          }

          // Reset tutorial counter if condition broke (simple debounce)
          // (Only strict for gestures, speed has inertia so it's fine)
          if (tutorialStepRef.current === 'COLLECT' && currentGesture !== GestureType.CLOSED_FIST) {
              tutorialProgressCounter.current = Math.max(0, tutorialProgressCounter.current - 1);
          }

          currentSpeed = Math.max(MIN_SPEED, Math.min(currentSpeed, MAX_SPEED));
          
          if (Math.abs(currentSpeed - speedRef.current) > 0.001) {
            setFlightSpeed(currentSpeed);
          }
          setGesture(currentGesture);
        }
      }
      animationFrameId = requestAnimationFrame(predict);
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [setGesture, setFlightSpeed, triggerCollection, setTutorialStep]);

  if (error) return <div className="absolute top-4 left-4 text-red-400 text-xs z-50">{error}</div>;

  // We keep the video element in DOM for MediaPipe to process, but hide it visually
  // Using opacity-0 and 1px size ensures it's "visible" to the browser engine but not the user.
  // Display:none might pause video processing in some browsers.
  return (
    <video 
      ref={videoRef} 
      className="absolute top-0 left-0 opacity-0 pointer-events-none"
      style={{ width: '1px', height: '1px' }}
      autoPlay 
      playsInline 
      muted 
    />
  );
};