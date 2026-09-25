import { motion, useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import {
  Clock,
  Image,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";
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

function formatKeyLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\s+/, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function HistoryGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { history, clearHistory } = useHistory();
  const [selectedItem, setSelectedItem] = useState(null);

  const handleDeleteItem = (event, itemId) => {
    event.stopPropagation();

    const nextHistory = history.filter((item) => item.id !== itemId);
    if (nextHistory.length === 0) {
      clearHistory();
      setSelectedItem(null);
      return;
    }

    const storageKey = "lumen-history-v1";
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));
    window.dispatchEvent(new Event("history:updated"));
    setSelectedItem((current) => (current?.id === itemId ? null : current));
  };

  const selectedFindings = useMemo(() => {
    if (!selectedItem?.result?.findings) return [];
    return [...selectedItem.result.findings].sort(
      (a, b) =>
        Number(b.probability || b.confidence || 0) -
        Number(a.probability || a.confidence || 0),
    );
  }, [selectedItem]);

  return (
    <>
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
              Previous analyses and their outcomes, kept locally in your
              browser.
            </p>
          </motion.div>

          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-xl rounded-2xl border border-dashed border-shell-muted/30 bg-white/60 p-10 text-center backdrop-blur-sm"
            >
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <FileText className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-shell-heading mb-2">
                No saved studies yet
              </h3>
              <p className="text-sm text-shell-muted">
                Run an analysis from the home screen and it will appear here
                automatically.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {history.map((item, i) => {
                const abnormal = Boolean(
                  item.abnormal ?? item.result?.any_finding_detected ?? false,
                );
                const confidence = Number(item.confidence ?? 0) * 100;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.08, duration: 0.35 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedItem(item)}
                    className="glass-card-sm relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={(event) => handleDeleteItem(event, item.id)}
                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${item.fileName || "analysis"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-b border-black/[0.03] overflow-hidden">
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.fileName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-shell-muted/30" />
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        <span
                          className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            abnormal ? "bg-alert" : "bg-success"
                          }`}
                        />
                        <span className="truncate text-xs font-semibold text-shell-heading">
                          {item.fileName || "Chest X-ray"}
                        </span>
                      </div>

                      <div className="mb-3 flex items-center gap-2 text-[10px] text-shell-muted">
                        {abnormal ? (
                          <AlertTriangle className="h-3 w-3 text-alert" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        )}
                        <span className="line-clamp-2">
                          {item.verdict || "Analysis complete"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-shell-muted">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(item.createdAt)}</span>
                        <span className="ml-auto font-mono tabular-nums text-shell-heading">
                          {Math.round(confidence)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Study details
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedItem.fileName || "Chest X-ray"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close analysis details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid max-h-[calc(88vh-80px)] overflow-y-auto md:grid-cols-[1.1fr_1fr]">
              <div className="bg-slate-100 p-4">
                {selectedItem.preview ? (
                  <img
                    src={selectedItem.preview}
                    alt={selectedItem.fileName}
                    className="h-full min-h-[260px] w-full rounded-2xl object-cover shadow-inner"
                  />
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70">
                    <Image className="h-12 w-12 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Verdict
                    </span>
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700">
                      {selectedItem.abnormal ? "Abnormal" : "Normal"}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedItem.verdict || "Analysis complete"}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(selectedItem.createdAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Summary
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Model</dt>
                      <dd className="font-medium text-slate-800">
                        {selectedItem.result?.model_used || "Multilabel"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Selected disease</dt>
                      <dd className="font-medium text-slate-800">
                        {selectedItem.result?.selected_disease ||
                          selectedItem.result?.primary_disease ||
                          "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Confidence</dt>
                      <dd className="font-medium text-slate-800">
                        {Math.round(
                          (Number(selectedItem.confidence ?? 0) || 0) * 100,
                        )}
                        %
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Findings
                  </p>
                  <div className="space-y-2">
                    {selectedFindings.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No findings available.
                      </p>
                    ) : (
                      selectedFindings.map((finding, index) => (
                        <div
                          key={`${finding.disease || finding.raw_key || index}-${index}`}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-700">
                            {finding.disease || finding.raw_key || "Finding"}
                          </span>
                          <span className="tabular-nums text-slate-600">
                            {Math.round(
                              (Number(
                                finding.probability ?? finding.confidence ?? 0,
                              ) || 0) * 100,
                            )}
                            %
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Raw metadata
                  </p>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                    {JSON.stringify(selectedItem.result || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
