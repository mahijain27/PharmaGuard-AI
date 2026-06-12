"""
Route: /api/predict/batch — Random Forest batch classification
FIX Bug 1: ROOT corrected to 3 dirname levels (not 4)
FIX Bug 6: no os.chdir() — absolute paths used in feature_engineering
FIX Bug 7: removed unused StreamingResponse import
"""

import os
import sys
import io
import csv
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File

# FIX Bug 1: batch.py is at backend/api/routes/batch.py
# dirname x1 = backend/api/routes
# dirname x2 = backend/api
# dirname x3 = backend  <-- ROOT (correct, was 4 before)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from api.schemas.models import (
    BatchRequest, BatchResponse, EngineeredBatchFeatures,
    BulkResponse, BulkRowResult
)
from api.utils.loader import ModelStore

router = APIRouter()


def _run_batch_prediction(data: dict) -> dict:
    """Shared logic: transform raw dict → prediction dict. No os.chdir needed."""
    if ModelStore.rf_model is None:
        raise HTTPException(status_code=503, detail="Random Forest model not loaded. Run train.py first.")

    from preprocessing.feature_engineering import PharmaPreprocessor
    prep = PharmaPreprocessor()
    X_scaled, engineered = prep.transform_single_batch(data)
    result = ModelStore.rf_model.predict_single(X_scaled)
    result["engineered_features"] = engineered
    return result


@router.post(
    "/predict/batch",
    response_model=BatchResponse,
    summary="Classify a drug batch as Genuine or Counterfeit",
    tags=["Predictions"]
)
def predict_batch(request: BatchRequest):
    """
    Submit supply chain metadata for a single drug batch.
    Returns: prediction (0=Genuine, 1=Counterfeit), confidence score, risk level,
    and all engineered feature values computed internally.
    """
    try:
        result = _run_batch_prediction(request.model_dump())
        return BatchResponse(
            prediction=result["prediction"],
            label=result["label"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            engineered_features=EngineeredBatchFeatures(**result["engineered_features"])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post(
    "/predict/batch/bulk",
    response_model=BulkResponse,
    summary="Bulk classify drug batches from a CSV file",
    tags=["Predictions"]
)
async def predict_batch_bulk(file: UploadFile = File(...)):
    """
    Upload a CSV file with one batch record per row.
    Column headers must match the single-batch endpoint field names.
    Returns predictions for every row, plus an error message for any rows that fail.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    content = await file.read()
    text    = content.decode("utf-8")
    reader  = csv.DictReader(io.StringIO(text))

    results   = []
    processed = 0
    errors    = 0

    REQUIRED_FIELDS = [
        "supplier_id", "temperature_log", "humidity_log", "shipment_duration_days",
        "barcode_checksum_valid", "packaging_seal_intact", "expiry_date_format_valid",
        "label_language_count", "distributor_verified", "price_deviation_pct",
        "reorder_frequency", "lot_number_format_valid", "regulatory_approval_code"
    ]
    INT_FIELDS = {
        "supplier_id", "shipment_duration_days", "barcode_checksum_valid",
        "packaging_seal_intact", "expiry_date_format_valid", "label_language_count",
        "distributor_verified", "lot_number_format_valid", "regulatory_approval_code"
    }

    for i, row in enumerate(reader):
        try:
            typed = {}
            for f in REQUIRED_FIELDS:
                if f not in row:
                    raise ValueError(f"Missing column: {f}")
                typed[f] = int(row[f]) if f in INT_FIELDS else float(row[f])

            result = _run_batch_prediction(typed)
            results.append(BulkRowResult(
                row_index=i + 1,
                prediction=result["prediction"],
                label=result["label"],
                confidence=result["confidence"],
                risk_level=result["risk_level"],
            ))
            processed += 1
        except Exception as e:
            errors += 1
            results.append(BulkRowResult(
                row_index=i + 1,
                prediction=-1,
                label="ERROR",
                confidence=0.0,
                risk_level="UNKNOWN",
                error=str(e)
            ))

    return BulkResponse(
        total_rows=processed + errors,
        processed=processed,
        errors=errors,
        results=results
    )


@router.get(
    "/features/batch",
    summary="List expected input fields for the batch endpoint",
    tags=["Metadata"]
)
def batch_features():
    return {
        "endpoint": "POST /api/predict/batch",
        "model": "Random Forest Classifier",
        "fields": [
            {"name": "supplier_id",              "type": "integer", "range": "1-500",      "note": "1-20 = known suppliers"},
            {"name": "temperature_log",          "type": "float",   "range": "-20 to 50",  "note": "Cold chain: genuine ~5C"},
            {"name": "humidity_log",             "type": "float",   "range": "0-100",      "note": "Genuine: 30-60%"},
            {"name": "shipment_duration_days",   "type": "integer", "range": "1-180"},
            {"name": "barcode_checksum_valid",   "type": "integer", "range": "0 or 1"},
            {"name": "packaging_seal_intact",    "type": "integer", "range": "0 or 1"},
            {"name": "expiry_date_format_valid", "type": "integer", "range": "0 or 1"},
            {"name": "label_language_count",     "type": "integer", "range": "1-10"},
            {"name": "distributor_verified",     "type": "integer", "range": "0 or 1"},
            {"name": "price_deviation_pct",      "type": "float",   "range": "-100 to 100","note": "Negative = cheaper than market"},
            {"name": "reorder_frequency",        "type": "integer", "range": "1-200"},
            {"name": "lot_number_format_valid",  "type": "integer", "range": "0 or 1"},
            {"name": "regulatory_approval_code", "type": "integer", "range": "1-9999",     "note": "Genuine: 1000-9999"},
        ]
    }
