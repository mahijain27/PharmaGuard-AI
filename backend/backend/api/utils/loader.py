"""
Model Loader — loads all trained models at application startup.
Models are loaded once into memory and reused for every request.
"""

import os
import sys
import joblib
import logging

# Ensure project root is in path
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────
RF_MODEL_PATH  = os.path.join(ROOT, "trained_models", "random_forest_model.pkl")
ISO_MODEL_PATH = os.path.join(ROOT, "trained_models", "isolation_forest_model.pkl")
CNN_MODEL_PATH = os.path.join(ROOT, "trained_models", "cnn_model.keras")
SCALER_CLASS_PATH  = os.path.join(ROOT, "trained_models", "scaler_classification.pkl")
IMPUTER_CLASS_PATH = os.path.join(ROOT, "trained_models", "imputer_classification.pkl")
SCALER_ANOM_PATH   = os.path.join(ROOT, "trained_models", "scaler_anomaly.pkl")


class ModelStore:
    """Singleton container for all loaded models and preprocessors."""

    rf_model   = None   # RandomForestAuthenticator instance
    iso_model  = None   # DistributionAnomalyDetector instance
    cnn_model  = None   # Keras model (optional — requires TensorFlow)
    tf_available = False

    @classmethod
    def load_all(cls):
        """Called once at FastAPI startup."""
        os.chdir(ROOT)

        # ── Random Forest ─────────────────────────────────────────
        try:
            from models.random_forest import RandomForestAuthenticator
            rf = RandomForestAuthenticator()
            rf.load(RF_MODEL_PATH)
            cls.rf_model = rf
            logger.info("[✓] Random Forest loaded")
        except FileNotFoundError:
            logger.warning(f"[!] Random Forest model not found at {RF_MODEL_PATH}. Run train.py first.")
        except Exception as e:
            logger.error(f"[!] Failed to load Random Forest: {e}")

        # ── Isolation Forest ──────────────────────────────────────
        try:
            from models.isolation_forest import DistributionAnomalyDetector
            iso = DistributionAnomalyDetector()
            iso.load(ISO_MODEL_PATH)
            cls.iso_model = iso
            logger.info("[✓] Isolation Forest loaded")
        except FileNotFoundError:
            logger.warning(f"[!] Isolation Forest model not found at {ISO_MODEL_PATH}. Run train.py first.")
        except Exception as e:
            logger.error(f"[!] Failed to load Isolation Forest: {e}")

        # ── CNN (optional) ────────────────────────────────────────
        try:
            import tensorflow as tf
            cls.tf_available = True
            if os.path.exists(CNN_MODEL_PATH):
                cls.cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)
                logger.info("[✓] CNN model loaded")
            else:
                logger.warning(f"[!] CNN model not found at {CNN_MODEL_PATH}. Run train.py first.")
        except ImportError:
            logger.info("[i] TensorFlow not installed — CNN endpoint will return informative error.")
        except Exception as e:
            logger.error(f"[!] Failed to load CNN: {e}")

    @classmethod
    def status(cls) -> dict:
        return {
            "random_forest":    cls.rf_model  is not None,
            "isolation_forest": cls.iso_model is not None,
            "cnn":              cls.cnn_model  is not None,
        }
