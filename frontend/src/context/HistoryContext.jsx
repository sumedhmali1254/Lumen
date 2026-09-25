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

// Ensure result has clean and safe data for storage
function sanitizeResult(result) {
  if (!result || typeof result !== "object") return {};

  const clean = {
    model_used: result.model_used || "",
    any_finding_detected: Boolean(result.any_finding_detected),
    verdict_text: result.verdict_text || "",
    primary_disease: result.primary_disease || "",
    selected_disease: result.selected_disease || "",
    heatmap: result.heatmap || "",
    quadrants: Array.isArray(result.quadrants) ? result.quadrants : (result.regions || []),
    findings: Array.isArray(result.findings)
      ? result.findings.map((f) => ({
          disease: f.disease || f.name || "",
          raw_key: f.raw_key || f.key || "",
          name: f.name || f.disease || "",
          probability: Number(f.probability ?? f.confidence ?? 0),
          confidence: Number(f.confidence ?? f.probability ?? 0),
          threshold: Number(f.threshold ?? 0.5),
          detected: Boolean(f.detected ?? f.positive),
          positive: Boolean(f.positive ?? f.detected),
          risk_level: f.risk_level || (f.detected ? "High" : "Low"),
          has_heatmap: Boolean(f.has_heatmap),
        }))
      : [],
    image_meta: result.image_meta || {},
  };

  return clean;
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    return safeParseHistory(window.localStorage.getItem(STORAGE_KEY));
  });

  // Sync to localStorage whenever history changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // If localStorage is full, save a lighter version (strip heavy base64 heatmaps/previews)
      try {
        const lightweight = history.map((item) => ({
          ...item,
          preview: item.preview?.length > 100000 ? "" : item.preview,
          result: {
            ...item.result,
            heatmap: "",
          },
        }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      } catch {
        console.warn("Storage quota exceeded, unable to persist history.");
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
      result: sanitizeResult(entry.result || {}),
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
      return [normalized, ...filtered].slice(0, 20);
    });
  };

  const deleteAnalysis = (id) => {
    if (!id) return;
    setHistory((previous) => previous.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({ history, addAnalysis, deleteAnalysis, clearHistory }),
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
