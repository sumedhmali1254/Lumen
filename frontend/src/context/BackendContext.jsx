import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../data/mockData";

const BackendContext = createContext(null);

export function BackendProvider({ children }) {
  const [status, setStatus] = useState("connecting"); // "connected" | "disconnected" | "connecting"
  const [healthInfo, setHealthInfo] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Try API_BASE_URL first, then 127.0.0.1 fallback
      let res;
      try {
        res = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        if (API_BASE_URL.includes("localhost")) {
          const fallbackUrl = API_BASE_URL.replace("localhost", "127.0.0.1");
          res = await fetch(`${fallbackUrl}/health`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
        } else {
          throw err;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.status === "ok") {
          setHealthInfo(data);
          setStatus("connected");
          setErrorMessage("");
          setLastChecked(new Date());
          return true;
        }
      }
      setStatus("disconnected");
      setErrorMessage("Backend returned unhealthy status");
      setLastChecked(new Date());
      return false;
    } catch (err) {
      setStatus("disconnected");
      setErrorMessage(err.message || "Failed to reach backend server");
      setHealthInfo(null);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Poll every 8 seconds
    const interval = setInterval(checkHealth, 8000);

    const handleFocus = () => checkHealth();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
    };
  }, [checkHealth]);

  const value = {
    status,
    isOnline: status === "connected",
    healthInfo,
    lastChecked,
    errorMessage,
    checkHealth,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
}
