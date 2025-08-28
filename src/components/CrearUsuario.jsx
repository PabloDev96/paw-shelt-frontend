import React, { useState } from "react";
import "./styles/CrearUsuario.css";
import "./styles/Login.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/config.js";
import { useOneFlightLoader } from "../hooks/useOneFlightLoader";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { showError, showSuccess } from "../utils/alerts";

export default function CrearUsuario() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "TRABAJADOR",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // loader con mínimo 2s (solo para overlay/espera)
  const { loading, runWithLoader } = useOneFlightLoader({ minMs: 2000 });

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const { nombre, email, password, rol } = usuario;

    // Validación básica
    if (!nombre || !email || !password || !rol || !confirmPassword) {
      return showError("Campos incompletos", "Por favor completa todos los campos.");
    }

    if (!emailRegex.test(email)) {
      return showError("Correo inválido", "Introduce un correo electrónico válido.");
    }

    if (!passwordRegex.test(password)) {
      return showError(
        "Contraseña inválida",
        "Debe tener al menos 8 caracteres, incluyendo letras y números."
      );
    }

    if (password !== confirmPassword) {
      return showError(
        "Contraseñas no coinciden",
        "La Contraseña debe coincidir en ambos campos."
      );
    }

    await runWithLoader(async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": crypto?.randomUUID?.() || `user-${email}-${Date.now()}`,
          },
          body: JSON.stringify(usuario),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error al registrar usuario");
        }

        // Éxito con tu alerta
        await showSuccess(
          "Usuario creado",
          `${data.nombre || "El usuario"} fue registrado correctamente.`
        );

        // redirige después de mostrar el toast
        navigate("/animales");
      } catch (err) {
        console.error(err);
        showError("Error", err.message || "Algo salió mal.");
      }
    });
  };

  return (
    <div className="crearusuario-container">
      {loading && (
        <div className="loader-overlay">
          <img src="/dogloader.webp" alt="Cargando..." className="loader-gif" />
          <p className="loader-text">Procesando…</p>
        </div>
      )}

      <div className="crearusuario-box">
        <h2>Crear Usuario</h2>

        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          name="nombre"
          placeholder="Introduce el nombre"
          value={usuario.nombre}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          name="email"
          placeholder="Introduce el correo"
          value={usuario.email}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mínimo 8 caracteres, letras y números"
            value={usuario.password}
            onChange={handleChange}
            disabled={loading}
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        <label htmlFor="confirmPassword">Confirmar contraseña</label>
        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        <label htmlFor="rol">Rol</label>
        <select
          name="rol"
          value={usuario.rol}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="ADMIN">Administrador</option>
          <option value="TRABAJADOR">Trabajador</option>
          <option value="VOLUNTARIO">Voluntario</option>
        </select>

        <button onClick={handleSubmit} disabled={loading}>
          Registrar
        </button>
      </div>
    </div>
  );
}
