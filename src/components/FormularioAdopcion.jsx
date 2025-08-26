import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/Adopciones.css";
import { showError } from "../utils/alerts";
import { generarPDF } from "../utils/generatePDF.js";
import { API_URL } from "../utils/config.js";
import { useOneFlightLoader } from "../hooks/useOneFlightLoader";

const FormularioAdopcion = () => {
  const [animales, setAnimales] = useState([]);
  const [adoptantes, setAdoptantes] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [adoptanteSeleccionado, setAdoptanteSeleccionado] = useState(null);
  const [fechaAdopcion, setFechaAdopcion] = useState(null);
  const [observaciones, setObservaciones] = useState("");

  const token = localStorage.getItem("token");

  // Loader mínimo 2s + anti reentradas + alertas tras loader
  const { loading, runWithLoader, success, error } = useOneFlightLoader({ minMs: 2000 });

  useEffect(() => {
    fetchAnimales();
    fetchAdoptantes();
  }, []);

  const fetchAnimales = async () => {
    try {
      const res = await fetch(`${API_URL}/animales/disponibles-para-adopcion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar los animales.");
      const data = await res.json();
      setAnimales(data);
    } catch (err) {
      console.error("Error al cargar animales disponibles:", err);
      showError("Error", err.message || "No se pudieron cargar los animales.");
    }
  };

  const fetchAdoptantes = async () => {
    try {
      const res = await fetch(`${API_URL}/adoptantes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar los adoptantes.");
      const data = await res.json();
      setAdoptantes(data);
    } catch (err) {
      console.error("Error al cargar adoptantes:", err);
      showError("Error", err.message || "No se pudieron cargar los adoptantes.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!animalSeleccionado || !adoptanteSeleccionado || !fechaAdopcion) {
      return showError("Campos obligatorios", "Selecciona animal, adoptante y fecha.");
    }

    await runWithLoader(async () => {
      const body = {
        animalId: animalSeleccionado.value,
        personaAdoptanteId: adoptanteSeleccionado.value,
        fechaAdopcion: fechaAdopcion.toISOString().split("T")[0],
        observaciones,
      };

      const res = await fetch(`${API_URL}/adopciones`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": crypto?.randomUUID?.() || `adoption-${animalSeleccionado.value}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const animalInfo = animales.find((a) => a.id === animalSeleccionado.value);
        const adoptanteInfo = adoptantes.find((a) => a.id === adoptanteSeleccionado.value);

        // 1) Muestra éxito DESPUÉS del loader
        const detalle = `${animalInfo?.nombre} → ${adoptanteInfo?.nombre} (${fechaAdopcion.toLocaleDateString("es-ES")})`;
        success("¡Adopción registrada!", detalle);

        // 2) Abre el PDF un poco después para dejar ver el alert (≈1.8s)
        setTimeout(() => {
          generarPDF(animalInfo, adoptanteInfo, fechaAdopcion, observaciones, { openInNewTab: true });
        }, 1800);

        // 3) Limpia formulario
        setAnimalSeleccionado(null);
        setAdoptanteSeleccionado(null);
        setFechaAdopcion(null);
        setObservaciones("");
      } else {
        let detalle = "";
        try { detalle = await res.text(); } catch {}
        error("Error", detalle?.trim() || "No se pudo registrar la adopción");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-adopcion">
      {/* Overlay loader global */}
      {loading && (
        <div className="loader-overlay">
          <img src="/dogloader.gif" alt="Cargando..." className="loader-gif" />
          <p className="loader-text">Procesando…</p>
        </div>
      )}

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
            isDisabled={loading}
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
            isDisabled={loading}
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
        disabled={loading}
      />

      <label>Observaciones</label>
      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={4}
        placeholder="Observaciones..."
        disabled={loading}
      />

      <div className="adopciones-modal-actions">
        <button type="submit" disabled={loading}>Guardar</button>
        <button
          type="button"
          onClick={() => {
            if (loading) return;
            setAnimalSeleccionado(null);
            setAdoptanteSeleccionado(null);
            setFechaAdopcion(null);
            setObservaciones("");
          }}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default FormularioAdopcion;
