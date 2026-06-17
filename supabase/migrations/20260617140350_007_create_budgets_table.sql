-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  spent DECIMAL(12, 2) DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for budgets
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT
  TO authenticated USING (created_by = auth.uid());

CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE
  TO authenticated USING (created_by = auth.uid());

CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- Create indexes
CREATE INDEX idx_budgets_family_id ON budgets(family_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
