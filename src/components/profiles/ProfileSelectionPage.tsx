import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Settings, LogOut, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import type { Profile, FamilyMember } from '@/types/database'

export function ProfileSelectionPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pin, setPin] = useState('')
  const [newProfileName, setNewProfileName] = useState('')
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchProfiles()
    }
  }, [user])

  const fetchProfiles = async () => {
    if (!user) return

    // Get user's profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)

    if (profileData) {
      setProfiles(profileData)
    }

    // Get family members if user has a family
    const { data: memberData } = await supabase
      .from('family_members')
      .select('*, families(*)')
      .eq('user_id', user.id)

    if (memberData) {
      setFamilyMembers(memberData)
    }

    setLoading(false)
  }

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile)
    if (profile.pin) {
      setShowPinDialog(true)
    } else {
      proceedWithProfile(profile)
    }
  }

  const proceedWithProfile = (profile: Profile) => {
    // Store selected profile in localStorage
    localStorage.setItem('selectedProfile', JSON.stringify(profile))
    navigate('/dashboard')
  }

  const handlePinSubmit = () => {
    if (selectedProfile && pin === selectedProfile.pin) {
      setShowPinDialog(false)
      setPin('')
      proceedWithProfile(selectedProfile)
    } else {
      // Show error - in real app would use toast
      setPin('')
    }
  }

  const handleCreateProfile = async () => {
    if (!user || !newProfileName.trim()) return

    const colors = [
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-violet-500 to-purple-500',
    ]

    const familyId = familyMembers[0]?.family_id || null

    const { data } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        family_id: familyId,
        display_name: newProfileName.trim(),
        avatar_color: colors[Math.floor(Math.random() * colors.length)],
      })
      .select()
      .single()

    if (data) {
      setProfiles([...profiles, data])
      setShowCreateDialog(false)
      setNewProfileName('')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient">FinTrack</h1>
        </div>
        <p className="text-white/60 text-lg">Who's tracking today?</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl"
      >
        {profiles.map((profile) => (
          <motion.button
            key={profile.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleProfileClick(profile)}
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl glass-card hover:border-primary/50 transition-all cursor-pointer"
          >
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white/10 group-hover:border-primary/50 transition-all">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className={profile.avatar_color}>
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              {profile.pin && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-lg font-medium text-white/80 group-hover:text-white transition-colors">
              {profile.display_name}
            </span>
          </motion.button>
        ))}

        {/* Add New Profile Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateDialog(true)}
          className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer bg-white/5"
        >
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-white/20 group-hover:border-primary/50 flex items-center justify-center transition-all">
            <Plus className="w-10 h-10 text-white/40 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-lg font-medium text-white/40 group-hover:text-primary transition-colors">
            Add Profile
          </span>
        </motion.button>
      </motion.div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-12 flex items-center gap-4"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="text-white/60 hover:text-white"
        >
          <Settings className="w-5 h-5 mr-2" />
          Manage Profiles
        </Button>
        <Button
          variant="ghost"
          onClick={signOut}
          className="text-white/60 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </motion.div>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter PIN</DialogTitle>
            <DialogDescription>
              Enter the 4-digit PIN for {selectedProfile?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              maxLength={4}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <Button onClick={handlePinSubmit} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Add a new profile to track your finances
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                placeholder="Enter profile name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateProfile} className="flex-1">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
