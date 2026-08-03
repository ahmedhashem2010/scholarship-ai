-- =============================================================================
-- 015_imports.sql — Import / dedupe / verification pipeline for SmartScholar
-- Generated from docs/DATABASE.md §15. Run after 001–014.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- import_dedupe — pg_trgm title-similarity duplicate detection.
-- Given a scholarship id, finds any other non-deleted scholarship whose title
-- matches beyond the threshold, records a `duplicates` row and returns the
-- existing id (or NULL when no match is found).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION import_dedupe(
  p_scholarship_id uuid,
  p_threshold real DEFAULT 0.85
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title varchar(300);
  v_match uuid;
  v_sim   real;
BEGIN
  SELECT s.title INTO v_title FROM scholarships s WHERE s.id = p_scholarship_id;
  IF v_title IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.id, similarity(s.title, v_title)
    INTO v_match, v_sim
  FROM scholarships s
  WHERE s.id <> p_scholarship_id
    AND s.deleted_at IS NULL
    AND similarity(s.title, v_title) > p_threshold
  ORDER BY similarity(s.title, v_title) DESC, s.created_at
  LIMIT 1;

  IF v_match IS NOT NULL THEN
    INSERT INTO duplicates (scholarship_id, duplicate_of_id, similarity, method)
    VALUES (p_scholarship_id, v_match, round(v_sim * 100, 2), 'trgm_title')
    ON CONFLICT (scholarship_id, duplicate_of_id) DO NOTHING;
  END IF;

  RETURN v_match;
END;
$$;

-- -----------------------------------------------------------------------------
-- find_scholarship_by_title — best pg_trgm match for a title (no side effects)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION find_scholarship_by_title(
  p_title varchar,
  p_threshold real DEFAULT 0.85
)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT s.id
  FROM scholarships s
  WHERE s.deleted_at IS NULL
    AND similarity(s.title, p_title) > p_threshold
  ORDER BY similarity(s.title, p_title) DESC, s.created_at
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- process_import_item — hash → dedupe → upsert scholarship → version → enqueue
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION process_import_item(p_item_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item     import_queue_items%ROWTYPE;
  v_hash     char(64);
  v_dup      uuid;
  v_sch      uuid;
BEGIN
  SELECT * INTO v_item FROM import_queue_items WHERE id = p_item_id FOR UPDATE;

  IF v_item.status = 'COMPLETED' THEN
    RETURN v_item.scholarship_id;
  END IF;

  UPDATE import_queue_items SET status = 'PROCESSING', updated_at = now() WHERE id = p_item_id;

  -- 1) content hash guard (same raw payload already ingested?)
  v_hash := encode(sha256(convert_to(coalesce(v_item.raw_payload::text, ''), 'UTF8')), 'hex');
  IF v_item.content_hash IS NOT NULL AND v_item.content_hash = v_hash THEN
    UPDATE import_queue_items SET status = 'SKIPPED', updated_at = now() WHERE id = p_item_id;
    RETURN v_item.scholarship_id;
  END IF;

  -- 2) duplicate detection on extracted title (before any insert)
  v_dup := find_scholarship_by_title(v_item.extracted ->> 'title');
  IF v_dup IS NOT NULL THEN
    UPDATE import_queue_items
      SET status = 'DUPLICATE', scholarship_id = v_dup, content_hash = v_hash, updated_at = now()
    WHERE id = p_item_id;
    RETURN v_dup;
  END IF;

  -- 3) upsert scholarship (slug is the natural key for scraped rows)
  INSERT INTO scholarships (
    slug, title, title_ar, description, description_ar, provider_id, country_id,
    university_id, degree_level_id, study_field_id, funding_type, application_url,
    official_website, source_url, source_id, metadata, needs_embedding
  )
  VALUES (
    unique_slug(coalesce(v_item.extracted ->> 'title', 'imported'), 'scholarships'),
    coalesce(v_item.extracted ->> 'title', 'Untitled'),
    v_item.extracted ->> 'title_ar',
    v_item.extracted ->> 'description',
    v_item.extracted ->> 'description_ar',
    (v_item.extracted ->> 'provider_id')::uuid,
    (v_item.extracted ->> 'country_id')::uuid,
    (v_item.extracted ->> 'university_id')::uuid,
    (v_item.extracted ->> 'degree_level_id')::uuid,
    (v_item.extracted ->> 'study_field_id')::uuid,
    coalesce((v_item.extracted ->> 'funding_type')::funding_type, 'UNKNOWN'),
    v_item.extracted ->> 'application_url',
    v_item.extracted ->> 'official_website',
    coalesce(v_item.source_url, v_item.extracted ->> 'source_url'),
    (v_item.extracted ->> 'source_id')::uuid,
    v_item.raw_payload,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata
  RETURNING id INTO v_sch;

  -- 4) version snapshot (CREATE)
  PERFORM create_scholarship_version(v_sch, 'CREATE', NULL);

  -- 5) enqueue verification
  INSERT INTO verification_queue (scholarship_id)
  VALUES (v_sch)
  ON CONFLICT (scholarship_id) DO NOTHING;

  -- 6) mark item complete
  UPDATE import_queue_items
    SET status = 'COMPLETED', scholarship_id = v_sch, content_hash = v_hash, processed_at = now(), updated_at = now()
  WHERE id = p_item_id;

  -- 7) bump batch counters
  UPDATE import_batches SET
    succeeded = succeeded + 1
  WHERE id = v_item.batch_id;
  RETURN v_sch;
END;
$$;

-- -----------------------------------------------------------------------------
-- finish_import_batch — reconcile batch status from item counts
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION finish_import_batch(p_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total    int;
  v_complete int;
  v_failed   int;
  v_dup      int;
  v_skipped  int;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status IN ('COMPLETED', 'DUPLICATE', 'SKIPPED')),
    count(*) FILTER (WHERE status = 'FAILED'),
    count(*) FILTER (WHERE status = 'DUPLICATE'),
    count(*) FILTER (WHERE status = 'SKIPPED')
    INTO v_total, v_complete, v_failed, v_dup, v_skipped
  FROM import_queue_items WHERE batch_id = p_batch_id;

  UPDATE import_batches SET
    total_items = v_total,
    succeeded = v_complete,
    failed = v_failed,
    duplicates_found = v_dup,
    skipped = v_skipped,
    status = CASE
      WHEN v_total = 0 THEN 'COMPLETED'
      WHEN v_failed = 0 AND v_complete > 0 THEN 'COMPLETED'
      WHEN v_complete + v_failed = v_total THEN 'PARTIAL'
      ELSE 'PROCESSING'
    END,
    finished_at = CASE
      WHEN v_total = 0 OR v_failed = 0 THEN now()
      ELSE finished_at
    END,
    updated_at = now()
  WHERE id = p_batch_id;
END;
$$;
