'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatWindow({ showChatWindow, setShowChatWindow, messages, onSendMessage }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

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

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed top-0 right-0 w-96 h-full bg-white border-l-2 border-blue-300 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
        showChatWindow ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 p-4 border-b border-blue-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Team Discussion</h3>
                <p className="text-sm text-blue-100">Collaborative Chat</p>
              </div>
            </div>
            <button
              onClick={() => setShowChatWindow(false)}
              className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-blue-700/50 transition-colors"
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
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-blue-50"
        >
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-br-none' 
                  : message.type === 'ai'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-bl-none'
                  : 'bg-white text-black border border-blue-200 rounded-bl-none'
              } shadow-md`}>
                {message.type !== 'user' && (
                  <div className="text-xs font-semibold mb-1 opacity-75">
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
                <div className="text-xs mt-1 opacity-75">
                  {message.time}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-blue-200 rounded-lg rounded-bl-none p-3 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-blue-500 text-sm">Team member is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-blue-200">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Type your message..."
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!currentMessage.trim() || isTyping}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md cursor-pointer"
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