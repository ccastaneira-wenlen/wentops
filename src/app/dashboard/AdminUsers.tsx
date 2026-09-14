"use client";

import { useState } from "react";
import { createUser, forceResetPassword } from "../actions/admin";

export default function AdminUsers() {
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createUser(formData);
      setCreateMsg("✅ " + result.message);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setCreateMsg("❌ " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsResetting(true);
    setResetMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      const result = await forceResetPassword(formData);
      setResetMsg("✅ " + result.message);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setResetMsg("❌ " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "24px" }}>
      {/* Create User Form */}
      <div className="glass-card" style={{ flex: "1", minWidth: "320px", padding: "24px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
          ➕ Agregar Nuevo Empleado
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
          La contraseña por defecto será "wentop" y deberá cambiarla al iniciar sesión.
        </p>
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">DNI (Sin puntos)</label>
            <input type="text" name="dni" className="form-input" placeholder="Ej: 33532816" required />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre</label>
              <input type="text" name="name" className="form-input" placeholder="Ej: Juan" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Apellido</label>
              <input type="text" name="surname" className="form-input" placeholder="Ej: Pérez" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={isCreating}>
            {isCreating ? "⏳ Agregando..." : "Crear Usuario"}
          </button>
          {createMsg && (
            <div style={{ marginTop: "12px", fontSize: "0.85rem", color: createMsg.startsWith("✅") ? "var(--success)" : "var(--accent-red)", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
              {createMsg}
            </div>
          )}
        </form>
      </div>

      {/* Reset Password Form */}
      <div className="glass-card" style={{ flex: "1", minWidth: "320px", padding: "24px", borderLeft: "3px solid var(--warning)" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
          🔑 Restablecer Contraseña
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Útil si el empleado olvidó su contraseña y su respuesta de seguridad. Se restablecerá a "wentop".
        </p>
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label className="form-label">DNI del Empleado</label>
            <input type="text" name="dni" className="form-input" placeholder="DNI del usuario" required />
          </div>
          <button type="submit" className="btn" style={{ width: "100%", marginTop: "12px", background: "var(--warning)", color: "#000" }} disabled={isResetting}>
            {isResetting ? "⏳ Restableciendo..." : "Forzar Restablecimiento"}
          </button>
          {resetMsg && (
            <div style={{ marginTop: "12px", fontSize: "0.85rem", color: resetMsg.startsWith("✅") ? "var(--success)" : "var(--accent-red)", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
              {resetMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
