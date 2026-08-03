-- =============================================================================
-- 016_permissions.sql — GRANT/REVOKE for SmartScholar
-- Generated from docs/DATABASE.md §16. Run after 001–015.
-- RLS (009) is the row filter; this file is the column/table gate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Revoke everything from public and default roles
-- -----------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM service_role;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

-- -----------------------------------------------------------------------------
-- anon — public content read + search/embedding function execution
-- -----------------------------------------------------------------------------

GRANT SELECT ON
  continents, currencies, languages, countries, cities,
  degree_levels, study_fields,
  universities, campuses, providers, departments, sources,
  scholarships, scholarship_cycles, scholarship_benefits, scholarship_requirements,
  scholarship_test_requirements, scholarship_documents, scholarship_degrees,
  scholarship_fields, scholarship_eligible_countries, scholarship_languages,
  scholarship_similarities, scholarship_reviews, scholarship_faqs,
  scholarship_gallery, scholarship_news,
  events
TO anon;

GRANT SELECT ON
  v_countries, v_cities, v_universities, v_providers,
  v_scholarships, v_scholarship_search, v_scholarships_open,
  v_scholarships_featured, v_scholarships_fully_funded, v_scholarships_no_ielts
TO anon;

GRANT SELECT ON blogs TO anon;

GRANT EXECUTE ON FUNCTION search_scholarships(varchar, int, int) TO anon;
GRANT EXECUTE ON FUNCTION search_suggestions(varchar, int) TO anon;
GRANT EXECUTE ON FUNCTION similar_scholarships(uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION vector_search_scholarships(vector, int) TO anon;
GRANT EXECUTE ON FUNCTION slugify(text) TO anon;
GRANT EXECUTE ON FUNCTION unique_slug(text, text) TO anon;

-- -----------------------------------------------------------------------------
-- authenticated — anon grants + own-row CRUD + helper execution
-- -----------------------------------------------------------------------------

GRANT SELECT ON
  continents, currencies, languages, countries, cities,
  degree_levels, study_fields,
  universities, campuses, providers, departments, sources,
  scholarships, scholarship_cycles, scholarship_benefits, scholarship_requirements,
  scholarship_test_requirements, scholarship_documents, scholarship_degrees,
  scholarship_fields, scholarship_eligible_countries, scholarship_languages,
  scholarship_similarities, scholarship_reviews, scholarship_faqs,
  scholarship_gallery, scholarship_news,
  events, event_attendees
TO authenticated;

GRANT SELECT ON
  v_countries, v_cities, v_universities, v_providers,
  v_scholarships, v_scholarship_search, v_scholarships_open,
  v_scholarships_featured, v_scholarships_fully_funded, v_scholarships_no_ielts,
  v_user_profiles, v_applications, v_upcoming_deadlines
TO authenticated;

-- User-owned tables: RLS gates rows; grant base DML here.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  user_profiles, user_education, user_achievements, user_work_experience,
  user_volunteer_experience, user_research_experience, user_languages,
  user_test_scores, user_finance, user_preferences, user_settings,
  user_documents, user_recommendation_letters, user_essays,
  saved_scholarships, favorites,
  applications, application_stages, application_tasks, application_documents,
  ai_chats, ai_chat_messages, ai_reviews, ai_reports,
  acceptance_predictions, ai_matching_jobs, search_history
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analytics_events TO authenticated;
GRANT SELECT ON emails, payments TO authenticated;

GRANT EXECUTE ON FUNCTION
  current_user_id(), is_admin(), is_moderator(), current_user_role(), user_owns(uuid),
  search_scholarships(varchar, int, int), search_suggestions(varchar, int),
  similar_scholarships(uuid, int), vector_search_scholarships(vector, int),
  slugify(text), unique_slug(text, text)
TO authenticated;

-- -----------------------------------------------------------------------------
-- service_role — full access (bypasses RLS for server workflows)
-- -----------------------------------------------------------------------------

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- -----------------------------------------------------------------------------
-- Sequences (Supabase public schema uses uuid defaults; nothing to grant,
-- but keep this idempotent for future serial columns)
-- -----------------------------------------------------------------------------

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- -----------------------------------------------------------------------------
-- Postgres owner keeps everything (implicit). Done.
-- -----------------------------------------------------------------------------
