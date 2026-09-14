import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { dni, securityAnswer, newPassword } = await request.json();

    if (!dni || !securityAnswer || !newPassword) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email: dni } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.securityAnswer) {
      return NextResponse.json({ error: "Este usuario no tiene configurada una respuesta de seguridad" }, { status: 400 });
    }

    if (user.securityAnswer.toLowerCase().trim() !== securityAnswer.toLowerCase().trim()) {
      return NextResponse.json({ error: "La respuesta de seguridad es incorrecta" }, { status: 403 });
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: dni },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
