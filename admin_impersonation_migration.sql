-- Admin Impersonation System Migration
-- This creates the necessary tables for secure admin user impersonation

-- Create admin_impersonation_sessions table
CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
    id SERIAL PRIMARY KEY,
    admin_user_id VARCHAR(255) NOT NULL, -- Clerk user ID of the admin
    target_user_id VARCHAR(255) NOT NULL, -- Clerk user ID of the target user
    impersonation_token VARCHAR(255) UNIQUE NOT NULL, -- Secure token for the session
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'ended', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table if it doesn't exist (for audit trail)
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id VARCHAR(255) NOT NULL, -- Clerk user ID of the admin
    action VARCHAR(255) NOT NULL, -- Action performed (e.g., 'user_impersonation_started')
    target_user_id VARCHAR(255), -- Clerk user ID of affected user (optional)
    details JSONB, -- Additional details about the action
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET, -- Admin's IP address (optional)
    user_agent TEXT, -- Admin's user agent (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin_user_id ON admin_impersonation_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_target_user_id ON admin_impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token ON admin_impersonation_sessions(impersonation_token);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_status ON admin_impersonation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_expires_at ON admin_impersonation_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON admin_logs(target_user_id);

-- Create a function to automatically expire old sessions
CREATE OR REPLACE FUNCTION expire_old_impersonation_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE admin_impersonation_sessions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE admin_impersonation_sessions IS 'Tracks admin user impersonation sessions for security and auditing';
COMMENT ON TABLE admin_logs IS 'Audit trail for all admin actions including impersonation';

COMMENT ON COLUMN admin_impersonation_sessions.admin_user_id IS 'Clerk user ID of the admin performing the impersonation';
COMMENT ON COLUMN admin_impersonation_sessions.target_user_id IS 'Clerk user ID of the user being impersonated';
COMMENT ON COLUMN admin_impersonation_sessions.impersonation_token IS 'Unique token used to identify and validate the impersonation session';
COMMENT ON COLUMN admin_impersonation_sessions.status IS 'Session status: active, ended, or expired';

-- Insert initial test data (optional - remove in production)
-- INSERT INTO admin_logs (admin_user_id, action, details, timestamp) 
-- VALUES ('admin_test_id', 'impersonation_system_initialized', '{"version": "1.0", "features": ["secure_tokens", "audit_trail", "auto_expiry"]}', NOW());

-- Grant necessary permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE ON admin_impersonation_sessions TO your_app_user;
-- GRANT SELECT, INSERT ON admin_logs TO your_app_user; 