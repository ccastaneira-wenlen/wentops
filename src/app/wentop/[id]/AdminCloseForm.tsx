"use client";

import { useState } from "react";
import { closeWentop } from "../../actions/admin";
import { useRouter } from "next/navigation";

export default function AdminCloseForm({
  wentopId,
  currentStatus = "ABIERTA",
  initialRating = 0,
  initialClosingAction = "",
}: {
  wentopId: string;
  currentStatus?: string;
  initialRating?: number | null;
  initialClosingAction?: string | null;
}) {
  const isAlreadyRated = (initialRating || 0) > 0;
  const [isOpen, setIsOpen] = useState(!isAlreadyRated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const router = useRouter();

  const isAlreadyClosed = currentStatus === "CERRADA";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Debes asignar al menos 1 estrella.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", wentopId);
    formData.append("rating", rating.toString());

    try {
      const result = await closeWentop(formData);
      if (result.success) {
        if (isAlreadyRated) {
          setIsOpen(false);
        }
        router.refresh();
      }
    } catch (error: any) {
      alert("Error: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (isAlreadyRated && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{
          width: "100%",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "0.85rem",
          marginTop: "10px",
          color: "var(--text-primary)"
        }}
      >
        ✏️ Modificar calificación y comentarios de cierre
      </button>
    );
  }

  const title = isAlreadyRated
    ? "✏️ Modificar Calificación y Comentarios"
    : isAlreadyClosed
    ? "⭐ Calificar Observación"
    : "Cerrar Observación";

  const subtitle = isAlreadyRated
    ? "Actualizá la valoración de estrellas o la acción de cierre/comentarios."
    : isAlreadyClosed
    ? "Esta tarjeta fue cerrada por el empleado. Agregá la acción de cierre y tu valoración."
    : "Complete la acción de cierre y evalúe el reporte del operador.";

  return (
    <div
      className="glass-card"
      style={{
        borderTop: isAlreadyRated
          ? "3px solid var(--warning)"
          : isAlreadyClosed
          ? "3px solid var(--warning)"
          : "3px solid var(--accent-red)",
        marginTop: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>
          {title}
        </h3>
        {isAlreadyRated && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ✕ Cerrar
          </button>
        )}
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "18px" }}>
        {subtitle}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Acción de Cierre / Comentarios *</label>
          <textarea
            name="closingAction"
            defaultValue={initialClosingAction || ""}
            className="form-textarea"
            placeholder="Describe qué se hizo para resolver esta observación..."
            required
            rows={4}
          />
        </div>

        <div className="form-group" style={{ marginTop: "8px" }}>
          <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
            Valoración del reporte *
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "2rem",
                  color:
                    star <= (hoverRating || rating)
                      ? "var(--warning)"
                      : "var(--border-color)",
                  transition: "all 0.15s",
                  transform:
                    star <= (hoverRating || rating)
                      ? "scale(1.15)"
                      : "scale(1)",
                  padding: "0 2px",
                }}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                {rating === 1
                  ? "Básico"
                  : rating === 2
                  ? "Regular"
                  : rating === 3
                  ? "Bueno"
                  : rating === 4
                  ? "Muy bueno"
                  : "Excelente"} ({rating}★)
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginTop: "8px",
            }}
          >
            Esta valoración suma puntos al operador en el ranking mensual.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          {isAlreadyRated && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
              style={{ flex: 1, padding: "12px" }}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 2, padding: "12px" }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "⏳ Guardando..."
              : isAlreadyRated
              ? "💾 Guardar Cambios"
              : isAlreadyClosed
              ? "⭐ Calificar WENTOP"
              : "✅ Cerrar y Evaluar WENTOP"}
          </button>
        </div>
      </form>
    </div>
  );
}
