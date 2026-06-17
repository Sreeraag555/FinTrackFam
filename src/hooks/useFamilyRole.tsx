import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { MemberRole } from '@/types/database'

interface RoleContextType {
  role: MemberRole | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
  canManageFamily: boolean
  canManageBudgets: boolean
  canManageGoals: boolean
  canManageTransactions: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canChangeRoles: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<MemberRole | null>(null)
  const [loading, setLoading] = useState(true)
  const profile = JSON.parse(localStorage.getItem('selectedProfile') || '{}')

  useEffect(() => {
    fetchRole()
  }, [profile.user_id])

  const fetchRole = async () => {
    if (!profile.user_id || !profile.family_id) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('family_members')
      .select('role')
      .eq('user_id', profile.user_id)
      .eq('family_id', profile.family_id)
      .single()

    if (data) {
      setRole(data.role as MemberRole)
    }
    setLoading(false)
  }

  const isOwner = role === 'owner'
  const isAdmin = role === 'admin' || isOwner
  const isMember = role === 'member'

  // Role-based permissions
  const canManageFamily = isOwner
  const canManageBudgets = isAdmin
  const canManageGoals = true // All members can manage goals
  const canManageTransactions = true // All members can manage transactions
  const canInviteMembers = isAdmin
  const canRemoveMembers = isOwner
  const canChangeRoles = isOwner

  return (
    <RoleContext.Provider
      value={{
        role,
        loading,
        isOwner,
        isAdmin,
        isMember,
        canManageFamily,
        canManageBudgets,
        canManageGoals,
        canManageTransactions,
        canInviteMembers,
        canRemoveMembers,
        canChangeRoles,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useFamilyRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useFamilyRole must be used within a RoleProvider')
  }
  return context
}

// HOC for role-protected components
interface RoleGuardProps {
  children: ReactNode
  requireOwner?: boolean
  requireAdmin?: boolean
  fallback?: ReactNode
}

export function RoleGuard({ children, requireOwner, requireAdmin, fallback }: RoleGuardProps) {
  const { isOwner, isAdmin, loading } = useFamilyRole()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    )
  }

  if (requireOwner && !isOwner) {
    return fallback ? <>{fallback}</> : null
  }

  if (requireAdmin && !isAdmin) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
