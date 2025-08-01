import React, { useState } from "react";
import { Calendar, Views } from "react-big-calendar";
import { localizer } from "../utils/calendarUtils";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./styles/Citas.css";

const mockCitas = [
  {
    id: 1,
    animal: "Bobby",
    personaContacto: "María Gómez",
    fecha: "2025-08-01T10:00:00",
  },
  {
    id: 2,
    animal: "Luna",
    personaContacto: "Carlos Pérez",
    fecha: "2025-08-02T12:00:00",
  },
];

export default function Citas() {
  const [vista, setVista] = useState("calendario"); // "lista" o "calendario"

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
  };

  return (
    <div className="citas-container">
      <div className="citas-header">
        <h2>Citas</h2>
        <div className="vista-toggle">
          <button onClick={() => cambiarVista("calendario")} className={vista === "calendario" ? "activo" : ""}>
            Calendario
          </button>
          <button onClick={() => cambiarVista("lista")} className={vista === "lista" ? "activo" : ""}>
            Lista
          </button>
        </div>
      </div>

      {vista === "calendario" ? (
        <div className="calendario-wrapper">
          <Calendar
            localizer={localizer}
            events={mockCitas.map((cita) => ({
              title: `${cita.animal} - ${cita.personaContacto}`,
              start: new Date(cita.fecha),
              end: new Date(new Date(cita.fecha).getTime() + 30 * 60 * 1000), // 30 min
              allDay: false,
            }))}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            style={{ height: 500 }}
            popup
          />
        </div>
      ) : (
        <div className="lista-citas">
          {mockCitas.map((cita) => (
            <div key={cita.id} className="item-cita">
              <strong>{cita.animal}</strong> - {cita.personaContacto}
              <div>{new Date(cita.fecha).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
