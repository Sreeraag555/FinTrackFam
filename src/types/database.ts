export type MemberRole = 'owner' | 'admin' | 'member'

export type AccountType = 'personal' | 'family'

export type TransactionType = 'income' | 'expense'

export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type ActivityType =
  | 'transaction_created'
  | 'transaction_updated'
  | 'budget_created'
  | 'budget_updated'
  | 'goal_created'
  | 'goal_updated'
  | 'goal_contribution'
  | 'member_joined'
  | 'member_role_changed'
  | 'account_created'
  | 'settings_updated'

export interface Profile {
  id: string
  user_id: string
  family_id: string | null
  display_name: string
  avatar_url: string | null
  avatar_color: string
  pin: string | null
  created_at: string
  updated_at: string
}

export interface Family {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  owner_id: string
  family_id: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  family_id: string | null
  created_at: string
}

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category_id: string
  account_id: string
  date: string
  description: string
  created_by: string
  family_id: string
  created_at: string
  updated_at: string
  recurring_id: string | null
}

export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  category_id: string | null
  period: BudgetPeriod
  start_date: string
  end_date: string
  family_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  family_id: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  family_id: string
  user_id: string
  type: ActivityType
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface HealthScoreMetrics {
  budgetAdherence: number
  savingsRate: number
  debtRatio: number
  emergencyFund: number
}

export interface Insight {
  id: string
  type: string
  title: string
  description: string
  data: Record<string, unknown>
  priority: number
  family_id: string
  created_at: string
}
