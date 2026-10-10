import convert from "heic-convert";

/**
 * Checks if a filename or MIME type corresponds to HEIC/HEIF format
 */
export function isHeic(filename: string, mimeType?: string): boolean {
  const name = (filename || "").toLowerCase();
  const type = (mimeType || "").toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type.includes("image/heic") ||
    type.includes("image/heif")
  );
}

/**
 * Converts a HEIC/HEIF Buffer into a standard JPEG Buffer
 */
export async function convertHeicBufferToJpeg(
  inputBuffer: Uint8Array,
  quality = 0.85
): Promise<Buffer<any>> {
  const output = await convert({
    buffer: inputBuffer,
    format: "JPEG",
    quality,
  });
  return Buffer.from(output.buffer, output.byteOffset, output.byteLength);
}
