-- Add source column to device_targeting table
ALTER TABLE device_targeting 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Update existing records to 'manual' if they don't have a source
UPDATE device_targeting 
SET source = 'manual' 
WHERE source IS NULL;

  -- Create index for better performance
  CREATE INDEX IF NOT EXISTS idx_device_targeting_source ON device_targeting(source);
  
  -- Verify the column was added (optional - remove this line if it causes issues)
  SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'device_targeting' AND column_name = 'source'; 