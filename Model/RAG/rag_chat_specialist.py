import os
from dotenv import load_dotenv

load_dotenv()

import json
import tempfile
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.schema import Document

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

router = APIRouter()

# -----------------------------
# Helper functions
# -----------------------------
def load_json_file(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    text = json.dumps(data, indent=2, ensure_ascii=False)
    return Document(page_content=text, metadata={"source": os.path.basename(file_path)})

def chunk_documents(docs):
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    chunks = []
    for doc in docs:
        parts = splitter.split_documents([doc])
        for i, part in enumerate(parts):
            part.metadata["chunk_id"] = f"{part.metadata['source']}_chunk_{i}"
            chunks.append(part)
    return chunks

def build_index(chunks):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    store = FAISS.from_documents(chunks, embeddings)
    return store

QA_PROMPT = PromptTemplate(
    input_variables=["question", "context"],
    template=(
        "You are a helpful assistant. Use ONLY the provided context.\n\n"
        "{context}\n\nQuestion: {question}\n\n"
        "If the answer is not in the documents, say: "
        "'I do not have this information, ask based on the documents'."
    )
)

def make_rag_chain(store):
    llm = GoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)  # updated model
    retriever = store.as_retriever(search_kwargs={"k": 5})
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": QA_PROMPT},
    )
    return qa

def query_rag(qa, question: str):
    result = qa({"query": question})
    return {
        "question": question,
        "answer": result.get("result", "")
    }

# -----------------------------
# API route
# -----------------------------
@router.post("/ask-json")
async def ask_json(file: UploadFile = File(...), question: str = Form(...)):
    try:
        # Ensure JSON file
        if not file.filename.endswith(".json"):
            return JSONResponse(content={"error": "Only JSON files are allowed"}, status_code=400)

        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load document, chunk, build index
        doc = load_json_file(tmp_path)
        chunks = chunk_documents([doc])
        store = build_index(chunks)
        qa = make_rag_chain(store)

        # Query the LLM
        result = query_rag(qa, question)

        # Cleanup temp file
        os.remove(tmp_path)

        return result

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
