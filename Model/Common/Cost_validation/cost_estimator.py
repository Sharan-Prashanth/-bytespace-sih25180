import os
import json
import re
import math
from io import BytesIO
from datetime import datetime
from typing import Dict

# Core imports
import pandas as pd
import numpy as np
import joblib

# Optional imports - wrap in try/except to prevent failures
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
    print("Warning: PyPDF2 not available")

try:
    import chardet
except ImportError:
    chardet = None
    print("Warning: chardet not available")

try:
    import docx
except ImportError:
    docx = None
    print("Warning: python-docx not available")

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("Warning: google-generativeai not available")

try:
    from fastapi import APIRouter, UploadFile, File
    from fastapi.responses import JSONResponse
except ImportError:
    APIRouter = UploadFile = File = JSONResponse = None
    print("Warning: FastAPI not available")

try:
    from supabase import create_client, Client
except ImportError:
    create_client = Client = None
    print("Warning: Supabase not available - API routes will be disabled")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not available")

try:
    import torch
except ImportError:
    torch = None
    print("Warning: PyTorch not available")

try:
    from sentence_transformers import SentenceTransformer, util
except ImportError:
    SentenceTransformer = util = None
    print("Warning: sentence-transformers not available")

# Add sklearn imports required for joblib model loading
try:
    import sklearn
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_squared_error, r2_score
    # Import specific modules that might be needed for deserialization
    import sklearn._loss._loss
    import sklearn.tree._tree
    import sklearn.tree._criterion
    import sklearn.tree._splitter
    import sklearn.tree._utils
    # Additional imports for compatibility
    import sklearn.utils._typedefs
    import sklearn.utils._param_validation
    import lightgbm as lgb
except ImportError as e:
    print(f"Warning: sklearn/lightgbm imports not fully available: {e}")
    RandomForestRegressor = StandardScaler = lgb = None
# Some saved SentenceTransformer/transformers pickles expect older private attributes
# (e.g. _output_attentions) on config classes. When unpickling with a newer
# transformers version this can raise AttributeError. To be robust, add missing
# attributes to BertConfig before loading pickles.
try:
    from transformers import BertConfig, BertModel, BertTokenizer
    # Add missing attributes that might be expected by older pickles
    if not hasattr(BertConfig, "_output_attentions"):
        setattr(BertConfig, "_output_attentions", None)
    if not hasattr(BertConfig, "_output_hidden_states"):
        setattr(BertConfig, "_output_hidden_states", None)
    if not hasattr(BertConfig, "torchscript"):
        setattr(BertConfig, "torchscript", False)
    if not hasattr(BertConfig, "use_bfloat16"):
        setattr(BertConfig, "use_bfloat16", False)
except Exception as e:
    # transformers may not be installed or importable; ignore and let joblib.load fail later
    print(f"Warning: transformers import issues: {e}")
    pass

# ---------------- ENV INIT ----------------

# Only initialize if dependencies are available
SUPABASE_URL = SUPABASE_KEY = GEMINI_API_KEY = None
supabase = None
router = None

if create_client:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"Warning: Could not initialize Supabase: {e}")
            supabase = None

if genai:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY4")
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
        except Exception as e:
            print(f"Warning: Could not configure Gemini: {e}")

if APIRouter:
    router = APIRouter()
else:
    print("Warning: API routes will not be available")


# ===============================================================
#               ENHANCED COST PREDICTOR CLASS DEFINITION
# ===============================================================

class EnhancedCostPredictor:
    """Enhanced Cost Prediction class with contextual analysis"""
    
    def __init__(self, model, sbert_encoder, feature_scaler, historical_data):
        self.model = model
        self.sbert_encoder = sbert_encoder
        self.feature_scaler = feature_scaler
        self.historical_data = historical_data
        
    def predict_cost(self, project_description, target_year=2025, agency_type="government", 
                     project_scale="medium", technology_focus="general"):
        """
        Predict project cost with contextual analysis
        
        Args:
            project_description: Text description of the project
            target_year: Year for which cost is being estimated
            agency_type: Type of implementing agency
            project_scale: Scale of the project (pilot/medium/large)
            technology_focus: Primary technology area
        """
        
        # 1. Generate SBERT embeddings
        text_embedding = self.sbert_encoder.encode([project_description])
        
        # 2. Create year-based features
        years_since_base = target_year - 2009
        inflation_factor = (1.06) ** years_since_base
        
        if target_year <= 2012:
            era = 0
        elif target_year <= 2018:
            era = 1
        else:
            era = 2
            
        year_features = [[target_year, years_since_base, inflation_factor, era]]
        
        # 3. Extract project features
        project_features = self._extract_project_features(project_description)
        project_features_array = [[
            project_features['tech_iot_ai'], project_features['tech_mining_equipment'],
            project_features['tech_safety_monitoring'], project_features['tech_environmental'],
            project_features['tech_software'], project_features['scale_pilot'],
            project_features['scale_medium'], project_features['scale_large'],
            project_features['org_academic'], project_features['org_government'],
            project_features['org_private'], project_features['org_public_sector'],
            project_features['text_length'], project_features['technical_terms'],
            project_features['cost_keywords']
        ]]
        
        # 4. Scale project features
        project_features_scaled = self.feature_scaler.transform(project_features_array)
        
        # 5. Combine all features
        import numpy as np
        combined_features = np.hstack([
            text_embedding,
            year_features,
            project_features_scaled
        ])
        
        # 6. Make prediction
        predicted_cost = self.model.predict(combined_features)[0]
        
        # 7. Analyze similar historical projects for context
        similar_projects = self._find_similar_projects(project_description, target_year)
        
        # 8. Calculate confidence score
        confidence_score = self._calculate_confidence(
            predicted_cost, similar_projects, project_features
        )
        
        # 9. Generate cost breakdown and recommendations
        breakdown = self._generate_cost_breakdown(predicted_cost, project_features)
        
        return {
            'predicted_cost_lakhs': round(predicted_cost, 2),
            'confidence_score': round(confidence_score, 2),
            'cost_breakdown': breakdown,
            'similar_projects': similar_projects,
            'year_analysis': {
                'target_year': target_year,
                'inflation_factor': round(inflation_factor, 2),
                'era': ['Early (2009-2012)', 'Middle (2013-2018)', 'Recent (2019+)'][era]
            },
            'recommendations': self._generate_recommendations(predicted_cost, project_features)
        }
    
    def _extract_project_features(self, text):
        """Extract project type, technology focus, and complexity indicators"""
        text = str(text).lower()
        
        # Technology categories
        tech_keywords = {
            'iot_ai': ['iot', 'artificial intelligence', 'ai', 'machine learning', 'sensor', 'automation'],
            'mining_equipment': ['mining', 'excavation', 'drilling', 'conveyor', 'crusher', 'machinery'],
            'safety_monitoring': ['safety', 'monitoring', 'warning', 'detection', 'alert', 'surveillance'],
            'environmental': ['environment', 'pollution', 'emission', 'water', 'air quality', 'waste'],
            'software': ['software', 'application', 'system', 'platform', 'algorithm', 'programming']
        }
        
        # Project scale indicators
        scale_keywords = {
            'pilot': ['pilot', 'prototype', 'demonstration', 'proof of concept'],
            'medium': ['implementation', 'deployment', 'installation', 'integration'],
            'large': ['commercial', 'industrial', 'full scale', 'mass production', 'nationwide']
        }
        
        # Agency/organization types
        org_keywords = {
            'academic': ['university', 'college', 'institute', 'iit', 'nit', 'research'],
            'government': ['cmpdi', 'cil', 'ministry', 'department', 'govt', 'government'],
            'private': ['ltd', 'pvt', 'private', 'company', 'corporation'],
            'public_sector': ['ongc', 'ntpc', 'bhel', 'sail', 'coal india']
        }
        
        # Count matches for each category
        features = {}
        
        # Technology features
        for tech_type, keywords in tech_keywords.items():
            features[f'tech_{tech_type}'] = sum(1 for keyword in keywords if keyword in text)
        
        # Scale features  
        for scale_type, keywords in scale_keywords.items():
            features[f'scale_{scale_type}'] = sum(1 for keyword in keywords if keyword in text)
        
        # Organization features
        for org_type, keywords in org_keywords.items():
            features[f'org_{org_type}'] = sum(1 for keyword in keywords if keyword in text)
        
        # Complexity indicators
        features['text_length'] = len(text)
        features['technical_terms'] = len(re.findall(r'\b(development|technology|system|equipment|monitoring|analysis)\b', text))
        features['cost_keywords'] = len(re.findall(r'\b(equipment|machinery|software|development|installation)\b', text))
        
        return features
    
    def _find_similar_projects(self, description, target_year, top_k=3):
        """Find similar historical projects"""
        try:
            query_embedding = self.sbert_encoder.encode([description])
            
            # Calculate similarity with historical projects
            historical_embeddings = self.sbert_encoder.encode(self.historical_data['clean_text'].tolist())
            similarities = query_embedding.dot(historical_embeddings.T)[0]
            
            # Get top similar projects
            import numpy as np
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            similar_projects = []
            for idx in top_indices:
                project = {
                    'similarity': round(similarities[idx], 3),
                    'year': self.historical_data.iloc[idx]['Financial Year'],
                    'cost': self.historical_data.iloc[idx]['Cost (Lakhs)'],
                    'description': str(self.historical_data.iloc[idx]['clean_text'])[:100] + "..."
                }
                similar_projects.append(project)
                
            return similar_projects
        except Exception:
            return []
    
    def _calculate_confidence(self, predicted_cost, similar_projects, project_features):
        """Calculate confidence score based on multiple factors"""
        confidence = 0.5  # Base confidence
        
        # Factor 1: Similar projects cost variance
        if similar_projects:
            import numpy as np
            similar_costs = [p['cost'] for p in similar_projects]
            cost_variance = np.std(similar_costs) / (np.mean(similar_costs) + 1)
            confidence += (1 - min(cost_variance, 1)) * 0.3
        
        # Factor 2: Feature richness
        total_features = sum(project_features.values())
        if total_features > 10:
            confidence += 0.15
        elif total_features > 5:
            confidence += 0.1
            
        # Factor 3: Reasonable cost range
        if 50 <= predicted_cost <= 1000:  # Typical project range
            confidence += 0.15
            
        return min(confidence * 100, 95)  # Cap at 95%
    
    def _generate_cost_breakdown(self, total_cost, project_features):
        """Generate detailed cost breakdown based on project characteristics"""
        breakdown = {}
        
        # Base percentages
        base_breakdown = {
            'manpower': 0.45,
            'equipment': 0.25,
            'software_tools': 0.08,
            'data_collection': 0.10,
            'travel_fieldwork': 0.05,
            'contingency': 0.07
        }
        
        # Adjust based on project features
        if project_features.get('tech_iot_ai', 0) > 2:
            base_breakdown['software_tools'] += 0.05
            base_breakdown['equipment'] += 0.05
            base_breakdown['manpower'] -= 0.10
            
        if project_features.get('tech_mining_equipment', 0) > 2:
            base_breakdown['equipment'] += 0.15
            base_breakdown['manpower'] -= 0.10
            base_breakdown['contingency'] -= 0.05
            
        # Calculate actual amounts
        for category, percentage in base_breakdown.items():
            breakdown[category] = round(total_cost * percentage, 2)
            
        return breakdown
    
    def _generate_recommendations(self, predicted_cost, project_features):
        """Generate cost optimization recommendations"""
        recommendations = []
        
        if predicted_cost > 1000:
            recommendations.append("Consider phasing the project over multiple years")
            recommendations.append("Explore partnerships to share costs")
            
        if project_features.get('tech_iot_ai', 0) > 0:
            recommendations.append("Leverage existing IoT platforms to reduce development costs")
            
        if project_features.get('scale_pilot', 0) > 0:
            recommendations.append("Start with pilot implementation to validate approach")
            
        recommendations.append("Regular milestone-based reviews to control costs")
        
        return recommendations


# ===============================================================
#               ENHANCED MULTI-REGRESSION COST MODEL
# ===============================================================

# Try multiple possible locations for the enhanced model
ENHANCED_PREDICTOR_PATHS = [
    r"Enhanced_Cost_Predictor.joblib",  # Same directory
    r"pre-trained\Enhanced_Cost_Predictor.joblib",  # pre-trained folder
    r"Enhanced_Multi_Regression_Cost_Model.joblib",  # Alternative name
    r"pre-trained\Enhanced_Multi_Regression_Cost_Model.joblib",  # Alternative in pre-trained
    r"c:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\pre-trained\Enhanced_Cost_Predictor.joblib"  # Absolute path
]

print("Loading Enhanced Multi-Regression Cost Model...")

enhanced_predictor = None

# First, try to load model components separately to avoid class loading issues
try:
    component_paths = [
        r"Enhanced_Multi_Regression_Cost_Model.joblib",
        r"pre-trained\Enhanced_Multi_Regression_Cost_Model.joblib",
        r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\pre-trained\Enhanced_Multi_Regression_Cost_Model.joblib"
    ]
    
    components_loaded = False
    for comp_path in component_paths:
        if os.path.exists(comp_path):
            try:
                print(f"Loading model components from: {comp_path}")
                file_size_mb = os.path.getsize(comp_path) / 1024 / 1024
                print(f"File size: {file_size_mb:.1f} MB - Loading...")
                
                import time
                start_time = time.time()
                components = joblib.load(comp_path)
                load_time = time.time() - start_time
                
                print(f"✅ Loaded in {load_time:.1f} seconds")
                
                # Verify components
                if isinstance(components, dict):
                    print(f"Available keys: {list(components.keys())}")
                    required_keys = ['best_model', 'sbert_encoder', 'feature_scaler', 'historical_data']
                    missing_keys = [key for key in required_keys if key not in components]
                    
                    if missing_keys:
                        print(f"❌ Missing required keys: {missing_keys}")
                        continue
                    
                    # Create enhanced predictor from components
                    enhanced_predictor = EnhancedCostPredictor(
                        model=components['best_model'],
                        sbert_encoder=components['sbert_encoder'], 
                        feature_scaler=components['feature_scaler'],
                        historical_data=components['historical_data']
                    )
                    print("✅ Enhanced Cost Predictor created from components!")
                    print("Features: 403 (SBERT + Year trends + Technology categories + Agency types)")
                    print("Model: Random Forest with 14.6% improved accuracy")
                    components_loaded = True
                    break
                else:
                    print(f"❌ Components is not a dictionary: {type(components)}")
                    continue
                    
            except Exception as e:
                print(f"❌ Error loading {comp_path}: {e}")
                continue
    
    if not components_loaded:
        raise FileNotFoundError("Model components file not found or invalid")
        
except Exception as e:
    print(f"❌ Error loading from components: {e}")
    
    # Fallback: try direct joblib loading
    if enhanced_predictor is None:
        for path in ENHANCED_PREDICTOR_PATHS:
            try:
                if os.path.exists(path):
                    enhanced_predictor = joblib.load(path)
                    print(f"✅ Enhanced Cost Predictor loaded from: {path}")
                    print("Features: 403 (SBERT + Year trends + Technology categories + Agency types)")
                    print("Model: Random Forest with 14.6% improved accuracy")
                    break
            except Exception as e:
                print(f"❌ Error loading from {path}: {e}")
                continue

if enhanced_predictor is None:
    print("❌ Enhanced model file not found in any location. Attempting to create simplified enhanced predictor...")
    
    # Try to create a simplified enhanced predictor with basic components
    try:
        if SentenceTransformer and RandomForestRegressor and StandardScaler:
            print("Creating simplified enhanced model with available components...")
            
            # Create basic components
            print("Initializing SBERT encoder...")
            sbert_encoder = SentenceTransformer('all-MiniLM-L6-v2')  # Smaller, faster model
            
            print("Creating Random Forest model...")
            rf_model = RandomForestRegressor(n_estimators=50, random_state=42)  # Smaller model
            
            print("Creating feature scaler...")
            scaler = StandardScaler()
            
            # Create dummy historical data
            print("Creating basic historical data...")
            historical_data = pd.DataFrame({
                'clean_text': [
                    'IoT sensor based coal mining safety monitoring system',
                    'AI powered mining equipment optimization',
                    'Environmental monitoring for coal mines',
                    'Software platform for mining operations',
                    'Mining automation and control system'
                ],
                'year': [2020, 2021, 2022, 2023, 2024],
                'cost_lakhs': [500, 750, 600, 850, 700]
            })
            
            # Train a basic model on the dummy data
            print("Training simplified model...")
            # Create simple features
            simple_features = [[len(text), text.count('system'), text.count('mining')] for text in historical_data['clean_text']]
            scaler.fit(simple_features)
            scaled_features = scaler.transform(simple_features)
            rf_model.fit(scaled_features, historical_data['cost_lakhs'])
            
            # Create enhanced predictor
            enhanced_predictor = EnhancedCostPredictor(
                model=rf_model,
                sbert_encoder=sbert_encoder,
                feature_scaler=scaler,
                historical_data=historical_data
            )
            
            print("✅ Simplified Enhanced Cost Predictor created successfully!")
            print("Features: Basic (text length + keyword counting + simple ML)")
            print("Model: Simplified Random Forest for compatibility")
            
        else:
            print("❌ Required packages not available for simplified model")
            
    except Exception as e:
        print(f"❌ Error creating simplified enhanced predictor: {e}")

if enhanced_predictor is None:
    print("❌ All enhanced model attempts failed. Using basic fallback mode.")
    print("Available files in current directory:")
    try:
        current_files = [f for f in os.listdir('.') if f.endswith('.joblib')]
        if current_files:
            for file in current_files:
                print(f"  - {file}")
        else:
            print("  - No .joblib files found in current directory")
            
        # Check pre-trained folder
        pretrained_path = "pre-trained"
        if os.path.exists(pretrained_path):
            pretrained_files = [f for f in os.listdir(pretrained_path) if f.endswith('.joblib')]
            if pretrained_files:
                print("Available files in pre-trained directory:")
                for file in pretrained_files:
                    print(f"  - pre-trained/{file}")
    except Exception as e:
        print(f"Error checking files: {e}")


# ===============================================================
#                HISTORICAL DATA (FALLBACK MODE ONLY)
# ===============================================================

# This section is only used if enhanced model is not available
# The enhanced model contains its own optimized historical data

EXCEL_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\web-scarpping\completion_reports_with_json.xlsx"

if enhanced_predictor is None:
    print("Loading fallback historical data...")
    try:
        df_excel = pd.read_excel(EXCEL_PATH)
        abstract_col = "Extracted_JSON"
        year_col = "Financial Year"
        cost_col = "Cost (Lakhs)"
        df_excel = df_excel[[abstract_col, year_col, cost_col]].dropna()
        print(f"Loaded {len(df_excel)} historical projects for fallback mode")
    except Exception as e:
        print(f"Warning: Could not load historical data: {e}")
        df_excel = pd.DataFrame()
else:
    print("Enhanced model contains optimized historical data")


def get_similar_projects(query_text, top_k=5):
    """Fallback function for similarity search when enhanced model not available"""
    if enhanced_predictor is not None:
        # Use enhanced model if available
        return get_similar_projects_enhanced(query_text, top_k)
    
    # Fallback mode - simplified similarity search
    try:
        if 'df_excel' not in globals() or df_excel.empty:
            return []
        
        # Simple keyword-based similarity for fallback
        examples = []
        for i, row in df_excel.head(top_k).iterrows():
            examples.append({
                "abstract": row[abstract_col],
                "year": row[year_col], 
                "cost": float(row[cost_col])
            })
        return examples
    except Exception:
        return []


# ===============================================================
#                 TEXT EXTRACTORS
# ===============================================================

def extract_pdf_text(bts):
    try:
        reader = PyPDF2.PdfReader(BytesIO(bts))
        return "\n".join([page.extract_text() or "" for page in reader.pages])
    except:
        enc = chardet.detect(bts)["encoding"] or "utf-8"
        return bts.decode(enc, errors="ignore")


def extract_docx_text(bts):
    doc = docx.Document(BytesIO(bts))
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])


def extract_text(filename, bts):
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return extract_pdf_text(bts)
    if ext == "docx":
        return extract_docx_text(bts)

    enc = chardet.detect(bts)["encoding"] or "utf-8"
    return bts.decode(enc, errors="ignore")


# ===============================================================
#                 CHUNK HANDLER
# ===============================================================

def chunk_text(text, min_lines=60):
    lines = [l for l in text.splitlines() if l.strip()]
    return ["\n".join(lines[i:i + min_lines])
            for i in range(0, len(lines), min_lines)]


# ===============================================================
#                 LLM PROMPT WITH HISTORICAL DATA
# ===============================================================

def llm_cost_prompt(new_context, similar_projects):

    sim_block = ""
    for p in similar_projects:
        sim_block += f"""
PAST PROJECT ABSTRACT:
{p['abstract']}

FINANCIAL YEAR: {p['year']}
FINAL APPROVED COST (Lakhs): {p['cost']}
---------------------------------------------------------
"""

    return f"""
You are a senior Government of India R&D Cost Estimation Officer.

Your job is to estimate project cost STRICTLY in **Indian Rupees (Lakhs)** 
based on:
1. Historical completed project data (below)
2. The new proposal abstract (below)

Your estimate MUST be realistic and comply with:
• DST / CSIR / MoC / CMPDI / CIL funding norms  
• Typical R&D funding scales (10–500 Lakhs range for normal projects)  
• No exaggerated or inflated numbers  

=========================================================
HISTORICAL COMPLETED PROJECTS (Reference Benchmarks)
=========================================================
{sim_block}

=========================================================
NEW PROJECT ABSTRACT
=========================================================
{new_context}

=========================================================
STRICT COSTING RULES (MANDATORY)
=========================================================

⚫ Output cost MUST be expressed in **Lakhs**, not crores.
⚫ Final cost must be within realistic boundaries:
    • Small Software/AI/Automation projects: 10–80 Lakhs
    • Medium R&D/Field/Lab projects: 40–150 Lakhs
    • Large Mining/Equipment/Deployment projects: 100–500 Lakhs
⚫ DO NOT exceed 500 Lakhs unless the abstract clearly demands 
   heavy mining machinery or multi-site deployments.

⚫ COST CATEGORY LIMITS:
    equipment: 5%–35%
    software_and_tools: 5%–15%
    manpower: 30%–55%
    data_collection: 5%–20%
    travel_and_fieldwork: 2%–8%
    cloud_and_compute: 2%–10%
    maintenance_and_operations: 3%–12%
    consumables: 2%–10%
    contingency: 5%–10%

⚫ The sum of the breakdown MUST equal estimated_cost exactly.
⚫ Values must be integers only.
⚫ Be conservative, realistic, and consistent with past projects.

=========================================================
REQUIRED OUTPUT FORMAT (STRICT JSON ONLY)
=========================================================
{{
  "estimated_cost": 0,
  "breakdown": {{
    "equipment": 0,
    "software_and_tools": 0,
    "manpower": 0,
    "data_collection": 0,
    "travel_and_fieldwork": 0,
    "cloud_and_compute": 0,
    "maintenance_and_operations": 0,
    "consumables": 0,
    "contingency": 0
  }},
  "confidence": 0.0
}}

Return ONLY the JSON object. No explanations. No text outside JSON.
"""



def call_gemini(prompt):
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    resp = model.generate_content(prompt)
    return resp.text or ""


def parse_json(text):
    try:
        return json.loads(text[text.find("{"): text.rfind("}") + 1])
    except:
        return None


# ===============================================================
#              LLM COST ESTIMATION (MULTI-CHUNK)
# ===============================================================

def estimate_cost_from_chunks(chunks, similar_projects):
    results = []
    for c in chunks:
        prompt = llm_cost_prompt(c, similar_projects)
        raw = call_gemini(prompt)
        parsed = parse_json(raw) or {"estimated_cost": 0, "confidence": 0.0}
        results.append(parsed)
    return results


def aggregate_llm_cost(results):
    total = sum(r.get("estimated_cost", 0) for r in results)
    avg_conf = sum(r.get("confidence", 0) for r in results) / len(results)

    combined_breakdown = {}
    for r in results:
        b = r.get("breakdown", {})
        for k, v in b.items():
            combined_breakdown[k] = combined_breakdown.get(k, 0) + int(v)

    return total, avg_conf, combined_breakdown


# Recommended category ranges (percents) used for quick validation
CATEGORY_RANGES = {
    "equipment": (5, 35),
    "software_and_tools": (5, 15),
    "manpower": (30, 55),
    "data_collection": (5, 20),
    "travel_and_fieldwork": (2, 8),
    "cloud_and_compute": (2, 10),
    "maintenance_and_operations": (3, 12),
    "consumables": (2, 10),
    "contingency": (5, 10)
}


def assess_breakdown(breakdown: Dict[str, int], total_cost: float) -> str:
    """Return a concise one-line comment assessing whether major categories are within recommended ranges.

    If a category is outside the range, mention it briefly. If all OK, return an OK message.
    """
    issues = []
    if not breakdown or total_cost <= 0:
        return "No valid breakdown available to assess category proportions."

    for cat, (low, high) in CATEGORY_RANGES.items():
        val = float(breakdown.get(cat, 0))
        pct = (val / total_cost) * 100 if total_cost else 0.0
        # allow small rounding tolerance +-1%
        if pct + 1 < low:
            issues.append(f"{cat} low ({pct:.0f}% < {low}%)")
        elif pct - 1 > high:
            issues.append(f"{cat} high ({pct:.0f}% > {high}%)")

    if not issues:
        return "Breakdown looks reasonable against typical funding ranges."
    # return top 3 issues as a succinct comment
    return "; ".join(issues[:3]) + "."


def call_gemini_usage_comment(final_budget: int, llm_cost: float, ml_cost: float, breakdown: Dict[str, int], validation_status: str) -> str:
    """Ask Gemini to produce exactly 5 short lines describing why the cost is lower and how the saved money can be used to meet expectations.

    Returns a single string with 5 newline-separated lines. Falls back to a heuristic 5-line comment on failure.
    """
    try:
        # Build a compact prompt that provides the numbers and requests exactly five lines.
        breakdown_preview = ", ".join([f"{k}:{v}" for k, v in (breakdown or {}).items() if v])
        prompt = f"""
You are a senior Government of India R&D cost advisor. Based on the inputs below, produce EXACTLY five short, plain-language lines (no numbering, no extra text) explaining:
- Why the final budget is lower than expected (point to likely categories or conservative assumptions).
- Practical ways the government can reallocate or use the freed/saved funds to meet the project's expectations.

INPUT:
Final government budget (Lakhs): {int(final_budget)}
LLM combined cost (Lakhs): {round(llm_cost,2)}
ML predicted cost (Lakhs): {round(ml_cost,2)}
Validation status: {validation_status}
Breakdown sample: {breakdown_preview}

REQUIREMENTS:
- Return EXACTLY 5 lines separated by newlines. Each line must be short (<=140 characters).
- Lines should be actionable and focused on cost drivers and reallocation options.

EXAMPLE:
Score: 40/100    Changeable: 24%
The budget broadly aligns with pilot-scale efforts but lacks
detailed line-item breakdowns for high-value equipment. Several
procurement entries above ₹5M require vendor quotes or
justification.
Recommended actions:
Provide detailed quotations for specialized
equipment and vendor estimates for each major line
item.Separate capital vs operational expenses and
include lifecycle maintenance cost estimates.Clarify contingencies and explain assumptions
behind unit costs to reduce budget uncertainty
"""
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        resp = model.generate_content(prompt)
        raw = resp.text or ""
        # normalize output to five non-empty lines
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        if len(lines) >= 5:
            return "\n".join(lines[:5])
        # if model returned fewer lines but some text, try to split by sentences
        import re as _re
        sents = _re.split(r'(?<=[.?!])\s+', raw.strip()) if raw else []
        sents = [s.strip() for s in sents if s.strip()]
        if len(sents) >= 5:
            return "\n".join(sents[:5])
    except Exception:
        pass

    # Fallback heuristic 5-line comment
    fb = []
    fb.append(f"Final budget set to {int(final_budget)} Lakhs after cross-checks with ML/LLM estimates.")
    fb.append("Lower cost likely due to conservative equipment estimates or reliance on internal manpower.")
    fb.append("Use savings for focused pilot deployments, validation studies, or targeted equipment upgrades.")
    fb.append("Allocate a portion to capacity building and field validation to meet expected outcomes.")
    fb.append("Keep a contingency reserve and tie disbursements to clear milestones for accountability.")
    return "\n".join(fb)


# ===============================================================
#                ENHANCED COST PREDICTION FUNCTION
# ===============================================================

def enhanced_ml_cost_estimate(text, target_year=2025, agency_type="government", project_scale="medium"):
    """
    Enhanced ML cost estimation using the multi-regression model
    
    Args:
        text: Project description text
        target_year: Target year for cost estimation (default: 2025)
        agency_type: Type of agency (government, academic, private, public_sector)
        project_scale: Project scale (pilot, medium, large)
    
    Returns:
        dict: Comprehensive cost estimation with breakdown and confidence
    """
    if enhanced_predictor is None:
        # Fallback to simple estimation if enhanced model not available
        fallback_cost = simple_cost_fallback(text)
        return {
            "predicted_cost": fallback_cost,
            "confidence_score": 50.0,
            "cost_breakdown": {},
            "model_type": "simple_fallback",
            "error": "Enhanced model not available"
        }
    
    try:
        # Use enhanced predictor for comprehensive analysis
        result = enhanced_predictor.predict_cost(
            project_description=text,
            target_year=target_year,
            agency_type=agency_type,
            project_scale=project_scale
        )
        
        return {
            "predicted_cost": result['predicted_cost_lakhs'],
            "confidence_score": result['confidence_score'],
            "cost_breakdown": result['cost_breakdown'],
            "year_analysis": result['year_analysis'],
            "similar_projects": result['similar_projects'],
            "recommendations": result['recommendations'],
            "model_type": "enhanced_multi_regression"
        }
        
    except Exception as e:
        print(f"Enhanced model error: {e}")
        # Fallback estimation
        fallback_cost = simple_cost_fallback(text)
        return {
            "predicted_cost": fallback_cost,
            "confidence_score": 30.0,
            "cost_breakdown": {},
            "model_type": "simple_fallback",
            "error": str(e)
        }


def get_similar_projects_enhanced(query_text, top_k=5):
    """Get similar projects using enhanced model's built-in functionality"""
    if enhanced_predictor is None:
        return []
    
    try:
        # Use enhanced predictor's similarity matching
        result = enhanced_predictor.predict_cost(query_text, target_year=2025)
        return result.get('similar_projects', [])
    except Exception:
        return []


def simple_cost_fallback(text):
    """Simple fallback cost estimation when enhanced model fails"""
    # Basic heuristic based on text length and keywords
    base_cost = 300
    
    # Adjust based on text length
    text_factor = min(len(text) / 1000, 2.0)
    
    # Technology keywords boost
    tech_keywords = ['iot', 'ai', 'machine learning', 'automation', 'sensor', 'monitoring']
    tech_boost = sum(1 for keyword in tech_keywords if keyword.lower() in text.lower()) * 50
    
    # Scale keywords boost  
    scale_keywords = ['large', 'commercial', 'industrial', 'deployment']
    scale_boost = sum(1 for keyword in scale_keywords if keyword.lower() in text.lower()) * 100
    
    estimated_cost = base_cost + (base_cost * text_factor) + tech_boost + scale_boost
    return min(estimated_cost, 1000)  # Cap at 1000 Lakhs


# ===============================================================
#                    FORM-I COST BREAKDOWN ANALYSIS
# ===============================================================

def analyze_form1_cost_breakdown(form_data: Dict) -> Dict:
    """Analyze and validate Form-I cost breakdown data."""
    cost_breakdown = form_data.get("cost_breakdown", {})
    
    # Extract all cost values and convert to numbers
    extracted_costs = {}
    total_extracted = 0
    
    try:
        # Capital expenditure
        cap_ex = cost_breakdown.get("capital_expenditure", {})
        
        land_building = cap_ex.get("land_building", {})
        lb_year1 = float(land_building.get("year1", 0) or 0)
        lb_year2 = float(land_building.get("year2", 0) or 0)
        lb_year3 = float(land_building.get("year3", 0) or 0)
        lb_total = lb_year1 + lb_year2 + lb_year3
        
        equipment = cap_ex.get("equipment", {})
        eq_year1 = float(equipment.get("year1", 0) or 0)
        eq_year2 = float(equipment.get("year2", 0) or 0)
        eq_year3 = float(equipment.get("year3", 0) or 0)
        eq_total = eq_year1 + eq_year2 + eq_year3
        
        # Revenue expenditure
        rev_ex = cost_breakdown.get("revenue_expenditure", {})
        
        salaries = rev_ex.get("salaries", {})
        sal_year1 = float(salaries.get("year1", 0) or 0)
        sal_year2 = float(salaries.get("year2", 0) or 0)
        sal_year3 = float(salaries.get("year3", 0) or 0)
        sal_total = sal_year1 + sal_year2 + sal_year3
        
        consumables = rev_ex.get("consumables", {})
        con_year1 = float(consumables.get("year1", 0) or 0)
        con_year2 = float(consumables.get("year2", 0) or 0)
        con_year3 = float(consumables.get("year3", 0) or 0)
        con_total = con_year1 + con_year2 + con_year3
        
        travel = rev_ex.get("travel", {})
        tr_year1 = float(travel.get("year1", 0) or 0)
        tr_year2 = float(travel.get("year2", 0) or 0)
        tr_year3 = float(travel.get("year3", 0) or 0)
        tr_total = tr_year1 + tr_year2 + tr_year3
        
        workshop = rev_ex.get("workshop_seminar", {})
        ws_year1 = float(workshop.get("year1", 0) or 0)
        ws_year2 = float(workshop.get("year2", 0) or 0)
        ws_year3 = float(workshop.get("year3", 0) or 0)
        ws_total = ws_year1 + ws_year2 + ws_year3
        
        # Map to our standard categories
        extracted_costs = {
            "equipment": int(eq_total + lb_total),  # Combine equipment and infrastructure
            "software_and_tools": 0,  # Not explicitly in Form-I, estimate later
            "manpower": int(sal_total),
            "data_collection": int(con_total * 0.3),  # Portion of consumables for data
            "travel_and_fieldwork": int(tr_total),
            "cloud_and_compute": 0,  # Not in Form-I, estimate later
            "maintenance_and_operations": int(con_total * 0.4),  # Portion of consumables
            "consumables": int(con_total * 0.3),  # Remaining consumables
            "contingency": int(ws_total)  # Use workshop/seminar for contingency
        }
        
        total_extracted = sum(extracted_costs.values())
        
    except (ValueError, TypeError) as e:
        print(f"Error parsing Form-I cost data: {e}")
        extracted_costs = {}
        total_extracted = 0
    
    return {
        "extracted_costs": extracted_costs,
        "total_extracted": total_extracted,
        "has_valid_data": total_extracted > 0
    }


def create_project_summary(form_data: Dict) -> str:
    """Create a concise project summary from Form-I data for cost estimation."""
    basic_info = form_data.get("basic_information", {})
    project_details = form_data.get("project_details", {})
    
    title = basic_info.get("project_title", "")
    objectives = project_details.get("objectives", "")
    methodology = project_details.get("methodology", "")
    work_plan = project_details.get("work_plan", "")
    benefits = project_details.get("project_benefits", "")
    
    summary = f"""
Project Title: {title}

Objectives: {objectives}

Methodology: {methodology}

Work Plan: {work_plan}

Expected Benefits: {benefits}
    """.strip()
    
    return summary


# ===============================================================
#                    FASTAPI ENDPOINTS
# ===============================================================

@router.post("/estimate-from-form1-data")
async def estimate_from_form1_data(form_data: dict):
    """
    Accept Form-I JSON data (from /extract-form1 endpoint) and provide cost estimation.
    This works with the JSON structure returned by the existing Form-I extraction endpoint.
    """
    try:
        # Validate input structure
        if not isinstance(form_data, dict):
            return {"success": False, "error": "Invalid input: expected JSON object"}
        
        # Check if this is Form-I data
        form_type = form_data.get("form_type", "")
        if "FORM-I" not in form_type:
            return {"success": False, "error": "Input does not appear to be Form-I data"}
        
        # Analyze the cost breakdown from Form-I
        cost_analysis = analyze_form1_cost_breakdown(form_data)
        
        # Create project summary for AI estimation
        project_summary = create_project_summary(form_data)
        
        # If project summary is too short, use available text
        if len(project_summary.strip()) < 50:
            basic_info = form_data.get("basic_information", {})
            project_details = form_data.get("project_details", {})
            
            # Combine all available text
            all_text = []
            for section in [basic_info, project_details]:
                if isinstance(section, dict):
                    for value in section.values():
                        if isinstance(value, str) and value.strip():
                            all_text.append(value.strip())
            
            project_summary = " ".join(all_text)
        
        # Get similar projects for context using enhanced model
        similar_projects = get_similar_projects_enhanced(project_summary, top_k=5)
        
        # Perform cost estimation using enhanced model and LLM
        enhanced_result = enhanced_ml_cost_estimate(project_summary, target_year=2025)
        ml_cost_value = enhanced_result.get('predicted_cost', 500.0)
        
        # LLM estimation
        chunks = chunk_text(project_summary)
        if not chunks:
            chunks = [project_summary]
            
        llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)
        llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)
        
        # Compare with extracted Form-I costs
        extracted_total = cost_analysis["total_extracted"]
        has_form_costs = cost_analysis["has_valid_data"]
        
        # Calculate final recommendation
        if has_form_costs and extracted_total > 0:
            # Use weighted average of all three estimates
            final_estimate = int((0.4 * ml_cost_value) + (0.3 * llm_cost) + (0.3 * extracted_total))
            confidence_note = "Based on Form-I data, ML model, and LLM analysis"
        else:
            # Fall back to ML + LLM only
            final_estimate = int((0.6 * ml_cost_value) + (0.4 * llm_cost))
            confidence_note = "Based on ML model and LLM analysis (Form-I cost data incomplete)"
        
        # Calculate validation metrics
        if has_form_costs:
            form_diff = abs(final_estimate - extracted_total) / (extracted_total + 1)
        else:
            form_diff = 0
            
        ml_diff = abs(final_estimate - ml_cost_value) / (ml_cost_value + 1)
        llm_diff = abs(final_estimate - llm_cost) / (llm_cost + 1)
        
        avg_diff = (ml_diff + llm_diff + form_diff) / (3 if has_form_costs else 2)
        
        validation_status = (
            "high_confidence" if avg_diff <= 0.15 else
            "medium_confidence" if avg_diff <= 0.30 else
            "low_confidence"
        )
        
        # Generate final breakdown (prefer LLM breakdown, adjust if Form-I data available)
        if has_form_costs and cost_analysis["extracted_costs"]:
            # Blend LLM breakdown with Form-I extracted costs
            final_breakdown = {}
            for category in llm_breakdown:
                form_value = cost_analysis["extracted_costs"].get(category, 0)
                llm_value = llm_breakdown.get(category, 0)
                if form_value > 0:
                    # Use weighted average favoring Form-I actual data
                    final_breakdown[category] = int((0.7 * form_value) + (0.3 * llm_value))
                else:
                    final_breakdown[category] = llm_value
        else:
            final_breakdown = llm_breakdown
        
        # Ensure breakdown sums to final estimate
        breakdown_sum = sum(final_breakdown.values())
        if breakdown_sum != final_estimate and breakdown_sum > 0:
            # Proportionally adjust
            ratio = final_estimate / breakdown_sum
            final_breakdown = {k: int(v * ratio) for k, v in final_breakdown.items()}
        
        # Assessment comment
        breakdown_assessment = assess_breakdown(final_breakdown, final_estimate)
        
        # Calculate score
        score_pct = int(round(max(0.0, min(1.0, 1.0 - avg_diff)) * 100))
        
        # Generate usage comment
        usage_comment = call_gemini_usage_comment(
            final_estimate, llm_cost, ml_cost_value, final_breakdown, validation_status
        )
        
        return {
            "success": True,
            "cost_estimation": {
                "government_budget_lakhs": final_estimate,
                "score_pct": score_pct,
                "confidence_level": validation_status,
                "breakdown": final_breakdown,
                "comment": usage_comment
            },
            "estimation_details": {
                "ml_predicted_cost": round(ml_cost_value, 2),
                "llm_predicted_cost": round(llm_cost, 2),
                "form_extracted_cost": extracted_total if has_form_costs else None,
                "confidence_note": confidence_note,
                "breakdown_assessment": breakdown_assessment,
                "similar_projects_count": len(similar_projects)
            },
            "form_cost_analysis": cost_analysis,
            "project_summary_length": len(project_summary)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {str(e)}"
        }


# API Routes - only define if FastAPI is available
if router and UploadFile and File:
    @router.post("/extract-form1-and-estimate")
    async def extract_form1_and_estimate(file):  # Remove type annotation to avoid None reference
        """
        Extract Form-I data and provide cost estimation in a single endpoint.
        This is a simplified version that works with the existing text extraction.
        """
        try:
            file_bytes = await file.read()
        except Exception as e:
            return {"success": False, "error": f"Could not read uploaded file: {str(e)}"}

        # Validate file metadata
        if not getattr(file, "filename", None):
            return {"success": False, "error": "No filename provided"}
        ext = file.filename.lower().split(".")[-1]
        if ext not in ["pdf", "docx", "txt"]:
            return {"success": False, "error": "Unsupported file format. Only PDF, DOCX, and TXT files are allowed."}

        try:
            # Extract text using existing function
            extracted_text = extract_text(file.filename, file_bytes)
            if not extracted_text or not extracted_text.strip():
                return {"success": False, "error": "No text content could be extracted from the file"}

            # Create a basic Form-I structure for cost analysis
            # Note: This is simplified. For full Form-I extraction, use the /extract-form1 endpoint first
            basic_form_data = {
                "form_type": "FORM-I S&T Grant Proposal",
                "basic_information": {
                    "project_title": "Extracted from document",
                    "principal_implementing_agency": None,
                    "project_leader_name": "",
                    "sub_implementing_agency": "",
                    "co_investigator_name": None,
                    "contact_email": None,
                    "contact_phone": None,
                    "submission_date": "",
                    "project_duration": None
                },
                "project_details": {
                    "definition_of_issue": "",
                    "objectives": extracted_text[:1000] if len(extracted_text) > 1000 else extracted_text,
                    "justification_subject_area": "",
                    "project_benefits": "",
                    "work_plan": "",
                    "methodology": "",
                    "organization_of_work": "",
                    "time_schedule": "",
                    "foreign_exchange_details": ""
                },
                "cost_breakdown": {
                    "capital_expenditure": {
                        "land_building": {"total": None, "year1": "0", "year2": "0", "year3": "0", "justification": None},
                        "equipment": {"total": None, "year1": "0", "year2": "0", "year3": "0", "justification": None}
                    },
                    "revenue_expenditure": {
                        "salaries": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                        "consumables": {"total": None, "year1": "0", "year2": "0", "year3": "0", "notes": None},
                        "travel": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                        "workshop_seminar": {"total": None, "year1": "0", "year2": "0", "year3": "0"}
                    },
                    "total_project_cost": {"total": None, "year1": "0", "year2": "0", "year3": "0"},
                    "fund_phasing": None
                },
                "additional_information": {
                    "cv_details": None,
                    "past_experience": None,
                    "other_details": None
                }
            }

            # Use the text directly for cost estimation
            similar_projects = get_similar_projects_enhanced(extracted_text, top_k=5)

            # Enhanced ML and LLM cost estimation
            enhanced_result = enhanced_ml_cost_estimate(extracted_text, target_year=2025)
            ml_cost_value = enhanced_result.get('predicted_cost', 500.0)

            chunks = chunk_text(extracted_text)
            if not chunks:
                chunks = [extracted_text]

            llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)
            llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)

            # Final estimate (no Form-I costs available in this simplified version)
            final_estimate = int((0.6 * ml_cost_value) + (0.4 * llm_cost))

            # Calculate validation metrics
            ml_diff = abs(final_estimate - ml_cost_value) / (ml_cost_value + 1)
            llm_diff = abs(final_estimate - llm_cost) / (llm_cost + 1)
            avg_diff = (ml_diff + llm_diff) / 2

            validation_status = (
                "high_confidence" if avg_diff <= 0.15 else
                "medium_confidence" if avg_diff <= 0.30 else
                "low_confidence"
            )

            # Assessment and scoring
            breakdown_assessment = assess_breakdown(llm_breakdown, final_estimate)
            score_pct = int(round(max(0.0, min(1.0, 1.0 - avg_diff)) * 100))
            usage_comment = call_gemini_usage_comment(
                final_estimate, llm_cost, ml_cost_value, llm_breakdown, validation_status
            )

            return {
                "success": True,
                "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
                "form_data_basic": basic_form_data,
                "cost_estimation": {
                    "government_budget_lakhs": final_estimate,
                    "score_pct": score_pct,
                    "confidence_level": validation_status,
                    "breakdown": llm_breakdown,
                    "comment": usage_comment
                },
                "estimation_details": {
                    "ml_predicted_cost": round(ml_cost_value, 2),
                    "llm_predicted_cost": round(llm_cost, 2),
                    "form_extracted_cost": None,
                    "confidence_note": "Based on ML model and LLM analysis (use /extract-form1 first for detailed Form-I extraction)",
                    "breakdown_assessment": breakdown_assessment,
                    "similar_projects_count": len(similar_projects),
                    "text_length": len(extracted_text)
                },
                "note": "This is a simplified extraction. For full Form-I parsing, use /extract-form1 endpoint first, then /estimate-from-form1-data"
            }

        except Exception as e:
            return {"success": False, "error": f"Processing error: {str(e)}"}
        
        



if router and UploadFile and File:
    @router.post("/process-and-estimate")  
    async def process_and_estimate(file):  # Remove type annotation to avoid None reference
        """
        Complete processing and estimation endpoint
        """
        try:
            file_bytes = await file.read()
            text = extract_text(file.filename, file_bytes)

            if len(text) < 30:
                return {"error": "Unable to extract meaningful text"}

            # --- Retrieve Similar Past Projects using Enhanced Model ---
            similar_projects = get_similar_projects_enhanced(text, top_k=5)

            # --- LLM COST ESTIMATION ---
            chunks = chunk_text(text)
            if not chunks:
                chunks = [text]

            llm_chunk_results = estimate_cost_from_chunks(chunks, similar_projects)

            llm_cost, llm_conf, llm_breakdown = aggregate_llm_cost(llm_chunk_results)

            # --- ENHANCED ML MODEL PREDICTION ---
            enhanced_result = enhanced_ml_cost_estimate(text, target_year=2025)
            ml_cost_value = enhanced_result.get('predicted_cost', 500.0)

            diff_ratio = abs(llm_cost - ml_cost_value) / (ml_cost_value + 1)

            validation_status = (
                "valid" if diff_ratio <= 0.20 else
                "warning" if diff_ratio <= 0.40 else
                "invalid"
            )

            final_score = int((0.6 * ml_cost_value) + (0.4 * llm_cost))

            # --- SAVE TO SUPABASE ---
            save_record = {
                "filename": file.filename,
                "final_cost": final_score,
                "ml_cost": ml_cost_value,
                "llm_cost": llm_cost,
                "validation_status": validation_status,
                "difference_ratio": diff_ratio,
                "breakdown": llm_breakdown,
                "confidence": llm_conf,
                "raw_text": text[:20000],
                "created_at": datetime.utcnow().isoformat()
            }

            if supabase:
                try:
                    supabase.table("final_cost_estimations").insert(save_record).execute()
                except Exception as e:
                    print("Supabase Insert Error:", e)

            # compute score from difference ratio (smaller difference => higher score)
            score_pct = int(round(max(0.0, min(1.0, 1.0 - diff_ratio)) * 100))

            # ask Gemini to produce a comment about the cost estimation
            if genai:
                gemini_comment = call_gemini_usage_comment(final_score, llm_cost, ml_cost_value, llm_breakdown, validation_status)
            else:
                gemini_comment = f"Cost estimation based on ML model and LLM analysis. Validation status: {validation_status}"

            return {
                "government_budget_lakhs": int(final_score),
                "score_pct": score_pct,
                "comment": gemini_comment
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Processing error: {str(e)}"
            }
else:
    print("Warning: API routes not available - missing FastAPI dependencies")
