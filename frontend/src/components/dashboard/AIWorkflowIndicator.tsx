import { motion } from 'framer-motion';
import { Bot, Zap, Brain, MessageSquare, ArrowRight } from 'lucide-react';

const workflowSteps = [
  { icon: MessageSquare, label: 'Context', color: 'text-primary' },
  { icon: Zap, label: 'Fast Response', color: 'text-warning' },
  { icon: Bot, label: 'Action', color: 'text-success' },
  { icon: Brain, label: 'Reflection', color: 'text-info' },
];

export function AIWorkflowIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">AI Workflow Status</h3>
          <p className="text-sm text-muted-foreground">Real-time agent processing</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-xs font-medium text-success">Active</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`p-3 rounded-xl bg-secondary ${step.color}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </motion.div>
            {index < workflowSteps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + 0.1 * index }}
                className="mx-4"
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-2xl font-bold text-primary">~5.2s</p>
          <p className="text-xs text-muted-foreground">Avg Response</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-2xl font-bold text-success">98.5%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-2xl font-bold text-warning">247</p>
          <p className="text-xs text-muted-foreground">Processed Today</p>
        </div>
      </div>
    </motion.div>
  );
}
