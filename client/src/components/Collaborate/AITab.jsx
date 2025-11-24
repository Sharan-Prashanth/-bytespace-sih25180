import { useState } from 'react';
import Chatbot from '@/components/Chatbot';

export default function AITab({ proposalId }) {
  const [showSaarthi, setShowSaarthi] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <Chatbot 
        showSaarthi={showSaarthi}
        setShowSaarthi={setShowSaarthi}
        showVersionHistory={false}
        setShowVersionHistory={() => {}}
        context="collaborate"
        proposalData={{ id: proposalId }}
        onClose={() => setShowSaarthi(false)}
      />
    </div>
  );
}
