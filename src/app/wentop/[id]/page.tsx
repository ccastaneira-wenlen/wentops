import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminCloseForm from "./AdminCloseForm";

export default async function WentopDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const wentop = await prisma.wentop.findUnique({
    where: { id: parseInt(unwrappedParams.id, 10) },
    include: { 
      user: { select: { name: true, email: true } },
      evidences: true 
    }
  });

  if (!wentop) redirect("/my-wentops");

  const isAdmin = (session.user as any).role === "ADMIN";
  const isOwner = wentop.userId === (session.user as any).id;

  // Employees can view any CLOSED wentop (read-only); only owner or admin can see OPEN ones
  const isClosedAndPublic = wentop.status === "CERRADA";
  if (!isAdmin && !isOwner && !isClosedAndPublic) redirect("/my-wentops");

  const backUrl = isAdmin ? "/dashboard" : isOwner ? "/my-wentops" : "/all-wentops";

  const effectiveObserverSector = wentop.observerSector === "Otros" && wentop.observerSectorOther
    ? `Otros (${wentop.observerSectorOther})`
    : wentop.observerSector;

  const effectiveClient = wentop.client === "OTRO" && wentop.clientOther
    ? `OTRO (${wentop.clientOther})`
    : (wentop.client || "No especificado");

  const effectiveObservationType = wentop.observationType === "Otros" && wentop.observationTypeOther
    ? `Otros (${wentop.observationTypeOther})`
    : (wentop.observationType || "No especificado");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* Sticky mobile header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(18,18,18,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-light)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href={backUrl} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1.2rem", lineHeight: 1 }}>←</a>
          <div>
            <div style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "0.9rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
              #{wentop.id}
            </div>
            <div suppressHydrationWarning style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {new Date(wentop.date).toLocaleDateString("es-AR")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {(isOwner || isAdmin) && (
            <a href={`/edit/${wentop.id}`} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.7rem", color: "var(--text-primary)" }}>
              ✏️ Editar
            </a>
          )}
          <span className={`badge ${wentop.status === "ABIERTA" ? "badge-open" : "badge-closed"}`} style={{ fontSize: "0.8rem" }}>
            {wentop.status}
          </span>
          <img 
            src="/logo.jpg" 
            alt="Wenlen S.A." 
            style={{ height: '20px', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ padding: "16px 16px 40px", maxWidth: "600px", margin: "0 auto" }}>

        {/* Observer info */}
        <div style={{
          background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
          padding: "14px 16px", marginBottom: "12px",
          display: "flex", gap: "12px", alignItems: "center"
        }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "var(--accent-red)", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "1rem", color: "#fff", flexShrink: 0
          }}>
            {(wentop.observerName || "?")[0]}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: "600", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {wentop.observerName}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Sector: <strong style={{ color: "var(--text-primary)" }}>{effectiveObserverSector}</strong> → Observado: <strong style={{ color: "var(--text-primary)" }}>{wentop.observedSector}</strong>
            </div>
          </div>
        </div>

        {/* Client & Place */}
        <div className="glass-card" style={{ padding: "14px 16px", marginBottom: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              🏢 Cliente
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
              {effectiveClient}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              📍 Lugar / Locación
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
              {wentop.place}
            </div>
          </div>
        </div>

        {/* Card Type & Observation Type */}
        <div className="glass-card" style={{ padding: "14px 16px", marginBottom: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              📇 Tipo de Tarjeta
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.92rem", color: "var(--accent-red)" }}>
              {wentop.type}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              🎯 Tipo de Observación
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.92rem", color: "var(--info)" }}>
              {effectiveObservationType}
            </div>
          </div>
        </div>

        {/* Description fields */}
        {[
          { icon: "📋", label: "Descripción de la Observación", value: wentop.description },
          { icon: "⚡", label: "Acciones Inmediatas", value: wentop.immediateActions },
          { icon: "💡", label: "Recomendaciones para eliminar el riesgo", value: wentop.recommendations },
          { icon: "⚖️", label: "Justificación del Estado", value: wentop.statusJustification || "No especificada" },
        ].map(({ icon, label, value }) => (
          <div key={label} className="glass-card" style={{ padding: "16px", marginBottom: "12px" }}>
            <div style={{
              fontSize: "0.75rem", color: "var(--accent-red)",
              fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: "8px"
            }}>
              {icon} {label}
            </div>
            <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>{value}</p>
          </div>
        ))}

        {/* Evidence section */}
        {wentop.evidences && wentop.evidences.length > 0 && (
          <div className="glass-card" style={{ padding: "16px", marginBottom: "12px" }}>
            <div style={{
              fontSize: "0.75rem", color: "var(--info)",
              fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: "12px"
            }}>
              📎 Evidencias Adjuntas ({wentop.evidences.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {wentop.evidences.map((ev: any) => {
                const urlLower = ev.url.toLowerCase();
                const isVideo = urlLower.endsWith(".mp4") || urlLower.endsWith(".mov") || urlLower.endsWith(".webm") || urlLower.endsWith(".mkv");
                const isPdf = urlLower.endsWith(".pdf");
                const isDoc = urlLower.endsWith(".doc") || urlLower.endsWith(".docx") || urlLower.endsWith(".xls") || urlLower.endsWith(".xlsx") || urlLower.endsWith(".ppt") || urlLower.endsWith(".pptx") || urlLower.endsWith(".txt");
                const fileName = ev.url.split("/").pop() || "Archivo";

                if (isVideo) {
                  return (
                    <div key={ev.id} style={{ gridColumn: "1 / -1", background: "var(--bg-secondary)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
                      <video 
                        src={ev.url} 
                        controls 
                        style={{ width: "100%", maxHeight: "280px", borderRadius: "var(--radius-sm)", background: "#000" }} 
                      />
                      <a href={ev.url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: "6px", fontSize: "0.75rem", color: "var(--text-secondary)", textDecoration: "none" }}>
                        🎥 Abrir video en pestaña nueva
                      </a>
                    </div>
                  );
                }

                if (isPdf || isDoc) {
                  return (
                    <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ background: "var(--bg-secondary)", padding: "20px 10px", textAlign: "center", borderRadius: "var(--radius-sm)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", border: "1px solid var(--border-color)" }}>
                        <span style={{ fontSize: "2rem" }}>{isPdf ? "📄" : "📝"}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginTop: "8px", fontWeight: "600", wordBreak: "break-all" }}>{fileName}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "4px" }}>Descargar / Ver</span>
                      </div>
                    </a>
                  );
                }

                // Default is image
                return (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                    <img 
                      src={ev.url} 
                      alt="Evidencia" 
                      style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }} 
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Closing section */}
        {wentop.status === "CERRADA" && (
          <div className="glass-card" style={{
            padding: "16px", marginBottom: "12px",
            borderLeft: "3px solid var(--success)",
            background: "rgba(0, 204, 102, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--success)" }}>
                ✅ Tarjeta Cerrada
              </div>
              {wentop.rating && (
                <div style={{ color: "var(--warning)", fontSize: "1.1rem", letterSpacing: "2px" }}>
                  {"★".repeat(wentop.rating)}{"☆".repeat(5 - wentop.rating)}
                </div>
              )}
            </div>
            {wentop.closingAction && (
              <>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Acción de Cierre
                </div>
                <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: "1.65" }}>{wentop.closingAction}</p>
              </>
            )}
            <div suppressHydrationWarning style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Cerrada el: {wentop.closingDate ? new Date(wentop.closingDate).toLocaleDateString("es-AR") : "—"}
            </div>
          </div>
        )}

        {/* Admin close/rate form */}
        {isAdmin && !wentop.rating && (
          <AdminCloseForm wentopId={wentop.id.toString()} currentStatus={wentop.status} />
        )}
      </div>
    </div>
  );
}
