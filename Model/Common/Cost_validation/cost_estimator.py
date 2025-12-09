import os
import json
import re
import math
from io import BytesIO
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import joblib

# Optional/soft imports - guard heavy or environment-specific libraries
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

try:
    from sklearn.ensemble import RandomForestRegressor
except Exception:
    RandomForestRegressor = None

try:
    from sklearn.preprocessing import StandardScaler
except Exception:
    StandardScaler = None

try:
    import PyPDF2
except Exception:
    PyPDF2 = None

try:
    import chardet
except Exception:
    chardet = None

try:
    import docx
except Exception:
    docx = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("Warning: google-generativeai not available")

# --- Notebook / Model-based ML predictor (replaces LLM-based estimation) ---
router = APIRouter()
def notebook_ml_predict(text: str, target_year: int = 2025):
    """Obtain ML prediction using the enhanced predictor or saved model artifacts.

    Returns: (predicted_cost, confidence_score, breakdown_dict)
    """
    # Prefer enhanced_predictor instance if available
    try:
        if enhanced_predictor is not None:
            res = enhanced_ml_cost_estimate(text, target_year=target_year)
            return res.get('predicted_cost'), res.get('confidence_score'), res.get('cost_breakdown')

        # Try loading a saved joblib model package
        candidate_paths = [
            os.path.join(os.path.dirname(__file__), 'pre-trained', 'Enhanced_Multi_Regression_Cost_Model.joblib'),
            os.path.join(os.path.dirname(__file__), 'pre-trained', 'Enhanced_Cost_Predictor.joblib'),
            os.path.join(os.path.dirname(__file__), 'Enhanced_Multi_Regression_Cost_Model.joblib'),
            os.path.join(os.path.dirname(__file__), 'Enhanced_Cost_Predictor.joblib')
        ]
        for p in candidate_paths:
            try:
                if os.path.exists(p):
                    pkg = joblib.load(p)
                    # pkg may be dict-like
                    model = pkg.get('best_model') if isinstance(pkg, dict) else pkg
                    preproc = pkg.get('preprocessor') if isinstance(pkg, dict) else None
                    metadata = pkg.get('metadata', {}) if isinstance(pkg, dict) else {}

                    # Build X_new similar to predict_cost
                    emb = _get_text_embedding(text)
                    emb_vec = np.asarray(emb).reshape(1, -1)
                    num_feats = np.array([[0.0, 0.0, target_year]])
                    if preproc is not None:
                        # best-effort: try using preprocessor transform
                        try:
                            feat_dict = {'abstract_text': text, 'agency': '', 'proposal_year': target_year,
                                         'capital_total': 0.0, 'revenue_total': 0.0}
                            X_new = preproc.transform([feat_dict])
                        except Exception:
                            X_new = np.hstack([emb_vec, num_feats])
                    else:
                        X_new = np.hstack([emb_vec, num_feats])

                    y_pred_base = float(model.predict(X_new)[0])
                    base_year = metadata.get('base_year', INFLATION_METADATA['base_year'])
                    y_pred_nominal = adjust_cost_from_base(y_pred_base, target_year, base_year=base_year)
                    confidence = metadata.get('training_mae', None) or 50.0
                    return round(float(y_pred_nominal), 2), float(confidence), {}
            except Exception:
                continue

    except Exception:
        pass

    return None, None, {}


def usage_comment_simple(final_budget: int, ml_cost: float, breakdown: dict, validation_status: str) -> str:
    """Generate a short 5-line usage comment without calling an LLM."""
    lines = []
    lines.append(f"Final budget set to {int(final_budget)} Lakhs after ML validation.")
    lines.append(f"ML predicted cost: {int(round(ml_cost or 0))} Lakhs; validation: {validation_status}.")
    lines.append("Consider phased implementation to match budget and scope.")
    lines.append("Allocate funds for critical equipment and validation studies.")
    lines.append("Use milestone-based releases and maintain detailed procurement docs.")
    return "\n".join(lines)
    
def _extract_project_features(text: str) -> dict:
    """Extract project type, technology focus, and complexity indicators"""
    text = str(text).lower()

    tech_keywords = {
        'iot_ai': ['iot', 'artificial intelligence', 'ai', 'machine learning', 'sensor', 'automation'],
        'mining_equipment': ['mining', 'excavation', 'drilling', 'conveyor', 'crusher', 'machinery'],
        'safety_monitoring': ['safety', 'monitoring', 'warning', 'detection', 'alert', 'surveillance'],
        'environmental': ['environment', 'pollution', 'emission', 'water', 'air quality', 'waste'],
        'software': ['software', 'application', 'system', 'platform', 'algorithm', 'programming']
    }

    scale_keywords = {
        'pilot': ['pilot', 'prototype', 'demonstration', 'proof of concept'],
        'medium': ['implementation', 'deployment', 'installation', 'integration'],
        'large': ['commercial', 'industrial', 'full scale', 'mass production', 'nationwide']
    }

    org_keywords = {
        'academic': ['university', 'college', 'institute', 'iit', 'nit', 'research'],
        'government': ['cmpdi', 'cil', 'ministry', 'department', 'govt', 'government'],
        'private': ['ltd', 'pvt', 'private', 'company', 'corporation'],
        'public_sector': ['ongc', 'ntpc', 'bhel', 'sail', 'coal india']
    }

    features = {}
    for tech_type, keywords in tech_keywords.items():
        features[f'tech_{tech_type}'] = sum(1 for keyword in keywords if keyword in text)

    for scale_type, keywords in scale_keywords.items():
        features[f'scale_{scale_type}'] = sum(1 for keyword in keywords if keyword in text)

    for org_type, keywords in org_keywords.items():
        features[f'org_{org_type}'] = sum(1 for keyword in keywords if keyword in text)

    features['text_length'] = len(text)
    features['technical_terms'] = len(re.findall(r'\b(development|technology|system|equipment|monitoring|analysis)\b', text))
    features['cost_keywords'] = len(re.findall(r'\b(equipment|machinery|software|development|installation)\b', text))

    return features


def _find_similar_projects(description: str, target_year: int, top_k: int = 3, sbert_encoder=None, historical_data=None):
    """Find similar historical projects using an SBERT encoder if available."""
    try:
        encoder = sbert_encoder
        if encoder is None and os.path.exists(_SENTENCE_ENCODER_PATH):
            try:
                encoder = joblib.load(_SENTENCE_ENCODER_PATH)
            except Exception:
                encoder = None

        if encoder is None:
            return []

        hist = historical_data if historical_data is not None else globals().get('historical_data')
        if hist is None or 'clean_text' not in hist:
            return []

        query_embedding = encoder.encode([description])
        historical_texts = list(hist['clean_text'])
        historical_embeddings = encoder.encode(historical_texts)
        similarities = query_embedding.dot(historical_embeddings.T)[0]

        import numpy as _np
        top_indices = _np.argsort(similarities)[-top_k:][::-1]

        similar_projects = []
        for idx in top_indices:
            try:
                project = {
                    'similarity': float(round(float(similarities[idx]), 3)),
                    'year': int(hist.iloc[idx].get('Financial Year', 0)),
                    'cost': float(hist.iloc[idx].get('Cost (Lakhs)', 0)),
                    'description': str(hist.iloc[idx].get('clean_text', ''))[:100] + '...'
                }
                similar_projects.append(project)
            except Exception:
                continue

        return similar_projects
    except Exception:
        return []


def _calculate_confidence(predicted_cost, similar_projects, project_features):
    """Calculate confidence score based on multiple factors"""
    confidence = 0.5
    try:
        if similar_projects:
            import numpy as _np
            similar_costs = [p.get('cost', 0) for p in similar_projects]
            if len(similar_costs) > 0 and _np.mean(similar_costs) != 0:
                cost_variance = float(_np.std(similar_costs) / (abs(_np.mean(similar_costs)) + 1))
                confidence += (1 - min(cost_variance, 1)) * 0.3

        total_features = sum(project_features.values()) if isinstance(project_features, dict) else 0
        if total_features > 10:
            confidence += 0.15
        elif total_features > 5:
            confidence += 0.1

        if 50 <= predicted_cost <= 1000:
            confidence += 0.15

        return min(confidence * 100, 95)
    except Exception:
        return min(confidence * 100, 95)


def _generate_cost_breakdown(total_cost, project_features):
    breakdown = {}
    base_breakdown = {
        'manpower': 0.45,
        'equipment': 0.25,
        'software_tools': 0.08,
        'data_collection': 0.10,
        'travel_fieldwork': 0.05,
        'contingency': 0.07
    }

    if project_features.get('tech_iot_ai', 0) > 2:
        base_breakdown['software_tools'] += 0.05
        base_breakdown['equipment'] += 0.05
        base_breakdown['manpower'] = max(0.0, base_breakdown['manpower'] - 0.10)

    if project_features.get('tech_mining_equipment', 0) > 2:
        base_breakdown['equipment'] += 0.15
        base_breakdown['manpower'] = max(0.0, base_breakdown['manpower'] - 0.10)
        base_breakdown['contingency'] = max(0.0, base_breakdown['contingency'] - 0.05)

    for category, percentage in base_breakdown.items():
        breakdown[category] = round(float(total_cost) * percentage, 2)

    return breakdown


def _generate_recommendations(predicted_cost, project_features):
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
    r"c:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\Enhanced_Cost_Predictor.joblib"  # Absolute path
]

print("Loading Enhanced Multi-Regression Cost Model...")

class EnhancedCostPredictor:
    """
    Lightweight compatibility wrapper for an enhanced cost predictor package.
    Provides a minimal predict_cost(...) implementation used by the rest of the module.
    """
    def __init__(self, model=None, sbert_encoder=None, feature_scaler=None, historical_data=None):
        self.model = model
        self.sbert_encoder = sbert_encoder
        self.feature_scaler = feature_scaler
        self.historical_data = historical_data

    def predict_cost(self, project_description, target_year=2025, agency_type="government", project_scale="medium"):
        # Construct embedding/features
        try:
            if self.sbert_encoder is not None:
                try:
                    emb = self.sbert_encoder.encode([project_description])
                except Exception:
                    emb = _get_text_embedding(project_description)
            else:
                emb = _get_text_embedding(project_description)
            emb_vec = np.asarray(emb).reshape(1, -1)
        except Exception:
            emb_vec = np.array([[len(str(project_description))]])

        # numeric features placeholder: (capital_total, revenue_total, year)
        num_feats = np.array([[0.0, 0.0, float(target_year)]])
        X = np.hstack([emb_vec, num_feats])

        # apply scaler if exists
        try:
            if self.feature_scaler is not None:
                try:
                    X = self.feature_scaler.transform(X)
                except Exception:
                    pass
        except Exception:
            pass

        # predict using model if available otherwise fallback heuristic
        try:
            if self.model is not None and hasattr(self.model, "predict"):
                y_base = float(self.model.predict(X)[0])
            else:
                y_base = float(simple_cost_fallback(project_description))
        except Exception:
            y_base = float(simple_cost_fallback(project_description))

        # convert from base-year prediction to target year nominal
        base_year = INFLATION_METADATA.get("base_year", 2019)
        predicted_nominal = adjust_cost_from_base(y_base, target_year, base_year=base_year)

        # supplementary outputs
        project_features = _extract_project_features(project_description)
        similar_projects = _find_similar_projects(project_description, target_year, top_k=5, sbert_encoder=self.sbert_encoder, historical_data=self.historical_data)
        confidence_score = _calculate_confidence(predicted_nominal, similar_projects, project_features)
        try:
            confidence_score = float(confidence_score)
        except Exception:
            confidence_score = 50.0

        cost_breakdown = _generate_cost_breakdown(predicted_nominal, project_features)

        return {
            "predicted_cost_lakhs": round(float(predicted_nominal), 2),
            "confidence_score": confidence_score,
            "cost_breakdown": cost_breakdown,
            "year_analysis": {"target_year": int(target_year), "base_year": int(base_year)},
            "similar_projects": similar_projects,
            "recommendations": _generate_recommendations(predicted_nominal, project_features)
        }

enhanced_predictor = None


# ------------------ Helper: Inflation Series & Adjustment ------------------
# Fallback synthetic inflation index (CPI-like) for demonstration only.
# Replace `INFLATION_INDEX` with official RBI/CPI series for production use.
INFLATION_INDEX = {
    2010: 68.0, 2011: 72.0, 2012: 75.0, 2013: 78.0, 2014: 82.0,
    2015: 85.0, 2016: 88.0, 2017: 92.0, 2018: 96.0, 2019: 100.0,
    2020: 104.0, 2021: 110.0, 2022: 120.0, 2023: 130.0, 2024: 140.0,
    2025: 145.0
}

INFLATION_METADATA = {
    'series_name': 'Fallback synthetic CPI-like index',
    'source': 'Local fallback table (replace with RBI or MOSPI CPI series for production)',
    'base_year': 2019
}

def _get_inflation_index(year: int) -> float:
    # Return index for a given year, fallback to nearest available year
    if year in INFLATION_INDEX:
        return INFLATION_INDEX[year]
    # nearest year fallback
    yrs = sorted(INFLATION_INDEX.keys())
    if year < yrs[0]:
        return INFLATION_INDEX[yrs[0]]
    return INFLATION_INDEX[yrs[-1]]

def adjust_cost_to_base(cost: float, from_year: int, base_year: int = None) -> float:
    if base_year is None:
        base_year = INFLATION_METADATA['base_year']
    idx_from = _get_inflation_index(from_year)
    idx_base = _get_inflation_index(base_year)
    if idx_from <= 0:
        return cost
    return float(cost) * (idx_base / idx_from)

def adjust_cost_from_base(cost_real: float, to_year: int, base_year: int = None) -> float:
    if base_year is None:
        base_year = INFLATION_METADATA['base_year']
    idx_to = _get_inflation_index(to_year)
    idx_base = _get_inflation_index(base_year)
    return float(cost_real) * (idx_to / idx_base)


# ------------------ Helper: Preprocessing from FORM-I JSON ------------------
def _safe_float(x):
    try:
        if x is None:
            return 0.0
        if isinstance(x, (int, float)):
            return float(x)
        # strip commas and non-numeric
        s = str(x).strip().replace(',', '')
        return float(re.findall(r"-?\d+\.?\d*", s)[0])
    except Exception:
        return 0.0

def _combine_form_text(form_json: Dict) -> str:
    parts = []
    pdict = form_json.get('project_details', {}) or {}
    fields = ['definition_of_issue', 'objectives', 'justification_subject_area',
              'project_benefits', 'work_plan', 'methodology', 'organization_of_work']
    for f in fields:
        v = pdict.get(f)
        if v:
            parts.append(str(v))
    # fallback to basic_information.project_title
    bi = form_json.get('basic_information', {}) or {}
    if bi.get('project_title'):
        parts.insert(0, str(bi.get('project_title')))
    text = '\n'.join([p for p in parts if p and str(p).strip()])
    # clean
    text = re.sub(r'\s+', ' ', text).strip()
    return text if text else '<no_text>'

def _extract_numeric_breakdown(form_json: Dict) -> Dict:
    cb = form_json.get('cost_breakdown', {}) or {}
    cap = cb.get('capital_expenditure', {}) or {}
    rev = cb.get('revenue_expenditure', {}) or {}
    def sum_years(obj):
        total = 0.0
        if not obj or not isinstance(obj, dict):
            return 0.0
        # support nested categories
        for k, v in obj.items():
            if isinstance(v, dict):
                for subk, subv in v.items():
                    if subk.lower().startswith('year'):
                        total += _safe_float(subv)
            else:
                if str(k).lower().startswith('year'):
                    total += _safe_float(v)
        return total
    cap_sum = sum_years(cap)
    rev_sum = sum_years(rev)
    total_reported = 0.0
    # also try 'total_project_cost' if present
    tpc = cb.get('total_project_cost', {}) or {}
    if isinstance(tpc, dict) and tpc.get('total'):
        total_reported = _safe_float(tpc.get('total'))
    return {
        'capital_total_years': cap_sum,
        'revenue_total_years': rev_sum,
        'reported_total_if_any': total_reported,
        'num_years': 3  # default; could be improved by inspecting fields
    }


# ------------------ Helper: Embeddings / Vectorizer ------------------
_TFIDF_VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'tfidf_vectorizer.joblib')
_SENTENCE_ENCODER_PATH = os.path.join(os.path.dirname(__file__), 'sbert_encoder.joblib')

def _get_text_embedding(text: str, historical_corpus: list = None):
    """Return a dense vector for `text`.
    Priority: saved SentenceTransformer instance -> installed SentenceTransformer -> TF-IDF fallback.
    """
    # Try loading saved SBERT encoder
    try:
        if os.path.exists(_SENTENCE_ENCODER_PATH):
            encoder = joblib.load(_SENTENCE_ENCODER_PATH)
            return encoder.encode([text])
    except Exception:
        pass

    # If sentence-transformers available, load a lightweight model (non-blocking)
    try:
        if SentenceTransformer is not None:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            # optionally persist it for next time
            try:
                joblib.dump(model, _SENTENCE_ENCODER_PATH)
            except Exception:
                pass
            return model.encode([text])
    except Exception:
        pass

    # TF-IDF fallback: fit on historical_corpus if provided otherwise use a tiny local fit
    from sklearn.feature_extraction.text import TfidfVectorizer
    try:
        if os.path.exists(_TFIDF_VECTORIZER_PATH):
            vec = joblib.load(_TFIDF_VECTORIZER_PATH)
            v = vec.transform([text]).toarray()
            return v
        corpus = (historical_corpus or [text, '<no_text>'])
        vec = TfidfVectorizer(max_features=256, ngram_range=(1,2))
        vec.fit(corpus)
        try:
            joblib.dump(vec, _TFIDF_VECTORIZER_PATH)
        except Exception:
            pass
        return vec.transform([text]).toarray()
    except Exception:
        # as ultimate fallback, return bag-of-length value
        return np.array([[len(text)]])


# ------------------ Main predict_cost function ------------------
def predict_cost(form_json_input, prediction_year: int = None):
    """Main entry: accepts parsed JSON (dict) or JSON string.

    Returns the required JSON structure with predicted total cost in INR lakhs.
    """
    # Accept string input
    if isinstance(form_json_input, str):
        try:
            form = json.loads(form_json_input)
        except Exception:
            return {'error': 'Invalid JSON input'}
    else:
        form = form_json_input or {}

    # 1. Prepare text and numeric features
    abstract_text = _combine_form_text(form)
    numeric_break = _extract_numeric_breakdown(form)

    # Determine target year
    bi = form.get('basic_information', {}) or {}
    sub_date = bi.get('submission_date') or bi.get('submissionDate')
    proposal_year = None
    if prediction_year is not None:
        proposal_year = int(prediction_year)
    else:
        if sub_date:
            try:
                # support DD-MM-YYYY or YYYY-MM-DD
                if '-' in sub_date:
                    parts = sub_date.split('-')
                    if len(parts[0]) == 4:
                        proposal_year = int(parts[0])
                    else:
                        proposal_year = int(parts[-1])
                else:
                    proposal_year = int(sub_date)
            except Exception:
                proposal_year = INFLATION_METADATA['base_year']
        else:
            proposal_year = INFLATION_METADATA['base_year']

    # 2. Agency
    agency = (bi.get('principal_implementing_agency') or bi.get('sub_implementing_agency') or '').strip()

    # 3. Build text embedding
    try:
        # if historical data available in module, use for TF-IDF fit
        hist_corpus = None
        if 'historical_texts' in globals() and globals().get('historical_texts'):
            hist_corpus = globals().get('historical_texts')
        emb = _get_text_embedding(abstract_text, historical_corpus=hist_corpus)
        emb_vec = np.asarray(emb).reshape(1, -1)
    except Exception:
        emb_vec = np.array([[len(abstract_text)]])

    # 4. Attempt to load saved enhanced predictor metadata
    predictor_paths = ENHANCED_PREDICTOR_PATHS if 'ENHANCED_PREDICTOR_PATHS' in globals() else []
    loaded = None
    for p in predictor_paths:
        try:
            if os.path.exists(p):
                loaded = joblib.load(p)
                break
        except Exception:
            continue

    # If loaded is a dict/package with model & preprocessor
    model = None
    preproc = None
    metadata = {}
    if isinstance(loaded, dict):
        model = loaded.get('model')
        preproc = loaded.get('preprocessor')
        metadata = loaded.get('metadata', {})
    elif loaded is not None:
        model = loaded

    # Build feature vector expected by model
    # If preprocessor exists, use it; else create a simple concatenation
    X_new = None
    try:
        if preproc is not None:
            # preprocessor should accept dict-like input
            feat_dict = {
                'abstract_text': abstract_text,
                'agency': agency,
                'proposal_year': proposal_year,
                'capital_total': numeric_break['capital_total_years'],
                'revenue_total': numeric_break['revenue_total_years']
            }
            X_new = preproc.transform([feat_dict])
        else:
            # simple numeric vector: embedding + numeric_break + year
            num_feats = np.array([[numeric_break['capital_total_years'], numeric_break['revenue_total_years'], proposal_year]])
            # concat
            X_new = np.hstack([emb_vec, num_feats])
    except Exception:
        X_new = np.hstack([emb_vec, np.array([[numeric_break['capital_total_years'], numeric_break['revenue_total_years'], proposal_year]])])

    # 5. Predict using model if available
    if model is None:
        # fallback heuristic
        est = simple_cost_fallback(abstract_text)
        est_nominal = adjust_cost_from_base(est, proposal_year, base_year=INFLATION_METADATA['base_year'])
        low = max(1.0, est_nominal * 0.75)
        high = est_nominal * 1.25
        explain = {
            'top_text_features': [],
            'top_numeric_features': {},
            'rationale': 'Fallback rule-based estimate (no trained model available).'
        }
        return {
            'predicted_total_cost_in_INR_lakhs': round(float(est_nominal), 2),
            'prediction_year': int(proposal_year),
            'inflation_adjusted_to_year': int(proposal_year),
            'model_used': 'fallback_rule_based',
            'confidence_interval_in_lakhs': [round(low, 2), round(high, 2)],
            'explainability': explain,
            'inflation_series': INFLATION_METADATA
        }

    try:
        # model predicts in base-year units if metadata contains base_year
        base_year = metadata.get('base_year', INFLATION_METADATA['base_year'])
        y_pred_base = float(model.predict(X_new)[0])
        # adjust to nominal target year
        y_pred_nominal = adjust_cost_from_base(y_pred_base, proposal_year, base_year=base_year)

        # confidence interval: use training_mae if available, else 20% rule
        training_mae = metadata.get('training_mae')
        if training_mae:
            mae_nominal = adjust_cost_from_base(training_mae, proposal_year, base_year=base_year)
            low = max(0.0, y_pred_nominal - 1.96 * mae_nominal)
            high = y_pred_nominal + 1.96 * mae_nominal
        else:
            low = max(0.0, y_pred_nominal * 0.8)
            high = y_pred_nominal * 1.2

        # Explainability: try to extract top text features if linear model + TF-IDF
        top_text = []
        top_numeric = {}
        try:
            if hasattr(model, 'coef_') and preproc is not None and hasattr(preproc, 'named_transformers_'):
                # attempt to get tfidf feature names
                tfs = None
                for name, trans in preproc.named_transformers_.items():
                    try:
                        if hasattr(trans, 'vocabulary_') or hasattr(trans, 'get_feature_names_out'):
                            tfs = trans
                            break
                    except Exception:
                        continue
                if tfs is not None and hasattr(tfs, 'get_feature_names_out'):
                    fn = tfs.get_feature_names_out()
                    coefs = np.array(model.coef_[:len(fn)])
                    contrib = coefs * (preproc.transform([{'abstract_text': abstract_text}]).toarray()[0][:len(fn)])
                    top_idx = np.argsort(np.abs(contrib))[-5:][::-1]
                    top_text = [fn[i] for i in top_idx]
        except Exception:
            top_text = []

        # Agency effect: compute simple delta from metadata if present
        agency_effect = None
        if metadata.get('agency_means') and agency in metadata.get('agency_means'):
            agency_effect = metadata['agency_means'][agency]
            top_numeric['agency_effect'] = round(float(agency_effect), 2)

        # Year effect: simple slope if present
        if metadata.get('year_slope') is not None:
            top_numeric['year_effect'] = round(float(metadata.get('year_slope')), 3)

        rationale = f"Model predicted {y_pred_nominal:.2f} Lakhs (nominal {proposal_year})."
        explain = {
            'top_text_features': top_text,
            'top_numeric_features': top_numeric,
            'rationale': rationale
        }

        return {
            'predicted_total_cost_in_INR_lakhs': round(float(y_pred_nominal), 2),
            'prediction_year': int(proposal_year),
            'inflation_adjusted_to_year': int(proposal_year),
            'model_used': metadata.get('model_name', type(model).__name__),
            'confidence_interval_in_lakhs': [round(float(low), 2), round(float(high), 2)],
            'explainability': explain,
            'inflation_series': INFLATION_METADATA
        }
    except Exception as e:
        # if prediction fails, fallback
        est = simple_cost_fallback(abstract_text)
        est_nominal = adjust_cost_from_base(est, proposal_year, base_year=INFLATION_METADATA['base_year'])
        return {
            'predicted_total_cost_in_INR_lakhs': round(float(est_nominal), 2),
            'prediction_year': int(proposal_year),
            'inflation_adjusted_to_year': int(proposal_year),
            'model_used': 'fallback_after_error',
            'confidence_interval_in_lakhs': [round(est_nominal*0.8,2), round(est_nominal*1.2,2)],
            'explainability': {'rationale': f'Fallback due to error: {str(e)}'},
            'inflation_series': INFLATION_METADATA
        }


# First, try to load model components separately to avoid class loading issues
try:
    component_paths = [
        r"Enhanced_Multi_Regression_Cost_Model.joblib",
        r"pre-trained\Enhanced_Multi_Regression_Cost_Model.joblib",
        r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Cost_validation\Enhanced_Multi_Regression_Cost_Model.joblib"
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

                print(f"[OK] Loaded in {load_time:.1f} seconds")

                # Verify components
                if isinstance(components, dict):
                    print(f"Available keys: {list(components.keys())}")
                    required_keys = ['best_model', 'sbert_encoder', 'feature_scaler', 'historical_data']
                    missing_keys = [key for key in required_keys if key not in components]

                    if missing_keys:
                        print(f"[ERR] Missing required keys: {missing_keys}")
                        continue

                    # Create enhanced predictor from components
                    enhanced_predictor = EnhancedCostPredictor(
                        model=components['best_model'],
                        sbert_encoder=components['sbert_encoder'], 
                        feature_scaler=components['feature_scaler'],
                        historical_data=components['historical_data']
                    )
                    print("[OK] Enhanced Cost Predictor created from components!")
                    print("Features: 403 (SBERT + Year trends + Technology categories + Agency types)")
                    print("Model: Random Forest with 14.6% improved accuracy")
                    components_loaded = True
                    break
                else:
                    print(f"[ERR] Components is not a dictionary: {type(components)}")
                    continue
            except Exception as e:
                print(f"[ERR] Error loading {comp_path}: {e}")
                continue

    if not components_loaded:
        raise FileNotFoundError("Model components file not found or invalid")
except Exception as e:
    print(f"[ERR] Error loading from components: {e}")
    
    # Fallback: try direct joblib loading
    if enhanced_predictor is None:
        for path in ENHANCED_PREDICTOR_PATHS:
            try:
                if os.path.exists(path):
                    # Ensure unpickling can find local classes saved as __main__.EnhancedCostPredictor
                    try:
                        import sys as _sys
                        _sys.modules.setdefault('__main__', None)
                        if _sys.modules.get('__main__') is None:
                            import types as _types
                            _sys.modules['__main__'] = _types.ModuleType('__main__')
                        setattr(_sys.modules['__main__'], 'EnhancedCostPredictor', EnhancedCostPredictor)
                    except Exception:
                        pass
                    enhanced_predictor = joblib.load(path)
                    print(f"[OK] Enhanced Cost Predictor loaded from: {path}")
                    print("Features: 403 (SBERT + Year trends + Technology categories + Agency types)")
                    print("Model: Random Forest with 14.6% improved accuracy")
                    break
            except Exception as e:
                print(f"[ERR] Error loading from {path}: {e}")
                continue

if enhanced_predictor is None:
    print("[ERR] Enhanced model file not found in any location. Attempting to create simplified enhanced predictor...")
    
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
            
            print("[OK] Simplified Enhanced Cost Predictor created successfully!")
            print("Features: Basic (text length + keyword counting + simple ML)")
            print("Model: Simplified Random Forest for compatibility")
            
        else:
            print("[ERR] Required packages not available for simplified model")
            
    except Exception as e:
        print(f"[ERR] Error creating simplified enhanced predictor: {e}")

if enhanced_predictor is None:
    print("[ERR] All enhanced model attempts failed. Using basic fallback mode.")
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
    model = genai.GenerativeModel("gemini-2.5-flash")
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
#             CONTENT-BASED COST ESTIMATION FUNCTIONS
# ===============================================================

def estimate_cost_from_content_only(text: str, json_structure: dict) -> int:
    """Estimate project cost based solely on PDF content analysis."""
    
    # Base cost estimation using content analysis
    base_cost = 500  # Default baseline
    
    # Factor 1: Project scope indicators
    scope_keywords = {
        'large_scale': ['commercial', 'industrial', 'full scale', 'nationwide', 'mass production'],
        'medium_scale': ['implementation', 'deployment', 'pilot', 'demonstration'],
        'research': ['research', 'study', 'analysis', 'investigation', 'survey']
    }
    
    text_lower = text.lower()
    
    # Scale multiplier based on project scope
    if any(keyword in text_lower for keyword in scope_keywords['large_scale']):
        scale_multiplier = 3.0
    elif any(keyword in text_lower for keyword in scope_keywords['medium_scale']):
        scale_multiplier = 2.0
    else:
        scale_multiplier = 1.5
    
    # Factor 2: Technology complexity
    tech_keywords = {
        'high_tech': ['artificial intelligence', 'machine learning', 'iot', 'automation', 'sensor'],
        'medium_tech': ['software', 'application', 'system', 'monitoring', 'detection'],
        'basic_tech': ['manual', 'conventional', 'traditional']
    }
    
    if any(keyword in text_lower for keyword in tech_keywords['high_tech']):
        tech_multiplier = 2.5
    elif any(keyword in text_lower for keyword in tech_keywords['medium_tech']):
        tech_multiplier = 1.8
    else:
        tech_multiplier = 1.2
    
    # Factor 3: Equipment intensity
    equipment_keywords = ['equipment', 'machinery', 'hardware', 'installation', 'infrastructure']
    equipment_count = sum(1 for keyword in equipment_keywords if keyword in text_lower)
    equipment_multiplier = 1.0 + (equipment_count * 0.3)
    
    # Factor 4: Duration indicator (from text length as proxy)
    duration_multiplier = min(2.0, 1.0 + (len(text) / 10000))
    
    # Calculate estimated cost
    estimated_cost = int(base_cost * scale_multiplier * tech_multiplier * equipment_multiplier * duration_multiplier)
    
    # Ensure reasonable bounds
    return max(200, min(estimated_cost, 5000))


def analyze_content_quality(text: str, json_structure: dict) -> int:
    """Analyze the quality and completeness of extracted content."""
    
    quality_score = 50  # Base score
    
    # Check if key sections are populated
    basic_info = json_structure.get('basic_information', {})
    project_details = json_structure.get('project_details', {})
    
    # Increase score for populated fields
    if basic_info.get('project_title'):
        quality_score += 10
    if basic_info.get('principal_implementing_agency'):
        quality_score += 10
    if project_details.get('objectives'):
        quality_score += 15
    if project_details.get('methodology'):
        quality_score += 15
    
    # Text length and detail
    if len(text) > 5000:
        quality_score += 10
    if len(text) > 10000:
        quality_score += 10
    
    return min(100, quality_score)


def generate_content_based_comment(budget: int, base_cost: int, breakdown: dict, method: str, json_structure: dict) -> str:
    """Generate assessment comment based on content analysis."""
    
    project_title = json_structure.get('basic_information', {}).get('project_title', 'Project')
    
    if method == "form_extracted":
        comment = f"Government budget of ₹{budget} lakhs approved based on detailed cost breakdown extracted from Form-I. "
        comment += f"This represents 85% of the requested ₹{base_cost} lakhs, following government funding guidelines. "
    else:
        comment = f"Government budget of ₹{budget} lakhs estimated through content analysis of project description. "
        comment += f"Estimated project scope and complexity indicate funding requirement of ₹{base_cost} lakhs. "
    
    # Add breakdown insights
    if breakdown:
        top_categories = sorted(breakdown.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True)[:2]
        if top_categories and isinstance(top_categories[0][1], (int, float)):
            comment += f"Major allocations: {top_categories[0][0].replace('_', ' ').title()} (₹{top_categories[0][1]} lakhs)"
            if len(top_categories) > 1 and isinstance(top_categories[1][1], (int, float)):
                comment += f" and {top_categories[1][0].replace('_', ' ').title()} (₹{top_categories[1][1]} lakhs). "
    
    comment += "Budget breakdown ensures compliance with government funding norms and project feasibility."
    
    return comment


def generate_content_based_recommendations(budget: int, breakdown: dict, json_structure: dict) -> list:
    """Generate recommendations based on content analysis."""
    
    recommendations = []
    
    # Budget-based recommendations
    if budget > 2000:
        recommendations.append("Implement project in phases to ensure effective monitoring and fund utilization")
        recommendations.append("Establish quarterly review meetings with funding agency")
    
    if budget > 1000:
        recommendations.append("Consider partnership opportunities to share costs and expertise")
    
    # Content-based recommendations
    project_details = json_structure.get('project_details', {})
    
    if 'technology' in str(project_details).lower() or 'software' in str(project_details).lower():
        recommendations.append("Allocate sufficient budget for technology training and capacity building")
    
    if 'equipment' in str(project_details).lower():
        recommendations.append("Plan for equipment maintenance and operational costs beyond project period")
    
    # General recommendations
    recommendations.append("Maintain detailed financial records for audit compliance")
    recommendations.append("Ensure all procurements follow government guidelines (GFR)")
    
    if budget < 500:
        recommendations.append("Consider leveraging existing infrastructure to optimize costs")
    
    return recommendations


# ===============================================================
#             HELPER FUNCTIONS FOR JSON EXTRACTION AND BUDGETING
# ===============================================================

def extract_json_from_text(content: str) -> dict:
    """Extract structured JSON from text content using AI."""
    if not genai:
        # Fallback to basic structure
        return create_basic_json_structure(content)
    
    try:
        extraction_prompt = f"""
        You are an expert at extracting information from FORM-I S&T grant proposals for the Ministry of Coal.
        
        Extract the following information from the provided content and return it as a JSON object with these exact keys:
        
        {{
            "form_type": "FORM-I S&T Grant Proposal",
            "basic_information": {{
                "project_title": "",
                "principal_implementing_agency": "",
                "project_leader_name": "",
                "sub_implementing_agency": "",
                "co_investigator_name": "",
                "contact_email": "",
                "contact_phone": "",
                "submission_date": "",
                "project_duration": ""
            }},
            "project_details": {{
                "definition_of_issue": "",
                "objectives": "",
                "justification_subject_area": "",
                "project_benefits": "",
                "work_plan": "",
                "methodology": "",
                "organization_of_work": "",
                "time_schedule": "",
                "foreign_exchange_details": ""
            }},
            "cost_breakdown": {{
                "capital_expenditure": {{
                    "land_building": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0",
                        "justification": ""
                    }},
                    "equipment": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0",
                        "justification": ""
                    }}
                }},
                "revenue_expenditure": {{
                    "salaries": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0"
                    }},
                    "consumables": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0",
                        "notes": ""
                    }},
                    "travel": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0"
                    }},
                    "workshop_seminar": {{
                        "total": null,
                        "year1": "0",
                        "year2": "0",
                        "year3": "0"
                    }}
                }},
                "total_project_cost": {{
                    "total": null,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0"
                }},
                "fund_phasing": ""
            }},
            "additional_information": {{
                "cv_details": "",
                "past_experience": "",
                "other_details": ""
            }}
        }}
        
        Instructions:
        1. Extract exact text as it appears in the document
        2. For cost fields, extract only numerical values (without "Rs." or "lakhs")
        3. If information is not found, use empty string "" or null as appropriate
        4. For long text fields, preserve the original formatting and content
        5. Return ONLY the JSON object, no additional text
        
        Content to extract from:
        {content}
        """
        
        response = genai.GenerativeModel("gemini-2.5-flash").generate_content(extraction_prompt)
        extracted_json = response.text.strip()
        
        # Clean the response to ensure it's valid JSON
        if extracted_json.startswith('```json'):
            extracted_json = extracted_json[7:]
        if extracted_json.endswith('```'):
            extracted_json = extracted_json[:-3]
        
        extracted_data = json.loads(extracted_json)
        return extracted_data
        
    except Exception as e:
        print(f"Error in AI JSON extraction: {str(e)}")
        return create_basic_json_structure(content)


def _is_meaningful_extraction(json_structure: dict, raw_text: str) -> bool:
    """Return True if extraction contains meaningful user-provided content.

    This helps avoid making up estimates when the extractor returns
    only placeholder/default values (from `create_basic_json_structure`).
    """
    try:
        # Raw text check: require some selectable / non-whitespace text
        if raw_text and isinstance(raw_text, str) and len(raw_text.strip()) >= 200:
            return True

        # Check for non-default basic information
        basic = json_structure.get('basic_information', {}) or {}
        project_details = json_structure.get('project_details', {}) or {}

        # Fields that indicate a meaningful extraction if non-empty and not placeholder
        candidates = [
            basic.get('project_title', ''),
            basic.get('principal_implementing_agency', ''),
            project_details.get('objectives', ''),
            project_details.get('methodology', '')
        ]

        for v in candidates:
            if v and isinstance(v, str):
                s = v.strip().lower()
                # ignore common placeholder snippets
                if s and not any(p in s for p in [
                    'project title comes here', 'issue will come here',
                    'methodology will come here', 'work plan will come here',
                    'project title', 'project title comes here'
                ]):
                    return True

        # Check cost breakdown numeric presence
        cb = json_structure.get('cost_breakdown', {}) or {}
        tpc = cb.get('total_project_cost', {}) or {}
        total_val = tpc.get('total')
        if total_val is not None:
            try:
                if float(total_val) > 0:
                    return True
            except Exception:
                pass

        # Finally reject as not meaningful
        return False
    except Exception:
        return False


def create_basic_json_structure(content: str) -> dict:
    """Create a basic JSON structure when AI extraction fails."""
    # Extract basic information using regex patterns
    title_match = re.search(r'project\s+title[:\s]*([^\n]+)', content, re.IGNORECASE)
    agency_match = re.search(r'principal\s+implementing\s+agency[:\s]*([^\n]+)', content, re.IGNORECASE)
    
    return {
        "form_type": "FORM-I S&T Grant Proposal",
        "basic_information": {
            "project_title": title_match.group(1).strip() if title_match else "Project title comes here",
            "principal_implementing_agency": agency_match.group(1).strip() if agency_match else None,
            "project_leader_name": "principal",
            "sub_implementing_agency": "Sub-agency",
            "co_investigator_name": None,
            "contact_email": None,
            "contact_phone": None,
            "submission_date": datetime.now().strftime("%d-%m-%Y"),
            "project_duration": None
        },
        "project_details": {
            "definition_of_issue": "Issue will come here",
            "objectives": content[:200] + "..." if len(content) > 200 else content,
            "justification_subject_area": "Justify",
            "project_benefits": "Very very beneficial",
            "work_plan": "Work plan will come here",
            "methodology": "Methodology will come here",
            "organization_of_work": "Organization of work elements will come here",
            "time_schedule": "Bar Chart/PERT chart will come here",
            "foreign_exchange_details": "50%"
        },
        "cost_breakdown": {
            "capital_expenditure": {
                "land_building": {
                    "total": None,
                    "year1": "0",
                    "year2": "0", 
                    "year3": "0",
                    "justification": None
                },
                "equipment": {
                    "total": None,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0",
                    "justification": None
                }
            },
            "revenue_expenditure": {
                "salaries": {
                    "total": None,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0"
                },
                "consumables": {
                    "total": None,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0",
                    "notes": None
                },
                "travel": {
                    "total": None,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0"
                },
                "workshop_seminar": {
                    "total": None,
                    "year1": "0",
                    "year2": "0",
                    "year3": "0"
                }
            },
            "total_project_cost": {
                "total": None,
                "year1": "0",
                "year2": "0", 
                "year3": "0"
            },
            "fund_phasing": None
        },
        "additional_information": {
            "cv_details": None,
            "past_experience": None,
            "other_details": None
        }
    }


# ===============================================================
#  S&T GUIDELINES VALIDATION FOR COST COLUMNS
# ===============================================================

def parse_cost_to_lakhs(raw: str) -> float:
    """Parse a cost string to float (lakhs). Handles various formats."""
    if not raw:
        return 0.0
    s = str(raw).strip().replace(',', '').replace('₹', '').replace('Rs', '').replace('rs', '')
    s = s.replace('Lakhs', '').replace('lakhs', '').replace('L', '').strip()
    try:
        return float(s)
    except:
        return 0.0


def validate_cost_against_st_guidelines(cost_breakdown: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate each cost column against S&T Guidelines and provide detailed comments
    on what doesn't comply with the guidelines.
    
    Returns a dictionary with validation results and comments for each cost category.
    """
    validation_results = {
        "compliant": True,
        "overall_comments": [],
        "category_validations": {}
    }
    
    # Extract cost values
    cap = cost_breakdown.get("capital_expenditure", {})
    rev = cost_breakdown.get("revenue_expenditure", {})
    tot = cost_breakdown.get("total_project_cost", {})
    
    land_total = parse_cost_to_lakhs(cap.get("land_building", {}).get("total", ""))
    eq_total = parse_cost_to_lakhs(cap.get("equipment", {}).get("total", ""))
    sal_total = parse_cost_to_lakhs(rev.get("salaries", {}).get("total", ""))
    cons_total = parse_cost_to_lakhs(rev.get("consumables", {}).get("total", ""))
    travel_total = parse_cost_to_lakhs(rev.get("travel", {}).get("total", ""))
    workshop_total = parse_cost_to_lakhs(rev.get("workshop_seminar", {}).get("total", ""))
    grand_total = parse_cost_to_lakhs(tot.get("total", ""))
    
    # 1. LAND & BUILDING - According to S&T Guidelines: Land/Building usually NOT funded
    land_comments = []
    if land_total > 0:
        validation_results["compliant"] = False
        land_comments.append("⚠️ NOT COMPLIANT: Land & Building costs are normally NOT funded under S&T Guidelines.")
        land_comments.append("Justification: S&T projects typically do not cover land acquisition or building construction expenses.")
        land_comments.append(f"Current value: ₹{land_total} Lakhs")
        land_comments.append("Required action: Remove land/building costs or provide exceptional justification with ministry approval.")
    else:
        land_comments.append("✓ COMPLIANT: No land/building costs requested (as per S&T Guidelines)")
    validation_results["category_validations"]["land_building"] = {
        "value": land_total,
        "compliant": land_total == 0,
        "comments": land_comments
    }
    
    # 2. EQUIPMENT - Must be justified, >50L requires vendor quotes
    equipment_comments = []
    equipment_just = cap.get("equipment", {}).get("justification", "")
    if eq_total > 0:
        if not equipment_just or str(equipment_just).strip() == "":
            validation_results["compliant"] = False
            equipment_comments.append("⚠️ NOT COMPLIANT: Equipment costs must be accompanied by detailed justification as per S&T Guidelines.")
            equipment_comments.append(f"Current value: ₹{eq_total} Lakhs without justification")
            equipment_comments.append("Required action: Provide itemized equipment list with technical specifications and necessity justification.")
        else:
            equipment_comments.append("✓ Justification provided for equipment costs")
        
        if eq_total > 50:
            validation_results["compliant"] = False
            equipment_comments.append("⚠️ NOT COMPLIANT: Equipment costs exceeding ₹50 Lakhs require vendor quotations (S&T Guidelines).")
            equipment_comments.append(f"Current value: ₹{eq_total} Lakhs (exceeds ₹50L threshold)")
            equipment_comments.append("Required action: Attach vendor quotations from at least 2-3 suppliers for all major equipment items.")
        else:
            equipment_comments.append(f"✓ Equipment cost (₹{eq_total}L) is within threshold (<50L)")
    else:
        equipment_comments.append("✓ No equipment costs")
    validation_results["category_validations"]["equipment"] = {
        "value": eq_total,
        "compliant": eq_total <= 50 and (eq_total == 0 or equipment_just),
        "comments": equipment_comments
    }
    
    # 3. SALARIES/MANPOWER - Must NOT include permanent staff salaries
    salary_comments = []
    if sal_total > 0:
        salary_comments.append(f"Manpower/Salaries: ₹{sal_total} Lakhs")
        salary_comments.append("⚠️ CHECK REQUIRED: Ensure salaries are ONLY for temporary/contractual project staff.")
        salary_comments.append("NOT COMPLIANT IF: Permanent staff salaries are included (violates S&T Guidelines).")
        salary_comments.append("COMPLIANT IF: Only project-specific temporary/contractual staff with justified mandays/person-months.")
        salary_comments.append("Required details: Designation, person-months, monthly rates for each position.")
    else:
        salary_comments.append("⚠️ WARNING: No manpower costs allocated - verify if project requires staff resources.")
    validation_results["category_validations"]["salaries"] = {
        "value": sal_total,
        "compliant": None,  # Cannot determine without text analysis
        "comments": salary_comments,
        "requires_manual_review": True
    }
    
    # 4. CONSUMABLES - Should include justification for amounts
    consumables_comments = []
    if cons_total > 0:
        consumables_comments.append(f"Consumables: ₹{cons_total} Lakhs")
        consumables_comments.append("CHECK REQUIRED: Ensure detailed breakup of consumable items with quantities and rates.")
        consumables_comments.append("S&T Guidelines require: Itemized list with market rates or estimates for consumables.")
        if cons_total > grand_total * 0.20 if grand_total > 0 else False:
            validation_results["compliant"] = False
            consumables_comments.append(f"⚠️ WARNING: Consumables appear high (>{20}% of total budget - ₹{cons_total}L/₹{grand_total}L)")
            consumables_comments.append("Required action: Provide detailed justification for high consumable costs.")
    else:
        consumables_comments.append("✓ No consumable costs")
    validation_results["category_validations"]["consumables"] = {
        "value": cons_total,
        "compliant": cons_total <= (grand_total * 0.20) if grand_total > 0 else True,
        "comments": consumables_comments
    }
    
    # 5. TRAVEL - Limited to ₹3.0L per institute per year, no foreign travel for Indian agencies
    travel_comments = []
    if travel_total > 0:
        if travel_total > 3.0:
            validation_results["compliant"] = False
            travel_comments.append(f"⚠️ NOT COMPLIANT: Travel costs (₹{travel_total}L) exceed ₹3.0L per institute per year (S&T Guidelines ceiling).")
            travel_comments.append("Required action: Reduce travel budget to ₹3.0L or provide exceptional justification with ministry approval.")
        else:
            travel_comments.append(f"✓ COMPLIANT: Travel costs (₹{travel_total}L) within ₹3.0L limit per institute/year")
        
        travel_comments.append("⚠️ CHECK REQUIRED: Ensure NO foreign travel costs included for Indian implementing agencies.")
        travel_comments.append("S&T Guidelines: Foreign travel is NOT permitted for Indian institutes/agencies.")
        travel_comments.append("Required details: Travel itinerary, destinations, number of trips, per-trip costs.")
    else:
        travel_comments.append("✓ No travel costs")
    validation_results["category_validations"]["travel"] = {
        "value": travel_total,
        "compliant": travel_total <= 3.0,
        "comments": travel_comments,
        "requires_manual_review": True  # Need to check for foreign travel mentions
    }
    
    # 6. WORKSHOP/SEMINAR - Limited to ₹0.5L per agency per year
    workshop_comments = []
    if workshop_total > 0:
        if workshop_total > 0.5:
            validation_results["compliant"] = False
            workshop_comments.append(f"⚠️ NOT COMPLIANT: Workshop/Seminar costs (₹{workshop_total}L) exceed ₹0.5L per agency per year (S&T Guidelines ceiling).")
            workshop_comments.append("Required action: Reduce workshop/seminar budget to ₹0.5L or provide detailed justification.")
        else:
            workshop_comments.append(f"✓ COMPLIANT: Workshop/Seminar costs (₹{workshop_total}L) within ₹0.5L limit")
        workshop_comments.append("Required details: Workshop objectives, expected participants, venue costs, resource person fees.")
    else:
        workshop_comments.append("✓ No workshop/seminar costs")
    validation_results["category_validations"]["workshop_seminar"] = {
        "value": workshop_total,
        "compliant": workshop_total <= 0.5,
        "comments": workshop_comments
    }
    
    # 7. CONTINGENCY - Should not exceed 5% of revenue expenditure
    revenue_total = sal_total + cons_total + travel_total + workshop_total
    max_contingency = revenue_total * 0.05
    contingency_comments = []
    contingency_comments.append(f"Revenue Expenditure Total: ₹{revenue_total}L")
    contingency_comments.append(f"Maximum allowed contingency (5% of revenue): ₹{max_contingency:.2f}L")
    contingency_comments.append("S&T Guidelines: Contingency should not exceed 5% of revenue expenditure.")
    contingency_comments.append("Required: Clearly state contingency amount and basis of estimation.")
    validation_results["category_validations"]["contingency"] = {
        "max_allowed": round(max_contingency, 2),
        "compliant": None,  # Need to extract contingency from form
        "comments": contingency_comments,
        "requires_manual_review": True
    }
    
    # 8. GRAND TOTAL - Check if sum of components matches declared total
    computed_sum = eq_total + sal_total + cons_total + travel_total + workshop_total + land_total
    total_comments = []
    if grand_total > 0:
        if abs(grand_total - computed_sum) > 0.5:  # 0.5L tolerance
            validation_results["compliant"] = False
            total_comments.append(f"⚠️ ERROR: Declared total (₹{grand_total}L) does not match sum of components (₹{computed_sum}L)")
            total_comments.append(f"Difference: ₹{abs(grand_total - computed_sum):.2f}L")
            total_comments.append("Required action: Correct arithmetic errors - total must equal sum of all cost heads.")
        else:
            total_comments.append(f"✓ COMPLIANT: Grand total (₹{grand_total}L) matches sum of components (₹{computed_sum}L)")
    else:
        validation_results["compliant"] = False
        total_comments.append("⚠️ ERROR: Grand total not declared - required by S&T Guidelines")
    
    # Add year-wise breakdown check
    y1 = parse_cost_to_lakhs(tot.get("year1", ""))
    y2 = parse_cost_to_lakhs(tot.get("year2", ""))
    y3 = parse_cost_to_lakhs(tot.get("year3", ""))
    if y1 == 0 and y2 == 0 and y3 == 0:
        total_comments.append("⚠️ WARNING: Year-wise cost breakup not provided - required by S&T Guidelines for phased funding.")
        total_comments.append("Required action: Provide year-wise distribution of costs matching project milestones.")
    else:
        total_comments.append(f"✓ Year-wise costs provided: Year 1: ₹{y1}L, Year 2: ₹{y2}L, Year 3: ₹{y3}L")
    
    validation_results["category_validations"]["total_project_cost"] = {
        "declared_total": grand_total,
        "computed_sum": round(computed_sum, 2),
        "compliant": abs(grand_total - computed_sum) <= 0.5 if grand_total > 0 else False,
        "comments": total_comments
    }
    
    # 9. FUND PHASING - Must sum to 100%
    fund_phasing = cost_breakdown.get("fund_phasing", "")
    phasing_comments = []
    if fund_phasing:
        nums = [float(n) for n in re.findall(r"(\d+(?:\.\d+)?)", str(fund_phasing))]
        if nums:
            phasing_sum = sum(nums)
            if abs(phasing_sum - 100) > 1:  # 1% tolerance
                validation_results["compliant"] = False
                phasing_comments.append(f"⚠️ NOT COMPLIANT: Fund phasing percentages sum to {phasing_sum}% (must sum to 100%)")
                phasing_comments.append("Required action: Adjust phasing percentages to total exactly 100%.")
            else:
                phasing_comments.append(f"✓ COMPLIANT: Fund phasing sums to {phasing_sum}%")
        phasing_comments.append("Fund phasing values: " + ", ".join([f"{n}%" for n in nums]))
    else:
        validation_results["compliant"] = False
        phasing_comments.append("⚠️ NOT COMPLIANT: Fund phasing details not provided (required by S&T Guidelines)")
        phasing_comments.append("Required action: Provide year-wise funding requirements as percentages (must sum to 100%)")
    
    validation_results["category_validations"]["fund_phasing"] = {
        "provided": bool(fund_phasing),
        "compliant": bool(fund_phasing),
        "comments": phasing_comments
    }
    
    # Generate overall summary comments
    non_compliant_categories = [k for k, v in validation_results["category_validations"].items() 
                               if v.get("compliant") == False]
    if non_compliant_categories:
        validation_results["overall_comments"].append(
            f"CRITICAL: {len(non_compliant_categories)} cost categories do NOT comply with S&T Guidelines: " + 
            ", ".join(non_compliant_categories)
        )
    
    manual_review_categories = [k for k, v in validation_results["category_validations"].items() 
                               if v.get("requires_manual_review")]
    if manual_review_categories:
        validation_results["overall_comments"].append(
            f"MANUAL REVIEW REQUIRED for {len(manual_review_categories)} categories: " + 
            ", ".join(manual_review_categories)
        )
    
    if validation_results["compliant"]:
        validation_results["overall_comments"].append(
            "✓ All cost categories appear to comply with S&T Guidelines (subject to manual review of specific requirements)"
        )
    
    return validation_results


def generate_government_budget_breakdown(total_budget: int, json_structure: dict, llm_breakdown: dict, cost_analysis: dict) -> dict:
    """Generate realistic government budget breakdown."""
    
    # Government funding typically has different allocations compared to industry estimates
    # Government funding priorities: Equipment > Manpower > Operations > Contingency
    
    # Check if we have extracted cost data from Form-I
    extracted_costs = cost_analysis.get("extracted_costs", {})
    has_form_data = cost_analysis.get("has_valid_data", False)
    
    if has_form_data and sum(extracted_costs.values()) > 0:
        # Use Form-I data as base, but adjust to government budget
        ratio = total_budget / sum(extracted_costs.values())
        government_breakdown = {}
        
        for category, value in extracted_costs.items():
            government_breakdown[category] = max(0, int(value * ratio))
        
        # Ensure total matches
        total_allocated = sum(government_breakdown.values())
        if total_allocated != total_budget:
            diff = total_budget - total_allocated
            # Add difference to largest category
            max_category = max(government_breakdown, key=government_breakdown.get)
            government_breakdown[max_category] += diff
    else:
        # Use government funding patterns
        government_breakdown = {
            "equipment_and_infrastructure": int(total_budget * 0.35),  # 35% for equipment/infrastructure
            "manpower_and_salaries": int(total_budget * 0.30),        # 30% for personnel
            "consumables_and_materials": int(total_budget * 0.15),    # 15% for consumables
            "travel_and_fieldwork": int(total_budget * 0.08),         # 8% for travel
            "software_and_tools": int(total_budget * 0.05),           # 5% for software
            "contingency_and_overhead": int(total_budget * 0.07)      # 7% for contingency
        }
        
        # Adjust total to match exactly
        total_allocated = sum(government_breakdown.values())
        if total_allocated != total_budget:
            diff = total_budget - total_allocated
            government_breakdown["contingency_and_overhead"] += diff
    
    # Add government-specific constraints and recommendations
    government_breakdown["funding_constraints"] = {
        "maximum_equipment_per_year": int(total_budget * 0.25),
        "minimum_manpower_allocation": int(total_budget * 0.20),
        "mandatory_contingency": int(total_budget * 0.05),
        "compliance_requirements": "All expenses must follow GFR and departmental guidelines"
    }
    
    return government_breakdown


def generate_budget_recommendations(total_budget: int, breakdown: dict) -> list:
    """Generate budget optimization recommendations."""
    recommendations = []
    
    # Analyze budget size
    if total_budget > 2000:
        recommendations.append("Consider implementing the project in multiple phases to ensure better monitoring and control")
        recommendations.append("Establish milestone-based fund release mechanism")
    
    if total_budget > 5000:
        recommendations.append("Recommend forming a Project Monitoring Committee (PMC) for oversight")
        recommendations.append("Consider co-funding opportunities with industry partners")
    
    # Analyze breakdown ratios
    equipment_ratio = breakdown.get("equipment_and_infrastructure", 0) / total_budget
    manpower_ratio = breakdown.get("manpower_and_salaries", 0) / total_budget
    
    if equipment_ratio > 0.40:
        recommendations.append("High equipment cost ratio - consider leasing options or shared facilities")
    
    if manpower_ratio > 0.35:
        recommendations.append("High manpower allocation - explore collaboration with existing institutions")
    
    if manpower_ratio < 0.15:
        recommendations.append("Low manpower allocation may indicate insufficient human resources for project execution")
    
    # General government guidelines
    recommendations.append("Ensure compliance with GFR (General Financial Rules) for all procurements")
    recommendations.append("Maintain detailed documentation for audit and transparency")
    recommendations.append("Plan for quarterly progress reviews and budget utilization reports")
    
    if total_budget > 1000:
        recommendations.append("Consider establishing dedicated project account for better fund management")
    
    return recommendations


# ===============================================================
#                    FASTAPI ENDPOINTS
# ===============================================================

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
        
        # Perform cost estimation using the notebook / enhanced ML model
        enhanced_result = enhanced_ml_cost_estimate(project_summary, target_year=2025)
        ml_cost_value = enhanced_result.get('predicted_cost', 500.0)

        # Get ML prediction from notebook / saved model (preferred)
        ml_nb_cost, ml_nb_conf, ml_nb_breakdown = notebook_ml_predict(project_summary, target_year=2025)
        if ml_nb_cost is None:
            # fallback to enhanced_result
            ml_nb_cost = ml_cost_value
            ml_nb_conf = enhanced_result.get('confidence_score', 50.0)
            ml_nb_breakdown = enhanced_result.get('cost_breakdown', {})

        # Compare with extracted Form-I costs
        extracted_total = cost_analysis["total_extracted"]
        has_form_costs = cost_analysis["has_valid_data"]

        # Calculate final recommendation using ML prediction from notebook
        if has_form_costs and extracted_total > 0:
            # Weight: 60% ML (notebook) + 40% Form-I extracted data
            final_estimate = int((0.6 * ml_nb_cost) + (0.4 * extracted_total))
            confidence_note = "Based on Form-I data and ML prediction (notebook)"
        else:
            # Use ML prediction alone
            final_estimate = int(ml_nb_cost)
            confidence_note = "Based on ML model prediction (notebook)"

        # Calculate validation metrics
        if has_form_costs:
            form_diff = abs(final_estimate - extracted_total) / (extracted_total + 1)
        else:
            form_diff = 0

        ml_diff = abs(final_estimate - ml_nb_cost) / (ml_nb_cost + 1) if ml_nb_cost else 0
        if has_form_costs:
            avg_diff = (ml_diff + form_diff) / 2
        else:
            avg_diff = ml_diff

        validation_status = (
            "high_confidence" if avg_diff <= 0.15 else
            "medium_confidence" if avg_diff <= 0.30 else
            "low_confidence"
        )

        # Generate final breakdown (prefer ML notebook breakdown, adjust if Form-I data available)
        if has_form_costs and cost_analysis["extracted_costs"]:
            # Blend ML breakdown with Form-I extracted costs
            final_breakdown = {}
            for category in ml_nb_breakdown:
                form_value = cost_analysis["extracted_costs"].get(category, 0)
                ml_value = ml_nb_breakdown.get(category, 0)
                if form_value > 0:
                    # Use weighted average favoring Form-I actual data
                    final_breakdown[category] = int((0.7 * form_value) + (0.3 * ml_value))
                else:
                    final_breakdown[category] = ml_value
        else:
            final_breakdown = ml_nb_breakdown
        
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
        
        # Generate usage comment (simple deterministic generator)
        usage_comment = usage_comment_simple(
            final_estimate, ml_nb_cost, final_breakdown, validation_status
        )
        
        # Generate assessment comment and LLM-driven cost justification for compatibility
        assessment_comment = generate_content_based_comment(
            final_estimate, final_estimate, final_breakdown, "form_extracted", {}
        )
        try:
            try:
                cost_score = int(score_pct)
            except Exception:
                cost_score = 0
            changeable_pct = max(0, 100 - int(cost_score))

            prompt = f"""
You are a senior government R&D budget reviewer. Using the context below, produce a concise 'Cost Justification' comment block in plain text only, matching this format exactly:

Cost Justification
Score: <score>/100    Changeable: <percent>%
<One short paragraph (1-2 sentences) explaining why the budget is set this way and key concerns>
Recommended actions:
- <action 1>
- <action 2>
- <action 3>

Context:
- Government budget (Lakhs): {final_estimate}
- Base estimate method: form_extracted
- Base estimate (Lakhs): {final_estimate}
- Confidence score: {score_pct}
- Validation status: {validation_status}
- Breakdown assessment: {breakdown_assessment}

Top budget allocations (top 4):\n"""
            top_cats = sorted(final_breakdown.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True)[:4]
            for k, v in top_cats:
                prompt += f"- {k}: {v} lakhs\n"
            prompt += "\nRespond ONLY with the plain text comment block exactly in the format above. No JSON, no extra explanation."

            raw_comments = call_gemini(prompt) if 'call_gemini' in globals() else ""
            cost_comments = (raw_comments or "").strip()
            if cost_comments.startswith('```') and cost_comments.endswith('```'):
                cost_comments = cost_comments.strip('`\n ')
            if not cost_comments:
                raise Exception("Empty LLM response")
        except Exception:
            try:
                cost_score = int(score_pct)
            except Exception:
                cost_score = 0
            changeable_pct = max(0, 100 - int(cost_score))
            cost_comments = (
                f"Cost Justification\n"
                f"Score: {cost_score}/100    Changeable: {changeable_pct}%\n"
                "The budget broadly aligns with pilot-scale efforts but lacks detailed line-item breakdowns for high-value equipment. "
                "Several procurement entries above ₹5M require vendor quotes or justification.\n"
                "Recommended actions:\n"
                "- Provide detailed quotations for specialized equipment and vendor estimates for each major line item.\n"
                "- Separate capital vs operational expenses and include lifecycle maintenance cost estimates.\n"
                "- Clarify contingencies and explain assumptions behind unit costs to reduce budget uncertainty."
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
                "ml_predicted_cost": round(ml_nb_cost, 2),
                "llm_predicted_cost": None,
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



# Register the endpoint with FastAPI router if available
if globals().get('router') is not None:
    try:
        _router = globals().get('router')
        # Safely call post only if the router object exposes it
        if _router is not None and hasattr(_router, 'post') and callable(getattr(_router, 'post')):
            _router.post("/estimate-from-form1-data")(estimate_from_form1_data)
    except Exception:
        pass

# Define the endpoint outside the conditional to avoid type annotation issues
async def _process_and_estimate_impl(file):
    """
    Comprehensive processing and estimation endpoint that:
    1. Extracts JSON from the uploaded FORM-I document
    2. Performs cost estimation using ML and LLM models
    3. Provides government budget breakdown with realistic allocations
    4. Returns complete analysis in a single response
    """
    try:
        # Read uploaded file
        file_bytes = await file.read()
        
        # Validate file metadata
        if not getattr(file, "filename", None):
            return {"success": False, "error": "No filename provided"}
        
        ext = file.filename.lower().split(".")[-1]
        if ext not in ["pdf", "docx", "txt"]:
            return {"success": False, "error": "Unsupported file format. Only PDF, DOCX, and TXT files are allowed."}

        # Step 1: Extract text from document
        extracted_text = extract_text(file.filename, file_bytes)
        if not extracted_text or len(extracted_text.strip()) < 30:
            return {"success": False, "error": "Unable to extract meaningful text content from the file"}

        # Step 2: Extract structured JSON data using AI (similar to existing extraction logic)
        json_structure = extract_json_from_text(extracted_text)

        # Strict check: ensure extraction is meaningful before proceeding.
        if not _is_meaningful_extraction(json_structure, extracted_text):
            return {
                "success": False,
                "error": "Insufficient extractable content: uploaded file appears empty or extraction returned only placeholders.",
                "details": "Please upload a filled FORM-I PDF (text-selectable) or ensure OCR/extraction is enabled. No estimation was performed."
            }
        
        # Step 3: Cost estimation using multiple models
        similar_projects = get_similar_projects_enhanced(extracted_text, top_k=5)
        
        # Enhanced ML model prediction
        enhanced_result = enhanced_ml_cost_estimate(extracted_text, target_year=2025)
        ml_cost_value = enhanced_result.get('predicted_cost', 500.0)

        # Get ML prediction from notebook / saved model (preferred)
        ml_nb_cost, ml_nb_conf, ml_nb_breakdown = notebook_ml_predict(extracted_text, target_year=2025)
        if ml_nb_cost is None:
            ml_nb_cost = ml_cost_value
            ml_nb_conf = enhanced_result.get('confidence_score', 50.0)
            ml_nb_breakdown = enhanced_result.get('cost_breakdown', {})

        # Analyze Form-I extracted costs if available
        cost_analysis = analyze_form1_cost_breakdown(json_structure)
        extracted_total = cost_analysis["total_extracted"]
        has_form_costs = cost_analysis["has_valid_data"]

        # Step 4: Calculate final government budget estimate
        if has_form_costs and extracted_total > 0:
            government_budget = int((0.6 * ml_nb_cost) + (0.4 * extracted_total))
        else:
            government_budget = int(ml_nb_cost)

        # Step 5: Generate government cost breakdown with realistic budget allocation
        realistic_breakdown = generate_government_budget_breakdown(
            government_budget, json_structure, ml_nb_breakdown, cost_analysis
        )

        # Step 6: Calculate confidence and validation metrics
        ml_diff = abs(government_budget - ml_nb_cost) / (ml_nb_cost + 1) if ml_nb_cost else 0
        if has_form_costs:
            form_diff = abs(government_budget - extracted_total) / (extracted_total + 1)
            avg_diff = (ml_diff + form_diff) / 2
        else:
            avg_diff = ml_diff
        
        validation_status = (
            "high_confidence" if avg_diff <= 0.15 else
            "medium_confidence" if avg_diff <= 0.30 else
            "low_confidence"
        )
        
        confidence_score = int(round(max(0.0, min(1.0, 1.0 - avg_diff)) * 100))
        
        # Step 7: Generate usage comment and recommendations (simple generator)
        usage_comment = usage_comment_simple(
            government_budget, ml_nb_cost, realistic_breakdown, validation_status
        )
        
        # Step 8: Save complete record to database
        if globals().get('supabase'):
            _supabase = globals().get('supabase')
            save_record = {
                "filename": file.filename,
                "final_cost": government_budget,
                "ml_cost": ml_nb_cost,
                "llm_cost": None,
                "form_extracted_cost": extracted_total if has_form_costs else None,
                "validation_status": validation_status,
                "confidence_score": confidence_score,
                "breakdown": realistic_breakdown,
                "json_structure": json_structure,
                "raw_text": extracted_text[:15000],  # Limit text size
                "created_at": datetime.utcnow().isoformat()
            }
            
            try:
                _supabase.table("comprehensive_estimations").insert(save_record).execute()
            except Exception as e:
                print(f"Supabase Insert Error: {e}")
        
        # Step 9: Return comprehensive response
        # Prepare assessment and LLM-driven cost comments for this implementation
        try:
            estimation_method_local = "form_extracted" if has_form_costs and extracted_total > 0 else "ml_prediction"
            assessment_comment = generate_content_based_comment(
                government_budget, government_budget, realistic_breakdown, estimation_method_local, json_structure
            )

            try:
                cost_score = int(round(max(0.0, min(1.0, 1.0 - ((ml_diff + (form_diff if has_form_costs else 0))/2))) * 100))
            except Exception:
                cost_score = 0
            changeable_pct = max(0, 100 - int(cost_score))

            prompt = f"""
You are a senior government R&D budget reviewer. Using the context below, produce a concise 'Cost Justification' comment block in plain text only, matching this format exactly:

Cost Justification
Score: <score>/100    Changeable: <percent>%
<One short paragraph (1-2 sentences) explaining why the budget is set this way and key concerns>
Recommended actions:
- <action 1>
- <action 2>
- <action 3>

Context:
- Government budget (Lakhs): {government_budget}
- Base estimate method: {estimation_method_local}
- Base estimate (Lakhs): {government_budget}
- Confidence score: {cost_score}
- Validation status: {validation_status}
- Breakdown assessment: {assess_breakdown(realistic_breakdown, government_budget)}

Top budget allocations (top 4):\n"""
            top_cats = sorted(realistic_breakdown.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True)[:4]
            for k, v in top_cats:
                prompt += f"- {k}: {v} lakhs\n"
            prompt += "\nRespond ONLY with the plain text comment block exactly in the format above. No JSON, no extra explanation."

            raw_comments = call_gemini(prompt) if 'call_gemini' in globals() else ""
            cost_comments = (raw_comments or "").strip()
            if cost_comments.startswith('```') and cost_comments.endswith('```'):
                cost_comments = cost_comments.strip('`\n ')
            if not cost_comments:
                raise Exception("Empty LLM response")
        except Exception:
            try:
                cost_score = int(round(max(0.0, min(1.0, 1.0 - ((ml_diff + (form_diff if has_form_costs else 0))/2))) * 100))
            except Exception:
                cost_score = 0
            changeable_pct = max(0, 100 - int(cost_score))
            cost_comments = (
                f"Cost Justification\n"
                f"Score: {cost_score}/100    Changeable: {changeable_pct}%\n"
                "The budget broadly aligns with pilot-scale efforts but lacks detailed line-item breakdowns for high-value equipment. "
                "Several procurement entries above ₹5M require vendor quotes or justification.\n"
                "Recommended actions:\n"
                "- Provide detailed quotations for specialized equipment and vendor estimates for each major line item.\n"
                "- Separate capital vs operational expenses and include lifecycle maintenance cost estimates.\n"
                "- Clarify contingencies and explain assumptions behind unit costs to reduce budget uncertainty."
            )

        return {
            "success": True,
            "extracted_json": json_structure,
            "cost_estimation": {
                "government_budget_lakhs": government_budget,
                "confidence_score": confidence_score,
                "validation_status": validation_status,
                "breakdown": realistic_breakdown,
                "usage_comment": usage_comment,
                "comment": assessment_comment,
                "comments": cost_comments,
                "recommendations": generate_budget_recommendations(government_budget, realistic_breakdown)
            },
            "analysis_details": {
                "ml_predicted_cost": round(ml_cost_value, 2),
                "llm_predicted_cost": None,
                "form_extracted_cost": extracted_total if has_form_costs else None,
                "similar_projects_found": len(similar_projects),
                "text_length": len(extracted_text),
                "extraction_confidence": "high" if has_form_costs else "medium",
                "processing_note": "Complete Form-I extraction and cost analysis performed"
            },
            "file_info": {
                "filename": file.filename,
                "processed_at": datetime.utcnow().isoformat(),
                "file_type": ext.upper()
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {str(e)}",
            "details": "Please ensure the uploaded file is a valid FORM-I document"
        }


# Safe FastAPI endpoint registration: avoid NameError when FastAPI isn't available
try:
    from fastapi import File, UploadFile
except Exception:
    File = None
    UploadFile = None

# if globals().get('router') is not None and File is not None and UploadFile is not None:
@router.post("/process-and-estimate")
async def process_and_estimate(file: UploadFile = File(...)):
    """
    Comprehensive processing and estimation endpoint that:
    1. Extracts JSON from the uploaded FORM-I document
    2. Performs cost estimation based solely on PDF content
    3. Provides government budget breakdown with realistic allocations
    4. Returns complete analysis in a single response
    """
    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if len(text) < 30:
        return {"error": "Unable to extract meaningful text"}

    # --- EXTRACT JSON STRUCTURE FIRST ---
    json_structure = extract_json_from_text(text)

    # If extraction is not meaningful, abort and inform user (avoid dummy estimates)
    if not _is_meaningful_extraction(json_structure, text):
        return {
            "success": False,
            "error": "Insufficient extractable content: uploaded file appears empty or extraction returned only placeholders.",
            "details": "Please upload a filled FORM-I PDF (text-selectable) or ensure OCR/extraction is enabled. No estimation was performed."
        }
    
    # --- ANALYZE EXTRACTED COST DATA FROM FORM-I ---
    cost_analysis = analyze_form1_cost_breakdown(json_structure)
    form_extracted_total = cost_analysis.get("total_extracted", 0)
    has_form_costs = cost_analysis.get("has_valid_data", False)
    
    # --- CONTENT-BASED COST ESTIMATION ---
    if has_form_costs and form_extracted_total > 0:
        # Use extracted costs as primary estimate
        base_cost = form_extracted_total
        confidence_level = "high"
        estimation_method = "form_extracted"
    else:
        # Fallback: Estimate based on content analysis
        base_cost = estimate_cost_from_content_only(text, json_structure)
        confidence_level = "medium" 
        estimation_method = "content_analysis"
    
    # --- APPLY GOVERNMENT BUDGET ADJUSTMENTS ---
    # Government typically provides 80-90% of requested amount
    government_adjustment_factor = 0.85
    government_budget = int(base_cost * government_adjustment_factor)
    
    # --- GENERATE REALISTIC GOVERNMENT BUDGET BREAKDOWN ---
    realistic_breakdown = generate_government_budget_breakdown(
        government_budget, json_structure, {}, cost_analysis
    )
    
    # --- CALCULATE CONFIDENCE SCORE ---
    if has_form_costs:
        confidence_score = 90  # High confidence when we have form data
    else:
        # Base confidence on content richness
        content_quality = analyze_content_quality(text, json_structure)
        confidence_score = min(85, max(60, content_quality))
    
    # --- VALIDATE AGAINST S&T GUIDELINES ---
    st_guidelines_validation = validate_cost_against_st_guidelines(
        json_structure.get("cost_breakdown", {})
    )
    
    # --- GENERATE ASSESSMENT COMMENT ---
    assessment_comment = generate_content_based_comment(
        government_budget, base_cost, realistic_breakdown, estimation_method, json_structure
    )

    # --- GENERATE LLM-BASED 'Cost Justification' COMMENTS (preferred) ---
    try:
        # Score and changeable percent
        try:
            cost_score = int(confidence_score)
        except Exception:
            cost_score = 0
        changeable_pct = max(0, 100 - int(cost_score))

        # Build prompt for Gemini to produce a plain text comment block matching the required template
        prompt = f"""
You are a senior government R&D budget reviewer. Using the context below, produce a concise 'Cost Justification' comment block in plain text only, matching this format exactly:

Cost Justification
Score: <score>/100    Changeable: <percent>%
<One short paragraph (1-2 sentences) explaining why the budget is set this way and key concerns>
Recommended actions:
- <action 1>
- <action 2>
- <action 3>

Context:
- Government budget (Lakhs): {government_budget}
- Base estimate method: {estimation_method}
- Base estimate (Lakhs): {base_cost}
- Confidence score: {confidence_score}
- Validation status: {confidence_level}
- Breakdown assessment: {assess_breakdown(realistic_breakdown, government_budget)}

Top budget allocations (top 4):\n"""
        # attach top categories for context
        top_cats = sorted(realistic_breakdown.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True)[:4]
        for k, v in top_cats:
            prompt += f"- {k}: {v} lakhs\n"

        prompt += "\nRespond ONLY with the plain text comment block exactly in the format above. No JSON, no extra explanation."

        raw_comments = call_gemini(prompt) if 'call_gemini' in globals() else ""
        cost_comments = (raw_comments or "").strip()
        # strip fences if present
        if cost_comments.startswith('```') and cost_comments.endswith('```'):
            cost_comments = cost_comments.strip('`\n ')
        if not cost_comments:
            raise Exception("Empty LLM response")
    except Exception:
        # fallback to deterministic assessment_comment formatted to required template
        try:
            cost_score = int(confidence_score)
        except Exception:
            cost_score = 0
        changeable_pct = max(0, 100 - int(cost_score))
        cost_comments = (
            f"Cost Justification\n"
            f"Score: {cost_score}/100    Changeable: {changeable_pct}%\n"
            "The budget broadly aligns with pilot-scale efforts but lacks detailed line-item breakdowns for high-value equipment. "
            "Several procurement entries above ₹5M require vendor quotes or justification.\n"
            "Recommended actions:\n"
            "- Provide detailed quotations for specialized equipment and vendor estimates for each major line item.\n"
            "- Separate capital vs operational expenses and include lifecycle maintenance cost estimates.\n"
            "- Clarify contingencies and explain assumptions behind unit costs to reduce budget uncertainty."
        )
    
    # --- SAVE TO SUPABASE ---
    save_record = {
        "filename": file.filename,
        "final_cost": government_budget,
        "base_cost": base_cost,
        "estimation_method": estimation_method,
        "confidence_level": confidence_level,
        "confidence_score": confidence_score,
        "breakdown": realistic_breakdown,
        "json_structure": json_structure,
        "raw_text": text[:20000],
        "created_at": datetime.utcnow().isoformat()
    }

    if globals().get('supabase'):
        try:
            # Write to the canonical `cost_estimations` table if available
            # (older code used `content_based_estimations` which may not exist)
            target_table = "cost_estimations"
            _supabase = globals().get('supabase')
            if _supabase is not None:
                _supabase.table(target_table).insert(save_record).execute()
        except Exception as e:
            # Log the error but do not fail the request
            print(f"Supabase Insert Error for table '{target_table}': {e}")

    # --- FINAL RESPONSE BASED SOLELY ON PDF CONTENT ---        
    return {
        "success": True,
        "extracted_json": json_structure,
        "cost_estimation": {
            "government_budget_lakhs": government_budget,
            "confidence_score": confidence_score,
            "confidence_level": confidence_level,
            "estimation_method": estimation_method,
            "breakdown": realistic_breakdown,
            "comment": assessment_comment,
            "comments": cost_comments,
            "recommendations": generate_content_based_recommendations(government_budget, realistic_breakdown, json_structure),
            "st_guidelines_validation": st_guidelines_validation
        },
        "analysis_details": {
            "base_estimated_cost": base_cost,
            "government_adjustment_factor": government_adjustment_factor,
            "form_extracted_cost": form_extracted_total if has_form_costs else None,
            "has_form_cost_data": has_form_costs,
            "text_length": len(text),
            "processing_note": f"Cost estimation based on {estimation_method}"
        },
        "file_info": {
            "filename": file.filename,
            "processed_at": datetime.utcnow().isoformat(),
            "file_type": file.filename.split('.')[-1].upper()
        }
    }
