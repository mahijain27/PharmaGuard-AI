# ── Base image ──────────────────────────────────────────────
FROM python:3.11-slim

# ── System deps ─────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ────────────────────────────────────────
WORKDIR /app

# ── Install Python dependencies ──────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy source code ─────────────────────────────────────────
COPY . .

# ── IMPORTANT: Run train.py before building image
#    OR mount trained_models/ as a volume in docker-compose
#    The trained_models/ folder must exist with .pkl files

# ── Expose port ──────────────────────────────────────────────
EXPOSE 8000

# ── Start server ─────────────────────────────────────────────
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]
