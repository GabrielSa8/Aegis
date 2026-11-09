import React, { useState } from 'react';
import { Unlock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { TacticalButton } from '../ui/TacticalButton';

/**
 * DecryptPromptModal — Modal para solicitar contraseña al descifrar permanentemente una nota
 */
export function DecryptPromptModal({ isOpen, onClose, noteTitle, isSpecific = false, onConfirm, loading = false }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError('Por favor ingresa la contraseña.');
      return;
    }
    onConfirm(password);
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
          maxWidth: '400px',
          padding: '1.5rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'color-mix(in srgb, var(--warning, #d97706) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning, #d97706) 40%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning, #d97706)'
            }}
          >
            <Unlock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Descifrar Nota (.md.enc ➔ .md)
            </h3>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                display: 'block',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {noteTitle}
            </span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {isSpecific
            ? 'Ingresa la contraseña específica de esta nota para restaurar el archivo en texto plano.'
            : 'Ingresa tu Contraseña Maestra para restaurar la nota en texto plano.'}
        </p>

        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={isSpecific ? 'Contraseña específica...' : 'Contraseña maestra...'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <TacticalButton variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="warning"
            size="sm"
            icon={Unlock}
            loading={loading}
            onClick={handleSubmit}
          >
            Descifrar Nota
          </TacticalButton>
        </div>
      </div>
    </div>
  );
}
