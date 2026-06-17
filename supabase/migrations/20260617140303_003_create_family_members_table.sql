-- Create family_members table for role-based access
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Enable RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members (owner/admin check uses the same table, so we simplify)
CREATE POLICY "select_own_family_members" ON family_members FOR SELECT
  TO authenticated USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Insert policy - allow if joining own family
CREATE POLICY "insert_family_members_first" ON family_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin operations - simplified for now
CREATE POLICY "update_family_members_admin" ON family_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "delete_family_members_self" ON family_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

-- Now add the select policy for families that references family_members
CREATE POLICY "select_family_members" ON families FOR SELECT
  TO authenticated USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
