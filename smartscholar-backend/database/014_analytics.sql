-- =============================================================================
-- 014_analytics.sql — Analytics helpers for SmartScholar
-- Generated from docs/DATABASE.md §14. Run after 001–013.
-- Append-only analytics_events + daily_metrics rollup (function in 006).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- track_event — server-side event recorder (service_role / security definer)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION track_event(
  p_event_name varchar,
  p_event_data jsonb DEFAULT '{}',
  p_user_id uuid DEFAULT NULL,
  p_url varchar DEFAULT NULL,
  p_referrer varchar DEFAULT NULL,
  p_session_id varchar DEFAULT NULL,
  p_device varchar DEFAULT NULL,
  p_browser varchar DEFAULT NULL,
  p_os varchar DEFAULT NULL,
  p_country_code varchar DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO analytics_events (
    user_id, event_name, event_data, url, referrer, session_id, device, browser, os, country_code
  )
  VALUES (
    coalesce(p_user_id, auth.uid()), p_event_name, p_event_data,
    p_url, p_referrer, p_session_id, p_device, p_browser, p_os, p_country_code
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- refresh_metrics_range — backfill daily_metrics for a date range
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_metrics_range(
  p_from date,
  p_to date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  d date;
BEGIN
  FOR d IN SELECT generate_series(p_from, p_to, '1 day') LOOP
    PERFORM refresh_daily_metrics(d);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- Rollup convenience view: weekly aggregates for admin dashboards
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_analytics_weekly AS
SELECT
  date_trunc('week', created_at)::date AS week_start,
  count(*) AS events,
  count(DISTINCT user_id) AS active_users,
  count(*) FILTER (WHERE event_name = 'page_view') AS page_views,
  count(*) FILTER (WHERE event_name = 'scholarship_view') AS scholarship_views,
  count(*) FILTER (WHERE event_name = 'search') AS searches,
  count(*) FILTER (WHERE event_name = 'save') AS saves,
  count(*) FILTER (WHERE event_name = 'apply') AS applies
FROM analytics_events
GROUP BY 1
ORDER BY 1 DESC;
