import { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Unlock, Eye, EyeOff, AlertTriangle, Key } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function MasterLockScreen({ onUnlock, hasEncryptedDb, autoLockMinutes }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const res = await onUnlock(password);
    if (!res.success) {
      setError(res.error || 'Contraseña maestra incorrecta');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.select();
    }
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'color-mix(in srgb, var(--bg-main) 97%, black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        userSelect: 'none'
      }}
    >
      <div
        className={shake ? 'aegis-shake-anim' : ''}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'color-mix(in srgb, var(--bg-card) 96%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Glow Header Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 45%, transparent)',
            boxShadow: '0 0 24px color-mix(in srgb, var(--primary) 25%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '18px'
          }}
        >
          <Lock size={28} />
        </div>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-high)'
          }}
        >
          Aegis Security Vault
        </h2>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}
        >
          Protección de datos en reposo activada. Ingresa tu Contraseña Maestra para desbloquear el Cockpit.
        </p>

        {/* Tactical Badges */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '22px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              color: 'var(--primary)'
            }}
          >
            AES-256-GCM
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            Argon2id KDF
          </span>
          {hasEncryptedDb && (
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'color-mix(in srgb, var(--accent, #60a5fa) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent, #60a5fa) 30%, transparent)',
                color: 'var(--accent, #60a5fa)'
              }}
            >
              DB Cifrada
            </span>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña Maestra..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 42px 12px 16px',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
                color: 'var(--text-high)',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--danger)',
                fontSize: '0.78rem',
                marginBottom: '16px',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <TacticalButton
            type="submit"
            variant="primary"
            size="md"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!password.trim() || isSubmitting}
            icon={isSubmitting ? Key : Unlock}
          >
            {isSubmitting ? 'Descifrando Vault...' : 'Desbloquear Cockpit'}
          </TacticalButton>
        </form>

        <span
          style={{
            marginTop: '16px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            opacity: 0.7
          }}
        >
          Presiona <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>Enter</kbd> para acceder
        </span>
      </div>
    </div>
  );
}
