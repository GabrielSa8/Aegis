import { Laptop, RefreshCw, KeyRound, CheckCircle2, Trash2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function PeerDeviceCard({
  peer,
  isPaired,
  isSyncing,
  lastSyncedAt,
  onPair,
  onSync,
  onUnpair
}) {
  return (
    <div
      className="settings-card-header-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
        border: isPaired ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid var(--border-color)',
        gap: '1rem',
        flexWrap: 'wrap',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: isPaired ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.04)',
          border: '1px solid ' + (isPaired ? 'var(--primary)' : 'var(--border-color)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPaired ? 'var(--primary)' : 'var(--text-muted)'
        }}>
          <Laptop size={18} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
              {peer.name || 'Dispositivo Remoto'}
            </span>
            {isPaired ? (
              <TacticalBadge variant="success" size="sm">
                <CheckCircle2 size={10} style={{ marginRight: '3px' }} />
                Emparejado
              </TacticalBadge>
            ) : (
              <TacticalBadge variant="warning" size="sm">
                LAN Detectado
              </TacticalBadge>
            )}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              v{peer.version || '2.8.x'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>IP: <code style={{ color: 'var(--text-high)' }}>{peer.ip}:{peer.syncPort || 53318}</code></span>
            <span>•</span>
            <span>Hace {peer.lastSeenSecsAgo ?? 0}s</span>
            {lastSyncedAt && (
              <>
                <span>•</span>
                <span style={{ color: 'var(--primary)' }}>Último sync: {lastSyncedAt}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isPaired ? (
          <>
            <TacticalButton
              variant="primary"
              size="sm"
              disabled={isSyncing}
              onClick={() => onSync(peer.ip, peer.syncPort || 53318)}
              title="Ejecutar replicación bidireccional inmediata"
            >
              <RefreshCw
                size={12}
                style={{
                  marginRight: '5px',
                  animation: isSyncing ? 'spin 1s linear infinite' : 'none'
                }}
              />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </TacticalButton>

            {onUnpair && (
              <TacticalButton
                variant="ghost"
                size="sm"
                onClick={() => onUnpair(peer.id)}
                title="Desvincular par de confianza"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={12} />
              </TacticalButton>
            )}
          </>
        ) : (
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={() => onPair(peer)}
            title="Ingresar PIN de emparejamiento para autorizar este equipo"
          >
            <KeyRound size={12} style={{ marginRight: '5px' }} />
            Emparejar con PIN
          </TacticalButton>
        )}
      </div>
    </div>
  );
}
