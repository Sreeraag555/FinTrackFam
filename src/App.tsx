import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { RoleProvider } from '@/hooks/useFamilyRole'
import { ProtectedRoute, ProfileRequired } from '@/components/auth/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

// Auth Pages
import { LoginPage } from '@/components/auth/LoginPage'
import { SignupPage } from '@/components/auth/SignupPage'
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage'

// Profile Page
import { ProfileSelectionPage } from '@/components/profiles/ProfileSelectionPage'

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Dashboard & Pages
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { NewTransactionPage } from '@/components/transactions/NewTransactionDialog'
import { TransactionHistoryPage } from '@/components/transactions/TransactionHistory'
import { BudgetsPage } from '@/components/budgets/BudgetsPage'
import { SavingsGoalsPage } from '@/components/goals/SavingsGoalsPage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { AIInsightsPage } from '@/components/insights/AIInsightsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <RoleProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Profile Selection (Protected) */}
              <Route
                path="/profiles"
                element={
                  <ProtectedRoute>
                    <ProfileSelectionPage />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <ProfileRequired>
                      <DashboardLayout />
                    </ProfileRequired>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionHistoryPage />} />
                <Route path="/transactions/new" element={<NewTransactionPage />} />
                <Route path="/history" element={<TransactionHistoryPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/goals" element={<SavingsGoalsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/insights" element={<AIInsightsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
          </RoleProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
