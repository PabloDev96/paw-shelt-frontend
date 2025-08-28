import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { showError } from "../utils/alerts";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./styles/Login.css";
import { API_URL } from "../utils/config.js";

const MySwal = withReactContent(Swal);
const PING_PATH = "/ping";
const MIN_LOADER_MS = 3000; // mínimo de 3 segundos

const waitMinTime = (start, action) => {
  const elapsed = Date.now() - start;
  if (elapsed < MIN_LOADER_MS) {
    setTimeout(action, MIN_LOADER_MS - elapsed);
  } else {
    action();
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const skipWelcome =
    location.state?.skipWelcome === true ||
    sessionStorage.getItem("skipLoginWelcome") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [serverReady, setServerReady] = useState(skipWelcome); // 👈 listo desde el logout
  const [isWaking, setIsWaking] = useState(!skipWelcome); // 👈 no mostrar loader si logout
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstRun = useRef(true);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;

    if (skipWelcome) {
      // limpiar la marca para futuros accesos normales
      sessionStorage.removeItem("skipLoginWelcome");
      return; // 👈 no ejecuta wakeServer
    }

    const wakeServer = async () => {
      const MAX_WAIT_MS = 300_000;
      const START_DELAY = 800;
      const MAX_DELAY = 5_000;
      const REQ_TIMEOUT = 8_000;

      const pingUrl = `${API_URL}${PING_PATH}`;
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
      const startWake = Date.now();
      setIsWaking(true);

      while (Date.now() - startWake < MAX_WAIT_MS) {
        try {
          const res = await fetchWithTimeout(pingUrl, { method: "GET" });
          if (res.ok) {
            setServerReady(true);

            waitMinTime(startWake, () => {
              setIsWaking(false);

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
            });

            return;
          }
        } catch {
          // reintenta
        }
        await sleep(delay);
        delay = Math.min(MAX_DELAY, Math.floor(delay * 1.6));
      }

      setServerReady(false);
      waitMinTime(startWake, () => setIsWaking(false));
      MySwal.fire({
        title: "No se pudo confirmar el arranque",
        text: "Se agotó el tiempo de espera. Revisa los logs o vuelve a intentar.",
        icon: "error",
        confirmButtonText: "Entendido",
        background: "var(--light)",
        color: "var(--dark)",
      });
    };

    wakeServer();
  }, [skipWelcome]);

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
    const startSubmit = Date.now();
    setIsSubmitting(true);

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
        waitMinTime(startSubmit, () => setIsSubmitting(false));
        return;
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ nombre: data.nombre, rol: data.rol }));
      localStorage.setItem("showLoginSuccess", "true");

      waitMinTime(startSubmit, () => navigate("/animales"));
    } catch (error) {
      console.error("Error al hacer login:", error);
      setError("Error de conexión con el servidor.");
      showError("Error de conexión", "No se pudo contactar al servidor.");
      waitMinTime(startSubmit, () => setIsSubmitting(false));
    }
  };

  const disabled = !serverReady || isSubmitting;

  return (
    <div className="login-container">
      {(isWaking || isSubmitting) && (
        <div className="loader-overlay">
          <img src="/dogloader.gif" alt="Cargando..." className="loader-gif" />
          <p className="loader-text">
            {isWaking ? "Despertando servidor…" : "Iniciando sesión…"}
          </p>
        </div>
      )}

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        {error && <p className="error-message">{error}</p>}

        <label>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu usuario"
          disabled={disabled}
        />

        <label>Contraseña</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            disabled={disabled}
            aria-label="Contraseña"
          />

          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            disabled={disabled}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        <button type="submit" disabled={disabled}>
          {serverReady && !isSubmitting ? "Entrar" : "Espere…"}
        </button>
      </form>
    </div>
  );
}
