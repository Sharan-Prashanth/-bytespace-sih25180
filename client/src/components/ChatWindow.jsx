'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ChatWindow({ 
  showChatWindow, 
  setShowChatWindow, 
  messages = [], 
  onSendMessage, 
  theme = 'light', 
  currentUser = null,
  isReadOnly = false 
}) {
  const [currentMessage, setCurrentMessage] = useState('');
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  // Theme helpers
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  
  // Theme-based classes matching minimal black/white UI
  const panelBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-black/10';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-slate-400' : 'text-black/60';
  const inputBg = isDarkest ? 'bg-neutral-800 border-neutral-700' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-black/20';
  const messagesBg = isDarkest ? 'bg-black' : isDark ? 'bg-slate-900' : 'bg-slate-50/50';
  const headerBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700' : 'bg-white';
  const myMsgBg = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const otherMsgBg = isDarkest ? 'bg-neutral-800 border border-neutral-700' : isDark ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-black/10';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (showChatWindow && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChatWindow]);

  // Handle ESC key to close chat
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showChatWindow) {
        setShowChatWindow(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showChatWindow, setShowChatWindow]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isReadOnly) return;
    
    onSendMessage(currentMessage.trim());
    setCurrentMessage('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // If today, show time
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // If yesterday
    else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // If this week
    else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // Otherwise, show full date
    else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const isMyMessage = (message) => {
    if (!currentUser) return false;
    return message.sender?.userId === currentUser._id || 
           message.sender?.userId?.toString() === currentUser._id?.toString() ||
           message.isCurrentUser;
  };

  return (
    <>
      {/* Chat Panel */}
      <div 
        className={`fixed top-0 right-0 w-96 h-full ${panelBg} border-l ${borderColor} shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          showChatWindow ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`${headerBg} border-b ${borderColor} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isDark ? 'bg-white/10' : 'bg-black/5'} rounded-lg flex items-center justify-center`}>
                <MessageSquare className={`w-5 h-5 ${textColor}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${textColor}`}>Team Discussion</h3>
                <p className={`text-xs ${subTextColor}`}>
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowChatWindow(false)}
              className={`${textColor} ${hoverBg} p-2 rounded-lg transition-colors`}
              title="Close chat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={chatMessagesRef}
          className={`flex-1 overflow-y-auto p-4 space-y-3 ${messagesBg}`}
        >
          {messages.length === 0 ? (
            <div className={`text-center py-12 ${subTextColor}`}>
              <MessageSquare className={`w-12 h-12 mx-auto mb-3 opacity-30`} />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = isMyMessage(message);
              
              return (
                <div key={message._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg shadow-sm ${
                    isMine 
                      ? `${myMsgBg} rounded-br-none` 
                      : `${otherMsgBg} ${textColor} rounded-bl-none`
                  }`}>
                    {/* Message header (for other users' messages) */}
                    {!isMine && (
                      <div className={`px-3 pt-2 pb-1 border-b ${borderColor}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${textColor}`}>
                            {message.sender?.fullName || 'Unknown User'}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-white/10' : 'bg-black/5'
                          } ${subTextColor}`}>
                            {message.sender?.role || 'USER'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className="px-3 py-2">
                      <div className={`text-sm whitespace-pre-wrap break-words ${
                        isMine ? '' : textColor
                      }`}>
                        {message.message || message.content}
                      </div>
                      <div className={`text-[10px] mt-1 ${
                        isMine 
                          ? (isDark ? 'text-black/50' : 'text-white/60')
                          : subTextColor
                      }`}>
                        {formatTime(message.timestamp || message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Read-only notice */}
        {isReadOnly && (
          <div className={`px-4 py-2 border-t ${borderColor} ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
            <p className={`text-xs text-center ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              This proposal is closed. You can view messages but cannot send new ones.
            </p>
          </div>
        )}

        {/* Message Input */}
        {!isReadOnly && (
          <div className={`p-4 border-t ${borderColor} ${panelBg}`}>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className={`flex-1 px-3 py-2 border ${inputBg} ${textColor} rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  isDark ? 'focus:ring-white/30' : 'focus:ring-black/30'
                } placeholder-black/40`}
                placeholder="Type a message..."
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark 
                    ? 'bg-white text-black hover:bg-gray-200 disabled:bg-white/20 disabled:text-white/40'
                    : 'bg-black text-white hover:bg-black/90 disabled:bg-black/20 disabled:text-black/40'
                } disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {showChatWindow && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setShowChatWindow(false)}
        />
      )}
    </>
  );
}
