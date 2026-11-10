-- Migration: 009_add_component_scores_to_grades.sql
-- Description: Adds component_scores JSONB to public.grades for CBSE component breakdowns (Theory, Practical, Viva)

ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS component_scores JSONB DEFAULT NULL;

