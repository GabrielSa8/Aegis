import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { TacticalButton } from '../ui/TacticalButton';

/**
 * EncryptNoteModal — Selección de modo de cifrado para notas (AES-256-GCM)
 * Soporta Cifrado General (Clave Maestra) o Cifrado Específico (PIN independiente).
 */
export function EncryptNoteModal({ isOpen, onClose, noteTitle, onConfirm, loading = false }) {
  const [mode, setMode] = useState('general');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError(null);

    if (mode === 'specific') {
      if (!password || password.length < 4) {
        setError('La contraseña específica debe tener al menos 4 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    onConfirm({
      mode,
      password: mode === 'specific' ? password : null
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(5px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #121615)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: 'var(--radius-lg, 12px)',
          width: '100%',
          maxWidth: '440px',
          padding: '1.5rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Lock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Cifrar Nota en Reposo
            </h3>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                display: 'block',
                maxWidth: '340px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {noteTitle}
            </span>
          </div>
        </div>

        {/* Selector de Modo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Opción 1: Clave Maestra */}
          <div
            onClick={() => { setMode('general'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: `1px solid ${mode === 'general' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: mode === 'general' ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ marginTop: '2px', color: mode === 'general' ? 'var(--primary)' : 'var(--text-muted)' }}>
              <ShieldCheck size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high)' }}>
                  Clave Maestra de Aegis (General)
                </span>
                <input
                  type="radio"
                  checked={mode === 'general'}
                  onChange={() => setMode('general')}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Se descifra automáticamente en memoria mientras la sesión de Aegis esté desbloqueada.
              </p>
            </div>
          </div>

          {/* Opción 2: Clave Específica */}
          <div
            onClick={() => { setMode('specific'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: `1px solid ${mode === 'specific' ? 'var(--warning, #d97706)' : 'var(--border-color)'}`,
              background: mode === 'specific' ? 'color-mix(in srgb, var(--warning, #d97706) 8%, transparent)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ marginTop: '2px', color: mode === 'specific' ? 'var(--warning, #d97706)' : 'var(--text-muted)' }}>
              <Key size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-high)' }}>
                  Contraseña Específica (Independiente)
                </span>
                <input
                  type="radio"
                  checked={mode === 'specific'}
                  onChange={() => setMode('specific')}
                  style={{ accentColor: 'var(--warning, #d97706)', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Clave secreta única para esta nota. Requerirá ingresarla cada vez que se consulte, incluso si Aegis está abierto.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs para Clave Específica */}
        {mode === 'specific' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña para esta nota (mín. 4 caracteres)..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md, 6px)',
                  padding: '8px 36px 8px 12px',
                  color: 'var(--text-high)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmar contraseña..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 6px)',
                padding: '8px 12px',
                color: 'var(--text-high)',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Banner de Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.74rem',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'color-mix(in srgb, var(--danger, #ef4444) 10%, transparent)'
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <TacticalButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant={mode === 'specific' ? 'warning' : 'primary'}
            size="sm"
            icon={Lock}
            loading={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Cifrando...' : 'Cifrar Nota (AES-256)'}
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
