-- ═══════════════════════════════════════════════
--   DetectAI — PostgreSQL Schema
-- ═══════════════════════════════════════════════

-- Analyses table: stores each detection result
CREATE TABLE IF NOT EXISTS analyses (
    id          SERIAL PRIMARY KEY,
    input_type  VARCHAR(10) NOT NULL CHECK (input_type IN ('text', 'image')),
    ai_score    INTEGER NOT NULL CHECK (ai_score BETWEEN 0 AND 100),
    confidence  VARCHAR(10) NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    verdict     VARCHAR(20) NOT NULL CHECK (verdict IN ('likely_human', 'uncertain', 'likely_ai')),
    evidence    JSONB,
    metadata    JSONB,
    ip_hash     VARCHAR(64),  -- hashed for privacy
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_verdict ON analyses(verdict);
CREATE INDEX IF NOT EXISTS idx_analyses_ai_score ON analyses(ai_score);

-- Stats view
CREATE OR REPLACE VIEW analysis_stats AS
SELECT
    COUNT(*) AS total_analyses,
    COUNT(*) FILTER (WHERE input_type = 'text') AS text_analyses,
    COUNT(*) FILTER (WHERE input_type = 'image') AS image_analyses,
    COUNT(*) FILTER (WHERE verdict = 'likely_ai') AS ai_detected,
    COUNT(*) FILTER (WHERE verdict = 'likely_human') AS human_detected,
    COUNT(*) FILTER (WHERE verdict = 'uncertain') AS uncertain,
    ROUND(AVG(ai_score), 1) AS avg_ai_score,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h
FROM analyses;
