"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export async function createWentop(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("No autorizado. Debes iniciar sesión.");
  }

  const userId = (session.user as any).id;
  const observerNameInput = (formData.get("observerName") as string)?.trim();
  const observerName = observerNameInput || session.user.name || "Desconocido";

  const dateStr = formData.get("date") as string;
  const date = dateStr ? new Date(dateStr) : new Date();
  const place = (formData.get("place") as string)?.trim();
  const observerSector = formData.get("observerSector") as string;
  const observerSectorOther = (formData.get("observerSectorOther") as string)?.trim() || null;
  const observedSector = formData.get("observedSector") as string;
  const client = formData.get("client") as string;
  const clientOther = (formData.get("clientOther") as string)?.trim() || null;
  const type = formData.get("type") as string; // Tipo de tarjeta
  const observationType = formData.get("observationType") as string; // Tipo de observación
  const observationTypeOther = (formData.get("observationTypeOther") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim();
  const immediateActions = (formData.get("immediateActions") as string)?.trim();
  const recommendations = (formData.get("recommendations") as string)?.trim();
  
  const rawStatus = (formData.get("status") as string)?.toUpperCase() || "ABIERTA";
  const status = rawStatus === "CERRADA" ? "CERRADA" : "ABIERTA";
  const statusJustification = (formData.get("statusJustification") as string)?.trim() || null;
  const closingAction = (formData.get("closingAction") as string)?.trim() || null;
  const closingDateStr = formData.get("closingDate") as string;
  const closingDate = closingDateStr ? new Date(closingDateStr) : (status === "CERRADA" ? new Date() : null);

  if (!dateStr || !place || !observerSector || !observedSector || !client || !type || !observationType || !description || !immediateActions || !recommendations || !statusJustification) {
    throw new Error("Por favor completa todos los campos obligatorios (*).");
  }

  if (observerSector === "Otros" && !observerSectorOther) {
    throw new Error("Por favor especifique a qué sector pertenece.");
  }

  if (client === "OTRO" && !clientOther) {
    throw new Error("Por favor especifique el nombre del cliente.");
  }

  if (observationType === "Otros" && !observationTypeOther) {
    throw new Error("Por favor especifique el tipo de observación.");
  }

  // Handle files validations
  const files = (formData.getAll("evidence") as File[]).filter(f => f && f.size > 0);
  if (files.length > 5) {
    throw new Error("Puedes adjuntar hasta un máximo de 5 archivos.");
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo ${file.name} supera el tamaño máximo permitido de 10 MB.`);
    }
  }

  const wentop = await prisma.wentop.create({
    data: {
      date,
      observerName,
      observerSector,
      observerSectorOther,
      observedSector,
      client,
      clientOther,
      place,
      type,
      observationType,
      observationTypeOther,
      description,
      immediateActions,
      recommendations,
      status,
      statusJustification,
      closingAction,
      closingDate,
      userId,
    }
  });

  if (files.length > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${wentop.id}-${Date.now()}-${cleanFileName}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);
      
      await prisma.evidence.create({
        data: {
          url: `/uploads/${filename}`,
          wentopId: wentop.id
        }
      });
    }
  }

  revalidatePath("/my-wentops");
  revalidatePath("/all-wentops");
  revalidatePath("/dashboard");
  
  return { success: true, id: wentop.id };
}

export async function updateWentop(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("No autorizado. Debes iniciar sesión.");
  }

  const userId = (session.user as any).id;
  const id = parseInt(formData.get("id") as string, 10);

  const wentopToUpdate = await prisma.wentop.findUnique({ where: { id } });
  
  if (!wentopToUpdate) throw new Error("Wentop no encontrada");
  if (wentopToUpdate.userId !== userId && (session.user as any).role !== "ADMIN") {
    throw new Error("No tienes permisos para editar esta Wentop");
  }
  if (wentopToUpdate.status !== "ABIERTA" && (session.user as any).role !== "ADMIN") {
    throw new Error("No se puede editar una Wentop que ya fue cerrada");
  }

  const observerNameInput = (formData.get("observerName") as string)?.trim();
  const observerName = observerNameInput || wentopToUpdate.observerName;

  const dateStr = formData.get("date") as string;
  const date = dateStr ? new Date(dateStr) : wentopToUpdate.date;
  const place = (formData.get("place") as string)?.trim();
  const observerSector = formData.get("observerSector") as string;
  const observerSectorOther = (formData.get("observerSectorOther") as string)?.trim() || null;
  const observedSector = formData.get("observedSector") as string;
  const client = formData.get("client") as string;
  const clientOther = (formData.get("clientOther") as string)?.trim() || null;
  const type = formData.get("type") as string;
  const observationType = formData.get("observationType") as string;
  const observationTypeOther = (formData.get("observationTypeOther") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim();
  const immediateActions = (formData.get("immediateActions") as string)?.trim();
  const recommendations = (formData.get("recommendations") as string)?.trim();

  const rawStatus = (formData.get("status") as string)?.toUpperCase() || wentopToUpdate.status;
  const status = rawStatus === "CERRADA" ? "CERRADA" : "ABIERTA";
  const statusJustification = (formData.get("statusJustification") as string)?.trim() || wentopToUpdate.statusJustification;
  const closingAction = (formData.get("closingAction") as string)?.trim() || wentopToUpdate.closingAction;
  const closingDateStr = formData.get("closingDate") as string;
  const closingDate = closingDateStr ? new Date(closingDateStr) : (status === "CERRADA" && !wentopToUpdate.closingDate ? new Date() : wentopToUpdate.closingDate);

  if (!dateStr || !place || !observerSector || !observedSector || !client || !type || !observationType || !description || !immediateActions || !recommendations || !statusJustification) {
    throw new Error("Por favor completa todos los campos obligatorios (*).");
  }

  // Handle files validations
  const files = (formData.getAll("evidence") as File[]).filter(f => f && f.size > 0);
  const currentEvidencesCount = await prisma.evidence.count({ where: { wentopId: id } });
  if (currentEvidencesCount + files.length > 5) {
    throw new Error(`El total de archivos no puede superar 5 (ya tienes ${currentEvidencesCount} cargados).`);
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo ${file.name} supera el tamaño máximo permitido de 10 MB.`);
    }
  }

  await prisma.wentop.update({
    where: { id },
    data: {
      date,
      observerName,
      observerSector,
      observerSectorOther,
      observedSector,
      client,
      clientOther,
      place,
      type,
      observationType,
      observationTypeOther,
      description,
      immediateActions,
      recommendations,
      status,
      statusJustification,
      closingAction,
      closingDate,
    }
  });

  if (files.length > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${id}-${Date.now()}-${cleanFileName}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);
      
      await prisma.evidence.create({
        data: {
          url: `/uploads/${filename}`,
          wentopId: id
        }
      });
    }
  }

  revalidatePath(`/wentop/${id}`);
  revalidatePath("/my-wentops");
  revalidatePath("/all-wentops");
  revalidatePath("/dashboard");

  return { success: true, id };
}
