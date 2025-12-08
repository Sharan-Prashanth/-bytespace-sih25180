import { NextResponse } from 'next/server';
import { queryPinecone } from '@/lib/pinecone';
import { generateChatCompletion } from '@/lib/openai';

const SYSTEM_PROMPT = 
  'You are Sarthi AI, an expert assistant for coal ministry research and project documents. ' +
  'Answer questions based on the provided context from coal industry documents. ' +
  'If you find relevant information in the context, provide a detailed and helpful answer. ' +
  'If the context does not contain the answer, politely say you cannot find that information in the available documents.';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const results = await queryPinecone(message, 10);

    console.log('Retrieved chunks:', results.map(r => ({ id: r.id, score: r.score, preview: r.text.substring(0, 100) })));

    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const metadata = JSON.parse(result.text);
          
          const response = await fetch('http://localhost:8000/fetch-source-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: metadata.source,
              page: metadata.page
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            return { ...result, text: data.text };
          }
        } catch (e) {
          console.error('Error fetching source text:', e);
        }
        return result;
      })
    );

    const context = enrichedResults
      .map((result, index) => `Document ${index + 1}:\n${result.text}`)
      .join('\n\n---\n\n');

    const answer = await generateChatCompletion(SYSTEM_PROMPT, context, message);

    const sources = enrichedResults.map((result) => ({
      id: result.id,
      score: result.score,
      text: result.text,
    }));

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
