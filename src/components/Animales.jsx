import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import "./styles/Animales.css";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt, FaDog, FaCat, FaPlus } from "react-icons/fa";
import { FaCircleInfo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdMale, MdFemale } from "react-icons/md";
import { Tooltip } from "react-tooltip";

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

    const [filtroPrincipal, setFiltroPrincipal] = useState("TODOS");
    const [filtrosSecundarios, setFiltrosSecundarios] = useState({
        sexo: null,
        etapa: null,
    });

    const subfiltrosRef = useRef(null);
    const filtroRef = useRef(null);
    const [subfiltroPos, setSubfiltroPos] = useState({ left: 0 });
    const [subfiltrosVisibles, setSubfiltrosVisibles] = useState(false);
    const [botonFiltroRef, setBotonFiltroRef] = useState(null);

    const navigate = useNavigate();

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

        if (subfiltrosVisibles) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [subfiltrosVisibles]);

    useLayoutEffect(() => {
        if (
            subfiltrosVisibles &&
            botonFiltroRef &&
            botonFiltroRef.current &&
            filtroRef.current
        ) {
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

            const endpoint = tipo && tipo !== "TODOS"
                ? `http://localhost:8080/animales/tipo/${tipo}`
                : `http://localhost:8080/animales`;

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
        setModoEdicion(false);
        setMostrarModal(true);
    };

    const abrirModalEditar = (animal) => {
        setNuevoAnimal({ ...animal });
        setAnimalEditandoId(animal.id);
        setModoEdicion(true);
        setMostrarModal(true);
    };

    const verDetallesAnimal = (animal) => {
        setAnimalDetalle(animal);
        setMostrarModalInfo(true);
    };

    const handleGuardarAnimal = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        const url = modoEdicion
            ? `http://localhost:8080/animales/${animalEditandoId}`
            : `http://localhost:8080/animales`;

        const method = modoEdicion ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(nuevoAnimal),
            });

            if (!response.ok) {
                throw new Error("Error al guardar el animal");
            }

            const actualizado = await response.json();

            if (modoEdicion) {
                setAnimales((prev) =>
                    prev.map((a) => (a.id === animalEditandoId ? actualizado : a))
                );
                showSuccess("Animal actualizado", `${actualizado.nombre} fue editado correctamente.`);
            } else {
                setAnimales((prev) => [...prev, actualizado]);
                showSuccess("Animal creado", `${actualizado.nombre} fue añadido correctamente.`);
            }

            setMostrarModal(false);
            setModoEdicion(false);
            setAnimalEditandoId(null);

        } catch (err) {
            console.error(err);
            showError("Error al guardar", "No se pudo guardar el animal.");
        }
    };

    const eliminarAnimal = async (id) => {
        const confirmacion = await showConfirm("Eliminar", "Esta acción no se puede deshacer.");
        if (!confirmacion.isConfirmed) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/animales/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setAnimales(animales.filter((a) => a.id !== id));
                showSuccess("Eliminado", "Animal eliminado correctamente.");
            } else {
                showError("Error", "No se pudo eliminar.");
            }
        } catch (err) {
            showError("Error", "Error de conexión");
        }
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
            {error && <p className="error">{error}</p>}

            <div className={`busqueda ${mostrarBusqueda ? "activa" : ""}`}>
                {!mostrarBusqueda && (
                    <button
                        onClick={() => setMostrarBusqueda(true)}
                        className="lupa-btn"
                        data-tooltip-id="tooltip"
                        data-tooltip-content="Buscar por nombre, raza o estado"
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
                    />
                )}
            </div>

            <div className="filtros" ref={filtroRef}>
                {["TODOS", "PERRO", "GATO"].map((tipo) => {
                    const icon =
                        tipo === "PERRO"
                            ? "/icons/dog.png"
                            : tipo === "GATO"
                                ? "/icons/cat.png"
                                : "/icons/shelt.png";

                    const btnRef = useRef(null);

                    return (
                        <button
                            key={tipo}
                            ref={btnRef}
                            onClick={() => handleClickFiltro(tipo, btnRef)}
                            className={
                                (!filtroPrincipal && tipo === "TODOS") || filtroPrincipal === tipo
                                    ? "activo"
                                    : ""
                            }
                            data-tooltip-id="tooltip"
                            data-tooltip-content={
                                tipo === "PERRO"
                                    ? "Mostrar perros"
                                    : tipo === "GATO"
                                        ? "Mostrar gatos"
                                        : "Mostrar todos"
                            }
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
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: `${subfiltroPos.left}px`,
                            transform: "translateX(-50%)",
                        }}
                    >
                        <div className="flecha-subfiltros" />
                        <div className="subfiltros">
                            <div className="grupo-subfiltro">
                                <button
                                    onClick={() => handleFiltroSecundario("sexo", "MACHO")}
                                    className={filtrosSecundarios.sexo === "MACHO" ? "activo" : ""}
                                >
                                    <MdMale />
                                </button>
                                <button
                                    onClick={() => handleFiltroSecundario("sexo", "HEMBRA")}
                                    className={filtrosSecundarios.sexo === "HEMBRA" ? "activo" : ""}
                                >
                                    <MdFemale />
                                </button>
                            </div>

                            <div className="grupo-subfiltro">
                                <button
                                    onClick={() => handleFiltroSecundario("etapa", "CACHORRO")}
                                    className={filtrosSecundarios.etapa === "CACHORRO" ? "activo" : ""}
                                >
                                    Cachorro
                                </button>
                                <button
                                    onClick={() => handleFiltroSecundario("etapa", "ADULTO")}
                                    className={filtrosSecundarios.etapa === "ADULTO" ? "activo" : ""}
                                >
                                    Adulto
                                </button>
                                <button
                                    onClick={() => handleFiltroSecundario("etapa", "ANCIANO")}
                                    className={filtrosSecundarios.etapa === "ANCIANO" ? "activo" : ""}
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
                    onClick={abrirModalCrear}
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Añadir nuevo animal"
                >
                    <FaPlus />
                    <img src="/icons/pets.png" alt="Añadir" className="icono-btn" />
                </button>
            </div>

            <div className="card-grid">
                {animalesFiltrados.map((animal) => (
                    <div className="animal-card" key={animal.id}>
                        <img src={animal.fotoPerfilUrl} alt={animal.nombre} />
                        <div className="animal-info">
                            <h3>{animal.nombre}</h3>
                            <p>{animal.raza}</p>
                            <button
                                className="icon-btn info-btn"
                                onClick={() => verDetallesAnimal(animal)}
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Ver detalles"
                            >
                                <FaCircleInfo />
                            </button>
                            <button
                                className="icon-btn editar-btn"
                                onClick={() => abrirModalEditar(animal)}
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Editar"
                            >
                                <FaPencilAlt />
                            </button>
                            <button
                                className="icon-btn eliminar-btn"
                                onClick={() => eliminarAnimal(animal.id)}
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Eliminar"
                            >
                                <FaTrashAlt />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {mostrarModal && (
                <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{modoEdicion ? "Editar Animal" : "Nuevo Animal"}</h3>
                        <form onSubmit={handleGuardarAnimal}>
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={nuevoAnimal.nombre}
                                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Raza"
                                value={nuevoAnimal.raza}
                                onChange={(e) => actualizarCampo("raza", e.target.value)}
                            />
                            <div className="edad-container">
                                <input
                                    type="number"
                                    placeholder="Edad"
                                    value={nuevoAnimal.edadCantidad}
                                    onChange={(e) => actualizarCampo("edadCantidad", e.target.value)}
                                    required
                                />
                                <select
                                    value={nuevoAnimal.unidadEdad}
                                    onChange={(e) => actualizarCampo("unidadEdad", e.target.value)}
                                >
                                    <option value="ANIOS">Años</option>
                                    <option value="MESES">Meses</option>
                                </select>
                            </div>
                            <select
                                value={nuevoAnimal.tipo}
                                onChange={(e) => actualizarCampo("tipo", e.target.value)}
                            >
                                <option value="PERRO">Perro</option>
                                <option value="GATO">Gato</option>
                            </select>
                            <select
                                value={nuevoAnimal.sexo}
                                onChange={(e) => actualizarCampo("sexo", e.target.value)}
                            >
                                <option value="MACHO">Macho</option>
                                <option value="HEMBRA">Hembra</option>
                            </select>
                            <select
                                value={nuevoAnimal.estado}
                                onChange={(e) => actualizarCampo("estado", e.target.value)}
                            >
                                <option value="EN_ADOPCION">En adopción</option>
                                <option value="ADOPTADO">Adoptado</option>
                                <option value="EN_CASA_DE_ACOGIDA">En casa de acogida</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Foto (URL)"
                                value={nuevoAnimal.fotoPerfilUrl}
                                onChange={(e) => actualizarCampo("fotoPerfilUrl", e.target.value)}
                            />
                            <textarea
                                placeholder="Descripción"
                                value={nuevoAnimal.descripcion}
                                onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                            />
                            <div className="modal-actions">
                                <button type="submit">{modoEdicion ? "Guardar cambios" : "Crear"}</button>
                                <button type="button" onClick={() => setMostrarModal(false)}>
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
                                src={animalDetalle.fotoPerfilUrl}
                                alt={animalDetalle.nombre}
                                className="modal-img"
                            />
                            <div className="info-linea">
                                {animalDetalle.tipo === "PERRO" ? <FaDog /> : <FaCat />}
                                {animalDetalle.sexo === "MACHO" ? <MdMale /> : <MdFemale />}
                                <span className="barra">|</span>
                                <strong>{animalDetalle.raza}</strong>
                                <span className="barra">|</span>
                                <strong>{animalDetalle.edadCantidad} {formatearEnum(animalDetalle.unidadEdad)}</strong>
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