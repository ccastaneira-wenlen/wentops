/**
 * Detects if a File or file metadata is HEIC/HEIF format
 */
export function isHeicFile(file: { name: string; type?: string }): boolean {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence"
  );
}

/**
 * Converts a HEIC/HEIF File to a JPEG File in the browser using heic2any.
 * If conversion is not needed or fails, returns the file.
 */
export async function convertHeicFileToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });

    const blob = Array.isArray(result) ? result[0] : result;
    const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (error) {
    console.warn("Client-side HEIC conversion failed, will upload original for server conversion:", error);
    return file;
  }
}
