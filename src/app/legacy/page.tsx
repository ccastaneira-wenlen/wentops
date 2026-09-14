import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import MobileNav from "@/components/MobileNav";

export const metadata = {
  title: "Muro Histórico WENTOP",
  description: "Historial de tarjetas WENTOP del formulario Google Forms",
};

const TYPE_COLORS: Record<string, string> = {
  "Condición insegura": "#ff4d4d",
  "Acto inseguro": "#ff6b00",
  "Cuasi Accidente": "#cc0000",
  "Detención de tareas": "#9900ff",
  "Observación positiva": "#00cc66",
};

export default async function LegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; status?: string; tipo?: string; q?: string; sort?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { sector, status, tipo, q, sort } = params;

  const where: any = {};
  if (sector) where.observedSector = sector;
  if (status) where.status = status;
  if (tipo) where.type = tipo;
  if (q) {
    where.OR = [
      { observerName: { contains: q } },
      { description: { contains: q } },
      { place: { contains: q } },
    ];
  }

  const orderBy: any =
    sort === "date_asc"  ? { date: "asc" } :
    sort === "name_asc"  ? { observerName: "asc" } :
    sort === "name_desc" ? { observerName: "desc" } :
    sort === "sector"    ? { observedSector: "asc" } :
                          { date: "desc" }; // default

  const [wentops, totalOpen, totalClosed] = await Promise.all([
    prisma.legacyWentop.findMany({
      where,
      orderBy,
      take: 100,
    }),
    prisma.legacyWentop.count({ where: { status: "Abierta" } }),
    prisma.legacyWentop.count({ where: { status: "Cerrada" } }),
  ]);

  const sectors = await prisma.legacyWentop.findMany({
    select: { observedSector: true },
    distinct: ["observedSector"],
    where: { observedSector: { not: null } },
    orderBy: { observedSector: "asc" },
  });

  const types = await prisma.legacyWentop.findMany({
    select: { type: true },
    distinct: ["type"],
    where: { type: { not: null } },
    orderBy: { type: "asc" },
  });

  return (
    <div className="container" style={{ paddingTop: "32px", paddingBottom: "48px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>
          📂 Muro Histórico WENTOP
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Tarjetas registradas en el formulario anterior · Mostrando hasta 100 resultados
        </p>
        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
          <div className="glass-card" style={{ padding: "14px 20px", borderLeft: "3px solid var(--warning)", flex: "0 0 auto" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--warning)" }}>{totalOpen}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Abiertas</div>
          </div>
          <div className="glass-card" style={{ padding: "14px 20px", borderLeft: "3px solid var(--success)", flex: "0 0 auto" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--success)" }}>{totalClosed}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Cerradas</div>
          </div>
          <div className="glass-card" style={{ padding: "14px 20px", borderLeft: "3px solid var(--accent-red)", flex: "0 0 auto" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-red)" }}>{totalOpen + totalClosed}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Total</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", alignItems: "flex-end" }}>
        <div className="form-group" style={{ flex: "1", minWidth: "200px", margin: 0 }}>
          <label className="form-label">Buscar</label>
          <input type="text" name="q" className="form-input" placeholder="Nombre, lugar, descripción..." defaultValue={q || ""} />
        </div>
        <div className="form-group" style={{ minWidth: "160px", margin: 0 }}>
          <label className="form-label">Estado</label>
          <select name="status" className="form-select" defaultValue={status || ""}>
            <option value="">Todos</option>
            <option value="Abierta">Abierta</option>
            <option value="Cerrada">Cerrada</option>
          </select>
        </div>
        <div className="form-group" style={{ minWidth: "180px", margin: 0 }}>
          <label className="form-label">Sector</label>
          <select name="sector" className="form-select" defaultValue={sector || ""}>
            <option value="">Todos</option>
            {sectors.map(s => (
              <option key={s.observedSector} value={s.observedSector!}>{s.observedSector}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: "180px", margin: 0 }}>
          <label className="form-label">Tipo de tarjeta</label>
          <select name="tipo" className="form-select" defaultValue={tipo || ""}>
            <option value="">Todos</option>
            {types.map(t => (
              <option key={t.type} value={t.type!}>{t.type}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: "170px", margin: 0 }}>
          <label className="form-label">Ordenar por</label>
          <select name="sort" className="form-select" defaultValue={sort || "date_desc"}>
            <option value="date_desc">Fecha ↓ (más reciente)</option>
            <option value="date_asc">Fecha ↑ (más antigua)</option>
            <option value="name_asc">Nombre A→Z</option>
            <option value="name_desc">Nombre Z→A</option>
            <option value="sector">Sector A→Z</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px" }}>
          Filtrar
        </button>
        <a href="/legacy" className="btn" style={{ padding: "10px 20px", background: "var(--surface-2)", color: "var(--text-secondary)" }}>
          Limpiar
        </a>
      </form>

      {/* Results */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
        {wentops.length} resultado{wentops.length !== 1 ? "s" : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {wentops.length === 0 && (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            Sin resultados para los filtros seleccionados.
          </div>
        )}
        {wentops.map(w => {
          const typeColor = TYPE_COLORS[w.type || ""] || "var(--text-secondary)";
          return (
            <details key={w.id} className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
              <summary style={{
                padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center",
                gap: "10px", flexWrap: "wrap", listStyle: "none",
                borderLeft: `3px solid ${w.status === "Cerrada" ? "var(--success)" : "var(--warning)"}`,
              }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", minWidth: "35px" }}>#{w.id}</span>
                <span suppressHydrationWarning style={{ fontSize: "0.75rem", color: "var(--text-secondary)", minWidth: "85px" }}>
                  {w.date ? new Date(w.date).toLocaleDateString("es-AR") : "—"}
                </span>
                <span style={{ fontWeight: "600", flex: 1, minWidth: "140px" }}>{w.observerName}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{w.observedSector || "—"}</span>
                <span style={{ fontSize: "0.72rem", color: typeColor, background: `${typeColor}22`, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                  {w.type || "—"}
                </span>
                <span style={{
                  fontSize: "0.72rem", padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap",
                  background: w.status === "Cerrada" ? "rgba(0,204,102,0.15)" : "rgba(255,204,0,0.15)",
                  color: w.status === "Cerrada" ? "var(--success)" : "var(--warning)",
                }}>
                  {w.status}
                </span>
              </summary>

              <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border-light)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
                  {[
                    ["📍 Lugar", w.place],
                    ["🏢 Cliente", w.client],
                    ["🔬 Tipo de observación", w.observationType],
                    ["📅 Fecha cierre", w.closingDate ? new Date(w.closingDate).toLocaleDateString("es-AR") : null],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontSize: "0.85rem", marginTop: "2px" }} suppressHydrationWarning>{val}</div>
                    </div>
                  ))}
                </div>
                {w.description && (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>{w.description}</p>
                  </div>
                )}
                {w.immediateActions && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acciones Inmediatas</div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>{w.immediateActions}</p>
                  </div>
                )}
                {w.recommendations && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recomendaciones</div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>{w.recommendations}</p>
                  </div>
                )}
                {w.closingAction && (
                  <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(0,204,102,0.08)", borderLeft: "2px solid var(--success)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acción de cierre</div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>{w.closingAction}</p>
                  </div>
                )}
                {w.adminComment && (
                  <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comentario admin</div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", lineHeight: 1.6 }}>{w.adminComment}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <MobileNav activePath="/legacy" />
    </div>
  );
}
