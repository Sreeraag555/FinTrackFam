import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

const defaultCategories = [
  { id: 'salary', name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#14b8a6' },
  { id: 'investments', name: 'Investments', type: 'income', icon: 'trending-up', color: '#3b82f6' },
  { id: 'other_income', name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#8b5cf6' },
  { id: 'food', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#f97316' },
  { id: 'transport', name: 'Transportation', type: 'expense', icon: 'car', color: '#eab308' },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: 'film', color: '#8b5cf6' },
  { id: 'bills', name: 'Bills & Utilities', type: 'expense', icon: 'receipt', color: '#ef4444' },
  { id: 'healthcare', name: 'Healthcare', type: 'expense', icon: 'heart', color: '#06b6d4' },
  { id: 'education', name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#3b82f6' },
  { id: 'travel', name: 'Travel', type: 'expense', icon: 'plane', color: '#14b8a6' },
]

export function NewTransactionPage() {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [account] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const profile = JSON.parse(localStorage.getItem('selectedProfile') || '{}')

  const filteredCategories = defaultCategories.filter((c) => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Find category id from database
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', category || '%')
        .eq('type', type)
        .limit(1)
        .single()

      // Create or get account
      let accountId = account
      if (!account) {
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('owner_id', profile.user_id)
          .limit(1)
          .single()

        if (existingAccount) {
          accountId = existingAccount.id
        } else {
          const { data: newAccount } = await supabase
            .from('accounts')
            .insert({
              name: 'Default Account',
              type: 'personal',
              balance: 0,
              owner_id: profile.user_id,
              family_id: profile.family_id,
            })
            .select('id')
            .single()

          accountId = newAccount?.id
        }
      }

      const { error } = await supabase.from('transactions').insert({
        amount: parseFloat(amount),
        type,
        category_id: categoryData?.id,
        account_id: accountId,
        date,
        description,
        created_by: profile.user_id,
        family_id: profile.family_id,
      })

      if (error) throw error

      // Log activity
      await supabase.from('activity_logs').insert({
        family_id: profile.family_id,
        user_id: profile.user_id,
        type: 'transaction_created',
        description: `Added ${type}: ${formatCurrency(parseFloat(amount))}`,
        metadata: { amount, category, type },
      })

      toast({
        title: 'Success',
        description: 'Transaction added successfully',
        variant: 'success',
      })

      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add Transaction</h1>
        <p className="text-muted-foreground mt-1">Record your income or expense</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <p className="font-semibold">Expense</p>
                <p className="text-sm text-muted-foreground">Money spent</p>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'income'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <p className="font-semibold">Income</p>
                <p className="text-sm text-muted-foreground">Money received</p>
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-2xl font-bold h-14"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Add a note (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Transaction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
