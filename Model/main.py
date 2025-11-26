from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Common.Novelty import novelty
from Common.Cost_validation import cost_estimator
from Common.Benefit_to_coal_industry import benefit
from Common.Deliverables import deliverable as deliverables
from RAG import plag
from RAG import rag_chat_guidlines
from RAG import rag_chat_specialist
from RAG import timeline
# from RAG import similarity_checker
# from live_checker import online_checker
from Json_extraction import extractor
import uvicorn
from data_files import file_storage
from Common.ai_validator import ai_detector_pipeline
from Report import report_gen
app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(timeline.router)
app.include_router(benefit.router)
app.include_router(deliverables.router)
# app.include_router(similarity_checker.router)
app.include_router(rag_chat_guidlines.router)
app.include_router(rag_chat_specialist.router)
app.include_router(extractor.router)
app.include_router(novelty.router)
app.include_router(cost_estimator.router)
app.include_router(plag.router)
app.include_router(file_storage.router)
app.include_router(ai_detector_pipeline.router)
app.include_router(report_gen.router)
# app.include_router(online_checker.app)
# -----------------------------
# Run FastAPI directly with Python
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
