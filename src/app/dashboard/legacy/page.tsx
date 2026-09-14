import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLegacyClient from "../AdminLegacyClient";

export default async function LegacyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const pendingWentops = await prisma.legacyWentop.findMany({
    where: { status: "Abierta" },
    orderBy: { date: "asc" },
  });

  const serialized = pendingWentops.map(w => ({
    ...w,
    date: w.date?.toISOString() ?? null,
    closingDate: w.closingDate?.toISOString() ?? null,
    adminClosedAt: w.adminClosedAt?.toISOString() ?? null,
    createdAt: w.createdAt.toISOString(),
  }));

  return (
    <div className="container" style={{ paddingTop: "32px", paddingBottom: "48px" }}>
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Panel Admin
        </Link>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0 }}>
          Históricas Pendientes
        </h1>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ background: "rgba(255,204,0,0.15)", color: "var(--warning)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "600" }}>
            {pendingWentops.length} abiertas
          </span>
        </div>
      </div>

      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
        Wentops importadas del formulario Google Forms que aún no tienen acción de cierre. Cerrá cada una para archivarlas en el historial.
      </p>

      <AdminLegacyClient pendingWentops={serialized} />
    </div>
  );
}
