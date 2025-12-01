# Import logging configuration first to suppress all verbose outputs

import os
import json
import uuid
import logging
import traceback
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict

import joblib
import numpy as np
import torch
from torch import nn
from torch_geometric.data import Data
from torch_geometric.nn import GCNConv, global_mean_pool
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

# Suppress verbose outputs and progress bars
os.environ["TOKENIZERS_PARALLELISM"] = "false"
import warnings
warnings.filterwarnings("ignore")

# Suppress all verbose logging from various libraries
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)
logging.getLogger("supabase").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("requests").setLevel(logging.WARNING)

load_dotenv()

# ---------------------------
# CONFIG
# ---------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Set SUPABASE_URL and SUPABASE_KEY in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

JSON_BUCKET = "novelty-json"
PRETRAIN_DIR = os.path.join(os.path.dirname(__file__), "pre-trained")
os.makedirs(PRETRAIN_DIR, exist_ok=True)
GNN_MODEL_PATH = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\Common\Novelty\pre-trained\gnn_novelty_model.joblib"

# Setup logging
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "agent.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ======================================
# GNN MODEL ARCHITECTURE
# ======================================

class NoveltyGNN(nn.Module):
    """Graph Neural Network for novelty detection"""
    def __init__(self, in_dim: int):
        super().__init__()
        self.conv1 = GCNConv(in_dim, 256)
        self.conv2 = GCNConv(256, 128)
        self.lin1 = nn.Linear(128, 64)
        self.lin2 = nn.Linear(64, 1)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)

    def forward(self, x, edge_index, batch):
        # First GCN layer
        x = self.relu(self.conv1(x, edge_index))
        x = self.dropout(x)
        
        # Second GCN layer
        x = self.relu(self.conv2(x, edge_index))
        x = self.dropout(x)
        
        # Global pooling
        x = global_mean_pool(x, batch)
        
        # MLP layers
        x = self.relu(self.lin1(x))
        x = self.dropout(x)
        out = torch.sigmoid(self.lin2(x))
        
        return out

# ======================================
# AGENT DATA STRUCTURES
# ======================================

@dataclass
class NoveltyResult:
    """Structured result from novelty analysis"""
    novelty_percentage: float
    model_version: str
    node_contributions: Dict[str, float]
    top_similar_past_items: List[Dict[str, Any]]
    timestamp: str
    confidence_score: float
    explanation: str
    similar_lines: List[Dict[str, Any]]
    similar_count: int
    comment: str

@dataclass
class SimilarLine:
    """Structure for similar line detection"""
    line_number: Optional[int]
    text: str
    best_match_file: str
    similarity: float
    matched_excerpt: str

# ======================================
# AGENT COMPONENTS
# ======================================

class EmbedderLoader:
    """Handles embedding model loading with fallback"""
    
    def __init__(self):
        self.embedder = None
        self.embedder_type = None
        self.embed_dim = None
    
    def load_embedder(self, model_name: str = "all-MiniLM-L6-v2"):
        """Load SBERT embedder with TF-IDF fallback"""
        try:
            self.embedder = SentenceTransformer(model_name)
            self.embedder_type = "SBERT"
            self.embed_dim = 384  # Default for all-MiniLM-L6-v2
            logger.info(f"SBERT embedder loaded: {model_name}")
            return True
        except Exception as e:
            logger.warning(f"SBERT loading failed: {e}, falling back to TF-IDF")
            try:
                self.embedder = TfidfVectorizer(max_features=512, stop_words='english')
                self.embedder_type = "TF-IDF"
                self.embed_dim = 512
                logger.info("TF-IDF embedder loaded as fallback")
                return True
            except Exception as e2:
                logger.error(f"All embedders failed: {e2}")
                return False
    
    def encode_texts(self, texts: List[str]) -> np.ndarray:
        """Encode texts using loaded embedder"""
        if self.embedder is None:
            raise ValueError("No embedder loaded")
        
        if self.embedder_type == "SBERT":
            return self.embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        else:  # TF-IDF
            if not hasattr(self.embedder, 'vocabulary_'):
                # Fit if not already fitted
                self.embedder.fit(texts)
            X = self.embedder.transform(texts).toarray()
            return X / (np.linalg.norm(X, axis=1, keepdims=True) + 1e-12)

class GraphBuilder:
    """Converts project details to graph structure"""
    
    def __init__(self, embedder_loader: EmbedderLoader):
        self.embedder_loader = embedder_loader
    
    def build_graph(self, project_details: Dict[str, str]) -> Tuple[torch.Tensor, torch.Tensor, List[str]]:
        """Convert project_details to graph representation"""
        try:
            node_texts = list(project_details.values())
            node_names = list(project_details.keys())
            num_nodes = len(node_texts)
            
            if num_nodes == 0:
                raise ValueError("No project details provided")
            
            # Clean and validate texts
            cleaned_texts = []
            valid_names = []
            for i, (name, text) in enumerate(zip(node_names, node_texts)):
                if text and str(text).strip():
                    cleaned_texts.append(str(text).strip())
                    valid_names.append(name)
                else:
                    cleaned_texts.append(f"No {name.replace('_', ' ')} provided")
                    valid_names.append(name)
            
            # Embed nodes
            node_feats = self.embedder_loader.encode_texts(cleaned_texts)
            node_feats = torch.tensor(node_feats, dtype=torch.float)
            
            # Create fully connected edges
            num_nodes = len(valid_names)
            edges = []
            for i in range(num_nodes):
                for j in range(num_nodes):
                    if i != j:
                        edges.append([i, j])
            
            edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous() if edges else torch.empty((2, 0), dtype=torch.long)
            
            return node_feats, edge_index, valid_names
            
        except Exception as e:
            logger.error(f"Graph building failed: {e}")
            raise

class ModelLoader:
    """Loads and manages GNN model"""
    
    def __init__(self):
        self.model = None
        self.embedder_loader = None
        self.metadata = {}
        self.loaded = False
    
    def load_model(self) -> bool:
        """Load trained GNN model and embedder"""
        try:
            if not os.path.exists(GNN_MODEL_PATH):
                logger.error(f"GNN model not found at {GNN_MODEL_PATH}")
                return False
            
            # Load saved model data
            saved_data = joblib.load(GNN_MODEL_PATH)
            
            # Extract components
            model_state = saved_data["model_state"]
            saved_embedder = saved_data["embedder"]
            embed_dim = saved_data["embed_dim"]
            
            # Initialize model
            self.model = NoveltyGNN(embed_dim)
            self.model.load_state_dict(model_state)
            self.model.eval()
            
            # Setup embedder loader with saved embedder
            self.embedder_loader = EmbedderLoader()
            self.embedder_loader.embedder = saved_embedder
            self.embedder_loader.embedder_type = "SBERT" if isinstance(saved_embedder, SentenceTransformer) else "TF-IDF"
            self.embedder_loader.embed_dim = embed_dim
            
            # Create metadata
            self.metadata = {
                "model_version": "gnn_v1.0",
                "embed_dim": embed_dim,
                "embedder_type": self.embedder_loader.embedder_type,
                "loaded_at": datetime.now().isoformat()
            }
            
            self.loaded = True
            logger.info("GNN model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            return False
    
    def load_fallback(self) -> bool:
        """Load fallback SBERT model"""
        try:
            self.embedder_loader = EmbedderLoader()
            if self.embedder_loader.load_embedder():
                self.metadata = {
                    "model_version": "sbert_fallback_v1.0",
                    "embed_dim": self.embedder_loader.embed_dim,
                    "embedder_type": self.embedder_loader.embedder_type,
                    "loaded_at": datetime.now().isoformat()
                }
                self.loaded = True
                logger.info("Fallback model loaded successfully")
                return True
            return False
        except Exception as e:
            logger.error(f"Fallback model loading failed: {e}")
            return False

class GNNInference:
    """Handles GNN inference and predictions"""
    
    def __init__(self, model_loader: ModelLoader):
        self.model_loader = model_loader
        self.graph_builder = None
        
        if model_loader.embedder_loader:
            self.graph_builder = GraphBuilder(model_loader.embedder_loader)
    
    def predict_novelty(self, project_details: Dict[str, str]) -> Tuple[float, Dict[str, float]]:
        """Predict novelty score and node contributions"""
        try:
            if not self.graph_builder:
                raise ValueError("Graph builder not initialized")
            
            if self.model_loader.model is None:
                # Use fallback prediction
                return self._fallback_prediction(project_details)
            
            # GNN prediction
            x, edge_index, node_names = self.graph_builder.build_graph(project_details)
            
            # Create data object
            data = Data(x=x, edge_index=edge_index)
            data.batch = torch.zeros(x.shape[0], dtype=torch.long)
            
            # Predict
            with torch.no_grad():
                pred = self.model_loader.model(data.x, data.edge_index, data.batch).item()
            
            novelty_score = round(pred * 100, 2)
            
            # Calculate node contributions
            node_contributions = self._calculate_node_importance(data, node_names)
            
            return novelty_score, node_contributions
            
        except Exception as e:
            logger.error(f"GNN inference failed: {e}")
            return self._fallback_prediction(project_details)
    
    def _calculate_node_importance(self, data: Data, node_names: List[str]) -> Dict[str, float]:
        """Calculate importance of each node using masking"""
        if self.model_loader.model is None:
            return {name: 1.0/len(node_names) for name in node_names}
        
        try:
            # Get baseline prediction
            with torch.no_grad():
                baseline_pred = self.model_loader.model(data.x, data.edge_index, data.batch).item()
            
            contributions = {}
            for i, name in enumerate(node_names):
                # Create masked version
                masked_data = Data(
                    x=data.x.clone(),
                    edge_index=data.edge_index,
                    batch=data.batch
                )
                # Zero out node i
                masked_data.x[i] = torch.zeros_like(masked_data.x[i])
                
                with torch.no_grad():
                    masked_pred = self.model_loader.model(masked_data.x, masked_data.edge_index, masked_data.batch).item()
                
                # Importance = drop in prediction
                importance = abs(baseline_pred - masked_pred)
                contributions[name] = round(importance, 4)
            
            return contributions
            
        except Exception as e:
            logger.error(f"Node importance calculation failed: {e}")
            return {name: 1.0/len(node_names) for name in node_names}
    
    def _fallback_prediction(self, project_details: Dict[str, str]) -> Tuple[float, Dict[str, float]]:
        """Fallback prediction using heuristics"""
        try:
            texts = list(project_details.values())
            combined_text = " ".join([str(t) for t in texts if t])
            
            # Simple novelty heuristic based on text characteristics
            words = combined_text.lower().split()
            unique_words = len(set(words))
            total_words = len(words)
            
            # Technical terms that indicate novelty
            novelty_keywords = [
                'novel', 'innovative', 'new', 'advanced', 'cutting-edge', 'breakthrough',
                'ai', 'machine learning', 'deep learning', 'artificial intelligence',
                'automation', 'smart', 'intelligent', 'optimization', 'algorithm',
                'predictive', 'analytics', 'iot', 'blockchain', 'digital'
            ]
            
            keyword_score = sum(1 for word in words if word in novelty_keywords)
            keyword_bonus = min(20, keyword_score * 2)
            
            # Base score from uniqueness
            uniqueness_score = (unique_words / max(total_words, 1)) * 60
            
            # Length bonus for detailed descriptions
            length_bonus = min(15, len(combined_text) / 100)
            
            # Combine scores
            novelty_score = min(95.0, max(5.0, uniqueness_score + keyword_bonus + length_bonus))
            
            # Equal contributions for fallback
            node_contributions = {name: 1.0/len(project_details) for name in project_details.keys()}
            
            return round(novelty_score, 2), node_contributions
            
        except Exception as e:
            logger.error(f"Fallback prediction failed: {e}")
            return 50.0, {}

class ExplanationGenerator:
    """Generates human-readable explanations and comments"""
    
    def __init__(self):
        pass
    
    def generate_explanation(self, novelty_score: float, node_contributions: Dict[str, float], 
                           similar_count: int) -> str:
        """Generate explanation for the novelty score"""
        try:
            # Find most important nodes
            sorted_nodes = sorted(node_contributions.items(), key=lambda x: x[1], reverse=True)
            top_contributors = sorted_nodes[:3]
            
            if novelty_score >= 80:
                base_msg = "This project demonstrates high novelty"
            elif novelty_score >= 60:
                base_msg = "This project shows moderate novelty"
            elif novelty_score >= 40:
                base_msg = "This project has limited novelty"
            else:
                base_msg = "This project shows low novelty"
            
            # Format contributor names nicely
            contributor_names = [name.replace('_', ' ').title() for name, _ in top_contributors]
            contributor_msg = f"Key contributing factors: {', '.join(contributor_names)}"
            
            similarity_msg = ""
            if similar_count > 0:
                similarity_msg = f" Found {similar_count} similar approaches in previous projects."
            
            return f"{base_msg}. {contributor_msg}.{similarity_msg}"
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return f"Novelty score: {novelty_score}%. Analysis completed."
    
    def generate_comment(self, novelty_score: float, total_sections: int, 
                        similar_count: int, node_contributions: Dict[str, float]) -> str:
        """Generate detailed comment for the novelty analysis"""
        try:
            changeable_pct = max(0, 100 - novelty_score)
            
            # Analyze contributions
            sorted_nodes = sorted(node_contributions.items(), key=lambda x: x[1], reverse=True)
            top_contributor = sorted_nodes[0][0].replace('_', ' ').title() if sorted_nodes else "Unknown"
            
            # Generate score summary
            if novelty_score >= 85:
                summary = f"Excellent novelty score of {novelty_score}%. The project demonstrates strong innovative potential with well-defined unique approaches."
            elif novelty_score >= 70:
                summary = f"Good novelty score of {novelty_score}%. The project shows promising innovation with some areas for enhancement."
            elif novelty_score >= 50:
                summary = f"Moderate novelty score of {novelty_score}%. The project has innovative elements but requires strengthening of unique aspects."
            else:
                summary = f"Low novelty score of {novelty_score}%. The project needs significant enhancement to demonstrate clear innovation."
            
            # Generate recommendations
            recommendations = []
            if novelty_score < 70:
                recommendations.extend([
                    "Emphasize unique methodological approaches and distinguish from existing solutions",
                    "Provide detailed technical specifications and innovative implementation strategies",
                    "Include comprehensive literature review highlighting gaps your project addresses"
                ])
            else:
                recommendations.extend([
                    "Document validation plans and pilot testing approaches to strengthen innovation claims",
                    "Prepare intellectual property considerations and potential commercialization pathways",
                    "Develop detailed dissemination strategy for sharing novel findings with the research community"
                ])
            
            # Similar content warning
            similar_warning = ""
            if similar_count > 5:
                similar_warning = f" Note: {similar_count} similar content sections found - review for uniqueness."
            
            comment = f"""Score: {novelty_score}/100 Changeable: {changeable_pct}%
{summary} {top_contributor} contributes most significantly to the novelty assessment.{similar_warning}
Recommended actions:
- {recommendations[0]}
- {recommendations[1]}
- {recommendations[2]}"""
            
            return comment
            
        except Exception as e:
            logger.error(f"Comment generation failed: {e}")
            return f"Score: {novelty_score}/100 - Analysis completed with limited commentary."

class SimilarityAnalyzer:
    """Analyzes similarity with past projects and content"""
    
    def __init__(self, embedder_loader: EmbedderLoader):
        self.embedder_loader = embedder_loader
        self.past_projects_cache = {}
    
    def find_similar_lines(self, project_details: Dict[str, str], 
                          max_results: int = 25, similarity_threshold: float = 0.6) -> List[SimilarLine]:
        """Find similar lines in project details compared to past projects"""
        try:
            similar_lines = []
            
            # Get all text content from project details
            all_texts = []
            text_sources = []
            
            for section_name, content in project_details.items():
                if content and str(content).strip():
                    # Split content into sentences
                    sentences = self._split_into_sentences(str(content))
                    for i, sentence in enumerate(sentences):
                        if len(sentence.strip()) > 20:  # Only meaningful sentences
                            all_texts.append(sentence.strip())
                            text_sources.append({
                                'section': section_name,
                                'sentence_index': i,
                                'full_text': sentence
                            })
            
            # Load past projects for comparison
            past_data = self._load_past_projects()
            
            if not past_data or not all_texts:
                return []
            
            # Compare each text segment
            for idx, (text, source) in enumerate(zip(all_texts, text_sources)):
                best_match = self._find_best_match(text, past_data, similarity_threshold)
                
                if best_match:
                    similar_line = SimilarLine(
                        line_number=idx + 1,
                        text=text[:300],  # Truncate for display
                        best_match_file=best_match['file'],
                        similarity=best_match['similarity'],
                        matched_excerpt=best_match['excerpt'][:200]
                    )
                    similar_lines.append(similar_line)
            
            # Sort by similarity and return top results
            similar_lines.sort(key=lambda x: x.similarity, reverse=True)
            return similar_lines[:max_results]
            
        except Exception as e:
            logger.error(f"Similar line analysis failed: {e}")
            return []
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _load_past_projects(self) -> List[Dict[str, Any]]:
        """Load past projects from database for comparison"""
        try:
            # Try to load from Supabase
            response = supabase.table('novelty_reports').select('filename, result').limit(100).execute()
            
            past_data = []
            if response.data:
                for row in response.data:
                    result = row.get('result', {})
                    if isinstance(result, dict):
                        # Extract text content for comparison
                        text_content = []
                        
                        # Get unique sections if available
                        unique_sections = result.get('unique_sections', [])
                        if unique_sections:
                            text_content.extend(unique_sections)
                        
                        # Get raw text snippet
                        raw_text = result.get('raw_text', '')
                        if raw_text:
                            text_content.append(raw_text[:1000])
                        
                        if text_content:
                            past_data.append({
                                'filename': row.get('filename', 'unknown'),
                                'content': text_content
                            })
            
            return past_data
            
        except Exception as e:
            logger.warning(f"Failed to load past projects: {e}")
            return []
    
    def _find_best_match(self, text: str, past_data: List[Dict], threshold: float) -> Optional[Dict[str, Any]]:
        """Find best matching content from past data"""
        try:
            best_match = None
            best_similarity = 0.0
            
            for project in past_data:
                for content in project['content']:
                    # Simple similarity using embeddings if available
                    similarity = self._calculate_similarity(text, content)
                    
                    if similarity > best_similarity and similarity >= threshold:
                        best_similarity = similarity
                        best_match = {
                            'file': project['filename'],
                            'similarity': round(similarity, 3),
                            'excerpt': content
                        }
            
            return best_match
            
        except Exception as e:
            logger.error(f"Best match calculation failed: {e}")
            return None
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        try:
            if self.embedder_loader.embedder_type == "SBERT":
                embeddings = self.embedder_loader.encode_texts([text1, text2])
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(similarity)
            else:
                # Fallback to simple word overlap
                words1 = set(text1.lower().split())
                words2 = set(text2.lower().split())
                intersection = len(words1.intersection(words2))
                union = len(words1.union(words2))
                return intersection / union if union > 0 else 0.0
        except Exception:
            return 0.0

class ResultFormatter:
    """Formats results for API response"""
    
    def format_result(self, novelty_score: float, node_contributions: Dict[str, float],
                     similar_lines: List[SimilarLine], explanation: str, comment: str,
                     metadata: Dict[str, Any]) -> NoveltyResult:
        """Format complete result structure"""
        try:
            # Convert similar_lines to dict format
            similar_lines_dict = [asdict(line) for line in similar_lines]
            
            confidence_score = self._calculate_confidence(novelty_score, node_contributions)
            
            return NoveltyResult(
                novelty_percentage=novelty_score,
                model_version=metadata.get("model_version", "unknown"),
                node_contributions=node_contributions,
                top_similar_past_items=[],  # Will be populated by similarity analyzer
                timestamp=datetime.now().isoformat(),
                confidence_score=confidence_score,
                explanation=explanation,
                similar_lines=similar_lines_dict,
                similar_count=len(similar_lines),
                comment=comment
            )
            
        except Exception as e:
            logger.error(f"Result formatting failed: {e}")
            return NoveltyResult(
                novelty_percentage=novelty_score,
                model_version="error",
                node_contributions=node_contributions,
                top_similar_past_items=[],
                timestamp=datetime.now().isoformat(),
                confidence_score=0.5,
                explanation=f"Error in result formatting: {str(e)}",
                similar_lines=[],
                similar_count=0,
                comment=f"Score: {novelty_score}/100 - Analysis completed with errors."
            )
    
    def _calculate_confidence(self, novelty_score: float, node_contributions: Dict[str, float]) -> float:
        """Calculate confidence score based on various factors"""
        try:
            if not node_contributions:
                return 0.5
            
            contributions = list(node_contributions.values())
            contribution_std = np.std(contributions) if contributions else 0
            
            # Base confidence from score stability
            score_confidence = 0.7 if 30 <= novelty_score <= 90 else 0.5
            
            # Contribution distribution confidence
            dist_confidence = min(0.3, contribution_std * 3)
            
            confidence = min(0.95, max(0.3, score_confidence + dist_confidence))
            return round(confidence, 3)
            
        except Exception:
            return 0.5

class PersistenceManager:
    """Handles data persistence to Supabase"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    async def save_analysis_result(self, result: NoveltyResult, project_id: str) -> bool:
        """Save novelty analysis result to database"""
        try:
            db_data = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "filename": f"gnn_analysis_{project_id}",
                "novelty_percentage": result.novelty_percentage,
                "result": {
                    "novelty_percentage": result.novelty_percentage,
                    "model_version": result.model_version,
                    "node_contributions": result.node_contributions,
                    "confidence_score": result.confidence_score,
                    "explanation": result.explanation,
                    "similar_lines": result.similar_lines,
                    "similar_count": result.similar_count,
                    "comment": result.comment,
                    "timestamp": result.timestamp
                },
                "created_at": datetime.now().isoformat()
            }
            
            response = self.supabase.table("novelty_reports").insert(db_data).execute()
            
            if response.data:
                logger.info(f"Analysis result saved for project {project_id}")
                return True
            else:
                logger.error("Failed to save analysis result")
                return False
                
        except Exception as e:
            logger.error(f"Database save error: {e}")
            return False
    
    async def upload_raw_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        """Upload raw result JSON to storage bucket"""
        try:
            project_id = result_data.get("project_id", str(uuid.uuid4()))
            filename = f"gnn_result_{project_id}_{int(datetime.now().timestamp())}.json"
            
            json_content = json.dumps(result_data, indent=2, default=str).encode('utf-8')
            
            response = self.supabase.storage.from_(JSON_BUCKET).upload(
                filename,
                json_content,
                {"content-type": "application/json"}
            )
            
            if response:
                public_url = self.supabase.storage.from_(JSON_BUCKET).get_public_url(filename)
                logger.info(f"Raw result uploaded: {public_url}")
                return public_url
            
        except Exception as e:
            logger.error(f"Storage upload error: {e}")
        
        return None

# ======================================
# MAIN NOVELTY AGENT
# ======================================

class NoveltyAgent:
    """Main agent orchestrating the complete novelty analysis workflow"""
    
    def __init__(self):
        self.model_loader = ModelLoader()
        self.gnn_inference = None
        self.explanation_generator = ExplanationGenerator()
        self.similarity_analyzer = None
        self.result_formatter = ResultFormatter()
        self.persistence = PersistenceManager(supabase)
        
        # Lazy loading flag
        self._initialized = False
        self._initialization_error = None
    
    def _initialize(self) -> bool:
        """Initialize the agent components (lazy loading)"""
        if self._initialized:
            return True
        
        if self._initialization_error:
            return False
        
        try:
            # Try to load GNN model first
            if self.model_loader.load_model():
                self.gnn_inference = GNNInference(self.model_loader)
                self.similarity_analyzer = SimilarityAnalyzer(self.model_loader.embedder_loader)
                logger.info("GNN model initialized successfully")
            else:
                # Fall back to SBERT-only mode
                if self.model_loader.load_fallback():
                    self.gnn_inference = GNNInference(self.model_loader)
                    self.similarity_analyzer = SimilarityAnalyzer(self.model_loader.embedder_loader)
                    logger.info("Fallback model initialized successfully")
                else:
                    raise Exception("All model loading attempts failed")
            
            self._initialized = True
            return True
            
        except Exception as e:
            self._initialization_error = str(e)
            logger.error(f"Agent initialization failed: {e}")
            return False
    
    def validate_input(self, project_json: Dict[str, Any]) -> Dict[str, str]:
        """Validate and extract project_details from input JSON"""
        try:
            # Extract project_details
            if "project_details" not in project_json:
                raise ValueError("Missing 'project_details' in input JSON")
            
            project_details = project_json["project_details"]
            
            if not isinstance(project_details, dict):
                raise ValueError("'project_details' must be a dictionary")
            
            # Clean and validate each field
            cleaned_details = {}
            required_fields = [
                "definition_of_issue", "objectives", "justification_subject_area",
                "project_benefits", "work_plan", "methodology", 
                "organization_of_work", "time_schedule", "foreign_exchange_details"
            ]
            
            for field in required_fields:
                value = project_details.get(field)
                if value and str(value).strip() and str(value).strip().lower() not in ['null', 'none', '']:
                    cleaned_details[field] = str(value).strip()
                else:
                    cleaned_details[field] = f"No {field.replace('_', ' ')} provided"
            
            # Add any additional fields that might be present
            for key, value in project_details.items():
                if key not in cleaned_details and value and str(value).strip():
                    cleaned_details[key] = str(value).strip()
            
            if len(cleaned_details) == 0:
                raise ValueError("No valid project details found")
            
            logger.info(f"Validated project details with {len(cleaned_details)} fields")
            return cleaned_details
            
        except Exception as e:
            logger.error(f"Input validation failed: {e}")
            raise ValueError(f"Invalid input format: {str(e)}")
    
    async def analyze_novelty(self, project_json: Dict[str, Any]) -> NoveltyResult:
        """
        Main workflow function implementing the complete agent process
        
        Steps:
        A: validate_input(project_json)
        B: graph = graph_builder.build(project_json)  
        C: model, embedder = model_loader.load_model()
        D: score = inference_engine.predict(graph)
        E: explain = explanation.generate(graph, model)
        F: result = formatter.format(score, explain)
        """
        try:
            # Step A: Validate input
            project_details = self.validate_input(project_json)
            logger.info(f"Step A: Input validated - {len(project_details)} fields")
            
            # Step B & C: Initialize if needed (includes graph builder and model loading)
            if not self._initialize():
                raise Exception(f"Agent initialization failed: {self._initialization_error}")
            logger.info("Step B & C: Models and graph builder ready")
            
            # Step D: Run inference
            novelty_score, node_contributions = self.gnn_inference.predict_novelty(project_details)
            logger.info(f"Step D: Inference complete - Score: {novelty_score}%")
            
            # Additional analysis: Find similar lines
            similar_lines = self.similarity_analyzer.find_similar_lines(project_details)
            
            # Step E: Generate explanation and comment
            explanation = self.explanation_generator.generate_explanation(
                novelty_score, node_contributions, len(similar_lines)
            )
            comment = self.explanation_generator.generate_comment(
                novelty_score, len(project_details), len(similar_lines), node_contributions
            )
            logger.info("Step E: Explanation and comment generated")
            
            # Step F: Format result
            result = self.result_formatter.format_result(
                novelty_score, node_contributions, similar_lines, 
                explanation, comment, self.model_loader.metadata
            )
            logger.info("Step F: Result formatted successfully")
            
            return result
            
        except Exception as e:
            logger.error(f"Novelty analysis failed: {e}")
            logger.error(traceback.format_exc())
            
            # Return error result
            return NoveltyResult(
                novelty_percentage=0.0,
                model_version="error",
                node_contributions={},
                top_similar_past_items=[],
                timestamp=datetime.now().isoformat(),
                confidence_score=0.0,
                explanation=f"Analysis failed: {str(e)}",
                similar_lines=[],
                similar_count=0,
                comment=f"Score: 0/100 - Analysis failed due to: {str(e)}"
            )

# ======================================
# GLOBAL AGENT INSTANCE
# ======================================

_GLOBAL_AGENT = None

def get_novelty_agent() -> NoveltyAgent:
    """Get or create the global novelty agent instance (lazy loading)"""
    global _GLOBAL_AGENT
    if _GLOBAL_AGENT is None:
        _GLOBAL_AGENT = NoveltyAgent()
    return _GLOBAL_AGENT

# ======================================
# FASTAPI ROUTES
# ======================================

# ======================================
# HELPER FUNCTIONS FOR FILE PROCESSING
# ======================================

def extract_pdf_text_from_bytes(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes"""
    try:
        import PyPDF2
        from io import BytesIO
        
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text from bytes: {e}")
        return ""

def generate_professional_comment(novelty_percentage: float, project_details: Dict[str, str], 
                                similar_lines: List[Dict], node_contributions: Dict[str, float]) -> str:
    """Generate a professional comment like the example provided"""
    
    try:
        # Extract key project elements for comment
        methodology = project_details.get('methodology', '')
        definition_issue = project_details.get('definition_of_issue', '')
        objectives = project_details.get('objectives', '')
        
        # Determine project focus based on content
        project_focus = "research proposal"
        if "coal" in (methodology + definition_issue).lower():
            project_focus = "coal-related innovation"
        elif "energy" in (methodology + definition_issue).lower():
            project_focus = "energy technology"
        elif "waste" in (methodology + definition_issue).lower():
            project_focus = "waste management solution"
        
        # Generate assessment based on novelty percentage
        if novelty_percentage >= 80:
            assessment = f"The proposal introduces a highly innovative {project_focus} with significant novel elements. The approach demonstrates genuine originality and should be strongly prioritised for implementation."
            priority = "strongly prioritised"
        elif novelty_percentage >= 65:
            assessment = f"The proposal presents a novel {project_focus} with meaningful innovative components. The approach appears genuinely novel and should be prioritised for further validation."
            priority = "prioritised"
        elif novelty_percentage >= 45:
            assessment = f"The proposal shows moderate novelty in its {project_focus} approach. While containing some innovative elements, further development is needed to enhance its distinctive contribution."
            priority = "considered for development"
        else:
            assessment = f"The proposal demonstrates limited novelty in its {project_focus}. Significant overlap with existing work suggests need for substantial revision to establish clear innovative contribution."
            priority = "requires major revision"
        
        # Generate recommendations based on analysis
        recommendations = []
        
        if len(similar_lines) > 5:
            recommendations.append("Document prior art and clearly highlight novel integration steps versus published work.")
        
        if novelty_percentage < 70:
            recommendations.append("Provide detailed comparison with existing approaches to substantiate claimed innovations.")
        
        if "pilot" in (methodology + objectives).lower() or "test" in (methodology + objectives).lower():
            recommendations.append("Provide pilot test plans and small-scale validation data to substantiate claimed innovations.")
        else:
            recommendations.append("Include experimental validation or proof-of-concept data to support technical feasibility.")
        
        recommendations.append("Include IP or patent landscape notes where applicable to strengthen novelty claims.")
        
        if novelty_percentage < 50:
            recommendations.append("Conduct comprehensive literature review to identify and address overlapping elements.")
        
        # Format final comment
        comment_parts = [assessment]
        
        if recommendations:
            comment_parts.append("\nRecommended actions:")
            for rec in recommendations:
                comment_parts.append(f"• {rec}")
        
        return "\n".join(comment_parts)
        
    except Exception as e:
        logger.error(f"Error generating professional comment: {e}")
        return f"The proposal shows {novelty_percentage:.1f}% novelty. Further analysis recommended to assess innovation potential and identify areas for development."

def format_flagged_lines(similar_lines: List[Dict], full_text: str) -> List[Dict[str, Any]]:
    """Format similar lines into flagged lines with line numbers"""
    
    try:
        flagged_lines = []
        text_lines = full_text.split('\n')
        
        for idx, sim_line in enumerate(similar_lines[:10]):  # Limit to top 10 flagged lines
            try:
                line_text = sim_line.get('text', '')
                similarity = sim_line.get('similarity', 0)
                source = sim_line.get('best_match_file', 'Unknown source')
                
                # Find approximate line number in original text
                line_number = None
                for i, text_line in enumerate(text_lines):
                    if line_text[:50] in text_line or text_line[:50] in line_text:
                        line_number = i + 1
                        break
                
                if line_number is None:
                    line_number = idx + 1  # Fallback line number
                
                # Clean and truncate line text
                clean_text = line_text.strip()[:200]
                if len(line_text) > 200:
                    clean_text += "..."
                
                flagged_line = {
                    "line_number": line_number,
                    "text": clean_text,
                    "similarity_score": round(float(similarity), 3),
                    "source": source
                }
                
                flagged_lines.append(flagged_line)
                
            except Exception as e:
                logger.warning(f"Error processing similar line {idx}: {e}")
                continue
        
        return flagged_lines
        
    except Exception as e:
        logger.error(f"Error formatting flagged lines: {e}")
        return []

# ======================================
# FASTAPI ROUTES
# ======================================

router = APIRouter()

@router.post("/analyze-novelty")
async def analyze_novelty_from_file(file: UploadFile = File(...)):
    """
    Upload a file and get novelty analysis with percentage, detailed comment, and flagged lines
    
    Returns:
    {
        "novelty_percentage": float,
        "comment": "Detailed analysis with recommendations...",
        "flagged_lines": [
            {
                "line_number": int,
                "text": "flagged content...",
                "similarity_score": float,
                "source": "similar document"
            }
        ]
    }
    """
    try:
        # Step 1: Extract text from uploaded file
        filename = file.filename
        file_bytes = await file.read()
        
        # Extract text based on file type
        extracted_text = ""
        if filename.lower().endswith('.pdf'):
            extracted_text = extract_pdf_text_from_bytes(file_bytes)
        elif filename.lower().endswith(('.txt', '.docx')):
            from Json_extraction.extractor import extract_text
            extracted_text = extract_text(filename, file_bytes)
        else:
            return JSONResponse(
                content={
                    "error": "Unsupported file type. Please upload PDF, TXT, or DOCX files.",
                    "novelty_percentage": 0.0,
                    "comment": "File format not supported for analysis.",
                    "flagged_lines": []
                },
                status_code=400
            )
        
        if not extracted_text.strip():
            return JSONResponse(
                content={
                    "error": "No text could be extracted from the file.",
                    "novelty_percentage": 0.0,
                    "comment": "Unable to extract readable content from the uploaded file.",
                    "flagged_lines": []
                },
                status_code=400
            )
        
        # Step 2: Extract project details
        project_details = extract_project_details_from_text(extracted_text)
        
        # Step 3: Create project JSON for analysis
        project_json = {
            'form_type': 'Research Proposal',
            'project_details': project_details
        }
        
        # Step 4: Run novelty analysis
        agent = get_novelty_agent()
        result = await agent.analyze_novelty(project_json)
        
        # Step 5: Generate detailed professional comment
        professional_comment = generate_professional_comment(
            result.novelty_percentage, 
            project_details, 
            result.similar_lines,
            result.node_contributions
        )
        
        # Step 6: Format flagged lines
        flagged_lines = format_flagged_lines(result.similar_lines, extracted_text)
        
        # Step 7: Return the specific format requested
        response_data = {
            "novelty_percentage": round(result.novelty_percentage, 1),
            "comment": professional_comment,
            "flagged_lines": flagged_lines
        }
        
        logger.info(f"Novelty analysis completed: {result.novelty_percentage}% for file {filename}")
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"File analysis failed: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            content={
                "error": f"Analysis failed: {str(e)}",
                "novelty_percentage": 0.0,
                "comment": f"Technical error occurred during analysis: {str(e)}",
                "flagged_lines": []
            },
            status_code=500
        )

# ======================================
# PDF PROCESSING AND NOVELTY ANALYSIS
# ======================================

def extract_pdf_text(pdf_path: str) -> str:
    """Extract text from PDF file"""
    try:
        import PyPDF2
        from io import BytesIO
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""

def extract_project_details_from_text(text: str) -> Dict[str, Any]:
    """
    Extract key project details from extracted text using pattern matching
    Focuses on methodology, definition of issue, objectives, and justification
    """
    project_details = {}
    
    try:
        import re
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Define patterns for key sections
        patterns = {
            'definition_of_issue': [
                r'DEFINITION\s+OF\s+ISSUE[:\s]*([^A-Z]{50,500})',
                r'Problem\s+Statement[:\s]*([^A-Z]{50,500})',
                r'Issue\s+Definition[:\s]*([^A-Z]{50,500})',
                r'PROBLEM[:\s]*([^A-Z]{50,500})'
            ],
            'objectives': [
                r'OBJECTIVES?[:\s]*([^A-Z]{50,500})',
                r'AIMS?\s+AND\s+OBJECTIVES?[:\s]*([^A-Z]{50,500})',
                r'PROJECT\s+OBJECTIVES?[:\s]*([^A-Z]{50,500})',
                r'GOALS?[:\s]*([^A-Z]{50,500})'
            ],
            'justification_subject_area': [
                r'JUSTIFICATION\s+OF\s+SUBJECT\s+AREA[:\s]*([^A-Z]{50,500})',
                r'JUSTIFICATION[:\s]*([^A-Z]{50,500})',
                r'RATIONALE[:\s]*([^A-Z]{50,500})',
                r'Subject\s+Area\s+Justification[:\s]*([^A-Z]{50,500})'
            ],
            'methodology': [
                r'METHODOLOGY[:\s]*([^A-Z]{50,800})',
                r'APPROACH[:\s]*([^A-Z]{50,500})',
                r'METHOD[:\s]*([^A-Z]{50,500})',
                r'TECHNICAL\s+APPROACH[:\s]*([^A-Z]{50,500})'
            ],
            'project_benefits': [
                r'PROJECT\s+BENEFITS[:\s]*([^A-Z]{50,500})',
                r'BENEFITS[:\s]*([^A-Z]{50,500})',
                r'EXPECTED\s+OUTCOMES[:\s]*([^A-Z]{50,500})',
                r'IMPACT[:\s]*([^A-Z]{50,500})'
            ],
            'work_plan': [
                r'WORK\s+PLAN[:\s]*([^A-Z]{50,500})',
                r'PROJECT\s+PLAN[:\s]*([^A-Z]{50,500})',
                r'IMPLEMENTATION\s+PLAN[:\s]*([^A-Z]{50,500})'
            ],
            'time_schedule': [
                r'TIME\s+SCHEDULE[:\s]*([^A-Z]{50,500})',
                r'TIMELINE[:\s]*([^A-Z]{50,500})',
                r'PROJECT\s+DURATION[:\s]*([^A-Z]{50,500})',
                r'SCHEDULE[:\s]*([^A-Z]{50,500})'
            ]
        }
        
        # Extract information using patterns
        for field, field_patterns in patterns.items():
            extracted_text = ""
            for pattern in field_patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    candidate = match.group(1).strip()
                    if len(candidate) > len(extracted_text):
                        extracted_text = candidate
            
            # Clean extracted text
            if extracted_text:
                extracted_text = re.sub(r'\s+', ' ', extracted_text).strip()
                extracted_text = extracted_text[:500]  # Limit length
                project_details[field] = extracted_text
            else:
                # Fallback: extract surrounding context
                project_details[field] = f"Information to be extracted from {field.replace('_', ' ')}"
        
        # If no patterns matched, create basic structure from available text
        if not any(project_details.values()):
            words = text.split()
            chunk_size = min(100, len(words) // 4)
            
            project_details = {
                'definition_of_issue': ' '.join(words[:chunk_size]) if len(words) > chunk_size else text[:200],
                'objectives': ' '.join(words[chunk_size:chunk_size*2]) if len(words) > chunk_size*2 else "Extract research objectives",
                'justification_subject_area': ' '.join(words[chunk_size*2:chunk_size*3]) if len(words) > chunk_size*3 else "Justify the research area",
                'methodology': ' '.join(words[chunk_size*3:]) if len(words) > chunk_size*3 else "Research methodology to be analyzed",
                'project_benefits': "Benefits and expected outcomes from the research",
                'work_plan': "Detailed work plan and implementation strategy",
                'time_schedule': "Project timeline and milestones"
            }
        
        logger.info(f"Extracted {len(project_details)} project detail fields")
        return project_details
        
    except Exception as e:
        logger.error(f"Error extracting project details: {e}")
        return {
            'definition_of_issue': "Failed to extract issue definition",
            'objectives': "Failed to extract objectives", 
            'justification_subject_area': "Failed to extract justification",
            'methodology': "Failed to extract methodology"
        }

async def analyze_pdf_novelty(pdf_path: str = None) -> Dict[str, Any]:
    """
    Complete pipeline: Extract PDF content and analyze novelty
    Focuses on methodology, definition of issue, objectives, and justification
    """
    start_time = datetime.now()
    
    try:
        # Use default path if not provided
        if pdf_path is None:
            pdf_path = r"c:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\data_files\FORM-I_NEW.pdf"
        
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        logger.info(f"Starting PDF novelty analysis for: {pdf_path}")
        
        # Step 1: Extract text from PDF
        logger.info("Step 1: Extracting text from PDF...")
        extracted_text = extract_pdf_text(pdf_path)
        
        if not extracted_text.strip():
            raise ValueError("No text could be extracted from PDF")
        
        logger.info(f"Extracted {len(extracted_text)} characters from PDF")
        
        # Step 2: Extract structured project details
        logger.info("Step 2: Extracting project details...")
        project_details = extract_project_details_from_text(extracted_text)
        
        # Step 3: Create project JSON in expected format
        project_json = {
            'form_type': 'FORM-I S&T Grant Proposal',
            'project_details': project_details
        }
        
        logger.info("Step 3: Running novelty analysis...")
        
        # Step 4: Run novelty analysis
        agent = get_novelty_agent()
        result = await agent.analyze_novelty(project_json)
        
        # Step 5: Format comprehensive output
        processing_time = (datetime.now() - start_time).total_seconds()
        
        output = {
            "=== PDF NOVELTY ANALYSIS RESULTS ===": "",
            "file_path": pdf_path,
            "processing_time_seconds": processing_time,
            "extracted_text_length": len(extracted_text),
            "": "",
            "PROJECT DETAILS EXTRACTED:": "",
            "definition_of_issue": project_details.get('definition_of_issue', 'Not found'),
            "objectives": project_details.get('objectives', 'Not found'), 
            "justification_subject_area": project_details.get('justification_subject_area', 'Not found'),
            "methodology": project_details.get('methodology', 'Not found'),
            " ": "",
            "NOVELTY ANALYSIS RESULTS:": "",
            "novelty_percentage": f"{result.novelty_percentage:.2f}%",
            "confidence_score": f"{result.confidence_score:.2f}",
            "model_version": result.model_version,
            "timestamp": result.timestamp,
            "  ": "",
            "ANALYSIS COMMENT:": "",
            "comment": result.comment,
            "   ": "",
            "DETAILED EXPLANATION:": "",
            "explanation": result.explanation,
            "    ": "",
            "SIMILARITY ANALYSIS:": "",
            "similar_lines_found": result.similar_count,
            "top_similar_lines": result.similar_lines[:3] if result.similar_lines else [],
            "     ": "",
            "NODE CONTRIBUTIONS:": "",
            "field_contributions": dict(sorted(
                result.node_contributions.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]) if result.node_contributions else {}
        }
        
        # Print results to console
        print("\n" + "="*60)
        print("PDF NOVELTY ANALYSIS RESULTS")
        print("="*60)
        print(f"File: {pdf_path}")
        print(f"Processing time: {processing_time:.2f} seconds")
        print()
        
        print("PROJECT DETAILS EXTRACTED:")
        print("-" * 30)
        for key, value in project_details.items():
            print(f"{key.replace('_', ' ').title()}:")
            print(f"  {value[:200]}{'...' if len(value) > 200 else ''}")
            print()
        
        print("NOVELTY ANALYSIS:")
        print("-" * 30)
        print(f"Novelty Percentage: {result.novelty_percentage:.2f}%")
        print(f"Confidence Score: {result.confidence_score:.2f}")
        print(f"Model Version: {result.model_version}")
        print()
        
        print("Comment:")
        print(f"  {result.comment}")
        print()
        
        print("Explanation:")
        print(f"  {result.explanation}")
        print()
        
        if result.similar_lines:
            print(f"Similar Lines Found: {result.similar_count}")
            print("Top similar lines:")
            for i, sim_line in enumerate(result.similar_lines[:3]):
                similarity = sim_line.get('similarity', 0)
                text = sim_line.get('text', '')
                source = sim_line.get('best_match_file', 'Unknown')
                print(f"  {i+1}. Similarity: {similarity:.2f}")
                print(f"     Text: {text[:100]}...")
                print(f"     Source: {source}")
                print()
        
        if result.node_contributions:
            print("Top Contributing Fields:")
            sorted_contributions = sorted(
                result.node_contributions.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            for field, contribution in sorted_contributions[:5]:
                print(f"  {field}: {contribution:.3f}")
        
        print("="*60)
        
        return output
        
    except Exception as e:
        error_msg = f"PDF novelty analysis failed: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        
        print(f"\nError: {error_msg}")
        
        return {
            "error": error_msg,
            "file_path": pdf_path,
            "novelty_percentage": 0.0,
            "comment": f"Score: 0/100 - Analysis failed: {str(e)}"
        }

# ======================================
# MAIN EXECUTION FUNCTION
# ======================================

async def run_pdf_analysis():
    """Main function to run PDF analysis - can be called directly"""
    return await analyze_pdf_novelty()

# For direct script execution
if __name__ == "__main__":
    import asyncio
    
    print("Starting PDF Novelty Analysis...")
    result = asyncio.run(analyze_pdf_novelty())
    
    # Save results to file
    output_file = os.path.join(os.path.dirname(__file__), "novelty_analysis_output.json")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed results saved to: {output_file}")
    except Exception as e:
        print(f"Could not save results to file: {e}")
