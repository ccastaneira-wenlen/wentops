"use client";

import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="navbar desktop-only-nav">
      <div className="container">
        <a href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/logo.jpg"
            alt="Wenlen S.A."
            style={{ height: "32px", objectFit: "contain" }}
          />
          <span style={{ display: "none" }}>
            <span className="logo-w">W</span>ENLEN
          </span>
        </a>
        <div className="nav-links">
          {status === "loading" ? null : session?.user ? (
            <>
              <a href="/my-wentops" className="nav-link">Mis Observaciones</a>
              <a href="/all-wentops" className="nav-link">Muro</a>
              <a href="/legacy" className="nav-link">Historial</a>
              {(session.user as any).role === "ADMIN" && (
                <a href="/dashboard" className="nav-link">Panel Admin</a>
              )}
              <button
                onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Salir
              </button>
            </>
          ) : (
            <a href="/login" className="btn btn-primary">Ingresar</a>
          )}
        </div>
      </div>
    </nav>
  );
}
