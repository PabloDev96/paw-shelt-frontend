import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../utils/alerts";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./styles/Login.css";

const MySwal = withReactContent(Swal);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    MySwal.fire({
      title: "¡Bienvenido a Pawshelt!",
      text: "Inicia sesión para empezar a gestionar tu refugio.",
      imageUrl: "/logo/pawshelt.png",
      imageWidth: 120,
      imageAlt: "Logo de Pawshelt",
      showConfirmButton: false,
      timer: 1500,
      background: "var(--light)",
      color: "var(--dark)",
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title'
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Por favor, completa todos los campos.");
      showError("Campos incompletos", "Debes ingresar usuario y contraseña.");
      return;
    }

    setError("");

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      localStorage.setItem("user", JSON.stringify({
        nombre: data.nombre,
        rol: data.rol
      }));


      await showSuccess("¡Login exitoso!", "Bienvenido a tu panel de gestión.", 2000);
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
        />
        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
