import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;

  // Fetch all wentops with user info, evidences and counts
  const wentops = await prisma.wentop.findMany({
    orderBy: { id: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      evidences: { select: { id: true, url: true } },
      comments: { select: { id: true } },
    },
  });

  // ---- Sheet 1: Main data ----
  const rows = wentops.map((w) => ({
    "ID": `#${w.id}`,
    "Fecha": new Date(w.date).toLocaleDateString("es-AR"),
    "Observador": w.observerName,
    "DNI Observador": w.user?.email ?? "",
    "Sector Observador": w.observerSector === "Otros" && w.observerSectorOther ? `Otros: ${w.observerSectorOther}` : w.observerSector,
    "Sector Observado": w.observedSector,
    "Cliente": w.client === "OTRO" && w.clientOther ? `OTRO: ${w.clientOther}` : (w.client ?? ""),
    "Lugar": w.place,
    "Tipo de Tarjeta": w.type,
    "Tipo de Observación": w.observationType === "Otros" && w.observationTypeOther ? `Otros: ${w.observationTypeOther}` : (w.observationType ?? ""),
    "Descripción": w.description,
    "Acciones Inmediatas": w.immediateActions,
    "Recomendaciones": w.recommendations,
    "Estado": w.status,
    "Justificación de Estado": w.statusJustification ?? "",
    "Valoración (★)": w.rating ?? "",
    "Acción de Cierre": w.closingAction ?? "",
    "Fecha de Cierre": w.closingDate ? new Date(w.closingDate).toLocaleDateString("es-AR") : "",
    "Cant. Archivos": w.evidences.length,
    "Comentarios": w.comments.length,
    "Creada el": new Date(w.createdAt).toLocaleDateString("es-AR"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 6 },   // ID
    { wch: 12 },  // Fecha
    { wch: 28 },  // Observador
    { wch: 14 },  // DNI
    { wch: 20 },  // Sector Obs.
    { wch: 20 },  // Sector Observado
    { wch: 22 },  // Cliente
    { wch: 20 },  // Lugar
    { wch: 22 },  // Tipo Tarjeta
    { wch: 20 },  // Tipo Observación
    { wch: 60 },  // Descripción
    { wch: 50 },  // Acciones Inmediatas
    { wch: 50 },  // Recomendaciones
    { wch: 10 },  // Estado
    { wch: 35 },  // Justificación Estado
    { wch: 10 },  // Valoración
    { wch: 40 },  // Acción de Cierre
    { wch: 14 },  // Fecha Cierre
    { wch: 12 },  // Cant. Archivos
    { wch: 12 },  // Comentarios
    { wch: 12 },  // Creada el
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Wentops");

  // ---- Sheet 2: Evidence index with hyperlinks ----
  const photoAoA: (string | { t: string; v: string; l?: { Target: string } })[][] = [
    ["ID Wentop", "Observador", "Fecha", "Archivo", "Ver foto (enlace)"],
  ];

  const imageBuffers: { row: number; col: number; buf: Buffer; ext: string }[] = [];

  for (const w of wentops) {
    for (const ev of w.evidences) {
      const fullUrl = `${baseUrl}${ev.url}`;
      const filename = path.basename(ev.url);
      const rowIndex = photoAoA.length; // 0-based row in aoa

      photoAoA.push([
        `#${w.id}`,
        w.observerName,
        new Date(w.date).toLocaleDateString("es-AR"),
        filename,
        fullUrl, // will be converted to hyperlink below
      ]);

      // Try to load image for embedding
      try {
        const filePath = path.join(process.cwd(), "public", ev.url);
        const ext = path.extname(ev.url).toLowerCase();
        const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
        if (isImage && fs.existsSync(filePath)) {
          const imgBuffer = fs.readFileSync(filePath);
          imageBuffers.push({ row: rowIndex, col: 5, buf: imgBuffer, ext: ext.replace(".", "") });
        }
      } catch {
        // skip
      }
    }
  }

  if (photoAoA.length > 1) {
    const wsPhotos = XLSX.utils.aoa_to_sheet(photoAoA);

    // Add hyperlinks to column E (index 4) for each evidence row
    for (let r = 1; r < photoAoA.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: 4 });
      if (wsPhotos[cellRef]) {
        const url = photoAoA[r][4] as string;
        wsPhotos[cellRef].l = { Target: url };
        wsPhotos[cellRef].v = "🔗 Abrir foto";
      }
    }

    wsPhotos["!cols"] = [
      { wch: 10 },  // ID
      { wch: 28 },  // Observador
      { wch: 12 },  // Fecha
      { wch: 55 },  // Archivo
      { wch: 20 },  // Enlace
    ];

    // Set row heights for photo rows (taller to fit thumbnails if viewer supports)
    const rowHeights: { hpt: number }[] = [{ hpt: 20 }]; // header
    for (let i = 1; i < photoAoA.length; i++) {
      rowHeights.push({ hpt: 60 }); // taller rows for evidence
    }
    wsPhotos["!rows"] = rowHeights;

    XLSX.utils.book_append_sheet(wb, wsPhotos, "Evidencias");
  }

  // ---- Sheet 3: Summary stats ----
  const totalOpen = wentops.filter(w => w.status === "ABIERTA").length;
  const totalClosed = wentops.filter(w => w.status === "CERRADA").length;
  const totalPhotos = wentops.reduce((sum, w) => sum + w.evidences.length, 0);
  const avgRating = wentops.filter(w => w.rating).reduce((sum, w, _i, arr) => sum + (w.rating ?? 0) / arr.filter(x => x.rating).length, 0);

  const sectorCount: Record<string, number> = {};
  for (const w of wentops) {
    sectorCount[w.observedSector] = (sectorCount[w.observedSector] || 0) + 1;
  }

  const summaryRows = [
    ["RESUMEN WENTOP", ""],
    ["Exportado el", new Date().toLocaleString("es-AR")],
    ["", ""],
    ["Total de tarjetas", wentops.length],
    ["Abiertas", totalOpen],
    ["Cerradas", totalClosed],
    ["Total de fotos", totalPhotos],
    ["Valoración promedio ★", wentops.some(w => w.rating) ? avgRating.toFixed(1) : "—"],
    ["", ""],
    ["TARJETAS POR SECTOR OBSERVADO", ""],
    ...Object.entries(sectorCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="wentops_${today}.xlsx"`,
    },
  });
}
