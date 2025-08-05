import React, { useEffect, useState } from "react";
import { IoMdPerson } from "react-icons/io";
import { FaPencilAlt, FaTrashAlt, FaPlus } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
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
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [errorFechaInvalida, setErrorFechaInvalida] = useState(false);
  const [mostrarModalFechaInvalida, setMostrarModalFechaInvalida] = useState(false);



  const token = localStorage.getItem("token");

  useEffect(() => {
    if (filtroDia && filtroMes && filtroAnio) {
      const valida = esFechaValida(filtroDia, filtroMes, filtroAnio);
      if (!valida) {
        showError("Fecha inválida", "La fecha seleccionada no existe. Verifica el día, mes y año.");
      }
    }
  }, [filtroDia, filtroMes, filtroAnio]);

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

  const formatDateForLocalDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const haySolapamiento = (nuevaInicio, nuevaFin, idIgnorado = null) => {
    return citas.some(cita => {
      if (cita.id === idIgnorado) return false;

      const inicioExistente = new Date(cita.fechaHoraInicio);
      const finExistente = new Date(cita.fechaHoraFin);
      return (
        nuevaInicio < finExistente && nuevaFin > inicioExistente
      );
    });
  };

  const handleCrearCita = async () => {
    if (!adoptanteSeleccionado) {
      return showError("Selecciona un adoptante");
    }

    const { descripcion, fechaHoraInicio, fechaHoraFin } = nuevaCita;

    if (!descripcion || !fechaHoraInicio || !fechaHoraFin) {
      return showError("Campos incompletos", "Todos los campos son obligatorios.");
    }

    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(fechaHoraFin);

    if (fin <= inicio) {
      return showError("Fechas no válidas", "La fecha de fin debe ser posterior a la de inicio.");
    }

    // ✅ Validación de solapamiento
    if (haySolapamiento(inicio, fin)) {
      return showError("Conflicto de cita", "Ya existe una cita en ese horario.");
    }

    const body = {
      titulo: `${adoptanteSeleccionado.nombre}`,
      descripcion,
      fechaHoraInicio: formatDateForLocalDateTime(inicio),
      fechaHoraFin: formatDateForLocalDateTime(fin),
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

    const { descripcion, fechaHoraInicio, fechaHoraFin } = nuevaCita;

    if (!descripcion || !fechaHoraInicio || !fechaHoraFin) {
      return showError("Campos incompletos", "Todos los campos son obligatorios.");
    }

    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(fechaHoraFin);

    if (fin <= inicio) {
      return showError("Fechas no válidas", "La fecha de fin debe ser posterior a la de inicio.");
    }

    // ✅ Validación de solapamiento (ignorando su propio ID)
    if (haySolapamiento(inicio, fin, citaAEditar.id)) {
      return showError("Conflicto de cita", "Ya existe una cita en ese horario.");
    }

    const body = {
      titulo: `${adoptanteSeleccionado.nombre}`,
      descripcion,
      fechaHoraInicio: formatDateForLocalDateTime(inicio),
      fechaHoraFin: formatDateForLocalDateTime(fin),
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
      showSuccess("Cita actualizada correctamente");
    } else {
      showError("Error al actualizar la cita");
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

  const filtrarCitasPorFecha = () => {
    const citasFiltradas = citas.filter((cita) => {
      const fecha = new Date(cita.fechaHoraInicio);
      const cumpleDia = filtroDia ? fecha.getDate() === filtroDia : true;
      const cumpleMes = filtroMes ? fecha.getMonth() + 1 === filtroMes : true;
      const cumpleAnio = filtroAnio ? fecha.getFullYear() === filtroAnio : true;
      return cumpleDia && cumpleMes && cumpleAnio;
    });

    return citasFiltradas;
  };

  const adoptantesFiltrados = adoptantes.filter((a) =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const dias = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  }));

  const meses = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  const anios = Array.from(
    new Set(citas.map((cita) => new Date(cita.fechaHoraInicio).getFullYear()))
  )
    .sort((a, b) => b - a)
    .map((a) => ({ value: a, label: `${a}` }));

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

  const esFechaValida = (dia, mes, anio) => {
    if (!dia || !mes || !anio) return true;

    const fecha = new Date(anio, mes - 1, dia);
    return (
      fecha.getFullYear() === parseInt(anio) &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === parseInt(dia)
    );
  };


  return (
    <div className="citas-container">

      <div className="citas-filtros">
        <Select
          options={dias}
          onChange={(option) => setFiltroDia(option?.value || "")}
          placeholder="Día"
          isClearable
          className="citas-select"
          classNamePrefix="citas"
        />
        <Select
          options={meses}
          onChange={(option) => setFiltroMes(option?.value || "")}
          placeholder="Mes"
          isClearable
          className="citas-select"
          classNamePrefix="citas"
        />
        <Select
          options={anios}
          onChange={(option) => setFiltroAnio(option?.value || "")}
          placeholder="Año"
          isClearable
          className="citas-select"
          classNamePrefix="citas"
        />
      </div>

      <div className="citas-acciones">
        <button
          className="citas-btn"
          onClick={() => setMostrarModalAdoptante(true)}
          data-tooltip-id="tooltip"
          data-tooltip-content="Crear Ficha Adoptante"
        >
          <FaPlus />
          <IoMdPerson className="citas-icon" />
        </button>
        <button
          className="citas-btn"
          onClick={() => setMostrarModalCita(true)}
          data-tooltip-id="tooltip"
          data-tooltip-content="Crear Cita"
        >
          <FaPlus />
          <IoCalendarOutline className="citas-icon" />
        </button>
      </div>

      <div className="citas-grid">
        {(() => {
          const citasFiltradas = filtrarCitasPorFecha();
          const filtrosCompletos = filtroDia && filtroMes && filtroAnio;

          if (filtrosCompletos && citasFiltradas.length === 0) {
            return <p>No hay citas en esa fecha.</p>;
          }

          if (!filtrosCompletos && citas.length === 0) {
            return <p>No hay citas registradas.</p>;
          }

          return (
            citasFiltradas
              .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio))
              .map((cita) => {
                const esExpirada = new Date(cita.fechaHoraFin) < new Date();
                return (
                  <div
                    key={cita.id}
                    className={`citas-card ${esExpirada ? "cita-expirada" : ""}`}
                  >
                    <div className="citas-info">
                      <h3>{cita.titulo}</h3>
                      <p>{new Date(cita.fechaHoraInicio).toLocaleDateString("es-ES")}</p>
                      <p>
                        {new Date(cita.fechaHoraInicio).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" - "}
                        {new Date(cita.fechaHoraFin).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </p>
                      <p>{cita.descripcion}</p>
                      <div className="citas-botones">
                        <button
                          className="icon-btn editar-btn"
                          onClick={() => abrirModalEditar(cita)}
                          disabled={esExpirada}
                          data-tooltip-id="tooltip"
                          data-tooltip-content={esExpirada ? "Cita expirada" : "Editar"}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="icon-btn eliminar-btn"
                          onClick={() => eliminarCita(cita.id)}
                          disabled={esExpirada}
                          data-tooltip-id="tooltip"
                          data-tooltip-content={esExpirada ? "Cita expirada" : "Eliminar"}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          );
        })()}
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
