import React, { useEffect, useState } from "react";
import "./styles/Animales.css";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import { FaCircleInfo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FaDog, FaCat } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";


const formatearEnum = (valor) => {
    if (!valor) return "";

    const reemplazos = {
        ANIOS: "Años",
        MESES: "Meses",
        PERRO: "Perro",
        GATO: "Gato",
        ADOPTADO: "Adoptado",
        EN_ADOPCION: "En adopción",
        EN_CASA_DE_ACOGIDA: "En casa de acogida"
    };

    return reemplazos[valor] || (
        valor
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/^\w/, (c) => c.toUpperCase())
    );
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
        descripcion: "",
        estado: "EN_ADOPCION",
        fotoPerfilUrl: ""
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchAnimales();
    }, [navigate]);

    const fetchAnimales = async (tipo = null) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No hay token. Inicia sesión de nuevo.");
                navigate("/");
                return;
            }

            const endpoint = tipo
                ? `http://localhost:8080/animales/tipo/${tipo}`
                : `http://localhost:8080/animales`;

            const response = await fetch(endpoint, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                setError("No autorizado. Inicia sesión de nuevo.");
                navigate("/");
                return;
            }

            if (!response.ok) {
                throw new Error("Error al obtener los animales");
            }

            const data = await response.json();
            setAnimales(data);
            setError("");
        } catch (err) {
            console.error("Error:", err);
            setError("No se pudieron cargar los animales.");
        }
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
            estado: "EN_ADOPCION",
            fotoPerfilUrl: ""
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
            } else {
                setAnimales((prev) => [...prev, actualizado]);
            }

            setMostrarModal(false);
            setModoEdicion(false);
            setAnimalEditandoId(null);
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar el animal.");
        }
    };

    const eliminarAnimal = async (id) => {
        const confirmacion = window.confirm("¿Seguro que deseas eliminar este animal?");
        if (!confirmacion) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/animales/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setAnimales(animales.filter((a) => a.id !== id));
            } else {
                alert("Error al eliminar el animal");
            }
        } catch (err) {
            console.error(err);
            alert("Error al eliminar el animal");
        }
    };

    const animalesFiltrados = animales.filter((animal) => {
        const termino = busqueda.toLowerCase();
        return (
            animal.nombre.toLowerCase().includes(termino) ||
            animal.raza.toLowerCase().includes(termino)
        );
    });

    return (
        <div className="animales-container">
            <h2>Animales del refugio</h2>

            {error && <p className="error">{error}</p>}

            <div className="filtros">
                <button onClick={() => fetchAnimales()}>
                    <img src="/icons/shelt.png" alt="Todos" className="icono-btn" />
                </button>
                <button onClick={() => fetchAnimales("PERRO")}>
                    <img src="/icons/dog.png" alt="Perros" className="icono-btn" />
                </button>
                <button onClick={() => fetchAnimales("GATO")}>
                    <img src="/icons/cat.png" alt="Gatos" className="icono-btn" />
                </button>
            </div>

            <div className={`busqueda ${mostrarBusqueda ? "activa" : ""}`}>
    {!mostrarBusqueda && (
        <button onClick={() => setMostrarBusqueda(true)} className="lupa-btn">
            <img src="/icons/search.png" alt="Buscar" className="icono-btn" />
        </button>
    )}
    {mostrarBusqueda && (
        <input
            type="text"
            placeholder="Buscar por nombre o raza"
            value={busqueda}
            autoFocus
            onChange={(e) => setBusqueda(e.target.value)}
            onBlur={() => {
                if (!busqueda) setMostrarBusqueda(false);
            }}
        />
    )}
</div>


            <div className="acciones">
                <button className="añadir-btn" onClick={abrirModalCrear}>
                    <FaPlus /><img src="/icons/pets.png" alt="Añadir" className="icono-btn" />
                </button>
            </div>

            <div className="card-grid">
                {animalesFiltrados.map((animal) => (
                    <div className="animal-card" key={animal.id}>
                        <img src={animal.fotoPerfilUrl} alt={animal.nombre} />
                        <div className="animal-info">
                            <h3>{animal.nombre}</h3>
                            <p>{animal.raza}</p>
                            <button className="icon-btn info-btn" onClick={() => verDetallesAnimal(animal)}>
                                <FaCircleInfo />
                            </button>
                            <button className="icon-btn editar-btn" onClick={() => abrirModalEditar(animal)}>
                                <FaPencilAlt />
                            </button>
                            <button className="icon-btn eliminar-btn" onClick={() => eliminarAnimal(animal.id)}>
                                <FaTrashAlt />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal">
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
                                    value={nuevoAnimal.unidadEdad || "ANIOS"}
                                    onChange={(e) => actualizarCampo("unidadEdad", e.target.value)}
                                >
                                    <option value="ANIOS">Años</option>
                                    <option value="MESES">Meses</option>
                                </select>
                            </div>
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
                                rows={4}
                            />
                            <select
                                value={nuevoAnimal.tipo}
                                onChange={(e) => actualizarCampo("tipo", e.target.value)}
                            >
                                <option value="PERRO">Perro</option>
                                <option value="GATO">Gato</option>
                            </select>
                            <select
                                value={nuevoAnimal.estado}
                                onChange={(e) => actualizarCampo("estado", e.target.value)}
                            >
                                <option value="EN_ADOPCION">En Adopción</option>
                                <option value="ADOPTADO">Adoptado</option>
                                <option value="EN_CASA_DE_ACOGIDA">En casa de acogida</option>
                            </select>

                            <div className="modal-actions">
                                <button type="submit">{modoEdicion ? "Guardar Cambios" : "Crear"}</button>
                                <button type="button" onClick={() => setMostrarModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalInfo && animalDetalle && (
                <div className="modal-overlay">
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
        </div>
    );
}
