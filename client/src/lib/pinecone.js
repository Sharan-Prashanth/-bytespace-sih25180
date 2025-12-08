import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;

export function getPineconeClient() {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

export async function queryPinecone(query, topK = 5) {
  const client = getPineconeClient();
  const indexHost = process.env.PINECONE_INDEX_HOST;
  
  if (!indexHost) {
    throw new Error('PINECONE_INDEX_HOST is not set');
  }

  const index = client.index('coal-rag-index', indexHost);

  const embeddingResponse = await fetch('http://localhost:8000/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: query }),
  });

  if (!embeddingResponse.ok) {
    const errorText = await embeddingResponse.text();
    throw new Error(`Failed to create embedding: ${errorText}`);
  }

  const { embedding } = await embeddingResponse.json();
  const queryVector = embedding;

  const queryResponse = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => {
    const metadata = match.metadata || {};
    const text = metadata.text || metadata.content || metadata.chunk || metadata.page_content || JSON.stringify(metadata);
    
    console.log('Match metadata keys:', Object.keys(metadata));
    console.log('Extracted text:', text.substring(0, 100));
    
    return {
      id: match.id,
      score: match.score || 0,
      text: text,
    };
  });
}
