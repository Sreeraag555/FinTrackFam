import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { formatCurrency, calculateHealthScore, getHealthScoreLabel } from '@/lib/utils'
import type { Transaction, Budget, SavingsGoal, ActivityLog } from '@/types/database'

interface DashboardMetrics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  budgetAdherence: number
  lastMonthIncome: number
  lastMonthExpenses: number
}

export function DashboardPage() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    budgetAdherence: 100,
    lastMonthIncome: 0,
    lastMonthExpenses: 0,
  })
  const [healthScore, setHealthScore] = useState(0)
  const profile = JSON.parse(localStorage.getItem('selectedProfile') || '{}')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
        fetchBudgets(),
        fetchGoals(),
        fetchActivityLogs(),
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')

    if (data) {
      const totalBalance = data.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      setMetrics(prev => ({ ...prev, totalBalance }))
    }
  }

  const fetchTransactions = async () => {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch recent transactions for display
    const { data: recentData } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .order('date', { ascending: false })
      .limit(5)

    if (recentData) setRecentTransactions(recentData)

    // Fetch current month transactions for metrics
    const { data: currentMonthData } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('date', currentMonthStart.toISOString().split('T')[0])
      .lte('date', currentMonthEnd.toISOString().split('T')[0])

    // Fetch last month transactions for comparison
    const { data: lastMonthData } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('date', lastMonthStart.toISOString().split('T')[0])
      .lte('date', lastMonthEnd.toISOString().split('T')[0])

    let monthlyIncome = 0
    let monthlyExpenses = 0
    let lastMonthIncome = 0
    let lastMonthExpenses = 0

    if (currentMonthData) {
      currentMonthData.forEach(tx => {
        if (tx.type === 'income') monthlyIncome += tx.amount
        else monthlyExpenses += tx.amount
      })
    }

    if (lastMonthData) {
      lastMonthData.forEach(tx => {
        if (tx.type === 'income') lastMonthIncome += tx.amount
        else lastMonthExpenses += tx.amount
      })
    }

    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0

    setMetrics(prev => ({
      ...prev,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      lastMonthIncome,
      lastMonthExpenses,
    }))
  }

  const fetchBudgets = async () => {
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .limit(3)

    if (data) {
      setBudgets(data)

      // Calculate budget adherence
      if (data.length > 0) {
        const totalSpent = data.reduce((sum, b) => sum + (b.spent || 0), 0)
        const totalBudget = data.reduce((sum, b) => sum + (b.amount || 0), 0)
        const adherence = totalBudget > 0 ? Math.max(0, 100 - (totalSpent / totalBudget) * 100) : 100
        setMetrics(prev => ({ ...prev, budgetAdherence: Math.min(adherence, 100) }))
      }
    }
  }

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .limit(3)

    if (data) setGoals(data)
  }

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setActivityLogs(data)
  }

  // Calculate health score when metrics change
  useEffect(() => {
    const score = calculateHealthScore({
      budgetAdherence: metrics.budgetAdherence,
      savingsRate: metrics.savingsRate,
      debtRatio: 20, // Default assumption
      emergencyFund: metrics.monthlyExpenses > 0
        ? Math.min(metrics.totalBalance / metrics.monthlyExpenses, 6)
        : 0,
    })
    setHealthScore(score)
  }, [metrics])

  const { label: healthLabel, color: healthColor } = getHealthScoreLabel(healthScore)

  // Calculate percentage changes
  const incomeChange = metrics.lastMonthIncome > 0
    ? ((metrics.monthlyIncome - metrics.lastMonthIncome) / metrics.lastMonthIncome) * 100
    : 0
  const expenseChange = metrics.lastMonthExpenses > 0
    ? ((metrics.monthlyExpenses - metrics.lastMonthExpenses) / metrics.lastMonthExpenses) * 100
    : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{profile.display_name || 'there'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's your family's financial overview</p>
        </div>
        <Button asChild>
          <Link to="/transactions/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalBalance)}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {incomeChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(incomeChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyExpenses)}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${expenseChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {expenseChange <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(expenseChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        {/* Health Score Card */}
        <Card className="glass-card glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Family Health Score</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(healthScore / 100) * 176} 176`}
                    className={healthColor.replace('text-', 'text-')}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{healthScore}</span>
                </div>
              </div>
              <div>
                <p className={`font-semibold ${healthColor}`}>{healthLabel}</p>
                <p className="text-xs text-muted-foreground">Financial wellness</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/history">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/transactions/new">Add your first transaction</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.description || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">
                          {(tx as Transaction & { categories?: { name: string } }).categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Budget Progress */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Budget Progress</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/budgets">Manage</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No budgets set up</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/budgets">Create a budget</Link>
                    </Button>
                  </div>
                ) : (
                  budgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100
                    const isOverBudget = percentage >= 100
                    const isNearLimit = percentage >= 80 && percentage < 100

                    return (
                      <div key={budget.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{budget.name}</span>
                          <span className={isOverBudget ? 'text-red-400' : 'text-muted-foreground'}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-2"
                          indicatorClassName={isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-emerald-500'}
                        />
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Savings Goals */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Savings Goals</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/goals">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No savings goals</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/goals">Create a goal</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.slice(0, 2).map((goal) => {
                      const percentage = (goal.current_amount / goal.target_amount) * 100
                      const isComplete = percentage >= 100

                      return (
                        <div key={goal.id} className="p-4 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
                              <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{goal.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                              </p>
                            </div>
                          </div>
                          <Progress
                            value={Math.min(percentage, 100)}
                            className="h-2"
                            indicatorClassName={isComplete ? 'bg-emerald-500' : 'bg-primary'}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Log */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p className="text-white">{log.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
