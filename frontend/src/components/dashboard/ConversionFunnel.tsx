import { motion } from 'framer-motion';

interface FunnelDataPoint {
  name: string;
  value: number;
  fill: string;
}

interface ConversionFunnelProps {
  data?: FunnelDataPoint[];
}

const defaultData: FunnelDataPoint[] = [
  { name: 'New Leads', value: 0, fill: 'hsl(187, 85%, 53%)' },
  { name: 'Engaged', value: 0, fill: 'hsl(160, 84%, 39%)' },
  { name: 'Qualified', value: 0, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Booked', value: 0, fill: 'hsl(280, 65%, 60%)' },
  { name: 'Converted', value: 0, fill: 'hsl(340, 75%, 55%)' },
];

export function ConversionFunnel({ data = defaultData }: ConversionFunnelProps) {
  const funnelData = data && data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...funnelData.map((d) => d.value), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Conversion Funnel</h3>
        <p className="text-sm text-muted-foreground">Lead progression through stages</p>
      </div>

      <div className="space-y-4">
        {funnelData.map((stage, index) => {
          const percentage = (stage.value / maxValue) * 100;
          const conversionRate =
            index > 0 && funnelData[index - 1].value > 0
              ? ((stage.value / funnelData[index - 1].value) * 100).toFixed(1)
              : '100';

          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{stage.value}</span>
                  {index > 0 && (
                    <span className="text-xs text-success px-2 py-0.5 rounded-full bg-success/10">
                      {conversionRate}%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-8 bg-secondary rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + 0.1 * index, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-lg"
                  style={{ backgroundColor: stage.fill }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-white mix-blend-difference">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
