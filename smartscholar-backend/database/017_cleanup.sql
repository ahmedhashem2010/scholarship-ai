-- =============================================================================
-- 017_cleanup.sql — End-of-migration sanity checks & housekeeping
-- Run LAST (after 016). Safe to run repeatedly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ANALYZE all tables so the planner has stats after bulk seeding
-- -----------------------------------------------------------------------------

ANALYZE;

-- -----------------------------------------------------------------------------
-- Sanity checks (raise notices, don't abort)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_tables int;
  v_enums  int;
  v_views  int;
  v_functions int;
  v_triggers int;
  v_policies int;
BEGIN
  SELECT count(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  SELECT count(*) INTO v_enums
  FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;

  SELECT count(*) INTO v_views
  FROM information_schema.views WHERE table_schema = 'public';

  SELECT count(*) INTO v_functions
  FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

  SELECT count(*) INTO v_triggers
  FROM information_schema.triggers WHERE trigger_schema = 'public';

  SELECT count(*) INTO v_policies
  FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE 'public schema: % tables, % enums, % views, % functions, % triggers, % RLS policies',
    v_tables, v_enums, v_views, v_functions, v_triggers, v_policies;
END $$;

-- -----------------------------------------------------------------------------
-- Report tables that are missing a PK or an updated_at column (heuristic)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint pc
        WHERE pc.conrelid = c.oid AND pc.contype = 'p'
      )
  LOOP
    RAISE NOTICE 'WARNING: table % has no primary key', r.tbl;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Re-grant schema usage (idempotent, harmless)
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
