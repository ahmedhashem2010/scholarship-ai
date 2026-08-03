DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_minimum_age_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_minimum_age_range CHECK (minimum_age IS NULL OR (minimum_age >= 0 AND minimum_age <= 120));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_maximum_age_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_maximum_age_range CHECK (maximum_age IS NULL OR (maximum_age >= 0 AND maximum_age <= 120));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_min_max_age_order') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_min_max_age_order CHECK (minimum_age IS NULL OR maximum_age IS NULL OR minimum_age <= maximum_age);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_minimum_gpa_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_minimum_gpa_range CHECK (minimum_gpa IS NULL OR (minimum_gpa >= 0 AND minimum_gpa <= 5));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_gpa_scale_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_gpa_scale_range CHECK (gpa_scale >= 0 AND gpa_scale <= 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_minimum_percentage_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_minimum_percentage_range CHECK (minimum_percentage IS NULL OR (minimum_percentage >= 0 AND minimum_percentage <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_difficulty_score_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_difficulty_score_range CHECK (difficulty_score IS NULL OR (difficulty_score >= 1 AND difficulty_score <= 10));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_acceptance_rate_range') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_acceptance_rate_range CHECK (acceptance_rate IS NULL OR (acceptance_rate >= 0 AND acceptance_rate <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarships_application_fee_non_negative') THEN
    ALTER TABLE scholarships ADD CONSTRAINT chk_scholarships_application_fee_non_negative CHECK (application_fee IS NULL OR application_fee >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarship_reviews_rating_range') THEN
    ALTER TABLE scholarship_reviews ADD CONSTRAINT chk_scholarship_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_duplicates_similarity_range') THEN
    ALTER TABLE duplicates ADD CONSTRAINT chk_duplicates_similarity_range CHECK (similarity >= 0 AND similarity <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarship_similarities_similarity_score_range') THEN
    ALTER TABLE scholarship_similarities ADD CONSTRAINT chk_scholarship_similarities_similarity_score_range CHECK (similarity_score >= 0 AND similarity_score <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_acceptance_predictions_probability_range') THEN
    ALTER TABLE acceptance_predictions ADD CONSTRAINT chk_acceptance_predictions_probability_range CHECK (probability >= 0 AND probability <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_acceptance_predictions_fit_score_range') THEN
    ALTER TABLE acceptance_predictions ADD CONSTRAINT chk_acceptance_predictions_fit_score_range CHECK (fit_score >= 0 AND fit_score <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_reviews_score_range') THEN
    ALTER TABLE ai_reviews ADD CONSTRAINT chk_ai_reviews_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 10));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_profiles_annual_budget_non_negative') THEN
    ALTER TABLE user_profiles ADD CONSTRAINT chk_user_profiles_annual_budget_non_negative CHECK (annual_budget IS NULL OR annual_budget >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_finance_annual_income_non_negative') THEN
    ALTER TABLE user_finance ADD CONSTRAINT chk_user_finance_annual_income_non_negative CHECK (annual_income IS NULL OR annual_income >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_finance_savings_non_negative') THEN
    ALTER TABLE user_finance ADD CONSTRAINT chk_user_finance_savings_non_negative CHECK (savings IS NULL OR savings >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_finance_monthly_budget_non_negative') THEN
    ALTER TABLE user_finance ADD CONSTRAINT chk_user_finance_monthly_budget_non_negative CHECK (monthly_budget IS NULL OR monthly_budget >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_finance_dependents_non_negative') THEN
    ALTER TABLE user_finance ADD CONSTRAINT chk_user_finance_dependents_non_negative CHECK (dependents >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_amount_non_negative') THEN
    ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_credits_non_negative') THEN
    ALTER TABLE payments ADD CONSTRAINT chk_payments_credits_non_negative CHECK (credits >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarship_benefits_amount_non_negative') THEN
    ALTER TABLE scholarship_benefits ADD CONSTRAINT chk_scholarship_benefits_amount_non_negative CHECK (amount IS NULL OR amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_continents_code_length') THEN
    ALTER TABLE continents ADD CONSTRAINT chk_continents_code_length CHECK (char_length(code) = 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_countries_code_length') THEN
    ALTER TABLE countries ADD CONSTRAINT chk_countries_code_length CHECK (char_length(code) = 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_countries_code3_length') THEN
    ALTER TABLE countries ADD CONSTRAINT chk_countries_code3_length CHECK (code3 IS NULL OR char_length(code3) = 3);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_currencies_code_length') THEN
    ALTER TABLE currencies ADD CONSTRAINT chk_currencies_code_length CHECK (char_length(code) = 3);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarship_cycles_dates_order') THEN
    ALTER TABLE scholarship_cycles ADD CONSTRAINT chk_scholarship_cycles_dates_order CHECK (closing_date IS NULL OR opening_date IS NULL OR closing_date >= opening_date);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_duplicates_not_self') THEN
    ALTER TABLE duplicates ADD CONSTRAINT chk_duplicates_not_self CHECK (scholarship_id <> duplicate_of_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scholarship_similarities_not_self') THEN
    ALTER TABLE scholarship_similarities ADD CONSTRAINT chk_scholarship_similarities_not_self CHECK (scholarship_id <> similar_scholarship_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_referred_by_not_self') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_referred_by_not_self CHECK (referred_by IS NULL OR referred_by <> id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_emails_to_address_format') THEN
    ALTER TABLE emails ADD CONSTRAINT chk_emails_to_address_format CHECK (to_address ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_emails_from_address_format') THEN
    ALTER TABLE emails ADD CONSTRAINT chk_emails_from_address_format CHECK (from_address ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_universities_established_year_range') THEN
    ALTER TABLE universities ADD CONSTRAINT chk_universities_established_year_range CHECK (established_year IS NULL OR (established_year >= 1000 AND established_year <= 3000));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_universities_ranking_world_non_negative') THEN
    ALTER TABLE universities ADD CONSTRAINT chk_universities_ranking_world_non_negative CHECK (ranking_world IS NULL OR ranking_world >= 0);
  END IF;
END $$;
