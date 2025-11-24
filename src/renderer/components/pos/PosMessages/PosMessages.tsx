// src/renderer/src/components/pos/PosMessages/PosMessages.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sun, Moon, Coffee, Zap, Clock } from 'lucide-react';
import './PosMessages.css';

interface PosMessagesProps {
  user?: {
    fullname: string;
    username?: string;
  };
  hasShownGreeting?: boolean;
  onGreetingShown?: () => void;
}

export const PosMessages: React.FC<PosMessagesProps> = ({
  user,
  hasShownGreeting = false,
  onGreetingShown
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState('');

  // Get user's first name safely
  const getUserFirstName = (): string => {
    if (!user?.fullname || user.fullname === 'Unknown User') return 'Team';
    return user.fullname.split(' ')[0];
  };

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const firstName = getUserFirstName();
    
    if (hour < 6) {
      return { 
        text: `Working late, ${firstName}? Your dedication is appreciated!`,
        icon: <Moon size={14} />
      };
    }
    if (hour < 12) {
      return { 
        text: `Good morning, ${firstName}! Ready for a productive day?`,
        icon: <Sun size={14} />
      };
    }
    if (hour < 15) {
      return { 
        text: `Good afternoon, ${firstName}! Hope your day is going well.`,
        icon: <Zap size={14} />
      };
    }
    if (hour < 18) {
      return { 
        text: `Good evening, ${firstName}! Steady progress through the day.`,
        icon: <Clock size={14} />
      };
    }
    return { 
      text: `Good evening, ${firstName}! Wrapping up the day strong.`,
      icon: <Coffee size={14} />
    };
  };

  // Show greeting only once when component mounts
  useEffect(() => {
    if (!hasShownGreeting && user?.fullname) {
      const greeting = getTimeBasedGreeting();
      setCurrentGreeting(greeting.text);
      setIsVisible(true);
      
      // Notify parent that greeting has been shown
      if (onGreetingShown) {
        onGreetingShown();
      }

      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [hasShownGreeting, user?.fullname, onGreetingShown]);

  if (!user?.fullname || hasShownGreeting) {
    return null;
  }

  const greeting = getTimeBasedGreeting();

  return (
    <div className={`pos-messages-container ${isMinimized ? 'minimized' : ''}`}>
      <AnimatePresence>
        {isVisible && !isMinimized && (
          <motion.div
            className="pos-message"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="message-header">
              <div className="message-icon">
                <Brain size={12} />
              </div>
              <span className="message-label">Welcome</span>
              <button 
                className="minimize-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                −
              </button>
            </div>
            <div className="message-content">
              <div className="message-text">{greeting.text}</div>
              <div className="message-context">
                <span className="context-tag">greeting</span>
                <span className="context-tag">welcome</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMinimized && (
        <motion.button
          className="message-bubble"
          onClick={() => {
            setIsMinimized(false);
            setIsVisible(true);
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          title="Show greeting"
        >
          <Brain size={14} />
        </motion.button>
      )}
    </div>
  );
};

export default PosMessages;