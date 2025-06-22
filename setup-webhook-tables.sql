-- Create conversions table to store webhook postback data
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  publisher_id TEXT NOT NULL,
  sub_id TEXT NOT NULL,
  payout DECIMAL(10, 4) DEFAULT 0,
  conversion_ip TEXT,
  status TEXT DEFAULT 'approved',
  offer_id TEXT,
  transaction_id TEXT,
  raw_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate conversions
  UNIQUE(task_id, sub_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversions_task_id ON conversions(task_id);
CREATE INDEX IF NOT EXISTS idx_conversions_publisher_id ON conversions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_conversions_sub_id ON conversions(sub_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- Add source column to revenue_events to track webhook vs regular revenue
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'task_complete';
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS conversion_id UUID REFERENCES conversions(id);

-- Add webhook_token column to tasks for easy URL generation
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;

COMMENT ON TABLE conversions IS 'Stores conversion data from advertiser webhooks/postbacks';
COMMENT ON COLUMN conversions.sub_id IS 'Unique identifier from advertiser (click ID, transaction ID, etc)';
COMMENT ON COLUMN conversions.raw_params IS 'All parameters sent by the advertiser in the webhook call'; 