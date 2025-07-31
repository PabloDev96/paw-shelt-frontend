import React from "react";
import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children, rolRequerido }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // Si no hay usuario o no tiene el rol necesario, redirige
  if (!user || user.rol !== rolRequerido) {
    return <Navigate to="/panel" replace />;
  }

  return children;
}
