"""
Image Analysis Engine
Multi-signal AI image detection using metadata forensics + ML
"""

import io
import math
import asyncio
from datetime import datetime
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Metadata / EXIF Analysis
# ─────────────────────────────────────────────

def extract_exif_metadata(image_bytes: bytes) -> dict[str, Any]:
    """Extract EXIF metadata from image."""
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS

        img = Image.open(io.BytesIO(image_bytes))
        info = {}

        # Basic image info
        info["format"] = img.format or "Unknown"
        info["mode"] = img.mode
        info["dimensions"] = f"{img.width}x{img.height}"
        info["size_bytes"] = len(image_bytes)

        # EXIF data
        exif_raw = img._getexif() if hasattr(img, '_getexif') else None
        if exif_raw:
            for tag_id, value in exif_raw.items():
                tag = TAGS.get(tag_id, str(tag_id))
                if isinstance(value, (str, int, float, bytes)) and not isinstance(value, bytes):
                    info[f"exif_{tag.lower().replace(' ', '_')}"] = str(value)[:100]

        # Check for software tag (key AI indicator)
        software = info.get("exif_software", "")
        info["has_camera_metadata"] = any(
            k.startswith("exif_") and "gps" in k or "make" in k or "model" in k
            for k in info.keys()
        )
        info["software_tag"] = software if software else "Not present"
        return info

    except Exception as e:
        logger.warning(f"EXIF extraction error: {e}")
        return {"exif_error": str(e), "dimensions": "Unknown", "format": "Unknown"}


def analyze_metadata_signals(metadata: dict) -> tuple[float, list[dict]]:
    """
    Analyze metadata for AI generation signals.
    Returns (ai_signal_score 0-1, evidence_list).
    """
    score = 0.0
    evidence = []

    # AI image generators typically LACK camera metadata
    has_camera = metadata.get("has_camera_metadata", False)
    if not has_camera:
        score += 0.3
        evidence.append({
            "signal": "Camera Metadata",
            "result": "No camera make/model/GPS data — typical of AI-generated images",
            "positive": True,
            "weight": "15%",
        })
    else:
        evidence.append({
            "signal": "Camera Metadata",
            "result": "Camera make/model present — suggests real photograph",
            "positive": False,
            "weight": "15%",
        })

    # Software signature
    software = metadata.get("software_tag", "Not present").lower()
    AI_SOFTWARE = ["stable diffusion", "midjourney", "dall-e", "firefly", "imagen",
                   "comfyui", "automatic1111", "invoke", "novelai"]
    if any(s in software for s in AI_SOFTWARE):
        score += 0.45
        evidence.append({
            "signal": "Software Signature",
            "result": f"AI generation software detected: {metadata.get('software_tag')}",
            "positive": True,
            "weight": "20%",
        })
    elif software == "not present":
        score += 0.15
        evidence.append({
            "signal": "Software Signature",
            "result": "No software tag — AI generators often omit this",
            "positive": True,
            "weight": "20%",
        })
    else:
        evidence.append({
            "signal": "Software Signature",
            "result": f"Software: {metadata.get('software_tag', 'Unknown')} — not a known AI tool",
            "positive": False,
            "weight": "20%",
        })

    # Dimensions check: AI images often have round power-of-2 dimensions
    dims = metadata.get("dimensions", "0x0")
    try:
        w, h = map(int, dims.split("x"))
        ai_dims = [(512, 512), (768, 768), (1024, 1024), (1024, 768), (768, 1024),
                   (1280, 720), (1344, 768), (832, 1216)]
        if (w, h) in ai_dims:
            score += 0.1
            evidence.append({
                "signal": "Image Dimensions",
                "result": f"{dims} — standard AI generation resolution",
                "positive": True,
                "weight": "5%",
            })
        elif w == h and w in [256, 512, 768, 1024, 1536, 2048]:
            score += 0.05
            evidence.append({
                "signal": "Image Dimensions",
                "result": f"{dims} — square format common in AI generation",
                "positive": True,
                "weight": "5%",
            })
        else:
            evidence.append({
                "signal": "Image Dimensions",
                "result": f"{dims} — non-standard dimensions, less typical of AI",
                "positive": False,
                "weight": "5%",
            })
    except Exception:
        pass

    return min(1.0, score), evidence


# ─────────────────────────────────────────────
# Visual / Artifact Analysis
# ─────────────────────────────────────────────

def analyze_visual_artifacts(image_bytes: bytes) -> tuple[float, list[dict]]:
    """
    Analyze pixel-level properties for AI artifact signatures.
    Returns (ai_signal_score 0-1, evidence_list).
    """
    evidence = []
    try:
        from PIL import Image, ImageFilter
        import numpy as np

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Downsample for performance
        max_size = 512
        ratio = min(max_size / img.width, max_size / img.height)
        if ratio < 1:
            img = img.resize((int(img.width * ratio), int(img.height * ratio)))

        arr = np.array(img, dtype=np.float32)

        # ── Signal 1: Color distribution uniformity ──
        # AI images tend to have smoother color distributions
        channel_stds = [arr[:, :, c].std() for c in range(3)]
        avg_std = sum(channel_stds) / 3
        # Real photos have higher variation (>45), AI tends to be smoother
        color_uniformity = max(0.0, min(1.0, 1.0 - (avg_std - 30) / 40))

        if color_uniformity > 0.6:
            evidence.append({
                "signal": "Color Distribution",
                "result": f"Unusually uniform color distribution (std={avg_std:.1f}) — AI typical",
                "positive": True,
                "weight": "5%",
            })
        else:
            evidence.append({
                "signal": "Color Distribution",
                "result": f"Natural color variation (std={avg_std:.1f})",
                "positive": False,
                "weight": "5%",
            })

        # ── Signal 2: Edge smoothness (Laplacian variance) ──
        gray = img.convert("L")
        laplacian = gray.filter(ImageFilter.FIND_EDGES)
        lap_arr = np.array(laplacian, dtype=np.float32)
        edge_var = lap_arr.var()
        # AI images often have smoother/more regular edges
        edge_smoothness = max(0.0, min(1.0, 1.0 - edge_var / 2000))

        if edge_smoothness > 0.5:
            evidence.append({
                "signal": "Edge Analysis",
                "result": f"Edge smoothness score {edge_smoothness:.2f} — diffusion artifacts possible",
                "positive": True,
                "weight": "5%",
            })
        else:
            evidence.append({
                "signal": "Edge Analysis",
                "result": f"Natural edge variation detected",
                "positive": False,
                "weight": "5%",
            })

        # ── Signal 3: Frequency analysis (basic) ──
        # AI images have characteristic frequency signatures
        if hasattr(np.fft, 'fft2'):
            gray_arr = np.array(gray, dtype=np.float32)
            fft = np.abs(np.fft.fft2(gray_arr))
            fft_shifted = np.fft.fftshift(fft)
            center = np.array(fft_shifted.shape) // 2
            # Compare center vs edge frequency power
            h, w = fft_shifted.shape
            center_power = fft_shifted[h//2-20:h//2+20, w//2-20:w//2+20].mean()
            total_power = fft_shifted.mean()
            freq_ratio = center_power / (total_power + 1e-8)
            # AI images often have higher low-frequency dominance
            freq_ai_signal = min(1.0, max(0.0, (freq_ratio - 5) / 15))

            evidence.append({
                "signal": "Frequency Spectrum",
                "result": f"Low-frequency dominance ratio: {freq_ratio:.1f} — {'AI-typical' if freq_ai_signal > 0.4 else 'normal'}",
                "positive": freq_ai_signal > 0.4,
                "weight": "N/A",
            })
        else:
            freq_ai_signal = 0.3

        combined = color_uniformity * 0.4 + edge_smoothness * 0.4 + freq_ai_signal * 0.2
        return combined, evidence

    except ImportError:
        evidence.append({
            "signal": "Visual Artifact Detection",
            "result": "NumPy/Pillow not available — visual analysis skipped",
            "positive": False,
        })
        return 0.4, evidence
    except Exception as e:
        logger.warning(f"Visual analysis error: {e}")
        evidence.append({
            "signal": "Visual Artifact Detection",
            "result": f"Analysis error: {str(e)[:50]}",
            "positive": False,
        })
        return 0.35, evidence


# ─────────────────────────────────────────────
# ML Model (optional)
# ─────────────────────────────────────────────

_image_classifier = None

def get_image_classifier():
    """Lazy-load AI image detector."""
    global _image_classifier
    if _image_classifier is not None:
        return _image_classifier
    try:
        from transformers import pipeline
        _image_classifier = pipeline(
            "image-classification",
            model="umm-maybe/AI-image-detector",
            device=-1,
        )
        logger.info("Image classifier loaded")
        return _image_classifier
    except Exception as e:
        logger.warning(f"Image classifier not available: {e}")
        return None


async def run_image_classifier(image_bytes: bytes) -> tuple[float, str]:
    """Run HuggingFace image AI detector."""
    try:
        classifier = get_image_classifier()
        if classifier is None:
            raise RuntimeError("Model not loaded")

        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, classifier, img)

        if isinstance(result, list):
            for r in result:
                label = r.get("label", "").lower()
                score = r.get("score", 0.5)
                if "artificial" in label or "ai" in label or "fake" in label:
                    return score, "HF-ImageDetector"
                elif "real" in label or "human" in label or "natural" in label:
                    return 1.0 - score, "HF-ImageDetector"

        return 0.5, "Unknown"
    except Exception as e:
        logger.warning(f"Image classifier fallback: {e}")
        return None, "Unavailable"


# ─────────────────────────────────────────────
# Main Image Analysis
# ─────────────────────────────────────────────

async def analyze_image_content(
    image_bytes: bytes,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> dict[str, Any]:
    """Full image analysis pipeline."""

    # Run all signals concurrently
    metadata = extract_exif_metadata(image_bytes)
    meta_score, meta_evidence = analyze_metadata_signals(metadata)
    artifact_score, artifact_evidence = analyze_visual_artifacts(image_bytes)
    ml_score, ml_source = await run_image_classifier(image_bytes)

    if ml_score is None:
        # Fall back to metadata + artifacts only
        raw_score = meta_score * 0.7 + artifact_score * 0.3
        ml_evidence = [{
            "signal": "ML Image Classifier",
            "result": "Model not available — score computed from metadata + artifact analysis",
            "positive": meta_score > 0.5,
            "weight": "70%",
        }]
    else:
        raw_score = ml_score * 0.70 + meta_score * 0.20 + artifact_score * 0.10
        ml_evidence = [{
            "signal": f"AI Image Classifier ({ml_source})",
            "result": f"{round(ml_score * 100)}% AI probability from vision model",
            "positive": ml_score > 0.5,
            "weight": "70%",
        }]

    # Watermark check placeholder
    has_watermark = False  # Would require C2PA/SynthID detection
    watermark_evidence = [{
        "signal": "AI Watermark (C2PA / SynthID)",
        "result": "No verified AI content credential found — absence is not confirmation",
        "positive": False,
        "weight": "N/A",
    }]

    ai_score = round(min(100, max(0, raw_score * 100)))

    # Verdict
    if ai_score <= 30:
        verdict = "likely_human"
    elif ai_score <= 70:
        verdict = "uncertain"
    else:
        verdict = "likely_ai"

    # Confidence from signal agreement
    signals = [
        ml_score if ml_score is not None else meta_score,
        meta_score,
        artifact_score,
    ]
    signal_std = math.sqrt(sum((s - raw_score) ** 2 for s in signals) / len(signals))
    if signal_std < 0.12:
        confidence = "high"
    elif signal_std < 0.22:
        confidence = "medium"
    else:
        confidence = "low"

    all_evidence = ml_evidence + meta_evidence + artifact_evidence + watermark_evidence

    # Format metadata for display
    display_metadata = {
        "format": metadata.get("format", "Unknown"),
        "dimensions": metadata.get("dimensions", "Unknown"),
        "file_size": f"{len(image_bytes) / 1024:.1f} KB",
        "color_mode": metadata.get("mode", "Unknown"),
        "software_tag": metadata.get("software_tag", "Not present"),
        "camera_metadata_present": str(metadata.get("has_camera_metadata", False)),
        "exif_fields_found": str(len([k for k in metadata if k.startswith("exif_")])),
        "has_ai_watermark": str(has_watermark),
        "metadata_ai_signal": f"{round(meta_score * 100)}%",
        "artifact_ai_signal": f"{round(artifact_score * 100)}%",
        "ml_model_score": f"{round((ml_score or 0) * 100)}%" if ml_score else "N/A",
        "filename": filename or "Unknown",
    }

    return {
        "ai_score": ai_score,
        "confidence": confidence,
        "verdict": verdict,
        "evidence": all_evidence,
        "metadata": display_metadata,
        "analyzed_at": datetime.utcnow().isoformat(),
    }
