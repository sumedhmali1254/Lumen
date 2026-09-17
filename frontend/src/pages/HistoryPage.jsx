import HistoryGrid from '../components/HistoryGrid';

export default function HistoryPage() {
  return (
    <div className="pt-24 pb-20 min-h-[80vh] w-full">
      <div className="max-w-7xl mx-auto px-6 mb-4 text-center sm:text-left">
        <h1 className="text-4xl font-black text-shell-heading tracking-tighter mb-3">Study History</h1>
        <p className="text-lg text-shell-muted max-w-2xl">Review past chest radiograph analyses, AI verdicts, and clinical metadata.</p>
      </div>
      <HistoryGrid />
    </div>
  );
}
