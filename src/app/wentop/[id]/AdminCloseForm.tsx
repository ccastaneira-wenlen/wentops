"use client";

import { useState } from "react";
import { closeWentop } from "../../actions/admin";
import { useRouter } from "next/navigation";

export default function AdminCloseForm({
  wentopId,
  currentStatus = "ABIERTA",
}: {
  wentopId: string;
  currentStatus?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
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
        router.refresh();
      }
    } catch (error: any) {
      alert("Error: " + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        borderTop: isAlreadyClosed
          ? "3px solid var(--warning)"
          : "3px solid var(--accent-red)",
        marginTop: "8px",
      }}
    >
      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
        {isAlreadyClosed ? "⭐ Calificar Observación" : "Cerrar Observación"}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
        {isAlreadyClosed
          ? "Esta tarjeta fue cerrada por el empleado. Agregá la acción de cierre y tu valoración."
          : "Complete la acción de cierre y evalúe el reporte del operador."}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Acción de Cierre / Comentarios *</label>
          <textarea
            name="closingAction"
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
                  : "Excelente"}
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

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", padding: "12px", marginTop: "8px" }}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "⏳ Guardando..."
            : isAlreadyClosed
            ? "⭐ Calificar WENTOP"
            : "✅ Cerrar y Evaluar WENTOP"}
        </button>
      </form>
    </div>
  );
}
