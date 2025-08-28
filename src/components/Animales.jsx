import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./styles/Animales.css";
import { showConfirm } from "../utils/alerts";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt, FaDog, FaCat, FaPlus, FaAngleRight, FaAngleLeft, FaAngleDoubleRight, FaAngleDoubleLeft } from "react-icons/fa";
import { LuImagePlus } from "react-icons/lu";
import { FaCircleInfo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdMale, MdFemale } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { API_URL } from "../utils/config.js";
import { useOneFlightLoader } from "../hooks/useOneFlightLoader";

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

  // 🔢 Paginación
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const subfiltrosRef = useRef(null);
  const filtroRef = useRef(null);
  const [subfiltroPos, setSubfiltroPos] = useState({ left: 0 });
  const [subfiltrosVisibles, setSubfiltrosVisibles] = useState(false);
  const [botonFiltroRef, setBotonFiltroRef] = useState(null);

  const navigate = useNavigate();

  const { loading, runWithLoader, success, error: alertError } = useOneFlightLoader({ minMs: 2000 });

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

  // resetear página al cambiar filtros/búsqueda o lista
  useEffect(() => {
    setPage(1);
  }, [busqueda, filtroPrincipal, filtrosSecundarios, animales]);

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
    return res.json();
  }

  const handleGuardarAnimal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    await runWithLoader(async () => {
      try {
        if (modoEdicion) {
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
          success("Animal actualizado", `${actualizado.nombre} fue editado correctamente.`);
        } else {
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
          success("Animal creado", `${creado.nombre} fue añadido correctamente.`);
        }

        setMostrarModal(false);
        setModoEdicion(false);
        setAnimalEditandoId(null);
        setFotoFile(null);
        setPreviewFoto("");
      } catch (err) {
        console.error(err);
        alertError("Error al guardar", err.message || "No se pudo guardar el animal.");
      }
    });
  };

  const eliminarAnimal = async (id) => {
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
          success("Eliminado", "Animal eliminado correctamente.");
        } else {
          alertError("Error", "No se pudo eliminar.");
        }
      } catch (err) {
        alertError("Error", "Error de conexión");
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

  // ======= Cálculos de paginación (10 por página) =======
  const totalPages = Math.max(1, Math.ceil(animalesFiltrados.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagina = animalesFiltrados.slice(start, end);
  // ======================================================

  return (
    <div className="animales-container">
      {loading && (
        <div className="loader-overlay">
          <img src="/dogloader.webp" alt="Cargando..." className="loader-gif" />
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
            disabled={loading}
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
            disabled={loading}
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
              onClick={() => !loading && handleClickFiltro(tipo, btnRef)}
              className={
                (!filtroPrincipal && tipo === "TODOS") || filtroPrincipal === tipo ? "activo" : ""
              }
              data-tooltip-id="tooltip"
              data-tooltip-content={
                tipo === "PERRO" ? "Mostrar perros" : tipo === "GATO" ? "Mostrar gatos" : "Mostrar todos"
              }
              disabled={loading}
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
                  disabled={loading}
                >
                  <MdMale />
                </button>
                <button
                  onClick={() => handleFiltroSecundario("sexo", "HEMBRA")}
                  className={filtrosSecundarios.sexo === "HEMBRA" ? "activo" : ""}
                  disabled={loading}
                >
                  <MdFemale />
                </button>
              </div>

              <div className="grupo-subfiltro">
                <button
                  onClick={() => handleFiltroSecundario("etapa", "CACHORRO")}
                  className={filtrosSecundarios.etapa === "CACHORRO" ? "activo" : ""}
                  disabled={loading}
                >
                  Cachorro
                </button>
                <button
                  onClick={() => handleFiltroSecundario("etapa", "ADULTO")}
                  className={filtrosSecundarios.etapa === "ADULTO" ? "activo" : ""}
                  disabled={loading}
                >
                  Adulto
                </button>
                <button
                  onClick={() => handleFiltroSecundario("etapa", "ANCIANO")}
                  className={filtrosSecundarios.etapa === "ANCIANO" ? "activo" : ""}
                  disabled={loading}
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
          onClick={() => !loading && abrirModalCrear()}
          data-tooltip-id="tooltip"
          data-tooltip-content="Añadir nuevo animal"
          disabled={loading}
        >
          <FaPlus />
          <img src="/icons/pets.png" alt="Añadir" className="icono-btn" />
        </button>
      </div>

      <div className="card-grid">
        {animalesFiltrados.length === 0 && <p>No hay animales registrados.</p>}

        {pagina.map((animal) => (
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
                onClick={() => !loading && verDetallesAnimal(animal)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Ver detalles"
                disabled={loading}
              >
                <FaCircleInfo />
              </button>
              <button
                className="icon-btn editar-btn"
                onClick={() => !loading && abrirModalEditar(animal)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Editar"
                disabled={loading}
              >
                <FaPencilAlt />
              </button>
              <button
                className="icon-btn eliminar-btn"
                onClick={() => !loading && eliminarAnimal(animal.id)}
                data-tooltip-id="tooltip"
                data-tooltip-content="Eliminar"
                disabled={loading}
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="animales-paginacion">
        <button
          className="page-btn"
          onClick={() => setPage(1)}
          disabled={currentPage === 1 || loading}
          aria-label="Primera página"
          title="Primera"
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          className="page-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          aria-label="Anterior"
          title="Anterior"
        >
          < FaAngleLeft />
        </button>

        <span className="page-info">
          Página {currentPage} de {totalPages}
        </span>

        <button
          className="page-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || loading}
          aria-label="Siguiente"
          title="Siguiente"
        >
          < FaAngleRight />
        </button>
        <button
          className="page-btn"
          onClick={() => setPage(totalPages)}
          disabled={currentPage === totalPages || loading}
          aria-label="Última página"
          title="Última"
        >
          <FaAngleDoubleRight />
        </button>
      </div>

      {/* === Modales (sin cambios) === */}
      {/* ... (todo tu bloque de modales tal cual) ... */}

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => !loading && setMostrarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modoEdicion ? "Editar Animal" : "Nuevo Animal"}</h3>

            <form onSubmit={handleGuardarAnimal}>
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoAnimal.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                required
                disabled={loading}
              />

              <input
                type="text"
                placeholder="Raza"
                value={nuevoAnimal.raza}
                onChange={(e) => actualizarCampo("raza", e.target.value)}
                disabled={loading}
              />

              <div className="edad-container">
                <input
                  type="number"
                  placeholder="Edad"
                  value={nuevoAnimal.edadCantidad}
                  onChange={(e) => actualizarCampo("edadCantidad", e.target.value)}
                  required
                  disabled={loading}
                />
                <select
                  value={nuevoAnimal.unidadEdad}
                  onChange={(e) => actualizarCampo("unidadEdad", e.target.value)}
                  disabled={loading}
                >
                  <option value="ANIOS">Años</option>
                  <option value="MESES">Meses</option>
                </select>
              </div>

              <select
                value={nuevoAnimal.tipo}
                onChange={(e) => actualizarCampo("tipo", e.target.value)}
                disabled={loading}
              >
                <option value="PERRO">Perro</option>
                <option value="GATO">Gato</option>
              </select>

              <select
                value={nuevoAnimal.sexo}
                onChange={(e) => actualizarCampo("sexo", e.target.value)}
                disabled={loading}
              >
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>

              <select
                value={nuevoAnimal.estado}
                onChange={(e) => actualizarCampo("estado", e.target.value)}
                disabled={loading}
              >
                <option value="EN_ADOPCION">En adopción</option>
                <option value="ADOPTADO">Adoptado</option>
                <option value="EN_CASA_DE_ACOGIDA">En casa de acogida</option>
              </select>

              <div className="foto-uploader">
                <label className={`btn-archivo ${loading ? "disabled" : ""}`} title="Subir foto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFotoFile(f);
                      setPreviewFoto(f ? URL.createObjectURL(f) : (nuevoAnimal.fotoPerfilUrl || ""));
                    }}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                  <LuImagePlus />
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
                disabled={loading}
              />

              <div className="modal-actions">
                <button type="submit" disabled={loading}>
                  {modoEdicion ? "Guardar cambios" : "Crear"}
                </button>
                <button type="button" onClick={() => setMostrarModal(false)} disabled={loading}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalInfo && animalDetalle && (
        <div className="modal-overlay" onClick={() => setMostrarModalInfo(false)}>
          <div className="modal modal-info" onClick={(e) => e.stopPropagation()}>
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
