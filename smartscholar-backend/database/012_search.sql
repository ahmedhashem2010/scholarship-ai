-- =============================================================================
-- 012_search.sql — Full-text & trigram search for SmartScholar
-- Generated from docs/DATABASE.md §12. Run after 001–011.
-- The generated search_vector + GIN indexes already exist in 003/004.
-- This file adds the search function used by the app API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- search_scholarships — ranked FTS with trigram fallback
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_scholarships(
  query text,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug varchar(250),
  title varchar(300),
  title_ar varchar(300),
  provider_name varchar(200),
  country_name varchar(120),
  country_code varchar(2),
  funding_type funding_type,
  closing_date date,
  next_deadline timestamptz,
  rank real
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  BEGIN
    v_tsquery := plainto_tsquery('simple', query);
  EXCEPTION WHEN syntax_error THEN
    v_tsquery := NULL;
  END;

  RETURN QUERY
  SELECT
    s.id, s.slug, s.title, s.title_ar,
    p.name AS provider_name,
    c.name AS country_name, c.code AS country_code,
    s.funding_type, s.closing_date, s.next_deadline,
    CASE
      WHEN v_tsquery IS NOT NULL THEN ts_rank(s.search_vector, v_tsquery)
      ELSE similarity(s.title, query)
    END AS rank
  FROM scholarships s
  LEFT JOIN providers p ON p.id = s.provider_id
  LEFT JOIN countries c ON c.id = s.country_id
  WHERE s.deleted_at IS NULL
    AND s.status = 'ACTIVE'
    AND (
      (v_tsquery IS NOT NULL AND s.search_vector @@ v_tsquery)
      OR (v_tsquery IS NULL AND similarity(s.title, query) > 0.2)
      OR (s.title ILIKE '%' || query || '%')
      OR (s.title_ar ILIKE '%' || query || '%')
    )
  ORDER BY rank DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- -----------------------------------------------------------------------------
-- search_suggestions — lightweight title prefix/similarity suggestions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_suggestions(query text, p_limit int DEFAULT 8)
RETURNS TABLE (suggestion text, id uuid, slug varchar(250))
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT s.title AS suggestion, s.id, s.slug
  FROM scholarships s
  WHERE s.deleted_at IS NULL
    AND (s.title ILIKE '%' || query || '%' OR similarity(s.title, query) > 0.3)
  ORDER BY similarity(s.title, query) DESC
  LIMIT p_limit;
$$;

-- -----------------------------------------------------------------------------
-- Revoke public write; grants in 016_permissions.sql
-- -----------------------------------------------------------------------------
