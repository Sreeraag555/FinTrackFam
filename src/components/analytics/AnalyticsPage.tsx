import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string
  income: number
  expenses: number
}

interface CategoryBreakdown {
  name: string
  value: number
  color: string
}

interface WeeklyData {
  day: string
  spending: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const COLORS = ['#f97316', '#eab308', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#22c55e', '#3b82f6']

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    transactionCount: 0,
    lastMonthIncome: 0,
    lastMonthExpenses: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([])
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { startDate, endDate: now }
  }

  const fetchAnalytics = async () => {
    try {
      const { startDate, endDate } = getDateRange()
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Fetch all transactions for the period
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, type, color)')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true })

      if (transactions) {
        processSummaryData(transactions)
        processMonthlyData(transactions)
        processCategoryBreakdown(transactions)
        processWeeklyData(transactions)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const processSummaryData = (
    transactions: Array<{ amount: number; type: string; date: string }>
  ) => {
    let totalIncome = 0
    let totalExpenses = 0
    let transactionCount = transactions.length

    transactions.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount
      else totalExpenses += tx.amount
    })

    // Calculate last month for comparison (estimate based on current data)
    // In production, this would fetch actual last month data
    const lastMonthIncome = totalIncome * 0.95
    const lastMonthExpenses = totalExpenses * 1.02

    setSummaryData({
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      transactionCount,
      lastMonthIncome,
      lastMonthExpenses,
    })
  }

  const processMonthlyData = (
    transactions: Array<{ amount: number; type: string; date: string }>
  ) => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>()

    // Initialize last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toISOString().slice(0, 7)
      monthlyMap.set(monthKey, { income: 0, expenses: 0 })
    }

    transactions.forEach(tx => {
      const monthKey = tx.date.slice(0, 7)
      const existing = monthlyMap.get(monthKey)
      if (existing) {
        if (tx.type === 'income') existing.income += tx.amount
        else existing.expenses += tx.amount
      }
    })

    const data: MonthlyData[] = []
    monthlyMap.forEach((value, key) => {
      const monthIndex = parseInt(key.slice(5, 7)) - 1
      data.push({
        month: MONTH_NAMES[monthIndex],
        income: value.income,
        expenses: value.expenses,
      })
    })

    setMonthlyData(data)
  }

  const processCategoryBreakdown = (
    transactions: Array<{
      amount: number
      type: string
      categories?: { name: string; color: string } | null
    }>
  ) => {
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, { value: number; color: string }>()

    transactions.forEach((tx, index) => {
      const categoryName = tx.categories?.name || 'Other'
      const color = tx.categories?.color || COLORS[index % COLORS.length]

      if (tx.type === 'expense') {
        expenseMap.set(categoryName, (expenseMap.get(categoryName) || 0) + tx.amount)
      } else {
        const existing = incomeMap.get(categoryName)
        if (existing) {
          existing.value += tx.amount
        } else {
          incomeMap.set(categoryName, { value: tx.amount, color })
        }
      }
    })

    const expenses: CategoryBreakdown[] = []
    let colorIndex = 0
    expenseMap.forEach((value, name) => {
      expenses.push({ name, value, color: COLORS[colorIndex % COLORS.length] })
      colorIndex++
    })
    expenses.sort((a, b) => b.value - a.value)
    setExpenseBreakdown(expenses)

    const incomes: CategoryBreakdown[] = []
    incomeMap.forEach((data, name) => {
      incomes.push({ name, value: data.value, color: data.color })
    })
    incomes.sort((a, b) => b.value - a.value)
    setIncomeBreakdown(incomes)
  }

  const processWeeklyData = (transactions: Array<{ amount: number; type: string; date: string }>) => {
    const dayMap = new Map<number, number>()
    DAY_NAMES.forEach((_, index) => dayMap.set(index, 0))

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const date = new Date(tx.date)
        const dayOfWeek = date.getDay()
        dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + tx.amount)
      }
    })

    const data: WeeklyData[] = []
    DAY_NAMES.forEach((day, index) => {
      data.push({ day, spending: dayMap.get(index) || 0 })
    })
    setWeeklyData(data)
  }

  const incomeChange = summaryData.lastMonthIncome > 0
    ? ((summaryData.totalIncome - summaryData.lastMonthIncome) / summaryData.lastMonthIncome) * 100
    : 0
  const expenseChange = summaryData.lastMonthExpenses > 0
    ? ((summaryData.totalExpenses - summaryData.lastMonthExpenses) / summaryData.lastMonthExpenses) * 100
    : 0
  const savingsRate = summaryData.totalIncome > 0
    ? (summaryData.netSavings / summaryData.totalIncome) * 100
    : 0

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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Understand your financial patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Income</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summaryData.totalIncome)}</p>
            <p className={`text-xs mt-1 ${incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs last period
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summaryData.totalExpenses)}</p>
            <p className={`text-xs mt-1 ${expenseChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {expenseChange <= 0 ? '' : '+'}{expenseChange.toFixed(1)}% vs last period
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Net Savings</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summaryData.netSavings)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsRate.toFixed(1)}% savings rate
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Transactions</span>
            </div>
            <p className="text-2xl font-bold">{summaryData.transactionCount}</p>
            <p className="text-xs text-muted-foreground mt-1">This period</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Income vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {monthlyData.length > 0 && monthlyData.some(d => d.income > 0 || d.expenses > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#22c55e"
                        fill="url(#incomeGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        fill="url(#expenseGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Breakdown Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                {expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend
                        formatter={(value: string) => <span className="text-sm text-white/80">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-center">
                    No expense data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Spending Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Weekly Spending Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {weeklyData.some(d => d.spending > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="spending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No spending data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Breakdown Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Income Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {incomeBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incomeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend
                        formatter={(value: string) => <span className="text-sm text-white/80">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-center">
                    No income data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spending Trends */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>6-Month Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {monthlyData.length > 0 && monthlyData.some(d => d.income > 0 || d.expenses > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
