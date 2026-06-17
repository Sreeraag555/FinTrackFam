-- Create families table without dependent policies
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text), 1, 8)),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Create basic policies for families (no cross-table references)
CREATE POLICY "insert_families" ON families FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "update_family_creator" ON families FOR UPDATE
  TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "delete_family_creator" ON families FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Create index for invite code lookups
CREATE INDEX idx_families_invite_code ON families(invite_code);
