import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  return token && user ? user : null;
};

export default function RutaProtegida({ children, rolRequerido, rolesPermitidos }) {
  const usuario = getUserFromToken();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  // Soporta múltiples roles
  if (Array.isArray(rolesPermitidos) && rolesPermitidos.length > 0) {
    if (!rolesPermitidos.includes(usuario.rol)) {
      return <Navigate to="/panel" replace />;
    }
  } else if (rolRequerido) {
    // Compatibilidad con tu prop actual
    if (usuario.rol !== rolRequerido) {
      return <Navigate to="/panel" replace />;
    }
  }

  return children ? children : <Outlet />;
}
