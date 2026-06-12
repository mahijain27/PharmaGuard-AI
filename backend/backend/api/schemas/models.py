"""
Pydantic Schemas — Request & Response models for all API endpoints
Compatible with Pydantic v2 (uses field_validator, not @validator)
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List


# ─────────────────────────────────────────────────────────────
#  BATCH (Random Forest) — Request
# ─────────────────────────────────────────────────────────────
class BatchRequest(BaseModel):
    supplier_id:               int   = Field(..., ge=1,    le=500,  description="Supplier ID (1-20 = known, >20 = suspicious)",   json_schema_extra={"example": 5})
    temperature_log:           float = Field(..., ge=-20,  le=50,   description="Cold chain temperature in Celsius",               json_schema_extra={"example": 4.8})
    humidity_log:              float = Field(..., ge=0,    le=100,  description="Storage humidity percentage",                     json_schema_extra={"example": 44.5})
    shipment_duration_days:    int   = Field(..., ge=1,    le=180,  description="Days in transit",                                 json_schema_extra={"example": 3})
    barcode_checksum_valid:    int   = Field(..., ge=0,    le=1,    description="Barcode valid: 0 or 1",                           json_schema_extra={"example": 1})
    packaging_seal_intact:     int   = Field(..., ge=0,    le=1,    description="Seal intact: 0 or 1",                             json_schema_extra={"example": 1})
    expiry_date_format_valid:  int   = Field(..., ge=0,    le=1,    description="Expiry date valid: 0 or 1",                       json_schema_extra={"example": 1})
    label_language_count:      int   = Field(..., ge=1,    le=10,   description="Number of languages on label",                    json_schema_extra={"example": 3})
    distributor_verified:      int   = Field(..., ge=0,    le=1,    description="Distributor on approved list: 0 or 1",            json_schema_extra={"example": 1})
    price_deviation_pct:       float = Field(..., ge=-100, le=100,  description="% price deviation from market (negative = cheaper)", json_schema_extra={"example": -2.5})
    reorder_frequency:         int   = Field(..., ge=1,    le=200,  description="Reorder frequency count",                        json_schema_extra={"example": 28})
    lot_number_format_valid:   int   = Field(..., ge=0,    le=1,    description="Lot number format valid: 0 or 1",                 json_schema_extra={"example": 1})
    regulatory_approval_code:  int   = Field(..., ge=1,    le=9999, description="Regulatory code (genuine: 1000-9999)",            json_schema_extra={"example": 4521})

    # FIX Bug 3: Pydantic v2 uses @field_validator with mode='after'
    @field_validator(
        'barcode_checksum_valid', 'packaging_seal_intact',
        'expiry_date_format_valid', 'distributor_verified',
        'lot_number_format_valid',
        mode='after'
    )
    @classmethod
    def must_be_binary(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("Must be 0 or 1")
        return v


class EngineeredBatchFeatures(BaseModel):
    trust_score:        float
    cold_chain_ok:      int
    price_suspicious:   int
    supplier_risk:      int
    seal_barcode_combo: int


class BatchResponse(BaseModel):
    prediction:          int
    label:               str
    confidence:          float
    risk_level:          str
    engineered_features: EngineeredBatchFeatures


# ─────────────────────────────────────────────────────────────
#  TRANSACTION (Isolation Forest) — Request
# ─────────────────────────────────────────────────────────────
class TransactionRequest(BaseModel):
    order_quantity:         float = Field(..., ge=0,   description="Units ordered",                    json_schema_extra={"example": 480.0})
    delivery_time_hours:    float = Field(..., ge=0,   description="Delivery time in hours",           json_schema_extra={"example": 22.5})
    invoice_amount_usd:     float = Field(..., ge=0,   description="Invoice value in USD",             json_schema_extra={"example": 9800.0})
    return_rate_pct:        float = Field(..., ge=0,   le=100, description="% of goods returned",      json_schema_extra={"example": 1.8})
    complaint_count:        int   = Field(..., ge=0,   description="Number of complaints filed",       json_schema_extra={"example": 1})
    route_deviation_km:     float = Field(..., ge=0,   description="Km off expected delivery route",  json_schema_extra={"example": 4.2})
    customs_clearance_days: float = Field(..., ge=0,   description="Days spent at customs",            json_schema_extra={"example": 1.9})
    storage_temp_avg:       float = Field(..., ge=-30, le=60, description="Average storage temperature", json_schema_extra={"example": 5.1})


class EngineeredTransactionFeatures(BaseModel):
    delivery_efficiency: float
    cost_per_unit:       float
    risk_score:          float


class TransactionResponse(BaseModel):
    prediction:          int
    label:               str
    anomaly_score:       float
    risk_level:          str
    engineered_features: EngineeredTransactionFeatures


# ─────────────────────────────────────────────────────────────
#  IMAGE (CNN) — Response only (request is multipart/form-data)
# ─────────────────────────────────────────────────────────────
class ImageResponse(BaseModel):
    prediction:  int
    label:       str
    confidence:  float
    risk_level:  str
    note:        Optional[str] = None


# ─────────────────────────────────────────────────────────────
#  BULK — Row result
# ─────────────────────────────────────────────────────────────
class BulkRowResult(BaseModel):
    row_index:   int
    prediction:  int
    label:       str
    confidence:  float
    risk_level:  str
    error:       Optional[str] = None


class BulkResponse(BaseModel):
    total_rows: int
    processed:  int
    errors:     int
    results:    List[BulkRowResult]   # List from typing — works in both Pydantic v1 and v2


# ─────────────────────────────────────────────────────────────
#  HEALTH & MODEL INFO
# ─────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status:        str
    models_loaded: Dict[str, bool]
    version:       str


class ModelInfoResponse(BaseModel):
    models: List[Dict[str, Any]]
