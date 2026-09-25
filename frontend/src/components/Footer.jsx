export default function Footer() {
  return (
    <footer className="px-6 py-12 border-t border-black/[0.05] dark:border-white/[0.08] bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto text-center">
        {/* Brand Text Logo */}
        <div className="flex items-center justify-center gap-2 mb-4 select-none">
          <span className="text-xl font-black tracking-[0.16em] bg-gradient-to-r from-blue-600 via-primary-light to-cyan bg-clip-text text-transparent">
            LUMEN
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
            RAD · AI
          </span>
        </div>

        <p className="text-xs text-shell-muted leading-relaxed max-w-xl mx-auto mb-4">
          For clinical research and educational purposes only — not an autonomous substitute for licensed radiologist diagnosis. 
          Developed for explainable chest radiography deep learning.
        </p>

        <p className="text-[11px] font-mono text-shell-muted/70">
          © {new Date().getFullYear()} LUMEN · DenseNet-121 Multi-Label & Grad-CAM Explainable AI
        </p>
      </div>
    </footer>
  );
}
