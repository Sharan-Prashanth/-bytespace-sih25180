import React from 'react';

const ViewHeader = ({ proposalCode, projectLeader, status }) => {
  return (
    <div className="bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">View Proposal</h1>
            <div className="flex items-center gap-4 text-sm text-black">
              <span>Code: <span className="font-semibold">{proposalCode}</span></span>
              <span className="text-black/40">|</span>
              <span>Leader: <span className="font-semibold">{projectLeader}</span></span>
              <span className="text-black/40">|</span>
              <span>Status: <span className="font-semibold">{status}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewHeader;
