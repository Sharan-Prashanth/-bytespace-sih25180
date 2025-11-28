import React from 'react';
import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';

const Header = () => {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="bg-white border-b border-black/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Create New Proposal</h1>
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Header;
