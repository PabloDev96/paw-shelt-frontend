import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/Adopciones.css";
import { showSuccess, showError } from "../utils/alerts";
import { generarPDF } from "../utils/generatePDF.js";

const FormularioAdopcion = () => {
  const [animales, setAnimales] = useState([]);
  const [adoptantes, setAdoptantes] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [adoptanteSeleccionado, setAdoptanteSeleccionado] = useState(null);
  const [fechaAdopcion, setFechaAdopcion] = useState(null);
  const [observaciones, setObservaciones] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAnimales();
    fetchAdoptantes();
  }, []);

  const fetchAnimales = async () => {
    try {
      const res = await fetch("http://localhost:8080/animales/disponibles-para-adopcion", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnimales(data);
    } catch (err) {
      console.error("Error al cargar animales disponibles:", err);
    }
  };

  const fetchAdoptantes = async () => {
    try {
      const res = await fetch("http://localhost:8080/adoptantes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdoptantes(data);
    } catch (err) {
      console.error("Error al cargar adoptantes:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!animalSeleccionado || !adoptanteSeleccionado || !fechaAdopcion) {
      return showError("Campos obligatorios", "Selecciona animal, adoptante y fecha.");
    }

    const body = {
      animalId: animalSeleccionado.value,
      personaAdoptanteId: adoptanteSeleccionado.value,
      fechaAdopcion: fechaAdopcion.toISOString().split("T")[0],
      observaciones,
    };

    const res = await fetch("http://localhost:8080/adopciones", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const animalInfo = animales.find((a) => a.id === animalSeleccionado.value);
      const adoptanteInfo = adoptantes.find((a) => a.id === adoptanteSeleccionado.value);

      // ➊ Muestra el alert y espera a que termine el timer
      await showSuccess(
        "¡Adopción registrada!",
        `${animalInfo?.nombre} → ${adoptanteInfo?.nombre} (${fechaAdopcion.toLocaleDateString("es-ES")})`,
        1800 // <- duración del alert
      );

      // ➋ Cuando el alert se cierra, generamos/abrimos el PDF en nueva pestaña
      generarPDF(animalInfo, adoptanteInfo, fechaAdopcion, observaciones, { openInNewTab: true });

      // Limpiar formulario
      setAnimalSeleccionado(null);
      setAdoptanteSeleccionado(null);
      setFechaAdopcion(null);
      setObservaciones("");
    } else {
      let detalle = "";
      try { detalle = await res.text(); } catch { }
      showError("Error", detalle?.trim() || "No se pudo registrar la adopción");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-adopcion">
      <h3>Nueva Adopción</h3>

      <div className="adopciones-row">
        <div className="adopciones-field">
          <label>Animal</label>
          <Select
            options={animales.map((a) => ({ value: a.id, label: a.nombre }))}
            value={animalSeleccionado}
            onChange={setAnimalSeleccionado}
            placeholder="Seleccionar animal..."
            className="adopciones-select"
            classNamePrefix="adopciones"
          />
        </div>

        <div className="adopciones-field">
          <label>Adoptante</label>
          <Select
            options={adoptantes.map((p) => ({ value: p.id, label: p.nombre }))}
            value={adoptanteSeleccionado}
            onChange={setAdoptanteSeleccionado}
            placeholder="Seleccionar adoptante..."
            className="adopciones-select"
            classNamePrefix="adopciones"
          />
        </div>
      </div>


      <label>Fecha de adopción</label>
      <DatePicker
        selected={fechaAdopcion}
        onChange={setFechaAdopcion}
        dateFormat="dd/MM/yyyy"
        className="adopciones-datepicker"
        placeholderText="Elegir fecha"
      />

      <label>Observaciones</label>
      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={4}
        placeholder="Observaciones..."
      />

      <div className="adopciones-modal-actions">
        <button type="submit">Guardar</button>
        <button
          type="button"
          onClick={() => {
            setAnimalSeleccionado(null);
            setAdoptanteSeleccionado(null);
            setFechaAdopcion(null);
            setObservaciones("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default FormularioAdopcion;
