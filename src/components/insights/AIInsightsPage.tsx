import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function AIInsightsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground mt-1">Personalized financial recommendations powered by AI</p>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card glow overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10" />
          <CardContent className="relative p-8 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gradient mb-3">AI Insights Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We're building powerful AI features to help you understand your spending patterns,
              optimize your budget, and achieve your financial goals faster.
            </p>
            <Button disabled>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Notified
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="glass-card opacity-70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Spending Analysis</CardTitle>
                  <CardDescription>AI-powered spending insights</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-white/60 italic">
                  "You're spending 23% more on dining this month compared to your average.
                  Consider meal prepping to reduce expenses."
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card opacity-70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <CardTitle>Smart Alerts</CardTitle>
                  <CardDescription>Proactive notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-white/60 italic">
                  "Your subscription costs increased by $15 this month. Review your
                  streaming services to find savings."
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card opacity-70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle>Budget Suggestions</CardTitle>
                  <CardDescription>Optimized budget recommendations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-white/60 italic">
                  "Based on your income, allocate 50% to needs, 30% to wants, and
                  20% to savings for optimal financial health."
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card opacity-70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle>Savings Opportunities</CardTitle>
                  <CardDescription>Find hidden savings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-white/60 italic">
                  "Switching to a different credit card could earn you an extra
                  $340 in rewards annually based on your spending."
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features List */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, text: 'Spending pattern analysis' },
                { icon: AlertTriangle, text: 'Unusual transaction alerts' },
                { icon: Lightbulb, text: 'Budget optimization suggestions' },
                { icon: Target, text: 'Goal progress predictions' },
                { icon: PiggyBank, text: 'Savings opportunity detection' },
                { icon: Sparkles, text: 'Natural language Q&A' },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <feature.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
