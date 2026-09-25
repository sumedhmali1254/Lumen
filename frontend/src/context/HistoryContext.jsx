import { createContext, useContext, useEffect, useMemo, useState } from "react";

const HistoryContext = createContext(null);
const STORAGE_KEY = "lumen-history-v1";

function safeParseHistory(rawHistory) {
  if (!rawHistory) return [];

  try {
    const parsed = JSON.parse(rawHistory);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeResult(result) {
  if (!result || typeof result !== "object") return {};

  const next = { ...result };
  delete next.heatmap;
  delete next.heatmaps;
  delete next.regions_by_disease;
  delete next.quadrants;
  delete next.image;
  delete next.original_image;

  if (Array.isArray(next.findings)) {
    next.findings = next.findings.map((finding) => ({
      ...finding,
      __summary: undefined,
    }));
  }

  return next;
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    return safeParseHistory(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compactHistory = history.map((item) => ({
      ...item,
      result: sanitizeResult(item.result),
    }));

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compactHistory));
    } catch {
      const trimmedHistory = compactHistory.map((item) => ({
        ...item,
        result: {
          model_used: item.result?.model_used || "",
          any_finding_detected: item.result?.any_finding_detected ?? false,
          verdict_text: item.result?.verdict_text || item.verdict || "",
          selected_disease: item.result?.selected_disease || "",
          primary_disease: item.result?.primary_disease || "",
          findings: Array.isArray(item.result?.findings)
            ? item.result.findings.slice(0, 8)
            : [],
          image_meta: item.result?.image_meta || {},
        },
      }));

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(trimmedHistory),
        );
      } catch {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
    }
  }, [history]);

  const addAnalysis = (entry) => {
    if (!entry) return;

    const normalized = {
      id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      fileName: entry.fileName || "Chest X-ray",
      createdAt: entry.createdAt || new Date().toISOString(),
      preview: entry.preview || "",
      result: entry.result || {},
      verdict:
        entry.verdict || entry.result?.verdict_text || "Analysis complete",
      confidence:
        entry.confidence ??
        (() => {
          const findings = entry.result?.findings || [];
          const selected =
            findings.find(
              (f) => f.raw_key === entry.result?.selected_disease,
            ) ||
            findings.find((f) => f.raw_key === entry.result?.primary_disease) ||
            findings[0];
          return selected
            ? Number(selected.probability || selected.confidence || 0)
            : 0;
        })(),
      abnormal:
        entry.abnormal ?? Boolean(entry.result?.any_finding_detected ?? false),
    };

    setHistory((previous) => {
      const filtered = previous.filter((item) => item.id !== normalized.id);
      return [normalized, ...filtered].slice(0, 12);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const value = useMemo(
    () => ({ history, addAnalysis, clearHistory }),
    [history],
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);

  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }

  return context;
}
