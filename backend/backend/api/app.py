"""
FastAPI Application — Pharma Authenticity & Supply Chain Security System
Entry point: uvicorn api.app:app --reload
"""

import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from api.utils.loader import ModelStore
from api.routes import batch, transaction, image
from api.schemas.models import HealthResponse, ModelInfoResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  Pharma Authenticity API — Starting up")
    logger.info("=" * 60)
    ModelStore.load_all()
    status = ModelStore.status()
    for model, loaded in status.items():
        icon = "✓" if loaded else "✗"
        logger.info(f"  [{icon}] {model}: {'LOADED' if loaded else 'NOT FOUND'}")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Pharma Authenticity API",
    description=(
        "AI-powered detection of counterfeit medicines and anomalies in drug distribution. "
        "Three models: Random Forest (batch classification), "
        "Isolation Forest (transaction anomaly detection), "
        "CNN (packaging image authentication)."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── FIX Bug 2: allow_credentials=True is incompatible with allow_origins=["*"].
# Development: use explicit localhost origins.
# Production: set ALLOWED_ORIGINS env var to your frontend domain.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(batch.router,       prefix="/api")
app.include_router(transaction.router, prefix="/api")
app.include_router(image.router,       prefix="/api")


@app.get("/api/health", response_model=HealthResponse, summary="API health check", tags=["System"])
def health():
    status = ModelStore.status()
    all_ok = any(status.values())
    return HealthResponse(
        status="ok" if all_ok else "degraded",
        models_loaded=status,
        version=APP_VERSION
    )


@app.get("/api/models/info", response_model=ModelInfoResponse, summary="Information about loaded models", tags=["System"])
def models_info():
    return ModelInfoResponse(models=[
        {
            "name":        "Random Forest Classifier",
            "task":        "Genuine vs Counterfeit batch classification",
            "endpoint":    "POST /api/predict/batch",
            "input":       "13 supply chain fields",
            "output":      "prediction (0/1), confidence, risk_level",
            "loaded":      ModelStore.rf_model is not None,
            "algorithm":   "200-tree Random Forest, class_weight=balanced",
            "performance": "Accuracy ~95%, ROC-AUC ~0.97 (5-fold CV)",
        },
        {
            "name":        "Isolation Forest",
            "task":        "Anomaly detection in distribution transactions",
            "endpoint":    "POST /api/predict/transaction",
            "input":       "8 transaction fields",
            "output":      "prediction (0/1), anomaly_score, risk_level",
            "loaded":      ModelStore.iso_model is not None,
            "algorithm":   "200-tree Isolation Forest, contamination=0.06",
            "performance": "ROC-AUC ~0.90 (5-fold CV)",
        },
        {
            "name":        "CNN (Convolutional Neural Network)",
            "task":        "Packaging image authentication",
            "endpoint":    "POST /api/predict/image",
            "input":       "Image file (PNG/JPEG, resized to 64x64)",
            "output":      "prediction (0/1), confidence, risk_level",
            "loaded":      ModelStore.cnn_model is not None,
            "algorithm":   "3-block Conv2D + Dense, sigmoid output",
            "performance": "Trained on synthetic images — replace with real data for production",
        },
    ])


@app.get("/", include_in_schema=False)
def root():
    return JSONResponse({"message": "Pharma Authenticity API", "docs": "/docs", "health": "/api/health"})
