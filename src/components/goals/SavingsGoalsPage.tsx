import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Target,
  Calendar,
  DollarSign,
  Award,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { SavingsGoal } from '@/types/database'

const mockGoals = [
  { id: '1', name: 'Emergency Fund', target_amount: 10000, current_amount: 8500, deadline: '2024-06-01', icon: 'shield' },
  { id: '2', name: 'Vacation', target_amount: 3000, current_amount: 1200, deadline: '2024-08-15', icon: 'plane' },
  { id: '3', name: 'New Car', target_amount: 25000, current_amount: 5000, deadline: '2025-01-01', icon: 'car' },
  { id: '4', name: 'Home Renovation', target_amount: 15000, current_amount: 2000, deadline: '2024-12-01', icon: 'home' },
]

export function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showContributeDialog, setShowContributeDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    icon: 'target',
  })
  const { toast } = useToast()
  const profile = JSON.parse(localStorage.getItem('selectedProfile') || '{}')

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setGoals(data)
    }
  }

  const handleCreateGoal = async () => {
    if (!formData.name || !formData.target_amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    const goalData = {
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      current_amount: 0,
      deadline: formData.deadline || null,
      icon: formData.icon,
      family_id: profile.family_id,
      owner_id: profile.user_id,
    }

    const { error } = await supabase.from('savings_goals').insert(goalData)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Goal created',
        description: 'Your savings goal has been created',
        variant: 'success',
      })
      setShowCreateDialog(false)
      setFormData({ name: '', target_amount: '', deadline: '', icon: 'target' })
      fetchGoals()
    }
  }

  const handleContribute = async () => {
    if (!selectedGoal || !contributionAmount) return

    const newAmount = selectedGoal.current_amount + parseFloat(contributionAmount)

    const { error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', selectedGoal.id)

    if (!error) {
      // Log activity
      await supabase.from('activity_logs').insert({
        family_id: profile.family_id,
        user_id: profile.user_id,
        type: 'goal_contribution',
        description: `Contributed ${formatCurrency(parseFloat(contributionAmount))} to ${selectedGoal.name}`,
        metadata: { amount: contributionAmount, goal_id: selectedGoal.id },
      })

      toast({
        title: 'Contribution added',
        description: `Added ${formatCurrency(parseFloat(contributionAmount))} to ${selectedGoal.name}`,
        variant: 'success',
      })
      setShowContributeDialog(false)
      setContributionAmount('')
      fetchGoals()
    }
  }

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id)
    fetchGoals()
    toast({
      title: 'Goal deleted',
      description: 'Savings goal has been removed',
    })
  }

  const displayGoals = goals.length > 0 ? goals : mockGoals

  const totalTarget = displayGoals.reduce((sum, g) => sum + ((g as { target_amount: number }).target_amount || 0), 0)
  const totalCurrent = displayGoals.reduce((sum, g) => sum + ((g as { current_amount: number }).current_amount || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track your progress towards financial goals</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Overview Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalCurrent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{formatPercentage((totalCurrent / totalTarget) * 100)}</p>
            </div>
          </div>
          <div className="mt-6">
            <Progress value={(totalCurrent / totalTarget) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayGoals.map((goal, index) => {
          const g = goal as { id: string; name: string; target_amount: number; current_amount: number; deadline?: string; icon?: string }
          const percentage = (g.current_amount / g.target_amount) * 100
          const isComplete = percentage >= 100

          return (
            <motion.div
              key={g.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card hover:glow-sm transition-all">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                      {isComplete && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{g.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {g.deadline ? new Date(g.deadline).toLocaleDateString() : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setSelectedGoal(g as unknown as SavingsGoal)
                        setShowContributeDialog(true)
                      }}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Contribution
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGoal(g.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{formatPercentage(Math.min(percentage, 100))}</span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className="h-2"
                        indicatorClassName={isComplete ? 'bg-emerald-500' : 'bg-primary'}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Saved</p>
                        <p className="font-semibold text-emerald-400">{formatCurrency(g.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-semibold">{formatCurrency(g.target_amount)}</p>
                      </div>
                    </div>
                    {!isComplete && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedGoal(g as unknown as SavingsGoal)
                          setShowContributeDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contribution
                      </Button>
                    )}
                    {isComplete && (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 p-3 rounded-lg bg-emerald-500/10">
                        <Award className="w-5 h-5" />
                        <span className="font-medium">Goal Complete!</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}

        {/* Add Goal Card */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: displayGoals.length * 0.1 }}
          onClick={() => setShowCreateDialog(true)}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer bg-white/5"
        >
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <span className="text-lg font-medium text-muted-foreground">Add Savings Goal</span>
        </motion.button>
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
            <DialogDescription>
              Set a new savings target to work towards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                placeholder="e.g., Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="10000"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Target Date (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} className="flex-1">
                Create Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add funds to {selectedGoal?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contribution">Amount</Label>
              <Input
                id="contribution"
                type="number"
                placeholder="100"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowContributeDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleContribute} className="flex-1">
                Add Contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
