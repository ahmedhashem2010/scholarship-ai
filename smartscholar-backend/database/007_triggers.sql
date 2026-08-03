-- =============================================================================
-- 007_triggers.sql — Triggers for SmartScholar
-- Generated from docs/DATABASE.md §8. Run after 001–006.
-- Pure trigger DDL — every referenced function is defined in 006_functions.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- trg_set_updated_at — every table that has updated_at
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_set_updated_at ON continents;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON continents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON currencies;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON languages;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON countries;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON cities;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON degree_levels;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON degree_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON study_fields;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON study_fields FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON users;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON universities;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON campuses;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON campuses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON providers;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON departments;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON sources;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarships;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_cycles;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_cycles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_benefits;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_benefits FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_requirements;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_requirements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_test_requirements;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_test_requirements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_documents;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_reviews;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_faqs;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON scholarship_news;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON scholarship_news FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON blogs;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON events;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_profiles;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_education;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_education FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_achievements;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_achievements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_work_experience;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_work_experience FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_volunteer_experience;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_volunteer_experience FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_research_experience;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_research_experience FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_test_scores;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_test_scores FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_finance;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_finance FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_preferences;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_settings;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_documents;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_recommendation_letters;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_recommendation_letters FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON user_essays;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON user_essays FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON applications;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON application_stages;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON application_stages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON application_tasks;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON application_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON application_documents;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON application_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON ai_chats;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON ai_chats FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON ai_reviews;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON ai_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON ai_reports;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON ai_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON ai_embeddings;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON ai_embeddings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON ai_matching_jobs;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON ai_matching_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON emails;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON payments;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON import_batches;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON import_batches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON import_queue_items;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON import_queue_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON duplicates;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON duplicates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON verification_queue;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON verification_queue FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON daily_metrics;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON daily_metrics FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON app_settings;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Slug triggers (BEFORE INSERT, when slug is empty)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_slug_universities ON universities;
CREATE TRIGGER trg_slug_universities BEFORE INSERT ON universities FOR EACH ROW EXECUTE FUNCTION tg_universities_slug();

DROP TRIGGER IF EXISTS trg_slug_providers ON providers;
CREATE TRIGGER trg_slug_providers BEFORE INSERT ON providers FOR EACH ROW EXECUTE FUNCTION tg_providers_slug();

DROP TRIGGER IF EXISTS trg_slug_countries ON countries;
CREATE TRIGGER trg_slug_countries BEFORE INSERT ON countries FOR EACH ROW EXECUTE FUNCTION tg_countries_slug();

DROP TRIGGER IF EXISTS trg_slug_cities ON cities;
CREATE TRIGGER trg_slug_cities BEFORE INSERT ON cities FOR EACH ROW EXECUTE FUNCTION tg_cities_slug();

DROP TRIGGER IF EXISTS trg_slug_blogs ON blogs;
CREATE TRIGGER trg_slug_blogs BEFORE INSERT ON blogs FOR EACH ROW EXECUTE FUNCTION tg_blogs_slug();

DROP TRIGGER IF EXISTS trg_slug_events ON events;
CREATE TRIGGER trg_slug_events BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION tg_events_slug();

DROP TRIGGER IF EXISTS trg_slug_scholarships ON scholarships;
CREATE TRIGGER trg_slug_scholarships BEFORE INSERT ON scholarships FOR EACH ROW EXECUTE FUNCTION tg_scholarships_slug();

-- -----------------------------------------------------------------------------
-- trg_users_defaults — create settings/preferences/finance rows on signup
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_users_defaults ON users;
CREATE TRIGGER trg_users_defaults AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION tg_users_defaults();

-- -----------------------------------------------------------------------------
-- Scholarship cycles
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_cycle_single_current ON scholarship_cycles;
CREATE TRIGGER trg_cycle_single_current
BEFORE INSERT OR UPDATE OF is_current ON scholarship_cycles
FOR EACH ROW EXECUTE FUNCTION tg_cycle_single_current();

DROP TRIGGER IF EXISTS trg_cycle_sync_dates ON scholarship_cycles;
CREATE TRIGGER trg_cycle_sync_dates
AFTER INSERT OR UPDATE OR DELETE ON scholarship_cycles
FOR EACH ROW EXECUTE FUNCTION tg_cycle_sync_dates();

-- -----------------------------------------------------------------------------
-- Denormalized counters on scholarships
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_scholarship_counter_saves ON saved_scholarships;
CREATE TRIGGER trg_scholarship_counter_saves
AFTER INSERT OR DELETE ON saved_scholarships
FOR EACH ROW EXECUTE FUNCTION tg_counter_saves();

DROP TRIGGER IF EXISTS trg_scholarship_counter_favs ON favorites;
CREATE TRIGGER trg_scholarship_counter_favs
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW EXECUTE FUNCTION tg_counter_favs();

DROP TRIGGER IF EXISTS trg_scholarship_counter_apps ON applications;
CREATE TRIGGER trg_scholarship_counter_apps
AFTER INSERT OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION tg_counter_apps();

DROP TRIGGER IF EXISTS trg_scholarship_counter_reviews ON scholarship_reviews;
CREATE TRIGGER trg_scholarship_counter_reviews
AFTER INSERT OR DELETE ON scholarship_reviews
FOR EACH ROW EXECUTE FUNCTION tg_counter_reviews();

-- -----------------------------------------------------------------------------
-- Analytics-driven counter (scholarship views)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_scholarship_view ON analytics_events;
CREATE TRIGGER trg_scholarship_view
AFTER INSERT ON analytics_events
FOR EACH ROW EXECUTE FUNCTION tg_scholarship_view();

-- -----------------------------------------------------------------------------
-- Event attendee count
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_event_attendee_count ON event_attendees;
CREATE TRIGGER trg_event_attendee_count
AFTER INSERT OR DELETE ON event_attendees
FOR EACH ROW EXECUTE FUNCTION tg_event_attendee_count();

-- -----------------------------------------------------------------------------
-- Application progress
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_application_progress ON application_stages;
CREATE TRIGGER trg_application_progress
AFTER INSERT OR UPDATE OR DELETE ON application_stages
FOR EACH ROW EXECUTE FUNCTION tg_application_progress();

DROP TRIGGER IF EXISTS trg_application_submitted ON applications;
CREATE TRIGGER trg_application_submitted
BEFORE UPDATE OF status ON applications
FOR EACH ROW EXECUTE FUNCTION tg_application_submitted();

-- -----------------------------------------------------------------------------
-- Scholarship versioning + field change log
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_scholarship_version ON scholarships;
CREATE TRIGGER trg_scholarship_version
AFTER UPDATE ON scholarships
FOR EACH ROW EXECUTE FUNCTION tg_scholarship_version();

-- -----------------------------------------------------------------------------
-- Verification queue
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_verification_enqueue ON scholarships;
CREATE TRIGGER trg_verification_enqueue
AFTER INSERT ON scholarships
FOR EACH ROW EXECUTE FUNCTION tg_verification_enqueue();

DROP TRIGGER IF EXISTS trg_verification_resolve ON scholarships;
CREATE TRIGGER trg_verification_resolve
AFTER UPDATE OF verification_status ON scholarships
FOR EACH ROW EXECUTE FUNCTION tg_verification_resolve();

-- -----------------------------------------------------------------------------
-- Audit trail
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION tg_audit();

DROP TRIGGER IF EXISTS trg_audit_universities ON universities;
CREATE TRIGGER trg_audit_universities
AFTER INSERT OR UPDATE OR DELETE ON universities
FOR EACH ROW EXECUTE FUNCTION tg_audit();

DROP TRIGGER IF EXISTS trg_audit_providers ON providers;
CREATE TRIGGER trg_audit_providers
AFTER INSERT OR UPDATE OR DELETE ON providers
FOR EACH ROW EXECUTE FUNCTION tg_audit();

DROP TRIGGER IF EXISTS trg_audit_applications ON applications;
CREATE TRIGGER trg_audit_applications
AFTER INSERT OR UPDATE OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION tg_audit();
