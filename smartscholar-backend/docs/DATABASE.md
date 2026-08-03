# SmartScholar Backend — Database Design

> **Source of truth.** Every `.sql` file, `prisma/schema.prisma`, script and doc
> in this repository is generated from this document. If you change a table,
> column, enum, index, trigger or policy here, regenerate the dependents.
> `tools/validate.mjs` cross-checks SQL ↔ Prisma ↔ this doc automatically.

---

## 1. Purpose & Scale

PostgreSQL database for SmartScholar — an AI-powered scholarship platform for
Arab/Middle-Eastern students. Targets:

| Dimension | Target |
|---|---|
| Users | 1,000,000+ |
| Scholarships | 100,000+ |
| Universities | 20,000+ |
| Countries | 250+ |
| Providers | thousands |
| AI embeddings | millions of vectors |

Non-negotiable: full 3NF (every non-key column depends on the key, nothing
depends on part of a key), UUID PKs, foreign keys, indexes, constraints,
triggers, views, functions, enums, and row-level security.

## 2. Design Decisions

| Decision | Choice | Why |
|---|---|---|
| IDs | `uuid` PK, default `gen_random_uuid()` | Collision-free at scale, unguessable, merge-safe |
| Soft delete | `deleted_at timestamptz` on user/content tables | Recoverability, audit; `WHERE deleted_at IS NULL` in views |
| Money | `numeric(12,2)` + `currency_id` FK | No floats; ISO 4217 normalized |
| Timestamps | `timestamptz`, default `now()`; `updated_at` via trigger | Instant-based; DST-proof |
| Calendar dates | `date` for deadlines/opening/closing | A deadline is a date, not an instant |
| Language | bilingual `_ar` columns on content; FTS config `simple` | Arabic-first; `simple` config tokenizes both scripts without stemming |
| Multi-tenancy | Supabase Auth → `users.id = auth.uid()` | Auth (Supabase) and profile (`users` table) stay separate, synced by API |
| DDL ownership | **SQL files own the schema.** Prisma is a mirror for the app layer | Views, generated columns, pgvector and RLS cannot be expressed in Prisma |
| Auditing | `audit_logs` (write) + `activity_logs` (user actions) + `scholarship_change_logs` (field diffs) | Separate concerns, different retention |
| Duplicate detection | `pg_trgm` similarity + embeddings | Scrapers produce near-duplicates daily |
| Counters | denormalized `*_count` on `scholarships`/`events`, maintained by triggers | `count(*)` on millions of rows is too slow for list pages |

## 3. Conventions

- Tables plural snake_case; join tables `singular_a_b` nouns (e.g. `scholarship_fields`).
- Columns snake_case. FK column = `<entity>_id`. PK always `id`.
- `created_at`, `updated_at` on every table that can change; `deleted_at` where soft delete applies.
- Check constraints enforce ranges in `005_constraints.sql`, not in app code.
- Enum types in `002_enums.sql`, values UPPER_SNAKE.
- Extensions are the only thing in `001_extensions.sql`.

## 4. Extensions

| Extension | Purpose |
|---|---|
| `pgcrypto` | `gen_random_uuid()` (also built-in PG13+, kept for older engines) |
| `pg_trgm` | fuzzy search + duplicate detection |
| `pgvector` | embedding storage + HNSW similarity search |
| `citext` | case-insensitive email lookups |

## 5. Enum Catalog

Defined in `002_enums.sql`. Used as column types — never free text.

| Enum | Values |
|---|---|
| `user_role` | STUDENT, PARENT, COUNSELOR, UNIVERSITY_STAFF, PROVIDER_STAFF, ADMIN, SUPER_ADMIN |
| `account_status` | PENDING, ACTIVE, SUSPENDED, DISABLED, DELETED |
| `gender` | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| `education_level` | SECONDARY, HIGH_SCHOOL, DIPLOMA, ASSOCIATE, BACHELOR, MASTER, DOCTORATE, OTHER |
| `degree_type` | ASSOCIATE, BACHELOR, MASTER, DOCTORATE, DIPLOMA, CERTIFICATE, SHORT_COURSE, EXCHANGE, LANGUAGE_COURSE, RESEARCH, SUMMER_SCHOOL, OTHER |
| `grade_type` | GPA_4, GPA_5, GPA_10, PERCENTAGE, CLASS_GRADE, PASS_FAIL, OTHER |
| `english_level` | A1, A2, B1, B2, C1, C2, NATIVE, NOT_TESTED |
| `proficiency_level` | BEGINNER, ELEMENTARY, INTERMEDIATE, UPPER_INTERMEDIATE, ADVANCED, NATIVE |
| `test_type` | IELTS, TOEFL, DUOLINGO, SAT, ACT, GRE, GMAT, OTHER |
| `provider_type` | GOVERNMENT, UNIVERSITY, CORPORATE, NON_PROFIT, PRIVATE_FOUNDATION, INTERNATIONAL_ORGANIZATION, PHILANTHROPIC, OTHER |
| `scholarship_status` | DRAFT, PENDING_REVIEW, ACTIVE, INACTIVE, ARCHIVED, REJECTED, MERGED |
| `verification_status` | UNVERIFIED, PENDING, VERIFIED, REJECTED, NEEDS_REVIEW |
| `funding_type` | FULLY_FUNDED, PARTIALLY_FUNDED, SELF_FUNDED, LOAN, WORK_STUDY, UNKNOWN |
| `competition_level` | LOW, MEDIUM, HIGH, VERY_HIGH |
| `cycle_status` | UPCOMING, OPEN, CLOSED, COMPLETED, CANCELLED, POSTPONED |
| `benefit_type` | TUITION, TUITION_DISCOUNT, HOUSING, MONTHLY_STIPEND, YEARLY_STIPEND, ONE_TIME_GRANT, INSURANCE, FLIGHT, BOOKS, RESEARCH_GRANT, TRAVEL_GRANT, VISA_SUPPORT, SETTLEMENT_ALLOWANCE, FAMILY_ALLOWANCE, APPLICATION_FEE_WAIVER, COMPUTER, LANGUAGE_COURSE, OTHER |
| `requirement_type` | NATIONALITY, RESIDENCE, AGE, GPA, PERCENTAGE, IELTS, TOEFL, DUOLINGO, SAT, ACT, GRE, GMAT, GAP_YEARS, PORTFOLIO, INTERVIEW, MEDICAL_EXAM, WORK_EXPERIENCE, ENROLLMENT_STATUS, GENDER, DISABILITY, FIRST_GENERATION, REFUGEE, OTHER |
| `document_type` | TRANSCRIPT, DIPLOMA, CERTIFICATE, CV, RESUME, STATEMENT_OF_PURPOSE, MOTIVATION_LETTER, LETTER_OF_RECOMMENDATION, PASSPORT, ID_CARD, IELTS, TOEFL, DUOLINGO, SAT, GRE, GMAT, PORTFOLIO, FINANCIAL_STATEMENT, BANK_STATEMENT, MEDICAL_CERTIFICATE, PHOTO, TAX_RETURN, WORK_CONTRACT, PUBLICATION, OTHER |
| `media_type` | IMAGE, VIDEO, DOCUMENT, PDF, VIRTUAL_TOUR |
| `content_status` | DRAFT, PUBLISHED, SCHEDULED, ARCHIVED, REJECTED |
| `event_type` | WEBINAR, WORKSHOP, FAIR, INFO_SESSION, APPLICATION_DEADLINE, EXAM, INTERVIEW, OTHER |
| `event_status` | DRAFT, OPEN, FULL, CANCELLED, COMPLETED |
| `event_attendee_status` | REGISTERED, ATTENDED, CANCELLED, WAITLISTED, NO_SHOW |
| `application_status` | DRAFT, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, INTERVIEW, WAITLISTED, ACCEPTED, REJECTED, WITHDRAWN, COMPLETED |
| `stage_type` | ELIGIBILITY, DOCUMENTS, FORMS, TESTS, SUBMISSION, INTERVIEW, DECISION, ENROLLMENT |
| `stage_status` | PENDING, IN_PROGRESS, COMPLETED, SKIPPED, BLOCKED |
| `task_type` | DOCUMENT_UPLOAD, FORM, TEST_BOOKING, PAYMENT, INTERVIEW, REFERENCE_REQUEST, SUBMISSION, OTHER |
| `task_status` | PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED |
| `application_document_status` | REQUIRED, UPLOADED, SUBMITTED, ACCEPTED, REJECTED |
| `user_document_status` | UPLOADED, PROCESSING, READY, REJECTED, ARCHIVED |
| `relation_type` | SPONSOR, PARENT, GUARDIAN, TEACHER, EMPLOYER, MENTOR, OTHER |
| `letter_status` | DRAFT, REQUESTED, REMINDED, SUBMITTED, RECEIVED, DECLINED |
| `essay_type` | STATEMENT_OF_PURPOSE, PERSONAL_STATEMENT, MOTIVATION_LETTER, SCHOLARSHIP_ESSAY, PORTFOLIO_STATEMENT, OTHER |
| `notification_type` | DEADLINE_REMINDER, APPLICATION_UPDATE, PAYMENT_UPDATE, MATCH_RESULTS, DOCUMENT_REVIEW, ACCOUNT, SYSTEM, PROMOTIONAL |
| `notification_channel` | IN_APP, EMAIL, PUSH, SMS |
| `notification_status` | PENDING, SENT, DELIVERED, READ, CLICKED, FAILED |
| `email_status` | QUEUED, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED, DROPPED |
| `ai_provider` | GROQ, GEMINI, OPENAI, CLAUDE, BAZAARLINK, AGENTROUTER, OTHER |
| `ai_review_type` | CV, ESSAY, RECOMMENDATION_LETTER, STATEMENT_OF_PURPOSE, PORTFOLIO, OTHER |
| `ai_review_status` | QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED |
| `ai_report_type` | ACCEPTANCE_PREDICTION, PROFILE_REVIEW, SCHOLARSHIP_ANALYSIS, MATCHING_EXPLANATION, TREND_ANALYSIS, OTHER |
| `chat_role` | SYSTEM, USER, ASSISTANT, TOOL |
| `import_status` | PENDING, PROCESSING, COMPLETED, PARTIAL, FAILED, CANCELLED |
| `import_source_type` | MANUAL, CSV, JSON, API, SCRAPER, AI_EXTRACTION, BULK_UPDATE |
| `queue_item_status` | PENDING, PROCESSING, COMPLETED, FAILED, SKIPPED, DUPLICATE |
| `change_type` | CREATE, UPDATE, MERGE, DELETE, STATUS_CHANGE, VERIFICATION_CHANGE |
| `duplicate_status` | OPEN, FALSE_POSITIVE, MERGED, KEEP_BOTH, RESOLVED |
| `verification_priority` | LOW, NORMAL, HIGH, URGENT |
| `audit_action` | INSERT, UPDATE, DELETE, SOFT_DELETE, RESTORE, LOGIN, LOGOUT, EXPORT, IMPORT, MASS_UPDATE |
| `activity_type` | PAGE_VIEW, SEARCH, SAVE, UNSAVE, APPLY, UPLOAD, REVIEW, LOGIN, LOGOUT, DOWNLOAD, SHARE, MATCH, OPEN_LINK |
| `payment_method` | STRIPE, VODAFONE_CASH, INSTAPAY, BANK_TRANSFER, OTHER |
| `payment_status` | PENDING, APPROVED, REJECTED, REFUNDED, FAILED |
| `cron_status` | RUNNING, SUCCESS, FAILED |

## 6. Table Catalog

Legend: `PK` primary key, `FK→t` foreign key to table `t`, `UQ` unique, `?` nullable, `jsonb` flexible payload.

### 6.1 Geography

**`continents`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| code | varchar(2) UQ NOT NULL | AF, AS, EU… |
| name | varchar(100) NOT NULL | |
| name_ar | varchar(100) | |
| slug | varchar(120) UQ NOT NULL | |
| sort_order | int NOT NULL DEFAULT 0 | |
| created_at / updated_at / deleted_at | timestamptz | |

**`countries`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| continent_id | uuid NOT NULL FK→continents | |
| code | varchar(2) UQ NOT NULL | ISO 3166-1 alpha-2 |
| code3 | varchar(3) | alpha-3 |
| name | varchar(120) NOT NULL | |
| name_ar | varchar(120) | |
| slug | varchar(140) UQ NOT NULL | |
| phone_code | varchar(10) | |
| currency_id | uuid FK→currencies | |
| is_active | bool NOT NULL DEFAULT true | |
| flag_url | varchar(500) | |
| created_at / updated_at / deleted_at | | |

**`cities`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid NOT NULL FK→countries | |
| name | varchar(150) NOT NULL | |
| name_ar | varchar(150) | |
| slug | varchar(170) UQ NOT NULL | |
| is_capital | bool NOT NULL DEFAULT false | |
| latitude / longitude | numeric(10,7) | |
| created_at / updated_at / deleted_at | | |

**`currencies`** — id PK, `code varchar(3) UQ NOT NULL`, name, name_ar, symbol varchar(10), decimal_places smallint DEFAULT 2, is_active, created_at, updated_at.

**`languages`** — id PK, `code varchar(10) UQ NOT NULL`, name, name_ar, native_name, is_active, created_at, updated_at.

### 6.2 Institutions

**`universities`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | varchar(200) NOT NULL | |
| name_ar | varchar(200) | |
| slug | varchar(220) UQ NOT NULL | |
| country_id | uuid NOT NULL FK→countries | |
| city_id | uuid FK→cities | |
| website | varchar(300) | |
| description / description_ar | text | |
| logo_url / cover_url | varchar(500) | |
| established_year | smallint | |
| ranking_national / ranking_world | int | |
| is_public | bool | |
| is_featured | bool NOT NULL DEFAULT false | |
| status | content_status NOT NULL DEFAULT 'DRAFT' | |
| verification_status | verification_status NOT NULL DEFAULT 'UNVERIFIED' | |
| verified_at | timestamptz | |
| verified_by | uuid FK→users | |
| created_at / updated_at / deleted_at | | |

**`campuses`** — id PK, university_id NOT NULL FK→universities ON DELETE CASCADE, name, name_ar, country_id FK→countries, city_id FK→cities, address text, latitude/longitude numeric(10,7), website varchar(300), is_main bool DEFAULT false, created_at/updated_at/deleted_at.

**`providers`** — id PK, name NOT NULL, name_ar, slug UQ NOT NULL, provider_type provider_type NOT NULL DEFAULT 'OTHER', country_id FK→countries, website, logo_url, description text, contact_email varchar(320), contact_phone varchar(40), is_verified bool DEFAULT false, verification_status DEFAULT 'UNVERIFIED', status content_status DEFAULT 'DRAFT', created_at/updated_at/deleted_at.

**`departments`** — id PK, university_id NOT NULL FK→universities ON DELETE CASCADE, name NOT NULL, name_ar, slug UQ NOT NULL, faculty varchar(200), description text, created_at/updated_at/deleted_at.

### 6.3 Academic dimensions

**`degree_levels`** — id PK, name NOT NULL, name_ar, slug UQ NOT NULL, sort_order int DEFAULT 0, is_active bool DEFAULT true, created_at, updated_at.

**`study_fields`** — id PK, parent_id FK→study_fields (self), name NOT NULL, name_ar, slug UQ NOT NULL, sort_order int DEFAULT 0, is_active bool DEFAULT true, created_at, updated_at.

### 6.4 Scholarships

**`scholarships`** (core, ~45 columns)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar(250) UQ NOT NULL | |
| title | varchar(300) NOT NULL | |
| title_ar | varchar(300) | |
| description / description_ar | text | |
| seo_description | varchar(500) | |
| provider_id | uuid FK→providers ON DELETE SET NULL | |
| country_id | uuid FK→countries ON DELETE SET NULL | host country |
| university_id | uuid FK→universities ON DELETE SET NULL | host university |
| campus_id | uuid FK→campuses ON DELETE SET NULL | |
| degree_level_id | uuid FK→degree_levels ON DELETE SET NULL | primary degree |
| study_field_id | uuid FK→study_fields ON DELETE SET NULL | primary field |
| duration_months | smallint | |
| duration_text | varchar(100) | |
| funding_type | funding_type NOT NULL DEFAULT 'UNKNOWN' | |
| application_fee | numeric(12,2) | |
| application_fee_currency_id | uuid FK→currencies ON DELETE SET NULL | |
| application_url | varchar(500) | |
| official_website | varchar(500) | |
| official_pdf_url | varchar(500) | |
| opening_date / closing_date / interview_date / results_date / enrollment_date | date | synced from current cycle |
| next_deadline | timestamptz | maintained by trigger |
| minimum_age / maximum_age | smallint | |
| minimum_gpa | numeric(4,2) | |
| gpa_scale | numeric(3,1) NOT NULL DEFAULT 4.0 | |
| minimum_percentage | numeric(5,2) | |
| maximum_gap_years | smallint | |
| is_fully_funded | bool NOT NULL DEFAULT false | |
| is_featured | bool NOT NULL DEFAULT false | |
| is_active | bool NOT NULL DEFAULT true | display flag |
| status | scholarship_status NOT NULL DEFAULT 'DRAFT' | |
| verification_status | verification_status NOT NULL DEFAULT 'UNVERIFIED' | |
| verified_at | timestamptz | |
| verified_by | uuid FK→users ON DELETE SET NULL | |
| difficulty_score | smallint | 1–10 |
| competition_level | competition_level | |
| acceptance_rate | numeric(5,2) | 0–100 |
| ai_summary / ai_tips | text | |
| application_process / selection_process | text | |
| view_count / save_count / favorite_count / application_count / review_count | bigint NOT NULL DEFAULT 0 | trigger-maintained |
| needs_embedding | bool NOT NULL DEFAULT true | |
| source_url | varchar(500) | |
| source_id | uuid FK→sources ON DELETE SET NULL | |
| published_at | timestamptz | |
| search_vector | tsvector GENERATED ALWAYS AS … STORED | title/title_ar (A) + description/description_ar (B), config `simple` |
| metadata | jsonb NOT NULL DEFAULT '{}' | |
| created_at / updated_at / deleted_at | | |

`scholarship_benefits`, `scholarship_requirements`, `scholarship_documents`, `scholarship_test_requirements`, `scholarship_degrees`, `scholarship_fields`, `scholarship_eligible_countries`, `scholarship_languages`, `scholarship_similarities` — all carry `scholarship_id uuid NOT NULL FK→scholarships ON DELETE CASCADE` plus payload; join tables add `UQ (scholarship_id, <target>_id)`.

| table | payload columns |
|---|---|
| `scholarship_cycles` | cycle_label varchar(100), opening_date, closing_date, interview_date, results_date, enrollment_date date?, status cycle_status DEFAULT 'UPCOMING', is_current bool DEFAULT false, source_url, notes text, timestamps, deleted_at. UQ(scholarship_id, cycle_label) partial, partial unique current |
| `scholarship_benefits` | benefit_type benefit_type NOT NULL, amount numeric(12,2), currency_id FK→currencies, description varchar(500), is_estimated bool DEFAULT false, sort_order int DEFAULT 0 |
| `scholarship_requirements` | requirement_type requirement_type NOT NULL, min_value varchar(100), max_value varchar(100), unit varchar(50), description varchar(500), is_hard_requirement bool DEFAULT true, sort_order int DEFAULT 0 |
| `scholarship_test_requirements` | test_type test_type NOT NULL, minimum_score numeric(6,2), minimum_band varchar(20), is_mandatory bool DEFAULT true, notes varchar(300). UQ(scholarship_id, test_type) |
| `scholarship_documents` | document_type document_type NOT NULL, name, name_ar, description varchar(500), is_required bool DEFAULT true, sort_order int DEFAULT 0 |
| `scholarship_degrees` | degree_level_id uuid NOT NULL FK→degree_levels ON DELETE CASCADE, created_at. UQ(scholarship_id, degree_level_id) |
| `scholarship_fields` | study_field_id uuid NOT NULL FK→study_fields ON DELETE CASCADE, created_at. UQ(scholarship_id, study_field_id) |
| `scholarship_eligible_countries` | country_id uuid NOT NULL FK→countries ON DELETE CASCADE, created_at. UQ(scholarship_id, country_id) |
| `scholarship_languages` | language_id uuid NOT NULL FK→languages ON DELETE CASCADE, is_required bool DEFAULT false. UQ(scholarship_id, language_id) |
| `scholarship_similarities` | similar_scholarship_id uuid NOT NULL FK→scholarships ON DELETE CASCADE, similarity_score numeric(5,2) NOT NULL, method varchar(30) NOT NULL, created_at. UQ(scholarship_id, similar_scholarship_id), CHECK (scholarship_id <> similar_scholarship_id) |

### 6.5 Content

`scholarship_reviews` — scholarship_id FK→scholarships CASCADE, user_id FK→users CASCADE, rating smallint NOT NULL CHECK 1–5, title, body text, is_verified/is_featured bool DEFAULT false, status content_status DEFAULT 'DRAFT', helpful_count int DEFAULT 0, timestamps, deleted_at. Partial UQ(scholarship_id, user_id) WHERE deleted_at IS NULL.

`scholarship_faqs` — scholarship_id FK CASCADE, question varchar(500) NOT NULL, question_ar, answer text NOT NULL, answer_ar, sort_order int, is_published bool DEFAULT true, timestamps.

`scholarship_gallery` — scholarship_id FK CASCADE, media_type media_type DEFAULT 'IMAGE', url varchar(500) NOT NULL, alt, alt_ar, sort_order int, created_at.

`scholarship_news` — scholarship_id FK CASCADE, title NOT NULL, title_ar, url varchar(500), excerpt varchar(500), source varchar(200), published_at, is_published bool DEFAULT true, timestamps.

`blogs` — author_id FK→users SET NULL, slug UQ NOT NULL, title NOT NULL, title_ar, excerpt varchar(500), content, content_ar, cover_url, status content_status DEFAULT 'DRAFT', seo_title varchar(200), seo_description varchar(500), tags text[] DEFAULT '{}', view_count bigint DEFAULT 0, published_at, timestamps, deleted_at.

`events` — slug UQ NOT NULL, title NOT NULL, title_ar, description text, event_type event_type DEFAULT 'OTHER', is_online bool DEFAULT false, country_id FK→countries SET NULL, city_id FK→cities SET NULL, university_id FK→universities SET NULL, venue varchar(300), start_at timestamptz NOT NULL, end_at timestamptz, registration_url, capacity int, attendee_count int DEFAULT 0, status event_status DEFAULT 'OPEN', timestamps, deleted_at.

`event_attendees` — event_id FK→events CASCADE, user_id FK→users CASCADE, status event_attendee_status DEFAULT 'REGISTERED', registered_at DEFAULT now(), created_at. UQ(event_id, user_id).

### 6.6 Users

**`users`** — mirrors Supabase `auth.users`.
| column | type | notes |
|---|---|---|
| id | uuid PK | = auth.uid() |
| email | varchar(320) NOT NULL | partial UQ WHERE deleted_at IS NULL |
| phone | varchar(40) | |
| display_name | varchar(120) NOT NULL | |
| role | user_role NOT NULL DEFAULT 'STUDENT' | |
| account_status | account_status NOT NULL DEFAULT 'PENDING' | |
| avatar_url | varchar(500) | |
| country_id | uuid FK→countries SET NULL | |
| city_id | uuid FK→cities SET NULL | |
| timezone | varchar(64) NOT NULL DEFAULT 'UTC' | |
| locale | varchar(10) NOT NULL DEFAULT 'ar' | |
| language_id | uuid FK→languages SET NULL | |
| referral_code | varchar(40) UQ | |
| referred_by | uuid FK→users SET NULL | |
| email_verified | bool NOT NULL DEFAULT false | |
| is_test_account | bool NOT NULL DEFAULT false | |
| last_login_at | timestamptz | |
| metadata | jsonb NOT NULL DEFAULT '{}' | |
| created_at / updated_at / deleted_at | | |

`user_profiles` — user_id uuid NOT NULL UQ FK→users CASCADE, bio text, gender gender, date_of_birth date, nationality_country_id/residence_country_id FK→countries SET NULL, education_level education_level, current_degree_id FK→degree_levels SET NULL, major_field_id FK→study_fields SET NULL, university_id FK→universities SET NULL, gpa numeric(4,2), gpa_scale numeric(3,1) DEFAULT 4.0, grade_type grade_type DEFAULT 'GPA_4', english_level english_level, target_degree_id FK→degree_levels SET NULL, target_country_id FK→countries SET NULL, preferred_majors text[], annual_budget numeric(12,2), budget_currency_id FK→currencies SET NULL, is_actively_searching bool DEFAULT true, is_public bool DEFAULT false, about text, timestamps.

`user_education` — user_id FK→users CASCADE, institution varchar(200) NOT NULL, degree_type degree_type NOT NULL, degree_level_id FK→degree_levels SET NULL, field_id FK→study_fields SET NULL, country_id FK→countries SET NULL, city_id FK→cities SET NULL, grade_type grade_type, gpa numeric(4,2), percentage numeric(5,2), start_date/end_date date, is_current bool DEFAULT false, description text, is_verified bool DEFAULT false, timestamps.

`user_achievements` — user_id FK CASCADE, title varchar(200) NOT NULL, description text, category varchar(80), issuer varchar(200), date_awarded date, url varchar(500), is_public bool DEFAULT true, timestamps.

`user_work_experience` — user_id FK CASCADE, company varchar(200) NOT NULL, role varchar(200) NOT NULL, description text, country_id/city_id FK SET NULL, start_date date NOT NULL, end_date date, is_current bool DEFAULT false, is_public bool DEFAULT true, timestamps.

`user_volunteer_experience` — user_id FK CASCADE, organization varchar(200) NOT NULL, role varchar(200), description text, country_id FK SET NULL, start_date date NOT NULL, end_date date, is_current bool DEFAULT false, is_public bool DEFAULT true, timestamps.

`user_research_experience` — user_id FK CASCADE, title varchar(200) NOT NULL, description text, institution varchar(200), field_id FK→study_fields SET NULL, start_date/end_date date, publications_url varchar(500), is_public bool DEFAULT true, timestamps.

`user_languages` — user_id FK CASCADE, language_id FK→languages CASCADE, proficiency_level proficiency_level DEFAULT 'INTERMEDIATE', cefr_level english_level, is_public bool DEFAULT true, created_at. UQ(user_id, language_id).

`user_test_scores` — user_id FK CASCADE, test_type test_type NOT NULL, score numeric(6,2), band varchar(20), test_date date, certificate_url varchar(500), is_verified bool DEFAULT false, verified_at, notes varchar(300), timestamps. UQ(user_id, test_type, test_date).

`user_finance` — user_id uuid NOT NULL UQ FK→users CASCADE, annual_income numeric(12,2), currency_id FK→currencies SET NULL, savings numeric(12,2), monthly_budget numeric(12,2), dependents smallint DEFAULT 0, needs_full_funding bool DEFAULT false, willing_to_consider_loans bool DEFAULT false, has_sponsor bool DEFAULT false, notes text, timestamps.

`user_preferences` — user_id uuid NOT NULL UQ FK→users CASCADE, target_country_ids uuid[] DEFAULT '{}', target_degree_ids uuid[] DEFAULT '{}', target_field_ids uuid[] DEFAULT '{}', minimum_funding_percent numeric(5,2) DEFAULT 100.00, open_to_relocation bool DEFAULT true, open_to_online bool DEFAULT false, willing_to_consider_loans bool DEFAULT false, is_public bool DEFAULT false, timestamps.

`user_settings` — user_id uuid NOT NULL UQ FK→users CASCADE, language varchar(10) DEFAULT 'ar', theme varchar(20) DEFAULT 'light', timezone varchar(64) DEFAULT 'UTC', email_notifications/push_notifications bool DEFAULT true, sms_notifications bool DEFAULT false, marketing_opt_in bool DEFAULT false, reminder_offset_days int DEFAULT 7, two_factor_enabled bool DEFAULT false, timestamps.

`user_documents` — user_id FK CASCADE, name varchar(200) NOT NULL, document_type document_type NOT NULL, file_url varchar(500) NOT NULL, file_type varchar(20), mime_type varchar(100), size_bytes bigint, version int DEFAULT 1, parent_document_id FK→user_documents SET NULL, status user_document_status DEFAULT 'UPLOADED', is_private bool DEFAULT true, timestamps, deleted_at.

`user_recommendation_letters` — user_id FK CASCADE, writer_name varchar(200) NOT NULL, writer_email varchar(320), writer_title varchar(200), institution varchar(200), relationship relation_type, letter_url varchar(500), status letter_status DEFAULT 'DRAFT', requested_at/reminded_at/submitted_at timestamptz, notes text, timestamps.

`user_essays` — user_id FK CASCADE, title varchar(300) NOT NULL, essay_type essay_type DEFAULT 'SCHOLARSHIP_ESSAY', prompt text, content text, word_count int, is_draft bool DEFAULT true, version int DEFAULT 1, timestamps, deleted_at.

### 6.7 Applications

`applications` — user_id FK→users CASCADE, scholarship_id FK→scholarships RESTRICT, cycle_id FK→scholarship_cycles SET NULL, status application_status DEFAULT 'DRAFT', progress numeric(5,2) DEFAULT 0, application_url varchar(500), submitted_at, withdrawn_at, notes text, timestamps, deleted_at. Partial UQ (user_id, scholarship_id) WHERE cycle_id IS NULL AND deleted_at IS NULL; partial UQ (user_id, scholarship_id, cycle_id) WHERE cycle_id IS NOT NULL AND deleted_at IS NULL.

`application_stages` — application_id FK→applications CASCADE, stage_type stage_type NOT NULL, name varchar(150) NOT NULL, name_ar, sort_order int DEFAULT 0, status stage_status DEFAULT 'PENDING', due_date date, completed_at, notes text, timestamps. UQ(application_id, stage_type).

`application_tasks` — application_id FK CASCADE, stage_id FK→application_stages SET NULL, task_type task_type DEFAULT 'OTHER', title varchar(250) NOT NULL, description text, status task_status DEFAULT 'PENDING', due_date date, reminder_sent_at, completed_at, notes text, timestamps.

`application_documents` — application_id FK CASCADE, stage_id FK→application_stages SET NULL, user_document_id FK→user_documents SET NULL, scholarship_document_id FK→scholarship_documents SET NULL, document_type document_type NOT NULL, name varchar(200), file_url varchar(500), status application_document_status DEFAULT 'REQUIRED', submitted_at, reviewed_at, feedback text, timestamps.

`saved_scholarships` — user_id FK CASCADE, scholarship_id FK CASCADE, notes text, created_at. UQ(user_id, scholarship_id).

`favorites` — user_id FK CASCADE, scholarship_id FK CASCADE, created_at. UQ(user_id, scholarship_id).

### 6.8 AI

`ai_chats` — user_id FK CASCADE, title varchar(200), context jsonb DEFAULT '{}', provider ai_provider, model varchar(100), message_count int DEFAULT 0, timestamps.

`ai_chat_messages` — chat_id FK→ai_chats CASCADE, role chat_role NOT NULL, content text NOT NULL, tokens_in/tokens_out int, provider ai_provider, model varchar(100), latency_ms int, created_at.

`ai_reviews` — user_id FK CASCADE, user_document_id FK→user_documents SET NULL, application_document_id FK→application_documents SET NULL, review_type ai_review_type NOT NULL, content text, score numeric(3,1), strengths/weaknesses/suggestions jsonb DEFAULT '[]', status ai_review_status DEFAULT 'QUEUED', provider ai_provider, model varchar(100), credits_used int DEFAULT 1, error text, timestamps.

`ai_reports` — user_id FK CASCADE, report_type ai_report_type NOT NULL, title varchar(300), summary text, content jsonb DEFAULT '{}', status ai_review_status DEFAULT 'QUEUED', provider ai_provider, model varchar(100), timestamps.

`acceptance_predictions` — user_id FK CASCADE, scholarship_id FK CASCADE, probability numeric(5,2) NOT NULL, fit_score numeric(5,2) NOT NULL, factors jsonb DEFAULT '{}', model_version varchar(50) NOT NULL, created_at. UQ(user_id, scholarship_id).

`ai_embeddings` — entity_type varchar(40) NOT NULL, entity_id uuid NOT NULL, content text NOT NULL, content_hash char(64) NOT NULL, embedding vector(1536) NOT NULL, provider ai_provider DEFAULT 'OPENAI', model varchar(100) NOT NULL, dimensions int DEFAULT 1536, timestamps. UQ(entity_type, entity_id).

`ai_matching_jobs` — user_id FK CASCADE, status ai_review_status DEFAULT 'QUEUED', score_threshold numeric(5,2) DEFAULT 60.00, matched_count int, result jsonb, provider ai_provider, model varchar(100), error text, started_at/finished_at, timestamps.

`search_history` — user_id FK→users CASCADE (nullable FK but NOT NULL col? make user_id uuid NOT NULL FK→users CASCADE), query text, filters jsonb DEFAULT '{}', results_count int, clicked_scholarship_id FK→scholarships SET NULL, clicked_at, created_at.

### 6.9 Notifications & email

`notifications` — user_id FK CASCADE, type notification_type NOT NULL, channel notification_channel DEFAULT 'IN_APP', title varchar(300) NOT NULL, body text, link varchar(500), data jsonb DEFAULT '{}', status notification_status DEFAULT 'PENDING', sent_at, read_at, created_at.

`emails` — user_id FK→users SET NULL, to_address varchar(320) NOT NULL, from_address varchar(320) NOT NULL, subject varchar(500) NOT NULL, template varchar(100), body_html text, body_text text, status email_status DEFAULT 'QUEUED', provider varchar(30), message_id varchar(200), error text, sent_at/delivered_at/opened_at/clicked_at, timestamps.

### 6.10 Payments

`payments` — user_id FK CASCADE, amount numeric(12,2) NOT NULL, currency_id FK→currencies SET NULL, method payment_method NOT NULL, provider_reference varchar(200), status payment_status DEFAULT 'PENDING', credits int DEFAULT 0, description varchar(300), reviewed_by FK→users SET NULL, reviewed_at, timestamps.

### 6.11 Operations (scraper / import / verify)

`sources` — name varchar(200) NOT NULL, base_url varchar(500), source_type import_source_type DEFAULT 'SCRAPER', country_id FK→countries SET NULL, provider_id FK→providers SET NULL, crawler_frequency varchar(30), last_scraped_at, is_active bool DEFAULT true, timestamps.

`import_batches` — source_id FK→sources SET NULL, source_type import_source_type NOT NULL, source_name varchar(200), source_url varchar(500), status import_status DEFAULT 'PENDING', total_items/succeeded/failed/skipped/duplicates_found int DEFAULT 0, error_summary text, created_by FK→users SET NULL, started_at/finished_at, timestamps.

`import_queue_items` — batch_id FK→import_batches CASCADE, source_url varchar(500), raw_payload jsonb DEFAULT '{}', extracted jsonb DEFAULT '{}', content_hash char(64), status queue_item_status DEFAULT 'PENDING', scholarship_id FK→scholarships SET NULL, error text, attempts int DEFAULT 0, processed_at, timestamps.

`scholarship_versions` — scholarship_id FK CASCADE, version int NOT NULL, snapshot jsonb NOT NULL, change_type change_type DEFAULT 'UPDATE', created_by FK→users SET NULL, created_at. UQ(scholarship_id, version).

`scholarship_change_logs` — scholarship_id FK CASCADE, field_name varchar(120) NOT NULL, old_value jsonb, new_value jsonb, change_type change_type DEFAULT 'UPDATE', changed_by FK→users SET NULL, created_at.

`duplicates` — scholarship_id FK CASCADE, duplicate_of_id FK CASCADE, similarity numeric(5,2) NOT NULL, method varchar(30) NOT NULL, status duplicate_status DEFAULT 'OPEN', resolved_at, resolved_by FK→users SET NULL, timestamps. UQ(scholarship_id, duplicate_of_id), CHECK (scholarship_id <> duplicate_of_id).

`verification_queue` — scholarship_id uuid NOT NULL UQ FK→scholarships CASCADE, reason varchar(500), priority verification_priority DEFAULT 'NORMAL', status verification_status DEFAULT 'PENDING', reviewer_id FK→users SET NULL, reviewed_at, review_notes text, timestamps.

### 6.12 Logs / analytics / audit

`audit_logs` — user_id FK→users SET NULL, entity_type varchar(80) NOT NULL, entity_id uuid NOT NULL, action audit_action NOT NULL, old_data jsonb, new_data jsonb, ip_address inet, user_agent varchar(500), created_at.

`activity_logs` — user_id FK→users SET NULL, activity_type activity_type NOT NULL, entity_type varchar(80), entity_id uuid, metadata jsonb DEFAULT '{}', ip_address inet, created_at.

`analytics_events` — user_id FK→users SET NULL, event_name varchar(120) NOT NULL, event_data jsonb DEFAULT '{}', url varchar(500), referrer varchar(500), session_id varchar(100), device varchar(50), browser varchar(50), os varchar(50), country_code varchar(2), created_at.

`daily_metrics` — metric_date date UQ NOT NULL, new_users/active_users/scholarships_added/applications_created/applications_submitted/matches_generated/ai_reviews_completed/searches/saved_count int DEFAULT 0, timestamps.

`cron_runs` — job_name varchar(120) NOT NULL, status cron_status, items_processed int DEFAULT 0, error text, started_at/finished_at, created_at.

### 6.13 Settings

`app_settings` — key varchar(120) UQ NOT NULL, value jsonb NOT NULL, description varchar(300), updated_by FK→users SET NULL, timestamps.

## 7. Functions (`006_functions.sql`)

| Function | Returns | Purpose |
|---|---|---|
| `set_updated_at()` | trigger | sets `updated_at = now()` |
| `slugify(text)` | text | slug from text (lowercase, non-alnum → `-`) |
| `unique_slug(text, text)` | text | slugify + make unique against `slug` in given table (tbl arg is regclass) |
| `current_user_id()` | uuid | `auth.uid()` — stable wrapper |
| `is_admin()` | bool | SECURITY DEFINER — role in (ADMIN, SUPER_ADMIN) |
| `is_moderator()` | bool | SECURITY DEFINER — ADMIN, SUPER_ADMIN, COUNSELOR |
| `current_user_role()` | user_role | SECURITY DEFINER |
| `user_owns(uuid)` | bool | `current_user_id() = $1 OR is_admin()` |
| `sync_scholarship_dates(uuid)` | void | recompute scholarship display dates from its cycles |
| `update_application_progress(uuid)` | void | progress = % completed stages; sets submitted_at on SUBMITTED |
| `create_scholarship_version(uuid, change_type, uuid)` | void | snapshot row into `scholarship_versions` |
| `record_activity(uuid, activity_type, text, uuid, jsonb)` | void | SECURITY DEFINER insert into `activity_logs` |
| `record_analytics_event(varchar, jsonb, varchar, varchar, varchar, varchar, varchar, varchar, varchar)` | void | SECURITY DEFINER insert into `analytics_events` |
| `create_notification(uuid, notification_type, varchar, text, varchar, jsonb)` | void | SECURITY DEFINER insert into `notifications` |
| `soft_delete(text, uuid)` | void | SECURITY DEFINER; allowlist of tables; sets deleted_at |
| `merge_scholarships(uuid, uuid)` | void | admin merge: repoint refs, version, archive `p_remove_id` |
| `refresh_daily_metrics(date)` | void | populate `daily_metrics` for a date from `analytics_events` |

## 8. Triggers (`007_triggers.sql`)

| Trigger | Table(s) | When | Action |
|---|---|---|---|
| `trg_set_updated_at` | all tables with `updated_at` | BEFORE UPDATE | `set_updated_at()` |
| `trg_slug_<tbl>` | universities, providers, countries, cities, blogs, events | BEFORE INSERT | generate `unique_slug(name/title, tbl)` when slug empty |
| `trg_slug_scholarships` | scholarships | BEFORE INSERT | slug from title |
| `trg_users_defaults` | users | AFTER INSERT | create user_settings, user_preferences, user_finance |
| `trg_cycle_single_current` | scholarship_cycles | BEFORE INSERT/UPDATE | reset others `is_current=false` when new row is current |
| `trg_cycle_sync_dates` | scholarship_cycles | AFTER INSERT/UPDATE/DELETE | `sync_scholarship_dates()` on parent |
| `trg_scholarship_counter_saves` | saved_scholarships | AFTER INSERT/DELETE | bump `save_count` |
| `trg_scholarship_counter_favs` | favorites | AFTER INSERT/DELETE | bump `favorite_count` |
| `trg_scholarship_counter_apps` | applications | AFTER INSERT/DELETE | bump `application_count` |
| `trg_scholarship_counter_reviews` | scholarship_reviews | AFTER INSERT/DELETE | bump `review_count` |
| `trg_scholarship_view` | analytics_events | AFTER INSERT | bump `view_count` when `event_name='scholarship_view'` and `event_data->>'scholarship_id'` present |
| `trg_event_attendee_count` | event_attendees | AFTER INSERT/DELETE | bump `events.attendee_count` |
| `trg_application_progress` | application_stages | AFTER INSERT/UPDATE/DELETE | `update_application_progress(application_id)` |
| `trg_application_submitted` | applications | AFTER UPDATE OF status | set `submitted_at` when SUBMITTED |
| `trg_scholarship_version` | scholarships | AFTER UPDATE OF title, description, provider_id, country_id, university_id, funding_type, opening_date, closing_date, verification_status, status | `create_scholarship_version()` + field diff into `scholarship_change_logs` |
| `trg_verification_enqueue` | scholarships | AFTER INSERT | enqueue `verification_queue` when `verification_status='UNVERIFIED'` |
| `trg_verification_resolve` | scholarships | AFTER UPDATE OF verification_status | mark `verification_queue` resolved when VERIFIED/REJECTED |
| `trg_audit` | users, universities, providers, applications | AFTER INSERT/UPDATE/DELETE | insert into `audit_logs` (skip no-op updates) |

## 9. Views (`008_views.sql`)

| View | Purpose |
|---|---|
| `v_countries` | country + continent + currency names |
| `v_cities` | city + country names |
| `v_universities` | university + country/city + campus_count |
| `v_providers` | provider + country name |
| `v_scholarships` | **full read model**: all scholarship cols + provider/university/country/currency names + degrees[] + fields[] + eligible_countries[] + languages[] + benefits jsonb + benefit flags (has_housing, has_insurance, has_flights, has_stipend) + current cycle dates + test requirements jsonb + required documents jsonb |
| `v_scholarship_search` | flattened, filter-ready (fields arrays, eligible arrays, funding, deadlines, tests) |
| `v_scholarships_open` | `closing_date >= CURRENT_DATE` or `next_deadline IS NOT NULL`, status ACTIVE |
| `v_scholarships_featured` | featured, active, verified |
| `v_scholarships_fully_funded` | is_fully_funded |
| `v_scholarships_no_ielts` | no mandatory IELTS |
| `v_user_profiles` | profile + education/languages/scores/finance as jsonb aggregates |
| `v_applications` | application + scholarship + cycle + stage/task counts + next due date |
| `v_upcoming_deadlines` | users × saved/applied scholarship next_deadline within reminder window (for cron) |
| `v_embeddings_pending` | scholarships needing embedding |
| `v_import_queue` | queue items + batch + status counts |
| `v_verification_queue` | queue + scholarship title/status |
| `v_duplicates_pending` | open duplicate pairs |
| `v_analytics_daily` | daily event counts |
| `v_funnel` | signup→onboard→save→apply→submit |

All views filter `deleted_at IS NULL`.

## 10. RLS (`009_rls.sql`)

Enable RLS on every table. Policy matrix (write = INSERT/UPDATE/DELETE):

| Table group | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| dimension/lookup (continents, countries, cities, currencies, languages, degree_levels, study_fields) | anon + authenticated | admin | admin | admin |
| content (universities, campuses, providers, departments, scholarships + scholarship_* tables, sources) | anon + authenticated | admin | admin | admin |
| blogs | anon (published), auth (all) | admin | admin | admin |
| events | anon + auth | admin | admin | admin |
| scholarship_reviews | anon + auth | owner | owner or admin | owner or admin |
| users | self or admin | self (id=auth.uid()) | self or admin | admin |
| user_profiles, user_education, user_achievements, user_work_experience, user_volunteer_experience, user_research_experience, user_languages, user_test_scores, user_finance, user_preferences, user_settings, user_documents, user_recommendation_letters, user_essays, saved_scholarships, favorites | owner or admin | owner | owner or admin | owner or admin |
| applications, application_stages, application_tasks, application_documents | owner or admin (counselor: SELECT) | owner | owner or admin | owner or admin |
| ai_chats, ai_chat_messages, ai_reviews, ai_reports, acceptance_predictions, ai_matching_jobs, search_history | owner or admin | owner | owner or admin | owner or admin |
| notifications | owner (SELECT, UPDATE read_at) | server (service_role) | owner (read_at only) | admin |
| emails | owner or admin | server | admin | admin |
| payments | owner (SELECT) or admin | server | admin | admin |
| import_batches, import_queue_items, scholarship_versions, scholarship_change_logs, duplicates, verification_queue, audit_logs, activity_logs, analytics_events, daily_metrics, cron_runs, app_settings | admin | admin/authenticated (analytics_events) | admin | admin |

Security-definer helper functions `is_admin()`, `is_moderator()`, `current_user_id()`, `user_owns(uuid)` power the policies. Service role bypasses RLS for server workflows.

## 11. Storage (`011_storage.sql`)

| Bucket | Public | Use |
|---|---|---|
| `student-documents` | no | CVs, essays, letters, transcripts (private) |
| `scholarship-assets` | yes | gallery, news images |
| `scholarship-pdfs` | yes | official PDF brochures |
| `logos` | yes | university/provider logos |
| `avatars` | yes | user avatars |

`student-documents` policies: owner upload/read/update/delete via `(storage.foldername(name))[1]::uuid = auth.uid()` OR admin. Public buckets: `anon` read; writes restricted by authenticated/admin rules.

## 12. Search (`012_search.sql`)

- Generated `search_vector` column on `scholarships` (`simple` config, title=weight A, description=weight B).
- GIN index on `search_vector`.
- GIN trigram indexes: `scholarships.title`, `scholarships.title_ar`, `scholarships.slug`, `universities.name`, `universities.name_ar`, `providers.name`.
- Function `search_scholarships(query text, p_limit int, p_offset int)` — ranked `ts_rank` search with trigram fallback (`%query%`).
- Filter-flag views in `008` cover country/university/provider/major/degree/funding/deadline/nationality/housing/insurance/flights/open/featured/no-ielts/fully-funded.

## 13. Embeddings (`013_embeddings.sql`)

- `ai_embeddings.embedding vector(1536)`.
- HNSW index `hnsw_embedding_cosine` (`USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)`).
- `upsert_embedding(text, uuid, text, vector, ai_provider, text)` function.
- `vector_search_scholarships(vector(1536), int)` — top-k by cosine.
- `similar_scholarships(uuid, int)` — embeddings + shared field/country/degree overlap.

## 14. Analytics (`014_analytics.sql`)

- `analytics_events` append-only; indexes on `(created_at)`, `(event_name, created_at)`, `(user_id)`.
- `v_analytics_daily`, `v_funnel`.
- `refresh_daily_metrics(date)` for the `daily_metrics` rollup; run via cron.

## 15. Imports & verification (`015_imports.sql`)

- `import_dedupe(uuid)` — pg_trgm title similarity > 0.85 → create `duplicates` row, return existing id.
- `process_import_item(uuid)` — hash → dedupe → upsert scholarship → version → enqueue verification.
- `merge_scholarships(uuid, uuid)` — repoint FKs, archive, version, resolve duplicates.

## 16. Permissions (`016_permissions.sql`)

- `REVOKE ALL ON ALL TABLES … FROM PUBLIC, anon, authenticated`, then explicit grants:
  - `anon`: SELECT on dimension + public content tables, EXECUTE on public search/view functions.
  - `authenticated`: anon + CRUD on own-row tables (RLS is the row filter), EXECUTE on helper functions.
  - `service_role`: all (bypasses RLS).
- Column grants: no sensitive columns exposed beyond owners (emails body, user_documents file_url) — enforced by RLS, not column grants (documented).

## 17. Prisma mapping

- `prisma/schema.prisma` mirrors every table 1:1 (`@@map` to table, `@map` to column).
- Prisma enums named exactly as PG enum types; values identical.
- `Unsupported("vector(1536)")` for embeddings; `Unsupported("tsvector")` for the generated search vector.
- **DDL is SQL-owned.** Never `prisma migrate` against a SQL-created schema; use `prisma db pull` to resync the client, or keep this mirror in sync and use `prisma generate` only.

## 18. Scaling notes

- Partition candidates when >50M rows: `analytics_events`, `audit_logs`, `activity_logs`, `emails` by month.
- Counters are trigger-maintained to avoid `COUNT(*)`.
- `v_scholarships` is the app's read model; promote to a matview if 100k+ scholarships × heavy filters.
- Embedding search is HNSW; batch backfill with `scripts/generateEmbeddings.ts`.
- Cache hot lists (featured, top countries) in Vercel/Redis; invalidate on import completion.
