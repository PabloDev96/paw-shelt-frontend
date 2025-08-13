import React, { useEffect, useState, useMemo } from "react";
import { showConfirm, showSuccess, showError } from "../utils/alerts";
import { FaTrashAlt } from "react-icons/fa";
import { FaRegFilePdf } from "react-icons/fa6";
import "./styles/ListadoAdopciones.css";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { generarPDF } from "../utils/generarPDF.JS";

export default function ListadoAdopciones() {
  const [adopciones, setAdopciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState([]);
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/adopciones", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAdopciones(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar adopciones:", err);
        setLoading(false);
      });
  }, []);

  const diasUnicos = useMemo(() => {
    const dias = adopciones
      .map((a) => (a.fechaAdopcion ? new Date(a.fechaAdopcion).getDate() : null))
      .filter(Boolean);
    return [...new Set(dias)].sort((a, b) => a - b);
  }, [adopciones]);

  const mesesUnicos = useMemo(() => {
    const meses = adopciones
      .map((a) => (a.fechaAdopcion ? new Date(a.fechaAdopcion).getMonth() + 1 : null))
      .filter(Boolean);
    return [...new Set(meses)].sort((a, b) => a - b);
  }, [adopciones]);

  const añosUnicos = useMemo(() => {
    const años = adopciones
      .map((a) => (a.fechaAdopcion ? new Date(a.fechaAdopcion).getFullYear() : null))
      .filter(Boolean);
    return [...new Set(años)].sort((a, b) => a - b);
  }, [adopciones]);

  const handleAbrirPDF = (adopcion) => {
    generarPDF(
      adopcion.animal,
      adopcion.adoptante,
      new Date(adopcion.fechaAdopcion),
      adopcion.observaciones
    );
  };

  const handleEliminarAdopcion = async (id) => {
    // Confirmación
    const { isConfirmed } = await showConfirm(
      "¿Eliminar adopción?",
      "Esta acción no se puede deshacer."
    );
    if (!isConfirmed) return;

    try {
      setDeletingIds((prev) => new Set(prev).add(id));

      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/adopciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // 204 No Content o 200 OK
        setAdopciones((prev) => prev.filter((a) => a.id !== id));
        await showSuccess("Eliminado", "La adopción se eliminó correctamente.");
      } else {
        // Intenta leer el cuerpo para mensaje más útil
        let detalle = "";
        try { detalle = await res.text(); } catch (_) { }
        const msgPorEstado =
          res.status === 403 ? "No tienes permisos para eliminar."
            : res.status === 404 ? "La adopción no existe o ya fue eliminada."
              : res.status === 409 ? "No se puede eliminar por una restricción."
                : "Intenta nuevamente en unos segundos.";
        await showError(
          `Error ${res.status}`,
          detalle?.trim() ? detalle : msgPorEstado
        );
      }
    } catch (err) {
      await showError("Error inesperado", err?.message ?? "Fallo de red.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "fechaAdopcion",
        accessorFn: (row) => row.fechaAdopcion,
        cell: ({ getValue }) =>
          new Date(getValue()).toLocaleDateString("es-ES"),
        enableColumnFilter: true,
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;
          const fecha = new Date(row.getValue(id));
          const { dia, mes, año } = filterValue;
          if (dia && fecha.getDate() !== Number(dia)) return false;
          if (mes && fecha.getMonth() + 1 !== Number(mes)) return false;
          if (año && fecha.getFullYear() !== Number(año)) return false;
          return true;
        },
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || {};
          return (
            <div className="header-filtro-contenedor">
              <span>Fecha</span>
              <div className="header-filtros-fecha">
                <select
                  className="filtro-columna"
                  value={filterValue.dia || ""}
                  onChange={(e) =>
                    column.setFilterValue({
                      ...filterValue,
                      dia: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Día</option>
                  {diasUnicos.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
                <select
                  className="filtro-columna"
                  value={filterValue.mes || ""}
                  onChange={(e) =>
                    column.setFilterValue({
                      ...filterValue,
                      mes: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Mes</option>
                  {mesesUnicos.map((mes) => (
                    <option key={mes} value={mes}>
                      {mes}
                    </option>
                  ))}
                </select>
                <select
                  className="filtro-columna"
                  value={filterValue.año || ""}
                  onChange={(e) =>
                    column.setFilterValue({
                      ...filterValue,
                      año: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Año</option>
                  {añosUnicos.map((año) => (
                    <option key={año} value={año}>
                      {año}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        },
      },
      {
        header: "Animal",
        accessorFn: (row) => row.animal?.nombre ?? "",
        id: "animalNombre",
        enableColumnFilter: true,
      },
      {
        header: "Adoptante",
        accessorFn: (row) => row.adoptante?.nombre ?? "",
        id: "adoptanteNombre",
        enableColumnFilter: true,
      },
      {
        header: "Observaciones",
        accessorKey: "observaciones",
        enableColumnFilter: false,
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div>
            <button onClick={() => handleAbrirPDF(row.original)}>
              <FaRegFilePdf className="icono-accion" />
            </button>
            <button onClick={() => handleEliminarAdopcion(row.original.id)}>
              <FaTrashAlt className="icono-accion" />
            </button>
          </div>
        ),
        enableColumnFilter: false,
      },
    ],
    [diasUnicos, mesesUnicos, añosUnicos]
  );

  const table = useReactTable({
    data: adopciones,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 8, // Solo 8 filas por página
      },
    },
  });

  if (loading) return <p>Cargando adopciones...</p>;
  if (adopciones.length === 0) return <p>No hay adopciones registradas.</p>;

  return (
    <div className="listado-adopciones-container">
      <table
        border={1}
        cellPadding={5}
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={{ verticalAlign: "top" }}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {/* Para columnas que no sean fecha, el input filtro a la derecha */}
                  {header.column.id !== "fechaAdopcion" &&
                    header.column.getCanFilter() ? (
                    <div className="header-filtro-contenedor">
                      <span style={{ flex: "1 0 auto" }}></span>
                      <input
                        className={`filtro-columna filtro-${header.column.id}`}
                        value={header.column.getFilterValue() ?? ""}
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value)
                        }
                        placeholder={`Buscar ${header.column.columnDef.header}`}
                      />
                    </div>
                  ) : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-buttons">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <span className="pagination-info">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>
      </div>
    </div>
  );
}
