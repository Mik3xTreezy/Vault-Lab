-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id TEXT NOT NULL, -- User who made the referral
  referred_id TEXT NOT NULL, -- User who was referred
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, inactive
  commission_rate DECIMAL(5,2) DEFAULT 5.00, -- 5% commission rate
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(referrer_id, referred_id)
);

-- Create referral_commissions table for tracking individual commissions
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  revenue_event_id INTEGER REFERENCES revenue_events(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  locker_id UUID,
  task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_referral_earnings DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_commission_rate DECIMAL(5,2) DEFAULT 10.00; -- Custom referral rate per user (10% default)

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referral_id ON referral_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code from first part of email + random string
    code := UPPER(SUBSTRING(SPLIT_PART(user_email, '@', 1) FROM 1 FOR 3)) || 
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL AND NEW.email IS NOT NULL THEN
    NEW.referral_code := generate_referral_code(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_referral_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();

-- Update existing users to have referral codes
UPDATE users 
SET referral_code = generate_referral_code(email) 
WHERE referral_code IS NULL AND email IS NOT NULL;

-- SQL functions for atomic balance updates
-- Drop existing functions first to avoid parameter conflicts
DROP FUNCTION IF EXISTS increment_user_balance(TEXT, DECIMAL);
DROP FUNCTION IF EXISTS increment_referral_earnings(UUID, DECIMAL);

CREATE FUNCTION increment_user_balance(user_id TEXT, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET balance = COALESCE(balance, 0) + amount,
      total_referral_earnings = CASE 
        WHEN users.id = increment_user_balance.user_id 
        THEN COALESCE(total_referral_earnings, 0) + amount 
        ELSE total_referral_earnings 
      END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION increment_referral_earnings(referral_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE referrals 
  SET total_earned = COALESCE(total_earned, 0) + amount,
      last_activity_at = NOW()
  WHERE id = referral_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE referral_commissions IS 'Individual commission payments from referrals';
COMMENT ON COLUMN referrals.commission_rate IS 'Commission percentage (5.00 = 5%)';
COMMENT ON COLUMN referrals.status IS 'pending: not yet active, active: earning commissions, inactive: stopped earning'; 