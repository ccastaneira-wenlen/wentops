"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantAdminRole } from "../actions/admin";

const SECTOR_COLORS: Record<string, string> = {
  "Fractura": "#e60000",
  "Well Testing": "#ff6600",
  "Wireline": "#ffcc00",
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

export default function AdminClient({ wentops }: { wentops: any[] }) {
  const router = useRouter();
  const [isGranting, setIsGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ABIERTA" | "CERRADA">("ALL");
  const [filterSector, setFilterSector] = useState("ALL");

  const sectors = ["ALL", ...Array.from(new Set(wentops.map(w => w.observedSector)))].sort();
  const filtered = wentops.filter(w => {
    const matchStatus = filterStatus === "ALL" || w.status === filterStatus;
    const matchSector = filterSector === "ALL" || w.observedSector === filterSector;
    return matchStatus && matchSector;
  });

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
      {/* Top action bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {/* Grant admin panel */}
        <div className="glass-card" style={{ flex: "1", minWidth: "300px", padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🔑 Otorgar Acceso Administrador
          </h3>
          <form onSubmit={handleGrantAdmin} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: "0.8rem" }}>DNI del usuario</label>
              <input type="text" name="dni" className="form-input" placeholder="Ej: 33532816" required style={{ padding: "8px 12px" }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isGranting} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
              {isGranting ? "..." : "Dar Permiso"}
            </button>
          </form>
          {grantMsg && (
            <p style={{ marginTop: "8px", fontSize: "0.85rem", color: grantMsg.startsWith("✅") ? "var(--success)" : "var(--accent-red)" }}>
              {grantMsg}
            </p>
          )}
        </div>

        {/* Quick filters */}
        <div className="glass-card" style={{ flex: "1", minWidth: "300px", padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🔍 Filtros
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <label className="form-label" style={{ fontSize: "0.8rem" }}>Estado</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                style={{ padding: "8px 12px" }}
              >
                <option value="ALL">Todos</option>
                <option value="ABIERTA">Abiertos</option>
                <option value="CERRADA">Cerrados</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label className="form-label" style={{ fontSize: "0.8rem" }}>Sector</label>
              <select
                className="form-select"
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                style={{ padding: "8px 12px" }}
              >
                {sectors.map(s => <option key={s} value={s}>{s === "ALL" ? "Todos" : s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results count + Export */}
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Mostrando <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> de {wentops.length} tarjetas
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
          📊 Exportar a Excel
        </a>
      </div>

      {/* Desktop table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
            No hay tarjetas que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>ID</th>
                  <th style={{ padding: "14px 10px", textAlign: "center", width: "40px" }}></th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Fecha</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Observador</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cliente / Lugar</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sector Obs.</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Val.</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acción</th>
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
                    <td style={{ padding: "14px 20px", fontFamily: "monospace", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      #{wt.id}
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "center" }}>
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
                          fontSize: "1.1rem",
                          padding: "4px",
                          opacity: deletingId === wt.id ? 0.4 : 1,
                          transition: "opacity 0.2s",
                        }}
                        title="Eliminar"
                      >
                        {deletingId === wt.id ? "⏳" : "🗑️"}
                      </button>
                    </td>
                    <td suppressHydrationWarning style={{ padding: "14px 16px", whiteSpace: "nowrap", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {new Date(wt.date).toLocaleDateString("es-AR")}
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                      <div style={{ fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {wt.observerName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {wt.observerSector === "Otros" && wt.observerSectorOther ? wt.observerSectorOther : wt.observerSector}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "160px" }}>
                      <div style={{ fontWeight: "600", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {wt.client === "OTRO" && wt.clientOther ? wt.clientOther : (wt.client || "—")}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        📍 {wt.place}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        background: `${getColor(wt.observedSector)}20`,
                        color: getColor(wt.observedSector),
                        border: `1px solid ${getColor(wt.observedSector)}40`,
                        whiteSpace: "nowrap",
                      }}>
                        {wt.observedSector}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", maxWidth: "200px" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {wt.type}
                      </span>
                      {wt.observationType && (
                        <span style={{ fontSize: "0.72rem", color: "var(--info)", display: "block" }}>
                          {wt.observationType === "Otros" && wt.observationTypeOther ? wt.observationTypeOther : wt.observationType}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span className={`badge ${wt.status === "ABIERTA" ? "badge-open" : "badge-closed"}`}>
                        {wt.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "var(--warning)", fontSize: "0.9rem" }}>
                      {wt.rating ? "★".repeat(wt.rating) : <span style={{ color: "var(--border-color)" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      <a
                        href={`/wentop/${wt.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "6px 14px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                      >
                        {wt.status === "ABIERTA" ? "Revisar →" : "Ver Detalle"}
                      </a>
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
