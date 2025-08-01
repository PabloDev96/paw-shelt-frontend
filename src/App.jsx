import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import RutaProtegida from "./components/RutaProtegida";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Animales from "./components/Animales";
{/*import Citas from "./components/Citas";*/}

import CrearUsuario from "./components/CrearUsuario";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Dashboard layout con rutas protegidas */}
        <Route element={<Dashboard />}>
          <Route path="/panel" element={<div></div>} />
          <Route path="/animales" element={<Animales />} />
          {/* <Route path="/citas" element={<Citas />} /> */}
          {/* Solo ADMIN puede acceder */}
          <Route
            path="/crear-usuario"
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
