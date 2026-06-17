-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'transaction_created',
    'transaction_updated',
    'budget_created',
    'budget_updated',
    'goal_created',
    'goal_updated',
    'goal_contribution',
    'member_joined',
    'member_role_changed',
    'account_created',
    'settings_updated'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for activity_logs
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "insert_own_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_activity_logs_family_id ON activity_logs(family_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
