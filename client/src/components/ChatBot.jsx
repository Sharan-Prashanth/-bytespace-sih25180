'use client';

import { useState } from 'react';

export default function ChatBot() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Sarthi AI Chatbot</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question about coal ministry documents..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {response && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Answer:</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{response.answer}</p>
            </div>

            {response.sources.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">Retrieved Sources:</h2>
                <div className="space-y-4">
                  {response.sources.map((source, index) => (
                    <div
                      key={source.id}
                      className="p-4 bg-white rounded border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-900 font-semibold text-sm">
                          Document {index + 1}
                        </span>
                        <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded">
                          Relevance: {(source.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        {source.text}
                      </p>
                      <span className="text-gray-400 text-xs font-mono">
                        ID: {source.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
