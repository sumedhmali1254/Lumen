import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="px-6 py-10 border-t border-black/[0.04]">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary-light to-cyan flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black text-shell-heading tracking-tighter">LUMEN</span>
        </div>

        <p className="text-xs text-shell-muted leading-relaxed max-w-lg mx-auto mb-4">
          For research and educational purposes only — not a substitute for professional medical diagnosis. 
          Always consult a qualified healthcare provider for clinical decisions.
        </p>

        <p className="text-[10px] text-shell-muted/60">
          © {new Date().getFullYear()} LUMEN · Explainable AI for Chest Radiograph Analysis
        </p>
      </div>
    </footer>
  );
}
