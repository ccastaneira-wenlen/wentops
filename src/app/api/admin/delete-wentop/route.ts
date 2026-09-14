import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function DELETE(request: Request) {
  const token = await getToken({ 
    req: request as any, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get("id");
  const id = idStr ? parseInt(idStr, 10) : NaN;

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // Delete physical evidence files first
  const wentop = await prisma.wentop.findUnique({
    where: { id },
    include: { evidences: true },
  });

  if (!wentop) {
    return NextResponse.json({ error: "Wentop no encontrada" }, { status: 404 });
  }

  for (const ev of wentop.evidences) {
    try {
      const filePath = path.join(process.cwd(), "public", ev.url);
      await fs.unlink(filePath);
    } catch {
      // ignore if file doesn't exist
    }
  }

  await prisma.wentop.delete({ where: { id } });

  // After deletion, check if table is now empty and reset autoincrement sequence
  const remaining = await prisma.wentop.count();
  if (remaining === 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE sqlite_sequence SET seq = 0 WHERE name = 'Wentop'`
    );
  }

  return NextResponse.json({ success: true });
}
