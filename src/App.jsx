import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; // ahora es layout
import Animales from "./components/Animales";
import CrearUsuario from "./components/CrearUsuario";
// puedes importar más secciones aquí si las agregas

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Dashboard layout con contenido anidado */}
        <Route element={<Dashboard />}>
          <Route path="/panel" element={<div></div>} />
          <Route path="/animales" element={<Animales />} />
          <Route path="/crear-usuario" element={<CrearUsuario />} />
          {/* Aquí pondré futiras rutas como /citas, /finanzas, etc. */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
