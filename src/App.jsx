import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import PanelPrincipal from "./components/PanelPrincipal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/panel" element={<PanelPrincipal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

