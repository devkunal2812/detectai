"""
DetectAI Backend — FastAPI Application
Multi-signal AI content detection engine
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import logging
import os
from datetime import datetime

from api.text_analyzer import analyze_text_content
from api.image_analyzer import analyze_image_content
from database.connection import init_db, save_analysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DetectAI API",
    description="Multi-signal AI content detection — text and image analysis",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://yourdomain.vercel.app").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("DetectAI API starting up…")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"DB init skipped (demo mode): {e}")


class TextAnalysisRequest(BaseModel):
    text: str

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The synthesis of large language models represents a paradigm shift in computational linguistics…"
            }
        }


@app.get("/")
async def root():
    return {
        "service": "DetectAI API",
        "version": "2.4.0",
        "status": "operational",
        "endpoints": ["/analyze/text", "/analyze/image", "/health", "/docs"],
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "models_loaded": True,
    }


@app.post("/analyze/text")
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text content for AI generation signals.

    Returns:
    - ai_score: 0–100 likelihood of AI generation
    - confidence: low | medium | high
    - verdict: likely_human | uncertain | likely_ai
    - evidence: list of weighted detection signals
    - metadata: text-level statistics
    """
    if not request.text or len(request.text.strip()) < 20:
        raise HTTPException(status_code=422, detail="Text must be at least 20 characters")
    if len(request.text) > 100_000:
        raise HTTPException(status_code=422, detail="Text exceeds 100,000 character limit")

    try:
        result = await analyze_text_content(request.text)
        try:
            await save_analysis("text", result)
        except Exception:
            pass  # DB optional
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an image for AI generation signals.

    Accepts: JPG, PNG, WEBP (max 10MB)

    Returns:
    - ai_score: 0–100 likelihood of AI generation
    - confidence: low | medium | high
    - verdict: likely_human | uncertain | likely_ai
    - evidence: list of weighted detection signals
    - metadata: EXIF and image statistics
    """
    ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 10MB limit")

    try:
        result = await analyze_image_content(contents, file.filename, file.content_type)
        try:
            await save_analysis("image", result)
        except Exception:
            pass
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development",
        log_level="info",
    )
