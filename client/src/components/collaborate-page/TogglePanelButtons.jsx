'use client';

import { useState, useEffect } from 'react';

const TogglePanelButtons = ({ 
  showVersionHistory, 
  setShowVersionHistory,
  showTeamChat,
  setShowTeamChat,
  showSaarthi,
  setShowSaarthi
}) => {
  const [shouldBounce, setShouldBounce] = useState(false);
  const [showRing, setShowRing] = useState(false);

  // Saarthi 15-second bounce and ring animation
  useEffect(() => {
    const startAnimations = () => {
      if (showSaarthi) return; // Don't animate if already open
      
      setShouldBounce(true);
      
      // Ring effects timing to match with 3 bounces
      setShowRing(true);
      setTimeout(() => setShowRing(false), 1000);
      
      setTimeout(() => {
        setShowRing(true);
        setTimeout(() => setShowRing(false), 1000);
      }, 2000);
      
      setTimeout(() => {
        setShowRing(true);
        setTimeout(() => setShowRing(false), 1000);
      }, 4000);
      
      // Stop bounce after animation completes
      setTimeout(() => {
        setShouldBounce(false);
      }, 6000);
    };

    // Start first animation after 15 seconds
    const initialTimeout = setTimeout(startAnimations, 15000);

    // Then repeat every 15 seconds
    const interval = setInterval(startAnimations, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showSaarthi]);

  // Custom CSS animations
  useEffect(() => {
    const styles = `
      @keyframes delayed-bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }

      @keyframes delayed-ring {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.4);
          opacity: 0;
        }
      }

      @keyframes blink-green {
        0%, 50% {
          opacity: 1;
          transform: scale(1);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }
        25% {
          opacity: 0.4;
          transform: scale(0.8);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
        }
        75% {
          opacity: 1;
          transform: scale(1.1);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
        }
        100% {
          opacity: 1;
          transform: scale(1);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }
      }

      .animate-delayed-bounce {
        animation: delayed-bounce 2s ease-in-out;
        animation-iteration-count: 3;
      }

      .animate-delayed-ring {
        animation: delayed-ring 1s ease-out;
      }

      .animate-blink-green {
        animation: blink-green 2s ease-in-out infinite;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 flex items-center gap-3 z-40">
      {/* Version History Button */}
      <div className="relative group">
        <button
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
            showVersionHistory 
              ? 'bg-black text-white scale-110' 
              : 'bg-white text-black border border-black/20 hover:bg-black/5 hover:scale-105 hover:shadow-xl'
          }`}
          title="Version History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
          <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap">
            Version History
          </div>
        </div>
      </div>

      {/* Team Chat Button */}
      <div className="relative group">
        <button
          onClick={() => setShowTeamChat(!showTeamChat)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
            showTeamChat 
              ? 'bg-black text-white scale-110' 
              : 'bg-white text-black border border-black/20 hover:bg-black/5 hover:scale-105 hover:shadow-xl'
          }`}
          title="Team Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
          <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap">
            Team Chat
          </div>
        </div>
      </div>

      {/* Saarthi AI Button - with animations */}
      {!showSaarthi && (
        <div className={`relative group ${shouldBounce ? 'animate-delayed-bounce' : ''}`}>
          <button
            onClick={() => {
              setShouldBounce(false);
              setShowSaarthi(true);
            }}
            className="relative overflow-hidden w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 hover:rotate-3 transform border-4 border-white cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #ff7f00 0%, #ff7f00 25%, #ffffff 25%, #ffffff 75%, #138808 75%, #138808 100%)',
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.2))'
            }}
            title="Saarthi AI"
          >
            <div className="relative z-10 flex items-center justify-center">
              <img 
                src="/images/AI assistant logo.png" 
                alt="SAARTHI" 
                className="w-7 h-7 rounded-lg shadow-lg transform group-hover:scale-110 transition-transform duration-300" 
              />
              {/* Active indicator dot */}
              <div 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-lg animate-blink-green" 
                style={{ zIndex: 1000 }}
              ></div>
            </div>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            <div className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap">
              Saarthi AI
            </div>
          </div>
          
          {/* AI Badge */}
          <div 
            className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-lg"
            style={{ zIndex: 100 }}
          >
            AI
          </div>
          
          {/* Animated Ring Effects */}
          {showRing && (
            <>
              <div className="absolute inset-0 rounded-2xl border-2 border-orange-400 animate-delayed-ring"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-green-400 animate-delayed-ring" style={{ animationDelay: '0.2s' }}></div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TogglePanelButtons;
