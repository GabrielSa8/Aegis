import { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function PairModal({ peer, isOpen, onClose, onConfirmPair }) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !peer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.trim().length < 4) {
      setErrorMsg('Ingresa un PIN válido (al menos 4-6 dígitos).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    const res = await onConfirmPair(peer.ip, peer.syncPort || 53318, pin.trim());
    setSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'PIN incorrecto o dispositivo remoto no responde.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Emparejar Dispositivo LAN"
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          Introduce el <strong style={{ color: 'var(--text-high)' }}>PIN de 6 dígitos</strong> que muestra la pantalla de Aegis en{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{peer.name || peer.ip}</span>:
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            PIN DE SEGURIDAD (6 DÍGITOS)
          </label>
          <div style={{ position: 'relative' }}>
            <KeyRound size={16} color="var(--primary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              maxLength={8}
              autoFocus
              placeholder="Código de 6 dígitos"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '1.1rem',
                letterSpacing: '3px',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--danger)',
            fontSize: '0.72rem',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <ShieldAlert size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <TacticalButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </TacticalButton>
          <TacticalButton type="submit" variant="primary" disabled={submitting || pin.length < 4}>
            <CheckCircle size={14} style={{ marginRight: '5px' }} />
            {submitting ? 'Verificando...' : 'Autorizar y Vincular'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
