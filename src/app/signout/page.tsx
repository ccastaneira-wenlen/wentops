"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <div className="glass-card" style={{
        width: "100%",
        maxWidth: "380px",
        padding: "40px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(230,0,0,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <img
          src="/logo.jpg"
          alt="Wenlen S.A."
          style={{ height: "40px", objectFit: "contain", marginBottom: "28px" }}
        />

        {/* Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(230,0,0,0.1)",
          border: "1px solid rgba(230,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          margin: "0 auto 20px",
        }}>
          🚪
        </div>

        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "800",
          letterSpacing: "-0.02em",
          background: "linear-gradient(90deg, #fff 0%, #aaa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px",
        }}>
          Cerrar Sesión
        </h1>

        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          marginBottom: "32px",
          lineHeight: 1.5,
        }}>
          ¿Estás seguro que deseas salir del sistema?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "0.95rem",
              fontWeight: "700",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Cerrando sesión..." : "Sí, cerrar sesión"}
          </button>

          <a
            href="/my-wentops"
            className="btn btn-secondary"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "0.95rem",
              fontWeight: "600",
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              boxSizing: "border-box",
            }}
          >
            Cancelar
          </a>
        </div>
      </div>
    </div>
  );
}
