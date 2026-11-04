import { useState } from 'react';
import { AlertTriangle, Unlock } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function DisablePasswordModal({ isOpen, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setError(null);

    const res = await onConfirm(password);
    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Contraseña incorrecta');
    }
    setIsSubmitting(false);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Desactivar Protección Maestra"
      icon={AlertTriangle}
      maxWidth="440px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Al desactivar la Contraseña Maestra, las credenciales y la base de datos se restaurarán en texto plano.
          Ingresa tu contraseña actual para confirmar:
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Contraseña Actual
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña actual..."
            required
            autoFocus
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
          <TacticalButton variant="danger" size="sm" type="submit" disabled={isSubmitting || !password} icon={Unlock}>
            {isSubmitting ? 'Descifrando...' : 'Desactivar y Descifrar'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
