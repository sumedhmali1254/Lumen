import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, Image } from 'lucide-react';
import { MOCK_HISTORY } from '../data/mockData';

export default function HistoryGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="history" className="px-6 py-12 md:py-16" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-shell-heading mb-3">
            Analysis History
          </h2>
          <p className="text-sm text-shell-muted">
            Previous analyses and their outcomes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_HISTORY.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -3 }}
              className="glass-card-sm overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b border-black/[0.03]">
                <Image className="w-8 h-8 text-shell-muted/30" />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${item.pneumonia_detected ? 'bg-alert' : 'bg-success'}`} />
                  <span className="text-xs font-semibold text-shell-heading truncate">
                    {item.filename}
                  </span>
                </div>

                <p className="text-[11px] text-shell-muted mb-2 line-clamp-1">
                  {item.verdict}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-shell-muted">
                  <Clock className="w-3 h-3" />
                  {item.date}
                  <span className="ml-auto font-mono tabular-nums">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
