import { useState } from 'react';
import ChatWindow from '@/components/ChatWindow';

export default function ChatTab({ proposalId, currentUser }) {
  const [messages, setMessages] = useState([
    {
      type: 'team',
      sender: 'Dr. Jane Smith',
      role: 'Co-Investigator',
      content: 'I have updated the methodology section.',
      time: '10:30 AM'
    }
  ]);

  const handleSendMessage = (message) => {
    const newMessage = {
      type: 'user',
      content: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    
    // TODO: Send message to backend
    // await fetch(`/api/proposals/${proposalId}/chat`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    //   body: JSON.stringify({ message })
    // });
  };

  return (
    <div className="flex flex-col h-full">
      <ChatWindow 
        showChatWindow={true}
        setShowChatWindow={() => {}}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
