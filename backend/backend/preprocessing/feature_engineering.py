"""
Preprocessing & Feature Engineering
All paths are absolute — no os.chdir dependency.
Separate imputers for classification and anomaly pipelines.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
import joblib
import os

# Absolute paths — always resolve relative to this file's location, never CWD
_THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
_MODELS_DIR  = os.path.join(_BACKEND_DIR, "trained_models")

SCALER_CLASS_PATH  = os.path.join(_MODELS_DIR, "scaler_classification.pkl")
IMPUTER_CLASS_PATH = os.path.join(_MODELS_DIR, "imputer_classification.pkl")
SCALER_ANOM_PATH   = os.path.join(_MODELS_DIR, "scaler_anomaly.pkl")
IMPUTER_ANOM_PATH  = os.path.join(_MODELS_DIR, "imputer_anomaly.pkl")

# Column order must match exactly what was used during training
BATCH_FEATURE_ORDER = [
    'supplier_id', 'temperature_log', 'humidity_log', 'shipment_duration_days',
    'barcode_checksum_valid', 'packaging_seal_intact', 'expiry_date_format_valid',
    'label_language_count', 'distributor_verified', 'price_deviation_pct',
    'reorder_frequency', 'lot_number_format_valid', 'regulatory_approval_code',
    'trust_score', 'cold_chain_ok', 'price_suspicious',
    'supplier_risk', 'seal_barcode_combo'
]

TRANSACTION_FEATURE_ORDER = [
    'order_quantity', 'delivery_time_hours', 'invoice_amount_usd',
    'return_rate_pct', 'complaint_count', 'route_deviation_km',
    'customs_clearance_days', 'storage_temp_avg',
    'delivery_efficiency', 'cost_per_unit', 'risk_score'
]


class PharmaPreprocessor:
    def __init__(self):
        # Separate imputer per pipeline — they must NEVER share an instance
        self.scaler        = StandardScaler()
        self.minmax_scaler = MinMaxScaler()
        self.imputer_class = SimpleImputer(strategy='median')
        self.imputer_anom  = SimpleImputer(strategy='median')
        self.feature_columns = None

    # ─────────────────────────────────────────────
    #  Supply Chain Pipeline (Classification)
    # ─────────────────────────────────────────────
    def preprocess_supply_chain(self, df: pd.DataFrame):
        print("[*] Preprocessing supply chain data...")
        df = df.copy()
        df.drop(columns=[c for c in ['batch_id'] if c in df.columns], inplace=True)

        df['trust_score'] = (
            df['barcode_checksum_valid'] * 0.25 +
            df['packaging_seal_intact'] * 0.20 +
            df['expiry_date_format_valid'] * 0.15 +
            df['distributor_verified'] * 0.25 +
            df['lot_number_format_valid'] * 0.15
        )
        df['cold_chain_ok']    = ((df['temperature_log'].between(2, 8)) &
                                   (df['humidity_log'].between(30, 60))).astype(int)
        df['price_suspicious'] = (df['price_deviation_pct'] < -25).astype(int)
        df['supplier_risk']    = (df['supplier_id'] > 20).astype(int)
        df['seal_barcode_combo'] = df['packaging_seal_intact'] * df['barcode_checksum_valid']

        y = df['label']
        X = df.drop(columns=['label'])
        self.feature_columns = X.columns.tolist()

        X_imputed = self.imputer_class.fit_transform(X)
        X_scaled  = self.scaler.fit_transform(X_imputed)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

        print(f"    Train: {X_train.shape}  |  Test: {X_test.shape}")
        os.makedirs(_MODELS_DIR, exist_ok=True)
        joblib.dump(self.scaler,        SCALER_CLASS_PATH)
        joblib.dump(self.imputer_class, IMPUTER_CLASS_PATH)
        print(f"    [✓] Saved scaler + imputer (classification) -> trained_models/")

        return X_train, X_test, y_train, y_test, self.feature_columns

    # ─────────────────────────────────────────────
    #  Anomaly Detection Pipeline
    # ─────────────────────────────────────────────
    def preprocess_anomaly(self, df: pd.DataFrame):
        print("[*] Preprocessing anomaly detection data...")
        df = df.copy()
        labels = df['is_anomaly'].values
        X = df.drop(columns=[c for c in ['transaction_id', 'is_anomaly'] if c in df.columns])

        X['delivery_efficiency'] = X['order_quantity'] / (X['delivery_time_hours'] + 1)
        X['cost_per_unit']       = X['invoice_amount_usd'] / (X['order_quantity'] + 1)
        X['risk_score']          = (
            X['return_rate_pct'] * 0.3 +
            X['complaint_count'] * 0.4 +
            X['route_deviation_km'] * 0.3
        )

        X_imputed = self.imputer_anom.fit_transform(X)
        X_scaled  = self.minmax_scaler.fit_transform(X_imputed)

        print(f"    Shape: {X_scaled.shape}  |  Anomalies: {labels.sum()}/{len(labels)}")
        os.makedirs(_MODELS_DIR, exist_ok=True)
        joblib.dump(self.minmax_scaler, SCALER_ANOM_PATH)
        joblib.dump(self.imputer_anom,  IMPUTER_ANOM_PATH)
        print(f"    [✓] Saved scaler + imputer (anomaly) -> trained_models/")

        return X_scaled, labels, X.columns.tolist()

    # ─────────────────────────────────────────────
    #  Single-Record Inference (API use)
    # ─────────────────────────────────────────────
    def transform_single_batch(self, raw: dict) -> tuple:
        """
        Transform one raw batch dict for Random Forest inference.
        FIX Bug C: pass DataFrame to imputer/scaler to silence feature-name warnings.
        Returns (X_scaled ndarray (1,18), engineered_features dict).
        """
        scaler  = joblib.load(SCALER_CLASS_PATH)
        imputer = joblib.load(IMPUTER_CLASS_PATH)

        trust_score = (
            raw['barcode_checksum_valid'] * 0.25 +
            raw['packaging_seal_intact'] * 0.20 +
            raw['expiry_date_format_valid'] * 0.15 +
            raw['distributor_verified'] * 0.25 +
            raw['lot_number_format_valid'] * 0.15
        )
        cold_chain_ok      = int(2 <= raw['temperature_log'] <= 8 and
                                 30 <= raw['humidity_log'] <= 60)
        price_suspicious   = int(raw['price_deviation_pct'] < -25)
        supplier_risk      = int(raw['supplier_id'] > 20)
        seal_barcode_combo = raw['packaging_seal_intact'] * raw['barcode_checksum_valid']

        engineered = {
            "trust_score":        round(trust_score, 4),
            "cold_chain_ok":      cold_chain_ok,
            "price_suspicious":   price_suspicious,
            "supplier_risk":      supplier_risk,
            "seal_barcode_combo": seal_barcode_combo,
        }

        full = {**raw, **engineered}
        # FIX Bug C: use DataFrame so column names match what imputer was trained on
        df_row = pd.DataFrame([{f: full[f] for f in BATCH_FEATURE_ORDER}],
                              columns=BATCH_FEATURE_ORDER)
        X_imp    = imputer.transform(df_row)
        X_scaled = scaler.transform(X_imp)

        return X_scaled, engineered

    def transform_single_transaction(self, raw: dict) -> tuple:
        """
        Transform one raw transaction dict for Isolation Forest inference.
        FIX Bug C: pass DataFrame to imputer/scaler.
        Returns (X_scaled ndarray (1,11), engineered_features dict).
        """
        scaler  = joblib.load(SCALER_ANOM_PATH)
        imputer = joblib.load(IMPUTER_ANOM_PATH)

        delivery_efficiency = raw['order_quantity'] / (raw['delivery_time_hours'] + 1)
        cost_per_unit       = raw['invoice_amount_usd'] / (raw['order_quantity'] + 1)
        risk_score          = (
            raw['return_rate_pct'] * 0.3 +
            raw['complaint_count'] * 0.4 +
            raw['route_deviation_km'] * 0.3
        )

        engineered = {
            "delivery_efficiency": round(delivery_efficiency, 4),
            "cost_per_unit":       round(cost_per_unit, 4),
            "risk_score":          round(risk_score, 4),
        }

        full = {**raw, **engineered}
        # FIX Bug C: use DataFrame
        df_row = pd.DataFrame([{f: full[f] for f in TRANSACTION_FEATURE_ORDER}],
                              columns=TRANSACTION_FEATURE_ORDER)
        X_imp    = imputer.transform(df_row)
        X_scaled = scaler.transform(X_imp)

        return X_scaled, engineered
