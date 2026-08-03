CREATE TABLE continents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(2) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  name_ar varchar(100),
  slug varchar(120) NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(3) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  name_ar varchar(100),
  symbol varchar(10),
  decimal_places smallint NOT NULL DEFAULT 2,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(10) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  name_ar varchar(100),
  native_name varchar(100),
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  continent_id uuid NOT NULL REFERENCES continents (id),
  code varchar(2) NOT NULL UNIQUE,
  code3 varchar(3),
  name varchar(120) NOT NULL,
  name_ar varchar(120),
  slug varchar(140) NOT NULL UNIQUE,
  phone_code varchar(10),
  currency_id uuid REFERENCES currencies (id),
  is_active bool NOT NULL DEFAULT true,
  flag_url varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries (id),
  name varchar(150) NOT NULL,
  name_ar varchar(150),
  slug varchar(170) NOT NULL UNIQUE,
  is_capital bool NOT NULL DEFAULT false,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE degree_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  name_ar varchar(100),
  slug varchar(120) NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES study_fields (id),
  name varchar(200) NOT NULL,
  name_ar varchar(200),
  slug varchar(220) NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  phone varchar(40),
  display_name varchar(120) NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  account_status account_status NOT NULL DEFAULT 'PENDING',
  avatar_url varchar(500),
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities (id) ON DELETE SET NULL,
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  locale varchar(10) NOT NULL DEFAULT 'ar',
  language_id uuid REFERENCES languages (id) ON DELETE SET NULL,
  referral_code varchar(40) UNIQUE,
  referred_by uuid REFERENCES users (id) ON DELETE SET NULL,
  email_verified bool NOT NULL DEFAULT false,
  is_test_account bool NOT NULL DEFAULT false,
  last_login_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX users_email_unique_partial ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  name_ar varchar(200),
  slug varchar(220) NOT NULL UNIQUE,
  country_id uuid NOT NULL REFERENCES countries (id),
  city_id uuid REFERENCES cities (id),
  website varchar(300),
  description text,
  description_ar text,
  logo_url varchar(500),
  cover_url varchar(500),
  established_year smallint,
  ranking_national int,
  ranking_world int,
  is_public bool,
  is_featured bool NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'DRAFT',
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at timestamptz,
  verified_by uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities (id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  name_ar varchar(200),
  country_id uuid REFERENCES countries (id),
  city_id uuid REFERENCES cities (id),
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  website varchar(300),
  is_main bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  name_ar varchar(200),
  slug varchar(220) NOT NULL UNIQUE,
  provider_type provider_type NOT NULL DEFAULT 'OTHER',
  country_id uuid REFERENCES countries (id),
  website varchar(300),
  logo_url varchar(500),
  description text,
  contact_email varchar(320),
  contact_phone varchar(40),
  is_verified bool NOT NULL DEFAULT false,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  status content_status NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities (id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  name_ar varchar(200),
  slug varchar(220) NOT NULL UNIQUE,
  faculty varchar(200),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  base_url varchar(500),
  source_type import_source_type NOT NULL DEFAULT 'SCRAPER',
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  provider_id uuid REFERENCES providers (id) ON DELETE SET NULL,
  crawler_frequency varchar(30),
  last_scraped_at timestamptz,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(250) NOT NULL UNIQUE,
  title varchar(300) NOT NULL,
  title_ar varchar(300),
  description text,
  description_ar text,
  seo_description varchar(500),
  provider_id uuid REFERENCES providers (id) ON DELETE SET NULL,
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  university_id uuid REFERENCES universities (id) ON DELETE SET NULL,
  campus_id uuid REFERENCES campuses (id) ON DELETE SET NULL,
  degree_level_id uuid REFERENCES degree_levels (id) ON DELETE SET NULL,
  study_field_id uuid REFERENCES study_fields (id) ON DELETE SET NULL,
  duration_months smallint,
  duration_text varchar(100),
  funding_type funding_type NOT NULL DEFAULT 'UNKNOWN',
  application_fee numeric(12,2),
  application_fee_currency_id uuid REFERENCES currencies (id) ON DELETE SET NULL,
  application_url varchar(500),
  official_website varchar(500),
  official_pdf_url varchar(500),
  opening_date date,
  closing_date date,
  interview_date date,
  results_date date,
  enrollment_date date,
  next_deadline timestamptz,
  minimum_age smallint,
  maximum_age smallint,
  minimum_gpa numeric(4,2),
  gpa_scale numeric(3,1) NOT NULL DEFAULT 4.0,
  minimum_percentage numeric(5,2),
  maximum_gap_years smallint,
  is_fully_funded bool NOT NULL DEFAULT false,
  is_featured bool NOT NULL DEFAULT false,
  is_active bool NOT NULL DEFAULT true,
  status scholarship_status NOT NULL DEFAULT 'DRAFT',
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at timestamptz,
  verified_by uuid REFERENCES users (id) ON DELETE SET NULL,
  difficulty_score smallint,
  competition_level competition_level,
  acceptance_rate numeric(5,2),
  ai_summary text,
  ai_tips text,
  application_process text,
  selection_process text,
  view_count bigint NOT NULL DEFAULT 0,
  save_count bigint NOT NULL DEFAULT 0,
  favorite_count bigint NOT NULL DEFAULT 0,
  application_count bigint NOT NULL DEFAULT 0,
  review_count bigint NOT NULL DEFAULT 0,
  needs_embedding bool NOT NULL DEFAULT true,
  source_url varchar(500),
  source_id uuid REFERENCES sources (id) ON DELETE SET NULL,
  published_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description_ar, '')), 'B')
  ) STORED,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE scholarship_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  cycle_label varchar(100),
  opening_date date,
  closing_date date,
  interview_date date,
  results_date date,
  enrollment_date date,
  status cycle_status NOT NULL DEFAULT 'UPCOMING',
  is_current bool NOT NULL DEFAULT false,
  source_url varchar(500),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX scholarship_cycles_scholarship_label_partial_uq ON scholarship_cycles (scholarship_id, cycle_label) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX scholarship_cycles_scholarship_current_uq ON scholarship_cycles (scholarship_id) WHERE is_current;

CREATE TABLE scholarship_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  benefit_type benefit_type NOT NULL,
  amount numeric(12,2),
  currency_id uuid REFERENCES currencies (id),
  description varchar(500),
  is_estimated bool NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  requirement_type requirement_type NOT NULL,
  min_value varchar(100),
  max_value varchar(100),
  unit varchar(50),
  description varchar(500),
  is_hard_requirement bool NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_test_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  test_type test_type NOT NULL,
  minimum_score numeric(6,2),
  minimum_band varchar(20),
  is_mandatory bool NOT NULL DEFAULT true,
  notes varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, test_type)
);

CREATE TABLE scholarship_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  name varchar(200),
  name_ar varchar(200),
  description varchar(500),
  is_required bool NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_degrees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  degree_level_id uuid NOT NULL REFERENCES degree_levels (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, degree_level_id)
);

CREATE TABLE scholarship_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  study_field_id uuid NOT NULL REFERENCES study_fields (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, study_field_id)
);

CREATE TABLE scholarship_eligible_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES countries (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, country_id)
);

CREATE TABLE scholarship_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES languages (id) ON DELETE CASCADE,
  is_required bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, language_id)
);

CREATE TABLE scholarship_similarities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  similar_scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  similarity_score numeric(5,2) NOT NULL,
  method varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, similar_scholarship_id)
);

CREATE TABLE scholarship_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  title varchar(300),
  body text,
  is_verified bool NOT NULL DEFAULT false,
  is_featured bool NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'DRAFT',
  helpful_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX scholarship_reviews_scholarship_user_partial_uq ON scholarship_reviews (scholarship_id, user_id) WHERE deleted_at IS NULL;

CREATE TABLE scholarship_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  question varchar(500) NOT NULL,
  question_ar varchar(500),
  answer text NOT NULL,
  answer_ar text,
  sort_order int NOT NULL DEFAULT 0,
  is_published bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  media_type media_type NOT NULL DEFAULT 'IMAGE',
  url varchar(500) NOT NULL,
  alt varchar(300),
  alt_ar varchar(300),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  title varchar(300) NOT NULL,
  title_ar varchar(300),
  url varchar(500),
  excerpt varchar(500),
  source varchar(200),
  published_at timestamptz,
  is_published bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users (id) ON DELETE SET NULL,
  slug varchar(250) NOT NULL UNIQUE,
  title varchar(300) NOT NULL,
  title_ar varchar(300),
  excerpt varchar(500),
  content text,
  content_ar text,
  cover_url varchar(500),
  status content_status NOT NULL DEFAULT 'DRAFT',
  seo_title varchar(200),
  seo_description varchar(500),
  tags text[] NOT NULL DEFAULT '{}',
  view_count bigint NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(250) NOT NULL UNIQUE,
  title varchar(300) NOT NULL,
  title_ar varchar(300),
  description text,
  event_type event_type NOT NULL DEFAULT 'OTHER',
  is_online bool NOT NULL DEFAULT false,
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities (id) ON DELETE SET NULL,
  university_id uuid REFERENCES universities (id) ON DELETE SET NULL,
  venue varchar(300),
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  registration_url varchar(500),
  capacity int,
  attendee_count int NOT NULL DEFAULT 0,
  status event_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status event_attendee_status NOT NULL DEFAULT 'REGISTERED',
  registered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  bio text,
  gender gender,
  date_of_birth date,
  nationality_country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  residence_country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  education_level education_level,
  current_degree_id uuid REFERENCES degree_levels (id) ON DELETE SET NULL,
  major_field_id uuid REFERENCES study_fields (id) ON DELETE SET NULL,
  university_id uuid REFERENCES universities (id) ON DELETE SET NULL,
  gpa numeric(4,2),
  gpa_scale numeric(3,1) NOT NULL DEFAULT 4.0,
  grade_type grade_type NOT NULL DEFAULT 'GPA_4',
  english_level english_level,
  target_degree_id uuid REFERENCES degree_levels (id) ON DELETE SET NULL,
  target_country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  preferred_majors text[],
  annual_budget numeric(12,2),
  budget_currency_id uuid REFERENCES currencies (id) ON DELETE SET NULL,
  is_actively_searching bool NOT NULL DEFAULT true,
  is_public bool NOT NULL DEFAULT false,
  about text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  institution varchar(200) NOT NULL,
  degree_type degree_type NOT NULL,
  degree_level_id uuid REFERENCES degree_levels (id) ON DELETE SET NULL,
  field_id uuid REFERENCES study_fields (id) ON DELETE SET NULL,
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities (id) ON DELETE SET NULL,
  grade_type grade_type,
  gpa numeric(4,2),
  percentage numeric(5,2),
  start_date date,
  end_date date,
  is_current bool NOT NULL DEFAULT false,
  description text,
  is_verified bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text,
  category varchar(80),
  issuer varchar(200),
  date_awarded date,
  url varchar(500),
  is_public bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  company varchar(200) NOT NULL,
  role varchar(200) NOT NULL,
  description text,
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities (id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  is_current bool NOT NULL DEFAULT false,
  is_public bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_volunteer_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization varchar(200) NOT NULL,
  role varchar(200),
  description text,
  country_id uuid REFERENCES countries (id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  is_current bool NOT NULL DEFAULT false,
  is_public bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_research_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text,
  institution varchar(200),
  field_id uuid REFERENCES study_fields (id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  publications_url varchar(500),
  is_public bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES languages (id) ON DELETE CASCADE,
  proficiency_level proficiency_level NOT NULL DEFAULT 'INTERMEDIATE',
  cefr_level english_level,
  is_public bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, language_id)
);

CREATE TABLE user_test_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  test_type test_type NOT NULL,
  score numeric(6,2),
  band varchar(20),
  test_date date,
  certificate_url varchar(500),
  is_verified bool NOT NULL DEFAULT false,
  verified_at timestamptz,
  notes varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, test_type, test_date)
);

CREATE TABLE user_finance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  annual_income numeric(12,2),
  currency_id uuid REFERENCES currencies (id) ON DELETE SET NULL,
  savings numeric(12,2),
  monthly_budget numeric(12,2),
  dependents smallint NOT NULL DEFAULT 0,
  needs_full_funding bool NOT NULL DEFAULT false,
  willing_to_consider_loans bool NOT NULL DEFAULT false,
  has_sponsor bool NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  target_country_ids uuid[] NOT NULL DEFAULT '{}',
  target_degree_ids uuid[] NOT NULL DEFAULT '{}',
  target_field_ids uuid[] NOT NULL DEFAULT '{}',
  minimum_funding_percent numeric(5,2) NOT NULL DEFAULT 100.00,
  open_to_relocation bool NOT NULL DEFAULT true,
  open_to_online bool NOT NULL DEFAULT false,
  willing_to_consider_loans bool NOT NULL DEFAULT false,
  is_public bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  language varchar(10) NOT NULL DEFAULT 'ar',
  theme varchar(20) NOT NULL DEFAULT 'light',
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  email_notifications bool NOT NULL DEFAULT true,
  push_notifications bool NOT NULL DEFAULT true,
  sms_notifications bool NOT NULL DEFAULT false,
  marketing_opt_in bool NOT NULL DEFAULT false,
  reminder_offset_days int NOT NULL DEFAULT 7,
  two_factor_enabled bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  document_type document_type NOT NULL,
  file_url varchar(500) NOT NULL,
  file_type varchar(20),
  mime_type varchar(100),
  size_bytes bigint,
  version int NOT NULL DEFAULT 1,
  parent_document_id uuid REFERENCES user_documents (id) ON DELETE SET NULL,
  status user_document_status NOT NULL DEFAULT 'UPLOADED',
  is_private bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_recommendation_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  writer_name varchar(200) NOT NULL,
  writer_email varchar(320),
  writer_title varchar(200),
  institution varchar(200),
  relationship relation_type,
  letter_url varchar(500),
  status letter_status NOT NULL DEFAULT 'DRAFT',
  requested_at timestamptz,
  reminded_at timestamptz,
  submitted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title varchar(300) NOT NULL,
  essay_type essay_type NOT NULL DEFAULT 'SCHOLARSHIP_ESSAY',
  prompt text,
  content text,
  word_count int,
  is_draft bool NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES scholarship_cycles (id) ON DELETE SET NULL,
  status application_status NOT NULL DEFAULT 'DRAFT',
  progress numeric(5,2) NOT NULL DEFAULT 0,
  application_url varchar(500),
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX applications_user_scholarship_no_cycle_uq ON applications (user_id, scholarship_id) WHERE cycle_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX applications_user_scholarship_cycle_uq ON applications (user_id, scholarship_id, cycle_id) WHERE cycle_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE application_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  stage_type stage_type NOT NULL,
  name varchar(150) NOT NULL,
  name_ar varchar(150),
  sort_order int NOT NULL DEFAULT 0,
  status stage_status NOT NULL DEFAULT 'PENDING',
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, stage_type)
);

CREATE TABLE application_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  stage_id uuid REFERENCES application_stages (id) ON DELETE SET NULL,
  task_type task_type NOT NULL DEFAULT 'OTHER',
  title varchar(250) NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'PENDING',
  due_date date,
  reminder_sent_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  stage_id uuid REFERENCES application_stages (id) ON DELETE SET NULL,
  user_document_id uuid REFERENCES user_documents (id) ON DELETE SET NULL,
  scholarship_document_id uuid REFERENCES scholarship_documents (id) ON DELETE SET NULL,
  document_type document_type NOT NULL,
  name varchar(200),
  file_url varchar(500),
  status application_document_status NOT NULL DEFAULT 'REQUIRED',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);

CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);

CREATE TABLE ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title varchar(200),
  context jsonb NOT NULL DEFAULT '{}',
  provider ai_provider,
  model varchar(100),
  message_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES ai_chats (id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content text NOT NULL,
  tokens_in int,
  tokens_out int,
  provider ai_provider,
  model varchar(100),
  latency_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_document_id uuid REFERENCES user_documents (id) ON DELETE SET NULL,
  application_document_id uuid REFERENCES application_documents (id) ON DELETE SET NULL,
  review_type ai_review_type NOT NULL,
  content text,
  score numeric(3,1),
  strengths jsonb NOT NULL DEFAULT '[]',
  weaknesses jsonb NOT NULL DEFAULT '[]',
  suggestions jsonb NOT NULL DEFAULT '[]',
  status ai_review_status NOT NULL DEFAULT 'QUEUED',
  provider ai_provider,
  model varchar(100),
  credits_used int NOT NULL DEFAULT 1,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  report_type ai_report_type NOT NULL,
  title varchar(300),
  summary text,
  content jsonb NOT NULL DEFAULT '{}',
  status ai_review_status NOT NULL DEFAULT 'QUEUED',
  provider ai_provider,
  model varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE acceptance_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  probability numeric(5,2) NOT NULL,
  fit_score numeric(5,2) NOT NULL,
  factors jsonb NOT NULL DEFAULT '{}',
  model_version varchar(50) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);

CREATE TABLE ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  content_hash char(64) NOT NULL,
  embedding vector(1536) NOT NULL,
  provider ai_provider NOT NULL DEFAULT 'OPENAI',
  model varchar(100) NOT NULL,
  dimensions int NOT NULL DEFAULT 1536,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

CREATE TABLE ai_matching_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status ai_review_status NOT NULL DEFAULT 'QUEUED',
  score_threshold numeric(5,2) NOT NULL DEFAULT 60.00,
  matched_count int,
  result jsonb,
  provider ai_provider,
  model varchar(100),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  query text,
  filters jsonb NOT NULL DEFAULT '{}',
  results_count int,
  clicked_scholarship_id uuid REFERENCES scholarships (id) ON DELETE SET NULL,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'IN_APP',
  title varchar(300) NOT NULL,
  body text,
  link varchar(500),
  data jsonb NOT NULL DEFAULT '{}',
  status notification_status NOT NULL DEFAULT 'PENDING',
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  to_address varchar(320) NOT NULL,
  from_address varchar(320) NOT NULL,
  subject varchar(500) NOT NULL,
  template varchar(100),
  body_html text,
  body_text text,
  status email_status NOT NULL DEFAULT 'QUEUED',
  provider varchar(30),
  message_id varchar(200),
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency_id uuid REFERENCES currencies (id) ON DELETE SET NULL,
  method payment_method NOT NULL,
  provider_reference varchar(200),
  status payment_status NOT NULL DEFAULT 'PENDING',
  credits int NOT NULL DEFAULT 0,
  description varchar(300),
  reviewed_by uuid REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources (id) ON DELETE SET NULL,
  source_type import_source_type NOT NULL,
  source_name varchar(200),
  source_url varchar(500),
  status import_status NOT NULL DEFAULT 'PENDING',
  total_items int NOT NULL DEFAULT 0,
  succeeded int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  duplicates_found int NOT NULL DEFAULT 0,
  error_summary text,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE import_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES import_batches (id) ON DELETE CASCADE,
  source_url varchar(500),
  raw_payload jsonb NOT NULL DEFAULT '{}',
  extracted jsonb NOT NULL DEFAULT '{}',
  content_hash char(64),
  status queue_item_status NOT NULL DEFAULT 'PENDING',
  scholarship_id uuid REFERENCES scholarships (id) ON DELETE SET NULL,
  error text,
  attempts int NOT NULL DEFAULT 0,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  change_type change_type NOT NULL DEFAULT 'UPDATE',
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, version)
);

CREATE TABLE scholarship_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  field_name varchar(120) NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_type change_type NOT NULL DEFAULT 'UPDATE',
  changed_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  duplicate_of_id uuid NOT NULL REFERENCES scholarships (id) ON DELETE CASCADE,
  similarity numeric(5,2) NOT NULL,
  method varchar(30) NOT NULL,
  status duplicate_status NOT NULL DEFAULT 'OPEN',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scholarship_id, duplicate_of_id)
);

CREATE TABLE verification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id uuid NOT NULL UNIQUE REFERENCES scholarships (id) ON DELETE CASCADE,
  reason varchar(500),
  priority verification_priority NOT NULL DEFAULT 'NORMAL',
  status verification_status NOT NULL DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid NOT NULL,
  action audit_action NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  entity_type varchar(80),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  event_name varchar(120) NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}',
  url varchar(500),
  referrer varchar(500),
  session_id varchar(100),
  device varchar(50),
  browser varchar(50),
  os varchar(50),
  country_code varchar(2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL UNIQUE,
  new_users int NOT NULL DEFAULT 0,
  active_users int NOT NULL DEFAULT 0,
  scholarships_added int NOT NULL DEFAULT 0,
  applications_created int NOT NULL DEFAULT 0,
  applications_submitted int NOT NULL DEFAULT 0,
  matches_generated int NOT NULL DEFAULT 0,
  ai_reviews_completed int NOT NULL DEFAULT 0,
  searches int NOT NULL DEFAULT 0,
  saved_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name varchar(120) NOT NULL,
  status cron_status,
  items_processed int NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description varchar(300),
  updated_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
