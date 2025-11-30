'use client';

const ProposalMetadata = ({ proposalCode, status, version }) => {
  const getStatusLabel = (status) => {
    if (!status) return 'DRAFT';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-black mb-1">Proposal Code</label>
          <div className="text-lg font-bold text-black font-mono">{proposalCode || 'N/A'}</div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Version</label>
            <div className="text-sm font-semibold text-black">{version || '1.0'}</div>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 text-black">
            {getStatusLabel(status)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalMetadata;
