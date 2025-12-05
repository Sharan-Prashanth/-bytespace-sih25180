'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatWindow({ showChatWindow, setShowChatWindow, messages, onSendMessage, theme = 'light' }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  
  // Theme-based classes
  const panelBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-white';
  const inputBorder = isDarkest ? 'border-neutral-600' : isDark ? 'border-slate-600' : 'border-slate-300';
  const messagesBg = isDarkest ? 'bg-neutral-950' : isDark ? 'bg-slate-900' : 'bg-slate-50';
  const headerBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800';
  const iconBg = isDark ? 'bg-slate-600' : 'bg-blue-100';
  const iconColor = isDark ? 'text-white' : 'text-blue-600';
  const otherMsgBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200';
  const typingBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-blue-200';

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    onSendMessage(currentMessage);
    setCurrentMessage('');
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed top-0 right-0 w-96 h-full ${panelBg} border-l ${borderColor} shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
        showChatWindow ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Chat Header */}
        <div className={`${headerBg} p-4 border-b ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Team Discussion</h3>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>Collaborative Chat</p>
              </div>
            </div>
            <button
              onClick={() => setShowChatWindow(false)}
              className={`${isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-blue-100 hover:text-white hover:bg-blue-700/50'} p-2 rounded-full transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={chatMessagesRef}
          className={`flex-1 overflow-y-auto p-4 space-y-3 ${messagesBg}`}
        >
          {messages.length === 0 ? (
            <div className={`text-center py-8 ${subTextColor}`}>
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.isCurrentUser || message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.isCurrentUser || message.type === 'user' 
                    ? `${isDark ? 'bg-white text-black' : 'bg-black text-white'} rounded-br-none` 
                    : message.type === 'ai'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-bl-none'
                    : `${otherMsgBg} ${textColor} border rounded-bl-none`
                } shadow-md`}>
                  {!message.isCurrentUser && message.type !== 'user' && (
                    <div className={`text-xs font-semibold mb-1 ${message.type === 'ai' ? 'text-white/75' : subTextColor}`}>
                      {message.sender} • {message.role}
                    </div>
                  )}
                  <div className="text-sm">
                    {message.content.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="mb-1">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.isCurrentUser || message.type === 'user' 
                      ? (isDark ? 'text-black/60' : 'text-white/60')
                      : message.type === 'ai' 
                      ? 'text-white/60' 
                      : subTextColor
                  }`}>
                    {formatTime(message.time)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`${typingBg} border rounded-lg rounded-bl-none p-3 shadow-md`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 ${isDark ? 'bg-white' : 'bg-blue-500'} rounded-full animate-bounce`}></div>
                    <div className={`w-2 h-2 ${isDark ? 'bg-white' : 'bg-blue-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 ${isDark ? 'bg-white' : 'bg-blue-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className={`text-sm ${textColor}`}>Team member is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className={`p-4 ${panelBg} border-t ${borderColor}`}>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className={`flex-1 px-4 py-2 border ${inputBorder} ${inputBg} ${textColor} rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-white/30 focus:border-white/30' : 'focus:ring-black/30 focus:border-black/30'}`}
              placeholder="Type your message..."
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!currentMessage.trim() || isTyping}
              className={`${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'} disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md`}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Chat Backdrop */}
      {showChatWindow && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setShowChatWindow(false)}
        />
      )}
    </>
  );
}