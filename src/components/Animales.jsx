import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./styles/Animales.css";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt, FaDog, FaCat, FaPlus } from "react-icons/fa";
import { LuImagePlus } from "react-icons/lu";
import { FaCircleInfo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdMale, MdFemale } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { API_URL } from "../utils/config.js";

// ===== util formato =====
const formatearEnum = (valor) => {
  const reemplazos = {
    ANIOS: "Años",
    MESES: "Meses",
    PERRO: "Perro",
    GATO: "Gato",
    ADOPTADO: "Adoptado",
    EN_ADOPCION: "En adopción",
    EN_CASA_DE_ACOGIDA: "En casa de acogida",
  };
  return reemplazos[valor] || valor;
};

// ===== loader min 2s + candado una-sola-peticion =====
const MIN_LOADER_MS = 2000;
const waitMinTime = (start, fn) => {
  const elapsed = Date.now() - start;
  if (elapsed < MIN_LOADER_MS) setTimeout(fn, MIN_LOADER_MS - elapsed);
  else fn();
};

export default function Animales() {
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [animalDetalle, setAnimalDetalle] = useState(null);
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [animalEditandoId, setAnimalEditandoId] = useState(null);
  const [nuevoAnimal, setNuevoAnimal] = useState({
    nombre: "",
    raza: "",
    edadCantidad: "",
    unidadEdad: "ANIOS",
    tipo: "PERRO",
    sexo: "MACHO",
    descripcion: "",
    estado: "EN_ADOPCION",
    fotoPerfilUrl: "",
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [previewFoto, setPreviewFoto] = useState("");

  const [filtroPrincipal, setFiltroPrincipal] = useState("TODOS");
  const [filtrosSecundarios, setFiltrosSecundarios] = useState({ sexo: null, etapa: null });

  const subfiltrosRef = useRef(null);
  const filtroRef = useRef(null);
  const [subfiltroPos, setSubfiltroPos] = useState({ left: 0 });
  const [subfiltrosVisibles, setSubfiltrosVisibles] = useState(false);
  const [botonFiltroRef, setBotonFiltroRef] = useState(null);

  const navigate = useNavigate();

  // ===== loader global de acciones (crear/editar/eliminar) =====
  const [loadingAction, setLoadingAction] = useState(false);
  const inFlightRef = useRef(false); // candado anti doble clic

  // Alerta pendiente después del loader (arregla stale closure)
  const [pendingAlert, setPendingAlert] = useState(null);
  const alertRef = useRef(null);
  const setAlert = (payload) => {
    alertRef.current = payload;
    setPendingAlert(payload);
  };

  const runWithLoader = async (fn) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // limpia alertas previas
    alertRef.current = null;
    setPendingAlert(null);

    const start = Date.now();
    setLoadingAction(true);

    try {
      const result = await fn();
      waitMinTime(start, () => {
        setLoadingAction(false);
        const alert = alertRef.current;
        if (alert) {
          if (alert.type === "success") showSuccess(alert.title, alert.text);
          if (alert.type === "error") showError(alert.title, alert.text);
          alertRef.current = null;
          setPendingAlert(null);
        }
      });
      return result;
    } catch (e) {
      waitMinTime(start, () => {
        setLoadingAction(false);
        const alert = alertRef.current;
        if (alert) {
          if (alert.type === "success") showSuccess(alert.title, alert.text);
          if (alert.type === "error") showError(alert.title, alert.text);
          alertRef.current = null;
          setPendingAlert(null);
        }
      });
      throw e;
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    fetchAnimales();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        subfiltrosRef.current &&
        !subfiltrosRef.current.contains(event.target) &&
        filtroRef.current &&
        !filtroRef.current.contains(event.target)
      ) {
        setSubfiltrosVisibles(false);
      }
    };
    if (subfiltrosVisibles) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [subfiltrosVisibles]);

  useLayoutEffect(() => {
    if (subfiltrosVisibles && botonFiltroRef && botonFiltroRef.current && filtroRef.current) {
      const rect = botonFiltroRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const containerRect = filtroRef.current.getBoundingClientRect();
      const offsetLeft = centerX - containerRect.left;
      setSubfiltroPos({ left: offsetLeft });
    }
  }, [subfiltrosVisibles, botonFiltroRef]);

  const fetchAnimales = async (tipo = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      const endpoint =
        tipo && tipo !== "TODOS" ? `${API_URL}/animales/tipo/${tipo}` : `${API_URL}/animales`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al obtener animales");
      const data = await response.json();
      setAnimales(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los animales.");
    }
  };

  const handleClickFiltro = (tipo, ref) => {
    if (filtroPrincipal === tipo && !subfiltrosVisibles) {
      setSubfiltrosVisibles(true);
      setBotonFiltroRef(ref);
      return;
    }
    if (filtroPrincipal === tipo && subfiltrosVisibles) {
      setSubfiltrosVisibles(false);
      setFiltroPrincipal(null);
      setFiltrosSecundarios({ sexo: null, etapa: null });
      fetchAnimales();
      return;
    }
    setSubfiltrosVisibles(true);
    setFiltroPrincipal(tipo);
    setFiltrosSecundarios({ sexo: null, etapa: null });
    setBotonFiltroRef(ref);
    fetchAnimales(tipo);
  };

  const handleFiltroSecundario = (tipo, valor) => {
    setFiltrosSecundarios((prev) => ({ ...prev, [tipo]: valor }));
  };

  const actualizarCampo = (campo, valor) => {
    setNuevoAnimal((prev) => ({ ...prev, [campo]: valor }));
  };

  const abrirModalCrear = () => {
    setNuevoAnimal({
      nombre: "",
      raza: "",
      edadCantidad: "",
      unidadEdad: "ANIOS",
      descripcion: "",
      tipo: "PERRO",
      sexo: "MACHO",
      estado: "EN_ADOPCION",
      fotoPerfilUrl: "",
    });
    setFotoFile(null);
    setPreviewFoto("");
    setModoEdicion(false);
    setMostrarModal(true);
  };

  const abrirModalEditar = (animal) => {
    setNuevoAnimal({ ...animal });
    setAnimalEditandoId(animal.id);
    setFotoFile(null);
    setPreviewFoto(animal.fotoPerfilUrl || "");
    setModoEdicion(true);
    setMostrarModal(true);
  };

  const verDetallesAnimal = (animal) => {
    setAnimalDetalle(animal);
    setMostrarModalInfo(true);
  };

  async function subirFotoAnimal(id, file) {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("foto", file);
    const res = await fetch(`${API_URL}/animales/${id}/foto`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error("Error subiendo foto");
    return res.json(); // devuelve AnimalDTO actualizado
  }

  const handleGuardarAnimal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (inFlightRef.current) return; // anti doble submit

    await runWithLoader(async () => {
      try {
        if (modoEdicion) {
          // ----- EDITAR -----
          const resUpd = await fetch(`${API_URL}/animales/${animalEditandoId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "Idempotency-Key": crypto?.randomUUID?.() || `${animalEditandoId}-${Date.now()}`,
            },
            body: JSON.stringify(nuevoAnimal),
          });
          if (!resUpd.ok) throw new Error("Error actualizando el animal");
          let actualizado = await resUpd.json();

          if (fotoFile) {
            actualizado = await subirFotoAnimal(animalEditandoId, fotoFile);
          }

          setAnimales((prev) => prev.map((a) => (a.id === animalEditandoId ? actualizado : a)));
          setAlert({
            type: "success",
            title: "Animal actualizado",
            text: `${actualizado.nombre} fue editado correctamente.`,
          });
        } else {
          // ----- CREAR -----
          let creado;
          if (fotoFile) {
            const form = new FormData();
            form.append("animal", new Blob([JSON.stringify(nuevoAnimal)], { type: "application/json" }));
            form.append("foto", fotoFile);

            const res = await fetch(`${API_URL}/animales`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Idempotency-Key": crypto?.randomUUID?.() || `create-${Date.now()}`,
              },
              body: form,
            });
            if (!res.ok) throw new Error("Error creando animal (multipart)");
            creado = await res.json();
          } else {
            const res = await fetch(`${API_URL}/animales`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "Idempotency-Key": crypto?.randomUUID?.() || `create-${Date.now()}`,
              },
              body: JSON.stringify(nuevoAnimal),
            });
            if (!res.ok) throw new Error("Error creando animal (JSON)");
            creado = await res.json();
          }

          setAnimales((prev) => [...prev, creado]);
          setAlert({
            type: "success",
            title: "Animal creado",
            text: `${creado.nombre} fue añadido correctamente.`,
          });
        }

        // cerrar modal y limpiar
        setMostrarModal(false);
        setModoEdicion(false);
        setAnimalEditandoId(null);
        setFotoFile(null);
        setPreviewFoto("");
      } catch (err) {
        console.error(err);
        setAlert({
          type: "error",
          title: "Error al guardar",
          text: err.message || "No se pudo guardar el animal.",
        });
      }
    });
  };

  const eliminarAnimal = async (id) => {
    if (inFlightRef.current) return; // evita doble clic
    const confirmacion = await showConfirm("Eliminar", "Esta acción no se puede deshacer.");
    if (!confirmacion.isConfirmed) return;

    await runWithLoader(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/animales/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setAnimales((prev) => prev.filter((a) => a.id !== id));
          setAlert({ type: "success", title: "Eliminado", text: "Animal eliminado correctamente." });
        } else {
          setAlert({ type: "error", title: "Error", text: "No se pudo eliminar." });
        }
      } catch (err) {
        setAlert({ type: "error", title: "Error", text: "Error de conexión" });
      }
    });
  };

  const animalesFiltrados = animales.filter((animal) => {
    const termino = busqueda.toLowerCase();
    const estadoNormalizado = formatearEnum(animal.estado).toLowerCase();

    if (filtrosSecundarios.sexo && animal.sexo !== filtrosSecundarios.sexo) return false;

    const edad = animal.edadCantidad;
    const unidad = animal.unidadEdad;

    if (filtrosSecundarios.etapa === "CACHORRO") {
      if (!(unidad === "MESES" || (unidad === "ANIOS" && edad <= 1))) return false;
    } else if (filtrosSecundarios.etapa === "ADULTO") {
      if (!(unidad === "ANIOS" && edad >= 2 && edad <= 8)) return false;
    } else if (filtrosSecundarios.etapa === "ANCIANO") {
      if (!(unidad === "ANIOS" && edad >= 9)) return false;
    }

    return (
      animal.nombre.toLowerCase().includes(termino) ||
      animal.raza.toLowerCase().includes(termino) ||
      estadoNormalizado.includes(termino)
    );
  });

  return (
    <div className="animales-container">
      {/* Overlay loader global (mínimo 2s) */}
      {loadingAction && (
        <div className="loader-overlay">
          <img src="/dogloader.gif" alt="Cargando..." className="loader-gif" />
          <p className="loader-text">Procesando…</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className={`busqueda ${mostrarBusqueda ? "activa" : ""}`}>
        {!mostrarBusqueda && (
          <button
            onClick={() => setMostrarBusqueda(true)}
            className="lupa-btn"
            data-tooltip-id="tooltip"
            data-tooltip-content="Buscar por nombre, raza o estado"
            disabled={loadingAction}
          >
            <img src="/icons/search.png" alt="Buscar" className="icono-btn" />
          </button>
        )}
        {mostrarBusqueda && (
          <input
            type="text"
            placeholder="Buscar animales..."
            value={busqueda}
            autoFocus
            onChange={(e) => setBusqueda(e.target.value)}
            onBlur={() => !busqueda && setMostrarBusqueda(false)}
            disabled={loadingAction}
          />
        )}
      </div>

      <div className="filtros" ref={filtroRef}>
        {["TODOS", "PERRO", "GATO"].map((tipo) => {
          const icon =
            tipo === "PERRO" ? "/icons/dog.png" : tipo === "GATO" ? "/icons/cat.png" : "/icons/shelt.png";
          const btnRef = useRef(null);

          return (
            <button
              key={tipo}
              ref={btnRef}
              onClick={() => !loadingAction && handleClickFiltro(tipo, btnRef)}
              className={
                (!filtroPrincipal && tipo === "TODOS") || filtroPrincipal === tipo ? "activo" : ""
              }
              data-tooltip-id="tooltip"
              data-tooltip-content={
                tipo === "PERRO" ? "Mostrar perros" : tipo === "GATO" ? "Mostrar gatos" : "Mostrar todos"
              }
              disabled={loadingAction}
            >
              <img src={icon} alt={tipo} className="icono-btn" />
            </button>
          );
        })}
      </div>

      {filtroPrincipal && subfiltrosVisibles && (
        <div className="subfiltros-container" style={{ position: "relative" }}>
          <div
            className="subfiltros-box"
            ref={subfiltrosRef}
            style={{ position: "absolute", top: "100%", left: `${subfiltroPos.left}px`, transform: "translateX(-50%)" }}
          >
            <div className="flecha-subfiltros" />
            <div className="subfiltros">
              <div className="grupo-subfiltro">
                <button
                  onClick={() => handleFiltroSecundario("sexo", "MACHO")}
                  className={filtrosSecundarios.sexo === "MACHO" ? "activo" : ""}
                  disabled={loadingAction}
                >
                  <MdMale />
                </button>
                <button
                  onClick={() => handleFiltroSecundario("sexo", "HEMBRA")}
                  className={filtrosSecundarios.sexo === "HEMBRA" ? "activo" : ""}
                  disabled={loadingAction}
                >
                  <MdFemale />
                </button>
              </div>

              <div className="grupo-subfiltro">
                <button
                  onClick={() => handleFiltroSecundario("etapa", "CACHORRO")}
                  className={filtrosSecundarios.etapa === "CACHORRO" ? "activo" : ""}
                  disabled={loadingAction}
                >
                  Cachorro
                </button>
                <button
                  onClick={() => handleFiltroSecundario("etapa", "ADULTO")}
                  className={filtrosSecundarios.etapa === "ADULTO" ? "activo" : ""}
                  disabled={loadingAction}
                >
                  Adulto
                </button>
                <button
                  onClick={() => handleFiltroSecundario("etapa", "ANCIANO")}
                  className={filtrosSecundarios.etapa === "ANCIANO" ? "activo" : ""}
                  disabled={loadingAction}
                >
                  Anciano
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="acciones">
        <button
          className="añadir-btn"
          onClick={() => !loadingAction && abrirModalCrear()}
          data-tooltip-id="tooltip"
          data-tooltip-content="Añadir nuevo animal"
          disabled={loadingAction}
        >
          <FaPlus />
          <img src="/icons/pets.png" alt="Añadir" className="icono-btn" />
        </button>
      </div>

      <div className="card-grid">
        {animalesFiltrados.map((animal) => (
          <div className="animal-card" key={animal.id}>
            <img
              src={animal.fotoPerfilUrl || "/images/placeholder-animal.jpg"}
              alt={animal.nombre}
              onError={(e) => (e.currentTarget.src = "/images/placeholder-animal.jpg")}
            />
            <div className="animal-info">
              <h3>{animal.nombre}</h3>
              <p>{animal.raza}</p>
              <button
                className="icon-btn info-btn"
                onClick={() => !loadingAction && verDetallesAnimal(animal)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Ver detalles"
                disabled={loadingAction}
              >
                <FaCircleInfo />
              </button>
              <button
                className="icon-btn editar-btn"
                onClick={() => !loadingAction && abrirModalEditar(animal)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Editar"
                disabled={loadingAction}
              >
                <FaPencilAlt />
              </button>
              <button
                className="icon-btn eliminar-btn"
                onClick={() => !loadingAction && eliminarAnimal(animal.id)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Eliminar"
                disabled={loadingAction}
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => !loadingAction && setMostrarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modoEdicion ? "Editar Animal" : "Nuevo Animal"}</h3>
            <form onSubmit={handleGuardarAnimal}>
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoAnimal.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                required
                disabled={loadingAction}
              />
              <input
                type="text"
                placeholder="Raza"
                value={nuevoAnimal.raza}
                onChange={(e) => actualizarCampo("raza", e.target.value)}
                disabled={loadingAction}
              />
              <div className="edad-container">
                <input
                  type="number"
                  placeholder="Edad"
                  value={nuevoAnimal.edadCantidad}
                  onChange={(e) => actualizarCampo("edadCantidad", e.target.value)}
                  required
                  disabled={loadingAction}
                />
                <select
                  value={nuevoAnimal.unidadEdad}
                  onChange={(e) => actualizarCampo("unidadEdad", e.target.value)}
                  disabled={loadingAction}
                >
                  <option value="ANIOS">Años</option>
                  <option value="MESES">Meses</option>
                </select>
              </div>
              <select value={nuevoAnimal.tipo} onChange={(e) => actualizarCampo("tipo", e.target.value)} disabled={loadingAction}>
                <option value="PERRO">Perro</option>
                <option value="GATO">Gato</option>
              </select>
              <select value={nuevoAnimal.sexo} onChange={(e) => actualizarCampo("sexo", e.target.value)} disabled={loadingAction}>
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>
              <select value={nuevoAnimal.estado} onChange={(e) => actualizarCampo("estado", e.target.value)} disabled={loadingAction}>
                <option value="EN_ADOPCION">En adopción</option>
                <option value="ADOPTADO">Adoptado</option>
                <option value="EN_CASA_DE_ACOGIDA">En casa de acogida</option>
              </select>

              <div className="foto-uploader">
                <label className={`btn-archivo ${loadingAction ? "disabled" : ""}`} title="Subir foto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFotoFile(f);
                      setPreviewFoto(f ? URL.createObjectURL(f) : (nuevoAnimal.fotoPerfilUrl || ""));
                    }}
                    style={{ display: "none" }}
                    disabled={loadingAction}
                  />
                  <i className="fas fa-camera"></i> <LuImagePlus />
                </label>

                {previewFoto && (
                  <img
                    src={previewFoto}
                    alt="preview"
                    className="preview-foto"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>

              <textarea
                placeholder="Descripción"
                value={nuevoAnimal.descripcion}
                onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                disabled={loadingAction}
              />
              <div className="modal-actions">
                <button type="submit" disabled={loadingAction}>
                  {modoEdicion ? "Guardar cambios" : "Crear"}
                </button>
                <button type="button" onClick={() => setMostrarModal(false)} disabled={loadingAction}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalInfo && animalDetalle && (
        <div className="modal-overlay" onClick={() => setMostrarModalInfo(false)}>
          <div className="modal modal-info">
            <div className="modal-header">
              <h3>{animalDetalle.nombre}</h3>
              <button className="cerrar-modal" onClick={() => setMostrarModalInfo(false)}>
                <IoClose />
              </button>
            </div>
            <div className="modal-scroll">
              <img
                src={animalDetalle.fotoPerfilUrl || "/images/placeholder-animal.jpg"}
                alt={animalDetalle.nombre}
                className="modal-img"
                onError={(e) => (e.currentTarget.src = "/images/placeholder-animal.jpg")}
              />
              <div className="info-linea">
                {animalDetalle.tipo === "PERRO" ? <FaDog /> : <FaCat />}
                {animalDetalle.sexo === "MACHO" ? <MdMale /> : <MdFemale />}
                <span className="barra">|</span>
                <strong>{animalDetalle.raza}</strong>
                <span className="barra">|</span>
                <strong>
                  {animalDetalle.edadCantidad} {formatearEnum(animalDetalle.unidadEdad)}
                </strong>
              </div>
              <div className="info-linea">
                <strong>{formatearEnum(animalDetalle.estado)}</strong>
              </div>
              <p>{animalDetalle.descripcion}</p>
            </div>
          </div>
        </div>
      )}

      <Tooltip id="tooltip" place="top" />
    </div>
  );
}
