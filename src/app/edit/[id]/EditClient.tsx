"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWentop } from "../../actions/wentop";

const OBSERVER_SECTORS = [
  "MASS",
  "Calidad",
  "Well Testing",
  "Wire line",
  "Fractura",
  "SBDP",
  "Mantenimiento",
  "Almacen",
  "Logistica",
  "PH",
  "Administración",
  "Directorio / Gerencia",
  "Otros",
];

const OBSERVED_SECTORS = [
  "Fractura",
  "Well Testing",
  "Wireline",
  "SBDP",
  "Administración",
  "Mantenimiento",
  "Almacen",
  "MASS",
  "Calidad",
  "Tercera compañia (Indicar Cia. en la observación)",
  "Logistica",
  "PH",
  "Cliente",
];

const CLIENT_OPTIONS = [
  "YPF",
  "PAE",
  "TECPETROL",
  "PLUSPETROL LA CALERA",
  "PLUSPETROL - PCN BAJO DEL CHOIQUE",
  "TOTAL",
  "CAPEX",
  "BASE COMAHUE",
  "PAMPA",
  "SHELL",
  "PHOENIX",
  "OTRO",
];

const CARD_TYPES = [
  "Detención de tareas",
  "Condición insegura",
  "Acto inseguro",
  "Cuasi Accidente",
  "Observación positiva",
];

const OBSERVATION_TYPES = [
  "Calidad",
  "Ambiente",
  "Seguridad",
  "Otros",
];

export default function EditClient({ initialData }: { initialData: any }) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  const [observerSector, setObserverSector] = useState(initialData.observerSector || "");
  const [client, setClient] = useState(initialData.client || "");
  const [observationType, setObservationType] = useState(initialData.observationType || "");
  const [status, setStatus] = useState<"ABIERTA" | "CERRADA">(initialData.status === "CERRADA" ? "CERRADA" : "ABIERTA");

  const existingCount = initialData.evidences?.length || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const combined = [...selectedFiles, ...newFiles];

    if (existingCount + combined.length > 5) {
      setFileError(`Solo puedes tener hasta 5 archivos en total (ya tienes ${existingCount} cargados previamente).`);
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    for (const f of newFiles) {
      if (f.size > MAX_SIZE) {
        setFileError(`El archivo "${f.name}" supera los 10 MB permitidos.`);
        return;
      }
    }

    setSelectedFiles(combined);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFileError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", initialData.id.toString());

    // Append newly selected files
    formData.delete("evidence");
    selectedFiles.forEach(file => {
      formData.append("evidence", file);
    });

    try {
      const result = await updateWentop(formData);
      if (result.success) {
        alert("¡WENTOP actualizada con éxito!");
        router.push(`/wentop/${initialData.id}`);
        router.refresh();
      }
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Mobile sticky header */}
      <div style={{
        background: "rgba(18,18,18,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-light)",
        padding: "16px",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href={`/wentop/${initialData.id}`} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1.2rem", lineHeight: 1 }}>←</a>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, letterSpacing: "-0.02em" }}>Editar WENTOP</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>#{initialData.id}</p>
          </div>
        </div>
        <img 
          src="/logo.jpg" 
          alt="Wenlen S.A." 
          style={{ height: '24px', objectFit: 'contain' }}
        />
      </div>

      <form id="wentop-form" onSubmit={handleSubmit} style={{ padding: "20px 16px 120px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* 1. Fecha del reporte */}
          <div className="form-group">
            <label className="form-label">Fecha del reporte *</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={initialData.date}
              className="form-input" 
              required 
            />
          </div>

          {/* 2. Nombre y Apellido del observador */}
          <div className="form-group">
            <label className="form-label">Nombre y Apellido del observador *</label>
            <input 
              type="text" 
              name="observerName" 
              defaultValue={initialData.observerName}
              placeholder="Nombre y Apellido completo" 
              className="form-input" 
              required 
            />
          </div>

          {/* 3. ¿A qué sector pertenece Usted? */}
          <div className="form-group">
            <label className="form-label">¿A qué sector pertenece Usted? *</label>
            <select 
              name="observerSector" 
              className="form-select" 
              value={observerSector}
              onChange={e => setObserverSector(e.target.value)}
              required
            >
              <option value="">Seleccione su sector...</option>
              {OBSERVER_SECTORS.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
            {observerSector === "Otros" && (
              <input 
                type="text" 
                name="observerSectorOther" 
                defaultValue={initialData.observerSectorOther || ""}
                className="form-input" 
                placeholder="Especifique su sector *" 
                style={{ marginTop: "8px" }} 
                required 
              />
            )}
          </div>

          {/* 4. Sector al que pertenece la observación */}
          <div className="form-group">
            <label className="form-label">Sector al que pertenece la observación *</label>
            <select 
              name="observedSector" 
              className="form-select" 
              defaultValue={initialData.observedSector}
              required
            >
              <option value="">Seleccione sector observado...</option>
              {OBSERVED_SECTORS.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* 5. Cliente */}
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select 
              name="client" 
              className="form-select" 
              value={client}
              onChange={e => setClient(e.target.value)}
              required
            >
              <option value="">Seleccione el cliente...</option>
              {CLIENT_OPTIONS.map(cli => (
                <option key={cli} value={cli}>{cli}</option>
              ))}
            </select>
            {client === "OTRO" && (
              <input 
                type="text" 
                name="clientOther" 
                defaultValue={initialData.clientOther || ""}
                className="form-input" 
                placeholder="Especifique nombre del cliente *" 
                style={{ marginTop: "8px" }} 
                required 
              />
            )}
          </div>

          {/* 6. Lugar (Pozo, locación, sitio) */}
          <div className="form-group">
            <label className="form-label">Lugar (Pozo, locación, sitio) *</label>
            <input 
              type="text" 
              name="place" 
              defaultValue={initialData.place}
              className="form-input" 
              placeholder="Ej: Pozo 4, Locación 12, Base Añelo" 
              required 
            />
          </div>

          {/* 7. Tipo de tarjeta */}
          <div className="form-group">
            <label className="form-label">Tipo de tarjeta *</label>
            <select 
              name="type" 
              className="form-select" 
              defaultValue={initialData.type}
              required
            >
              <option value="">Seleccione tipo de tarjeta...</option>
              {CARD_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 8. Tipo de observación */}
          <div className="form-group">
            <label className="form-label">Tipo de observación *</label>
            <select 
              name="observationType" 
              className="form-select" 
              value={observationType}
              onChange={e => setObservationType(e.target.value)}
              required
            >
              <option value="">Seleccione tipo de observación...</option>
              {OBSERVATION_TYPES.map(ot => (
                <option key={ot} value={ot}>{ot}</option>
              ))}
            </select>
            {observationType === "Otros" && (
              <input 
                type="text" 
                name="observationTypeOther" 
                defaultValue={initialData.observationTypeOther || ""}
                className="form-input" 
                placeholder="Especifique el tipo de observación *" 
                style={{ marginTop: "8px" }} 
                required 
              />
            )}
          </div>

          {/* 9. Descripción de la observación */}
          <div className="form-group">
            <label className="form-label">Descripción de la observación *</label>
            <textarea 
              name="description" 
              defaultValue={initialData.description}
              className="form-textarea" 
              placeholder="Describa detalladamente lo que observó..." 
              rows={4}
              required
            ></textarea>
          </div>

          {/* 10. Acciones Inmediatas tomadas */}
          <div className="form-group">
            <label className="form-label">Acciones Inmediatas tomadas *</label>
            <textarea 
              name="immediateActions" 
              defaultValue={initialData.immediateActions}
              className="form-textarea" 
              placeholder="¿Qué hizo usted inmediatamente al detectar esto?" 
              rows={3}
              required
            ></textarea>
          </div>

          {/* 11. Recomendaciones para eliminar definitivamente el riesgo */}
          <div className="form-group">
            <label className="form-label">Recomendaciones para eliminar definitivamente el riesgo *</label>
            <textarea 
              name="recommendations" 
              defaultValue={initialData.recommendations}
              className="form-textarea" 
              placeholder="Sus sugerencias para que no vuelva a ocurrir..." 
              rows={3}
              required
            ></textarea>
          </div>

          {/* 12. Estado */}
          <div className="form-group">
            <label className="form-label">Estado</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setStatus("ABIERTA")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: status === "ABIERTA" ? "2px solid var(--accent-red)" : "1px solid var(--border-color)",
                  background: status === "ABIERTA" ? "rgba(230,0,0,0.15)" : "var(--bg-secondary)",
                  color: status === "ABIERTA" ? "#fff" : "var(--text-secondary)",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                🟡 Abierta
              </button>
              <button
                type="button"
                onClick={() => setStatus("CERRADA")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: status === "CERRADA" ? "2px solid var(--success)" : "1px solid var(--border-color)",
                  background: status === "CERRADA" ? "rgba(0,204,102,0.15)" : "var(--bg-secondary)",
                  color: status === "CERRADA" ? "#fff" : "var(--text-secondary)",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                🟢 Cerrada
              </button>
            </div>
            <input type="hidden" name="status" value={status} />
          </div>

          {/* 13. Justificación del estado (Abierta/Cerrada) */}
          <div className="form-group">
            <label className="form-label">Justificación del estado ({status === "ABIERTA" ? "Abierta" : "Cerrada"}) *</label>
            <textarea 
              name="statusJustification" 
              defaultValue={initialData.statusJustification || ""}
              className="form-textarea" 
              placeholder="Explique el motivo del estado seleccionado..." 
              rows={2}
              required
            ></textarea>
          </div>

          {/* 14 & 15. Acción de cierre y Fecha de cierre */}
          {status === "CERRADA" && (
            <div style={{
              background: "rgba(0,204,102,0.06)",
              border: "1px solid rgba(0,204,102,0.25)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--success)" }}>
                Datos de Cierre
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.85rem" }}>Acción de cierre</label>
                <textarea 
                  name="closingAction" 
                  defaultValue={initialData.closingAction || ""}
                  className="form-textarea" 
                  placeholder="Detalle de la acción final de cierre tomada..." 
                  rows={2}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.85rem" }}>Fecha de cierre</label>
                <input 
                  type="date" 
                  name="closingDate" 
                  defaultValue={initialData.closingDate || todayStr}
                  className="form-input" 
                />
              </div>
            </div>
          )}

          {/* 16. Evidencias */}
          <div className="form-group">
            <label className="form-label">Evidencia (adjuntar archivo)</label>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 10px" }}>
              Sube hasta 5 archivos compatibles: PDF, document, image o video. El tamaño máximo es de 10 MB por archivo.
            </p>

            {/* Existing evidences display */}
            {initialData.evidences && initialData.evidences.length > 0 && (
              <div style={{ marginBottom: "14px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Archivos adjuntos guardados ({initialData.evidences.length}):
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {initialData.evidences.map((ev: any) => (
                    <a 
                      key={ev.id} 
                      href={ev.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="badge" 
                      style={{ background: "rgba(255,255,255,0.06)", textDecoration: "none", color: "var(--text-primary)" }}
                    >
                      📎 {ev.url.split("/").pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {existingCount < 5 && (
              <div style={{
                padding: "20px",
                border: "2px dashed var(--border-color)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                backgroundColor: "var(--bg-secondary)"
              }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" 
                  style={{ display: "none" }} 
                  id="file-upload" 
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="file-upload" 
                  className="btn btn-secondary" 
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  📎 Agregar Más Archivos
                </label>

                {fileError && (
                  <div style={{ marginTop: "10px", color: "var(--accent-red)", fontSize: "0.85rem", fontWeight: "600" }}>
                    ⚠️ {fileError}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: "16px", textAlign: "left", width: "100%" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px", textAlign: "center" }}>
                      Nuevos archivos seleccionados ({selectedFiles.length}):
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                      {selectedFiles.map((f, i) => {
                        const isImg = f.type.startsWith("image/");
                        const isVid = f.type.startsWith("video/");
                        const sizeInMb = (f.size / (1024 * 1024)).toFixed(1);

                        return (
                          <div 
                            key={i} 
                            style={{
                              position: "relative",
                              height: "100px",
                              borderRadius: "var(--radius-sm)",
                              overflow: "hidden",
                              border: "1px solid var(--border-color)",
                              background: "var(--bg-primary)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            {isImg ? (
                              <img 
                                src={URL.createObjectURL(f)} 
                                alt={f.name} 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                            ) : isVid ? (
                              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "4px" }}>
                                <span style={{ fontSize: "1.8rem" }}>🎥</span>
                                <span style={{ fontSize: "0.65rem", color: "#fff", marginTop: "2px", textAlign: "center", wordBreak: "break-all" }}>{f.name.slice(0, 10)}</span>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>{sizeInMb} MB</span>
                              </div>
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px", textAlign: "center" }}>
                                <span style={{ fontSize: "1.8rem" }}>📄</span>
                                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", wordBreak: "break-all", marginTop: "4px", lineHeight: 1.1 }}>{f.name.slice(0, 12)}</span>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginTop: "2px" }}>{sizeInMb} MB</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                background: "rgba(0,0,0,0.7)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                lineHeight: 1
                              }}
                              title="Quitar archivo"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </form>

      {/* Sticky mobile submit button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "12px 16px 20px",
        background: "rgba(18,18,18,0.97)", backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border-light)",
        zIndex: 100,
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <button
            type="submit"
            form="wentop-form"
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "⏳ Guardando..." : "✅ Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
