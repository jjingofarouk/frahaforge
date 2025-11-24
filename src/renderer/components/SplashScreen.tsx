// src/renderer/src/components/SplashScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import company logo
import companyLogo from '/Users/mac/Code/pharmacy-1/src/renderer/assets/images/logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  authCheckComplete?: boolean;
  authError?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  authCheckComplete = true,
  authError 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { label: 'Initializing System', sublabel: 'Loading core modules' },
    { label: 'Connecting Database', sublabel: 'Establishing secure connection' },
    { label: 'Verifying License', sublabel: 'Authenticating credentials' },
    { label: 'System Ready', sublabel: 'Welcome back' }
  ];

  useEffect(() => {
    const totalTime = 2000; // 2 seconds for faster startup
    const startTime = Date.now();
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / totalTime) * 100, 100);
      
      setProgress(currentProgress);
      
      // Update stage based on progress
      const stageIndex = Math.min(
        Math.floor((currentProgress / 25)), // 4 stages, 25% each
        stages.length - 1
      );
      setCurrentStage(stageIndex);

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Ensure we reach exactly 100%
        setProgress(100);
        setCurrentStage(stages.length - 1);
        
        // Wait for auth check to complete or minimum display time
        const checkAuthStatus = () => {
          if (authCheckComplete) {
            setIsVisible(false);
            setTimeout(() => {
              onComplete();
            }, 500); // Wait for exit animation
          } else {
            // Continue checking every 100ms until auth check completes
            setTimeout(checkAuthStatus, 100);
          }
        };
        
        checkAuthStatus();
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    // Fallback timer - maximum 5 seconds
    const fallbackTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onComplete, authCheckComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          {/* Minimal gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #0F766E, #14B8A6, #0F766E)',
            opacity: 0.8
          }} />

          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3rem',
            position: 'relative',
            zIndex: 1,
            maxWidth: '700px',
            padding: '4rem'
          }}>

            {/* Logo Section */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
              }}
            >
              {/* Company Logo */}
              <div style={{
                width: '160px',
                height: '160px',
                background: '#FFFFFF',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #E2E8F0',
                boxShadow: '0 8px 32px rgba(15, 118, 110, 0.12)',
                padding: '20px',
                position: 'relative'
              }}>
                <img 
                  src={companyLogo} 
                  alt="Fraha Pharmacy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Brand Identity */}
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1
                }}>
                  Fraha Pharmacy
                </h1>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748B',
                  margin: '0.75rem 0 0 0',
                  fontWeight: 500,
                  letterSpacing: '0.025em'
                }}>
                  Point of Sale System
                </p>
              </div>
            </motion.div>

            {/* Divider Line */}
            <div style={{
              width: '80px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #CBD5E1, transparent)',
              opacity: 0.6
            }} />

            {/* Loading Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ width: '100%', maxWidth: '500px' }}
            >
              {/* Current Stage */}
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '2.5rem' }}
              >
                <div style={{
                  fontSize: '1.25rem',
                  color: '#0F766E',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.01em'
                }}>
                  {stages[currentStage]?.label}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: '#94A3B8',
                  fontWeight: 400
                }}>
                  {stages[currentStage]?.sublabel}
                  {!authCheckComplete && ' • Checking authentication...'}
                  {authError && ` • ${authError}`}
                </div>
              </motion.div>

              {/* Progress Bar Container */}
              <div style={{
                width: '100%',
                height: '8px',
                background: '#F1F5F9',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Background shimmer effect */}
                <motion.div
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(15, 118, 110, 0.1), transparent)',
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Actual progress */}
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #0F766E, #14B8A6)',
                    borderRadius: '4px',
                    position: 'relative',
                    boxShadow: progress > 5 ? '0 0 12px rgba(15, 118, 110, 0.4)' : 'none'
                  }}
                >
                  {/* Progress bar glow */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '40px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5))',
                    borderRadius: '4px'
                  }} />
                </motion.div>
              </div>

              {/* Progress percentage */}
              <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '1rem',
                  color: '#0F766E',
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '0.05em'
                }}>
                  {Math.floor(progress)}%
                </div>
                
                {/* Stage dots */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {stages.map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: currentStage === index ? 1.2 : 0.9,
                        backgroundColor: index <= currentStage ? '#0F766E' : '#E2E8F0'
                      }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%'
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                position: 'absolute',
                bottom: '2.5rem',
                fontSize: '0.9rem',
                color: '#94A3B8',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0F766E'
              }} />
              <span>Version 2.4.1</span>
              <div style={{
                width: '2px',
                height: '16px',
                background: '#E2E8F0',
                margin: '0 0.5rem'
              }} />
              <span>© 2025 Fraha Pharmacy</span>
            </motion.div>
          </div>

          {/* Bottom accent line */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #0F766E, #14B8A6, #0F766E)',
            opacity: 0.8
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;