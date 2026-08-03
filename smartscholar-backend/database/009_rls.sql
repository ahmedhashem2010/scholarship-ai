-- =============================================================================
-- 009_rls.sql — Row Level Security policies for SmartScholar
-- Generated from docs/DATABASE.md §10. Run after 001–008.
--
-- Matrix (write = INSERT/UPDATE/DELETE):
--   dimension/content tables : SELECT anon+authenticated, write admin
--   blogs                    : SELECT anon(published)/auth(all), write admin
--   reviews                  : SELECT all, INSERT/UPDATE/DELETE owner (or admin)
--   user tables              : owner or admin
--   apps                     : owner or admin (counselor SELECT)
--   AI/user activity         : owner or admin
--   notifications            : owner SELECT/UPDATE(read), server insert
--   emails/payments          : owner SELECT or admin; write server/admin
--   ops/audit/analytics      : admin
--
-- service_role bypasses RLS (server workflows). Helpers in 006_functions.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS on every table
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'continents', 'currencies', 'languages', 'countries', 'cities',
    'degree_levels', 'study_fields', 'users', 'universities', 'campuses',
    'providers', 'departments', 'sources', 'scholarships', 'scholarship_cycles',
    'scholarship_benefits', 'scholarship_requirements', 'scholarship_test_requirements',
    'scholarship_documents', 'scholarship_degrees', 'scholarship_fields',
    'scholarship_eligible_countries', 'scholarship_languages', 'scholarship_similarities',
    'scholarship_reviews', 'scholarship_faqs', 'scholarship_gallery', 'scholarship_news',
    'blogs', 'events', 'event_attendees',
    'user_profiles', 'user_education', 'user_achievements', 'user_work_experience',
    'user_volunteer_experience', 'user_research_experience', 'user_languages',
    'user_test_scores', 'user_finance', 'user_preferences', 'user_settings',
    'user_documents', 'user_recommendation_letters', 'user_essays',
    'applications', 'application_stages', 'application_tasks', 'application_documents',
    'saved_scholarships', 'favorites',
    'ai_chats', 'ai_chat_messages', 'ai_reviews', 'ai_reports',
    'acceptance_predictions', 'ai_embeddings', 'ai_matching_jobs', 'search_history',
    'notifications', 'emails', 'payments',
    'import_batches', 'import_queue_items', 'scholarship_versions',
    'scholarship_change_logs', 'duplicates', 'verification_queue',
    'audit_logs', 'activity_logs', 'analytics_events', 'daily_metrics',
    'cron_runs', 'app_settings'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Dimension / lookup tables — public SELECT, admin writes
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_anon_read ON continents;
CREATE POLICY p_anon_read ON continents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON continents;
CREATE POLICY p_admin_write ON continents FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON currencies;
CREATE POLICY p_anon_read ON currencies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON currencies;
CREATE POLICY p_admin_write ON currencies FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON languages;
CREATE POLICY p_anon_read ON languages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON languages;
CREATE POLICY p_admin_write ON languages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON countries;
CREATE POLICY p_anon_read ON countries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON countries;
CREATE POLICY p_admin_write ON countries FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON cities;
CREATE POLICY p_anon_read ON cities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON cities;
CREATE POLICY p_admin_write ON cities FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON degree_levels;
CREATE POLICY p_anon_read ON degree_levels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON degree_levels;
CREATE POLICY p_admin_write ON degree_levels FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON study_fields;
CREATE POLICY p_anon_read ON study_fields FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON study_fields;
CREATE POLICY p_admin_write ON study_fields FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- Content tables — public SELECT, admin writes
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_anon_read ON universities;
CREATE POLICY p_anon_read ON universities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON universities;
CREATE POLICY p_admin_write ON universities FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON campuses;
CREATE POLICY p_anon_read ON campuses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON campuses;
CREATE POLICY p_admin_write ON campuses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON providers;
CREATE POLICY p_anon_read ON providers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON providers;
CREATE POLICY p_admin_write ON providers FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON departments;
CREATE POLICY p_anon_read ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON departments;
CREATE POLICY p_admin_write ON departments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON sources;
CREATE POLICY p_anon_read ON sources FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON sources;
CREATE POLICY p_admin_write ON sources FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarships;
CREATE POLICY p_anon_read ON scholarships FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarships;
CREATE POLICY p_admin_write ON scholarships FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_cycles;
CREATE POLICY p_anon_read ON scholarship_cycles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_cycles;
CREATE POLICY p_admin_write ON scholarship_cycles FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_benefits;
CREATE POLICY p_anon_read ON scholarship_benefits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_benefits;
CREATE POLICY p_admin_write ON scholarship_benefits FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_requirements;
CREATE POLICY p_anon_read ON scholarship_requirements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_requirements;
CREATE POLICY p_admin_write ON scholarship_requirements FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_test_requirements;
CREATE POLICY p_anon_read ON scholarship_test_requirements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_test_requirements;
CREATE POLICY p_admin_write ON scholarship_test_requirements FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_documents;
CREATE POLICY p_anon_read ON scholarship_documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_documents;
CREATE POLICY p_admin_write ON scholarship_documents FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_degrees;
CREATE POLICY p_anon_read ON scholarship_degrees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_degrees;
CREATE POLICY p_admin_write ON scholarship_degrees FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_fields;
CREATE POLICY p_anon_read ON scholarship_fields FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_fields;
CREATE POLICY p_admin_write ON scholarship_fields FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_eligible_countries;
CREATE POLICY p_anon_read ON scholarship_eligible_countries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_eligible_countries;
CREATE POLICY p_admin_write ON scholarship_eligible_countries FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_languages;
CREATE POLICY p_anon_read ON scholarship_languages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_languages;
CREATE POLICY p_admin_write ON scholarship_languages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_similarities;
CREATE POLICY p_anon_read ON scholarship_similarities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_similarities;
CREATE POLICY p_admin_write ON scholarship_similarities FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_faqs;
CREATE POLICY p_anon_read ON scholarship_faqs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_faqs;
CREATE POLICY p_admin_write ON scholarship_faqs FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_gallery;
CREATE POLICY p_anon_read ON scholarship_gallery FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_gallery;
CREATE POLICY p_admin_write ON scholarship_gallery FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_anon_read ON scholarship_news;
CREATE POLICY p_anon_read ON scholarship_news FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON scholarship_news;
CREATE POLICY p_admin_write ON scholarship_news FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- Reviews — owner-writable
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_anon_read ON scholarship_reviews;
CREATE POLICY p_anon_read ON scholarship_reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_owner_insert ON scholarship_reviews;
CREATE POLICY p_owner_insert ON scholarship_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = current_user_id());
DROP POLICY IF EXISTS p_owner_update ON scholarship_reviews;
CREATE POLICY p_owner_update ON scholarship_reviews FOR UPDATE TO authenticated
  USING (user_owns(user_id)) WITH CHECK (user_owns(user_id));
DROP POLICY IF EXISTS p_owner_delete ON scholarship_reviews;
CREATE POLICY p_owner_delete ON scholarship_reviews FOR DELETE TO authenticated
  USING (user_owns(user_id));

-- -----------------------------------------------------------------------------
-- Blogs
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_anon_read_published ON blogs;
CREATE POLICY p_anon_read_published ON blogs FOR SELECT TO anon
  USING (status = 'PUBLISHED' AND deleted_at IS NULL);
DROP POLICY IF EXISTS p_auth_read ON blogs;
CREATE POLICY p_auth_read ON blogs FOR SELECT TO authenticated
  USING (status = 'PUBLISHED' OR is_admin());
DROP POLICY IF EXISTS p_admin_write_blogs ON blogs;
CREATE POLICY p_admin_write_blogs ON blogs FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_anon_read ON events;
CREATE POLICY p_anon_read ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_admin_write ON events;
CREATE POLICY p_admin_write ON events FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS p_owner_all ON event_attendees;
CREATE POLICY p_owner_all ON event_attendees FOR ALL TO authenticated
  USING (user_id = current_user_id() OR is_admin())
  WITH CHECK (user_id = current_user_id());

-- -----------------------------------------------------------------------------
-- users — self or admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_users_select ON users;
CREATE POLICY p_users_select ON users FOR SELECT TO authenticated
  USING (id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_users_insert ON users;
CREATE POLICY p_users_insert ON users FOR INSERT TO authenticated
  WITH CHECK (id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_users_update ON users;
CREATE POLICY p_users_update ON users FOR UPDATE TO authenticated
  USING (id = current_user_id() OR is_admin())
  WITH CHECK (id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_users_delete ON users;
CREATE POLICY p_users_delete ON users FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- User-owned tables — owner or admin
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_profiles', 'user_education', 'user_achievements', 'user_work_experience',
    'user_volunteer_experience', 'user_research_experience', 'user_languages',
    'user_test_scores', 'user_finance', 'user_preferences', 'user_settings',
    'user_documents', 'user_recommendation_letters', 'user_essays',
    'saved_scholarships', 'favorites',
    'applications', 'application_stages', 'application_tasks', 'application_documents',
    'ai_chats', 'ai_chat_messages', 'ai_reviews', 'ai_reports',
    'acceptance_predictions', 'ai_matching_jobs', 'search_history'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS p_owner_all ON %I', t);
    EXECUTE format(
      'CREATE POLICY p_owner_all ON %I FOR ALL TO authenticated USING (user_owns(user_id)) WITH CHECK (user_id = current_user_id())',
      t
    );
  END LOOP;
END $$;

-- Counselor read access on application pipeline
DROP POLICY IF EXISTS p_counselor_read ON applications;
CREATE POLICY p_counselor_read ON applications FOR SELECT TO authenticated
  USING (is_moderator());
DROP POLICY IF EXISTS p_counselor_read ON application_stages;
CREATE POLICY p_counselor_read ON application_stages FOR SELECT TO authenticated
  USING (is_moderator());
DROP POLICY IF EXISTS p_counselor_read ON application_tasks;
CREATE POLICY p_counselor_read ON application_tasks FOR SELECT TO authenticated
  USING (is_moderator());
DROP POLICY IF EXISTS p_counselor_read ON application_documents;
CREATE POLICY p_counselor_read ON application_documents FOR SELECT TO authenticated
  USING (is_moderator());

-- -----------------------------------------------------------------------------
-- Notifications — owner read/update, server insert, admin all
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_notif_select ON notifications;
CREATE POLICY p_notif_select ON notifications FOR SELECT TO authenticated
  USING (user_id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_notif_update ON notifications;
CREATE POLICY p_notif_update ON notifications FOR UPDATE TO authenticated
  USING (user_id = current_user_id()) WITH CHECK (user_id = current_user_id() AND read_at IS NOT NULL);
DROP POLICY IF EXISTS p_notif_delete ON notifications;
CREATE POLICY p_notif_delete ON notifications FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- Emails
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_emails_select ON emails;
CREATE POLICY p_emails_select ON emails FOR SELECT TO authenticated
  USING (user_id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_emails_write ON emails;
CREATE POLICY p_emails_write ON emails FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS p_payments_select ON payments;
CREATE POLICY p_payments_select ON payments FOR SELECT TO authenticated
  USING (user_id = current_user_id() OR is_admin());
DROP POLICY IF EXISTS p_payments_write ON payments;
CREATE POLICY p_payments_write ON payments FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- Ops / audit / analytics / settings — admin only
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'import_batches', 'import_queue_items', 'scholarship_versions',
    'scholarship_change_logs', 'duplicates', 'verification_queue',
    'audit_logs', 'activity_logs', 'analytics_events', 'daily_metrics',
    'cron_runs', 'app_settings', 'ai_embeddings'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS p_admin_all ON %I', t);
    EXECUTE format(
      'CREATE POLICY p_admin_all ON %I FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())',
      t
    );
  END LOOP;
END $$;

-- Analytics events: authenticated may insert their own events
DROP POLICY IF EXISTS p_analytics_insert ON analytics_events;
CREATE POLICY p_analytics_insert ON analytics_events FOR INSERT TO authenticated
  WITH CHECK (user_id = current_user_id() OR user_id IS NULL);
