"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [view, setView] = useState<"login" | "change-password" | "recover">("login");
  
  // Login fields
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  
  // Change/Recover password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const res = await signIn('credentials', {
      redirect: false,
      dni,
      password
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError('Credenciales inválidas. Verifica tu DNI y contraseña.');
    } else {
      if (password === 'wentop') {
        setView("change-password");
      } else {
        router.push('/my-wentops');
        router.refresh();
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (securityAnswer.trim() === '') {
      setError("La respuesta de seguridad es obligatoria");
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, oldPassword: password, newPassword, securityAnswer })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("Contraseña actualizada exitosamente.");
        const res = await signIn('credentials', {
          redirect: false,
          dni,
          password: newPassword
        });
        if (!res?.error) {
          router.push('/my-wentops');
          router.refresh();
        } else {
          setError('Error al iniciar sesión con la nueva contraseña.');
          setIsSubmitting(false);
        }
      } else {
        setError(data.error || 'Error al cambiar la contraseña.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Error de red.');
      setIsSubmitting(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, securityAnswer, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMsg("Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.");
        setView("login");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSecurityAnswer("");
      } else {
        setError(data.error || 'Error al recuperar la contraseña.');
      }
    } catch (err) {
      setError('Error de red.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '10vh' }}>
      <div className="glass-card">
        <div className="text-center mb-8">
          <h1 className="text-gradient-red" style={{ fontSize: '2rem' }}>
            <span className="logo-w">W</span>ENTOP
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {view === "login" ? "Ingreso al portal" : view === "change-password" ? "Cambio de contraseña" : "Recuperar contraseña"}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(230, 0, 0, 0.1)', color: 'var(--accent-red)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(0, 204, 102, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            {successMsg}
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">DNI (Sin puntos)</label>
              <input 
                type="text" 
                className="form-input" 
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 33532816" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
            
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button 
                type="button" 
                onClick={() => { setView("recover"); setError(""); setSuccessMsg(""); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {view === "change-password" && (
          <form onSubmit={handleChangePassword}>
            <div className="mb-6">
              <div style={{ backgroundColor: 'rgba(255, 204, 0, 0.1)', border: '1px solid var(--warning)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <p style={{ color: 'var(--warning)', fontSize: '0.9rem', margin: 0 }}>
                  <strong>Por seguridad</strong>, debes cambiar tu contraseña predeterminada antes de continuar y configurar una pregunta de seguridad.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" 
                required 
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña" 
                required 
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pregunta de seguridad: ¿Nombre de tu mascota?</label>
              <input 
                type="text" 
                className="form-input" 
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Ej: Firulais" 
                required 
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Esta respuesta te permitirá recuperar tu cuenta si olvidas la contraseña.
              </p>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Guardar y Continuar'}
            </button>
          </form>
        )}
        
        {view === "recover" && (
          <form onSubmit={handleRecover}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px", textAlign: "center" }}>
              Ingresa tu DNI y la respuesta a tu pregunta de seguridad para crear una nueva contraseña.
            </p>
            
            <div className="form-group">
              <label className="form-label">DNI (Sin puntos)</label>
              <input 
                type="text" 
                className="form-input" 
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 33532816" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Pregunta de seguridad: ¿Nombre de tu mascota?</label>
              <input 
                type="text" 
                className="form-input" 
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Tu respuesta secreta" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" 
                required 
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña" 
                required 
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Verificando...' : 'Restablecer Contraseña'}
            </button>
            
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button 
                type="button" 
                onClick={() => { setView("login"); setError(""); setSuccessMsg(""); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
