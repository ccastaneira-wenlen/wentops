"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { isHeic, convertHeicBufferToJpeg } from "@/lib/heic-server";

async function processUploadedEvidence(file: File): Promise<string> {
  let buffer: Buffer<any> = Buffer.from(await file.arrayBuffer());
  let mimeType = file.type || "application/octet-stream";
  let fileName = file.name;

  if (isHeic(fileName, mimeType)) {
    try {
      buffer = await convertHeicBufferToJpeg(buffer);
      mimeType = "image/jpeg";
      fileName = fileName.replace(/\.(heic|heif)$/i, ".jpg");
    } catch (err) {
      console.error("Error converting HEIC file on server:", err);
    }
  }

  const base64 = buffer.toString("base64");
  const cleanName = encodeURIComponent(fileName);
  return `data:${mimeType};name=${cleanName};base64,${base64}`;
}

export async function createWentop(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "No autorizado. Tu sesión expiró, por favor vuelve a ingresar." };
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
      return { success: false, error: "Por favor completa todos los campos obligatorios marcados con (*)." };
    }

    if (observerSector === "Otros" && !observerSectorOther) {
      return { success: false, error: "Por favor especifique a qué sector pertenece." };
    }

    if (client === "OTRO" && !clientOther) {
      return { success: false, error: "Por favor especifique el nombre del cliente." };
    }

    if (observationType === "Otros" && !observationTypeOther) {
      return { success: false, error: "Por favor especifique el tipo de observación." };
    }

    // Handle files validations
    const files = (formData.getAll("evidence") as File[]).filter(f => f && f.size > 0);
    if (files.length > 5) {
      return { success: false, error: "Puedes adjuntar hasta un máximo de 5 archivos." };
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: `El archivo ${file.name} supera el tamaño máximo permitido de 10 MB.` };
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
      for (const file of files) {
        const dataUrl = await processUploadedEvidence(file);

        await prisma.evidence.create({
          data: {
            url: dataUrl,
            wentopId: wentop.id,
          },
        });
      }
    }

    revalidatePath("/my-wentops");
    revalidatePath("/all-wentops");
    revalidatePath("/dashboard");
    
    return { success: true, id: wentop.id };
  } catch (error: any) {
    console.error("Error al crear WENTOP:", error);
    return { success: false, error: error.message || "Error al procesar la solicitud en el servidor." };
  }
}

export async function updateWentop(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }

    const userId = (session.user as any).id;
    const id = parseInt(formData.get("id") as string, 10);

    const wentopToUpdate = await prisma.wentop.findUnique({ where: { id } });
    
    if (!wentopToUpdate) return { success: false, error: "Wentop no encontrada" };
    if (wentopToUpdate.userId !== userId && (session.user as any).role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para editar esta Wentop" };
    }
    if (wentopToUpdate.status !== "ABIERTA" && (session.user as any).role !== "ADMIN") {
      return { success: false, error: "No se puede editar una Wentop que ya fue cerrada" };
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
      return { success: false, error: "Por favor completa todos los campos obligatorios (*)." };
    }

    // Handle files validations
    const files = (formData.getAll("evidence") as File[]).filter(f => f && f.size > 0);
    const currentEvidencesCount = await prisma.evidence.count({ where: { wentopId: id } });
    if (currentEvidencesCount + files.length > 5) {
      return { success: false, error: `El total de archivos no puede superar 5 (ya tienes ${currentEvidencesCount} cargados).` };
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: `El archivo ${file.name} supera el tamaño máximo permitido de 10 MB.` };
      }
    }

    const isAdmin = (session.user as any).role === "ADMIN";
    const ratingStr = formData.get("rating") as string;
    const parsedRating = ratingStr ? parseInt(ratingStr, 10) : null;
    let rating = wentopToUpdate.rating;
    if (status === "ABIERTA") {
      rating = null;
    } else if (isAdmin && parsedRating && parsedRating >= 1 && parsedRating <= 5) {
      rating = parsedRating;
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
        rating,
      }
    });

    if (files.length > 0) {
      for (const file of files) {
        const dataUrl = await processUploadedEvidence(file);

        await prisma.evidence.create({
          data: {
            url: dataUrl,
            wentopId: id,
          },
        });
      }
    }

    revalidatePath(`/wentop/${id}`);
    revalidatePath("/my-wentops");
    revalidatePath("/all-wentops");
    revalidatePath("/dashboard");

    return { success: true, id };
  } catch (error: any) {
    console.error("Error al actualizar WENTOP:", error);
    return { success: false, error: error.message || "Error al actualizar la WENTOP." };
  }
}
