-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'family')),
  balance DECIMAL(12, 2) DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for accounts
CREATE POLICY "select_own_accounts" ON accounts FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "insert_own_accounts" ON accounts FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update_own_accounts" ON accounts FOR UPDATE
  TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "delete_own_accounts" ON accounts FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- Create indexes
CREATE INDEX idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX idx_accounts_family_id ON accounts(family_id);
