import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { isHeic, convertHeicBufferToJpeg } from "@/lib/heic-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      return new NextResponse("Evidencia no encontrada", { status: 404 });
    }

    // 1. Data URL (stored in database)
    if (evidence.url.startsWith("data:")) {
      const [header, base64Data] = evidence.url.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      const nameMatch = header.match(/name=([^;]+)/);
      let mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      let fileName = nameMatch ? decodeURIComponent(nameMatch[1]) : `evidencia-${evidence.id}`;
      let buffer: Buffer<any> = Buffer.from(base64Data, "base64");

      if (isHeic(fileName, mimeType)) {
        try {
          buffer = await convertHeicBufferToJpeg(buffer);
          mimeType = "image/jpeg";
          fileName = fileName.replace(/\.(heic|heif)$/i, ".jpg");
        } catch (convErr) {
          console.error("Error converting HEIC in evidence route:", convErr);
        }
      }

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${fileName}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 2. Local filesystem file (legacy or local dev)
    const localFilePath = path.join(process.cwd(), "public", evidence.url);
    if (fs.existsSync(localFilePath)) {
      let fileBuffer: Buffer<any> = fs.readFileSync(localFilePath);
      const ext = path.extname(evidence.url).toLowerCase();
      let fileName = path.basename(evidence.url);

      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        ".heic": "image/heic",
        ".heif": "image/heif",
      };
      let contentType = mimeMap[ext] || "application/octet-stream";

      if (isHeic(fileName, contentType)) {
        try {
          fileBuffer = await convertHeicBufferToJpeg(fileBuffer);
          contentType = "image/jpeg";
          fileName = fileName.replace(/\.(heic|heif)$/i, ".jpg");
        } catch (convErr) {
          console.error("Error converting local HEIC in evidence route:", convErr);
        }
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${fileName}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 3. Fallback redirect if external URL
    return NextResponse.redirect(new URL(evidence.url, request.url));
  } catch (error: any) {
    console.error("Error serving evidence:", error);
    return new NextResponse("Error al cargar la evidencia", { status: 500 });
  }
}
