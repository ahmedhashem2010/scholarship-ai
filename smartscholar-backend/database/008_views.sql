-- =============================================================================
-- 008_views.sql — Read-model views for SmartScholar
-- Generated from docs/DATABASE.md §9. Run after 001–007.
-- All views filter deleted_at IS NULL on soft-deleted tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Geography lookups
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_countries AS
SELECT
  c.id, c.code, c.code3, c.name, c.name_ar, c.slug, c.phone_code, c.is_active, c.flag_url,
  c.continent_id, cn.name AS continent_name, cn.name_ar AS continent_name_ar,
  c.currency_id, cu.code AS currency_code, cu.name AS currency_name
FROM countries c
JOIN continents cn ON cn.id = c.continent_id
LEFT JOIN currencies cu ON cu.id = c.currency_id
WHERE c.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_cities AS
SELECT
  c.id, c.name, c.name_ar, c.slug, c.is_capital, c.latitude, c.longitude,
  c.country_id, co.name AS country_name, co.name_ar AS country_name_ar, co.code AS country_code
FROM cities c
JOIN countries co ON co.id = c.country_id
WHERE c.deleted_at IS NULL AND co.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Institution lookups
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_universities AS
SELECT
  u.id, u.name, u.name_ar, u.slug, u.website, u.description, u.description_ar,
  u.logo_url, u.cover_url, u.established_year, u.ranking_national, u.ranking_world,
  u.is_public, u.is_featured, u.status, u.verification_status, u.verified_at,
  u.country_id, c.name AS country_name, c.code AS country_code,
  u.city_id, ci.name AS city_name,
  (SELECT count(*) FROM campuses cp WHERE cp.university_id = u.id AND cp.deleted_at IS NULL) AS campus_count
FROM universities u
JOIN countries c ON c.id = u.country_id
LEFT JOIN cities ci ON ci.id = u.city_id
WHERE u.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_providers AS
SELECT
  p.id, p.name, p.name_ar, p.slug, p.provider_type, p.website, p.logo_url,
  p.description, p.contact_email, p.contact_phone, p.is_verified, p.verification_status, p.status,
  p.country_id, c.name AS country_name
FROM providers p
LEFT JOIN countries c ON c.id = p.country_id
WHERE p.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Scholarships — full read model
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_scholarships AS
SELECT
  s.id, s.slug, s.title, s.title_ar, s.description, s.description_ar, s.seo_description,
  s.provider_id, p.name AS provider_name, p.name_ar AS provider_name_ar, p.slug AS provider_slug,
  s.country_id, c.name AS country_name, c.name_ar AS country_name_ar, c.code AS country_code,
  s.university_id, u.name AS university_name, u.slug AS university_slug,
  s.campus_id, cp.name AS campus_name,
  s.degree_level_id, dl.name AS degree_name, dl.slug AS degree_slug,
  s.study_field_id, sf.name AS field_name, sf.slug AS field_slug,
  s.duration_months, s.duration_text, s.funding_type, s.application_fee,
  s.application_fee_currency_id, cu.code AS application_fee_currency_code,
  s.application_url, s.official_website, s.official_pdf_url,
  s.opening_date, s.closing_date, s.interview_date, s.results_date, s.enrollment_date,
  s.next_deadline, s.minimum_age, s.maximum_age, s.minimum_gpa, s.gpa_scale,
  s.minimum_percentage, s.maximum_gap_years, s.is_fully_funded, s.is_featured,
  s.is_active, s.status, s.verification_status, s.verified_at,
  s.difficulty_score, s.competition_level, s.acceptance_rate,
  s.ai_summary, s.ai_tips, s.application_process, s.selection_process,
  s.view_count, s.save_count, s.favorite_count, s.application_count, s.review_count,
  s.published_at, s.source_url,
  COALESCE(sd.degree_names, '{}') AS degree_names,
  COALESCE(sf2.field_names, '{}') AS field_names,
  COALESCE(sec.eligible_countries, '{}') AS eligible_countries,
  COALESCE(sl.language_codes, '{}') AS language_codes,
  COALESCE(sb.benefits, '[]') AS benefits,
  COALESCE(sb.has_housing, false) AS has_housing,
  COALESCE(sb.has_insurance, false) AS has_insurance,
  COALESCE(sb.has_flights, false) AS has_flights,
  COALESCE(sb.has_stipend, false) AS has_stipend,
  COALESCE(sb.has_tuition, false) AS has_tuition,
  COALESCE(st.tests, '[]') AS test_requirements,
  COALESCE(sd2.required_documents, '[]') AS required_documents
FROM scholarships s
LEFT JOIN providers p ON p.id = s.provider_id
LEFT JOIN countries c ON c.id = s.country_id
LEFT JOIN universities u ON u.id = s.university_id
LEFT JOIN campuses cp ON cp.id = s.campus_id
LEFT JOIN degree_levels dl ON dl.id = s.degree_level_id
LEFT JOIN study_fields sf ON sf.id = s.study_field_id
LEFT JOIN currencies cu ON cu.id = s.application_fee_currency_id
LEFT JOIN (
  SELECT scholarship_id, array_agg(degree_levels.name ORDER BY degree_levels.name) AS degree_names
  FROM scholarship_degrees
  JOIN degree_levels ON degree_levels.id = scholarship_degrees.degree_level_id
  GROUP BY scholarship_id
) sd ON sd.scholarship_id = s.id
LEFT JOIN (
  SELECT scholarship_id, array_agg(study_fields.name ORDER BY study_fields.name) AS field_names
  FROM scholarship_fields
  JOIN study_fields ON study_fields.id = scholarship_fields.study_field_id
  GROUP BY scholarship_id
) sf2 ON sf2.scholarship_id = s.id
LEFT JOIN (
  SELECT scholarship_id, array_agg(countries.code ORDER BY countries.code) AS eligible_countries
  FROM scholarship_eligible_countries
  JOIN countries ON countries.id = scholarship_eligible_countries.country_id
  GROUP BY scholarship_id
) sec ON sec.scholarship_id = s.id
LEFT JOIN (
  SELECT scholarship_id, array_agg(languages.code ORDER BY languages.code) AS language_codes
  FROM scholarship_languages
  JOIN languages ON languages.id = scholarship_languages.language_id
  GROUP BY scholarship_id
) sl ON sl.scholarship_id = s.id
LEFT JOIN (
  SELECT
    scholarship_id,
    jsonb_agg(jsonb_build_object(
      'benefit_type', benefit_type,
      'amount', amount,
      'currency_code', cu2.code,
      'description', description
    ) ORDER BY sort_order, created_at) AS benefits,
    bool_or(benefit_type = 'HOUSING') AS has_housing,
    bool_or(benefit_type = 'INSURANCE') AS has_insurance,
    bool_or(benefit_type IN ('FLIGHT', 'TRAVEL_GRANT')) AS has_flights,
    bool_or(benefit_type IN ('MONTHLY_STIPEND', 'YEARLY_STIPEND', 'ONE_TIME_GRANT', 'SETTLEMENT_ALLOWANCE')) AS has_stipend,
    bool_or(benefit_type IN ('TUITION', 'TUITION_DISCOUNT', 'FULLY_FUNDED')) AS has_tuition
  FROM scholarship_benefits
  LEFT JOIN currencies cu2 ON cu2.id = scholarship_benefits.currency_id
  GROUP BY scholarship_id
) sb ON sb.scholarship_id = s.id
LEFT JOIN (
  SELECT
    scholarship_id,
    jsonb_agg(jsonb_build_object(
      'test_type', test_type,
      'minimum_score', minimum_score,
      'minimum_band', minimum_band,
      'is_mandatory', is_mandatory
    ) ORDER BY test_type) AS tests
  FROM scholarship_test_requirements
  GROUP BY scholarship_id
) st ON st.scholarship_id = s.id
LEFT JOIN (
  SELECT
    scholarship_id,
    jsonb_agg(jsonb_build_object(
      'document_type', document_type,
      'name', name,
      'name_ar', name_ar,
      'is_required', is_required
    ) ORDER BY sort_order, created_at) AS required_documents
  FROM scholarship_documents
  WHERE is_required
  GROUP BY scholarship_id
) sd2 ON sd2.scholarship_id = s.id
WHERE s.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Scholarship search view (flattened for filters)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_scholarship_search AS
SELECT
  s.id, s.slug, s.title, s.title_ar,
  p.name AS provider_name, u.name AS university_name,
  c.name AS country_name, c.code AS country_code,
  dl.name AS degree,
  COALESCE(sf2.field_names, '{}') AS fields,
  COALESCE(sec.eligible_countries, '{}') AS eligible_countries,
  s.funding_type, s.is_fully_funded,
  s.opening_date, s.closing_date, s.next_deadline,
  s.minimum_gpa, s.minimum_age, s.maximum_age, s.maximum_gap_years,
  s.difficulty_score, s.competition_level, s.acceptance_rate,
  COALESCE(st.tests, '[]') AS test_requirements,
  s.status, s.verification_status, s.is_active, s.is_featured
FROM scholarships s
LEFT JOIN providers p ON p.id = s.provider_id
LEFT JOIN universities u ON u.id = s.university_id
LEFT JOIN countries c ON c.id = s.country_id
LEFT JOIN degree_levels dl ON dl.id = s.degree_level_id
LEFT JOIN (
  SELECT scholarship_id, array_agg(study_fields.name ORDER BY study_fields.name) AS field_names
  FROM scholarship_fields
  JOIN study_fields ON study_fields.id = scholarship_fields.study_field_id
  GROUP BY scholarship_id
) sf2 ON sf2.scholarship_id = s.id
LEFT JOIN (
  SELECT scholarship_id, array_agg(countries.code ORDER BY countries.code) AS eligible_countries
  FROM scholarship_eligible_countries
  JOIN countries ON countries.id = scholarship_eligible_countries.country_id
  GROUP BY scholarship_id
) sec ON sec.scholarship_id = s.id
LEFT JOIN (
  SELECT scholarship_id, array_agg(test_type ORDER BY test_type) AS tests
  FROM scholarship_test_requirements
  GROUP BY scholarship_id
) st ON st.scholarship_id = s.id
WHERE s.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Filter-flag views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_scholarships_open AS
SELECT v.* FROM v_scholarships v
WHERE v.status = 'ACTIVE'
  AND (v.closing_date >= CURRENT_DATE OR v.next_deadline IS NOT NULL);

CREATE OR REPLACE VIEW v_scholarships_featured AS
SELECT v.* FROM v_scholarships v
WHERE v.is_featured AND v.is_active AND v.verification_status = 'VERIFIED';

CREATE OR REPLACE VIEW v_scholarships_fully_funded AS
SELECT v.* FROM v_scholarships v
WHERE v.is_fully_funded;

CREATE OR REPLACE VIEW v_scholarships_no_ielts AS
SELECT v.* FROM v_scholarships v
WHERE NOT EXISTS (
  SELECT 1 FROM scholarship_test_requirements tr
  WHERE tr.scholarship_id = v.id
    AND tr.test_type = 'IELTS'
    AND tr.is_mandatory
);

-- -----------------------------------------------------------------------------
-- User profile aggregation
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_user_profiles AS
SELECT
  up.user_id,
  up.bio, up.gender, up.date_of_birth,
  up.nationality_country_id, nc.name AS nationality, nc.code AS nationality_code,
  up.residence_country_id, rc.name AS residence_country, rc.code AS residence_code,
  up.education_level, up.current_degree_id, cd.name AS current_degree,
  up.major_field_id, mf.name AS major_field,
  up.university_id, uv.name AS university,
  up.gpa, up.gpa_scale, up.grade_type, up.english_level,
  up.target_degree_id, td.name AS target_degree,
  up.target_country_id, tc.name AS target_country,
  up.preferred_majors, up.annual_budget, up.budget_currency_id, bcu.code AS budget_currency,
  up.is_actively_searching, up.is_public, up.about,
  COALESCE(ed.education, '[]') AS education,
  COALESCE(ul.languages, '[]') AS languages,
  COALESCE(ts.test_scores, '[]') AS test_scores,
  COALESCE(fi.finance, '{}') AS finance,
  u.display_name, u.email, u.role, u.avatar_url, u.country_id, u.city_id, u.timezone, u.locale
FROM user_profiles up
JOIN users u ON u.id = up.user_id
LEFT JOIN countries nc ON nc.id = up.nationality_country_id
LEFT JOIN countries rc ON rc.id = up.residence_country_id
LEFT JOIN degree_levels cd ON cd.id = up.current_degree_id
LEFT JOIN study_fields mf ON mf.id = up.major_field_id
LEFT JOIN universities uv ON uv.id = up.university_id
LEFT JOIN degree_levels td ON td.id = up.target_degree_id
LEFT JOIN countries tc ON tc.id = up.target_country_id
LEFT JOIN currencies bcu ON bcu.id = up.budget_currency_id
LEFT JOIN (
  SELECT user_id, jsonb_agg(jsonb_build_object(
    'institution', institution, 'degree_type', degree_type, 'degree_level_id', degree_level_id,
    'field_id', field_id, 'grade_type', grade_type, 'gpa', gpa, 'percentage', percentage,
    'start_date', start_date, 'end_date', end_date, 'is_current', is_current, 'is_verified', is_verified
  ) ORDER BY start_date DESC NULLS LAST) AS education
  FROM user_education GROUP BY user_id
) ed ON ed.user_id = up.user_id
LEFT JOIN (
  SELECT user_id, jsonb_agg(jsonb_build_object(
    'language_id', language_id, 'proficiency_level', proficiency_level, 'cefr_level', cefr_level
  ) ORDER BY created_at) AS languages
  FROM user_languages GROUP BY user_id
) ul ON ul.user_id = up.user_id
LEFT JOIN (
  SELECT user_id, jsonb_agg(jsonb_build_object(
    'test_type', test_type, 'score', score, 'band', band, 'test_date', test_date, 'is_verified', is_verified
  ) ORDER BY test_date DESC NULLS LAST) AS test_scores
  FROM user_test_scores GROUP BY user_id
) ts ON ts.user_id = up.user_id
LEFT JOIN (
  SELECT user_id, jsonb_build_object(
    'annual_income', annual_income, 'currency_id', currency_id, 'savings', savings,
    'monthly_budget', monthly_budget, 'dependents', dependents, 'needs_full_funding', needs_full_funding,
    'willing_to_consider_loans', willing_to_consider_loans, 'has_sponsor', has_sponsor
  ) AS finance
  FROM user_finance
) fi ON fi.user_id = up.user_id;

-- -----------------------------------------------------------------------------
-- Applications
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_applications AS
SELECT
  a.id, a.user_id, a.status, a.progress, a.application_url, a.submitted_at, a.withdrawn_at, a.notes,
  a.scholarship_id, s.title AS scholarship_title, s.slug AS scholarship_slug, s.title_ar AS scholarship_title_ar,
  a.cycle_id, sc.cycle_label, sc.status AS cycle_status,
  COALESCE(stg.stage_count, 0) AS stage_count,
  COALESCE(stg.completed_stages, 0) AS completed_stages,
  COALESCE(tsk.task_count, 0) AS task_count,
  COALESCE(tsk.open_tasks, 0) AS open_tasks,
  COALESCE(tsk.next_due_date, stg.next_stage_due_date) AS next_due_date
FROM applications a
JOIN scholarships s ON s.id = a.scholarship_id
LEFT JOIN scholarship_cycles sc ON sc.id = a.cycle_id
LEFT JOIN (
  SELECT application_id,
         count(*) AS stage_count,
         count(*) FILTER (WHERE status = 'COMPLETED') AS completed_stages,
         min(due_date) FILTER (WHERE due_date IS NOT NULL AND status NOT IN ('COMPLETED', 'SKIPPED')) AS next_stage_due_date
  FROM application_stages
  GROUP BY application_id
) stg ON stg.application_id = a.id
LEFT JOIN (
  SELECT application_id,
         count(*) AS task_count,
         count(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS')) AS open_tasks,
         min(due_date) FILTER (WHERE due_date IS NOT NULL AND status IN ('PENDING', 'IN_PROGRESS')) AS next_due_date
  FROM application_tasks
  GROUP BY application_id
) tsk ON tsk.application_id = a.id
WHERE a.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Upcoming deadlines (for reminder cron)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_upcoming_deadlines AS
SELECT
  u.id AS user_id, u.email,
  us.reminder_offset_days,
  s.next_deadline,
  s.id AS scholarship_id, s.title AS scholarship_title, s.slug AS scholarship_slug,
  a.id AS application_id
FROM users u
JOIN user_settings us ON us.user_id = u.id
JOIN saved_scholarships sv ON sv.user_id = u.id
JOIN scholarships s ON s.id = sv.scholarship_id
LEFT JOIN applications a ON a.user_id = u.id AND a.scholarship_id = s.id
WHERE u.deleted_at IS NULL
  AND u.account_status = 'ACTIVE'
  AND us.email_notifications
  AND s.deleted_at IS NULL
  AND s.next_deadline IS NOT NULL
  AND s.next_deadline > now()
  AND s.next_deadline <= now() + (us.reminder_offset_days || ' days')::interval;

-- -----------------------------------------------------------------------------
-- Operational views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_embeddings_pending AS
SELECT s.id, s.title, s.title_ar, s.description, s.description_ar, s.created_at
FROM scholarships s
WHERE s.needs_embedding AND s.deleted_at IS NULL
ORDER BY s.created_at;

CREATE OR REPLACE VIEW v_import_queue AS
SELECT
  iq.id, iq.batch_id, ib.source_name, ib.source_type, ib.status AS batch_status,
  iq.source_url, iq.content_hash, iq.status AS item_status, iq.attempts, iq.processed_at,
  iq.scholarship_id, s.slug AS scholarship_slug, iq.error, iq.created_at
FROM import_queue_items iq
JOIN import_batches ib ON ib.id = iq.batch_id
LEFT JOIN scholarships s ON s.id = iq.scholarship_id;

CREATE OR REPLACE VIEW v_verification_queue AS
SELECT
  vq.id, vq.scholarship_id, s.title, s.slug, s.verification_status AS scholarship_verification_status,
  vq.reason, vq.priority, vq.status, vq.reviewer_id, vq.reviewed_at, vq.review_notes, vq.created_at
FROM verification_queue vq
JOIN scholarships s ON s.id = vq.scholarship_id;

CREATE OR REPLACE VIEW v_duplicates_pending AS
SELECT
  d.id, d.scholarship_id, s1.title AS scholarship_title, s1.slug AS scholarship_slug,
  d.duplicate_of_id, s2.title AS duplicate_of_title, s2.slug AS duplicate_of_slug,
  d.similarity, d.method, d.status, d.created_at
FROM duplicates d
JOIN scholarships s1 ON s1.id = d.scholarship_id
JOIN scholarships s2 ON s2.id = d.duplicate_of_id
WHERE d.status = 'OPEN';

-- -----------------------------------------------------------------------------
-- Analytics views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_analytics_daily AS
SELECT
  created_at::date AS event_date,
  count(*) AS events,
  count(*) FILTER (WHERE event_name = 'scholarship_view') AS scholarship_views,
  count(*) FILTER (WHERE event_name = 'search') AS searches,
  count(*) FILTER (WHERE event_name = 'match') AS matches,
  count(*) FILTER (WHERE event_name = 'save') AS saves,
  count(*) FILTER (WHERE event_name = 'apply') AS applies,
  count(*) FILTER (WHERE event_name = 'page_view') AS page_views,
  count(DISTINCT user_id) AS active_users
FROM analytics_events
GROUP BY created_at::date;

CREATE OR REPLACE VIEW v_funnel AS
SELECT
  (SELECT count(*) FROM users WHERE deleted_at IS NULL) AS signed_up,
  (SELECT count(*) FROM user_profiles) AS onboarded,
  (SELECT count(*) FROM saved_scholarships) AS saved,
  (SELECT count(*) FROM applications WHERE deleted_at IS NULL) AS applied,
  (SELECT count(*) FROM applications WHERE status = 'SUBMITTED' AND deleted_at IS NULL) AS submitted,
  (SELECT count(*) FROM applications WHERE status = 'ACCEPTED' AND deleted_at IS NULL) AS accepted;
