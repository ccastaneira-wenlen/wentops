import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import MobileNav from "@/components/MobileNav";

export default async function MyWentops() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const userName = session.user.name || "Usuario";

  // Fetch my wentops
  const myWentops = await prisma.wentop.findMany({
    where: { userId },
    orderBy: { date: "desc" }
  });

  const myTotalStars = myWentops.reduce((sum, w) => sum + (w.rating || 0), 0);
  const myClosedCount = myWentops.filter(w => w.status === "CERRADA").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Mobile-first Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(230,0,0,0.15) 0%, rgba(18,18,18,0) 60%)",
        borderBottom: "1px solid var(--border-light)",
        padding: "24px 16px 20px",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "4px" }}>Bienvenido/a</p>
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: "800",
            letterSpacing: "-0.03em",
            background: "linear-gradient(90deg, #fff 0%, #aaa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "4px"
          }}>
            {userName}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {myWentops.length} tarjeta{myWentops.length !== 1 ? "s" : ""} creada{myWentops.length !== 1 ? "s" : ""} &bull; {myClosedCount} cerrada{myClosedCount !== 1 ? "s" : ""}
          </p>
          </div>
          <img 
            src="/logo.jpg" 
            alt="Wenlen S.A." 
            style={{ height: '36px', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 16px 100px" }}>

        {/* Quick Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", margin: "16px 0" }}>
          <div className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-red)" }}>{myWentops.length}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
          </div>
          <div className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--warning)" }}>{myTotalStars}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estrellas</div>
          </div>
          <div className="glass-card" style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--success)" }}>{myClosedCount}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cerradas</div>
          </div>
        </div>

        {/* Card list header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Mis Observaciones</h3>
          <a href="/create" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            + Nueva
          </a>
        </div>

        {/* Empty state */}
        {myWentops.length === 0 && (
          <div className="glass-card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📋</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Aún no has creado ninguna observación.
            </p>
            <a href="/create" className="btn btn-primary">Crear mi primera Wentop</a>
          </div>
        )}

        {/* Wentop cards - mobile optimized */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {myWentops.map(wt => (
            <a
              key={wt.id}
              href={`/wentop/${wt.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="glass-card" style={{ padding: "16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      fontFamily: "monospace", fontWeight: "700", fontSize: "0.85rem",
                      color: "var(--text-secondary)", letterSpacing: "0.05em"
                    }}>
                      #{wt.id}
                    </span>
                    <span className={`badge ${wt.status === "ABIERTA" ? "badge-open" : "badge-closed"}`}>
                      {wt.status}
                    </span>
                  </div>
                  {wt.status === "CERRADA" && wt.rating && (
                    <span style={{ color: "var(--warning)", fontSize: "0.9rem" }}>
                      {"★".repeat(wt.rating)}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "4px" }}>
                  {wt.type}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", gap: "10px" }}>
                  <span>📍 {wt.place}</span>
                  <span suppressHydrationWarning>📅 {new Date(wt.date).toLocaleDateString("es-AR")}</span>
                </div>
                {wt.status === "ABIERTA" && (
                  <div style={{
                    marginTop: "10px", paddingTop: "10px",
                    borderTop: "1px solid var(--border-light)",
                    fontSize: "0.8rem", color: "var(--accent-red)"
                  }}>
                    Pendiente de revisión →
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom nav bar - mobile */}
      <MobileNav activePath="/my-wentops" />
    </div>
  );
}
