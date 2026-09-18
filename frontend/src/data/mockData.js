// ═══════════════════════════════════════
// LUMEN — API Configuration
// ═══════════════════════════════════════

// Dev toggle: set to true to use mock data, false for live API
export const USE_MOCK_DATA = false;

export const API_BASE_URL = 'http://localhost:8000';

// Empty fallbacks to prevent import errors in components
export const MOCK_XRAY_SVG = '';
export const MOCK_HEATMAP_SVG = '';
export const MOCK_RESPONSE = null;
export const MOCK_RESPONSE_NORMAL = null;
export const MOCK_HISTORY = [];

// ── API Helper ──
export async function analyzeXray(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Prediction failed");
  return await response.json();
}