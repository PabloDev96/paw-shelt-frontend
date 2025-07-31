import React, { useState } from "react";
import "./styles/CrearUsuario.css";
import { showSuccess, showError } from "../utils/alerts";
import { useNavigate } from "react-router-dom";

export default function CrearUsuario() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "TRABAJADOR",
  });

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nombre, email, password, rol } = usuario;

    // Validación básica
    if (!nombre || !email || !password || !rol) {
      showError("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      showSuccess("Usuario creado", `${data.nombre || "El usuario"} fue registrado correctamente.`, 2000);

      navigate("/panel");
    } catch (err) {
      console.error(err);
      showError("Error", err.message || "Algo salió mal.");
    }
  };

  return (
    <div className="crearusuario-container">
      <div className="crearusuario-box">
        <h2>Crear Usuario</h2>

        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          name="nombre"
          placeholder="Introduce el nombre"
          value={usuario.nombre}
          onChange={handleChange}
        />

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          name="email"
          placeholder="Introduce el correo"
          value={usuario.email}
          onChange={handleChange}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          name="password"
          placeholder="Introduce la contraseña"
          value={usuario.password}
          onChange={handleChange}
        />

        <label htmlFor="rol">Rol</label>
        <select name="rol" value={usuario.rol} onChange={handleChange}>
          <option value="ADMIN">Administrador</option>
          <option value="TRABAJADOR">Trabajador</option>
          <option value="VOLUNTARIO">Voluntario</option>
        </select>

        <button onClick={handleSubmit}>Registrar</button>
      </div>
    </div>
  );
}
