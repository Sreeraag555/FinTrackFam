import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function calculateHealthScore(metrics: {
  budgetAdherence: number
  savingsRate: number
  debtRatio: number
  emergencyFund: number
}): number {
  const weights = {
    budgetAdherence: 0.3,
    savingsRate: 0.25,
    debtRatio: 0.25,
    emergencyFund: 0.2,
  }

  const score =
    metrics.budgetAdherence * weights.budgetAdherence +
    Math.min(metrics.savingsRate * 5, 100) * weights.savingsRate +
    (100 - Math.min(metrics.debtRatio * 2, 100)) * weights.debtRatio +
    Math.min(metrics.emergencyFund * 10, 100) * weights.emergencyFund

  return Math.round(score)
}

export function getHealthScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' }
  if (score >= 60) return { label: 'Good', color: 'text-cyan-400' }
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-400' }
  return { label: 'Needs Improvement', color: 'text-red-400' }
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-500',
    'from-violet-500 to-purple-500',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
