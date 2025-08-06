import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { jsPDF } from "jspdf"; // <-- NUEVO
import "react-datepicker/dist/react-datepicker.css";
import "./styles/Adopciones.css";
import { showSuccess, showError } from "../utils/alerts";

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
        const res = await fetch("http://localhost:8080/adoptantes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAdoptantes(data);
    };

    const generarPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Pawshelt - Confirmación de Adopción", 20, 20);

        doc.setFontSize(12);
        doc.text(`📅 Fecha de adopción: ${fechaAdopcion.toLocaleDateString("es-ES")}`, 20, 40);

        doc.text(`🐶 Mascota adoptada: ${animalSeleccionado.label}`, 20, 50);
        const animal = animales.find(a => a.id === animalSeleccionado.value);
        if (animal?.raza) doc.text(`Raza: ${animal.raza}`, 20, 60);

        doc.text(`👤 Adoptante: ${adoptanteSeleccionado.label}`, 20, 80);
        const adoptante = adoptantes.find(a => a.id === adoptanteSeleccionado.value);
        if (adoptante) {
            doc.text(`Teléfono: ${adoptante.telefono || "-"}`, 20, 90);
            doc.text(`Email: ${adoptante.email || "-"}`, 20, 100);
        }

        doc.text(`📝 Observaciones:`, 20, 120);
        doc.text(observaciones || "-", 20, 130);

        doc.setFontSize(10);
        doc.text("Gracias por dar una segunda oportunidad 🐾", 20, 150);
        doc.text("Pawshelt | contacto@pawshelt.org | www.pawshelt.org", 20, 280);

        doc.save(`Adopcion_${animalSeleccionado.label}_${fechaAdopcion.toLocaleDateString("es-ES")}.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!animalSeleccionado || !adoptanteSeleccionado || !fechaAdopcion) {
            return showError("Campos obligatorios", "Seleccioná animal, adoptante y fecha.");
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
            showSuccess("Adopción registrada");
            generarPDF(); // <-- AQUÍ GENERAMOS EL PDF

            // Resetear el formulario
            setAnimalSeleccionado(null);
            setAdoptanteSeleccionado(null);
            setFechaAdopcion(null);
            setObservaciones("");
        } else {
            showError("Error", "No se pudo registrar la adopción");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="formulario-adopcion">
            <h3>Nueva Adopción</h3>

            <label>Animal</label>
            <Select
                options={animales.map((a) => ({ value: a.id, label: a.nombre }))}
                value={animalSeleccionado}
                onChange={setAnimalSeleccionado}
                placeholder="Seleccionar animal..."
                className="adopciones-select"
                classNamePrefix="adopciones"
            />

            <label>Adoptante</label>
            <Select
                options={adoptantes.map((p) => ({ value: p.id, label: p.nombre }))}
                value={adoptanteSeleccionado}
                onChange={setAdoptanteSeleccionado}
                placeholder="Seleccionar adoptante..."
                className="adopciones-select"
                classNamePrefix="adopciones"
            />

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
