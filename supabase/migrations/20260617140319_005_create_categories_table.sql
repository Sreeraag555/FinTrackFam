-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create default system categories (null family_id = global categories)
INSERT INTO categories (name, type, icon, color, family_id) VALUES
  ('Salary', 'income', 'briefcase', '#22c55e', NULL),
  ('Freelance', 'income', 'laptop', '#14b8a6', NULL),
  ('Investments', 'income', 'trending-up', '#3b82f6', NULL),
  ('Other Income', 'income', 'plus-circle', '#8b5cf6', NULL),
  ('Food & Dining', 'expense', 'utensils', '#f97316', NULL),
  ('Transportation', 'expense', 'car', '#eab308', NULL),
  ('Shopping', 'expense', 'shopping-bag', '#ec4899', NULL),
  ('Entertainment', 'expense', 'film', '#8b5cf6', NULL),
  ('Bills & Utilities', 'expense', 'receipt', '#ef4444', NULL),
  ('Healthcare', 'expense', 'heart', '#06b6d4', NULL),
  ('Education', 'expense', 'graduation-cap', '#3b82f6', NULL),
  ('Travel', 'expense', 'plane', '#14b8a6', NULL),
  ('Other Expenses', 'expense', 'more-horizontal', '#6b7280', NULL);

-- Create policies for categories (simplified to avoid recursion)
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_family_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (family_id IS NOT NULL);

CREATE POLICY "update_family_categories" ON categories FOR UPDATE
  TO authenticated USING (family_id IS NOT NULL);

CREATE POLICY "delete_family_categories" ON categories FOR DELETE
  TO authenticated USING (family_id IS NOT NULL);

-- Create indexes
CREATE INDEX idx_categories_family_id ON categories(family_id);
CREATE INDEX idx_categories_type ON categories(type);
