-- =============================================================================
-- 013_embeddings.sql — pgvector embeddings functions for SmartScholar
-- Generated from docs/DATABASE.md §13. Run after 001–012.
-- Column/index live in 003/004; this file adds the helper functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- upsert_embedding — insert or replace an entity's embedding
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION upsert_embedding(
  p_entity_type varchar,
  p_entity_id uuid,
  p_content text,
  p_embedding vector,
  p_provider ai_provider,
  p_model varchar
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO ai_embeddings (
    entity_type, entity_id, content, content_hash, embedding, provider, model, dimensions
  )
  VALUES (
    p_entity_type, p_entity_id, p_content,
    encode(sha256(convert_to(coalesce(p_content, ''), 'UTF8')), 'hex'),
    p_embedding, p_provider, p_model, vector_dims(p_embedding)
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    content = EXCLUDED.content,
    content_hash = EXCLUDED.content_hash,
    embedding = EXCLUDED.embedding,
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    dimensions = EXCLUDED.dimensions,
    updated_at = now();
END;
$$;

-- -----------------------------------------------------------------------------
-- vector_search_scholarships — top-k by cosine similarity
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION vector_search_scholarships(
  p_embedding vector,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  slug varchar(250),
  title varchar(300),
  title_ar varchar(300),
  similarity real
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    s.id, s.slug, s.title, s.title_ar,
    1 - (e.embedding <=> p_embedding) AS similarity
  FROM ai_embeddings e
  JOIN scholarships s ON s.id = e.entity_id
  WHERE e.entity_type = 'scholarship'
    AND s.deleted_at IS NULL
    AND s.status = 'ACTIVE'
  ORDER BY e.embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- -----------------------------------------------------------------------------
-- similar_scholarships — embedding similarity + shared attribute overlap
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION similar_scholarships(
  p_scholarship_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  scholarship_id uuid,
  similarity real
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_embedding vector;
  v_country_id uuid;
  v_degree_level_id uuid;
  v_funding_type funding_type;
BEGIN
  SELECT embedding INTO v_embedding
  FROM ai_embeddings
  WHERE entity_type = 'scholarship' AND entity_id = p_scholarship_id;

  SELECT country_id, degree_level_id, funding_type
    INTO v_country_id, v_degree_level_id, v_funding_type
  FROM scholarships WHERE id = p_scholarship_id;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      s.id AS scholarship_id,
      CASE
        WHEN v_embedding IS NOT NULL
          THEN (1 - (e.embedding <=> v_embedding)) * 0.6
        ELSE 0
      END
      + CASE WHEN s.country_id = v_country_id THEN 0.2 ELSE 0 END
      + CASE WHEN s.degree_level_id = v_degree_level_id THEN 0.1 ELSE 0 END
      + CASE WHEN s.funding_type = v_funding_type THEN 0.1 ELSE 0 END
      AS similarity
    FROM scholarships s
    LEFT JOIN ai_embeddings e
      ON e.entity_type = 'scholarship' AND e.entity_id = s.id
    WHERE s.id <> p_scholarship_id
      AND s.deleted_at IS NULL
      AND s.status = 'ACTIVE'
  )
  SELECT r.scholarship_id, r.similarity::real
  FROM ranked r
  WHERE r.similarity > 0
  ORDER BY r.similarity DESC
  LIMIT p_limit;
END;
$$;

-- -----------------------------------------------------------------------------
-- get_embedding_if_changed — content-hash guard for backfill scripts
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_embedding_if_changed(
  p_entity_type varchar,
  p_entity_id uuid,
  p_content text,
  OUT content_hash char(64)
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_hash char(64);
  v_existing_hash char(64);
BEGIN
  v_new_hash := encode(sha256(convert_to(coalesce(p_content, ''), 'UTF8')), 'hex');
  SELECT e.content_hash INTO v_existing_hash
  FROM ai_embeddings e
  WHERE e.entity_type = p_entity_type AND e.entity_id = p_entity_id;

  IF v_existing_hash IS DISTINCT FROM v_new_hash THEN
    content_hash := v_new_hash;
  ELSE
    content_hash := NULL;
  END IF;
END;
$$;
