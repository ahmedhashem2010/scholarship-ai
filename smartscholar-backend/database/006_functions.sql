-- =============================================================================
-- 006_functions.sql â€” Stored functions for SmartScholar
-- Generated from docs/DATABASE.md Â§7. Run after 001â€“005.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(
           regexp_replace(
             regexp_replace(lower(unaccent(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'),
             '-+', '-', 'g'
           ),
           '-'
         );
$$;

CREATE OR REPLACE FUNCTION unique_slug(input text, tbl text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  base      text;
  candidate text;
  i         int;
BEGIN
  base := slugify(input);
  IF base IS NULL OR base = '' THEN
    base := 'item';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM format('%I', tbl)::regclass WHERE slug = base AND deleted_at IS NULL) THEN
    RETURN base;
  END IF;

  FOR i IN 2..100 LOOP
    candidate := base || '-' || i::text;
    IF NOT EXISTS (SELECT 1 FROM format('%I', tbl)::regclass WHERE slug = candidate AND deleted_at IS NULL) THEN
      RETURN candidate;
    END IF;
  END LOOP;

  candidate := base || '-' || substr(md5(random()::text), 1, 6);
  RETURN candidate;
END;
$$;

-- -----------------------------------------------------------------------------
-- Auth helpers (Supabase)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
      AND account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN', 'COUNSELOR')
      AND account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT role FROM users WHERE id = auth.uid()), 'STUDENT');
$$;

CREATE OR REPLACE FUNCTION user_owns(owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (current_user_id() = owner_id OR is_admin());
$$;

-- -----------------------------------------------------------------------------
-- Scholarship date / application maintenance
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_scholarship_dates(target uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_cycle    scholarship_cycles%ROWTYPE;
  v_deadline timestamptz;
BEGIN
  SELECT * INTO v_cycle
  FROM scholarship_cycles
  WHERE scholarship_id = target
    AND deleted_at IS NULL
    AND is_current
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT min(closing_date) INTO v_deadline
  FROM scholarship_cycles
  WHERE scholarship_id = target
    AND deleted_at IS NULL
    AND closing_date >= CURRENT_DATE
    AND status IN ('UPCOMING', 'OPEN');

  IF v_deadline IS NULL THEN
    SELECT max(closing_date) INTO v_deadline
    FROM scholarship_cycles
    WHERE scholarship_id = target
      AND deleted_at IS NULL;
  END IF;

  UPDATE scholarships SET
    opening_date   = COALESCE(v_cycle.opening_date, opening_date),
    closing_date   = COALESCE(v_cycle.closing_date, closing_date),
    interview_date = COALESCE(v_cycle.interview_date, interview_date),
    results_date   = COALESCE(v_cycle.results_date, results_date),
    enrollment_date = COALESCE(v_cycle.enrollment_date, enrollment_date),
    next_deadline  = v_deadline
  WHERE id = target;
END;
$$;

CREATE OR REPLACE FUNCTION update_application_progress(app_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total int;
  v_done  int;
BEGIN
  SELECT count(*) INTO v_total FROM application_stages WHERE application_id = app_id;
  SELECT count(*) INTO v_done  FROM application_stages WHERE application_id = app_id AND status = 'COMPLETED';

  UPDATE applications SET
    progress = CASE WHEN v_total = 0 THEN 0 ELSE round(100.0 * v_done / v_total, 2) END,
    submitted_at = CASE WHEN status = 'SUBMITTED' AND submitted_at IS NULL THEN now() ELSE submitted_at END
  WHERE id = app_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_scholarship_version(
  target uuid,
  change_type_value change_type,
  actor uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_next int;
BEGIN
  SELECT COALESCE(max(version), 0) + 1 INTO v_next
  FROM scholarship_versions
  WHERE scholarship_id = target;

  INSERT INTO scholarship_versions (scholarship_id, version, snapshot, change_type, changed_by)
  SELECT id, v_next, to_jsonb(scholarships.*), change_type_value, actor
  FROM scholarships
  WHERE id = target;
END;
$$;

-- -----------------------------------------------------------------------------
-- Activity / analytics / notifications (server-side, security definer)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_activity(
  target_user uuid,
  type_value activity_type,
  details text,
  entity_type_value entity_type,
  entity_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO activity_logs (user_id, activity_type, details, entity_type, entity_id)
  VALUES (coalesce(target_user, auth.uid()), type_value, details, entity_type_value, entity_id);
END;
$$;

CREATE OR REPLACE FUNCTION record_analytics_event(
  event_name varchar,
  event_data jsonb,
  ip_address varchar,
  user_agent varchar,
  page_path varchar,
  referrer varchar,
  country_code varchar,
  device_type varchar,
  browser varchar
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO analytics_events (
    user_id, event_name, event_data, ip_address, user_agent, url, referrer, country_code, device, browser
  )
  VALUES (auth.uid(), event_name, event_data, ip_address, user_agent, page_path, referrer, country_code, device_type, browser);
END;
$$;

CREATE OR REPLACE FUNCTION create_notification(
  recipient uuid,
  notif_type notification_type,
  notif_title varchar,
  notif_body text,
  notif_link varchar,
  notif_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link, data)
  VALUES (recipient, notif_type, notif_title, notif_body, notif_link, notif_metadata);
END;
$$;

-- -----------------------------------------------------------------------------
-- Soft delete (allowlisted)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION soft_delete(tbl text, target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  allowlist text[] := ARRAY[
    'universities', 'providers', 'countries', 'cities', 'continents', 'currencies',
    'degrees', 'study_fields', 'languages', 'campuses',
    'scholarships', 'scholarship_cycles', 'scholarship_benefits', 'scholarship_requirements',
    'scholarship_test_requirements', 'scholarship_documents', 'scholarship_degrees',
    'scholarship_fields', 'scholarship_eligible_countries', 'scholarship_languages',
    'scholarship_reviews', 'scholarship_faqs', 'scholarship_gallery', 'scholarship_news',
    'scholarship_similarities', 'blogs', 'events', 'event_attendees',
    'saved_scholarships', 'favorites', 'applications', 'application_stages',
    'application_tasks', 'application_documents', 'ai_chats', 'ai_chat_messages',
    'ai_reviews', 'ai_reports', 'acceptance_predictions', 'ai_matching_jobs',
    'search_history', 'notifications', 'emails', 'payments',
    'import_batches', 'import_queue_items', 'verification_queue', 'duplicates', 'sources'
  ];
BEGIN
  IF NOT (tbl = ANY(allowlist)) THEN
    RAISE EXCEPTION 'Table not allowlisted for soft_delete: %', tbl;
  END IF;
  EXECUTE format('UPDATE %I SET deleted_at = now() WHERE id = $1', tbl) USING target_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Scholarship merge (admin)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION merge_scholarships(keep uuid, remove uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    UPDATE applications SET scholarship_id = keep WHERE scholarship_id = remove;
    UPDATE saved_scholarships SET scholarship_id = keep WHERE scholarship_id = remove ON CONFLICT (user_id, scholarship_id) DO NOTHING;
    DELETE FROM saved_scholarships WHERE scholarship_id = remove;
    UPDATE favorites SET scholarship_id = keep WHERE scholarship_id = remove ON CONFLICT (user_id, scholarship_id) DO NOTHING;
    DELETE FROM favorites WHERE scholarship_id = remove;
    UPDATE acceptance_predictions SET scholarship_id = keep WHERE scholarship_id = remove ON CONFLICT (user_id, scholarship_id) DO NOTHING;
    DELETE FROM acceptance_predictions WHERE scholarship_id = remove;
    UPDATE scholarship_similarities SET scholarship_id = keep WHERE scholarship_id = remove ON CONFLICT (scholarship_id, similar_scholarship_id) DO NOTHING;
    DELETE FROM scholarship_similarities WHERE scholarship_id = remove;
    UPDATE scholarship_similarities SET similar_scholarship_id = keep WHERE similar_scholarship_id = remove ON CONFLICT (scholarship_id, similar_scholarship_id) DO NOTHING;
    DELETE FROM scholarship_similarities WHERE similar_scholarship_id = remove;
    UPDATE import_queue_items SET scholarship_id = keep WHERE scholarship_id = remove;
    UPDATE verification_queue SET scholarship_id = keep WHERE scholarship_id = remove ON CONFLICT (scholarship_id) DO NOTHING;
    DELETE FROM verification_queue WHERE scholarship_id = remove;
    UPDATE ai_embeddings SET entity_id = keep
      WHERE entity_type = 'scholarship' AND entity_id = remove
      ON CONFLICT (entity_type, entity_id) DO NOTHING;
    DELETE FROM ai_embeddings WHERE entity_type = 'scholarship' AND entity_id = remove;

    PERFORM create_scholarship_version(keep, 'MERGE', current_user_id());
    UPDATE scholarships SET status = 'MERGED', deleted_at = now() WHERE id = remove;
    DELETE FROM duplicates WHERE scholarship_id IN (keep, remove) OR duplicate_of_id IN (keep, remove);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'merge_scholarships failed: %', SQLERRM;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- Daily metrics rollup
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_daily_metrics(target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM daily_metrics WHERE metric_date = target_date;

  INSERT INTO daily_metrics (
    metric_date, new_users, active_users, scholarships_added,
    applications_created, applications_submitted, matches_generated,
    ai_reviews_completed, searches, saved_count
  )
  VALUES (
    target_date,
    (SELECT count(*) FROM users WHERE created_at::date = target_date),
    (SELECT count(*) FROM users WHERE last_active_at IS NOT NULL AND last_active_at::date >= target_date - interval '7 days'),
    (SELECT count(*) FROM scholarships WHERE created_at::date = target_date AND deleted_at IS NULL),
    (SELECT count(*) FROM applications WHERE created_at::date = target_date),
    (SELECT count(*) FROM applications WHERE submitted_at IS NOT NULL AND submitted_at::date = target_date),
    (SELECT count(*) FROM ai_matching_jobs WHERE status = 'COMPLETED' AND finished_at IS NOT NULL AND finished_at::date = target_date),
    (SELECT count(*) FROM ai_reviews WHERE status = 'COMPLETED' AND created_at::date = target_date),
    (SELECT count(*) FROM search_history WHERE created_at::date = target_date),
    (SELECT count(*) FROM saved_scholarships WHERE created_at::date = target_date)
  );
END;
$$;
-- -----------------------------------------------------------------------------
-- Trigger helper functions (used by 007_triggers.sql). Kept here so that
-- 007 contains pure trigger DDL and every trigger references a function that
-- exists before the trigger is created (DATABASE.md Â§7/Â§8).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tg_universities_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.name, 'universities');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_providers_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.name, 'providers');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_countries_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.name, 'countries');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_cities_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.name, 'cities');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_blogs_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.title, 'blogs');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_events_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.title, 'events');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_scholarships_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_slug(NEW.title, 'scholarships');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_users_defaults() RETURNS trigger AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  INSERT INTO user_finance (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_cycle_single_current() RETURNS trigger AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE scholarship_cycles
    SET is_current = false
    WHERE scholarship_id = NEW.scholarship_id
      AND deleted_at IS NULL
      AND id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_cycle_sync_dates() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_scholarship_dates(OLD.scholarship_id);
  ELSE
    PERFORM sync_scholarship_dates(NEW.scholarship_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_counter_saves() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scholarships SET save_count = save_count + 1 WHERE id = NEW.scholarship_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scholarships SET save_count = greatest(save_count - 1, 0) WHERE id = OLD.scholarship_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_counter_favs() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scholarships SET favorite_count = favorite_count + 1 WHERE id = NEW.scholarship_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scholarships SET favorite_count = greatest(favorite_count - 1, 0) WHERE id = OLD.scholarship_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_counter_apps() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scholarships SET application_count = application_count + 1 WHERE id = NEW.scholarship_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scholarships SET application_count = greatest(application_count - 1, 0) WHERE id = OLD.scholarship_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_counter_reviews() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scholarships SET review_count = review_count + 1 WHERE id = NEW.scholarship_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scholarships SET review_count = greatest(review_count - 1, 0) WHERE id = OLD.scholarship_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_scholarship_view() RETURNS trigger AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NEW.event_name = 'scholarship_view' AND NEW.event_data ? 'scholarship_id' THEN
    BEGIN
      v_id := (NEW.event_data ->> 'scholarship_id')::uuid;
      UPDATE scholarships SET view_count = view_count + 1 WHERE id = v_id;
    EXCEPTION WHEN invalid_text_representation THEN
      NULL; -- ignore malformed payloads
    END;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_event_attendee_count() RETURNS trigger AS $$
DECLARE
  v_event uuid;
BEGIN
  v_event := CASE WHEN TG_OP = 'DELETE' THEN OLD.event_id ELSE NEW.event_id END;
  UPDATE events SET attendee_count = (
    SELECT count(*) FROM event_attendees WHERE event_id = v_event
  ) WHERE id = v_event;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_application_progress() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_application_progress(OLD.application_id);
  ELSE
    PERFORM update_application_progress(NEW.application_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_application_submitted() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'SUBMITTED' AND OLD.status IS DISTINCT FROM 'SUBMITTED' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_scholarship_version() RETURNS trigger AS $$
BEGIN
  IF (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.title_ar IS DISTINCT FROM NEW.title_ar OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.description_ar IS DISTINCT FROM NEW.description_ar OR
    OLD.provider_id IS DISTINCT FROM NEW.provider_id OR
    OLD.country_id IS DISTINCT FROM NEW.country_id OR
    OLD.university_id IS DISTINCT FROM NEW.university_id OR
    OLD.funding_type IS DISTINCT FROM NEW.funding_type OR
    OLD.opening_date IS DISTINCT FROM NEW.opening_date OR
    OLD.closing_date IS DISTINCT FROM NEW.closing_date OR
    OLD.verification_status IS DISTINCT FROM NEW.verification_status OR
    OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    PERFORM create_scholarship_version(NEW.id, 'UPDATE', current_user_id());

    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'title', to_jsonb(OLD.title), to_jsonb(NEW.title), current_user_id());
    END IF;
    IF OLD.title_ar IS DISTINCT FROM NEW.title_ar THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'title_ar', to_jsonb(OLD.title_ar), to_jsonb(NEW.title_ar), current_user_id());
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'description', to_jsonb(OLD.description), to_jsonb(NEW.description), current_user_id());
    END IF;
    IF OLD.description_ar IS DISTINCT FROM NEW.description_ar THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'description_ar', to_jsonb(OLD.description_ar), to_jsonb(NEW.description_ar), current_user_id());
    END IF;
    IF OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'provider_id', to_jsonb(OLD.provider_id), to_jsonb(NEW.provider_id), current_user_id());
    END IF;
    IF OLD.country_id IS DISTINCT FROM NEW.country_id THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'country_id', to_jsonb(OLD.country_id), to_jsonb(NEW.country_id), current_user_id());
    END IF;
    IF OLD.university_id IS DISTINCT FROM NEW.university_id THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'university_id', to_jsonb(OLD.university_id), to_jsonb(NEW.university_id), current_user_id());
    END IF;
    IF OLD.funding_type IS DISTINCT FROM NEW.funding_type THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'funding_type', to_jsonb(OLD.funding_type), to_jsonb(NEW.funding_type), current_user_id());
    END IF;
    IF OLD.opening_date IS DISTINCT FROM NEW.opening_date THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'opening_date', to_jsonb(OLD.opening_date), to_jsonb(NEW.opening_date), current_user_id());
    END IF;
    IF OLD.closing_date IS DISTINCT FROM NEW.closing_date THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'closing_date', to_jsonb(OLD.closing_date), to_jsonb(NEW.closing_date), current_user_id());
    END IF;
    IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'verification_status', to_jsonb(OLD.verification_status), to_jsonb(NEW.verification_status), current_user_id());
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO scholarship_change_logs (scholarship_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status', to_jsonb(OLD.status), to_jsonb(NEW.status), current_user_id());
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_verification_enqueue() RETURNS trigger AS $$
BEGIN
  IF NEW.verification_status = 'UNVERIFIED' THEN
    INSERT INTO verification_queue (scholarship_id)
    VALUES (NEW.id)
    ON CONFLICT (scholarship_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_verification_resolve() RETURNS trigger AS $$
BEGIN
  IF NEW.verification_status IN ('VERIFIED', 'REJECTED') THEN
    UPDATE verification_queue SET
      status = CASE WHEN NEW.verification_status = 'VERIFIED' THEN 'VERIFIED' ELSE 'REJECTED' END,
      reviewer_id = COALESCE(NEW.verified_by, current_user_id()),
      reviewed_at = COALESCE(NEW.verified_at, now())
    WHERE scholarship_id = NEW.id AND status IN ('UNVERIFIED', 'PENDING', 'NEEDS_REVIEW');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tg_audit() RETURNS trigger AS $$
DECLARE
  v_entity text;
BEGIN
  v_entity := TG_TABLE_NAME;
  IF TG_OP = 'UPDATE' AND to_jsonb(NEW) = to_jsonb(OLD) THEN
    RETURN NEW;
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    current_user_id(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
      ELSE 'UPDATE'
    END,
    v_entity,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

