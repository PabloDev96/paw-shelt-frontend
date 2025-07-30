import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Animales from "./components/Animales";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/panel" element={<Dashboard />} />
        <Route path="/animales" element={<Animales />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

