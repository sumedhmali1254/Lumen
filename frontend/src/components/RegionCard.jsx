import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

function MiniBar({ value, affected }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setWidth(value * 100), 200);
      return () => clearTimeout(timer);
    }
  }, [inView, value]);

  return (
    <div ref={ref} className="h-1.5 rounded-full bg-gray-100 overflow-hidden w-full">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${
          affected ? 'bg-gradient-to-r from-alert to-caution' : 'bg-gradient-to-r from-success to-cyan'
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function RegionCard({ region, index, onClick, isHighlighted }) {
  const affected = region.affected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        glass-card-sm p-5 cursor-pointer transition-all duration-300 group
        ${affected
          ? 'border-alert/40 hover:border-alert/60'
          : 'border-success/20 hover:border-success/40'
        }
        ${isHighlighted ? 'ring-2 ring-primary/30 scale-[1.02]' : ''}
      `}
      style={{
        animation: affected ? 'border-pulse-red 3s ease-in-out infinite' : undefined,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${region.name} lung region: ${affected ? 'Affected' : 'Clear'}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {affected ? (
            <div className="w-7 h-7 rounded-lg bg-alert/10 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-alert" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-success" />
            </div>
          )}
          <h4 className="text-sm font-bold text-shell-heading">{region.name}</h4>
        </div>
        <span className="font-mono text-xs text-shell-muted tabular-nums">
          {(region.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <MiniBar value={region.confidence} affected={affected} />

      <div className="mt-3 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${affected ? 'bg-alert' : 'bg-success'}`} />
        <span className={`text-xs font-semibold ${affected ? 'text-alert' : 'text-success'}`}>
          {affected ? 'Infiltrate — Affected' : 'Clear'}
        </span>
      </div>

      {/* Click hint */}
      <div className="mt-2 text-[10px] text-shell-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Click to highlight on viewer ↑
      </div>
    </motion.div>
  );
}
