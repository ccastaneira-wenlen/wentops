import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, closingAction, adminComment } = await request.json();
    if (!id || !closingAction?.trim()) {
      return NextResponse.json({ error: "ID y acción de cierre son requeridos" }, { status: 400 });
    }

    const legacy = await prisma.legacyWentop.findUnique({ where: { id } });
    if (!legacy) {
      return NextResponse.json({ error: "Wentop no encontrada" }, { status: 404 });
    }

    await prisma.legacyWentop.update({
      where: { id },
      data: {
        status: "Cerrada",
        closingAction: closingAction.trim(),
        adminComment: adminComment?.trim() || null,
        adminClosedAt: new Date(),
        closingDate: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error closing legacy wentop:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
