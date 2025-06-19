-- Create device_targeting table for admin panel device-specific configurations
CREATE TABLE device_targeting (
  id SERIAL PRIMARY KEY,
  device VARCHAR(50) NOT NULL,
  country VARCHAR(10) NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ad_url TEXT,
  cpm DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate device/country combinations
ALTER TABLE device_targeting 
ADD CONSTRAINT unique_device_country UNIQUE (device, country);

-- Create indexes for better performance
CREATE INDEX idx_device_targeting_device ON device_targeting(device);
CREATE INDEX idx_device_targeting_country ON device_targeting(country);
CREATE INDEX idx_device_targeting_task_id ON device_targeting(task_id);

-- Add comments for documentation
COMMENT ON TABLE device_targeting IS 'Device and country-specific task targeting configurations';
COMMENT ON COLUMN device_targeting.device IS 'Target device: Windows, MacOS, Android, iOS';
COMMENT ON COLUMN device_targeting.country IS 'Country code (US, GB, etc.)';
COMMENT ON COLUMN device_targeting.task_id IS 'Specific task to show for this device/country combination';
COMMENT ON COLUMN device_targeting.ad_url IS 'Device/country-specific ad URL override';
COMMENT ON COLUMN device_targeting.cpm IS 'Device/country-specific CPM rate override';

-- Example data (optional - replace UUIDs with actual task IDs from your tasks table)
-- INSERT INTO device_targeting (device, country, task_id, ad_url, cpm) VALUES
-- ('Windows', 'US', 'your-task-uuid-here', 'https://ads.example.com/windows-us', 4.50),
-- ('iOS', 'US', 'your-task-uuid-here', 'https://ads.example.com/ios-us', 3.80),
-- ('Android', 'IN', 'your-task-uuid-here', 'https://ads.example.com/android-in', 1.20); 