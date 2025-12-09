from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

load_dotenv()

router = APIRouter()

# Initialize models and clients
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("coal-rag-index", host=os.getenv("PINECONE_INDEX_HOST"))

# Configure Gemini - use stable model instead of experimental
genai.configure(api_key=os.getenv("COMMON_GEMINI_KEY"))
llm = genai.GenerativeModel('gemini-2.5-flash-lite')

class ChatRequest(BaseModel):
    question: str
    top_k: int = 10

@router.post("/chat")
async def chat_with_rag(request: ChatRequest):
    try:
        # Generate embedding for the question
        question_embedding = embedding_model.encode(request.question).tolist()
        
        # Query Pinecone
        results = index.query(
            vector=question_embedding,
            top_k=request.top_k,
            include_metadata=True
        )
        
        # Extract context from results - check all possible text fields
        context_parts = []
        for match in results.matches:
            metadata = match.metadata or {}
            # Try multiple field names
            text = (metadata.get('text') or 
                   metadata.get('content') or 
                   metadata.get('chunk') or 
                   metadata.get('page_content') or 
                   str(metadata) if metadata else '')
            if text and len(str(text).strip()) > 10:  # Only add non-empty text
                context_parts.append(str(text))
        
        if not context_parts:
            # Return matches info for debugging
            debug_info = f"Found {len(results.matches)} matches but no text content. Metadata keys: {list(results.matches[0].metadata.keys()) if results.matches and results.matches[0].metadata else 'none'}"
            return {
                "answer": f"I found relevant documents but couldn't extract the text content. {debug_info}",
                "sources": [],
                "debug": debug_info
            }
        
        context = "\n\n".join(context_parts)
        
        # Generate prompt for Gemini
        prompt = f"""You are BIRBAL (बिरबल | பிர்பால்), an intelligent multilingual AI assistant specialized in coal research and S&T guidelines for NaCCER (National Centre for Coal Excellence and Research).

You can respond in three languages:
- Hindi (हिंदी) - if the user asks in Hindi
- Tamil (தமிழ்) - if the user asks in Tamil  
- English - if the user asks in English

Detect the user's question language and respond in THE SAME LANGUAGE. If the question is in Hindi, respond completely in Hindi. If in Tamil, respond in Tamil. If in English, respond in English.

Context from knowledge base:
{context}

User Question: {request.question}

Instructions:
1. IMPORTANT: Respond in the SAME language as the question
2. Answer based ONLY on the provided context
3. If the context doesn't contain enough information, say so politely in the user's language
4. Be precise, professional, and helpful
5. Support answers with specific details from the context
6. Use proper formatting for readability

Answer (in the user's question language):"""

        # Get response from Gemini
        response = llm.generate_content(prompt)
        answer = response.text
        
        # Prepare sources
        sources = []
        for i, match in enumerate(results.matches[:5]):
            metadata = match.metadata or {}
            sources.append({
                "score": float(match.score),
                "source": metadata.get('source', f'Document {i+1}'),
                "page": metadata.get('page', 'N/A')
            })
        
        return {
            "answer": answer,
            "sources": sources
        }
        
    except Exception as e:
        print(f"Error in chat_with_rag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
