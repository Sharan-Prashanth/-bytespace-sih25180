# FORM-I Validation Service - Technical Architecture

## System Overview

A FastAPI-based microservice that validates Ministry of Coal S&T grant proposals (FORM-I) using hybrid rule-based + LLM validation against official guidelines.

---

## System Flow Architecture

```
+----------------------+       +----------------------+       +----------------------+
|    Frontend UI       |------>|   Backend Server     |------>|  Validation Engine   |
| (Next.js Client)     |       | (FastAPI/Express)    |       | (Hybrid Rules + LLM) |
+----------------------+       +----------------------+       +----------------------+
          |                              |                              |
          |                              |                              |
          v                              v                              v
+----------------------+       +----------------------+       +----------------------+
| 1. User uploads a    |       | 2. Server processes  |       | 3. Validation engine |
|    proposal form     |       |    the request and   |       |    checks fields     |
|    (PDF/DOCX/TXT)    |       |    extracts text via |       |    against Ministry  |
|                      |       |    PyPDF2/docx, then |       |    of Coal S&T       |
+----------------------+       |    calls Gemini AI   |       |    Guidelines.pdf    |
                               |    to extract FORM-I |       |                      |
                               |    structured JSON.  |       +----------------------+
                               |    Stores file in    |
                               |    Supabase Storage  |              |
                               |    and metadata in   |              |
                               |    proposals table.  |              v
                               +----------------------+       +----------------------+
                                        |                     | 4. Returns detailed  |
                                        |                     |    validation_result |
                                        v                     |    with field-level  |
                               +----------------------+       |    pass/fail status  |
                               | 5. Server returns    |       |    and reasons based |
                               |    complete response |       |    on deterministic  |
                               |    with validation_  |<------|    rules + LLM       |
                               |    result, extracted_|       |    qualitative check |
                               |    data, and raw_    |       +----------------------+
                               |    extracted JSON    |
                               +----------------------+
                                        |
                                        |
                                        v
                               +----------------------+
                               | 6. Frontend polls    |
                               |    GET /latest-result|
                               |    to retrieve and   |
                               |    auto-render the   |
                               |    validation report |
                               +----------------------+
```

---

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend Application]
        API_CLIENT[API Client]
    end

    subgraph "API Layer - FastAPI"
        ROUTER[APIRouter<br/>/validation]
        EP1[POST /validate-form1]
        EP2[GET /latest-result]
        EP3[GET /health]
        UPLOAD[UploadFile Handler]
        RESPONSE[JSONResponse Builder]
    end

    subgraph "Extraction Layer"
        FILE_PARSER[File Parser]
        PDF[PyPDF2<br/>PDF Reader]
        DOCX[python-docx<br/>DOCX Parser]
        TXT[chardet<br/>Text Decoder]
        
        AI_EXTRACT[AI Extractor]
        GEMINI_EXTRACT[Gemini 2.5 Flash Lite<br/>extract_form_data_with_ai]
        
        NORMALIZE[Normalizer<br/>construct_simple_json_structure]
        CLEAN[clean_text_field]
    end

    subgraph "Validation Layer - Hybrid Engine"
        VAL_ROUTER{Validation Router}
        
        RULE_ENGINE[Rule-Based Validator<br/>rule_based_check]
        RULE_SET[GUIDELINE_RULES<br/>VALIDATE_FIELDS<br/>PLACEHOLDER_RE]
        
        LLM_ENGINE[LLM Validator<br/>ask_gemini_validate]
        GEMINI_VAL[Gemini 2.5 Flash Lite]
        
        FALLBACK[Deterministic Fallback<br/>deterministic_llm_fallback]
        
        MAPPER[Field Mapper<br/>get_value_from_extracted_payload]
    end

    subgraph "Guidelines Processing"
        GUIDE_LOAD[load_guidelines_text<br/>pdfplumber]
        GUIDE_EXCERPT[build_guideline_excerpts<br/>Keyword-based RAG]
        GUIDE_PDF[(Guidelines.pdf)]
    end

    subgraph "Persistence Layer - Supabase"
        STORAGE[Supabase Storage<br/>UPLOAD_BUCKET]
        DATABASE[(Supabase DB<br/>proposals table)]
        STORE_FUNC[store_in_supabase]
    end

    subgraph "State Management"
        MEM_CACHE[latest_validation_result<br/>In-Memory Cache]
    end

    subgraph "External Services"
        GEMINI_API[Google Gemini API<br/>generativeai]
        SUPABASE_API[Supabase API<br/>REST + Storage]
    end

    %% Client interactions
    FE -->|Upload PDF/DOCX/TXT| EP1
    API_CLIENT -->|Poll for results| EP2
    API_CLIENT -->|Health check| EP3

    %% API routing
    EP1 --> UPLOAD
    EP2 --> MEM_CACHE
    EP3 --> RESPONSE

    %% File processing flow
    UPLOAD -->|file_bytes| FILE_PARSER
    FILE_PARSER -->|.pdf| PDF
    FILE_PARSER -->|.docx| DOCX
    FILE_PARSER -->|.txt/.csv| TXT
    PDF --> AI_EXTRACT
    DOCX --> AI_EXTRACT
    TXT --> AI_EXTRACT

    %% AI extraction flow
    AI_EXTRACT --> GEMINI_EXTRACT
    GEMINI_EXTRACT -->|Prompt| GEMINI_API
    GEMINI_API -->|JSON Response| AI_EXTRACT
    AI_EXTRACT -->|proposal_data| NORMALIZE
    NORMALIZE -->|json_structure| MAPPER
    CLEAN -.->|Used by| NORMALIZE

    %% Guidelines processing
    GUIDE_PDF -->|Read| GUIDE_LOAD
    GUIDE_LOAD -->|Full text| GUIDE_EXCERPT
    GUIDE_EXCERPT -->|Per-field excerpts| LLM_ENGINE

    %% Validation flow
    MAPPER --> VAL_ROUTER
    VAL_ROUTER -->|Has deterministic rules| RULE_ENGINE
    VAL_ROUTER -->|Qualitative check needed| LLM_ENGINE
    
    RULE_SET -.->|Constraints| RULE_ENGINE
    LLM_ENGINE -->|Prompt + Excerpt| GEMINI_VAL
    GEMINI_VAL -->|Validation| GEMINI_API
    GEMINI_API -->|Result| LLM_ENGINE
    
    LLM_ENGINE -->|On failure| FALLBACK
    FALLBACK --> VAL_ROUTER
    RULE_ENGINE --> VAL_ROUTER
    
    VAL_ROUTER -->|validation_result| RESPONSE

    %% Persistence flow
    NORMALIZE -.->|Optional| STORE_FUNC
    UPLOAD -.->|Original file| STORAGE
    STORAGE -->|API Call| SUPABASE_API
    STORE_FUNC -->|Insert proposal| DATABASE
    DATABASE -->|API Call| SUPABASE_API

    %% Response flow
    RESPONSE -->|Update| MEM_CACHE
    RESPONSE -->|JSON| FE

    %% Styling
    classDef apiLayer fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef extractLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef valLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dataLayer fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#ffebee,stroke:#b71c1c,stroke-width:2px

    class ROUTER,EP1,EP2,EP3,UPLOAD,RESPONSE apiLayer
    class FILE_PARSER,PDF,DOCX,TXT,AI_EXTRACT,GEMINI_EXTRACT,NORMALIZE,CLEAN extractLayer
    class VAL_ROUTER,RULE_ENGINE,RULE_SET,LLM_ENGINE,GEMINI_VAL,FALLBACK,MAPPER valLayer
    class STORAGE,DATABASE,STORE_FUNC,GUIDE_PDF,MEM_CACHE dataLayer
    class GEMINI_API,SUPABASE_API external
```

---

## Component Interaction Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FORM-I VALIDATION SERVICE                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   API Gateway    │          │  File Processing │          │   AI Extraction  │
│   (FastAPI)      │─────────▶│   Pipeline       │─────────▶│   (Gemini API)   │
│                  │          │                  │          │                  │
│ • POST /validate │          │ • PyPDF2 (PDF)   │          │ • Text→JSON      │
│ • GET /latest    │          │ • python-docx    │          │ • Schema-based   │
│ • GET /health    │          │ • chardet (TXT)  │          │   Extraction     │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                              │                              │
         │                              │                              │
         ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  Temp File Mgmt  │          │   Normalizer     │          │ Structured JSON  │
│                  │          │                  │          │                  │
│ • tempfile.Named │          │ • clean_text_    │          │ • basic_info     │
│   TemporaryFile  │          │   field()        │          │ • project_details│
│ • Cleanup in     │          │ • construct_     │          │ • cost_breakdown │
│   finally block  │          │   simple_json_   │          │ • additional_info│
└──────────────────┘          │   structure()    │          └──────────────────┘
                               └──────────────────┘                    │
                                        │                              │
                                        └──────────────┬───────────────┘
                                                       │
                                                       ▼
                                          ┌─────────────────────┐
                                          │  Validation Router  │
                                          │                     │
                                          │ • get_value_from_   │
                                          │   extracted_payload │
                                          │ • Field mapping     │
                                          └─────────────────────┘
                                                       │
                        ┌──────────────────────────────┼──────────────────────────────┐
                        │                              │                              │
                        ▼                              ▼                              ▼
            ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
            │ Rule-Based Engine │        │  LLM Validator    │        │ Deterministic     │
            │                   │        │                   │        │ Fallback          │
            │ • GUIDELINE_RULES │        │ • ask_gemini_     │        │                   │
            │ • PLACEHOLDER_RE  │        │   validate()      │        │ • Simple checks   │
            │ • count_words()   │        │ • Guideline       │        │ • Pattern match   │
            │ • parse_objectives│        │   excerpts (RAG)  │        │ • Conservative    │
            │ • Regex patterns  │        │ • Qualitative     │        │   approval        │
            └───────────────────┘        └───────────────────┘        └───────────────────┘
                        │                              │                              │
                        └──────────────────────────────┼──────────────────────────────┘
                                                       │
                                                       ▼
                                          ┌─────────────────────┐
                                          │ Result Aggregator   │
                                          │                     │
                                          │ • Overall validation│
                                          │ • Missing columns   │
                                          │ • Failing columns   │
                                          │ • Field-level status│
                                          └─────────────────────┘
                                                       │
                        ┌──────────────────────────────┼──────────────────────────────┐
                        │                              │                              │
                        ▼                              ▼                              ▼
            ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
            │ Supabase Storage  │        │ In-Memory Cache   │        │ Response Builder  │
            │                   │        │                   │        │                   │
            │ • Upload file     │        │ • latest_         │        │ • JSONResponse    │
            │ • Store metadata  │        │   validation_     │        │ • Status codes    │
            │ • Get public URL  │        │   result (global) │        │ • Error handling  │
            │ • proposals table │        │ • Polling support │        │ • Logging         │
            └───────────────────┘        └───────────────────┘        └───────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL DEPENDENCIES                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐            │
│  │  Google Gemini   │     │  Supabase Cloud  │     │  Guidelines.pdf  │            │
│  │  API             │     │                  │     │                  │            │
│  │                  │     │ • PostgreSQL DB  │     │ • pdfplumber     │            │
│  │ • gemini-2.5-    │     │ • Storage Bucket │     │ • Keyword search │            │
│  │   flash-lite     │     │ • REST API       │     │ • Sentence window│            │
│  │ • Extraction     │     │ • RLS Policies   │     │ • Context extract│            │
│  │ • Validation     │     │                  │     │                  │            │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Through Layers

```
REQUEST (Upload PDF/DOCX/TXT)
    │
    ├──▶ [API Layer]
    │       │
    │       ├──▶ Validate file extension (.pdf, .docx, .txt)
    │       ├──▶ Save to tempfile.NamedTemporaryFile
    │       └──▶ Read file_bytes
    │
    ├──▶ [Extraction Layer]
    │       │
    │       ├──▶ extract_text_from_file(filename, file_bytes)
    │       │       │
    │       │       ├──▶ If PDF: PyPDF2.PdfReader → iterate pages → extract_text()
    │       │       ├──▶ If DOCX: docx.Document → paragraphs → join text
    │       │       └──▶ If TXT: chardet.detect → decode(encoding)
    │       │
    │       ├──▶ extract_form_data_with_ai(extracted_text)
    │       │       │
    │       │       ├──▶ Build FORM-I extraction prompt
    │       │       ├──▶ Call Gemini API (generate_content)
    │       │       ├──▶ Parse JSON response (clean ```json markers)
    │       │       └──▶ Return proposal_data (40+ fields)
    │       │
    │       └──▶ construct_simple_json_structure(proposal_data)
    │               │
    │               ├──▶ Apply clean_text_field to all strings
    │               └──▶ Build hierarchical JSON (basic_info, project_details, etc.)
    │
    ├──▶ [Persistence Layer] (Optional - Supabase)
    │       │
    │       ├──▶ Upload file to UPLOAD_BUCKET
    │       ├──▶ Get public_url
    │       └──▶ Insert into proposals table (store_in_supabase)
    │
    ├──▶ [Guidelines Layer]
    │       │
    │       ├──▶ load_guidelines_text(GUIDELINES_PDF_PATH)
    │       │       │
    │       │       └──▶ pdfplumber.open → extract_text per page
    │       │
    │       └──▶ build_guideline_excerpts(guidelines_text, VALIDATE_FIELDS)
    │               │
    │               ├──▶ Split into sentences
    │               ├──▶ Keyword search per field
    │               └──▶ Return 2-sentence context window
    │
    ├──▶ [Validation Layer] (Loop through VALIDATE_FIELDS)
    │       │
    │       For each field in ["Project Title", "Principal Investigator", ...]:
    │       │
    │       ├──▶ get_value_from_extracted_payload(json_structure, field_label)
    │       │       │
    │       │       ├──▶ Try structured paths (basic_information.project_title)
    │       │       └──▶ Fallback to flat key fuzzy match
    │       │
    │       ├──▶ Check if value empty → not_filled
    │       ├──▶ Check PLACEHOLDER_RE → not_following_guidelines
    │       │
    │       ├──▶ If field in GUIDELINE_RULES:
    │       │       │
    │       │       └──▶ rule_based_check(field_label, value)
    │       │               │
    │       │               ├──▶ Project Title: count_words ≤ 60
    │       │               ├──▶ Objectives: parse_objectives → 2-5 items, list format
    │       │               ├──▶ Work Plan: min_words + keyword check (Phase|Milestone)
    │       │               ├──▶ Methodology: min_words + keyword check (technique|method)
    │       │               └──▶ Return {validation_result, reason}
    │       │
    │       └──▶ Else (no deterministic rule):
    │               │
    │               └──▶ ask_gemini_validate(field_label, value, guideline_excerpt)
    │                       │
    │                       ├──▶ Build validation prompt with field + excerpt
    │                       ├──▶ Call Gemini API
    │                       ├──▶ Parse JSON {validation_result, reason}
    │                       └──▶ On failure → deterministic_llm_fallback
    │
    ├──▶ [Aggregation Layer]
    │       │
    │       ├──▶ Collect all field results
    │       ├──▶ Build columns_missing_value (not_filled)
    │       ├──▶ Build columns_not_following_guidelines (violations)
    │       └──▶ Compute overall_validation (False if any missing/failing)
    │
    ├──▶ [Response Layer]
    │       │
    │       ├──▶ Build final JSON response:
    │       │       {
    │       │         "validation_result": {...},
    │       │         "extracted_data": {...},
    │       │         "raw_extracted": {...},
    │       │         "guidelines_used": "Guidelines.pdf"
    │       │       }
    │       │
    │       ├──▶ Update latest_validation_result (in-memory cache)
    │       └──▶ Return JSONResponse(status_code=200)
    │
    └──▶ [Cleanup]
            │
            └──▶ finally: os.remove(temp_path)
```

---

## Component-Level Architecture

```mermaid
graph LR
    subgraph "1. API Layer"
        A1[FastAPI App]
        A2[APIRouter /validation]
        A3[Endpoint Handlers]
        A4[Error Middleware]
        A5[Temp File Manager]
    end

    subgraph "2. Extraction Pipeline"
        B1[extract_text_from_file]
        B2[extract_form_data_with_ai]
        B3[construct_simple_json_structure]
        B4[Text Cleaners]
    end

    subgraph "3. Validation Engine"
        C1[Validation Orchestrator]
        C2[Rule-Based Validator]
        C3[LLM Validator]
        C4[Field Mapper]
        C5[Result Aggregator]
    end

    subgraph "4. Guideline System"
        D1[PDF Loader pdfplumber]
        D2[Excerpt Builder]
        D3[Keyword Matcher]
    end

    subgraph "5. Integration Layer"
        E1[Gemini Client]
        E2[Supabase Client]
        E3[Storage Manager]
    end

    A1 --> A2 --> A3
    A3 --> A5
    A5 --> B1
    B1 --> B2 --> B3
    B3 --> C1
    C1 --> C4 --> C2
    C1 --> C4 --> C3
    C2 --> C5
    C3 --> C5
    D1 --> D2 --> D3
    D3 --> C3
    B2 -.-> E1
    C3 -.-> E1
    B3 -.-> E2
    A3 -.-> E3
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI Server
    participant Parser as File Parser
    participant Gemini as Gemini AI
    participant Validator as Validation Engine
    participant Guidelines as Guidelines PDF
    participant Supabase as Supabase
    participant Cache as In-Memory Cache

    User->>API: POST /validate-form1 (PDF/DOCX/TXT)
    API->>API: Save to temp file
    API->>Parser: extract_text_from_file(bytes)
    
    alt PDF
        Parser->>Parser: PyPDF2.PdfReader
    else DOCX
        Parser->>Parser: docx.Document
    else TXT
        Parser->>Parser: chardet + decode
    end
    
    Parser-->>API: extracted_text
    
    API->>Gemini: extract_form_data_with_ai(text)
    Gemini->>Gemini: Generate FORM-I prompt
    Gemini-->>API: proposal_data (JSON)
    
    API->>API: construct_simple_json_structure
    API-->>API: json_structure (normalized)
    
    par Store in Supabase
        API->>Supabase: Upload file to Storage
        API->>Supabase: Insert into proposals table
        Supabase-->>API: storage_url + db_id
    end
    
    API->>Guidelines: load_guidelines_text
    Guidelines-->>API: full_text
    API->>Guidelines: build_guideline_excerpts
    Guidelines-->>API: excerpts_dict
    
    loop For each VALIDATE_FIELD
        API->>Validator: get_value_from_extracted_payload
        Validator-->>API: field_value
        
        alt Has deterministic rule
            API->>Validator: rule_based_check(field, value)
            Validator->>Validator: Check GUIDELINE_RULES
            Validator->>Validator: count_words / parse_objectives / regex
            Validator-->>API: {validation_result, reason}
        else Needs qualitative check
            API->>Gemini: ask_gemini_validate(field, value, excerpt)
            Gemini->>Gemini: Validate against guideline
            Gemini-->>API: {validation_result, reason}
        end
        
        API->>API: Aggregate field result
    end
    
    API->>API: Build validation_result
    API->>API: Compute overall_validation
    
    API->>Cache: Update latest_validation_result
    Cache-->>API: Cached
    
    API-->>User: JSON Response {validation_result, extracted_data, raw_extracted}
    
    User->>API: GET /latest-result (poll)
    API->>Cache: Retrieve latest
    Cache-->>API: cached_result
    API-->>User: Same validation result
```

---

## Validation Logic Flow

```mermaid
flowchart TD
    START([Validation Loop Starts]) --> ITER[Iterate VALIDATE_FIELDS]
    
    ITER --> MAP[get_value_from_extracted_payload]
    MAP --> EMPTY{Value Empty?}
    
    EMPTY -->|Yes| NOT_FILLED[validation_result:<br/>not_filled]
    EMPTY -->|No| PLACEHOLDER{Contains<br/>Placeholder?}
    
    PLACEHOLDER -->|Yes| PLACEHOLDER_FAIL[validation_result:<br/>not_following_guidelines<br/>reason: placeholder text]
    PLACEHOLDER -->|No| HAS_RULE{Field has<br/>deterministic rule?}
    
    HAS_RULE -->|Yes| RULE_CHECK[rule_based_check]
    HAS_RULE -->|No| LLM_CHECK[ask_gemini_validate]
    
    RULE_CHECK --> CHECK_TYPE{Rule Type?}
    
    CHECK_TYPE -->|Max Words| WORD_COUNT[count_words]
    CHECK_TYPE -->|Min Words| WORD_COUNT
    CHECK_TYPE -->|List Check| PARSE_OBJ[parse_objectives]
    CHECK_TYPE -->|Keyword Check| REGEX_MATCH[Regex Match]
    CHECK_TYPE -->|Required Field| NAME_VALID[Name Validation]
    
    WORD_COUNT --> RULE_PASS{Pass?}
    PARSE_OBJ --> LIST_VALID{2-5 items?}
    REGEX_MATCH --> KEYWORD_FOUND{Keywords found?}
    NAME_VALID --> NAME_OK{Valid name?}
    
    RULE_PASS -->|Yes| FILLED_OK[validation_result:<br/>filled_and_ok]
    RULE_PASS -->|No| RULE_FAIL[validation_result:<br/>not_following_guidelines<br/>reason: from GUIDELINE_RULES]
    
    LIST_VALID -->|Yes| FILLED_OK
    LIST_VALID -->|No| RULE_FAIL
    
    KEYWORD_FOUND -->|Yes| FILLED_OK
    KEYWORD_FOUND -->|No| RULE_FAIL
    
    NAME_OK -->|Yes| FILLED_OK
    NAME_OK -->|No| RULE_FAIL
    
    LLM_CHECK --> GEMINI_AVAIL{Gemini<br/>Available?}
    
    GEMINI_AVAIL -->|Yes| GEMINI_CALL[Call Gemini with<br/>field + value + excerpt]
    GEMINI_AVAIL -->|No| FALLBACK[deterministic_llm_fallback]
    
    GEMINI_CALL --> PARSE_JSON{Valid JSON<br/>Response?}
    PARSE_JSON -->|Yes| NORMALIZE[Normalize validation_result]
    PARSE_JSON -->|No| FALLBACK
    
    FALLBACK --> FALLBACK_LOGIC{Has guideline<br/>excerpt?}
    FALLBACK_LOGIC -->|Yes & Short| ASSUME_FAIL[validation_result:<br/>not_following_guidelines]
    FALLBACK_LOGIC -->|No or Long| ASSUME_OK[validation_result:<br/>filled_and_ok<br/>reason: deterministic fallback]
    
    NORMALIZE --> FILLED_OK
    NORMALIZE --> RULE_FAIL
    
    NOT_FILLED --> COLLECT
    PLACEHOLDER_FAIL --> COLLECT
    FILLED_OK --> COLLECT
    RULE_FAIL --> COLLECT
    ASSUME_FAIL --> COLLECT
    ASSUME_OK --> COLLECT
    
    COLLECT[Collect field result] --> MORE{More fields?}
    MORE -->|Yes| ITER
    MORE -->|No| AGGREGATE[Aggregate Results]
    
    AGGREGATE --> BUILD_MISSING[Build columns_missing_value]
    BUILD_MISSING --> BUILD_FAILING[Build columns_not_following_guidelines]
    BUILD_FAILING --> OVERALL{Any missing<br/>or failing?}
    
    OVERALL -->|Yes| OVERALL_FALSE[overall_validation = False]
    OVERALL -->|No| OVERALL_TRUE[overall_validation = True]
    
    OVERALL_FALSE --> DONE([Return validation_result])
    OVERALL_TRUE --> DONE
    
    style START fill:#e8f5e9
    style DONE fill:#e8f5e9
    style FILLED_OK fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    style NOT_FILLED fill:#ffccbc,stroke:#d84315,stroke-width:3px
    style PLACEHOLDER_FAIL fill:#ffccbc,stroke:#d84315,stroke-width:3px
    style RULE_FAIL fill:#ffccbc,stroke:#d84315,stroke-width:3px
    style ASSUME_FAIL fill:#ffccbc,stroke:#d84315,stroke-width:3px
    style OVERALL_FALSE fill:#ef5350,stroke:#c62828,stroke-width:3px
    style OVERALL_TRUE fill:#66bb6a,stroke:#2e7d32,stroke-width:3px
```

---

## Technology Stack Breakdown

```mermaid
mindmap
  root((FORM-I Validator))
    API Framework
      FastAPI
      APIRouter
      UploadFile
      HTTPException
      JSONResponse
      Uvicorn ASGI Server
    File Processing
      PyPDF2
        PdfReader
        page.extract_text
      python-docx
        Document
        paragraphs
      chardet
        detect encoding
      pdfplumber
        Guidelines PDF parsing
      BytesIO
      tempfile
      shutil
    AI & LLM
      Google Gemini
        generativeai
        gemini-2.5-flash-lite
        generate_content
      Extraction Prompts
        FORM-I schema
        JSON output parsing
      Validation Prompts
        Guideline-based checks
        JSON response parsing
    Data Structures
      Python typing
        Dict[str, Any]
        List[str]
      json module
        loads
        dumps
      Domain Models
        basic_information
        project_details
        cost_breakdown
        additional_information
    Validation Logic
      Deterministic Rules
        GUIDELINE_RULES
        VALIDATE_FIELDS
        PLACEHOLDER_RE
        count_words
        parse_objectives
      Hybrid Engine
        rule_based_check
        ask_gemini_validate
        deterministic_llm_fallback
      Field Mapping
        get_value_from_extracted_payload
        deep_get path traversal
    Guidelines System
      PDF Ingestion
        load_guidelines_text
        pdfplumber
      RAG-lite
        build_guideline_excerpts
        Keyword matching
        Sentence windowing
    Persistence
      Supabase
        create_client
        Storage API
        Database table: proposals
        UPLOAD_BUCKET
        JSON_BUCKET
      Operations
        store_in_supabase
        upload files
        get_public_url
    State & Cache
      In-Memory
        latest_validation_result
        Module-level global
      Endpoints
        GET /latest-result
        Polling mechanism
    Configuration
      Environment
        dotenv
        load_dotenv
        os.getenv
      Keys
        GEMINI_API_KEY1/2/3
        SUPABASE_URL
        SUPABASE_KEY
        GUIDELINES_PDF_PATH
    Utilities
      Logging
        logging.basicConfig
        logger
      Error Handling
        traceback
        Exception chains
      IDs
        uuid
        datetime
```

---

## Domain Model

```mermaid
classDiagram
    class FormIProposal {
        +string form_type
        +BasicInformation basic_information
        +ProjectDetails project_details
        +CostBreakdown cost_breakdown
        +AdditionalInformation additional_information
    }

    class BasicInformation {
        +string project_title
        +string principal_implementing_agency
        +string project_leader_name
        +string sub_implementing_agency
        +string co_investigator_name
        +string contact_email
        +string contact_phone
        +string submission_date
        +string project_duration
    }

    class ProjectDetails {
        +string definition_of_issue
        +string objectives
        +string justification_subject_area
        +string project_benefits
        +string work_plan
        +string methodology
        +string organization_of_work
        +string time_schedule
        +string foreign_exchange_details
    }

    class CostBreakdown {
        +CapitalExpenditure capital_expenditure
        +RevenueExpenditure revenue_expenditure
        +TotalProjectCost total_project_cost
        +string fund_phasing
    }

    class CapitalExpenditure {
        +CostItem land_building
        +CostItem equipment
    }

    class RevenueExpenditure {
        +CostItem salaries
        +CostItem consumables
        +CostItem travel
        +CostItem workshop_seminar
    }

    class CostItem {
        +string total
        +string year1
        +string year2
        +string year3
        +string justification
        +string notes
    }

    class TotalProjectCost {
        +string total
        +string year1
        +string year2
        +string year3
    }

    class AdditionalInformation {
        +string cv_details
        +string past_experience
        +string other_details
    }

    class ValidationResult {
        +bool overall_validation
        +List~string~ columns_missing_value
        +List~FailingColumn~ columns_not_following_guidelines
        +List~FieldValidation~ fields
    }

    class FieldValidation {
        +string field_name
        +string value
        +string validation_result
        +string reason
    }

    class FailingColumn {
        +string field
        +string reason
    }

    FormIProposal --> BasicInformation
    FormIProposal --> ProjectDetails
    FormIProposal --> CostBreakdown
    FormIProposal --> AdditionalInformation
    CostBreakdown --> CapitalExpenditure
    CostBreakdown --> RevenueExpenditure
    CostBreakdown --> TotalProjectCost
    CapitalExpenditure --> CostItem
    RevenueExpenditure --> CostItem
    ValidationResult --> FieldValidation
    ValidationResult --> FailingColumn
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Tier"
        WEB[Web Frontend<br/>React/Next.js]
        MOBILE[Mobile App]
    end

    subgraph "Application Tier"
        LB[Load Balancer<br/>nginx/Caddy]
        APP1[FastAPI Instance 1<br/>Port 8001]
        APP2[FastAPI Instance 2<br/>Port 8002]
        APP3[FastAPI Instance N<br/>Port 800N]
    end

    subgraph "Service Tier"
        GEMINI_SVC[Google Gemini API<br/>generativeai SDK]
        SUPABASE_SVC[Supabase Cloud<br/>REST + Storage API]
    end

    subgraph "Storage Tier"
        GUIDE_DISK[Disk Storage<br/>Guidelines.pdf]
        SUPABASE_DB[(Supabase PostgreSQL<br/>proposals table)]
        SUPABASE_BUCKET[(Supabase Storage<br/>Coal-research-files)]
    end

    subgraph "Configuration"
        ENV[.env File<br/>API Keys & URLs]
    end

    WEB --> LB
    MOBILE --> LB
    LB --> APP1
    LB --> APP2
    LB --> APP3

    APP1 --> GEMINI_SVC
    APP2 --> GEMINI_SVC
    APP3 --> GEMINI_SVC

    APP1 --> SUPABASE_SVC
    APP2 --> SUPABASE_SVC
    APP3 --> SUPABASE_SVC

    APP1 --> GUIDE_DISK
    APP2 --> GUIDE_DISK
    APP3 --> GUIDE_DISK

    SUPABASE_SVC --> SUPABASE_DB
    SUPABASE_SVC --> SUPABASE_BUCKET

    ENV -.-> APP1
    ENV -.-> APP2
    ENV -.-> APP3

    style WEB fill:#e3f2fd
    style MOBILE fill:#e3f2fd
    style LB fill:#fff3e0
    style APP1 fill:#e8f5e9
    style APP2 fill:#e8f5e9
    style APP3 fill:#e8f5e9
    style GEMINI_SVC fill:#fce4ec
    style SUPABASE_SVC fill:#f3e5f5
    style SUPABASE_DB fill:#e1f5fe
    style SUPABASE_BUCKET fill:#e1f5fe
    style GUIDE_DISK fill:#fff9c4
    style ENV fill:#ffebee
```

---

## Error Handling & Resilience

```mermaid
flowchart TD
    START([Request Received]) --> TRY{Try Block}
    
    TRY -->|Success Path| FILE_VALID{File Extension<br/>Valid?}
    FILE_VALID -->|No| HTTP_400[HTTPException 400<br/>Unsupported file format]
    FILE_VALID -->|Yes| TEMP_FILE[Save to tempfile]
    
    TEMP_FILE --> EXTRACT{Text Extraction<br/>Successful?}
    EXTRACT -->|No| HTTP_400_EXTRACT[HTTPException 400<br/>No text extracted]
    EXTRACT -->|Yes| GEMINI_EXTRACT{Gemini<br/>Configured?}
    
    GEMINI_EXTRACT -->|No| EMPTY_TEMPLATE[Return Empty Template<br/>All fields = '']
    GEMINI_EXTRACT -->|Yes| CALL_GEMINI{Gemini API<br/>Success?}
    
    CALL_GEMINI -->|Fail| CATCH_JSON[JSON Parse Error]
    CALL_GEMINI -->|Success| PARSE{Valid JSON?}
    
    PARSE -->|No| EMPTY_TEMPLATE
    PARSE -->|Yes| NORMALIZE[Normalize Structure]
    
    EMPTY_TEMPLATE --> NORMALIZE
    
    NORMALIZE --> SUPABASE{Supabase<br/>Configured?}
    SUPABASE -->|No| SKIP_DB[Skip Database<br/>Continue Validation]
    SUPABASE -->|Yes| STORE{Store Data<br/>Success?}
    
    STORE -->|Fail| LOG_ERROR[Log Error<br/>Continue Validation]
    STORE -->|Success| CONTINUE
    
    SKIP_DB --> CONTINUE[Continue to Validation]
    LOG_ERROR --> CONTINUE
    
    CONTINUE --> GUIDELINES{Guidelines.pdf<br/>Exists?}
    GUIDELINES -->|No| LOG_WARN[Log Warning<br/>Use Empty Guideline Text]
    GUIDELINES -->|Yes| LOAD_GUIDE[Load Guidelines]
    
    LOG_WARN --> VAL_LOOP
    LOAD_GUIDE --> VAL_LOOP[Validation Loop]
    
    VAL_LOOP --> GEMINI_VAL{Gemini Available<br/>for Validation?}
    GEMINI_VAL -->|No| FALLBACK[Use Deterministic Fallback]
    GEMINI_VAL -->|Yes| CALL_VAL{Validation Call<br/>Success?}
    
    CALL_VAL -->|Fail| CATCH_VAL[Catch Exception<br/>Log Traceback]
    CALL_VAL -->|Success| NORMALIZE_RESULT
    
    CATCH_VAL --> FALLBACK
    FALLBACK --> NORMALIZE_RESULT[Normalize Result]
    
    NORMALIZE_RESULT --> AGGREGATE[Aggregate All Fields]
    AGGREGATE --> SUCCESS[Return 200 OK<br/>Update Cache]
    
    TRY -->|Exception| CATCH{Catch Block}
    CATCH --> HTTP_EXC{HTTPException?}
    HTTP_EXC -->|Yes| RERAISE[Re-raise HTTPException]
    HTTP_EXC -->|No| HTTP_500[HTTPException 500<br/>Log Traceback<br/>Return Error Detail]
    
    SUCCESS --> CLEANUP
    HTTP_400 --> CLEANUP
    HTTP_400_EXTRACT --> CLEANUP
    RERAISE --> CLEANUP
    HTTP_500 --> CLEANUP
    
    CLEANUP[Finally: Remove Temp File] --> END([Response Sent])
    
    style START fill:#e8f5e9
    style END fill:#e8f5e9
    style SUCCESS fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    style HTTP_400 fill:#ffccbc,stroke:#d84315,stroke-width:2px
    style HTTP_400_EXTRACT fill:#ffccbc,stroke:#d84315,stroke-width:2px
    style HTTP_500 fill:#ef5350,stroke:#c62828,stroke-width:3px
    style FALLBACK fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style LOG_ERROR fill:#ffe0b2,stroke:#e65100,stroke-width:1px
    style LOG_WARN fill:#ffe0b2,stroke:#e65100,stroke-width:1px
```

---

## Key Design Patterns

### 1. **Pipeline Pattern**
- Sequential processing: Upload → Parse → Extract → Normalize → Validate → Respond
- Each stage can fail gracefully and fall back

### 2. **Strategy Pattern**
- Validation strategy selected based on field type:
  - Deterministic (rule-based)
  - LLM-based (qualitative)
  - Hybrid (combination)

### 3. **Template Method Pattern**
- `extract_form_data_with_ai` defines extraction template
- `construct_simple_json_structure` normalizes to canonical structure

### 4. **Adapter Pattern**
- `get_value_from_extracted_payload` adapts between:
  - Raw extracted keys
  - Normalized JSON paths
  - Validation field names

### 5. **Fallback Pattern**
- Gemini not configured → empty template extraction
- Gemini validation fails → deterministic fallback
- Supabase not configured → skip persistence
- Guidelines missing → empty guideline text

### 6. **Observer Pattern** (Implicit)
- Frontend polls `GET /latest-result` for updates
- In-memory cache stores latest state

---

## Performance Considerations

| Component | Bottleneck | Mitigation Strategy |
|-----------|------------|---------------------|
| **Gemini API Calls** | Network latency (2-5s per call) | • Batch validation where possible<br/>• Use rule-based checks first<br/>• Cache common validations |
| **PDF Parsing** | Large PDFs (100+ pages) | • Stream processing<br/>• Page-by-page extraction<br/>• Limit guideline text size |
| **Supabase Storage** | File upload time | • Async upload<br/>• Optional (don't block validation)<br/>• Pre-signed URLs |
| **In-Memory State** | Single-process cache | • Redis for multi-instance deployments<br/>• Session-based storage<br/>• Database-backed results |
| **Validation Loop** | O(n) field checks | • Parallel rule checks (thread pool)<br/>• Early exit on critical failures<br/>• Batch Gemini prompts |

---

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        API_KEY[API Key Validation]
        RATE_LIMIT[Rate Limiting]
    end

    subgraph "Input Validation"
        FILE_SIZE[File Size Limit]
        FILE_TYPE[File Type Whitelist]
        SANITIZE[Input Sanitization]
    end

    subgraph "Secret Management"
        ENV_FILE[.env File<br/>Not in Git]
        ENV_VARS[Environment Variables]
        KEY_ROTATION[Key Rotation Policy]
    end

    subgraph "Data Security"
        TEMP_CLEANUP[Temp File Cleanup<br/>Finally Block]
        NO_LOG_SECRETS[No Secrets in Logs]
        SUPABASE_RLS[Supabase RLS Policies]
    end

    subgraph "API Security"
        CORS[CORS Configuration]
        HTTPS[HTTPS Only]
        ERROR_MASKING[Error Detail Masking]
    end

    REQUEST[Incoming Request] --> API_KEY
    API_KEY --> RATE_LIMIT
    RATE_LIMIT --> FILE_SIZE
    FILE_SIZE --> FILE_TYPE
    FILE_TYPE --> SANITIZE
    SANITIZE --> PROCESS[Process Request]

    ENV_FILE --> ENV_VARS
    ENV_VARS --> PROCESS
    KEY_ROTATION -.-> ENV_VARS

    PROCESS --> TEMP_CLEANUP
    PROCESS --> NO_LOG_SECRETS
    PROCESS --> SUPABASE_RLS

    CORS -.-> REQUEST
    HTTPS -.-> REQUEST
    ERROR_MASKING -.-> RESPONSE[Response]

    style API_KEY fill:#ffebee
    style FILE_TYPE fill:#fff3e0
    style SANITIZE fill:#fff3e0
    style ENV_FILE fill:#e8f5e9
    style TEMP_CLEANUP fill:#e3f2fd
    style HTTPS fill:#f3e5f5
```

---

## Monitoring & Observability

### Logging Strategy
```python
# Structured logging points:
logger.info("Gemini configured for validation")
logger.warning("SUPABASE_URL not set - supabase operations will be skipped")
logger.error("Error in AI extraction: %s", e)
logger.exception("Validation failed: %s", e)
```

### Key Metrics to Track
1. **Request Metrics**
   - Requests per endpoint
   - Response times (p50, p95, p99)
   - Error rates (4xx, 5xx)

2. **Extraction Metrics**
   - Gemini API latency
   - Extraction success rate
   - Text extraction errors by file type

3. **Validation Metrics**
   - Fields failing validation (by field name)
   - Rule-based vs LLM validation ratio
   - Overall validation pass rate

4. **Integration Metrics**
   - Supabase upload success rate
   - Guidelines PDF load time
   - Gemini API quota usage

### Health Check Response
```json
{
  "status": "running",
  "hybrid_validator": true,
  "guidelines": "Guidelines.pdf",
  "gemini_configured": true,
  "supabase_configured": true
}
```

---

## API Contract

### POST /validation/validate-form1

**Request:**
```http
POST /validation/validate-form1 HTTP/1.1
Content-Type: multipart/form-data

file: <PDF/DOCX/TXT>
```

**Response (200 OK):**
```json
{
  "validation_result": {
    "overall_validation": false,
    "columns_missing_value": ["Time Schedule"],
    "columns_not_following_guidelines": [
      {
        "field": "Objectives",
        "reason": "Objectives must be 2–5 clearly defined and listed. (found 1 objectives)."
      }
    ],
    "fields": [
      {
        "field_name": "Project Title",
        "value": "Sample Project Title",
        "validation_result": "filled_and_ok",
        "reason": "Title length within guideline limit."
      }
    ]
  },
  "extracted_data": {
    "form_type": "FORM-I S&T Grant Proposal",
    "basic_information": { ... },
    "project_details": { ... },
    "cost_breakdown": { ... },
    "additional_information": { ... }
  },
  "raw_extracted": {
    "project_title": "...",
    "definition_of_issue": "..."
  },
  "guidelines_used": "Guidelines.pdf"
}
```

### GET /validation/latest-result

**Response (202 Accepted - Waiting):**
```json
{
  "status": "waiting",
  "message": "No validation has been performed yet"
}
```

**Response (200 OK - Result Available):**
```json
{
  "validation_result": { ... },
  "extracted_data": { ... },
  "raw_extracted": { ... },
  "guidelines_used": "Guidelines.pdf"
}
```

---

## Future Enhancements

```mermaid
mindmap
  root((Future Roadmap))
    Performance
      Async Validation
        asyncio for parallel field checks
      Caching Layer
        Redis for validation results
        Guideline excerpt cache
      Batch Processing
        Multiple file upload
        Queue-based processing
    Features
      Advanced Validation
        Cross-field validation
        Cost calculation checks
        Timeline consistency
      Multi-language Support
        Hindi + English
        Regional languages
      Version Control
        Track proposal versions
        Diff between versions
    Integrations
      Notification System
        Email on validation complete
        Slack/Teams webhooks
      Document Generation
        Auto-fill FORM-I templates
        Generate validation reports PDF
      Analytics Dashboard
        Validation metrics
        Common failure patterns
    Infrastructure
      Kubernetes Deployment
        Horizontal scaling
        Load balancing
      Observability
        OpenTelemetry tracing
        Prometheus metrics
        Grafana dashboards
      CI/CD
        Automated testing
        Deployment pipelines
```

---

## Conclusion

This microservice implements a **sophisticated hybrid validation engine** that combines:

1. **Deterministic rule enforcement** (word counts, structure checks, keyword presence)
2. **AI-powered extraction** (Gemini for unstructured → structured transformation)
3. **LLM-guided qualitative validation** (semantic understanding of guidelines)
4. **Graceful degradation** (fallbacks at every layer)
5. **Optional persistence** (Supabase for file storage & metadata)

The architecture is designed to be:
- **Resilient** (works even if Gemini/Supabase unavailable)
- **Extensible** (easy to add new validation rules or fields)
- **Observable** (logging at key decision points)
- **Domain-focused** (closely models FORM-I structure and S&T Guidelines)

---

**Tech Stack Summary:**
`FastAPI` + `Gemini AI` + `PyPDF2` + `pdfplumber` + `Supabase` + `Python typing` + `Hybrid Validation Engine`
