import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Clock,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "../context/HistoryContext";

function formatDate(isoDate) {
  if (!isoDate) return "Recently";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffMinutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export default function HistoryGrid({ showHeader = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { history, deleteAnalysis, addAnalysis, clearHistory } = useHistory();
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'abnormal' | 'normal'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("findings"); // 'findings' | 'regions'
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 4500);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toast]);

  // Filter and search history items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const isAbnormal = Boolean(
        item.abnormal ?? item.result?.any_finding_detected ?? false,
      );

      // Filter by type
      if (filterType === "abnormal" && !isAbnormal) return false;
      if (filterType === "normal" && isAbnormal) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.fileName || "").toLowerCase().includes(query);
        const matchesVerdict = (item.verdict || "").toLowerCase().includes(query);
        const matchesDisease = (item.result?.findings || []).some((f) =>
          (f.disease || f.name || f.raw_key || "").toLowerCase().includes(query)
        );
        return matchesName || matchesVerdict || matchesDisease;
      }

      return true;
    });
  }, [history, filterType, searchQuery]);

  const handleDeleteItem = (event, itemId) => {
    if (event) event.stopPropagation();
    const itemToDelete = history.find((i) => i.id === itemId);
    deleteAnalysis(itemId);

    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }

    // Trigger modern toast
    setToast({
      id: Date.now(),
      message: `Study "${itemToDelete?.fileName || "Chest X-Ray"}" deleted.`,
      deletedItem: itemToDelete,
      type: "delete",
    });
  };

  const handleUndoDelete = () => {
    if (toast?.deletedItem) {
      addAnalysis(toast.deletedItem);
      setToast(null);
    }
  };

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
    setSelectedItem(null);
    setToast({
      id: Date.now(),
      message: "All analysis history cleared.",
      type: "clear",
    });
  };

  const handleOpenInAnalyzer = (item) => {
    navigate("/", { state: { loadHistoryItem: item } });
  };

  const selectedFindings = useMemo(() => {
    if (!selectedItem?.result?.findings) return [];
    return [...selectedItem.result.findings].sort(
      (a, b) =>
        Number(b.probability || b.confidence || 0) -
        Number(a.probability || a.confidence || 0),
    );
  }, [selectedItem]);

  const selectedQuadrants = useMemo(() => {
    if (!selectedItem?.result) return [];
    return selectedItem.result.quadrants || selectedItem.result.regions || [];
  }, [selectedItem]);

  return (
    <>
      <section id="history-section" className="px-4 sm:px-6 py-6 md:py-10" ref={ref}>
        <div className="max-w-7xl mx-auto">
          {/* Optional Header */}
          {showHeader && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-black text-shell-heading tracking-tight mb-2">
                Study History
              </h2>
              <p className="text-sm text-shell-muted max-w-xl mx-auto">
                Comprehensive archive of previous chest radiograph analyses and AI inferences.
              </p>
            </motion.div>
          )}

          {/* Controls Bar: Search, Filters, and Clear */}
          {history.length > 0 && (
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl glass-card-sm border border-slate-200/80 dark:border-white/10 shadow-sm">
              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-shell-muted" />
                <input
                  type="text"
                  placeholder="Search by filename or disease..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-shell-heading placeholder:text-shell-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-shell-muted hover:text-shell-heading"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills & Actions */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterType === "all"
                        ? "bg-white dark:bg-slate-700 text-shell-heading shadow-sm"
                        : "text-shell-muted hover:text-shell-heading"
                    }`}
                  >
                    All ({history.length})
                  </button>
                  <button
                    onClick={() => setFilterType("abnormal")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterType === "abnormal"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm"
                        : "text-shell-muted hover:text-rose-500"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Pathologies
                  </button>
                  <button
                    onClick={() => setFilterType("normal")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterType === "normal"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                        : "text-shell-muted hover:text-emerald-500"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Normal
                  </button>
                </div>

                {/* Clear All Button */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-shell-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all flex items-center gap-1.5"
                  title="Clear all saved studies"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Clear All</span>
                </button>
              </div>
            </div>
          )}

          {/* History Empty States */}
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-12 text-center backdrop-blur-md shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-shell-heading mb-2">
                No saved studies yet
              </h3>
              <p className="text-sm text-shell-muted max-w-sm mx-auto mb-6">
                Upload and analyze a chest radiograph to start recording your diagnostic history with Grad-CAM heatmaps.
              </p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-md shadow-primary/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Analyze First X-Ray
              </button>
            </motion.div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 glass-card-sm p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-8 h-8 text-shell-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-shell-heading mb-1">
                No matching studies found
              </p>
              <p className="text-xs text-shell-muted">
                Try adjusting your search query or filter selection.
              </p>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <AnimatePresence>
                {filteredHistory.map((item, i) => {
                  const abnormal = Boolean(
                    item.abnormal ?? item.result?.any_finding_detected ?? false,
                  );
                  const confidence = Number(item.confidence ?? 0) * 100;
                  const primaryDisease =
                    item.result?.primary_disease ||
                    item.result?.selected_disease ||
                    item.result?.findings?.[0]?.disease ||
                    "Chest X-ray";

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedItem(item)}
                      className="glass-card-sm relative overflow-hidden group cursor-pointer hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between"
                    >
                      {/* Top Delete Button */}
                      <button
                        type="button"
                        onClick={(event) => handleDeleteItem(event, item.id)}
                        className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 shadow-md transition-all duration-200"
                        title={`Delete ${item.fileName || "study"}`}
                        aria-label={`Delete ${item.fileName || "analysis"}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Image Thumbnail */}
                      <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center border-b border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt={item.fileName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-slate-600" />
                        )}

                        {/* Top Badge: Status */}
                        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm">
                          {abnormal ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/90 text-white shadow-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Findings
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Normal
                            </span>
                          )}
                        </div>

                        {/* Relative Time Chip */}
                        {item.createdAt && (
                          <div className="absolute right-2.5 bottom-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
                            {formatRelativeTime(item.createdAt)}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-bold text-xs text-shell-heading line-clamp-1 group-hover:text-primary transition-colors">
                              {item.fileName || "Chest Radiograph"}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 mb-2.5 text-[11px] text-shell-muted">
                            {abnormal ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="line-clamp-1 font-medium text-slate-700 dark:text-slate-300">
                              {primaryDisease}
                            </span>
                          </div>
                        </div>

                        {/* Confidence Bar & Date */}
                        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-shell-muted">Confidence</span>
                            <span className="font-mono font-bold text-shell-heading tabular-nums">
                              {Math.round(confidence)}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                abnormal
                                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(confidence, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-shell-muted pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.createdAt)}
                            </span>
                            <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              Inspect <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Simple Normal Toast on Bottom Right */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[95] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 text-white text-xs font-medium shadow-2xl border border-slate-700/80 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            {toast.type === "delete" && toast.deletedItem && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="ml-1 text-primary-light hover:text-cyan font-bold transition-colors cursor-pointer"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 p-0.5 text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Clearing All History */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-shell-heading">Clear All History?</h3>
            </div>
            <p className="text-sm text-shell-muted mb-6">
              This will permanently remove all {history.length} saved chest X-ray analyses from your browser.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-shell-body hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modern Clinical Study Inspection Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-5xl my-auto overflow-hidden rounded-3xl border border-white/20 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedItem.fileName || "Chest X-Ray Study"}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedItem.abnormal
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                      }`}
                    >
                      {selectedItem.abnormal ? "Pathology Detected" : "Normal Study"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(selectedItem.createdAt)}</span>
                    <span>•</span>
                    <span className="font-mono">{formatRelativeTime(selectedItem.createdAt)}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenInAnalyzer(selectedItem)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Load in Full Analyzer
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, selectedItem.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Delete this study"
                  aria-label="Delete this study"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close study details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] overflow-y-auto">
              {/* Left Column: Radiography Viewer Panel */}
              <div className="bg-slate-950 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-cyan" />
                      Radiograph Inspection
                    </span>
                    {selectedItem.result?.heatmap && (
                      <button
                        type="button"
                        onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          showHeatmapOverlay
                            ? "bg-primary/30 text-cyan border border-cyan/40"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {showHeatmapOverlay ? "Heatmap Active" : "Original X-Ray"}
                      </button>
                    )}
                  </div>

                  {/* Image Display */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                    {selectedItem.preview ? (
                      <img
                        src={
                          showHeatmapOverlay && selectedItem.result?.heatmap
                            ? selectedItem.result.heatmap
                            : selectedItem.preview
                        }
                        alt={selectedItem.fileName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <ImageIcon className="w-12 h-12" />
                        <span className="text-xs">No image data</span>
                      </div>
                    )}

                    {/* Gradient Border Glow */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/10" />
                  </div>
                </div>

                {/* Technical Meta Footer in Image column */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Model Architecture</span>
                    <span className="text-slate-200 font-medium">{selectedItem.result?.model_used ? "DenseNet-121 Multi-Label" : "NIH ChestX-ray14 CNN"}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Resolution</span>
                    <span className="text-slate-200 font-medium">{selectedItem.result?.image_meta?.resolution || "224x224 Standardized"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Clinical Diagnostics & Findings */}
              <div className="p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  {/* Verdict Card */}
                  <div
                    className={`rounded-2xl p-4.5 border ${
                      selectedItem.abnormal
                        ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20"
                        : "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Diagnostic AI Verdict
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
                        Confidence: {Math.round(Number(selectedItem.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {selectedItem.verdict || selectedItem.result?.verdict_text || "Analysis complete."}
                    </p>
                  </div>

                  {/* Tabs: Findings Breakdown / Regional Quadrants */}
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setActiveModalTab("findings")}
                        className={`text-xs font-bold pb-1 transition-all ${
                          activeModalTab === "findings"
                            ? "text-primary border-b-2 border-primary"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        All Findings ({selectedFindings.length})
                      </button>
                      {selectedQuadrants.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveModalTab("regions")}
                          className={`text-xs font-bold pb-1 transition-all ${
                            activeModalTab === "regions"
                              ? "text-primary border-b-2 border-primary"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                          }`}
                        >
                          Lung Regions ({selectedQuadrants.length})
                        </button>
                      )}
                    </div>

                    {/* Tab 1: Findings List */}
                    {activeModalTab === "findings" && (
                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {selectedFindings.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            No individual findings recorded.
                          </div>
                        ) : (
                          selectedFindings.map((finding, idx) => {
                            const isPositive = finding.positive ?? finding.detected;
                            const prob = Number(finding.probability ?? finding.confidence ?? 0);
                            const threshold = Number(finding.threshold ?? 0.5);
                            const name = finding.disease || finding.name || finding.raw_key || "Finding";

                            return (
                              <div
                                key={`${name}-${idx}`}
                                className={`p-3 rounded-xl border transition-all ${
                                  isPositive
                                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40"
                                    : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isPositive ? "bg-rose-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                                      }`}
                                    />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        isPositive
                                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                                          : "bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      {isPositive ? "Detected" : "Low Risk"}
                                    </span>
                                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                                      {(prob * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>

                                {/* Probability Progress Bar */}
                                <div className="relative h-2 w-full bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isPositive
                                        ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                        : "bg-primary/70"
                                    }`}
                                    style={{ width: `${Math.min(prob * 100, 100)}%` }}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                  <span>Cutoff Threshold: {(threshold * 100).toFixed(0)}%</span>
                                  <span>{isPositive ? "Above diagnostic threshold" : "Below threshold"}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Tab 2: Lung Quadrant Involvement */}
                    {activeModalTab === "regions" && (
                      <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto">
                        {selectedQuadrants.map((q, idx) => (
                          <div
                            key={`${q.name}-${idx}`}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-between"
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {q.name}
                            </span>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-400">Heatmap Intensity:</span>
                              <span className="font-mono font-bold text-primary">
                                {Math.round(Number(q.confidence || q.score || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenInAnalyzer(selectedItem)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Load Study in Interactive Analyzer
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
