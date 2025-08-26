import { useCallback, useRef, useState } from "react";
import { showSuccess, showError } from "../utils/alerts";

/**
 * Hook para ejecutar una acción con:
 * - Loader mínimo (minMs)
 * - Anti reentrada (una sola petición en curso)
 * - Alerta (success/error) DESPUÉS de quitar el loader
 *
 * Uso:
 *   const { loading, runWithLoader, setAlert, success, error } = useOneFlightLoader({ minMs: 1500 });
 *   await runWithLoader(async () => {
 *     // ... tu fetch
 *     success("Guardado", "Todo correcto");
 *   });
 **/
export function useOneFlightLoader({ minMs = 1500 } = {}) {
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);      // anti doble click
  const alertRef = useRef(null);      // alerta pendiente

  const waitMinTime = (start, cb) => {
    const elapsed = Date.now() - start;
    if (elapsed < minMs) setTimeout(cb, minMs - elapsed);
    else cb();
  };

  const setAlert = useCallback((payload) => {
    // payload: { type: "success" | "error", title: string, text?: string }
    alertRef.current = payload;
  }, []);

  // helpers cómodos:
  const success = useCallback((title, text) => setAlert({ type: "success", title, text }), [setAlert]);
  const error   = useCallback((title, text) => setAlert({ type: "error",   title, text }), [setAlert]);

  const flushAlert = () => {
    const a = alertRef.current;
    if (!a) return;
    if (a.type === "success") showSuccess(a.title, a.text);
    if (a.type === "error")   showError(a.title, a.text);
    alertRef.current = null;
  };

  const runWithLoader = useCallback(async (fn) => {
    if (lockRef.current) return;   // evita reentradas
    lockRef.current = true;

    alertRef.current = null;       // limpia alerta previa
    const start = Date.now();
    setLoading(true);

    try {
      const result = await fn();
      waitMinTime(start, () => {
        setLoading(false);
        flushAlert();              // dispara alerta después del loader
      });
      return result;
    } catch (e) {
      waitMinTime(start, () => {
        setLoading(false);
        flushAlert();
      });
      throw e;
    } finally {
      lockRef.current = false;
    }
  }, [minMs]);

  return { loading, runWithLoader, setAlert, success, error };
}
