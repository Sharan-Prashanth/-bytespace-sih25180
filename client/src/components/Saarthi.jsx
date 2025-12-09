'use client';

import { useState, useEffect, useRef } from "react";
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Chatbot({ showSaarthi, setShowSaarthi, showVersionHistory, setShowVersionHistory, context, proposalData, onClose }) {
  console.log('Chatbot render - showSaarthi:', showSaarthi, 'context:', context);
  
  const { user } = useAuth();
  
  // Internal state for reviewer mode - do NOT auto-open
  const [isVisible, setIsVisible] = useState(context === 'reviewer' ? false : showSaarthi);
  
  // Chat State - Different messages for reviewer context
  const getInitialMessages = () => {
    if (context === 'reviewer') {
      return [
        { 
          type: 'bot', 
          text: 'नमस्कार! வணக்கம்! Welcome! I\'m BIRBAL, your AI Review Assistant, specialized in helping reviewers evaluate research proposals effectively. I support Hindi (हिंदी), Tamil (தமிழ்), and English for comprehensive assistance.',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'bot',
          text: 'मैं आपकी सहायता कर सकता हूं | நான் உங்களுக்கு உதவ முடியும் | I can assist you with:\n• Proposal quality assessment\n• Technical merit evaluation\n• Budget analysis and optimization\n• Compliance with S&T guidelines\n• Comparative research analysis\n• Review documentation\n\nकृपया हिंदी, தமிழ், या English में पूछें! What would you like to know?',
          timestamp: new Date().toLocaleTimeString()
        }
      ];
    } else {
      return [
        { 
          type: 'bot', 
          text: 'नमस्कार! வணக்கம்! Welcome! मैं बिरबल हूं | நான் பிர்பால் | I\'m BIRBAL, your intelligent multilingual AI research assistant. I support Hindi (हिंदी), Tamil (தமிழ்), and English.',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'bot',
          text: 'मैं आपकी मदद कर सकता हूं | நான் உதவ முடியும் | I can assist you with:\n• Advanced research methodology design\n• Coal technology innovation strategies\n• Budget optimization and resource allocation\n• Technical writing and documentation\n• NaCCER compliance and S&T guidelines\n• Multi-institutional collaboration frameworks\n\nकृपया अपनी भाषा में पूछें | தயவுசெய்து உங்கள் மொழியில் கேளுங்கள் | Ask me in your preferred language!',
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

  // SAARTHI Chat Handler - Integrated with RAG Backend and Proposal Chat
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      type: 'user',
      text: currentMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const questionText = currentMessage;
    setCurrentMessage('');
    setIsTyping(true);
    
    // Auto scroll after user message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    try {
      // Detect if question is about user's proposals
      const isAboutProposal = /my proposal|my project|my research|my submission|proposal status|my budget|my timeline|proposal code|submitted proposal/i.test(questionText);
      
      let response;
      
      if (isAboutProposal && user?._id) {
        // Use proposal chat endpoint
        response = await apiClient.post('/api/proposal-chat/chat-proposals', {
          question: questionText,
          user_id: user._id
        });
        
        const botMessage = {
          type: 'bot',
          text: response.data.answer || 'I couldn\'t find information about your proposals.',
          proposals: response.data.proposals || [],
          timestamp: new Date().toLocaleTimeString()
        };
        
        setChatMessages(prev => [...prev, botMessage]);
        
      } else {
        // Use general RAG endpoint
        response = await apiClient.post('/api/rag/chat', {
          question: questionText,
          top_k: 10
        });
        
        const botMessage = {
          type: 'bot',
          text: response.data.answer || 'I apologize, but I couldn\'t generate a response. Please try again.',
          sources: response.data.sources || [],
          timestamp: new Date().toLocaleTimeString()
        };
        
        setChatMessages(prev => [...prev, botMessage]);
      }
      
      setIsTyping(false);
      
      // Auto scroll after bot message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error) {
      console.error('Chat Error:', error);
      
      // Fallback response on error
      const errorMessage = {
        type: 'bot',
        text: 'I apologize, but I\'m having trouble connecting to my knowledge base right now. Please ensure the backend server is running and try again. If the issue persists, I can still help you with general guidance about coal research proposals and NaCCER guidelines.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
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
              <div className="flex items-center gap-2">
                <img src="/images/AI assistant logo.png" alt="BIRBAL" className="w-8 h-8 rounded-lg shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
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
                  <span>Launch BIRBAL AI | बिरबल | பிர்பால்</span>
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
                  <img src="/images/AI assistant logo.png" alt="BIRBAL" className="w-8 h-8 rounded-full" />
                  {/* Active indicator dot - positioned outside overflow hidden container */}
                </div>
                {/* Green dot positioned outside the logo container */}
                <div className="absolute top-5 left-12 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-blink-green" style={{ zIndex: 1000 }}></div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {context === 'reviewer' ? 'BIRBAL - AI Review Assistant' : 'बिरबल BIRBAL AI'}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {context === 'reviewer' ? 'Proposal Evaluator' : 'अनुसंधान सहायक | ஆராய்ச்சி உதவியாளர் | Research Assistant'}
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
                    : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-300 rounded-bl-none'
                      : 'bg-white text-gray-900 border border-blue-200 rounded-bl-none'
                } shadow-md`}>
                  <div className="text-sm" style={{ color: message.type === 'user' ? 'white' : '#111827' }}>
                    {message.text.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="mb-1">
                        {line}
                      </div>
                    ))}
                  </div>
                  
                  {/* Display proposal info if available */}
                  {message.proposals && message.proposals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs font-semibold text-blue-600 mb-2">📋 Related Proposals:</div>
                      {message.proposals.map((proposal, idx) => (
                        <div key={idx} className="text-xs text-blue-700 mb-2 bg-blue-50 p-2 rounded">
                          <div className="font-semibold">{proposal.proposalCode}</div>
                          <div>{proposal.title}</div>
                          <div className="text-blue-500">Status: {proposal.status} | Relevance: {(proposal.relevance * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Display sources if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs font-semibold text-blue-600 mb-2">📚 Sources:</div>
                      {message.sources.slice(0, 3).map((source, idx) => (
                        <div key={idx} className="text-xs text-blue-700 mb-1">
                          • {source.source} (Relevance: {(source.score * 100).toFixed(1)}%)
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.timestamp && (
                    <div className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-orange-100' : message.isError ? 'text-red-600' : 'text-blue-500'
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
                    <span className="text-blue-500 text-sm">BIRBAL लिख रहा है... எழுதுகிறது... is typing...</span>
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
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                placeholder="बिरबल से पूछें | பிர்பாலிடம் கேளுங்கள் | Ask BIRBAL anything..."
                style={{ color: '#111827' }}
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
