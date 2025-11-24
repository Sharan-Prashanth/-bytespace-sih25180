import { useState, useEffect } from 'react';

// TODO: Replace mock data with actual API calls
export function useCollaborateData(proposalId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!proposalId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // TODO: Replace with actual API endpoint
        // const response = await fetch(`/api/proposals/${proposalId}/collaborate`, {
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   }
        // });
        // const result = await response.json();

        // MOCK DATA - Remove when backend is ready
        const mockData = {
          proposal: {
            _id: proposalId,
            title: 'Sample Research Proposal',
            status: 'under-review-committee',
            stage: 'Committee Review',
            version: 3,
            principalInvestigator: 'Dr. John Doe',
            fundingScheme: 'SERB Core Research Grant',
            fundingAgencies: ['SERB', 'DST'],
            requestedBudget: 2500000,
            duration: 36,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            department: 'Computer Science',
            institution: 'IIT Delhi'
          },
          collaborators: [
            {
              _id: '1',
              fullName: 'Dr. John Doe',
              email: 'john@example.com',
              role: 'Principal Investigator',
              avatar: 'JD',
              isOnline: true,
              permissions: { canEdit: true, canComment: true, canInvite: true }
            },
            {
              _id: '2',
              fullName: 'Dr. Jane Smith',
              email: 'jane@example.com',
              role: 'Co-Investigator',
              avatar: 'JS',
              isOnline: true,
              permissions: { canEdit: true, canComment: true, canInvite: false }
            },
            {
              _id: '3',
              fullName: 'Prof. Mike Johnson',
              email: 'mike@example.com',
              role: 'Committee Member',
              avatar: 'MJ',
              isOnline: false,
              permissions: { canEdit: false, canComment: true, canInvite: false }
            }
          ],
          suggestions: [
            {
              _id: 's1',
              authorName: 'AI Assistant',
              authorAvatar: 'AI',
              source: 'ai',
              section: 'Research Methodology',
              quote: 'We will use machine learning algorithms...',
              content: 'Consider adding details about data collection and preprocessing steps.',
              status: 'pending',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              replies: []
            },
            {
              _id: 's2',
              authorName: 'Prof. Mike Johnson',
              authorAvatar: 'MJ',
              source: 'reviewer',
              section: 'Budget Justification',
              quote: null,
              content: 'Please provide more detailed breakdown of equipment costs.',
              status: 'pending',
              createdAt: new Date(Date.now() - 43200000).toISOString(),
              replies: [
                {
                  authorName: 'Dr. John Doe',
                  authorAvatar: 'JD',
                  content: 'I will add the detailed breakdown in the next revision.',
                  createdAt: new Date(Date.now() - 21600000).toISOString()
                }
              ]
            }
          ],
          activeCollaborators: ['1', '2']
        };

        setData(mockData);
        setError(null);
      } catch (err) {
        console.error('Error fetching collaborate data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proposalId]);

  return { data, loading, error };
}
