"use client";
import { signOut } from "next-auth/react";

export default function MobileNav({ activePath }: { activePath: string }) {
  const active = (path: string) => activePath === path || activePath.startsWith(path + "/");
  const linkStyle = (path: string): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
    color: active(path) ? "var(--accent-red)" : "var(--text-secondary)",
    textDecoration: "none", fontSize: "0.65rem", fontWeight: "600",
    minWidth: "52px", padding: "4px 0",
  });

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(18,18,18,0.97)", backdropFilter: "blur(16px)",
      borderTop: "1px solid var(--border-light)",
      display: "flex", justifyContent: "space-around", alignItems: "flex-end",
      padding: `10px 8px calc(10px + env(safe-area-inset-bottom, 0px))`,
      zIndex: 100,
    }}>
      <a href="/my-wentops" style={linkStyle("/my-wentops")}>
        <span style={{ fontSize: "1.35rem" }}>👤</span>
        Mis Wentops
      </a>
      <a href="/all-wentops" style={linkStyle("/all-wentops")}>
        <span style={{ fontSize: "1.35rem" }}>🌐</span>
        Muro
      </a>
      <a href="/create" style={linkStyle("/create")}>
        <span style={{
          fontSize: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center",
          width: "44px", height: "44px", borderRadius: "50%",
          background: active("/create") ? "var(--accent-red)" : "rgba(230,0,0,0.8)",
          boxShadow: "0 4px 12px rgba(230,0,0,0.4)", marginTop: "-18px", color: "white",
        }}>+</span>
        Nueva
      </a>
      <a href="/legacy" style={linkStyle("/legacy")}>
        <span style={{ fontSize: "1.35rem" }}>📂</span>
        Historial
      </a>
      <button
        onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
          color: "var(--text-secondary)", background: "none", border: "none",
          cursor: "pointer", fontSize: "0.65rem", fontWeight: "600", padding: "4px 0",
          minWidth: "52px",
        }}
      >
        <span style={{ fontSize: "1.35rem" }}>🚪</span>
        Salir
      </button>
    </div>
  );
}
