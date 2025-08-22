import React, { useEffect, useState } from "react";
import "./styles/Graficos.css";
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
import { API_URL } from "../utils/config.js";

const opcionesPeriodo = [
  { value: "semana", label: "Última semana" },
  { value: "mes", label: "Último mes" },
  { value: "anio", label: "Último año" },
];

const COLORS = ["#4dabf7", "#ff6b6b", "#82ca9d", "#ffc658"];

export default function Graficos() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // cada gráfico tiene su propio periodo y datos
  const [comparativa, setComparativa] = useState([]);
  const [periodoComparativa, setPeriodoComparativa] = useState("mes");

  const [nuevosAnimales, setNuevosAnimales] = useState([]);
  const [periodoNuevos, setPeriodoNuevos] = useState("mes");

  const [edades, setEdades] = useState([]);
  const [periodoEdades, setPeriodoEdades] = useState("mes");

  const [sexo, setSexo] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [periodoQuesos, setPeriodoQuesos] = useState("mes");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // función reutilizable para cargar datos de servidor o mock
  async function loadData(periodo, setter, key) {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/graficos?periodo=${periodo}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();

      switch (key) {
        case "comparativa":
          setter(mergeData(json.adopciones || [], json.citas || []));
          break;
        case "nuevosAnimales":
          setter(json.nuevosAnimales || []);
          break;
        case "edades":
          setter(json.edades || []);
          break;
        case "quesos":
          setSexo(json.sexo || []);
          setEspecies(json.especies || []);
          break;
      }
    } catch (e) {
      setError("No se pudo cargar del servidor. Mostrando datos de ejemplo.");
      const mock = makeMock(periodo);
      if (key === "comparativa") setter(mergeData(mock.adopciones, mock.citas));
      if (key === "nuevosAnimales") setter(mock.nuevosAnimales);
      if (key === "edades") setter(mock.edades);
      if (key === "quesos") {
        setSexo(mock.sexo);
        setEspecies(mock.especies);
      }
    } finally {
      setLoading(false);
    }
  }

  // efectos separados
  useEffect(() => {
    loadData(periodoComparativa, setComparativa, "comparativa");
  }, [periodoComparativa]);

  useEffect(() => {
    loadData(periodoNuevos, setNuevosAnimales, "nuevosAnimales");
  }, [periodoNuevos]);

  useEffect(() => {
    loadData(periodoEdades, setEdades, "edades");
  }, [periodoEdades]);

  useEffect(() => {
    loadData(periodoQuesos, null, "quesos");
  }, [periodoQuesos]);

  return (
    <div style={{ padding: 16 }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 10, background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: 8, color: "#664d03" }}>
          {error}
        </div>
      )}

      {/* Comparativa */}
      <Section title="Adopciones vs Citas" periodo={periodoComparativa} setPeriodo={setPeriodoComparativa}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={comparativa}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Legend />
            <Line type="monotone" dataKey="adopciones" name="Adopciones" stroke="#4dabf7" dot={false} />
            <Line type="monotone" dataKey="citas" name="Citas" stroke="#ff6b6b" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* Nuevos animales */}
      <Section title="Nuevos animales (gatos/perros)" periodo={periodoNuevos} setPeriodo={setPeriodoNuevos}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={nuevosAnimales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Legend />
            <Bar dataKey="gatos" name="Gatos" stackId="a" fill="#ff6b6b" />
            <Bar dataKey="perros" name="Perros" stackId="a" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Edades */}
      <Section title="Distribución de edades (años)" periodo={periodoEdades} setPeriodo={setPeriodoEdades}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={edades}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Legend />
            <Bar dataKey="cantidad" name="Animales" fill="#a4de6c" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Quesos */}
      <Section title="Distribución de sexo y especies" periodo={periodoQuesos} setPeriodo={setPeriodoQuesos}>
        <div className="quesos-grid">
          <div>
            <h4 style={{ textAlign: "center", marginBottom: 8 }}>Sexo de los animales</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sexo} dataKey="cantidad" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label>
                  {sexo.map((entry, idx) => (
                    <Cell key={`cell-sexo-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 style={{ textAlign: "center", marginBottom: 8 }}>Gatos vs Perros</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={especies} dataKey="cantidad" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label>
                  {especies.map((entry, idx) => (
                    <Cell key={`cell-esp-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.6)", display: "grid", placeItems: "center" }}>
          <div style={{ padding: 12, borderRadius: 10, background: "white", boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>Cargando…</div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para título + selector
function Section({ title, periodo, setPeriodo, children }) {
  const label = periodo === "semana" ? "(última semana)" : periodo === "anio" ? "(último año)" : "(último mes)";
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title} {label}</h3>
        <div style={{ width: 200 }}>
          <Select
            classNamePrefix="graficos"
            options={opcionesPeriodo}
            value={opcionesPeriodo.find((o) => o.value === periodo)}
            onChange={(opt) => setPeriodo(opt?.value || "mes")}
          />
        </div>
      </div>
      {children}
    </div>
  );
}

function mergeData(adopciones, citas) {
  const map = {};
  adopciones.forEach(a => {
    map[a.fecha] = { fecha: a.fecha, adopciones: a.cantidad, citas: 0 };
  });
  citas.forEach(c => {
    if (!map[c.fecha]) map[c.fecha] = { fecha: c.fecha, adopciones: 0, citas: c.cantidad };
    else map[c.fecha].citas = c.cantidad;
  });
  return Object.values(map).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

function makeMock(periodo) {
  const points = periodo === "semana" ? 7 : periodo === "anio" ? 12 : 30;
  const hoy = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const adopciones = [];
  const citas = [];
  const nuevosAnimales = [];
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(hoy);
    if (periodo === "anio") d.setMonth(hoy.getMonth() - i);
    else d.setDate(hoy.getDate() - i);
    const fechaLabel = periodo === "anio" ? d.toLocaleString("es-ES", { month: "short", year: "2-digit" }) : fmt(d);
    adopciones.push({ fecha: fechaLabel, cantidad: rnd(0, 6) });
    citas.push({ fecha: fechaLabel, cantidad: rnd(1, 10) });
    nuevosAnimales.push({ fecha: fechaLabel, gatos: rnd(0, 5), perros: rnd(0, 5) });
  }
  const edades = [
    { categoria: "0-1", cantidad: rnd(5, 20) },
    { categoria: "2-5", cantidad: rnd(5, 25) },
    { categoria: "6-9", cantidad: rnd(2, 18) },
    { categoria: "10+", cantidad: rnd(1, 12) },
  ];
  const sexo = [
    { categoria: "Hembra", cantidad: rnd(10, 40) },
    { categoria: "Macho", cantidad: rnd(10, 40) },
  ];
  const especies = [
    { categoria: "Gatos", cantidad: rnd(5, 25) },
    { categoria: "Perros", cantidad: rnd(5, 25) },
  ];
  return { adopciones, citas, sexo, especies, nuevosAnimales, edades };
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
