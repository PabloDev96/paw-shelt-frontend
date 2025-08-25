import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../utils/alerts";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./styles/Login.css";
import { API_URL } from "../utils/config.js";

const MySwal = withReactContent(Swal);
const PING_PATH = "/ping";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [serverReady, setServerReady] = useState(false);
  const navigate = useNavigate();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;

    const wakeServer = async () => {
      // Parámetros de reintento
      const MAX_WAIT_MS = 300_000; // hasta 5 min por si el cold start es largo
      const START_DELAY = 800;
      const MAX_DELAY = 5_000;
      const REQ_TIMEOUT = 8_000;

      const pingUrl = `${API_URL}${PING_PATH}`;

      // 1) ALERTA de "Despertando…" (bloqueante con loader)
      MySwal.fire({
        title: "Despertando el servidor…",
        html: `<small>Si estaba en frío, puede tardar unos segundos.</small>`,
        didOpen: () => {
          MySwal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: "var(--light)",
        color: "var(--dark)",
        showConfirmButton: false,
      });

      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const fetchWithTimeout = async (url, options = {}) => {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), REQ_TIMEOUT);
        try {
          const res = await fetch(url, { ...options, signal: ctrl.signal, cache: "no-store" });
          clearTimeout(id);
          return res;
        } catch (e) {
          clearTimeout(id);
          throw e;
        }
      };

      let delay = START_DELAY;
      const start = Date.now();

      while (Date.now() - start < MAX_WAIT_MS) {
        try {
          const res = await fetchWithTimeout(pingUrl, { method: "GET" });
          if (res.ok) {
            // Si responde JSON, valida status; si no, con 200 basta
            const data = await res.json().catch(() => null);
            if (!data || data?.status?.toUpperCase?.() === "UP") {
              setServerReady(true);
              MySwal.close(); // cierra "Despertando…"

              // 2) ALERTA de BIENVENIDA (como la tenías antes)
              MySwal.fire({
                title: "¡Bienvenido a Pawshelt!",
                text: "Inicia sesión para empezar a gestionar tu refugio.",
                imageUrl: "/logo/pawshelt.png",
                imageWidth: 120,
                imageAlt: "Logo de Pawshelt",
                showConfirmButton: false,
                timer: 2000,
                background: "var(--light)",
                color: "var(--dark)",
                customClass: { popup: "swal-popup", title: "swal-title" },
              });

              return;
            }
          }
        } catch {
          // Ignorar y reintentar
        }
        await sleep(delay);
        delay = Math.min(MAX_DELAY, Math.floor(delay * 1.6));
      }

      // Si no se pudo confirmar
      setServerReady(false);
      MySwal.update({
        title: "No se pudo confirmar el arranque",
        html: "<small>Se agotó el tiempo de espera. Revisa logs o vuelve a intentar.</small>",
        icon: "error",
        showConfirmButton: true,
        confirmButtonText: "Entendido",
      });
    };

    wakeServer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Por favor, completa todos los campos.");
      showError("Campos incompletos", "Debes ingresar usuario y contraseña.");
      return;
    }

    if (!serverReady) {
      showError(
        "Servidor no listo",
        "Estamos terminando de despertar el servidor. Intenta de nuevo en unos segundos."
      );
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Error: ${errorText}`);
        showError("Error de autenticación", errorText || "Credenciales incorrectas.");
        return;
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ nombre: data.nombre, rol: data.rol }));

      await showSuccess("¡Login exitoso!", "Redirigiendo al panel...", 2000);
      localStorage.setItem("showLoginSuccess", "true");
      navigate("/panel");
    } catch (error) {
      console.error("Error al hacer login:", error);
      setError("Error de conexión con el servidor.");
      showError("Error de conexión", "No se pudo contactar al servidor.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        {error && <p className="error-message">{error}</p>}

        <label>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu usuario"
          disabled={!serverReady}
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
          disabled={!serverReady}
        />

        <button type="submit" disabled={!serverReady}>
          {serverReady ? "Entrar" : "Despertando…"}
        </button>
      </form>
    </div>
  );
}
