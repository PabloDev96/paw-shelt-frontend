import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import { LuDog } from "react-icons/lu";
import { IoCalendarOutline } from "react-icons/io5";
import { MdEuro } from "react-icons/md";
import { MdPersonAdd } from "react-icons/md";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h2>Panel Principal</h2>
      <div className="button-grid">
        <button onClick={() => navigate("/animales")}>
          <LuDog className="icon" />
        </button>
        <button onClick={() => navigate("/citas")}>
          <IoCalendarOutline className="icon" />
        </button>
        <button onClick={() => navigate("/finanzas")}>
          <MdEuro className="icon" />
        </button>
        <button onClick={() => navigate("/crear-usuario")}>
          <MdPersonAdd className="icon" />
        </button>
      </div>
    </div>
  );
}
