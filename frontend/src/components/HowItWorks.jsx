import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Upload,
  Cpu,
  Eye,
  FileText,
  Sparkles,
  CheckCircle2,
  Activity,
  Zap,
  Layers
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Radiograph Ingestion',
    subtitle: 'Upload & Normalization',
    description: 'Instant preprocessing of DICOM or PNG radiographs with contrast standardization and 224×224 tensor alignment.',
    color: 'from-blue-500/10 via-primary/5 to-transparent',
    accent: 'text-primary',
    border: 'border-blue-500/20',
    type: 'upload',
  },
  {
    id: 2,
    title: 'DenseNet-121 CNN',
    subtitle: 'Deep Feature Extraction',
    description: '121-layer convolutional hierarchy with feature reuse across dense blocks for detecting subtle opacities.',
    color: 'from-cyan/10 via-cyan/5 to-transparent',
    accent: 'text-cyan-dark dark:text-cyan',
    border: 'border-cyan/20',
    type: 'cnn',
  },
  {
    id: 3,
    title: 'Grad-CAM Mapping',
    subtitle: 'Spatial Saliency & Heatmap',
    description: 'Backpropagated score gradients highlight the exact anatomical lung regions driving the AI verdict.',
    color: 'from-amber-500/10 via-amber-500/5 to-transparent',
    accent: 'text-amber-500',
    border: 'border-amber-500/20',
    type: 'gradcam',
  },
  {
    id: 4,
    title: 'Calibrated Verdict',
    subtitle: 'Multi-Label Findings',
    description: 'Simultaneous 14-disease evaluation with disease-specific cutoff thresholds and quadrant involvement metrics.',
    color: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    accent: 'text-emerald-500',
    border: 'border-emerald-500/20',
    type: 'verdict',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" className="px-4 sm:px-6 py-16 md:py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Diagnostic Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-shell-heading tracking-tight mb-3">
            How LUMEN Works
          </h2>
          <p className="text-sm sm:text-base text-shell-muted max-w-2xl mx-auto leading-relaxed">
            From raw chest radiograph to fully explainable, localized clinical diagnostic verdict in under 3 seconds.
          </p>
        </motion.div>

        {/* 4 Interactive Self-Contained Step Cards with Integrated Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 glass-card-sm shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    STAGE 0{step.id}
                  </span>
                  <span className={`text-xs font-bold ${step.accent} uppercase tracking-wider font-mono`}>
                    {step.subtitle}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
              </div>

              {/* Integrated Visual Animation Showcase Box */}
              <div className="my-4 h-36 rounded-2xl bg-slate-950 p-4 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-inner">
                {/* Background Ambient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} pointer-events-none opacity-40`} />

                {/* Animation 1: Scanner Ingestion */}
                {step.type === 'upload' && (
                  <div className="space-y-2 z-10 w-full flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl border border-cyan/40 bg-slate-900/90 flex items-center justify-center overflow-hidden shadow-lg">
                      <Upload className="w-7 h-7 text-cyan group-hover:scale-110 transition-transform" />
                      <div className="scanline-effect" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan/90 bg-cyan/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>224×224 Tensor Ready</span>
                    </div>
                  </div>
                )}

                {/* Animation 2: DenseNet CNN Matrix */}
                {step.type === 'cnn' && (
                  <div className="space-y-2 z-10 w-full flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((node) => (
                        <motion.div
                          key={node}
                          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: node * 0.25 }}
                          className="w-8 h-8 rounded-lg bg-cyan/15 border border-cyan/40 flex items-center justify-center text-cyan text-[11px] font-mono font-bold"
                        >
                          D{node}
                        </motion.div>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      121-Layer Dense Connectivity
                    </span>
                  </div>
                )}

                {/* Animation 3: Grad-CAM Thermal Saliency */}
                {step.type === 'gradcam' && (
                  <div className="space-y-2 z-10 w-full flex flex-col items-center">
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-500/30 via-rose-500/50 to-cyan/30 border border-amber-400/50 flex items-center justify-center shadow-md animate-pulse">
                      <Eye className="w-6 h-6 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400/90">
                      DenseBlock4 Spatial Heatmap
                    </span>
                  </div>
                )}

                {/* Animation 4: Calibrated Verdict */}
                {step.type === 'verdict' && (
                  <div className="space-y-2 z-10 w-full px-2 flex flex-col items-center">
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>Pathology Probability</span>
                        <span className="text-emerald-400 font-bold">92%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[92%] rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Threshold Calibrated Verdict
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
