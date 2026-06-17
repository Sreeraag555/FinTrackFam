import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/types/database'

const mockTransactions = [
  { id: '1', type: 'expense', amount: 125.5, description: 'Grocery shopping', date: '2024-01-15', category: { name: 'Food & Dining', color: '#f97316' } },
  { id: '2', type: 'income', amount: 4200, description: 'Monthly salary', date: '2024-01-14', category: { name: 'Salary', color: '#22c55e' } },
  { id: '3', type: 'expense', amount: 85, description: 'Gas station', date: '2024-01-14', category: { name: 'Transportation', color: '#eab308' } },
  { id: '4', type: 'expense', amount: 45.99, description: 'Netflix subscription', date: '2024-01-13', category: { name: 'Entertainment', color: '#8b5cf6' } },
  { id: '5', type: 'expense', amount: 220, description: 'Restaurant dinner', date: '2024-01-12', category: { name: 'Food & Dining', color: '#f97316' } },
  { id: '6', type: 'income', amount: 850, description: 'Freelance project', date: '2024-01-11', category: { name: 'Freelance', color: '#14b8a6' } },
  { id: '7', type: 'expense', amount: 150, description: 'Doctor visit', date: '2024-01-10', category: { name: 'Healthcare', color: '#06b6d4' } },
  { id: '8', type: 'expense', amount: 75, description: 'Books', date: '2024-01-09', category: { name: 'Education', color: '#3b82f6' } },
]

export function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .order('date', { ascending: false })
      .limit(100)

    if (data && data.length > 0) {
      setTransactions(data)
    }
  }

  const filteredTransactions = transactions.length > 0 ? transactions.filter((tx) => {
    const txType = (tx as Transaction & { type: 'income' | 'expense' }).type
    const matchesType = typeFilter === 'all' || txType === typeFilter
    const matchesSearch = (tx as Transaction & { description?: string }).description
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()) || false
    return matchesType && matchesSearch
  }) : mockTransactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground mt-1">View and manage all your transactions</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expense">
            <ArrowDownRight className="w-4 h-4 mr-1" />
            Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredTransactions.map((tx, index) => {
              const txType = (tx as Transaction & { type: 'income' | 'expense' }).type
              const txAmount = (tx as Transaction & { amount: number }).amount
              const txDescription = (tx as Transaction & { description?: string }).description || 'Transaction'
              const txDate = (tx as Transaction & { date: string }).date
              const txCategory = (tx as Transaction & { categories?: { name: string; color: string } }).categories

              return (
                <motion.div
                  key={(tx as { id: string }).id || index}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer glass-card"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${txCategory?.color || '#3b82f6'}20`,
                    }}
                  >
                    <Receipt className="w-5 h-5" style={{ color: txCategory?.color || '#3b82f6' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{txDescription}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{txCategory?.name || 'Uncategorized'}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(txDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${txType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {txType === 'income' ? '+' : '-'}{formatCurrency(txAmount)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </TabsContent>

        <TabsContent value="income">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredTransactions
              .filter((tx) => (tx as { type: string }).type === 'income')
              .map((tx, index) => {
                const txAmount = (tx as { amount: number }).amount
                const txDescription = (tx as { description?: string }).description || 'Transaction'
                const txDate = (tx as { date: string }).date
                const txCategory = (tx as { categories?: { name: string; color: string } }).categories

                return (
                  <motion.div
                    key={(tx as { id: string }).id || `income-${index}`}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer glass-card"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{txDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        {txCategory?.name || 'Income'} • {new Date(txDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">+{formatCurrency(txAmount)}</p>
                    </div>
                  </motion.div>
                )
              })}
          </motion.div>
        </TabsContent>

        <TabsContent value="expense">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredTransactions
              .filter((tx) => (tx as { type: string }).type === 'expense')
              .map((tx, index) => {
                const txAmount = (tx as { amount: number }).amount
                const txDescription = (tx as { description?: string }).description || 'Transaction'
                const txDate = (tx as { date: string }).date
                const txCategory = (tx as { categories?: { name: string; color: string } }).categories

                return (
                  <motion.div
                    key={(tx as { id: string }).id || `expense-${index}`}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer glass-card"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{txDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        {txCategory?.name || 'Expense'} • {new Date(txDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">-{formatCurrency(txAmount)}</p>
                    </div>
                  </motion.div>
                )
              })}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
