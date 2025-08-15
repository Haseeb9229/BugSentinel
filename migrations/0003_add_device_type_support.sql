-- Migration: Add device type support for mobile/desktop scanning
-- Date: 2025-01-05

-- Add device_type column to bugs table
ALTER TABLE bugs ADD COLUMN device_type TEXT DEFAULT 'desktop';

-- Add device_type column to scans table  
ALTER TABLE scans ADD COLUMN device_type TEXT DEFAULT 'desktop';

-- Add device_type column to performance_metrics table
ALTER TABLE performance_metrics ADD COLUMN device_type TEXT DEFAULT 'desktop';

-- Create indexes for better query performance when filtering by device type
CREATE INDEX idx_bugs_device_type ON bugs(device_type);
CREATE INDEX idx_scans_device_type ON scans(device_type);
CREATE INDEX idx_performance_metrics_device_type ON performance_metrics(device_type);

-- Create composite indexes for common queries
CREATE INDEX idx_bugs_store_device ON bugs(store_id, device_type);
CREATE INDEX idx_scans_store_device ON scans(store_id, device_type);
CREATE INDEX idx_performance_metrics_store_device ON performance_metrics(store_id, device_type); 