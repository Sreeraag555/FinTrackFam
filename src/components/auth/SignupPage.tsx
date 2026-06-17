import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [joinFamilyCode, setJoinFamilyCode] = useState('')
  const [familyOption, setFamilyOption] = useState<'create' | 'join' | 'skip'>('create')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Create profile and family if creating new family
    const { data: { user } } = await supabase.auth.getUser()

    if (user && familyOption === 'create' && familyName) {
      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, created_by: user.id })
        .select()
        .single()

      if (family && !familyError) {
        // Create profile
        const colors = [
          'from-blue-500 to-cyan-500',
          'from-emerald-500 to-teal-500',
          'from-orange-500 to-amber-500',
          'from-pink-500 to-rose-500',
        ]
        await supabase.from('profiles').insert({
          user_id: user.id,
          family_id: family.id,
          display_name: displayName || email.split('@')[0],
          avatar_color: colors[Math.floor(Math.random() * colors.length)],
        })

        // Add as family member with owner role
        await supabase.from('family_members').insert({
          family_id: family.id,
          user_id: user.id,
          role: 'owner',
        })
      }
    } else if (user && joinFamilyCode) {
      // Join existing family
      const { data: family } = await supabase
        .from('families')
        .select()
        .eq('invite_code', joinFamilyCode.toUpperCase())
        .single()

      if (family) {
        const colors = [
          'from-blue-500 to-cyan-500',
          'from-emerald-500 to-teal-500',
          'from-orange-500 to-amber-500',
          'from-pink-500 to-rose-500',
        ]
        await supabase.from('profiles').insert({
          user_id: user.id,
          family_id: family.id,
          display_name: displayName || email.split('@')[0],
          avatar_color: colors[Math.floor(Math.random() * colors.length)],
        })

        await supabase.from('family_members').insert({
          family_id: family.id,
          user_id: user.id,
          role: 'member',
        })
      }
    }

    toast({
      title: 'Account created!',
      description: 'Please check your email to verify your account.',
      variant: 'success',
    })

    navigate('/login')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <TrendingUp className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gradient">Create Account</h1>
            <p className="text-muted-foreground mt-2">Start tracking your family finances</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">Family Setup</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFamilyOption('create')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                    familyOption === 'create'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Create</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyOption('join')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                    familyOption === 'join'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-xs">Join</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyOption('skip')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                    familyOption === 'skip'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs">Skip</span>
                </button>
              </div>
            </div>

            {familyOption === 'create' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder="e.g., The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </motion.div>
            )}

            {familyOption === 'join' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="joinCode">Family Invite Code</Label>
                <Input
                  id="joinCode"
                  type="text"
                  placeholder="Enter 8-character code"
                  value={joinFamilyCode}
                  onChange={(e) => setJoinFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="uppercase tracking-wider font-mono"
                />
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
