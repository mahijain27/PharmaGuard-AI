# PharmaGuard AI — Frontend

React + Vite + Tailwind frontend for the pharma-authenticity ML backend.

## Setup

```bash
npm install
```

Copy `.env` and set the API URL (defaults to `http://localhost:8000`):

```bash
VITE_API_URL=http://localhost:8000
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://localhost:8000` (see `vite.config.js`) so the backend must be running.

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Page | Backend endpoint |
|---|---|---|
| `/` | Overview / Home | `GET /api/health` |
| `/verify` | Drug Authenticity Verification | `POST /api/predict/batch` |
| `/anomaly` | Supply Chain Anomaly Detection | `POST /api/predict/transaction` |
| `/dashboard` | Results Dashboard (local history) | — |

## Notes

- Prediction history is stored in `localStorage` under the key `pharmaguard_history` (max 200 entries, client-only).
- Dark theme is the default and only theme (`class="dark"` on `<html>`).
- For production, set `VITE_API_URL` in `.env.production` to your deployed backend URL and ensure the backend's `ALLOWED_ORIGINS` includes your frontend domain.
