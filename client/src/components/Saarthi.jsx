'use client';

import { useState, useEffect, useRef } from "react";

export default function Chatbot({ showSaarthi, setShowSaarthi, showVersionHistory, setShowVersionHistory, context, proposalData, onClose }) {
  console.log('Chatbot render - showSaarthi:', showSaarthi, 'context:', context);
  
  // Internal state for reviewer mode
  const [isVisible, setIsVisible] = useState(context === 'reviewer' ? true : showSaarthi);
  
  // Chat State - Different messages for reviewer context
  const getInitialMessages = () => {
    if (context === 'reviewer') {
      return [
        { 
          type: 'bot', 
          text: 'नमस्कार! Welcome! I\'m your AI Review Assistant, specialized in helping reviewers evaluate research proposals effectively. I support multiple Indian languages for comprehensive assistance.',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'bot',
          text: 'I can assist you with:\n• Proposal quality assessment\n• Technical merit evaluation\n• Budget analysis and optimization\n• Compliance with S&T guidelines\n• Comparative research analysis\n• Review documentation\n\nWhat aspect of this proposal would you like me to help evaluate?',
          timestamp: new Date().toLocaleTimeString()
        }
      ];
    } else {
      return [
        { 
          type: 'bot', 
          text: 'नमस्कार! स्वागतम्! Welcome! I\'m SAARTHI, your intelligent multilingual AI research assistant. I support Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia, and Assamese for comprehensive assistance.',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'bot',
          text: 'I can assist you with:\n• Advanced research methodology design\n• Coal technology innovation strategies\n• Budget optimization and resource allocation\n• Technical writing and documentation\n• NaCCER compliance and S&T guidelines\n• Multi-institutional collaboration frameworks\n\nWhat specific aspect of your proposal would you like to explore?',
          timestamp: new Date().toLocaleTimeString()
        }
      ];
    }
  };
  
  const [chatMessages, setChatMessages] = useState(getInitialMessages());
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);
  const [showRing, setShowRing] = useState(false);
  
  // Chat scroll reference
  const chatMessagesRef = useRef(null);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle 30-second bounce and ring animation
  useEffect(() => {
    console.log('Chatbot component mounted, showSaarthi:', showSaarthi);
    
    const startAnimations = () => {
      console.log('Starting bounce and ring animations');
      setShouldBounce(true);
      
      // Ring effects timing to match with 3 bounces
      // First ring
      setShowRing(true);
      setTimeout(() => setShowRing(false), 1000);
      
      // Second ring (after ~2s)
      setTimeout(() => {
        setShowRing(true);
        setTimeout(() => setShowRing(false), 1000);
      }, 2000);
      
      // Third ring (after ~4s)
      setTimeout(() => {
        setShowRing(true);
        setTimeout(() => setShowRing(false), 1000);
      }, 4000);
      
      // Stop bounce after animation completes (2s animation * 3 iterations = 6s)
      setTimeout(() => {
        setShouldBounce(false);
      }, 6000);
    };

    // Start first animation after 15 seconds
    const initialTimeout = setTimeout(() => {
      console.log('15 seconds passed, starting animations');
      startAnimations();
    }, 15000);

    // Then repeat every 15 seconds
    const interval = setInterval(() => {
      console.log('15 second interval triggered');
      startAnimations();
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // SAARTHI Chat Handler
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      type: 'user',
      text: currentMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);
    
    // Auto scroll after user message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Simulate AI processing and response
    setTimeout(() => {
      const responses = [
        'मैं आपके अनुसंधान प्रस्ताव के लिए विस्तृत रणनीति तैयार कर रहा हूँ। आइए कोयला प्रौद्योगिकी में नवाचार के अवसरों पर चर्चा करते हैं।',
        'Excellent query! For coal technology research, I recommend focusing on clean coal technologies, carbon capture methods, and sustainable mining practices. Let me suggest some specific research directions.',
        'Based on NaCCER guidelines, your proposal should emphasize multi-institutional collaboration and technology transfer potential. I can help structure your methodology section.',
        'आपका बजट अनुकूलन एक महत्वपूर्ण पहलू है। मैं संसाधन आवंटन और cost-effectiveness metrics के लिए सुझाव दे सकता हूँ।',
        'For S&T compliance, ensure your proposal aligns with national coal research priorities. I can guide you through the technical documentation requirements.',
        'Consider incorporating AI/ML applications in coal analysis and predictive maintenance. This aligns with current research trends and funding priorities.',
        'Your research timeline should include milestone-based deliverables. Let me help you create a realistic implementation schedule.',
        'Multi-language documentation support is available. আমি বাংলা, हिंदी, English और अन्य भारतीय भाषाओं में सहायता कर सकता हूँ।'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = {
        type: 'bot',
        text: randomResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Auto scroll after bot message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }, 2000);
  };

  // Custom CSS animations for SAARTHI chatbot
  useEffect(() => {
    const styles = `
      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slide-out-right {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes warm-glow {
        0%, 100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.05);
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-10px) rotate(180deg);
        }
      }

      @keyframes float-reverse {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(10px) rotate(-180deg);
        }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes message-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slide-out-left {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .animate-slide-out-right {
        animation: slide-out-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .animate-warm-glow {
        animation: warm-glow 3s ease-in-out infinite;
      }

      .animate-float {
        animation: float 4s ease-in-out infinite;
      }

      .animate-float-reverse {
        animation: float-reverse 4s ease-in-out infinite;
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }

      .animate-message-slide-up {
        animation: message-slide-up 0.3s ease-out;
      }

      .animate-slide-out-left {
        animation: slide-out-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .animation-delay-1000 {
        animation-delay: 1s;
      }

      .animation-delay-2000 {
        animation-delay: 2s;
      }

      .animation-delay-3000 {
        animation-delay: 3s;
      }

      .animation-delay-4000 {
        animation-delay: 4s;
      }

      .animation-delay-5000 {
        animation-delay: 5s;
      }

      .animate-delayed-bounce {
        animation: delayed-bounce 2s ease-in-out;
        animation-iteration-count: 3;
      }

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

      .animate-delayed-ring {
        animation: delayed-ring 1s ease-out;
      }

      .animate-blink-green {
        animation: blink-green 2s ease-in-out infinite;
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
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      {!(context === 'reviewer' ? isVisible : showSaarthi) && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className={`relative group ${shouldBounce ? 'animate-delayed-bounce' : ''}`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('SAARTHI button clicked');
                setShouldBounce(false); // Stop bouncing when clicked
                if (context === 'reviewer') {
                  setIsVisible(true);
                } else if (setShowSaarthi) {
                  setShowSaarthi(true);
                }
                // Close version history if it's open
                if (showVersionHistory && setShowVersionHistory) {
                  setShowVersionHistory(false);
                }
              }}
              className="group relative overflow-hidden w-16 h-16 bg-gradient-to-br from-orange-500 via-white to-green-500 hover:from-orange-600 hover:to-green-600 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 hover:rotate-3 transform border-4 border-white cursor-pointer z-30"
              style={{
                background: 'linear-gradient(135deg, #ff7f00 0%, #ff7f00 25%, #ffffff 25%, #ffffff 75%, #138808 75%, #138808 100%)',
                filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.2))',
                pointerEvents: 'auto'
              }}
            >
              <div className="relative z-10 flex items-center justify-center">
                <img src="/images/AI assistant logo.png" alt="SAARTHI" className="w-8 h-8 rounded-lg shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                {/* Active indicator dot - more visible and positioned correctly */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-blink-green" style={{ zIndex: 1000 }}></div>
              </div>
              
              {/* Floating Effects */}
              <div className="absolute inset-0 rounded-2xl animate-warm-glow"
                style={{
                  background: 'linear-gradient(135deg, #ff7f00 0%, #ffffff 50%, #138808 100%)',
                  filter: 'blur(20px)',
                  opacity: '0.6',
                  zIndex: -1
                }}></div>
            </button>
            
            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 pointer-events-none z-60">
              <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2">
                  <span>Launch SAARTHI AI</span>
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-t-4 border-t-black/90 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
              </div>
            </div>
            
            {/* Notification Badge */}
            <div style={{ zIndex: 100 }} className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg">
              AI
            </div>
            
            {/* Animated Ring Effects - Only when showRing is true */}
            {showRing && (
              <>
                <div className="absolute inset-0 rounded-2xl border-2 border-orange-400 animate-delayed-ring"></div>
                <div className="absolute inset-0 rounded-2xl border-2 border-green-400 animate-delayed-ring" style={{ animationDelay: '0.2s' }}></div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SAARTHI Chat Window */}
      {(context === 'reviewer' ? isVisible : showSaarthi) && (
        <div className="saarthi-chat-window fixed top-0 right-0 w-1/3 h-full bg-white border-l-2 border-blue-300 shadow-2xl z-50 flex flex-col animate-slide-in-right">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 p-4 border-b border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #ff7f00 0%, #ff7f00 33%, #ffffff 33%, #ffffff 66%, #138808 66%, #138808 100%)'
                  }}>
                  <img src="/images/AI assistant logo.png" alt="SAARTHI" className="w-8 h-8 rounded-full" />
                  {/* Active indicator dot - positioned outside overflow hidden container */}
                </div>
                {/* Green dot positioned outside the logo container */}
                <div className="absolute top-5 left-12 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-blink-green" style={{ zIndex: 1000 }}></div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {context === 'reviewer' ? 'AI Review Assistant' : 'SAARTHI AI'}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {context === 'reviewer' ? 'Proposal Evaluator' : 'Research Assistant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('Close button clicked');
                  if (context === 'reviewer') {
                    if (onClose) {
                      onClose();
                    } else {
                      setIsVisible(false);
                    }
                  } else {
                    const chatWindow = document.querySelector('.saarthi-chat-window');
                    if (chatWindow) {
                      chatWindow.classList.add('animate-slide-out-left');
                      setTimeout(() => {
                        if (setShowSaarthi) setShowSaarthi(false);
                      }, 300);
                    } else {
                      if (setShowSaarthi) setShowSaarthi(false);
                    }
                  }
                }}
                className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-blue-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div 
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-blue-50"
          >
            {chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-message-slide-up`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-br-none' 
                    : 'bg-white text-black border border-blue-200 rounded-bl-none'
                } shadow-md`}>
                  <div className="text-sm">
                    {message.text.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="mb-1">
                        {line}
                      </div>
                    ))}
                  </div>
                  {message.timestamp && (
                    <div className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-orange-100' : 'text-blue-500'
                    }`}>
                      {message.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-message-slide-up">
                <div className="bg-white border border-blue-200 rounded-lg rounded-bl-none p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-1000"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-2000"></div>
                    </div>
                    <span className="text-blue-500 text-sm">SAARTHI is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-blue-200">
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ask SAARTHI anything..."
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim() || isTyping}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
