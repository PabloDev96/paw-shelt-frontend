import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Simula una función para extraer datos del token o de localStorage
const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  return token && user ? user : null;
};

export default function RutaProtegida({ children, rolRequerido }) {
  const usuario = getUserFromToken();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (rolRequerido && usuario.rol !== rolRequerido) {
    return <Navigate to="/panel" replace />;
  }

  // Si hay `children`, esta ruta es una hoja protegida
  // Si no, se usa como layout protegido (como en App.jsx)
  return children ? children : <Outlet />;
}
