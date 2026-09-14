"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("No autorizado. Se requieren permisos de administrador.");
  }
  return session;
}

export async function grantAdminRole(formData: FormData) {
  await checkAdmin();
  const dni = formData.get("dni") as string;

  if (!dni?.trim()) throw new Error("DNI requerido");

  const user = await prisma.user.findUnique({ where: { email: dni.trim() } });
  if (!user) throw new Error(`No se encontró ningún usuario con DNI: ${dni}`);

  await prisma.user.update({
    where: { email: dni.trim() },
    data: { role: "ADMIN" }
  });

  revalidatePath("/dashboard");
  return { success: true, message: `Permisos de administrador otorgados a ${user.name}` };
}

export async function closeWentop(formData: FormData) {
  await checkAdmin();
  const idStr = formData.get("id") as string;
  const id = parseInt(idStr, 10);
  const closingAction = formData.get("closingAction") as string;
  const ratingStr = formData.get("rating") as string;
  const rating = parseInt(ratingStr);

  if (!id || !closingAction?.trim()) {
    throw new Error("El ID y la acción de cierre son obligatorios.");
  }
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error("La valoración debe ser entre 1 y 5 estrellas.");
  }

  // Fetch current wentop to check if it was already closed by the employee
  const current = await prisma.wentop.findUnique({ where: { id } });
  if (!current) throw new Error("Wentop no encontrada.");

  // Always close and rate — preserve employee's closing date if already set
  await prisma.wentop.update({
    where: { id },
    data: {
      status: "CERRADA",
      closingAction: closingAction.trim(),
      rating,
      // Only set closingDate if not already set by employee
      closingDate: current.closingDate ?? new Date(),
    }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/wentop/${id}`);
  revalidatePath("/all-wentops");
  revalidatePath("/my-wentops");
  return { success: true };
}

export async function deleteWentop(id: number) {
  await checkAdmin();

  // Delete physical evidence files first
  const wentop = await prisma.wentop.findUnique({
    where: { id },
    include: { evidences: true },
  });

  if (wentop) {
    const fs = await import("fs/promises");
    const path = await import("path");
    for (const ev of wentop.evidences) {
      try {
        const filePath = path.join(process.cwd(), "public", ev.url);
        await fs.unlink(filePath);
      } catch {
        // ignore if file doesn't exist
      }
    }
  }

  await prisma.wentop.delete({ where: { id } });

  // After deletion, check if table is now empty and reset the autoincrement sequence
  const remaining = await prisma.wentop.count();
  if (remaining === 0) {
    // Reset SQLite autoincrement sequence so next record starts at #1
    await prisma.$executeRawUnsafe(
      `UPDATE sqlite_sequence SET seq = 0 WHERE name = 'Wentop'`
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/all-wentops");
  revalidatePath("/my-wentops");
  revalidatePath("/my-wentops");
  revalidatePath("/");
  return { success: true };
}

export async function createUser(formData: FormData) {
  await checkAdmin();
  const dni = formData.get("dni") as string;
  const name = formData.get("name") as string;
  const surname = formData.get("surname") as string;

  if (!dni?.trim() || !name?.trim() || !surname?.trim()) {
    throw new Error("Todos los campos (DNI, Nombre, Apellido) son obligatorios");
  }

  const existing = await prisma.user.findUnique({ where: { email: dni.trim() } });
  if (existing) {
    throw new Error("Ya existe un usuario con ese DNI");
  }

  const fullName = `${name.trim()} ${surname.trim()}`;
  
  await prisma.user.create({
    data: {
      email: dni.trim(),
      name: fullName,
      password: "wentop",
      mustChangePassword: true
    }
  });

  revalidatePath("/dashboard");
  return { success: true, message: `Usuario ${fullName} creado exitosamente` };
}

export async function forceResetPassword(formData: FormData) {
  await checkAdmin();
  const dni = formData.get("dni") as string;

  if (!dni?.trim()) {
    throw new Error("El DNI es obligatorio");
  }

  const user = await prisma.user.findUnique({ where: { email: dni.trim() } });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  await prisma.user.update({
    where: { email: dni.trim() },
    data: {
      password: "wentop",
      mustChangePassword: true,
      securityAnswer: null // Opcional: borrar la respuesta de seguridad anterior
    }
  });

  revalidatePath("/dashboard");
  return { success: true, message: `Contraseña de ${user.name} restablecida a "wentop"` };
}
