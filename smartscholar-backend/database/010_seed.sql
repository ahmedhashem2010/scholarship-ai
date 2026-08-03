-- =============================================================================
-- 010_seed.sql — Reference & dimension seed data for SmartScholar
-- Run after 001–009. Idempotent (ON CONFLICT DO NOTHING keyed on natural keys).
-- Application data (scholarships, users) is seeded by scripts/seed.ts instead.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Continents
-- -----------------------------------------------------------------------------

INSERT INTO continents (code, name, name_ar, slug, sort_order) VALUES
  ('AF', 'Africa', 'أفريقيا', 'africa', 1),
  ('AS', 'Asia', 'آسيا', 'asia', 2),
  ('EU', 'Europe', 'أوروبا', 'europe', 3),
  ('NA', 'North America', 'أمريكا الشمالية', 'north-america', 4),
  ('SA', 'South America', 'أمريكا الجنوبية', 'south-america', 5),
  ('OC', 'Oceania', 'أوقيانوسيا', 'oceania', 6),
  ('AN', 'Antarctica', 'أنتاركتيكا', 'antarctica', 7)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Currencies (ISO 4217)
-- -----------------------------------------------------------------------------

INSERT INTO currencies (code, name, name_ar, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', 'دولار أمريكي', '$', 2),
  ('EUR', 'Euro', 'يورو', '€', 2),
  ('GBP', 'British Pound', 'جنيه إسترليني', '£', 2),
  ('EGP', 'Egyptian Pound', 'جنيه مصري', 'E£', 2),
  ('SAR', 'Saudi Riyal', 'ريال سعودي', '﷼', 2),
  ('AED', 'UAE Dirham', 'درهم إماراتي', 'AED', 2),
  ('QAR', 'Qatari Riyal', 'ريال قطري', '﷼', 2),
  ('KWD', 'Kuwaiti Dinar', 'دينار كويتي', 'KD', 3),
  ('BHD', 'Bahraini Dinar', 'دينار بحريني', 'BD', 3),
  ('OMR', 'Omani Rial', 'ريال عماني', 'OMR', 3),
  ('JOD', 'Jordanian Dinar', 'دينار أردني', 'JD', 3),
  ('LBP', 'Lebanese Pound', 'ليرة لبنانية', 'L£', 2),
  ('MAD', 'Moroccan Dirham', 'درهم مغربي', 'MAD', 2),
  ('DZD', 'Algerian Dinar', 'دينار جزائري', 'DA', 2),
  ('TND', 'Tunisian Dinar', 'دينار تونسي', 'DT', 3),
  ('LYD', 'Libyan Dinar', 'دينار ليبي', 'LD', 3),
  ('SDG', 'Sudanese Pound', 'جنيه سوداني', 'SDG', 2),
  ('IQD', 'Iraqi Dinar', 'دينار عراقي', 'IQD', 3),
  ('SYP', 'Syrian Pound', 'ليرة سورية', 'S£', 2),
  ('YER', 'Yemeni Rial', 'ريال يمني', 'YR', 2),
  ('TRY', 'Turkish Lira', 'ليرة تركية', '₺', 2),
  ('CNY', 'Chinese Yuan', 'يوان صيني', '¥', 2),
  ('JPY', 'Japanese Yen', 'ين ياباني', '¥', 0),
  ('INR', 'Indian Rupee', 'روبية هندية', '₹', 2),
  ('AUD', 'Australian Dollar', 'دولار أسترالي', 'A$', 2),
  ('CAD', 'Canadian Dollar', 'دولار كندي', 'C$', 2),
  ('CHF', 'Swiss Franc', 'فرنك سويسري', 'CHF', 2),
  ('SEK', 'Swedish Krona', 'كرونة سويدية', 'kr', 2),
  ('NOK', 'Norwegian Krone', 'كرونة نرويجية', 'kr', 2),
  ('DKK', 'Danish Krone', 'كرونة دنماركية', 'kr', 2)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Languages
-- -----------------------------------------------------------------------------

INSERT INTO languages (code, name, name_ar, native_name) VALUES
  ('ar', 'Arabic', 'العربية', 'العربية'),
  ('en', 'English', 'الإنجليزية', 'English'),
  ('fr', 'French', 'الفرنسية', 'Français'),
  ('de', 'German', 'الألمانية', 'Deutsch'),
  ('es', 'Spanish', 'الإسبانية', 'Español'),
  ('tr', 'Turkish', 'التركية', 'Türkçe'),
  ('it', 'Italian', 'الإيطالية', 'Italiano'),
  ('pt', 'Portuguese', 'البرتغالية', 'Português'),
  ('zh', 'Chinese', 'الصينية', '中文'),
  ('ja', 'Japanese', 'اليابانية', '日本語'),
  ('ko', 'Korean', 'الكورية', '한국어'),
  ('ru', 'Russian', 'الروسية', 'Русский'),
  ('nl', 'Dutch', 'الهولندية', 'Nederlands'),
  ('sv', 'Swedish', 'السويدية', 'Svenska'),
  ('cs', 'Czech', 'التشيكية', 'Čeština'),
  ('pl', 'Polish', 'البولندية', 'Polski'),
  ('hi', 'Hindi', 'الهندية', 'हिन्दी'),
  ('ur', 'Urdu', 'الأردية', 'اردو'),
  ('fa', 'Persian', 'الفارسية', 'فارسی'),
  ('he', 'Hebrew', 'العبرية', 'עברית'),
  ('el', 'Greek', 'اليونانية', 'Ελληνικά'),
  ('hu', 'Hungarian', 'المجرية', 'Magyar')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Degree levels
-- -----------------------------------------------------------------------------

INSERT INTO degree_levels (name, name_ar, slug, sort_order) VALUES
  ('High School', 'الثانوية العامة', 'high-school', 1),
  ('Diploma', 'دبلوم', 'diploma', 2),
  ('Associate Degree', 'درجة الزمالة', 'associate-degree', 3),
  ("Bachelor's Degree", 'درجة البكالوريوس', 'bachelors-degree', 4),
  ("Master's Degree", 'درجة الماجستير', 'masters-degree', 5),
  ('Doctorate / PhD', 'درجة الدكتوراه', 'doctorate-phd', 6),
  ('Language Course', 'دورة لغة', 'language-course', 7),
  ('Certificate', 'شهادة', 'certificate', 8),
  ('Exchange Program', 'برنامج تبادل', 'exchange-program', 9),
  ('Summer School', 'مدرسة صيفية', 'summer-school', 10)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Study fields (top-level categories)
-- -----------------------------------------------------------------------------

INSERT INTO study_fields (name, name_ar, slug, sort_order) VALUES
  ('Computer Science & IT', 'علوم الحاسب وتقنية المعلومات', 'computer-science-it', 1),
  ('Engineering', 'الهندسة', 'engineering', 2),
  ('Business & Management', 'إدارة الأعمال', 'business-management', 3),
  ('Medicine & Health', 'الطب والعلوم الصحية', 'medicine-health', 4),
  ('Natural Sciences', 'العلوم الطبيعية', 'natural-sciences', 5),
  ('Social Sciences', 'العلوم الاجتماعية', 'social-sciences', 6),
  ('Humanities', 'العلوم الإنسانية', 'humanities', 7),
  ('Arts & Design', 'الفنون والتصميم', 'arts-design', 8),
  ('Law', 'القانون', 'law', 9),
  ('Education', 'التربية والتعليم', 'education', 10),
  ('Economics & Finance', 'الاقتصاد والتمويل', 'economics-finance', 11),
  ('Data Science & AI', 'علوم البيانات والذكاء الاصطناعي', 'data-science-ai', 12),
  ('Architecture & Urban Planning', 'العمارة والتخطيط العمراني', 'architecture-urban-planning', 13),
  ('Agriculture & Food Science', 'الزراعة وعلوم الغذاء', 'agriculture-food-science', 14),
  ('Media & Communication', 'الإعلام والاتصال', 'media-communication', 15),
  ('Psychology', 'علم النفس', 'psychology', 16),
  ('Pharmacy', 'الصيدلة', 'pharmacy', 17),
  ('Dentistry', 'طب الأسنان', 'dentistry', 18),
  ('Veterinary Medicine', 'الطب البيطري', 'veterinary-medicine', 19),
  ('Nursing', 'التمريض', 'nursing', 20)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Countries — Arab/MENA + major study destinations
-- (continent_id resolved via continents.code)
-- -----------------------------------------------------------------------------

INSERT INTO countries (code, code3, name, name_ar, slug, phone_code, continent_id, is_active) VALUES
  -- MENA
  ('EG', 'EGY', 'Egypt', 'مصر', 'egypt', '+20',   (SELECT id FROM continents WHERE code = 'AF'), true),
  ('SA', 'SAU', 'Saudi Arabia', 'السعودية', 'saudi-arabia', '+966', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('AE', 'ARE', 'United Arab Emirates', 'الإمارات', 'united-arab-emirates', '+971', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('QA', 'QAT', 'Qatar', 'قطر', 'qatar', '+974',   (SELECT id FROM continents WHERE code = 'AS'), true),
  ('KW', 'KWT', 'Kuwait', 'الكويت', 'kuwait', '+965', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('BH', 'BHR', 'Bahrain', 'البحرين', 'bahrain', '+973', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('OM', 'OMN', 'Oman', 'عمان', 'oman', '+968',    (SELECT id FROM continents WHERE code = 'AS'), true),
  ('JO', 'JOR', 'Jordan', 'الأردن', 'jordan', '+962', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('LB', 'LBN', 'Lebanon', 'لبنان', 'lebanon', '+961', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('IQ', 'IRQ', 'Iraq', 'العراق', 'iraq', '+964',  (SELECT id FROM continents WHERE code = 'AS'), true),
  ('SY', 'SYR', 'Syria', 'سوريا', 'syria', '+963', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('YE', 'YEM', 'Yemen', 'اليمن', 'yemen', '+967', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('PS', 'PSE', 'Palestine', 'فلسطين', 'palestine', '+970', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('MA', 'MAR', 'Morocco', 'المغرب', 'morocco', '+212', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('DZ', 'DZA', 'Algeria', 'الجزائر', 'algeria', '+213', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('TN', 'TUN', 'Tunisia', 'تونس', 'tunisia', '+216', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('LY', 'LBY', 'Libya', 'ليبيا', 'libya', '+218', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('SD', 'SDN', 'Sudan', 'السودان', 'sudan', '+249', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('SO', 'SOM', 'Somalia', 'الصومال', 'somalia', '+252', (SELECT id FROM continents WHERE code = 'AF'), true),
  ('MR', 'MRT', 'Mauritania', 'موريتانيا', 'mauritania', '+222', (SELECT id FROM continents WHERE code = 'AF'), true),
  -- Turkey & Iran
  ('TR', 'TUR', 'Turkey', 'تركيا', 'turkey', '+90', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('IR', 'IRN', 'Iran', 'إيران', 'iran', '+98', (SELECT id FROM continents WHERE code = 'AS'), true),
  -- Study destinations
  ('US', 'USA', 'United States', 'الولايات المتحدة', 'united-states', '+1', (SELECT id FROM continents WHERE code = 'NA'), true),
  ('CA', 'CAN', 'Canada', 'كندا', 'canada', '+1', (SELECT id FROM continents WHERE code = 'NA'), true),
  ('MX', 'MEX', 'Mexico', 'المكسيك', 'mexico', '+52', (SELECT id FROM continents WHERE code = 'NA'), true),
  ('GB', 'GBR', 'United Kingdom', 'المملكة المتحدة', 'united-kingdom', '+44', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('DE', 'DEU', 'Germany', 'ألمانيا', 'germany', '+49', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('FR', 'FRA', 'France', 'فرنسا', 'france', '+33', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('NL', 'NLD', 'Netherlands', 'هولندا', 'netherlands', '+31', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('SE', 'SWE', 'Sweden', 'السويد', 'sweden', '+46', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('NO', 'NOR', 'Norway', 'النرويج', 'norway', '+47', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('DK', 'DNK', 'Denmark', 'الدنمارك', 'denmark', '+45', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('FI', 'FIN', 'Finland', 'فنلندا', 'finland', '+358', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('IE', 'IRL', 'Ireland', 'أيرلندا', 'ireland', '+353', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('IT', 'ITA', 'Italy', 'إيطاليا', 'italy', '+39', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('ES', 'ESP', 'Spain', 'إسبانيا', 'spain', '+34', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('PT', 'PRT', 'Portugal', 'البرتغال', 'portugal', '+351', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('AT', 'AUT', 'Austria', 'النمسا', 'austria', '+43', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('CH', 'CHE', 'Switzerland', 'سويسرا', 'switzerland', '+41', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('BE', 'BEL', 'Belgium', 'بلجيكا', 'belgium', '+32', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('PL', 'POL', 'Poland', 'بولندا', 'poland', '+48', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('CZ', 'CZE', 'Czech Republic', 'التشيك', 'czech-republic', '+420', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('HU', 'HUN', 'Hungary', 'المجر', 'hungary', '+36', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('GR', 'GRC', 'Greece', 'اليونان', 'greece', '+30', (SELECT id FROM continents WHERE code = 'EU'), true),
  ('CN', 'CHN', 'China', 'الصين', 'china', '+86', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('JP', 'JPN', 'Japan', 'اليابان', 'japan', '+81', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('KR', 'KOR', 'South Korea', 'كوريا الجنوبية', 'south-korea', '+82', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('SG', 'SGP', 'Singapore', 'سنغافورة', 'singapore', '+65', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('MY', 'MYS', 'Malaysia', 'ماليزيا', 'malaysia', '+60', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('IN', 'IND', 'India', 'الهند', 'india', '+91', (SELECT id FROM continents WHERE code = 'AS'), true),
  ('AU', 'AUS', 'Australia', 'أستراليا', 'australia', '+61', (SELECT id FROM continents WHERE code = 'OC'), true),
  ('NZ', 'NZL', 'New Zealand', 'نيوزيلندا', 'new-zealand', '+64', (SELECT id FROM continents WHERE code = 'OC'), true),
  ('RU', 'RUS', 'Russia', 'روسيا', 'russia', '+7', (SELECT id FROM continents WHERE code = 'EU'), true)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- App settings
-- -----------------------------------------------------------------------------

INSERT INTO app_settings (key, value, description) VALUES
  ('site.name', '"SmartScholar"', 'Product name'),
  ('site.domain', '"smartscholar.org"', 'Canonical domain'),
  ('site.locale_default', '"ar"', 'Default locale'),
  ('ai.default_provider', '"GROQ"', 'Primary AI provider'),
  ('ai.fallback_chain', '["GEMINI","BAZAARLINK","AGENTROUTER"]', 'AI provider fallback order'),
  ('embeddings.model', '"text-embedding-3-small"', 'Embedding model'),
  ('embeddings.dimensions', '1536', 'Embedding dimensions'),
  ('matching.score_threshold', '60', 'Default fit-score threshold'),
  ('search.duplicate_title_similarity', '0.85', 'Title similarity threshold for duplicate detection'),
  ('reminders.default_offset_days', '7', 'Default deadline reminder window')
ON CONFLICT (key) DO NOTHING;
