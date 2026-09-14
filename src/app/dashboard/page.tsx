import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminClient from "./AdminClient";
import AdminUsers from "./AdminUsers";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const [wentops, legacyPending] = await Promise.all([
    prisma.wentop.findMany({
      orderBy: { date: "desc" },
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.legacyWentop.count({ where: { status: "Abierta" } }),
  ]);

  const abiertas = wentops.filter(w => w.status === "ABIERTA").length;
  const cerradas = wentops.filter(w => w.status === "CERRADA").length;
  const totalRating = wentops.filter(w => w.rating).reduce((s, w) => s + (w.rating || 0), 0);
  const ratedCount = wentops.filter(w => w.rating).length;
  const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : "—";

  return (
    <div className="container" style={{ paddingTop: "32px", paddingBottom: "48px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "4px" }}>
          Panel de Administración
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Bienvenido, <strong style={{ color: "var(--text-primary)" }}>{session.user.name}</strong>. Gestión de Tarjetas WENTOP.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div className="glass-card" style={{ padding: "20px", borderLeft: "3px solid var(--accent-red)" }}>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-red)" }}>{wentops.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Total Tarjetas</div>
        </div>
        <div className="glass-card" style={{ padding: "20px", borderLeft: "3px solid #ff4d4d" }}>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ff4d4d" }}>{abiertas}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Abiertas</div>
        </div>
        <div className="glass-card" style={{ padding: "20px", borderLeft: "3px solid var(--success)" }}>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--success)" }}>{cerradas}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Cerradas</div>
        </div>
        <div className="glass-card" style={{ padding: "20px", borderLeft: "3px solid var(--warning)" }}>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--warning)" }}>{avgRating}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Valoración Media ★</div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.4rem", marginTop: "40px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
        Tarjetas WENTOP
      </h2>
      <AdminClient wentops={wentops} />

      <h2 style={{ fontSize: "1.4rem", marginTop: "48px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
        Gestión de Usuarios
      </h2>
      <AdminUsers />

      {/* Legacy Wentops Section */}
      <div style={{ marginTop: "48px", borderTop: "1px solid var(--border-light)", paddingTop: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.4rem", margin: 0 }}>📂 Wentops Históricas</h2>
          {legacyPending > 0 && (
            <span style={{ background: "rgba(255,204,0,0.15)", color: "var(--warning)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
              {legacyPending} pendientes de cierre
            </span>
          )}
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Wentops importadas del formulario anterior (Google Forms). Las que están abiertas pueden ser cerradas desde el panel de históricas.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/dashboard/legacy" className="btn btn-primary" style={{ padding: "10px 24px" }}>
            🔧 Gestionar Pendientes ({legacyPending})
          </Link>
          <Link href="/legacy" className="btn" style={{ padding: "10px 24px", background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            👁 Ver Muro Histórico
          </Link>
        </div>
      </div>
    </div>
  );
}
