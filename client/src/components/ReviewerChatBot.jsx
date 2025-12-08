'use client';

import { useState } from 'react';

export default function ReviewerChatBot() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const quickQuestions = [
    "What are the key evaluation criteria for coal projects?",
    "What documents should I review first?",
    "How to assess technical feasibility?",
    "What are the thrust areas for coal ministry?",
    "How to evaluate novelty in proposals?",
    "What is the budget approval process?"
  ];

  const handleSubmit = async (e, customMessage = null) => {
    e?.preventDefault();
    
    const query = customMessage || message;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    const userMessage = { role: 'user', content: query };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await res.json();
      setResponse(data);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources 
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setMessage(question);
    handleSubmit(null, question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              🔍 Reviewer Assistant AI
            </h1>
            <p className="text-blue-100">
              Your intelligent assistant for reviewing coal ministry research proposals
            </p>
          </div>

          <div className="p-6">
            {/* Quick Questions */}
            {chatHistory.length === 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  Quick Questions:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      <span className="text-blue-600 font-medium text-sm">
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="mb-6 max-h-96 overflow-y-auto space-y-4">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap mb-2">{msg.content}</p>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-xs font-semibold mb-2">📚 Sources Referenced:</p>
                              {msg.sources.slice(0, 3).map((source, idx) => (
                                <div key={idx} className="text-xs text-gray-600 mb-1">
                                  • Document {idx + 1} (Relevance: {(source.score * 100).toFixed(0)}%)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about evaluation guidelines, thrust areas, or review processes..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Detailed Sources View */}
            {response && response.sources.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  📄 Referenced Documents (Detailed View)
                </h2>
                <div className="space-y-4">
                  {response.sources.map((source, index) => (
                    <details
                      key={source.id}
                      className="bg-white p-4 rounded border border-gray-200"
                    >
                      <summary className="cursor-pointer font-semibold text-gray-700 hover:text-blue-600">
                        <span className="inline-flex items-center gap-2">
                          Document {index + 1} - Relevance: {(source.score * 100).toFixed(1)}%
                          <span className="text-xs text-gray-500 font-normal">
                            (Click to expand)
                          </span>
                        </span>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {source.text}
                        </p>
                        <div className="mt-3 text-xs text-gray-400 font-mono">
                          ID: {source.id}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Reviewers:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ask about specific evaluation criteria</li>
                <li>• Query guidelines for assessing technical feasibility</li>
                <li>• Get information about coal ministry thrust areas</li>
                <li>• Learn about budget validation processes</li>
                <li>• Understand novelty assessment methods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
