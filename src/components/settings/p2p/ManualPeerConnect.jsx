import { useState } from 'react';
import { Link2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';

export default function ManualPeerConnect({ defaultPort, onConnect }) {
  const [manualIp, setManualIp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleConnect = () => {
    const cleanIp = manualIp.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) {
      setErrorMsg('IP no válida (formato: 192.168.1.X)');
      return;
    }
    setErrorMsg('');
    onConnect({
      id: `manual-${cleanIp}`,
      name: `Dispositivo ${cleanIp}`,
      ip: cleanIp,
      syncPort: defaultPort || 53318,
      version: 'direct'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Link2 size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Conectar por IP directa:
          </span>
        </div>
        <input
          type="text"
          placeholder="Ej. 192.168.1.71"
          value={manualIp}
          onChange={(e) => {
            setManualIp(e.target.value);
            setErrorMsg('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && manualIp.trim()) {
              handleConnect();
            }
          }}
          style={{
            flex: 1,
            minWidth: '130px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: '0.72rem',
            color: 'var(--text-high)'
          }}
        />
        <TacticalButton
          variant="primary"
          size="sm"
          disabled={!manualIp.trim()}
          onClick={handleConnect}
        >
          Emparejar
        </TacticalButton>
      </div>
      {errorMsg && (
        <span style={{ fontSize: '0.68rem', color: 'var(--danger)', paddingLeft: '4px' }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
