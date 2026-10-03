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

  // Monthly ranking: aggregate stars per user from closed wentops of the current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const startOfNextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

  const monthNameRaw = now.toLocaleString("es-ES", { month: "long" });
  const currentMonthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

  const rankingData = await prisma.wentop.groupBy({
    by: ["userId"],
    where: { 
      status: "CERRADA", 
      rating: { not: null },
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    _sum: { rating: true },
    _count: { id: true },
    orderBy: { _sum: { rating: "desc" } },
    take: 3,
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

        {/* Global Monthly Ranking / Podium */}
        <div className="glass-card" style={{ padding: "20px 16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: rankingUsers.length > 0 ? "14px" : "0" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>🏆 Ranking de {currentMonthName}</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Podio del mes</span>
          </div>

          {rankingUsers.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "10px", marginBottom: 0 }}>
              Aún no hay observaciones calificadas en {monthNameRaw}. ¡Sé el primero en sumar estrellas para el podio!
            </p>
          ) : (
            rankingUsers.map((user, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
              const podiumBg = idx === 0 
                ? "linear-gradient(135deg, #FFE066 0%, #FFB703 100%)" 
                : idx === 1 
                ? "linear-gradient(135deg, #E0E0E0 0%, #B0B0B0 100%)" 
                : "linear-gradient(135deg, #E0A96D 0%, #CD7F32 100%)";

              return (
                <div key={user.id} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: idx < rankingUsers.length - 1 ? "8px" : "0",
                  background: user.isMe ? "rgba(230,0,0,0.08)" : "rgba(255,255,255,0.03)",
                  border: user.isMe ? "1px solid rgba(230,0,0,0.3)" : "1px solid var(--border-light)",
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    background: podiumBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "800", fontSize: "1rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }}>
                    {medal}
                  </div>
                  <div style={{ flex: 1, marginLeft: "12px", overflow: "hidden" }}>
                    <div style={{
                      fontWeight: user.isMe ? "700" : "600",
                      fontSize: "0.9rem",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      color: user.isMe ? "#fff" : "var(--text-primary)"
                    }}>
                      {user.isMe ? `Tú (${user.name})` : user.name}
                      <span style={{ 
                        marginLeft: "8px", 
                        fontSize: "0.72rem", 
                        fontWeight: "600", 
                        color: idx === 0 ? "#FFB703" : idx === 1 ? "#C0C0C0" : "#CD7F32" 
                      }}>
                        {idx + 1}º Puesto
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1px" }}>
                      {user.count} tarjeta{user.count !== 1 ? "s" : ""} cerrada{user.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--warning)", fontWeight: "800", fontSize: "0.95rem" }}>
                    {user.stars} <span style={{ fontSize: "1.1rem" }}>★</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
