import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import { LuDog } from "react-icons/lu";
import { IoCalendarOutline, IoLogOutOutline } from "react-icons/io5";
import { MdEuro, MdPersonAdd } from "react-icons/md";
import { Tooltip } from 'react-tooltip';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">

        <div className="header-left">
          <div className="logo">
            <img src="/logo/pawshelt.png" alt="Pawshelt" />
            <div className="usuario-info">
              <span>{user?.nombre}</span>
              <span className="rol">{user?.rol}</span>
            </div>
          </div>
        </div>

        <nav className="header-center dashboard-nav">
          <NavLink to="/animales" data-tooltip-id="tooltip" data-tooltip-content="Animales">
            <LuDog />
          </NavLink>
          <NavLink to="/citas" data-tooltip-id="tooltip" data-tooltip-content="Citas">
            <IoCalendarOutline />
          </NavLink>

          {user?.rol === "ADMIN" && (
            <>
              <NavLink to="/finanzas" data-tooltip-id="tooltip" data-tooltip-content="Finanzas">
                <MdEuro />
              </NavLink>
              <NavLink to="/crear-usuario" data-tooltip-id="tooltip" data-tooltip-content="Crear usuario">
                <MdPersonAdd />
              </NavLink>
            </>
          )}
        </nav>

        <div className="header-right">
          <button
            className="logout-icon-btn"
            data-tooltip-id="menu-tip"
            data-tooltip-content="Cerrar sesión"
            onClick={handleLogout}
          >
            <IoLogOutOutline />
          </button>
        </div>

      </header>

      <main className="dashboard-content">
        <Outlet />
      </main>

      <Tooltip id="tooltip" place="top" />
      <Tooltip id="menu-tip" place="left" />
      
    </div>
  );
}
