# DetectAI — AI Content Analyzer

Multi-signal AI content detection platform for text and images. Provides probabilistic AI likelihood scores with weighted evidence breakdowns.

---

## Architecture

```
detectai/
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx    # Landing page with particle animation
│   │   │   ├── AnalyzePage.jsx # Upload & analysis UI
│   │   │   └── ResultsPage.jsx # Score visualization & evidence
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── styles/
│   │       └── globals.css     # Design system, animations
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/                    # FastAPI (Python)
│   ├── main.py                 # App entrypoint, routes
│   ├── api/
│   │   ├── text_analyzer.py    # NLP detection engine
│   │   └── image_analyzer.py  # Vision detection engine
│   ├── database/
│   │   ├── connection.py       # asyncpg pool
│   │   └── schema.sql          # PostgreSQL schema
│   ├── requirements.txt
│   └── render.yaml
│
├── .env.example
└── README.md
```

---

## Scoring Methodology

| Signal | Weight | Source |
|--------|--------|--------|
| AI Classifier (HuggingFace) | 70% | `roberta-base-openai-detector` / `umm-maybe/AI-image-detector` |
| Metadata Evidence | 20% | EXIF, software tags, dimensions |
| Artifact Detection | 10% | Edge analysis, frequency spectrum, color distribution |

### Score Bands
| Score | Verdict |
|-------|---------|
| 0–30% | 👤 Likely Human |
| 31–70% | ⚖️ Uncertain |
| 71–100% | 🤖 Likely AI Generated |

---

## Quick Start (Local)

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL (optional — app runs without it)

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/detectai.git
cd detectai
cp .env.example .env
# Edit .env with your values
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download ML models — will auto-download on first use
# python -c "from transformers import pipeline; pipeline('text-classification', model='roberta-base-openai-detector')"

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## API Reference

### POST /analyze/text

Analyze text for AI generation signals.

**Request:**
```json
{
  "text": "The synthesis of large language models…"
}
```

**Response:**
```json
{
  "ai_score": 82,
  "confidence": "high",
  "verdict": "likely_ai",
  "evidence": [
    {
      "signal": "AI Classifier (roberta-base-openai-detector)",
      "result": "84% AI probability from transformer model",
      "positive": true,
      "weight": "70%"
    }
  ],
  "metadata": {
    "word_count": 347,
    "perplexity_score": "72.1 (AI-signal %)",
    "burstiness_index": "0.821",
    "vocabulary_richness": "0.612"
  },
  "analyzed_at": "2025-01-15T12:00:00Z"
}
```

### POST /analyze/image

Analyze an image for AI generation signals.

**Request:** `multipart/form-data` with `file` field (JPG/PNG/WEBP, max 10MB)

**Response:**
```json
{
  "ai_score": 91,
  "confidence": "high",
  "verdict": "likely_ai",
  "evidence": [...],
  "metadata": {
    "format": "PNG",
    "dimensions": "1024x1024",
    "software_tag": "Stable Diffusion v2.1",
    "camera_metadata_present": "false"
  },
  "analyzed_at": "2025-01-15T12:00:00Z"
}
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set root directory to `frontend/`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `ALLOWED_ORIGINS` — your Vercel frontend URL

### Database → Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run `database/schema.sql`
3. Copy connection string from Settings → Database
4. Add to Render as `DATABASE_URL`

---

## ML Models

The backend supports two HuggingFace models:

| Type | Model | Size |
|------|-------|------|
| Text | `roberta-base-openai-detector` | ~500MB |
| Image | `umm-maybe/AI-image-detector` | ~350MB |

Models are downloaded on first use (~30s startup) and cached. On Render free tier, you may want to pre-download or use a persistent disk.

**Without models:** The system falls back to statistical/heuristic analysis (still effective for obvious cases, less accurate overall).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Frontend | Backend API base URL |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Backend | Comma-separated CORS origins |
| `PORT` | Backend | Server port (default: 8000) |
| `ENV` | Backend | `development` or `production` |

---

## Disclaimer

DetectAI provides **probabilistic estimates**, not definitive verdicts. No AI detection system achieves 100% accuracy. Results should be treated as one signal in a broader assessment. Always verify important content through multiple methods.

---

## License

MIT
