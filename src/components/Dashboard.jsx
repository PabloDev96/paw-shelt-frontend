import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaHouseChimneyMedical } from "react-icons/fa6";
import "./styles/Dashboard.css";
import { LuDog } from "react-icons/lu";
import { IoCalendarOutline, IoLogOutOutline } from "react-icons/io5";
import { MdEuro, MdPersonAdd, MdOutlineQueryStats } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { showWelcomeDashboard } from "../utils/alerts";
import { GiDogHouse } from "react-icons/gi";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const shouldShow = localStorage.getItem("showLoginSuccess");
    if (shouldShow) {
      showWelcomeDashboard(user?.nombre || "");
      localStorage.removeItem("showLoginSuccess");
    }
  }, []);

  useEffect(() => {
    const el = document.getElementById("app-header");
    if (!el) return;

    const setHeaderH = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
    };

    setHeaderH();

    const ro = new ResizeObserver(setHeaderH);
    ro.observe(el);

    window.addEventListener("resize", setHeaderH);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setHeaderH);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header" id="app-header">
        <div className="header-left">
          <div className="logo">
            <img src="/logo/pawshelt.png" alt="Pawshelt" />
            <span className="logo-text">PawShelt</span>
          </div>
        </div>

        <nav className="header-center dashboard-nav">
          <NavLink
            to="/animales"
            className={({ isActive }) => (isActive ? "active" : "")}
            data-tooltip-id="tooltip"
            data-tooltip-content="Animales"
          >
            <LuDog />
          </NavLink>
          <NavLink
            to="/citas"
            className={({ isActive }) => (isActive ? "active" : "")}
            data-tooltip-id="tooltip"
            data-tooltip-content="Citas"
          >
            <IoCalendarOutline />
          </NavLink>
          {user?.rol === "ADMIN" && (
            <>
              <NavLink
                to="/adopciones"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-tooltip-id="tooltip"
                data-tooltip-content="Adopciones"
              >
                <GiDogHouse />
              </NavLink>

              <NavLink
                to="/graficos"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-tooltip-id="tooltip"
                data-tooltip-content="Estadísticas"
              >
                <MdOutlineQueryStats />
              </NavLink>

              <NavLink
                to="/crear-usuario"
                className={({ isActive }) => (isActive ? "active" : "")}
                data-tooltip-id="tooltip"
                data-tooltip-content="Crear usuario"
              >
                <MdPersonAdd />
              </NavLink>
            </>
          )}
        </nav>

        <div className="header-right">
          <div className="usuario-info">
            <span>{user?.nombre}</span>
            <span className="rol">{user?.rol}</span>
          </div>
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
