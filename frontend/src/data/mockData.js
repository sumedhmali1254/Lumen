// ═══════════════════════════════════════
// LUMEN — API Configuration
// ═══════════════════════════════════════

// Dev toggle: set to true to use mock data, false for live API
export const USE_MOCK_DATA = false;

export const API_BASE_URL = "http://localhost:8000";

// Empty fallbacks to prevent import errors in components
export const MOCK_XRAY_SVG = "";
export const MOCK_HEATMAP_SVG = "";
export const MOCK_RESPONSE = null;
export const MOCK_RESPONSE_NORMAL = null;
export const MOCK_HISTORY = [];

function normalizePredictionResponse(data) {
  if (!data || typeof data !== "object") return data;

  const normalized = { ...data };
  const heatmaps = normalized.heatmaps || normalized.all_heatmaps || {};
  const regionsByDisease = normalized.regions_by_disease || {};

  const normalizedHeatmaps = {};
  Object.entries(heatmaps).forEach(([disease, image]) => {
    normalizedHeatmaps[disease] = {
      image,
      quadrants: regionsByDisease[disease] || [],
    };
  });

  normalized.all_heatmaps = normalizedHeatmaps;

  if (!normalized.heatmap) {
    const fallbackDisease =
      normalized.selected_disease ||
      normalized.primary_disease ||
      Object.keys(heatmaps)[0] ||
      null;
    normalized.heatmap = fallbackDisease ? heatmaps[fallbackDisease] || "" : "";
  }

  if (!normalized.quadrants) {
    const fallbackDisease =
      normalized.selected_disease ||
      normalized.primary_disease ||
      Object.keys(regionsByDisease)[0] ||
      null;
    normalized.quadrants = fallbackDisease
      ? regionsByDisease[fallbackDisease] || []
      : [];
  }

  return normalized;
}

// ── API Helper ──
export async function analyzeXray(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict?model=multilabel`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Prediction failed");
  }

  const payload = await response.json();
  return normalizePredictionResponse(payload);
}
