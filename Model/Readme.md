# AI/ML Models

This directory contains the Python-based AI/ML models and services for the project, built with FastAPI and various machine learning libraries.

## Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **ML Libraries:**
  - [LangChain](https://www.langchain.com/)
  - [Sentence Transformers](https://www.sbert.net/)
  - [Transformers](https://huggingface.co/docs/transformers/index)
  - [PyTorch](https://pytorch.org/)
- **Vector Store:** [FAISS](https://faiss.ai/)

## Folder Structure

```
Model/
├── RAG/                 # RAG-based models and utilities
├── Json_extraction/     # Scripts for JSON extraction
├── live_checker/        # Scripts for online checking
├── data_files/          # Data files for the models
├── main.py              # FastAPI application entry point
├── requirement.txt      # Python dependencies
└── ...
```

## Getting Started

### Prerequisites

- Python (3.8 or later)
- pip

### Installation

1.  Navigate to the `Model` directory:
    ```bash
    cd Model
    ```
2.  Install the dependencies:
    ```bash
    pip install -r requirement.txt
    ```

### Running the FastAPI Server

To start the FastAPI server, run:

```bash
python main.py
```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Key Functionalities

- **RAG (Retrieval-Augmented Generation):**
  - Chat with guidelines and specialists.
  - Check for novelty, plagiarism, and similarity.
  - Perform cost analysis and generate timelines.
- **JSON Extraction:** Extract structured data from documents.
- **Live Checking:** Perform online checks for various purposes.

## API

The FastAPI application exposes several endpoints for interacting with the models. The main application is defined in `main.py`, which includes routers for the different functionalities.
