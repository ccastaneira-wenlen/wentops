"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { grantAdminRole } from "../actions/admin";

const SECTOR_COLORS: Record<string, string> = {
  "Fractura": "#e60000",
  "Well Testing": "#ff6600",
  "Wireline": "#ffcc00",
  "Wireline/Slickline": "#ffcc00",
  "Mantenimiento": "#3399ff",
  "SBDP": "#9966ff",
  "Administración": "#00cc66",
  "MASS": "#ff3399",
  "Calidad": "#00ccff",
  "Almacen": "#ff9900",
  "Logistica": "#66cc00",
};

function getColor(sector: string) {
  return SECTOR_COLORS[sector] || "#a0a0a0";
}

function getShortSector(sector: string) {
  if (!sector) return "—";
  if (sector.includes("Tercera compañia") || sector.includes("Tercera compania")) return "3ra Cía.";
  if (sector === "Wireline/Slickline") return "Wireline/Slick.";
  if (sector === "Administración" || sector === "Administracion") return "Admin.";
  if (sector === "Mantenimiento") return "Mantenim.";
  if (sector.includes("Directorio") || sector.includes("Gerencia")) return "Gerencia";
  if (sector.length > 18) return sector.slice(0, 16) + "...";
  return sector;
}

export default function AdminClient({ wentops }: { wentops: any[] }) {
  const router = useRouter();
  const [isGranting, setIsGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filtros solicitados
  const [filterObservedSector, setFilterObservedSector] = useState("ALL");
  const [filterObserverSector, setFilterObserverSector] = useState("ALL");
  const [filterObserver, setFilterObserver] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ABIERTA" | "CERRADA">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper para sector al que pertenece el observador
  const getEffectiveObserverSector = (w: any) => {
    if (w.observerSector === "Otros" && w.observerSectorOther) {
      return w.observerSectorOther;
    }
    return w.observerSector || "";
  };

  // Listados únicos para los dropdowns
  const observedSectors = useMemo(() => {
    return Array.from(
      new Set(wentops.map(w => w.observedSector).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [wentops]);

  const observerSectors = useMemo(() => {
    const set = new Set<string>();
    wentops.forEach(w => {
      const s = getEffectiveObserverSector(w);
      if (s) set.add(s);
      if (w.observerSector && w.observerSector !== "Otros") set.add(w.observerSector);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [wentops]);

  const observers = useMemo(() => {
    return Array.from(
      new Set(wentops.map(w => w.observerName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [wentops]);

  // Filtrado combinado
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wentops.filter(w => {
      const matchStatus = filterStatus === "ALL" || w.status === filterStatus;
      const matchObservedSector = filterObservedSector === "ALL" || w.observedSector === filterObservedSector;
      const effectiveObserverSector = getEffectiveObserverSector(w);
      const matchObserverSector =
        filterObserverSector === "ALL" ||
        effectiveObserverSector === filterObserverSector ||
        w.observerSector === filterObserverSector;
      const matchObserver = filterObserver === "ALL" || w.observerName === filterObserver;

      const matchQuery =
        !q ||
        (w.observerName && w.observerName.toLowerCase().includes(q)) ||
        (w.place && w.place.toLowerCase().includes(q)) ||
        (w.client && w.client.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        `#${w.id}`.includes(q);

      return matchStatus && matchObservedSector && matchObserverSector && matchObserver && matchQuery;
    });
  }, [wentops, filterStatus, filterObservedSector, filterObserverSector, filterObserver, searchQuery]);

  // Contabilización en tiempo real
  const totalFiltered = filtered.length;
  const openFiltered = filtered.filter(w => w.status === "ABIERTA").length;
  const closedFiltered = filtered.filter(w => w.status === "CERRADA").length;
  const ratedFiltered = filtered.filter(w => w.rating);
  const avgFilteredRating =
    ratedFiltered.length > 0
      ? (ratedFiltered.reduce((sum, w) => sum + (w.rating || 0), 0) / ratedFiltered.length).toFixed(1)
      : "—";

  const isFiltered =
    filterStatus !== "ALL" ||
    filterObservedSector !== "ALL" ||
    filterObserverSector !== "ALL" ||
    filterObserver !== "ALL" ||
    searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setFilterStatus("ALL");
    setFilterObservedSector("ALL");
    setFilterObserverSector("ALL");
    setFilterObserver("ALL");
    setSearchQuery("");
  };

  const handleGrantAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGranting(true);
    setGrantMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      const result = await grantAdminRole(formData);
      setGrantMsg("✅ " + result.message);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setGrantMsg("❌ " + error.message);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <>
      {/* Top action bar: Grant admin panel */}
      <div style={{ marginBottom: "20px" }}>
        <div className="glass-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              🔑 Otorgar Acceso Administrador
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Asigna permisos de administrador a un empleado ingresando su DNI
            </span>
          </div>
          <form onSubmit={handleGrantAdmin} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", maxWidth: "600px" }}>
            <div style={{ flex: "1", minWidth: "220px" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px" }}>DNI del usuario</label>
              <input type="text" name="dni" className="form-input" placeholder="Ej: 33532816" required style={{ padding: "8px 12px" }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isGranting} style={{ padding: "8px 18px", whiteSpace: "nowrap" }}>
              {isGranting ? "Procesando..." : "Dar Permiso"}
            </button>
          </form>
          {grantMsg && (
            <p style={{ marginTop: "8px", fontSize: "0.85rem", color: grantMsg.startsWith("✅") ? "var(--success)" : "var(--accent-red)" }}>
              {grantMsg}
            </p>
          )}
        </div>
      </div>

      {/* Main Filter and Live Counting Card */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        {/* Header con botón de reset si hay filtros */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              🔍 Filtros y Contabilización
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
              Filtra por Sector Observado, Sector al que pertenece y Observador con conteo en tiempo real.
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{
                padding: "6px 14px",
                fontSize: "0.8rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderColor: "rgba(230,0,0,0.4)",
                color: "var(--accent-red)",
              }}
            >
              ✕ Restablecer Filtros
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          alignItems: "flex-end"
        }}>
          {/* 1. Sector Observado */}
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              🎯 Sector Observado
            </label>
            <select
              className="form-select"
              value={filterObservedSector}
              onChange={e => setFilterObservedSector(e.target.value)}
              style={{ padding: "8px 12px", width: "100%", fontSize: "0.85rem" }}
            >
              <option value="ALL">Todos los sectores observados ({observedSectors.length})</option>
              {observedSectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 2. Sector al que pertenece */}
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              🏢 Sector al que pertenece
            </label>
            <select
              className="form-select"
              value={filterObserverSector}
              onChange={e => setFilterObserverSector(e.target.value)}
              style={{ padding: "8px 12px", width: "100%", fontSize: "0.85rem" }}
            >
              <option value="ALL">Todos los sectores de pertenencia ({observerSectors.length})</option>
              {observerSectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 3. Observador */}
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              👤 Observador
            </label>
            <select
              className="form-select"
              value={filterObserver}
              onChange={e => setFilterObserver(e.target.value)}
              style={{ padding: "8px 12px", width: "100%", fontSize: "0.85rem" }}
            >
              <option value="ALL">Todos los observadores ({observers.length})</option>
              {observers.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* 4. Estado */}
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              📌 Estado
            </label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              style={{ padding: "8px 12px", width: "100%", fontSize: "0.85rem" }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ABIERTA">Abiertas</option>
              <option value="CERRADA">Cerradas</option>
            </select>
          </div>

          {/* 5. Búsqueda libre */}
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              🔎 Búsqueda rápida
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Pozo, cliente, ID, texto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: "8px 12px", width: "100%", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        {/* Live Counters (Contabilización del Total y Métricas) */}
        <div style={{
          marginTop: "20px",
          paddingTop: "18px",
          borderTop: "1px solid var(--border-light)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
            {/* Total Contabilizado */}
            <div style={{
              background: "rgba(230, 0, 0, 0.08)",
              border: "1px solid rgba(230, 0, 0, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "var(--accent-red)", lineHeight: 1 }}>
                {totalFiltered}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "6px", fontWeight: "600" }}>
                Total Contabilizado
              </div>
            </div>

            {/* Abiertas */}
            <div style={{
              background: "rgba(255, 77, 77, 0.08)",
              border: "1px solid rgba(255, 77, 77, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "#ff4d4d", lineHeight: 1 }}>
                {openFiltered}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "6px", fontWeight: "600" }}>
                Abiertas
              </div>
            </div>

            {/* Cerradas */}
            <div style={{
              background: "rgba(0, 204, 102, 0.08)",
              border: "1px solid rgba(0, 204, 102, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "var(--success)", lineHeight: 1 }}>
                {closedFiltered}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "6px", fontWeight: "600" }}>
                Cerradas
              </div>
            </div>

            {/* Valoración Media */}
            <div style={{
              background: "rgba(255, 204, 0, 0.08)",
              border: "1px solid rgba(255, 204, 0, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: "1.7rem", fontWeight: "800", color: "var(--warning)", lineHeight: 1 }}>
                {avgFilteredRating} <span style={{ fontSize: "1.1rem" }}>★</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "6px", fontWeight: "600" }}>
                Valoración Media
              </div>
            </div>
          </div>

          {/* Indicador detallado cuando hay filtros aplicados */}
          {isFiltered && (
            <div style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  📊 Total según filtros:
                </span>
                <span style={{
                  background: "var(--accent-red)",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                }}>
                  {totalFiltered} {totalFiltered === 1 ? "tarjeta" : "tarjetas"} ({totalFiltered > 0 ? ((totalFiltered / wentops.length) * 100).toFixed(0) : 0}% del total general)
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Filtros activos:
                </span>
                {filterObservedSector !== "ALL" && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", fontSize: "0.72rem" }}>
                    Sector Obs: <strong>{filterObservedSector}</strong>
                  </span>
                )}
                {filterObserverSector !== "ALL" && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", fontSize: "0.72rem" }}>
                    Sector Pertenencia: <strong>{filterObserverSector}</strong>
                  </span>
                )}
                {filterObserver !== "ALL" && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", fontSize: "0.72rem" }}>
                    Observador: <strong>{filterObserver}</strong>
                  </span>
                )}
                {filterStatus !== "ALL" && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", fontSize: "0.72rem" }}>
                    Estado: <strong>{filterStatus}</strong>
                  </span>
                )}
                {searchQuery.trim() !== "" && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", fontSize: "0.72rem" }}>
                    Texto: <strong>"{searchQuery}"</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count + Export */}
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Mostrando <strong style={{ color: "var(--text-primary)" }}>{totalFiltered}</strong> de {wentops.length} tarjetas
          {isFiltered && <span style={{ color: "var(--accent-red)", marginLeft: "6px" }}>(filtros activos)</span>}
        </div>
        <a
          href="/api/admin/export-excel"
          download
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #1d6f42, #2a9d5c)",
            color: "#fff",
            fontWeight: "700",
            fontSize: "0.85rem",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: "opacity 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          📊 Exportar Todas (Excel)
        </a>
      </div>

      {/* Desktop table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {totalFiltered === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
            <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
              No hay tarjetas que coincidan con los filtros seleccionados
            </div>
            <div style={{ fontSize: "0.85rem", marginBottom: "16px" }}>
              Total contabilizado: <strong>0 tarjetas</strong>. Prueba cambiando o restableciendo los filtros.
            </div>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
              >
                Restablecer todos los filtros
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", width: "45px" }}>ID</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Acciones</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Fecha</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Observador</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cliente / Lugar</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Sector Obs.</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Val.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wt, idx) => (
                  <tr
                    key={wt.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-light)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "8px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: "700", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      #{wt.id}
                    </td>
                    <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <a
                          href={`/wentop/${wt.id}`}
                          className="btn btn-secondary"
                          style={{ padding: "3px 8px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {wt.status === "ABIERTA" ? "Revisar" : "Ver"}
                        </a>
                        <a
                          href={`/edit/${wt.id}`}
                          className="btn btn-secondary"
                          style={{ padding: "3px 6px", fontSize: "0.75rem", lineHeight: 1 }}
                          title="Editar WENTOP"
                        >
                          ✏️
                        </a>
                        <button 
                          disabled={deletingId === wt.id}
                          onClick={async () => {
                            if (confirm(`¿Estás seguro que deseas eliminar la Wentop #${wt.id}? Esta acción no se puede deshacer.`)) {
                              setDeletingId(wt.id);
                              try {
                                const res = await fetch(`/api/admin/delete-wentop?id=${wt.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  throw new Error(data.error || `HTTP ${res.status}`);
                                }
                                router.refresh();
                              } catch (err: any) {
                                console.error("Error al eliminar:", err);
                                alert("Error al eliminar: " + err.message);
                              } finally {
                                setDeletingId(null);
                              }
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: deletingId === wt.id ? "not-allowed" : "pointer",
                            fontSize: "0.95rem",
                            padding: "2px 4px",
                            opacity: deletingId === wt.id ? 0.4 : 0.75,
                            transition: "opacity 0.2s",
                            lineHeight: 1,
                          }}
                          title="Eliminar WENTOP"
                        >
                          {deletingId === wt.id ? "⏳" : "🗑️"}
                        </button>
                      </div>
                    </td>
                    <td suppressHydrationWarning style={{ padding: "8px 8px", whiteSpace: "nowrap", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {new Date(wt.date).toLocaleDateString("es-AR")}
                    </td>
                    <td style={{ padding: "8px 8px", maxWidth: "140px" }}>
                      <div style={{ fontWeight: "500", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={wt.observerName}>
                        {wt.observerName}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {wt.observerSector === "Otros" && wt.observerSectorOther ? wt.observerSectorOther : wt.observerSector}
                      </div>
                    </td>
                    <td style={{ padding: "8px 8px", maxWidth: "130px" }}>
                      <div style={{ fontWeight: "600", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={wt.client === "OTRO" && wt.clientOther ? wt.clientOther : (wt.client || "—")}>
                        {wt.client === "OTRO" && wt.clientOther ? wt.clientOther : (wt.client || "—")}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={wt.place}>
                        📍 {wt.place}
                      </div>
                    </td>
                    <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                      <span 
                        title={wt.observedSector}
                        style={{
                          display: "inline-block",
                          padding: "2px 7px",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          background: `${getColor(wt.observedSector)}20`,
                          color: getColor(wt.observedSector),
                          border: `1px solid ${getColor(wt.observedSector)}40`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getShortSector(wt.observedSector)}
                      </span>
                    </td>
                    <td style={{ padding: "8px 8px", maxWidth: "150px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={wt.type}>
                        {wt.type}
                      </span>
                      {wt.observationType && (
                        <span style={{ fontSize: "0.7rem", color: "var(--info)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {wt.observationType === "Otros" && wt.observationTypeOther ? wt.observationTypeOther : wt.observationType}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <span className={`badge ${wt.status === "ABIERTA" ? "badge-open" : "badge-closed"}`} style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                        {wt.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "center", color: "var(--warning)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {wt.rating ? "★".repeat(wt.rating) : <span style={{ color: "var(--border-color)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
