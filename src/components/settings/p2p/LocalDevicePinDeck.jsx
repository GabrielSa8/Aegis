import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function LocalDevicePinDeck({ status, onUpdateName, onGeneratePin }) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '1rem'
    }}>
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

      {/* Panel Derecho: PIN de Emparejamiento */}
      <div style={{
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--primary) 6%, var(--bg-card))',
        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TU PIN DE VINCULACIÓN
          </span>
          <TacticalButton variant="ghost" size="sm" onClick={onGeneratePin} title="Generar nuevo PIN">
            <RefreshCw size={11} style={{ marginRight: '4px' }} />
            Regenerar
          </TacticalButton>
        </div>

        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          letterSpacing: '4px',
          fontFamily: 'monospace',
          color: 'var(--primary)',
          textAlign: 'center',
          margin: '0.25rem 0'
        }}>
          {status?.pairingPin || '------'}
        </div>

        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Ingresa este código en el otro dispositivo para autorizarlo
        </span>
      </div>
    </div>
  );
}
