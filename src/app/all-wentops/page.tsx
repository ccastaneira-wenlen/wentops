import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import MobileNav from "@/components/MobileNav";

export default async function AllWentops() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const userName = session.user.name || "Usuario";

  // Fetch all wentops
  const allWentops = await prisma.wentop.findMany({
    orderBy: { date: "desc" },
    take: 50, // Limit to 50 most recent for performance on mobile
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Real ranking: aggregate stars per user from closed wentops
  const rankingData = await prisma.wentop.groupBy({
    by: ["userId"],
    where: { status: "CERRADA", rating: { not: null } },
    _sum: { rating: true },
    _count: { id: true },
    orderBy: { _sum: { rating: "desc" } },
    take: 10,
  });

  // Fetch user names for ranking
  const rankingUsers = await Promise.all(
    rankingData.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { name: true, id: true }
      });
      return {
        name: user?.name || "Desconocido",
        id: entry.userId,
        stars: entry._sum.rating || 0,
        count: entry._count.id,
        isMe: entry.userId === userId,
      };
    })
  );

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
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: "800",
            letterSpacing: "-0.03em",
            background: "linear-gradient(90deg, #fff 0%, #aaa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "4px"
          }}>
            Muro Global
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Observaciones recientes creadas por todos los usuarios
          </p>
          </div>
          <img 
            src="/logo.jpg" 
            alt="Wenlen S.A." 
            style={{ height: '36px', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px 16px 100px" }}>
        
        {/* Empty state */}
        {allWentops.length === 0 && (
          <div className="glass-card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🌐</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              No hay observaciones registradas en el sistema aún.
            </p>
          </div>
        )}

        {/* Global Ranking */}
        {rankingUsers.length > 0 && (
          <div className="glass-card" style={{ padding: "20px 16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>🏆 Ranking de Observadores</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Por estrellas obtenidas</span>
            </div>
            {rankingUsers.map((user, idx) => (
              <div key={user.id} style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                marginBottom: idx < rankingUsers.length - 1 ? "6px" : "0",
                background: user.isMe ? "rgba(230,0,0,0.08)" : "transparent",
                border: user.isMe ? "1px solid rgba(230,0,0,0.25)" : "1px solid transparent",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: idx === 0 ? "#ffcc00" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "var(--bg-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "800", fontSize: "0.85rem",
                  color: idx < 3 ? "#000" : "var(--text-secondary)"
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, marginLeft: "10px", overflow: "hidden" }}>
                  <div style={{
                    fontWeight: user.isMe ? "700" : "500",
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {user.isMe ? `Tú (${user.name})` : user.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {user.count} tarjeta{user.count !== 1 ? "s" : ""} cerrada{user.count !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--warning)", fontWeight: "700", fontSize: "0.9rem" }}>
                  {user.stars} <span style={{ fontSize: "1.1rem" }}>★</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wentop cards - mobile optimized */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {allWentops.map(wt => {
            const isMyWentop = wt.userId === userId;
            const canView = wt.status === "CERRADA" || isMyWentop;
            const CardContent = (
              <div className="glass-card" style={{ padding: "16px", cursor: canView ? "pointer" : "default", opacity: canView ? 1 : 0.65 }}>
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
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ color: "var(--text-primary)" }}>👤 {wt.observerName}</span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span>📍 {wt.place}</span>
                    <span suppressHydrationWarning>📅 {new Date(wt.date).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>
                {wt.status === "CERRADA" && (
                  <div style={{
                    marginTop: "10px", paddingTop: "10px",
                    borderTop: "1px solid var(--success)",
                    fontSize: "0.8rem", color: "var(--text-secondary)"
                  }}>
                    <strong style={{ color: "var(--success)" }}>✅ Cerrada:</strong> {wt.closingAction ? (wt.closingAction.slice(0, 60) + (wt.closingAction.length > 60 ? "..." : "")) : "Sin detalle adicional"}
                  </div>
                )}
                {wt.status === "ABIERTA" && !isMyWentop && (
                  <div style={{
                    marginTop: "10px", paddingTop: "10px",
                    borderTop: "1px solid var(--border-light)",
                    fontSize: "0.8rem", color: "var(--text-secondary)"
                  }}>
                    🔒 Visible solo al cerrar
                  </div>
                )}
                {wt.status === "ABIERTA" && isMyWentop && (
                  <div style={{
                    marginTop: "10px", paddingTop: "10px",
                    borderTop: "1px solid var(--border-light)",
                    fontSize: "0.8rem", color: "var(--accent-red)"
                  }}>
                    Pendiente de revisión →
                  </div>
                )}
              </div>
            );
            return canView ? (
              <a key={wt.id} href={`/wentop/${wt.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                {CardContent}
              </a>
            ) : (
              <div key={wt.id}>{CardContent}</div>
            );
          })}
        </div>
      </div>

      {/* Bottom nav bar - mobile */}
      <MobileNav activePath="/all-wentops" />
    </div>
  );
}
