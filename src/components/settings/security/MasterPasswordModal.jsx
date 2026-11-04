import { useState } from 'react';
import { Key, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function MasterPasswordModal({
  isOpen,
  onClose,
  mode = 'setup', // 'setup' | 'change'
  onSubmit
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encryptDb, setEncryptDb] = useState(false);
  const [encryptCreds, setEncryptCreds] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'Introduce contraseña' };
    if (pwd.len < 6) return { score: 1, text: 'Demasiado corta (< 6)' };
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { score: 1, text: 'Débil' };
    if (score <= 3) return { score: 2, text: 'Buena' };
    return { score: 3, text: 'Fuerte' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    if (mode === 'change' && !currentPassword) {
      setError('Debes ingresar la contraseña actual');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    const res = await onSubmit({
      currentPassword,
      password,
      confirmPassword,
      encryptCredentials: encryptCreds,
      encryptDatabase: encryptDb
    });

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Error procesando solicitud');
    }
    setIsSubmitting(false);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'setup' ? 'Configurar Contraseña Maestra' : 'Cambiar Contraseña Maestra'}
      icon={Key}
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'change' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {mode === 'setup' ? 'Nueva Contraseña Maestra' : 'Nueva Contraseña'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres..."
              required
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Strength Bar */}
          {password && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    style={{
                      height: '4px',
                      flex: 1,
                      borderRadius: '2px',
                      background: strength.score >= step
                        ? step === 1 ? 'var(--danger)' : step === 2 ? 'var(--warning)' : 'var(--primary)'
                        : 'rgba(255,255,255,0.08)'
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{strength.text}</span>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Confirmar Contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña..."
            required
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {mode === 'setup' && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-high)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={encryptDb}
                onChange={(e) => setEncryptDb(e.target.checked)}
              />
              <span>Cifrar base de datos SQLite (`aegis_lifeos.db`) en reposo</span>
            </label>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.76rem' }}>
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <TacticalButton variant="neutral" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </TacticalButton>
          <TacticalButton variant="primary" size="sm" type="submit" disabled={isSubmitting} icon={Key}>
            {isSubmitting ? 'Procesando...' : mode === 'setup' ? 'Guardar y Activar' : 'Actualizar'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
