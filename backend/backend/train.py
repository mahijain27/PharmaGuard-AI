"""
train.py — Run this ONCE before starting the API.
Trains all 3 models and saves them to trained_models/.
FIX Bug 4: use separate PharmaPreprocessor instances for each pipeline
so imputers never overwrite each other.
"""

import os
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
os.chdir(ROOT)   # os.chdir is fine in a one-shot script (not in a server)

TRAINED_DIR = os.path.join(ROOT, "trained_models")
os.makedirs(TRAINED_DIR, exist_ok=True)

from data.generate_dataset import generate_supply_chain_data, generate_anomaly_data
from models.random_forest import RandomForestAuthenticator
from models.isolation_forest import DistributionAnomalyDetector
from models.cnn_model import generate_packaging_images, train_cnn, TF_AVAILABLE
import numpy as np

print("\n" + "=" * 60)
print("  Pharma Authenticity — Model Training")
print("=" * 60)
t0 = time.time()

# ── Step 1: Datasets ─────────────────────────────────────────
print("\n[1/4] Generating datasets...")
supply_df  = generate_supply_chain_data(n_samples=2000)
anomaly_df = generate_anomaly_data(n_samples=1500)

# ── Step 2: Preprocessing ────────────────────────────────────
# FIX Bug 4: use TWO separate PharmaPreprocessor instances
# so each gets its own imputer that gets saved to its own file.
print("\n[2/4] Preprocessing (classification pipeline)...")
from preprocessing.feature_engineering import PharmaPreprocessor
prep_class = PharmaPreprocessor()   # owns imputer_classification + scaler_classification
X_train, X_test, y_train, y_test, features = prep_class.preprocess_supply_chain(supply_df)

print("\n[2b/4] Preprocessing (anomaly pipeline)...")
prep_anom = PharmaPreprocessor()    # owns imputer_anomaly + scaler_anomaly
X_anom, anom_labels, _ = prep_anom.preprocess_anomaly(anomaly_df)

X_all = np.vstack([X_train, X_test])
y_all = np.concatenate([y_train, y_test])

# ── Step 3: Random Forest ─────────────────────────────────────
print("\n[3/4] Training Random Forest...")
rf = RandomForestAuthenticator()
rf.train(X_train, y_train, feature_names=features)
y_pred_rf, y_proba_rf, acc_rf, auc_rf = rf.evaluate(X_test, y_test)
rf.save(path=os.path.join(TRAINED_DIR, "random_forest_model.pkl"))

# ── Step 4: Isolation Forest ──────────────────────────────────
print("\n[4/4] Training Isolation Forest...")
detector = DistributionAnomalyDetector(contamination=0.06)
detector.fit(X_anom)
preds_iso, scores_iso, auc_iso = detector.evaluate(X_anom, anom_labels)
detector.save(path=os.path.join(TRAINED_DIR, "isolation_forest_model.pkl"))

# ── Optional: CNN ─────────────────────────────────────────────
if TF_AVAILABLE:
    print("\n[+] TensorFlow detected — Training CNN...")
    data_dir = generate_packaging_images(n_per_class=300)
    cnn_model, _ = train_cnn(
        data_dir=data_dir,
        epochs=15,
        save_path=os.path.join(TRAINED_DIR, "cnn_model.keras")
    )
else:
    print("\n[!] TensorFlow not installed — skipping CNN training.")
    print("    Install with: pip install tensorflow")

elapsed = time.time() - t0
print("\n" + "=" * 60)
print(f"  Training complete in {elapsed:.1f}s")
print(f"  Random Forest    — Accuracy: {acc_rf:.4f}, AUC: {auc_rf:.4f}")
print(f"  Isolation Forest — AUC: {auc_iso:.4f}")
print(f"  All artifacts saved to: {TRAINED_DIR}/")
print("=" * 60 + "\n")
