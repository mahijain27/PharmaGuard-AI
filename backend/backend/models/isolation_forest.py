"""
Isolation Forest — Anomaly Detection in Drug Distribution
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class DistributionAnomalyDetector:
    def __init__(self, contamination=0.06):
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            max_samples='auto',
            random_state=42,
            n_jobs=-1
        )
        self.pca = PCA(n_components=2)
        self.contamination = contamination

    def fit(self, X):
        print("[*] Fitting Isolation Forest...")
        self.model.fit(X)
        self.pca.fit(X)
        print(f"    Contamination set : {self.contamination}")
        return self

    def predict(self, X):
        """Returns 1 for anomaly, 0 for normal."""
        raw = self.model.predict(X)
        return np.where(raw == -1, 1, 0)

    def anomaly_scores(self, X):
        return self.model.decision_function(X)

    def evaluate(self, X, true_labels):
        print("\n[*] Evaluating Isolation Forest...")
        preds  = self.predict(X)
        scores = self.anomaly_scores(X)
        auc = roc_auc_score(true_labels, -scores)
        print(f"    ROC-AUC : {auc:.4f}")
        print(f"    Detected anomalies : {preds.sum()} / {len(preds)}")
        print("\n    Classification Report:")
        print(classification_report(true_labels, preds, target_names=['Normal', 'Anomaly']))
        return preds, scores, auc

    def predict_single(self, X_scaled: np.ndarray) -> dict:
        """
        API inference method.
        FIX Bug B: anomaly_score is now a normalised [0.0, 1.0] value where:
          0.0 = perfectly normal
          1.0 = maximally anomalous
        Derived from decision_function:
          positive decision_function = normal (inlier)
          negative decision_function = anomalous (outlier)
        We clip to 0..1 using a sigmoid-style transform so the frontend
        always gets a clean, positive, interpretable number.
        """
        raw_score  = float(self.model.decision_function(X_scaled)[0])
        prediction = int(self.predict(X_scaled)[0])

        # Normalise: sigmoid on negated score so anomaly -> 1, normal -> 0
        # score_normalised = 1 / (1 + exp(raw_score * 10))
        # But simpler: clip(-raw / 0.5, 0, 1) gives clean 0..1 range
        # Raw values seen in testing: normal ~+0.3, anomaly ~-0.1 to -0.5
        anomaly_score = round(float(np.clip(-raw_score / 0.5, 0.0, 1.0)), 4)

        if anomaly_score < 0.2:
            risk_level = "LOW"
        elif anomaly_score < 0.5:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        return {
            "prediction":   prediction,
            "label":        "ANOMALY" if prediction == 1 else "NORMAL",
            "anomaly_score": anomaly_score,
            "risk_level":   risk_level,
        }

    def plot_results(self, X, true_labels, preds, scores, save_dir='evaluation'):
        os.makedirs(save_dir, exist_ok=True)
        X_2d = self.pca.transform(X)
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        fig.patch.set_facecolor('#0d1117')
        for ax in axes:
            ax.set_facecolor('#161b22')
        colors_true = ['#3fb950' if l == 0 else '#f85149' for l in true_labels]
        axes[0].scatter(X_2d[:, 0], X_2d[:, 1], c=colors_true, s=12, alpha=0.6)
        axes[0].set_title('True Labels (PCA 2D)', color='white', fontsize=12)
        axes[0].tick_params(colors='white')
        colors_pred = ['#3fb950' if p == 0 else '#f85149' for p in preds]
        axes[1].scatter(X_2d[:, 0], X_2d[:, 1], c=colors_pred, s=12, alpha=0.6)
        axes[1].set_title('Predicted Labels', color='white', fontsize=12)
        axes[1].tick_params(colors='white')
        norm_scores = scores[true_labels == 0]
        anom_scores = scores[true_labels == 1]
        axes[2].hist(norm_scores, bins=40, color='#3fb950', alpha=0.7, label='Normal', density=True)
        axes[2].hist(anom_scores, bins=20, color='#f85149', alpha=0.7, label='Anomaly', density=True)
        axes[2].axvline(x=0, color='white', linestyle='--', lw=1)
        axes[2].set_title('Anomaly Score Distribution', color='white', fontsize=12)
        axes[2].tick_params(colors='white')
        axes[2].legend(facecolor='#161b22', labelcolor='white')
        plt.tight_layout()
        path = os.path.join(save_dir, 'isolation_forest_results.png')
        plt.savefig(path, dpi=150, bbox_inches='tight', facecolor='#0d1117')
        plt.close()
        print(f"    [✓] Plot saved -> {path}")

    def save(self, path='models/isolation_forest_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self.model, path)
        print(f"    [✓] Model saved -> {path}")

    def load(self, path='models/isolation_forest_model.pkl'):
        self.model = joblib.load(path)
        return self
