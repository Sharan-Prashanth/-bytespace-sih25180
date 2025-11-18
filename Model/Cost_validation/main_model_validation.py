import os
import joblib
import numpy as np
from typing import Dict

MODEL_PATH = "Model/models/main_cost_model.joblib"


# ----------------------------------------------------
# Load ML model (Regression)
# ----------------------------------------------------
def load_main_model():
    if not os.path.exists(MODEL_PATH):
        print("⚠ main_cost_model.joblib NOT FOUND — ML validation disabled.")
        return None
    model = joblib.load(MODEL_PATH)
    print("✅ Main ML validation model loaded.")
    return model


main_model = load_main_model()


# ----------------------------------------------------
# Run ML prediction from project abstract text
# ----------------------------------------------------
def ml_predict_cost(abstract_text: str) -> float:
    if not main_model:
        return None
    pred = main_model.predict([abstract_text])[0]
    return float(pred)


# ----------------------------------------------------
# Validate LLM Cost using ML Cost
# ----------------------------------------------------
def validate_cost(llm_cost: float, ml_cost: float) -> Dict:
    """
    Returns structure:
    {
        "validation_status": "valid" | "warning" | "invalid",
        "difference_ratio": float,
        "final_cost": int
    }
    """

    if ml_cost is None:
        return {
            "validation_status": "model_missing",
            "difference_ratio": None,
            "final_cost": llm_cost
        }

    difference_ratio = abs(llm_cost - ml_cost) / (ml_cost + 1)

    # decision rules
    if difference_ratio <= 0.20:
        status = "valid"
        final_cost = int((0.6 * ml_cost) + (0.4 * llm_cost))  # blended best
    elif difference_ratio <= 0.40:
        status = "warning"
        final_cost = int(ml_cost)  # ML more stable
    else:
        status = "invalid"
        final_cost = int(ml_cost)

    return {
        "validation_status": status,
        "difference_ratio": round(difference_ratio, 4),
        "final_cost": final_cost,
        "llm_cost": llm_cost,
        "ml_cost": ml_cost
    }
