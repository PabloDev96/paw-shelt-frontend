import React, { useState } from "react";
import "./styles/CrearUsuario.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/config.js";
import { useOneFlightLoader } from "../hooks/useOneFlightLoader";

export default function CrearUsuario() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "TRABAJADOR",
  });

  // loader con mínimo 2s
  const { loading, runWithLoader, success, error } = useOneFlightLoader({ minMs: 2000 });

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const { nombre, email, password, rol } = usuario;

    // Validación básica
    if (!nombre || !email || !password || !rol) {
      return error("Campos incompletos", "Por favor completa todos los campos.");
    }

    if (!emailRegex.test(email)) {
      return error("Correo inválido", "Introduce un correo electrónico válido.");
    }

    if (!passwordRegex.test(password)) {
      return error(
        "Contraseña inválida",
        "Debe tener al menos 8 caracteres, incluyendo letras y números."
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

        success("Usuario creado", `${data.nombre || "El usuario"} fue registrado correctamente.`);

        // redirige después de un pequeño delay para dejar ver la alerta
        setTimeout(() => navigate("/animales"), 1200);
      } catch (err) {
        console.error(err);
        error("Error", err.message || "Algo salió mal.");
      }
    });
  };

  return (
    <div className="crearusuario-container">
      {/* Overlay loader */}
      {loading && (
        <div className="loader-overlay">
          <img src="/dogloader.gif" alt="Cargando..." className="loader-gif" />
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
        <input
          type="password"
          name="password"
          placeholder="Mínimo 8 caracteres, letras y números"
          value={usuario.password}
          onChange={handleChange}
          disabled={loading}
        />

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
