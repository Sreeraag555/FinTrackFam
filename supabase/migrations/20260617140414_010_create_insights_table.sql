-- Create insights table (for AI-generated insights)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for insights
CREATE POLICY "select_insights" ON insights FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_insights" ON insights FOR INSERT
  TO authenticated WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_insights_family_id ON insights(family_id);
CREATE INDEX idx_insights_priority ON insights(priority DESC);
