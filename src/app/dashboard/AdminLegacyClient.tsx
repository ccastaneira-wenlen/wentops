"use client";

import { useState, useMemo } from "react";

type LegacyWentop = {
  id: number;
  date: string | null;
  observerName: string;
  place: string | null;
  client: string | null;
  observedSector: string | null;
  type: string | null;
  observationType: string | null;
  description: string | null;
  immediateActions: string | null;
  recommendations: string | null;
  status: string;
  statusJustification: string | null;
  closingAction: string | null;
  closingDate: string | null;
  adminComment: string | null;
};

export default function AdminLegacyClient({ pendingWentops }: { pendingWentops: LegacyWentop[] }) {
  const [wentops, setWentops] = useState(pendingWentops);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [closingAction, setClosingAction] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return wentops.filter(w =>
      w.observerName.toLowerCase().includes(q) ||
      (w.place || "").toLowerCase().includes(q) ||
      (w.description || "").toLowerCase().includes(q) ||
      (w.observedSector || "").toLowerCase().includes(q)
    );
  }, [wentops, search]);

  const handleClose = async (id: number) => {
    if (!closingAction.trim()) {
      setMsg("❌ La acción de cierre es obligatoria");
      return;
    }
    setIsSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/close-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, closingAction, adminComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setWentops(prev => prev.filter(w => w.id !== id));
        setExpanded(null);
        setClosingId(null);
        setClosingAction("");
        setAdminComment("");
        setMsg("✅ Wentop cerrada correctamente");
      } else {
        setMsg("❌ " + data.error);
      }
    } catch {
      setMsg("❌ Error de red");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-AR");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "250px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar por nombre, lugar, sector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {filtered.length} pendientes de cierre
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.3)", color: msg.startsWith("✅") ? "var(--success)" : "var(--accent-red)", fontSize: "0.85rem" }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            {wentops.length === 0 ? "🎉 ¡No hay wentops históricas pendientes!" : "Sin resultados para esa búsqueda."}
          </div>
        )}

        {filtered.map(w => (
          <div key={w.id} className="glass-card" style={{ padding: "0", overflow: "hidden", borderLeft: "3px solid var(--warning)" }}>
            {/* Header row */}
            <div
              onClick={() => setExpanded(expanded === w.id ? null : w.id)}
              style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
            >
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)", minWidth: "40px" }}>#{w.id}</span>
              <span suppressHydrationWarning style={{ fontSize: "0.75rem", color: "var(--text-secondary)", minWidth: "90px" }}>{formatDate(w.date)}</span>
              <span style={{ fontWeight: "600", flex: 1 }}>{w.observerName}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{w.observedSector || "—"}</span>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,204,0,0.15)", color: "var(--warning)" }}>
                {w.type || "—"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{expanded === w.id ? "▲" : "▼"}</span>
            </div>

            {/* Expanded detail */}
            {expanded === w.id && (
              <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border-light)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px", marginBottom: "16px" }}>
                  {[
                    ["📍 Lugar", w.place],
                    ["🏢 Cliente", w.client],
                    ["🔬 Tipo de observación", w.observationType],
                  ].map(([label, val]) => val ? (
                    <div key={label as string}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontSize: "0.88rem", marginTop: "2px" }}>{val}</div>
                    </div>
                  ) : null)}
                </div>

                {w.description && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</div>
                    <p style={{ fontSize: "0.88rem", margin: "4px 0 0", lineHeight: 1.6 }}>{w.description}</p>
                  </div>
                )}
                {w.immediateActions && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acciones Inmediatas</div>
                    <p style={{ fontSize: "0.88rem", margin: "4px 0 0", lineHeight: 1.6 }}>{w.immediateActions}</p>
                  </div>
                )}
                {w.recommendations && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recomendaciones</div>
                    <p style={{ fontSize: "0.88rem", margin: "4px 0 0", lineHeight: 1.6 }}>{w.recommendations}</p>
                  </div>
                )}
                {w.statusJustification && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Justificación del estado</div>
                    <p style={{ fontSize: "0.88rem", margin: "4px 0 0", lineHeight: 1.6 }}>{w.statusJustification}</p>
                  </div>
                )}

                {/* Closing form */}
                <div style={{ marginTop: "20px", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--success)" }}>
                  <div style={{ fontWeight: "600", marginBottom: "12px", fontSize: "0.9rem" }}>✅ Cerrar esta Wentop</div>
                  <div className="form-group">
                    <label className="form-label">Acción de cierre *</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Describí la acción tomada para cerrar esta observación..."
                      value={closingId === w.id ? closingAction : ""}
                      onFocus={() => { setClosingId(w.id); setClosingAction(""); setAdminComment(""); }}
                      onChange={e => setClosingAction(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comentario admin (opcional)</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Notas adicionales del administrador..."
                      value={closingId === w.id ? adminComment : ""}
                      onChange={e => setAdminComment(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleClose(w.id)}
                    disabled={isSubmitting || closingId !== w.id}
                    style={{ marginTop: "8px" }}
                  >
                    {isSubmitting && closingId === w.id ? "⏳ Cerrando..." : "Marcar como Cerrada"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
