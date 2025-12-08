import os
from dotenv import load_dotenv

load_dotenv()

import tempfile
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

router = APIRouter()

# -----------------------------
# In-memory storage for uploaded PDFs and their FAISS indexes
# -----------------------------
INDEXES = {}  # key: filename, value: FAISS store

# -----------------------------
# Helper functions
# -----------------------------
def load_pdf(file_path):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    for i, d in enumerate(docs):
        d.metadata["source"] = os.path.basename(file_path)
        d.metadata["chunk_id"] = f"{d.metadata['source']}_page_{i}"
    return docs

def chunk_documents(docs):
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    chunks = []
    for d in docs:
        parts = splitter.split_documents([d])
        for i, p in enumerate(parts):
            p.metadata.setdefault("chunk_id", f"{p.metadata['source']}_chunk_{i}")
            chunks.append(p)
    return chunks

def build_index(chunks):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    store = FAISS.from_documents(chunks, embeddings)
    return store

QA_PROMPT = PromptTemplate(
    input_variables=["question", "context"],
    template=(
        "You are an instructor helping a journalist complete their paper.\n"
        "Use ONLY the following guidelines to answer questions.\n\n"
        "{context}\n\n"
        "Question: {question}\n\n"
        "If the answer is not specified in the guidelines, say: "
        "'I don't know based on the guidelines PDF.'"
    )
)

def make_rag_chain(store):
    # Set API key from environment
    os.environ["GOOGLE_API_KEY"] = os.getenv("COMMON_GEMINI_KEY") or ""
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    llm = GoogleGenerativeAI(model=GEMINI_MODEL, temperature=0)
    retriever = store.as_retriever(search_kwargs={"k": 5})
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": QA_PROMPT},
    )
    return qa

# -----------------------------
# Route 1: Upload PDF and create FAISS index
# -----------------------------
@router.post("/upload-guidelines")
async def upload_guidelines(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1]
        if suffix.lower() != ".pdf":
            return JSONResponse(content={"error": "Only PDF files are allowed"}, status_code=400)

        # Save PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load, chunk, build index
        docs = load_pdf(tmp_path)
        chunks = chunk_documents(docs)
        store = build_index(chunks)

        # Save the index in memory keyed by filename
        INDEXES[file.filename] = store

        # Cleanup PDF file
        os.remove(tmp_path)

        return {"message": f"PDF uploaded and indexed successfully as '{file.filename}'."}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# -----------------------------
# Route 2: Ask question using uploaded PDF
# -----------------------------
@router.post("/ask-guidelines")
async def ask_guidelines(filename: str = Form(...), question: str = Form(...)):
    try:
        # Check if the PDF has been uploaded
        if filename not in INDEXES:
            return JSONResponse(content={"error": f"No indexed PDF found for '{filename}'."}, status_code=404)

        store = INDEXES[filename]
        qa = make_rag_chain(store)

        # Query the LLM
        result = qa({"query": question})

        return {
            "filename": filename,
            "question": question,
            "answer": result.get("result", "")
        }

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
