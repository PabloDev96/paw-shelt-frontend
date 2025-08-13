import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Select from "react-select";

/**
 * Componente: Graficos
 * -------------------------------------------------------
 * Muestra un panel de métricas con filtros de periodo y 4 bloques:
 * 1) Adopciones (semana/mes/año)
 * 2) Citas al refugio (semana/mes/año)
 * 3) Nuevos animales (gatos vs perros) (semana/mes/año)
 * 4) Distribución de edad (barras) y sexo (tarta)
 *
 * Cómo integrarlo:
 * - Añade la ruta /dashboard/graficos para este componente.
 * - Añade un botón en tu dashboard principal que haga navigate("/dashboard/graficos").
 * - Asegúrate de tener disponible el backend o deja el mock activado.
 */

const API_BASE = "http://localhost:8080";

const opcionesPeriodo = [
  { value: "semana", label: "Última semana" },
  { value: "mes", label: "Último mes" },
  { value: "anio", label: "Último año" },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7d7d", "#8dd1e1", "#a4de6c"]; // pie chart

export default function Graficos() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [periodo, setPeriodo] = useState("mes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    adopciones: [], // [{ fecha: '2025-08-01', cantidad: 3 }]
    citas: [], // idem
    nuevosAnimales: [], // [{ fecha, gatos, perros }]
    edades: [], // [{ bucket: '0-1', cantidad: 12 }, ...]
    sexo: [], // [{ categoria: 'Macho', cantidad: 20 }, { categoria: 'Hembra', cantidad: 25 }]
  });

  // ---- Fetch al backend (si está disponible). Fallback a mock si falla. ----
  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/dashboard/graficos?periodo=${periodo}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancel) {
          // Espera llaves: adopciones, citas, nuevosAnimales, edades, sexo
          setData({
            adopciones: json.adopciones || [],
            citas: json.citas || [],
            nuevosAnimales: json.nuevosAnimales || [],
            edades: json.edades || [],
            sexo: json.sexo || [],
          });
        }
      } catch (e) {
        if (!cancel) {
          setError("No se pudo cargar del servidor. Mostrando datos de ejemplo.");
          setData(makeMock(periodo));
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [periodo, token]);

  // ---- Helpers visuales ----
  const tituloPeriodo = useMemo(() => {
    switch (periodo) {
      case "semana":
        return "(última semana)";
      case "anio":
        return "(último año)";
      default:
        return "(último mes)";
    }
  }, [periodo]);

  return (
    <div className="graficos-wrapper" style={{ padding: 16 }}>
      <div className="graficos-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Estadísticas {tituloPeriodo}</h2>
        <div style={{ width: 260, marginLeft: "auto" }}>
          <Select
            classNamePrefix="graficos"
            options={opcionesPeriodo}
            value={opcionesPeriodo.find((o) => o.value === periodo)}
            onChange={(opt) => setPeriodo(opt?.value || "mes")}
            placeholder="Periodo"
            isClearable={false}
          />
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: 8, color: "#664d03" }}>
          {error}
        </div>
      )}

      <div className="graficos-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* 1) Adopciones */}
        <ChartCard title="Adopciones">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.adopciones} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis allowDecimals={false} />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="cantidad" name="Adopciones" stroke="#4dabf7" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2) Citas al refugio */}
        <ChartCard title="Citas al refugio">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.citas} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis allowDecimals={false} />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="cantidad" name="Citas" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3) Nuevos animales (apilado gatos/perros) */}
        <ChartCard title="Nuevos animales (gatos/perros)">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.nuevosAnimales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis allowDecimals={false} />
              <ReTooltip />
              <Legend />
              <Bar dataKey="gatos" name="Gatos" stackId="a" fill="#ff6b6b" />
              <Bar dataKey="perros" name="Perros" stackId="a" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4) Edad (barras) + Sexo (tarta) */}
        <div className="graficos-duo" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <ChartCard title="Distribución de edades (años)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.edades} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Legend />
                <Bar dataKey="cantidad" name="Animales" fill="#a4de6c" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sexo de los animales">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.sexo} dataKey="cantidad" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label>
                  {data.sexo.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Loading overlay simple */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.6)", display: "grid", placeItems: "center" }}>
          <div style={{ padding: 12, borderRadius: 10, background: "white", boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>Cargando…</div>
        </div>
      )}

      {/* Estilos mínimos para tarjetas / grid responsive */}
      <style>{`
        .chart-card { background: #fff; border: 1px solid #eaeaea; border-radius: 14px; padding: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.04); }
        .chart-card h3 { margin: 0 0 8px 0; font-size: 16px; }
        @media (min-width: 900px) {
          .graficos-grid { grid-template-columns: 1fr 1fr; }
          .graficos-duo { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// ---- MOCK de datos para ver el diseño sin backend ----
function makeMock(periodo) {
  const points = periodo === "semana" ? 7 : periodo === "anio" ? 12 : 30;
  const hoy = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);

  const adopciones = [];
  const citas = [];
  const nuevosAnimales = [];
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(hoy);
    if (periodo === "semana") d.setDate(hoy.getDate() - i);
    if (periodo === "mes") d.setDate(hoy.getDate() - i);
    if (periodo === "anio") d.setMonth(hoy.getMonth() - i);

    adopciones.push({ fecha: periodo === "anio" ? d.toLocaleString("es-ES", { month: "short", year: "2-digit" }) : fmt(d), cantidad: rnd(0, 6) });
    citas.push({ fecha: periodo === "anio" ? d.toLocaleString("es-ES", { month: "short", year: "2-digit" }) : fmt(d), cantidad: rnd(1, 10) });
    nuevosAnimales.push({ fecha: periodo === "anio" ? d.toLocaleString("es-ES", { month: "short", year: "2-digit" }) : fmt(d), gatos: rnd(0, 5), perros: rnd(0, 5) });
  }

  const edades = [
    { bucket: "0-1", cantidad: rnd(5, 20) },
    { bucket: "2-5", cantidad: rnd(5, 25) },
    { bucket: "6-9", cantidad: rnd(2, 18) },
    { bucket: "10+", cantidad: rnd(1, 12) },
  ];

  const sexo = [
    { categoria: "Macho", cantidad: rnd(10, 40) },
    { categoria: "Hembra", cantidad: rnd(10, 40) },
  ];

  return { adopciones, citas, nuevosAnimales, edades, sexo };
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
