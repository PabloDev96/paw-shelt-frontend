import React, { useEffect, useState } from "react";
import "./styles/Animales.css";
import { useNavigate } from "react-router-dom";


export default function Animales() {
    const [animales, setAnimales] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnimales = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("No hay token. Inicia sesión de nuevo.");
                    navigate("/");
                    return;
                }

                const response = await fetch("http://localhost:8080/animales", {
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
            } catch (err) {
                console.error("Error:", err);
                setError("No se pudieron cargar los animales.");
            }
        };

        fetchAnimales();
    }, [navigate]);

    return (
        <div className="animales-container">
            <h2>Listado de Animales</h2>

            {error && <p className="error">{error}</p>}

            <div className="card-grid">
                {animales.map((animal) => (
                    <div className="animal-card" key={animal.id}>
                        <img src={animal.imagen} alt={animal.nombre} />
                        <div className="animal-info">
                            <h3>{animal.nombre}</h3>
                            <p>{animal.tipo}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
