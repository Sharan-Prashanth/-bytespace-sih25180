import os
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

from supabase import create_client, Client
from pinecone import Pinecone, ServerlessSpec

from sentence_transformers import SentenceTransformer
import numpy as np
from numpy.linalg import norm

import google.generativeai as genai


# ================================================================
# ---------------------- CONFIG & SETTINGS ------------------------
# ================================================================

load_dotenv()

@dataclass
class Settings:
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_chunks_table: str = os.getenv("SUPABASE_CHUNKS_TABLE", "chunks")

    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME", "coal-rag-index")

    gcp_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    gemini_location: str = os.getenv("GEMINI_LOCATION", "global")
    gemini_model_id: str = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash-lite")

    sbert_model_name: str = os.getenv("SBERT_MODEL_NAME", "all-MiniLM-L6-v2")


settings = Settings()


# ================================================================
# ---------------- SBERT EMBEDDER & CHUNKING ---------------------
# ================================================================

class SBERTEmbedder:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]

    def semantic_chunk(
        self,
        text: str,
        max_sentences_per_chunk: int = 10,
        similarity_threshold: float = 0.65,
    ) -> List[str]:
        import re

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        if not sentences:
            return []

        sentence_embeddings = np.array(self.model.encode(sentences, show_progress_bar=False))
        chunks = []
        current_chunk = [sentences[0]]
        current_vec = sentence_embeddings[0]

        def cos_sim(a, b):
            return float(np.dot(a, b) / (norm(a) * norm(b) + 1e-8))

        for i in range(1, len(sentences)):
            sim = cos_sim(current_vec, sentence_embeddings[i])
            if sim < similarity_threshold or len(current_chunk) >= max_sentences_per_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentences[i]]
                current_vec = sentence_embeddings[i]
            else:
                current_chunk.append(sentences[i])
                current_vec = (current_vec * len(current_chunk) + sentence_embeddings[i]) / (
                    len(current_chunk) + 1e-8
                )

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks


# ================================================================
# ---------------------- SUPABASE LOAD ---------------------------
# ================================================================

class SupabaseChunkStore:
    def __init__(self, url: str, key: str, table_name: str):
        if not url or not key:
            raise ValueError("Supabase URL or KEY missing")
        self.client: Client = create_client(url, key)
        self.table_name = table_name

    def fetch_chunks(self, limit: int | None = None) -> List[Dict[str, Any]]:
        query = self.client.table(self.table_name).select("*")
        if limit:
            query = query.limit(limit)
        return query.execute().data or []


# ================================================================
# ---------------------- PINECONE VECTOR DB ----------------------
# ================================================================

class PineconeVectorStore:
    def __init__(self, api_key: str, index_name: str, dim: int = 384):
        if not api_key:
            raise ValueError("Pinecone API key missing")

        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dim = dim

        self._ensure_index()
        self.index = self.pc.Index(index_name)

    def _ensure_index(self):
        existing = {idx["name"] for idx in self.pc.list_indexes()}
        if self.index_name not in existing:
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dim,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

    def upsert_chunks(self, chunks: List[Dict[str, Any]], embedder: SBERTEmbedder, batch_size: int = 64):
        vectors_batch = []
        for row in chunks:
            text = row.get("chunk_text") or row.get("text") or row.get("content")
            if not text:
                continue

            vec_id = str(row.get("uid") or row.get("id"))
            metadata = {
                "source": row.get("source"),
                "pdf_name": row.get("pdf_name"),
                "page_num": row.get("page_num") or row.get("page") or row.get("page_number"),
                "chunk_text": text,
            }
            vectors_batch.append((vec_id, text, metadata))

        for i in range(0, len(vectors_batch), batch_size):
            batch = vectors_batch[i: i + batch_size]
            ids = [b[0] for b in batch]
            texts = [b[1] for b in batch]
            metadata = [b[2] for b in batch]

            embeddings = embedder.embed_texts(texts)

            pine_vectors = []
            for _id, emb, meta in zip(ids, embeddings, metadata):
                pine_vectors.append({"id": _id, "values": emb, "metadata": meta})

            self.index.upsert(vectors=pine_vectors)

    def query(self, embedding: List[float], top_k: int = 8):
        res = self.index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
        )
        return res.get("matches", [])


# ================================================================
# ---------------------- GEMINI RAG MODEL ------------------------
# ================================================================

class GeminiRAGModel:
    def __init__(self, project: str, location: str, model_id: str):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY2")
        if not api_key:
            raise ValueError("GEMINI API KEY missing")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_id)

    def build_prompt(self, question: str, contexts: List[Dict[str, Any]]) -> str:
        blocks = []
        for i, m in enumerate(contexts, start=1):
            meta = m.get("metadata", {})
            blocks.append(
                f"[DOC {i} | {meta.get('pdf_name')} | page {meta.get('page_num')}]\n{meta.get('chunk_text')}\n"
            )
        context_str = "\n".join(blocks)

        return f"""
You answer questions ONLY using the retrieved PDF chunks below.

CONTEXT:
{context_str}

QUESTION:
{question}

Give a clear answer using only the above context.
""".strip()

    def generate_answer(self, question: str, contexts: List[Dict[str, Any]]) -> str:
        prompt = self.build_prompt(question, contexts)
        response = self.model.generate_content(prompt)
        return response.text


# ================================================================
# ---------------------- RAG PIPELINE ----------------------------
# ================================================================

class RAGChatbot:
    def __init__(self, cfg: Settings):
        self.embedder = SBERTEmbedder(cfg.sbert_model_name)
        self.supabase_store = SupabaseChunkStore(cfg.supabase_url, cfg.supabase_key, cfg.supabase_chunks_table)
        self.vector_store = PineconeVectorStore(cfg.pinecone_api_key, cfg.pinecone_index_name)
        self.llm = GeminiRAGModel(cfg.gcp_project, cfg.gemini_location, cfg.gemini_model_id)

    def ingest_supabase_chunks_to_pinecone(self, limit: int | None = None):
        chunks = self.supabase_store.fetch_chunks(limit)
        self.vector_store.upsert_chunks(chunks, self.embedder)
        return len(chunks)

    def answer_question(self, question: str, top_k: int = 8):
        emb = self.embedder.embed_query(question)
        matches = self.vector_store.query(emb, top_k=top_k)
        answer = self.llm.generate_answer(question, matches)
        return answer, matches


# ================================================================
# ---------------------- FASTAPI ENDPOINTS -----------------------
# ================================================================

app = FastAPI(title="S&T RAG API", version="1.0")

chatbot = RAGChatbot(settings)


class AskRequest(BaseModel):
    question: str
    top_k: int = 8


class AskResponse(BaseModel):
    answer: str
    retrieved: List[Dict[str, Any]]


@app.post("/ingest")
def ingest(limit: int | None = None):
    count = chatbot.ingest_supabase_chunks_to_pinecone(limit)
    return {"message": f"Ingestion completed for {count} chunks."}


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    answer, retrieved = chatbot.answer_question(req.question, req.top_k)
    return AskResponse(answer=answer, retrieved=retrieved)


@app.get("/")
def home():
    return {"status": "RAG API running", "model": settings.gemini_model_id}
