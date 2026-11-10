-- Migration 018: Add unique constraint on source_circular_id for marketplace press releases
-- This enables ON CONFLICT upsert when school admins publish circulars to the marketplace newsroom.
-- Run this BEFORE deploying Phase 2 backend changes.

ALTER TABLE public.marketplace_press_releases
  ADD CONSTRAINT uq_press_source_circular UNIQUE (source_circular_id);

-- Also add a school settings / marketplace profile editor endpoint support:
-- marketplace_school_profiles already has a unique (tenant_id) from the original migration.
-- No additional columns needed for Phase 2.

SELECT 'Migration 018 applied successfully' AS status;

