import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Wallet,
  Calendar,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Budget } from '@/types/database'

const mockBudgets = [
  { id: '1', name: 'Groceries', amount: 500, spent: 420, category: { name: 'Food & Dining', color: '#f97316' }, period: 'monthly', end_date: '2024-01-31' },
  { id: '2', name: 'Entertainment', amount: 200, spent: 180, category: { name: 'Entertainment', color: '#8b5cf6' }, period: 'monthly', end_date: '2024-01-31' },
  { id: '3', name: 'Transportation', amount: 150, spent: 95, category: { name: 'Transportation', color: '#eab308' }, period: 'monthly', end_date: '2024-01-31' },
  { id: '4', name: 'Shopping', amount: 300, spent: 315, category: { name: 'Shopping', color: '#ec4899' }, period: 'monthly', end_date: '2024-01-31' },
  { id: '5', name: 'Bills', amount: 450, spent: 380, category: { name: 'Bills & Utilities', color: '#ef4444' }, period: 'monthly', end_date: '2024-01-31' },
]

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'monthly',
  })
  const { toast } = useToast()
  const profile = JSON.parse(localStorage.getItem('selectedProfile') || '{}')

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setBudgets(data)
    }
  }

  const handleCreateBudget = async () => {
    if (!formData.name || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    const startDate = new Date()
    let endDate = new Date()

    switch (formData.period) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7)
        break
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1)
        break
      case 'quarterly':
        endDate.setMonth(startDate.getMonth() + 3)
        break
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1)
        break
    }

    const { error } = await supabase.from('budgets').insert({
      name: formData.name,
      amount: parseFloat(formData.amount),
      spent: 0,
      period: formData.period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      family_id: profile.family_id,
      created_by: profile.user_id,
    })

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create budget',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Budget created',
        description: 'Your budget has been created successfully',
        variant: 'success',
      })
      setShowCreateDialog(false)
      setFormData({ name: '', amount: '', category: '', period: 'monthly' })
      fetchBudgets()
    }
  }

  const handleDeleteBudget = async (id: string) => {
    await supabase.from('budgets').delete().eq('id', id)
    fetchBudgets()
    toast({
      title: 'Budget deleted',
      description: 'Budget has been removed',
    })
  }

  const displayBudgets = budgets.length > 0 ? budgets : mockBudgets

  const totalBudget = displayBudgets.reduce((sum, b) => sum + ((b as { amount: number }).amount || 0), 0)
  const totalSpent = displayBudgets.reduce((sum, b) => sum + ((b as { spent: number }).spent || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">Manage your spending limits</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Budget
        </Button>
      </div>

      {/* Overview Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalBudget - totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget Usage</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{formatPercentage((totalSpent / totalBudget) * 100)}</p>
                {totalSpent / totalBudget > 0.9 && (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Progress value={(totalSpent / totalBudget) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayBudgets.map((budget, index) => {
          const b = budget as { id: string; name: string; amount: number; spent: number; period: string; category?: { name: string; color: string }; end_date?: string }
          const percentage = (b.spent / b.amount) * 100
          const isOver = percentage >= 100
          const isWarning = percentage >= 80 && percentage < 100

          return (
            <motion.div
              key={b.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card hover:glow-sm transition-all">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${b.category?.color || '#3b82f6'}20`,
                      }}
                    >
                      <Wallet className="w-5 h-5" style={{ color: b.category?.color || '#3b82f6' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{b.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{b.period}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBudget(b.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-semibold ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : ''}`}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-2"
                      indicatorClassName={isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'}
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {formatPercentage(Math.min(percentage, 100))} used
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {b.end_date ? new Date(b.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {isOver && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        Budget exceeded
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}

        {/* Add Budget Card */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: displayBudgets.length * 0.1 }}
          onClick={() => setShowCreateDialog(true)}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer bg-white/5"
        >
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <span className="text-lg font-medium text-muted-foreground">Add Budget</span>
        </motion.button>
      </div>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName">Budget Name</Label>
              <Input
                id="budgetName"
                placeholder="e.g., Groceries"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Amount</Label>
              <Input
                id="budgetAmount"
                type="number"
                placeholder="500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetPeriod">Period</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateBudget} className="flex-1">
                Create Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
