"""
Random Forest Classifier — Counterfeit Medicine Detection
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, accuracy_score
)
from sklearn.model_selection import cross_val_score, StratifiedKFold
import joblib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class RandomForestAuthenticator:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        self.feature_names = None

    def train(self, X_train, y_train, feature_names=None):
        self.feature_names = feature_names
        print("[*] Training Random Forest Classifier...")
        self.model.fit(X_train, y_train)
        train_acc = accuracy_score(y_train, self.model.predict(X_train))
        print(f"    Training Accuracy : {train_acc:.4f}")
        return self

    def evaluate(self, X_test, y_test):
        print("\n[*] Evaluating on test set...")
        y_pred  = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]
        acc = accuracy_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_proba)
        print(f"    Accuracy : {acc:.4f}")
        print(f"    ROC-AUC  : {auc:.4f}")
        print("\n    Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['Genuine', 'Counterfeit']))
        return y_pred, y_proba, acc, auc

    def cross_validate(self, X, y, cv=5):
        print(f"\n[*] Running {cv}-fold Stratified Cross-Validation...")
        skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
        scores = cross_val_score(self.model, X, y, cv=skf, scoring='roc_auc', n_jobs=-1)
        print(f"    ROC-AUC per fold : {np.round(scores, 4)}")
        print(f"    Mean  +/- Std    : {scores.mean():.4f} +/- {scores.std():.4f}")
        return scores

    def predict_single(self, X_scaled: np.ndarray) -> dict:
        """
        API inference method.
        FIX Bug A: confidence = probability of the PREDICTED class,
        so a 100% genuine prediction shows confidence=1.0, not 0.0.
        """
        proba      = self.model.predict_proba(X_scaled)[0]   # [p_genuine, p_counterfeit]
        prediction = int(np.argmax(proba))                    # 0=genuine, 1=counterfeit
        confidence = round(float(proba[prediction]), 4)       # prob of whichever class won

        if confidence < 0.6:
            risk_level = "LOW"
        elif confidence < 0.85:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH" if prediction == 1 else "LOW"

        return {
            "prediction": prediction,
            "label":      "COUNTERFEIT" if prediction == 1 else "GENUINE",
            "confidence": confidence,
            "risk_level": risk_level,
        }

    def plot_results(self, X_test, y_test, y_pred, y_proba, save_dir='evaluation'):
        os.makedirs(save_dir, exist_ok=True)
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        fig.patch.set_facecolor('#0d1117')
        for ax in axes:
            ax.set_facecolor('#161b22')
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=['Genuine', 'Counterfeit'],
                    yticklabels=['Genuine', 'Counterfeit'],
                    ax=axes[0], linewidths=1)
        axes[0].set_title('Confusion Matrix', color='white', fontsize=13, pad=12)
        axes[0].tick_params(colors='white')
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        auc = roc_auc_score(y_test, y_proba)
        axes[1].plot(fpr, tpr, color='#58a6ff', lw=2, label=f'AUC = {auc:.4f}')
        axes[1].plot([0, 1], [0, 1], color='gray', linestyle='--', lw=1)
        axes[1].fill_between(fpr, tpr, alpha=0.15, color='#58a6ff')
        axes[1].set_title('ROC Curve', color='white', fontsize=13)
        axes[1].tick_params(colors='white')
        axes[1].legend(facecolor='#161b22', labelcolor='white')
        if self.feature_names:
            importances = pd.Series(
                self.model.feature_importances_, index=self.feature_names
            ).sort_values(ascending=True).tail(12)
            axes[2].barh(importances.index, importances.values, color='#3fb950')
            axes[2].set_title('Top Feature Importances', color='white', fontsize=13)
            axes[2].tick_params(colors='white')
        plt.tight_layout()
        path = os.path.join(save_dir, 'random_forest_results.png')
        plt.savefig(path, dpi=150, bbox_inches='tight', facecolor='#0d1117')
        plt.close()
        print(f"    [✓] Plot saved -> {path}")

    def save(self, path='models/random_forest_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self.model, path)
        print(f"    [✓] Model saved -> {path}")

    def load(self, path='models/random_forest_model.pkl'):
        self.model = joblib.load(path)
        return self
