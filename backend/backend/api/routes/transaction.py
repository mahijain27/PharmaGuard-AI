"""
Route: /api/predict/transaction — Isolation Forest anomaly detection
FIX Bug 1: ROOT corrected to 3 dirname levels (not 4)
FIX Bug 6: no os.chdir() — absolute paths used in feature_engineering
"""

import os
import sys
from fastapi import APIRouter, HTTPException

# FIX Bug 1: 3 dirname levels to reach backend/
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from api.schemas.models import TransactionRequest, TransactionResponse, EngineeredTransactionFeatures
from api.utils.loader import ModelStore

router = APIRouter()


@router.post(
    "/predict/transaction",
    response_model=TransactionResponse,
    summary="Detect anomalies in a supply chain transaction",
    tags=["Predictions"]
)
def predict_transaction(request: TransactionRequest):
    """
    Submit distribution transaction data for a single record.
    Returns: prediction (0=Normal, 1=Anomaly), anomaly score, risk level,
    and all engineered features computed internally.
    """
    if ModelStore.iso_model is None:
        raise HTTPException(status_code=503, detail="Isolation Forest model not loaded. Run train.py first.")

    try:
        from preprocessing.feature_engineering import PharmaPreprocessor
        prep = PharmaPreprocessor()
        X_scaled, engineered = prep.transform_single_transaction(request.model_dump())
        result = ModelStore.iso_model.predict_single(X_scaled)

        return TransactionResponse(
            prediction=result["prediction"],
            label=result["label"],
            anomaly_score=result["anomaly_score"],
            risk_level=result["risk_level"],
            engineered_features=EngineeredTransactionFeatures(**engineered)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get(
    "/features/transaction",
    summary="List expected input fields for the transaction endpoint",
    tags=["Metadata"]
)
def transaction_features():
    return {
        "endpoint": "POST /api/predict/transaction",
        "model": "Isolation Forest (Anomaly Detection)",
        "fields": [
            {"name": "order_quantity",         "type": "float",   "note": "Normal: ~500 units"},
            {"name": "delivery_time_hours",    "type": "float",   "note": "Normal: ~24 hours"},
            {"name": "invoice_amount_usd",     "type": "float",   "note": "Normal: ~$10,000"},
            {"name": "return_rate_pct",        "type": "float",   "range": "0-100", "note": "Normal: ~2%"},
            {"name": "complaint_count",        "type": "integer", "note": "Normal: ~1"},
            {"name": "route_deviation_km",     "type": "float",   "note": "Normal: ~5 km"},
            {"name": "customs_clearance_days", "type": "float",   "note": "Normal: ~2 days"},
            {"name": "storage_temp_avg",       "type": "float",   "note": "Normal: ~5C"},
        ]
    }
