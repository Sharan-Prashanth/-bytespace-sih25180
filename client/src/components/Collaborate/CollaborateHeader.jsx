import { useRouter } from 'next/router';

export default function CollaborateHeader({ proposal, onBack, onViewTimeline }) {
  const router = useRouter();

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      cmpdi_review: 'bg-purple-500',
      expert_review: 'bg-indigo-500',
      tssrc_review: 'bg-yellow-500',
      ssrc_review: 'bg-orange-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      cmpdi_review: 'CMPDI Review',
      expert_review: 'Expert Review',
      tssrc_review: 'TSSRC Review',
      ssrc_review: 'SSRC Review',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white border-b-2 border-orange-200 shadow-md sticky top-0 z-40">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-black hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="h-8 w-px bg-gray-300" />
            
            <div>
              <h1 className="text-2xl font-bold text-black">{proposal?.title}</h1>
              <p className="text-sm text-black">ID: {proposal?.proposalNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-black">Status:</span>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(proposal?.status)}`}>
                  {getStatusLabel(proposal?.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-black">
                <span>Stage: <strong>{proposal?.stageOwner}</strong></span>
                <span>•</span>
                <span>Version: <strong>{proposal?.currentVersion}</strong></span>
              </div>
            </div>

            <div className="h-12 w-px bg-gray-300" />

            <div className="text-right text-sm text-black">
              <div>Submitted: {formatDate(proposal?.submittedAt)}</div>
              <div>Updated: {formatDate(proposal?.lastUpdated)}</div>
            </div>

            <button
              onClick={() => router.push(`/proposal/track/${proposal?._id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              View Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
