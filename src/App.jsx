import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import RutaProtegida from "./components/RutaProtegida";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Animales from "./components/Animales";
import Citas from "./components/Citas";
import CrearUsuario from "./components/CrearUsuario";
import Adopciones from "./components/Adopciones";
import Graficos from "./components/Graficos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas bajo Dashboard */}
        <Route
          path="/"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        >
          <Route path="panel" element={<div />} />
          <Route path="animales" element={<Animales />} />
          <Route path="citas" element={<Citas />} />
          <Route
            path="adopciones"
            element={
              <RutaProtegida rolRequerido="ADMIN">
                <Adopciones />
              </RutaProtegida>
            }
          />
          <Route
            path="graficos"
            element={
              <RutaProtegida rolRequerido="ADMIN">
                <Graficos />
              </RutaProtegida>
            }
          />
          <Route
            path="crear-usuario"
            element={
              <RutaProtegida rolRequerido="ADMIN">
                <CrearUsuario />
              </RutaProtegida>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
