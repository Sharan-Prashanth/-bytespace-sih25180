from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from typing import Optional, List, Dict, Any
import json

load_dotenv()

router = APIRouter()

# Initialize models
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
llm = genai.GenerativeModel('gemini-1.5-flash')

# MongoDB connection - try both MONGO_URI and MONGODB_URI
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI or MONGODB_URI not found in environment variables")

client = MongoClient(MONGO_URI)
db = client['test']  # Database name from your URL
proposals_collection = db['proposals']  # Collection name

class ProposalChatRequest(BaseModel):
    question: str
    user_id: Optional[str] = None  # Optional: filter by user
    proposal_id: Optional[str] = None  # Optional: specific proposal

def extract_proposal_text(proposal: Dict[str, Any]) -> str:
    """Extract all text content from a proposal JSON"""
    text_parts = []
    
    # Add proposal code and title
    if proposal.get('proposalCode'):
        text_parts.append(f"Proposal Code: {proposal['proposalCode']}")
    
    # Add proposal info
    if proposal.get('proposalInfo'):
        info = proposal['proposalInfo']
        if info.get('title'):
            text_parts.append(f"Title: {info['title']}")
        if info.get('projectLeader'):
            text_parts.append(f"Project Leader: {info['projectLeader']}")
        if info.get('institute'):
            text_parts.append(f"Institute: {info['institute']}")
        if info.get('email'):
            text_parts.append(f"Email: {info['email']}")
        if info.get('duration'):
            text_parts.append(f"Duration: {info['duration']} months")
        if info.get('totalBudget'):
            text_parts.append(f"Total Budget: ₹{info['totalBudget']}")
    
    # Add status
    if proposal.get('status'):
        text_parts.append(f"Status: {proposal['status']}")
    
    # Add processed forms content
    if proposal.get('processedForms'):
        forms = proposal['processedForms']
        for form_key, form_data in forms.items():
            if isinstance(form_data, dict):
                # Extract text from nested structures
                text_parts.append(f"\n{form_key}:")
                text_parts.append(json.dumps(form_data, indent=2))
            elif isinstance(form_data, str):
                text_parts.append(f"{form_key}: {form_data}")
    
    # Add collaborators
    if proposal.get('collaborators'):
        text_parts.append(f"\nCollaborators: {len(proposal['collaborators'])} members")
    
    # Add deliverables
    if proposal.get('deliverables'):
        text_parts.append(f"\nDeliverables: {json.dumps(proposal['deliverables'])}")
    
    # Add timeline
    if proposal.get('timeline'):
        text_parts.append(f"\nTimeline: {json.dumps(proposal['timeline'])}")
    
    return "\n".join(text_parts)

def search_proposals(question: str, user_id: Optional[str] = None, proposal_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
    """Search proposals in MongoDB based on question relevance"""
    
    # Build query
    query = {}
    if user_id:
        query['userId'] = user_id
    if proposal_id:
        query['_id'] = proposal_id
    
    # Get proposals from MongoDB
    proposals = list(proposals_collection.find(query).limit(20))
    
    if not proposals:
        return []
    
    # Generate embedding for question
    question_embedding = embedding_model.encode(question).tolist()
    
    # Score each proposal by relevance
    scored_proposals = []
    for proposal in proposals:
        # Extract text from proposal
        proposal_text = extract_proposal_text(proposal)
        
        # Generate embedding for proposal
        proposal_embedding = embedding_model.encode(proposal_text).tolist()
        
        # Calculate cosine similarity
        dot_product = sum(q * p for q, p in zip(question_embedding, proposal_embedding))
        mag_q = sum(q * q for q in question_embedding) ** 0.5
        mag_p = sum(p * p for p in proposal_embedding) ** 0.5
        similarity = dot_product / (mag_q * mag_p) if (mag_q * mag_p) > 0 else 0
        
        scored_proposals.append({
            'proposal': proposal,
            'text': proposal_text,
            'score': similarity
        })
    
    # Sort by score and return top results
    scored_proposals.sort(key=lambda x: x['score'], reverse=True)
    return scored_proposals[:limit]

@router.post("/chat-proposals")
async def chat_about_proposals(request: ProposalChatRequest):
    """Chat about user proposals stored in MongoDB"""
    try:
        # Search relevant proposals
        relevant_proposals = search_proposals(
            request.question,
            user_id=request.user_id,
            proposal_id=request.proposal_id,
            limit=5
        )
        
        if not relevant_proposals:
            return {
                "answer": "I couldn't find any proposals matching your query. Please make sure you have submitted proposals or try asking about a specific aspect.",
                "proposals": []
            }
        
        # Build context from top proposals
        context_parts = []
        proposal_info = []
        
        for item in relevant_proposals:
            proposal = item['proposal']
            score = item['score']
            text = item['text']
            
            context_parts.append(f"--- Proposal: {proposal.get('proposalCode', 'Unknown')} (Relevance: {score:.2f}) ---\n{text}\n")
            
            proposal_info.append({
                'proposalCode': proposal.get('proposalCode', 'Unknown'),
                'title': proposal.get('proposalInfo', {}).get('title', 'Untitled'),
                'status': proposal.get('status', 'Unknown'),
                'relevance': round(score, 4)
            })
        
        context = "\n\n".join(context_parts)
        
        # Generate prompt
        prompt = f"""You are BIRBAL (बिरबल | பிர்பால்), an intelligent multilingual AI assistant helping users understand their research proposals submitted to NaCCER.

You can respond in three languages:
- Hindi (हिंदी) - if the user asks in Hindi
- Tamil (தமிழ்) - if the user asks in Tamil
- English - if the user asks in English

Detect the user's question language and respond in THE SAME LANGUAGE. If in Hindi, respond completely in Hindi. If in Tamil, respond in Tamil. If in English, respond in English.

You have access to the following proposal(s) submitted by the user:

{context}

User Question: {request.question}

Instructions:
1. IMPORTANT: Respond in the SAME language as the question
2. Answer based ONLY on the proposal data provided above
3. Be specific and cite proposal codes when referring to different proposals
4. If asking about status, budget, timeline, or specific details, extract them from the proposal data
5. If asking about multiple proposals, compare them clearly
6. Be helpful, professional, and supportive
7. If the data doesn't contain enough information, say so politely in the user's language

Answer (in the user's question language):"""

        # Generate response
        try:
            response = llm.generate_content(prompt)
            answer = response.text
        except Exception as e:
            if "quota" in str(e).lower() or "429" in str(e):
                # Fallback if Gemini quota exceeded
                answer = f"I found {len(relevant_proposals)} relevant proposal(s):\n\n"
                for item in relevant_proposals[:3]:
                    p = item['proposal']
                    answer += f"• {p.get('proposalCode', 'Unknown')}: {p.get('proposalInfo', {}).get('title', 'Untitled')}\n"
                    answer += f"  Status: {p.get('status', 'Unknown')}, Budget: ₹{p.get('proposalInfo', {}).get('totalBudget', 'N/A')}\n\n"
                answer += "\n(Note: AI generation temporarily unavailable - showing raw data)"
            else:
                raise
        
        return {
            "answer": answer,
            "proposals": proposal_info
        }
        
    except Exception as e:
        print(f"Error in chat_about_proposals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/proposals/{user_id}")
async def get_user_proposals(user_id: str):
    """Get all proposals for a specific user"""
    try:
        proposals = list(proposals_collection.find({'userId': user_id}))
        
        # Convert ObjectId to string for JSON serialization
        for proposal in proposals:
            if '_id' in proposal:
                proposal['_id'] = str(proposal['_id'])
        
        return {
            "count": len(proposals),
            "proposals": proposals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
