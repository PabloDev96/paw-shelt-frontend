import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import { LuDog } from "react-icons/lu";
import { IoCalendarOutline, IoLogOutOutline } from "react-icons/io5";
import { MdEuro, MdPersonAdd } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { showSuccess } from "../utils/alerts"; // 👈 asegúrate que este import funciona

export default function Dashboard() {
  const navigate = useNavigate();

  // ⬇️ ALERTA DE BIENVENIDA UNA VEZ POR SESIÓN
  useEffect(() => {
    // Mostrar solo si no se mostró aún esta sesión
    if (!sessionStorage.getItem("welcomeShown")) {
      setTimeout(() => {
        showSuccess(
          "¡Bienvenido a Pawshelt! 🐾",
          "Administra tus animales, citas y más desde aquí.",
          1500
        );
        sessionStorage.setItem("welcomeShown", "true");
      }, 200); // pequeño retraso para evitar conflicto al renderizar
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("welcomeShown"); // para que vuelva a mostrarse al loguear de nuevo
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="logo">
          <img src="/logo/pawshelt.png" alt="Pawshelt" />
        </div>
        <nav className="dashboard-nav">
          <NavLink to="/animales" data-tooltip-id="tooltip" data-tooltip-content="Animales"><LuDog /></NavLink>
          <NavLink to="/citas" data-tooltip-id="tooltip" data-tooltip-content="Citas"><IoCalendarOutline /></NavLink>
          <NavLink to="/finanzas" data-tooltip-id="tooltip" data-tooltip-content="Finanzas"><MdEuro /></NavLink>
          <NavLink to="/crear-usuario" data-tooltip-id="tooltip" data-tooltip-content="Crear usuario"><MdPersonAdd /></NavLink>
        </nav>
        <button className="logout-icon-btn" data-tooltip-id="tooltip" data-tooltip-content="Cerrar sesión" onClick={handleLogout}>
          <IoLogOutOutline />
        </button>
      </header>

      <main className="dashboard-content">
        <Outlet />
      </main>
      <Tooltip id="tooltip" place="top" />
    </div>
  );
}
