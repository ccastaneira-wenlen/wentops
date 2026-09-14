import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { dni, oldPassword, newPassword, securityAnswer } = await request.json();

    if (!dni || !oldPassword || !newPassword) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    
    // Si la DB pide que deba cambiar contraseña (primer inicio o reset), también obligamos a pasar la respuesta de seguridad.
    // Lo validaremos después de buscar al usuario.

    // Find the user
    const user = await prisma.user.findUnique({ where: { email: dni } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.mustChangePassword && !securityAnswer?.trim()) {
      return NextResponse.json({ error: "Debes ingresar una respuesta de seguridad" }, { status: 400 });
    }

    // Verify old password
    let isOldPasswordValid = false;
    if (user.password === "wentop" && oldPassword === "wentop") {
      isOldPasswordValid = true;
    } else {
      try {
        isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      } catch {
        isOldPasswordValid = false;
      }
    }

    if (!isOldPasswordValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 403 });
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updateData: any = {
      password: hashedPassword,
      mustChangePassword: false
    };

    if (user.mustChangePassword && securityAnswer) {
      updateData.securityAnswer = securityAnswer.trim();
    }

    await prisma.user.update({
      where: { email: dni },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
