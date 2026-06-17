import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Users,
  Bell,
  Shield,
  Key,
  Palette,
  Download,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Profile, FamilyMember } from '@/types/database'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const settingsSections = [
  { id: 'profile', icon: User, label: 'Profile', description: 'Manage your personal information' },
  { id: 'family', icon: Users, label: 'Family', description: 'Manage family members and roles' },
  { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Configure alert preferences' },
  { id: 'security', icon: Shield, label: 'Security', description: 'Password and authentication' },
  { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Theme and display settings' },
  { id: 'data', icon: Download, label: 'Data', description: 'Export and manage your data' },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<{ id: string; name: string; invite_code: string } | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [copiedCode, setCopiedCode] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    goalReminders: true,
    weeklyReports: true,
    newTransactions: false,
  })
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const storedProfile = localStorage.getItem('selectedProfile')
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile)
      setProfile(parsed)
      fetchFamilyData(parsed)
    }
  }, [])

  const fetchFamilyData = async (profileData: Profile) => {
    if (!profileData.family_id) return

    const { data: familyData } = await supabase
      .from('families')
      .select('*')
      .eq('id', profileData.family_id)
      .single()

    if (familyData) {
      setFamily(familyData)
      fetchFamilyMembers(familyData.id)
    }
  }

  const fetchFamilyMembers = async (familyId: string) => {
    const { data: members } = await supabase
      .from('family_members')
      .select('*, profiles!family_members_user_id_fkey(*)')
      .eq('family_id', familyId)

    if (members) {
      setFamilyMembers(members)
    }
  }

  const copyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopiedCode(true)
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
        variant: 'success',
      })
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className={profile?.avatar_color + ' text-2xl'}>
                      {profile ? getInitials(profile.display_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile?.display_name || ''}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Account)</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Profile PIN
                </CardTitle>
                <CardDescription>Set a PIN for quick profile switching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input type="password" placeholder="Enter 4-digit PIN" maxLength={4} />
                  <Button>Set PIN</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'family':
        return (
          <div className="space-y-6">
            {family ? (
              <>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {family.name}
                    </CardTitle>
                    <CardDescription>Share this code with family members to join</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 p-4 rounded-lg bg-white/5 border border-white/10">
                        <code className="text-2xl font-mono tracking-wider text-primary">
                          {family.invite_code}
                        </code>
                      </div>
                      <Button onClick={copyInviteCode} variant="outline">
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Family Members</CardTitle>
                    <CardDescription>Manage access and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {familyMembers.map((member) => {
                      const memberProfile = (member as FamilyMember & { profiles?: Profile }).profiles
                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={memberProfile?.avatar_url || undefined} />
                              <AvatarFallback className={memberProfile?.avatar_color}>
                                {memberProfile ? getInitials(memberProfile.display_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{memberProfile?.display_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                          {member.role !== 'owner' && (
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Remove
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Family Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create or join a family to share finances with others
                  </p>
                  <Button>Create Family</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'notifications':
        return (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what alerts you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Budget Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when budgets reach limits</p>
                </div>
                <Switch
                  checked={notifications.budgetAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, budgetAlerts: checked })}
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Goal Reminders</p>
                  <p className="text-sm text-muted-foreground">Reminders to save towards goals</p>
                </div>
                <Switch
                  checked={notifications.goalReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, goalReminders: checked })}
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Weekly financial summary emails</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Transactions</p>
                  <p className="text-sm text-muted-foreground">Alert for every new transaction</p>
                </div>
                <Switch
                  checked={notifications.newTransactions}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newTransactions: checked })}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Enable 2FA</Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'appearance':
        return (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">App is in dark mode</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                FinTrack currently supports dark mode exclusively for optimal visual experience.
              </p>
            </CardContent>
          </Card>
        )

      case 'data':
        return (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download your financial data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="glass-card">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'hover:bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{section.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </nav>
              <Separator className="bg-white/10 my-2" />
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-red-400 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Content */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          {renderContent()}
        </motion.div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Type "DELETE" to confirm account deletion:
            </p>
            <Input placeholder="Type DELETE" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1">
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
