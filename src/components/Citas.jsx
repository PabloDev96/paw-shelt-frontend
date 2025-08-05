import React, { useEffect, useState } from "react";
import { FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import { showError, showSuccess, showConfirm } from "../utils/alerts";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/Citas.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
registerLocale("es", es);
export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [adoptantes, setAdoptantes] = useState([]);
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalAdoptante, setMostrarModalAdoptante] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({ descripcion: "", fechaHoraInicio: "", fechaHoraFin: "" });
  const [citaAEditar, setCitaAEditar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [adoptanteSeleccionado, setAdoptanteSeleccionado] = useState(null);
  const [nuevoAdoptante, setNuevoAdoptante] = useState({ nombre: "", email: "", telefono: "", direccion: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCitas();
    fetchAdoptantes();
  }, []);

  const fetchCitas = async () => {
    const res = await fetch("http://localhost:8080/citas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCitas(data);
  };

  const fetchAdoptantes = async () => {
    const res = await fetch("http://localhost:8080/adoptantes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAdoptantes(data);
  };

  const handleCrearAdoptante = async () => {
    const { nombre, email, telefono, direccion } = nuevoAdoptante;

    if (!nombre || !email || !telefono || !direccion) {
      return showError("Campos incompletos", "Todos los campos son obligatorios.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return showError("Correo no válido", "Introduce un email válido.");
    }

    const telefonoRegex = /^[0-9]{9}$/;
    if (!telefonoRegex.test(telefono)) {
      return showError("Teléfono no válido", "Debe contener exactamente 9 dígitos numéricos.");
    }

    const res = await fetch("http://localhost:8080/adoptantes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevoAdoptante),
    });

    if (res.ok) {
      setMostrarModalAdoptante(false);
      setNuevoAdoptante({ nombre: "", email: "", telefono: "", direccion: "" });
      fetchAdoptantes();
      showSuccess("Adoptante creado correctamente");
    } else {
      showError("Error al crear adoptante", "Revisa los datos o el servidor.");
    }
  };

  const handleCrearCita = async () => {
    if (!adoptanteSeleccionado) {
      return showError("Selecciona un adoptante");
    }

    const { descripcion, fechaHoraInicio, fechaHoraFin } = nuevaCita;

    if (!descripcion || !fechaHoraInicio || !fechaHoraFin) {
      return showError("Campos incompletos", "Todos los campos son obligatorios.");
    }

    if (new Date(fechaHoraFin) <= new Date(fechaHoraInicio)) {
      return showError("Fechas no válidas", "La fecha de fin debe ser posterior a la de inicio.");
    }

    const body = {
      titulo: `${adoptanteSeleccionado.nombre}`,
      descripcion,
      fechaHoraInicio,
      fechaHoraFin,
      personaAdoptanteId: adoptanteSeleccionado.id,
    };

    const res = await fetch("http://localhost:8080/citas", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMostrarModalCita(false);
      setNuevaCita({ descripcion: "", fechaHoraInicio: "", fechaHoraFin: "" });
      setAdoptanteSeleccionado(null);
      setBusqueda("");
      fetchCitas();
      showSuccess("Cita creada correctamente");
    } else {
      showError("Error al crear la cita", "Revisa los datos o el servidor.");
    }
  };


  const abrirModalEditar = (cita) => {
    setCitaAEditar(cita);
    setAdoptanteSeleccionado(
      adoptantes.find((a) => a.id === cita.personaAdoptanteId)
    );
    setNuevaCita({
      descripcion: cita.descripcion,
      fechaHoraInicio: cita.fechaHoraInicio,
      fechaHoraFin: cita.fechaHoraFin,
    });
    setMostrarModalEditar(true);
  };

  const handleActualizarCita = async () => {
    if (!citaAEditar || !adoptanteSeleccionado) return;

    const body = {
      titulo: `${adoptanteSeleccionado.nombre}`,
      descripcion: nuevaCita.descripcion,
      fechaHoraInicio: nuevaCita.fechaHoraInicio,
      fechaHoraFin: nuevaCita.fechaHoraFin,
      personaAdoptanteId: adoptanteSeleccionado.id,
    };

    const res = await fetch(`http://localhost:8080/citas/${citaAEditar.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMostrarModalEditar(false);
      setCitaAEditar(null);
      resetCitaForm();
      fetchCitas();
    }
  };

  const eliminarCita = async (id) => {
    const confirmado = await showConfirm("¿Eliminar cita?", "Esta acción no se puede deshacer.");

    if (!confirmado.isConfirmed) return;

    const res = await fetch(`http://localhost:8080/citas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchCitas();
      showSuccess("Cita eliminada");
    } else {
      showError("Error al eliminar cita");
    }
  };


  const resetCitaForm = () => {
    setNuevaCita({ descripcion: "", fechaHoraInicio: "", fechaHoraFin: "" });
    setAdoptanteSeleccionado(null);
    setBusqueda("");
  };

  const adoptantesFiltrados = adoptantes.filter((a) =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const renderCitaModal = (modoEditar = false) => (
    <div className="citas-modal-overlay">
      <div className="citas-modal">
        <h3>{modoEditar ? "Editar Cita" : "Nueva Cita"}</h3>

        <Select
          className="citas-select"
          classNamePrefix="citas"
          options={adoptantes.map((a) => ({ value: a.id, label: a.nombre }))}
          onChange={(selectedOption) =>
            setAdoptanteSeleccionado(
              adoptantes.find((a) => a.id === selectedOption?.value)
            )
          }
          value={
            adoptanteSeleccionado
              ? { value: adoptanteSeleccionado.id, label: adoptanteSeleccionado.nombre }
              : null
          }
          placeholder="Seleccionar adoptante..."
          isClearable
        />

        <DatePicker
          selected={nuevaCita.fechaHoraInicio ? new Date(nuevaCita.fechaHoraInicio) : null}
          onChange={(date) => setNuevaCita({ ...nuevaCita, fechaHoraInicio: date })}
          showTimeSelect
          timeIntervals={30}
          timeCaption="Hora"
          dateFormat="dd/MM/yyyy HH:mm"
          locale="es"
          placeholderText="Inicio"
          className="citas-datepicker"
        />

        <DatePicker
          selected={nuevaCita.fechaHoraFin ? new Date(nuevaCita.fechaHoraFin) : null}
          onChange={(date) => setNuevaCita({ ...nuevaCita, fechaHoraFin: date })}
          showTimeSelect
          timeIntervals={30}
          timeCaption="Hora"
          dateFormat="dd/MM/yyyy HH:mm"
          locale="es"
          placeholderText="Fin"
          className="citas-datepicker"
        />

        <textarea
          placeholder="Descripción"
          value={nuevaCita.descripcion}
          onChange={(e) => setNuevaCita({ ...nuevaCita, descripcion: e.target.value })}
        />
        <div className="citas-modal-actions">
          <button onClick={modoEditar ? handleActualizarCita : handleCrearCita}>Guardar</button>
          <button
            onClick={() => {
              modoEditar ? setMostrarModalEditar(false) : setMostrarModalCita(false);
              setCitaAEditar(null);
              resetCitaForm();
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="citas-container">
      <h2>Listado de Citas</h2>

      <div className="citas-acciones">
        <button className="citas-btn" onClick={() => setMostrarModalAdoptante(true)}>
          Crear ficha Adoptante
        </button>
        <button className="citas-btn" onClick={() => setMostrarModalCita(true)}>
          Crear Cita
        </button>
      </div>

      <div className="citas-grid">
        {citas.length === 0 ? (
          <p>No hay citas registradas.</p>
        ) : (
          citas.map((cita) => (
            <div key={cita.id} className="citas-card">
              <div className="citas-info">
                <h3>{cita.titulo}</h3>
                <p><strong>Inicio:</strong> {new Date(cita.fechaHoraInicio).toLocaleString("es-ES")}</p>
                <p><strong>Fin:</strong> {new Date(cita.fechaHoraFin).toLocaleString("es-ES")}</p>
                <p><strong>Descripción:</strong> {cita.descripcion}</p>
                <div className="citas-botones">
                  <button
                    className="icon-btn editar-btn"
                    onClick={() => abrirModalEditar(cita)}
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Editar"
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    className="icon-btn eliminar-btn"
                    onClick={() => eliminarCita(cita.id)}
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Eliminar"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Adoptante */}
      {mostrarModalAdoptante && (
        <div className="citas-modal-overlay">
          <div className="citas-modal">
            <h3>Nueva Persona Adoptante</h3>
            <input placeholder="Nombre" value={nuevoAdoptante.nombre} onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, nombre: e.target.value })} />
            <input placeholder="Email" value={nuevoAdoptante.email} onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, email: e.target.value })} />
            <input placeholder="Teléfono" value={nuevoAdoptante.telefono} onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, telefono: e.target.value })} />
            <input placeholder="Dirección" value={nuevoAdoptante.direccion} onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, direccion: e.target.value })} />
            <div className="citas-modal-actions">
              <button onClick={handleCrearAdoptante}>Guardar</button>
              <button onClick={() => setMostrarModalAdoptante(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Cita */}
      {mostrarModalCita && renderCitaModal(false)}

      {/* Modal Editar Cita */}
      {mostrarModalEditar && renderCitaModal(true)}
    </div>
  );
}
