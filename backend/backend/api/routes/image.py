"""
Route: /api/predict/image — CNN packaging image authentication
FIX Bug 1: ROOT corrected to 3 dirname levels (not 4)
"""

import os
import sys
import io
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File

# FIX Bug 1: 3 dirname levels to reach backend/
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from api.schemas.models import ImageResponse
from api.utils.loader import ModelStore

router = APIRouter()

IMG_SIZE = 64
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Resize and normalise an uploaded image to (1, 64, 64, 3)."""
    try:
        from PIL import Image
    except ImportError:
        raise HTTPException(status_code=500, detail="Pillow not installed. Run: pip install pillow")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # shape: (1, 64, 64, 3)


@router.post(
    "/predict/image",
    response_model=ImageResponse,
    summary="Authenticate packaging via CNN image analysis",
    tags=["Predictions"]
)
async def predict_image(file: UploadFile = File(...)):
    """
    Upload a packaging image (PNG or JPEG, any resolution — resized to 64x64 internally).
    Returns: CNN prediction (0=Genuine, 1=Counterfeit), confidence, and risk level.

    Note: CNN was trained on synthetic packaging images.
    Replace training data with real drug packaging photos for production use.
    """
    if not ModelStore.tf_available:
        raise HTTPException(
            status_code=503,
            detail="TensorFlow is not installed. CNN predictions are unavailable. Install with: pip install tensorflow"
        )
    if ModelStore.cnn_model is None:
        raise HTTPException(
            status_code=503,
            detail="CNN model not loaded. Run train.py first to generate trained_models/cnn_model.keras"
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Accepted: JPEG, PNG, WebP"
        )

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10 MB.")

    try:
        X = _preprocess_image(image_bytes)
        raw_confidence = float(ModelStore.cnn_model.predict(X, verbose=0)[0][0])

        prediction = 1 if raw_confidence >= 0.5 else 0
        confidence = raw_confidence if prediction == 1 else (1.0 - raw_confidence)
        confidence = round(confidence, 4)

        if confidence < 0.65:
            risk_level = "LOW"
        elif confidence < 0.85:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        return ImageResponse(
            prediction=prediction,
            label="COUNTERFEIT" if prediction == 1 else "GENUINE",
            confidence=confidence,
            risk_level=risk_level,
            note="CNN trained on synthetic images. Replace with real packaging data for production."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
