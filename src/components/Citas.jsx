import React, { useEffect, useMemo, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/core/locales/es";
import "./styles/fullcalendar-custom.css";

import { IoMdPerson } from "react-icons/io";
import { FaPencilAlt, FaTrashAlt, FaList, FaPlus } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { showError, showSuccess, showConfirm } from "../utils/alerts";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/Citas.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { API_URL } from "../utils/config.js";
import { useOneFlightLoader } from "../hooks/useOneFlightLoader";

registerLocale("es", es);

export default function Citas() {
  const hoy = new Date();
  const [modoVista, setModoVista] = useState("listado"); // listado | calendario
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
  const [filtroDia, setFiltroDia] = useState(hoy.getDate());
  const [filtroMes, setFiltroMes] = useState(hoy.getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState(hoy.getFullYear());
  const [mostrarSubformAdoptante, setMostrarSubformAdoptante] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 14;

  const token = localStorage.getItem("token");

  // Loader mínimo 2s + anti reentradas + alertas tras loader
  const { loading, runWithLoader, success, error: alertError } = useOneFlightLoader({ minMs: 2000 });

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

  // Resetear página al cambiar filtros o recargar citas
  useEffect(() => {
    setPage(1);
  }, [filtroDia, filtroMes, filtroAnio, citas]);

  const fetchCitas = async () => {
    const res = await fetch(`${API_URL}/citas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      showError("Error", "No se pudieron cargar las citas.");
      return;
    }
    const data = await res.json();
    setCitas(data);
  };

  const fetchAdoptantes = async () => {
    const res = await fetch(`${API_URL}/adoptantes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      showError("Error", "No se pudieron cargar los adoptantes.");
      return [];
    }
    const data = await res.json();
    setAdoptantes(data);
    return data;
  };

  const handleCitaDrop = async (info) => {
    if (loading) {
      info.revert();
      return;
    }
    const evento = info.event;
    const id = parseInt(evento.id);
    const cita = citas.find((c) => c.id === id);
    if (!cita) return;

    const nuevaFechaInicio = evento.start;
    const nuevaFechaFin = evento.end;

    if (haySolapamiento(nuevaFechaInicio, nuevaFechaFin, id)) {
      showError("Conflicto de cita", "Ya existe una cita en ese horario.");
      info.revert();
      return;
    }

    const body = {
      titulo: cita.titulo,
      descripcion: cita.descripcion,
      fechaHoraInicio: formatDateForLocalDateTime(nuevaFechaInicio),
      fechaHoraFin: formatDateForLocalDateTime(nuevaFechaFin),
      personaAdoptanteId: cita.personaAdoptanteId,
    };

    await runWithLoader(async () => {
      const res = await fetch(`${API_URL}/citas/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCitas();
        success("Cita actualizada", "Se guardaron los cambios.");
      } else {
        alertError("Error al actualizar la cita");
        info.revert();
      }
    });
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

    await runWithLoader(async () => {
      const res = await fetch(`${API_URL}/adoptantes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoAdoptante),
      });

      if (res.ok) {
        setNuevoAdoptante({ nombre: "", email: "", telefono: "", direccion: "" });

        const lista = await fetchAdoptantes();
        const recienCreado = lista.find((a) => a.email === email);
        if (recienCreado) {
          setAdoptanteSeleccionado(recienCreado);
        }

        setMostrarSubformAdoptante(false);
        setMostrarModalAdoptante(false);

        success("Adoptante creado correctamente");
      } else {
        alertError("Error al crear adoptante", "Revisa los datos o el servidor.");
      }
    });
  };

  const formatDateForLocalDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const haySolapamiento = (nuevaInicio, nuevaFin, idIgnorado = null) => {
    return citas.some((cita) => {
      if (cita.id === idIgnorado) return false;
      const inicioExistente = new Date(cita.fechaHoraInicio);
      const finExistente = new Date(cita.fechaHoraFin);
      return nuevaInicio < finExistente && nuevaFin > inicioExistente;
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

    await runWithLoader(async () => {
      const res = await fetch(`${API_URL}/citas`, {
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
        await fetchCitas();
        success("Cita creada correctamente");
      } else {
        alertError("Error al crear la cita", "Revisa los datos o el servidor.");
      }
    });
  };

  const abrirModalEditar = (cita) => {
    setCitaAEditar(cita);
    setAdoptanteSeleccionado(adoptantes.find((a) => a.id === cita.personaAdoptanteId));
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

    await runWithLoader(async () => {
      const res = await fetch(`${API_URL}/citas/${citaAEditar.id}`, {
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
        await fetchCitas();
        success("Cita actualizada correctamente");
      } else {
        alertError("Error al actualizar la cita");
      }
    });
  };

  const eliminarCita = async (id) => {
    const confirmado = await showConfirm("¿Eliminar cita?", "Esta acción no se puede deshacer.");
    if (!confirmado.isConfirmed) return;

    await runWithLoader(async () => {
      const res = await fetch(`${API_URL}/citas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchCitas();
        success("Cita eliminada");
      } else {
        alertError("Error al eliminar cita");
      }
    });
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

  // Futuras primero (asc), pasadas al final (desc)
  const ordenarCitas = (arr) => {
    const now = new Date();
    const futuras = [];
    const pasadas = [];

    for (const c of arr) {
      const fin = new Date(c.fechaHoraFin);
      (fin < now ? pasadas : futuras).push(c);
    }

    futuras.sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
    pasadas.sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));

    return [...futuras, ...pasadas];
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

  const anios = Array.from(new Set(citas.map((cita) => new Date(cita.fechaHoraInicio).getFullYear())))
    .sort((a, b) => b - a)
    .map((a) => ({ value: a, label: `${a}` }));

  const citasFiltradas = useMemo(() => filtrarCitasPorFecha(), [citas, filtroDia, filtroMes, filtroAnio]);
  const filtrosCompletos = filtroDia && filtroMes && filtroAnio;
  const ordenadas = useMemo(() => ordenarCitas(citasFiltradas), [citasFiltradas]);
  const totalPages = Math.max(1, Math.ceil(ordenadas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagina = ordenadas.slice(start, end);

  const renderCitaModal = (modoEditar = false) => (
    <div className="citas-modal-overlay">
      <div className="citas-modal">
        <h3>{modoEditar ? "Editar Cita" : "Nueva Cita"}</h3>

        <div className="citas-row">
          <div style={{ flex: 1 }}>
            <Select
              className="citas-select"
              classNamePrefix="citas"
              options={adoptantes.map((a) => ({ value: a.id, label: a.nombre }))}
              onChange={(selectedOption) =>
                setAdoptanteSeleccionado(adoptantes.find((a) => a.id === selectedOption?.value) || null)
              }
              value={
                adoptanteSeleccionado
                  ? { value: adoptanteSeleccionado.id, label: adoptanteSeleccionado.nombre }
                  : null
              }
              placeholder="Seleccionar adoptante..."
              isClearable
              isDisabled={loading}
            />
          </div>

          {/* Botón alineado con el select */}
          <button
            type="button"
            className="citas-btn citas-btn-inline"
            onClick={() => setMostrarSubformAdoptante((v) => !v)}
            title="Añadir adoptante"
            disabled={loading}
          >
            <FaPlus />
            <IoMdPerson className="citas-icon" />
          </button>
        </div>

        {/* Subformulario inline */}
        {mostrarSubformAdoptante && (
          <div className="citas-subform-adoptante">
            <h4>Nuevo adoptante</h4>
            <div className="citas-subform-grid">
              <input
                placeholder="Nombre"
                value={nuevoAdoptante.nombre}
                onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, nombre: e.target.value })}
                disabled={loading}
              />
              <input
                placeholder="Email"
                value={nuevoAdoptante.email}
                onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, email: e.target.value })}
                disabled={loading}
              />
              <input
                placeholder="Teléfono"
                value={nuevoAdoptante.telefono}
                onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, telefono: e.target.value })}
                disabled={loading}
              />
              <input
                placeholder="Dirección"
                value={nuevoAdoptante.direccion}
                onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, direccion: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="citas-modal-actions">
              <button type="button" onClick={handleCrearAdoptante} disabled={loading}>
                Guardar adoptante
              </button>
              <button type="button" onClick={() => setMostrarSubformAdoptante(false)} disabled={loading}>
                Cancelar
              </button>
            </div>
          </div>
        )}

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
          disabled={loading}
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
          disabled={loading}
        />

        <textarea
          placeholder="Descripción"
          value={nuevaCita.descripcion}
          onChange={(e) => setNuevaCita({ ...nuevaCita, descripcion: e.target.value })}
          disabled={loading}
        />

        <div className="citas-modal-actions">
          <button onClick={modoEditar ? handleActualizarCita : handleCrearCita} disabled={loading}>
            Guardar
          </button>
          <button
            onClick={() => {
              modoEditar ? setMostrarModalEditar(false) : setMostrarModalCita(false);
              setCitaAEditar(null);
              resetCitaForm();
              setMostrarSubformAdoptante(false);
            }}
            disabled={loading}
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
      {/* Overlay loader global (mínimo 2s) */}
      {loading && (
        <div className="loader-overlay">
          <img src="/dogloader.gif" alt="Cargando..." className="loader-gif" />
          <p className="loader-text">Procesando…</p>
        </div>
      )}

      <div className="citas-vista-switch">
        <button
          className={modoVista === "listado" ? "activo" : ""}
          onClick={() => setModoVista("listado")}
          disabled={loading}
        >
          <FaList style={{ marginRight: "8px" }} />
          Ver Listado
        </button>
        <button
          className={modoVista === "calendario" ? "activo" : ""}
          onClick={() => setModoVista("calendario")}
          disabled={loading}
        >
          Calendario
        </button>
      </div>

      {/* VISTA DE LISTADO */}
      {modoVista === "listado" && (
        <>
          <div className="citas-filtros">
            <Select
              options={dias}
              value={dias.find((d) => d.value === filtroDia) || null}
              onChange={(option) => setFiltroDia(option?.value || "")}
              placeholder="Día"
              isClearable
              className="citas-select"
              classNamePrefix="citas"
              isDisabled={loading}
            />
            <Select
              options={meses}
              value={meses.find((m) => m.value === filtroMes) || null}
              onChange={(option) => setFiltroMes(option?.value || "")}
              placeholder="Mes"
              isClearable
              className="citas-select"
              classNamePrefix="citas"
              isDisabled={loading}
            />
            <Select
              options={anios}
              value={anios.find((a) => a.value === filtroAnio) || null}
              onChange={(option) => setFiltroAnio(option?.value || "")}
              placeholder="Año"
              isClearable
              className="citas-select"
              classNamePrefix="citas"
              isDisabled={loading}
            />
          </div>

          <div className="citas-acciones">
            <button
              className="citas-btn"
              onClick={() => setMostrarModalCita(true)}
              data-tooltip-id="tooltip"
              data-tooltip-content="Crear Cita"
              disabled={loading}
            >
              <FaPlus />
              <IoCalendarOutline className="citas-icon" />
            </button>
          </div>

          {/* Tarjetas */}
          <div className="citas-grid">
            {filtrosCompletos && ordenadas.length === 0 && <p>No hay citas en esa fecha.</p>}
            {!filtrosCompletos && citas.length === 0 && <p>No hay citas registradas.</p>}

            {pagina.map((cita) => {
              const esExpirada = new Date(cita.fechaHoraFin) < new Date();
              const disableActions = loading || esExpirada;
              return (
                <div key={cita.id} className={`citas-card ${esExpirada ? "cita-expirada" : ""}`}>
                  <div className="citas-info">
                    <h3>{cita.titulo}</h3>
                    <p>{new Date(cita.fechaHoraInicio).toLocaleDateString("es-ES")}</p>
                    <p>
                      {new Date(cita.fechaHoraInicio).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}{" "}
                      -{" "}
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
                        disabled={disableActions}
                        data-tooltip-id="tooltip"
                        data-tooltip-content={esExpirada ? "Cita expirada" : "Editar"}
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        className="icon-btn eliminar-btn"
                        onClick={() => eliminarCita(cita.id)}
                        disabled={disableActions}
                        data-tooltip-id="tooltip"
                        data-tooltip-content={esExpirada ? "Cita expirada" : "Eliminar"}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          <div className="citas-paginacion">
            <button
              className="citas-page-btn"
              onClick={() => setPage(1)}
              disabled={currentPage === 1 || loading}
              aria-label="Primera página"
              title="Primera"
            >
              «
            </button>
            <button
              className="citas-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              aria-label="Anterior"
              title="Anterior"
            >
              ‹
            </button>

            <span className="citas-page-info">
              Página {currentPage} de {totalPages}
            </span>

            <button
              className="citas-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              aria-label="Siguiente"
              title="Siguiente"
            >
              ›
            </button>
            <button
              className="citas-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              aria-label="Última página"
              title="Última"
            >
              »
            </button>
          </div>

          {/* Modales en modo listado */}
          {mostrarModalAdoptante && (
            <div className="citas-modal-overlay">
              <div className="citas-modal">
                <h3>Nueva Persona Adoptante</h3>
                <input
                  placeholder="Nombre"
                  value={nuevoAdoptante.nombre}
                  onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, nombre: e.target.value })}
                  disabled={loading}
                />
                <input
                  placeholder="Email"
                  value={nuevoAdoptante.email}
                  onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, email: e.target.value })}
                  disabled={loading}
                />
                <input
                  placeholder="Teléfono"
                  value={nuevoAdoptante.telefono}
                  onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, telefono: e.target.value })}
                  disabled={loading}
                />
                <input
                  placeholder="Dirección"
                  value={nuevoAdoptante.direccion}
                  onChange={(e) => setNuevoAdoptante({ ...nuevoAdoptante, direccion: e.target.value })}
                  disabled={loading}
                />
                <div className="citas-modal-actions">
                  <button onClick={handleCrearAdoptante} disabled={loading}>
                    Guardar
                  </button>
                  <button onClick={() => setMostrarModalAdoptante(false)} disabled={loading}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {mostrarModalCita && renderCitaModal(false)}
          {mostrarModalEditar && renderCitaModal(true)}
        </>
      )}

      {modoVista === "calendario" && (
        <div className="citas-calendario">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            editable={!loading}
            selectable={!loading}
            allDaySlot={false}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
            }}
            events={citas.map((cita) => ({
              id: cita.id,
              title: cita.titulo,
              start: cita.fechaHoraInicio,
              end: cita.fechaHoraFin,
              extendedProps: {
                descripcion: cita.descripcion,
                personaAdoptanteId: cita.personaAdoptanteId,
              },
            }))}
            dateClick={(info) => {
              if (loading) return;
              setMostrarModalCita(true);
              setNuevaCita({
                ...nuevaCita,
                fechaHoraInicio: info.date,
                fechaHoraFin: new Date(info.date.getTime() + 30 * 60000),
              });
            }}
            eventClick={(info) => {
              if (loading) return;
              const cita = citas.find((c) => c.id === parseInt(info.event.id));
              if (cita) abrirModalEditar(cita);
            }}
            eventDrop={handleCitaDrop}
            locale="es"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            height="auto"
          />

          {mostrarModalCita && renderCitaModal(false)}
          {mostrarModalEditar && renderCitaModal(true)}
        </div>
      )}
    </div>
  );
}
