import { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function LocalDevicePinDeck({ status, onUpdateName, onGeneratePin }) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [remainingSecs, setRemainingSecs] = useState(status?.pinRemainingSecs ?? 600);

  useEffect(() => {
    if (status?.pairingPinExpiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, status.pairingPinExpiresAt - now);
      setRemainingSecs(diff);
    } else if (status?.pinRemainingSecs !== undefined) {
      setRemainingSecs(status.pinRemainingSecs);
    }
  }, [status?.pairingPinExpiresAt, status?.pinRemainingSecs, status?.pairingPin]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartEditName = () => {
    setNameValue(status?.deviceName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (nameValue.trim()) {
      await onUpdateName(nameValue.trim());
    }
    setEditingName(false);
  };

  const isExpired = remainingSecs <= 0;
  const isUrgent = remainingSecs > 0 && remainingSecs <= 120;
  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;
  const timerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, (remainingSecs / 600) * 100));

  return (
    <div
      className="settings-2col-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '1rem'
      }}
    >
      {/* Panel Izquierdo: Datos de este equipo */}
      <div style={{
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            ESTE DISPOSITIVO
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--primary)' }}>
            IP LAN: <code style={{ color: 'var(--text-high)' }}>{status?.localIp || '127.0.0.1'}</code>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {editingName ? (
            <input
              type="text"
              value={nameValue}
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--primary)',
                color: 'var(--text-high)',
                fontSize: '0.82rem'
              }}
            />
          ) : (
            <div
              onClick={handleStartEditName}
              title="Clic para renombrar dispositivo"
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-high)',
                cursor: 'pointer',
                borderBottom: '1px dashed var(--border-color)'
              }}
            >
              {status?.deviceName || 'Dispositivo Aegis'}
            </div>
          )}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            (ID: {status?.deviceId?.slice(0, 16)}...)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <span>Broadcast: <code style={{ color: 'var(--text-high)' }}>UDP {status?.discoveryPort || 53317}</code></span>
          <span>•</span>
          <span>Sync Port: <code style={{ color: 'var(--text-high)' }}>TCP {status?.syncPort || 53318}</code></span>
        </div>
      </div>

      {/* Panel Derecho: PIN de Emparejamiento con TTL */}
      <div style={{
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        background: isExpired
          ? 'color-mix(in srgb, var(--danger) 6%, var(--bg-card))'
          : 'color-mix(in srgb, var(--primary) 6%, var(--bg-card))',
        border: '1px solid ' + (isExpired
          ? 'color-mix(in srgb, var(--danger) 30%, transparent)'
          : 'color-mix(in srgb, var(--primary) 30%, transparent)'),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              PIN DE VINCULACIÓN
            </span>
            {isExpired ? (
              <TacticalBadge variant="danger" size="sm">
                CADUCADO
              </TacticalBadge>
            ) : isUrgent ? (
              <TacticalBadge variant="warning" size="sm">
                EXPIRA PRONTO
              </TacticalBadge>
            ) : (
              <TacticalBadge variant="success" size="sm">
                ACTIVO
              </TacticalBadge>
            )}
          </div>
          <TacticalButton variant="ghost" size="sm" onClick={onGeneratePin} title="Generar nuevo PIN con 10 min de validez">
            <RefreshCw size={11} style={{ marginRight: '4px' }} />
            Regenerar
          </TacticalButton>
        </div>

        <div style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          letterSpacing: '5px',
          fontFamily: 'monospace',
          color: isExpired ? 'var(--text-muted)' : 'var(--primary)',
          textDecoration: isExpired ? 'line-through' : 'none',
          textAlign: 'center',
          margin: '0.15rem 0',
          opacity: isExpired ? 0.45 : 1
        }}>
          {status?.pairingPin || '------'}
        </div>

        {/* Barra de progreso de caducidad */}
        <div style={{
          width: '100%',
          height: '3px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: isExpired
              ? 'var(--danger)'
              : isUrgent
              ? 'var(--warning)'
              : 'var(--primary)',
            transition: 'width 1s linear'
          }} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.64rem',
          color: isExpired ? 'var(--danger)' : 'var(--text-muted)'
        }}>
          <span>{isExpired ? 'PIN caducado por seguridad.' : 'Válido para autorizar un dispositivo'}</span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 700,
            color: isExpired ? 'var(--danger)' : isUrgent ? 'var(--warning)' : 'var(--text-high)'
          }}>
            {isExpired ? <AlertTriangle size={11} /> : <Clock size={11} />}
            {isExpired ? '00:00' : timerText}
          </span>
        </div>
      </div>
    </div>
  );
}
