-- Migration: Add impact analysis columns to performance_metrics table
-- Date: 2025-08-12

-- Add new columns for impact analysis and prioritization
ALTER TABLE performance_metrics 
ADD COLUMN IF NOT EXISTS impact_analysis JSONB,
ADD COLUMN IF NOT EXISTS priority_scores JSONB,
ADD COLUMN IF NOT EXISTS estimated_fix_time JSONB,
ADD COLUMN IF NOT EXISTS business_impact JSONB;

-- Add comments for documentation
COMMENT ON COLUMN performance_metrics.impact_analysis IS 'User experience, business, SEO, conversion impact analysis';
COMMENT ON COLUMN performance_metrics.priority_scores IS 'Array of priority scores with effort estimates';
COMMENT ON COLUMN performance_metrics.estimated_fix_time IS 'Estimated time to fix by priority level';
COMMENT ON COLUMN performance_metrics.business_impact IS 'SEO score, user engagement, conversion rate impact';
