"""
Database connection — PostgreSQL via asyncpg or Supabase
Falls back gracefully if DB not configured.
"""

import os
import json
import logging
from datetime import datetime
from typing import Any, Optional

logger = logging.getLogger(__name__)

_pool = None


async def init_db():
    """Initialize database connection pool."""
    global _pool
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.info("DATABASE_URL not set — running without persistence")
        return

    try:
        import asyncpg
        _pool = await asyncpg.create_pool(db_url, min_size=1, max_size=5)

        # Create table if not exists
        async with _pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS analyses (
                    id          SERIAL PRIMARY KEY,
                    input_type  VARCHAR(10) NOT NULL,
                    ai_score    INTEGER NOT NULL,
                    confidence  VARCHAR(10) NOT NULL,
                    verdict     VARCHAR(20) NOT NULL,
                    evidence    JSONB,
                    metadata    JSONB,
                    created_at  TIMESTAMPTZ DEFAULT NOW()
                )
            """)
        logger.info("Database ready")
    except ImportError:
        logger.warning("asyncpg not installed — skipping DB")
    except Exception as e:
        logger.warning(f"DB init error: {e}")


async def save_analysis(input_type: str, result: dict[str, Any]) -> Optional[int]:
    """Persist analysis result to database."""
    if _pool is None:
        return None

    try:
        async with _pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO analyses (input_type, ai_score, confidence, verdict, evidence, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                input_type,
                result.get("ai_score", 0),
                result.get("confidence", "low"),
                result.get("verdict", "uncertain"),
                json.dumps(result.get("evidence", [])),
                json.dumps(result.get("metadata", {})),
            )
            return row["id"]
    except Exception as e:
        logger.error(f"Failed to save analysis: {e}")
        return None


async def get_recent_analyses(limit: int = 10) -> list[dict]:
    """Fetch recent analyses (for dashboard use)."""
    if _pool is None:
        return []

    try:
        async with _pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, input_type, ai_score, confidence, verdict, created_at "
                "FROM analyses ORDER BY created_at DESC LIMIT $1",
                limit,
            )
            return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Failed to fetch analyses: {e}")
        return []
