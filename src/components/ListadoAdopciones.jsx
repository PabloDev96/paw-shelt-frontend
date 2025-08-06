import React, { useEffect, useState } from 'react';

const ListadoAdopciones = () => {
  const [adopciones, setAdopciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const token = localStorage.getItem("token");

  fetch("http://localhost:8080/adopciones", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error en la respuesta");
      return res.json();
    })
    .then((data) => {
      setAdopciones(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error al cargar adopciones:", err);
      setLoading(false);
    });
}, []);


  if (loading) return <p>Cargando adopciones...</p>;

  return (
    <div>
      {adopciones.length === 0 ? (
        <p>No hay adopciones registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Animal</th>
              <th>Adoptante</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {adopciones.map((adopcion) => (
              <tr key={adopcion.id}>
                <td>{adopcion.fechaAdopcion}</td>
                <td>{adopcion.nombreAnimal}</td>
                <td>{adopcion.nombreAdoptante}</td>
                <td>{adopcion.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ListadoAdopciones;
