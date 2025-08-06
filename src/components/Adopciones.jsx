import React, { useState } from "react";
import FormularioAdopcion from "./FormularioAdopcion";
import ListadoAdopciones from "./ListadoAdopciones";
import { FaPlus, FaList } from "react-icons/fa";
import "./styles/Citas.css"; // Reutilizamos el CSS de Citas

export default function Adopciones() {
  const [modoVista, setModoVista] = useState("listado");

  return (
    <div className="citas-container">
      {/* Botones estilo Citas */}
      <div className="citas-vista-switch">
        <button
          className={modoVista === "listado" ? "activo" : ""}
          onClick={() => setModoVista("listado")}
        >
          <FaList style={{ marginRight: "8px" }} />
          Ver Listado
        </button>
        <button
          className={modoVista === "crear" ? "activo" : ""}
          onClick={() => setModoVista("crear")}
        >
          <FaPlus style={{ marginRight: "8px" }} />
          Nueva Adopción
        </button>
      </div>

      {/* Contenido dinámico */}
      {modoVista === "crear" && <FormularioAdopcion />}
      {modoVista === "listado" && <ListadoAdopciones />}
    </div>
  );
}
