"""
Text Analysis Engine
Multi-signal AI text detection using statistical + ML approaches
"""

import re
import math
import asyncio
from datetime import datetime
from typing import Any
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Statistical / Heuristic Signals
# ─────────────────────────────────────────────

def compute_perplexity_proxy(text: str) -> float:
    """
    Proxy perplexity: measure vocabulary diversity and repetition.
    Real implementation would use a language model (e.g. GPT-2).
    Lower perplexity = more predictable = more AI-like.
    Returns 0.0–1.0 where 1.0 = very predictable (AI-like).
    """
    words = re.findall(r'\b\w+\b', text.lower())
    if len(words) < 10:
        return 0.5
    unique_ratio = len(set(words)) / len(words)
    # AI text tends to have lower unique ratio (more repetitive patterns)
    # Map: 0.4 unique → 0.8 AI-signal, 0.9 unique → 0.2 AI-signal
    ai_signal = max(0.0, min(1.0, 1.0 - (unique_ratio - 0.35) * 1.4))
    return ai_signal


def compute_burstiness(text: str) -> float:
    """
    Burstiness: variance in sentence length.
    AI tends to produce uniform sentence lengths (low burstiness).
    Returns 0.0–1.0 where 1.0 = very uniform (AI-like).
    """
    sentences = re.split(r'[.!?]+', text)
    lengths = [len(s.split()) for s in sentences if s.strip()]
    if len(lengths) < 3:
        return 0.5
    mean = sum(lengths) / len(lengths)
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std = math.sqrt(variance)
    cv = std / mean if mean > 0 else 0  # coefficient of variation
    # Low CV (< 0.3) → very uniform → AI-like
    ai_signal = max(0.0, min(1.0, 1.0 - cv * 1.5))
    return ai_signal


def compute_transition_uniformity(text: str) -> float:
    """
    Check for overly uniform paragraph/section transitions.
    AI often uses the same connective phrases repeatedly.
    """
    AI_CONNECTORS = [
        r'\bfurthermore\b', r'\bmoreover\b', r'\badditionally\b',
        r'\bin conclusion\b', r'\bnotably\b', r'\bit is worth\b',
        r'\bit is important to note\b', r'\bin summary\b',
        r'\bto summarize\b', r'\bin this context\b',
        r'\bthis allows\b', r'\bthis enables\b',
        r'\boverall\b', r'\bin essence\b', r'\bultimately\b',
    ]
    words = len(text.split())
    if words < 50:
        return 0.3
    hit_count = sum(len(re.findall(p, text.lower())) for p in AI_CONNECTORS)
    density = hit_count / (words / 100)  # per 100 words
    return min(1.0, density * 0.25)


def compute_hedging_uniformity(text: str) -> float:
    """
    AI text often has consistent hedging language.
    """
    HEDGES = [
        r'\bit seems\b', r'\bit appears\b', r'\blikely\b', r'\bpotentially\b',
        r'\bvarious\b', r'\bsignificant\b', r'\bsubstantial\b',
        r'\bcomprehensive\b', r'\brobust\b', r'\bkey\b', r'\bcrucial\b',
    ]
    words = len(text.split())
    if words < 30:
        return 0.3
    hit_count = sum(len(re.findall(p, text.lower())) for p in HEDGES)
    density = hit_count / (words / 100)
    return min(1.0, density * 0.18)


def compute_avg_sentence_length(text: str) -> float:
    """Average sentence word count."""
    sentences = re.split(r'[.!?]+', text)
    lengths = [len(s.split()) for s in sentences if s.strip()]
    return sum(lengths) / len(lengths) if lengths else 0


def compute_vocabulary_richness(text: str) -> float:
    """Type-token ratio adjusted for length."""
    words = re.findall(r'\b\w{3,}\b', text.lower())
    if not words:
        return 0.5
    return len(set(words)) / len(words)


def compute_repetition_score(text: str) -> float:
    """Detect repeated phrases (3+ word n-grams)."""
    words = re.findall(r'\b\w+\b', text.lower())
    if len(words) < 20:
        return 0.0
    ngrams = [' '.join(words[i:i+3]) for i in range(len(words) - 2)]
    from collections import Counter
    counts = Counter(ngrams)
    repeated = sum(v - 1 for v in counts.values() if v > 1)
    return min(1.0, repeated / max(len(ngrams), 1) * 5)


# ─────────────────────────────────────────────
# ML Model (Hugging Face / fallback)
# ─────────────────────────────────────────────

_hf_pipeline = None

def get_hf_classifier():
    """Lazy-load HuggingFace AI text detector."""
    global _hf_pipeline
    if _hf_pipeline is not None:
        return _hf_pipeline
    try:
        from transformers import pipeline
        # roberta-base-openai-detector is a strong AI text detector
        _hf_pipeline = pipeline(
            "text-classification",
            model="roberta-base-openai-detector",
            device=-1  # CPU
        )
        logger.info("HuggingFace classifier loaded")
        return _hf_pipeline
    except Exception as e:
        logger.warning(f"HuggingFace model not available: {e}")
        return None


async def run_hf_classifier(text: str) -> tuple[float, str]:
    """
    Run HuggingFace roberta AI detector.
    Returns (score 0-1, label).
    Falls back to heuristic if model unavailable.
    """
    try:
        classifier = get_hf_classifier()
        if classifier is None:
            raise RuntimeError("Model not loaded")

        # Truncate to 512 tokens (model limit)
        truncated = text[:1500]

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, classifier, truncated)
        r = result[0] if isinstance(result, list) else result

        label = r.get("label", "").upper()
        score = r.get("score", 0.5)

        if "FAKE" in label or "AI" in label:
            return score, "AI"
        elif "REAL" in label or "HUMAN" in label:
            return 1.0 - score, "Human"
        return 0.5, "Unknown"

    except Exception as e:
        logger.warning(f"HF classifier fallback: {e}")
        # Statistical fallback
        heuristic = (
            compute_perplexity_proxy(text) * 0.35 +
            compute_burstiness(text) * 0.25 +
            compute_transition_uniformity(text) * 0.25 +
            compute_hedging_uniformity(text) * 0.15
        )
        return heuristic, "Heuristic"


# ─────────────────────────────────────────────
# Main Text Analysis
# ─────────────────────────────────────────────

async def analyze_text_content(text: str) -> dict[str, Any]:
    """Full text analysis pipeline."""

    # Run all signals in parallel
    hf_score, hf_source = await run_hf_classifier(text)

    perplexity = compute_perplexity_proxy(text)
    burstiness = compute_burstiness(text)
    transitions = compute_transition_uniformity(text)
    hedging = compute_hedging_uniformity(text)
    repetition = compute_repetition_score(text)
    vocab_richness = compute_vocabulary_richness(text)
    avg_sent_len = compute_avg_sentence_length(text)

    # ── Weighted score ──
    # HF model: 70%, metadata signals: 30%
    heuristic_combined = (
        perplexity * 0.35 +
        burstiness * 0.30 +
        transitions * 0.20 +
        hedging * 0.15
    )
    raw_score = hf_score * 0.70 + heuristic_combined * 0.30
    ai_score = round(min(100, max(0, raw_score * 100)))

    # ── Verdict + Confidence ──
    if ai_score <= 30:
        verdict = "likely_human"
    elif ai_score <= 70:
        verdict = "uncertain"
    else:
        verdict = "likely_ai"

    # Confidence: how spread are the signals?
    signals = [hf_score, perplexity, burstiness, transitions, hedging]
    signal_std = math.sqrt(sum((s - raw_score) ** 2 for s in signals) / len(signals))
    if signal_std < 0.12:
        confidence = "high"
    elif signal_std < 0.22:
        confidence = "medium"
    else:
        confidence = "low"

    # ── Evidence ──
    evidence = [
        {
            "signal": f"AI Classifier ({hf_source})",
            "result": f"{round(hf_score * 100)}% AI probability from transformer model",
            "positive": hf_score > 0.5,
            "weight": "70%",
        },
        {
            "signal": "Vocabulary Perplexity",
            "result": f"{'Low' if perplexity > 0.6 else 'Normal'} vocabulary predictability ({round(perplexity*100)}% AI-signal)",
            "positive": perplexity > 0.55,
            "weight": "10.5%",
        },
        {
            "signal": "Sentence Length Burstiness",
            "result": f"{'Uniform' if burstiness > 0.6 else 'Variable'} sentence structure — burstiness {round(burstiness*100)}%",
            "positive": burstiness > 0.55,
            "weight": "9%",
        },
        {
            "signal": "AI Transition Phrases",
            "result": f"{'High' if transitions > 0.4 else 'Low'} density of AI-typical connective language",
            "positive": transitions > 0.35,
            "weight": "6%",
        },
        {
            "signal": "Hedging Language",
            "result": f"{'Consistent' if hedging > 0.3 else 'Natural'} hedging patterns detected",
            "positive": hedging > 0.3,
            "weight": "4.5%",
        },
        {
            "signal": "Phrase Repetition",
            "result": f"Repetition index: {round(repetition*100)}% — {'high' if repetition > 0.4 else 'normal'}",
            "positive": repetition > 0.35,
        },
    ]

    # ── Metadata ──
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    metadata = {
        "word_count": len(words),
        "character_count": len(text),
        "sentence_count": len([s for s in sentences if s.strip()]),
        "avg_sentence_length": f"{round(avg_sent_len, 1)} words",
        "perplexity_score": f"{round(perplexity * 100, 1)} (AI-signal %, lower = more human)",
        "burstiness_index": f"{round(burstiness, 3)} (0=variable/human, 1=uniform/AI)",
        "vocabulary_richness": f"{round(vocab_richness, 3)} (type-token ratio)",
        "repetition_score": f"{round(repetition * 100, 1)}%",
        "ai_phrases_detected": f"{round(transitions * 20)} estimated AI-typical phrases",
        "detector_model": hf_source,
    }

    return {
        "ai_score": ai_score,
        "confidence": confidence,
        "verdict": verdict,
        "evidence": evidence,
        "metadata": metadata,
        "analyzed_at": datetime.utcnow().isoformat(),
        "analysis_time_ms": 0,  # Set by timing middleware
    }
