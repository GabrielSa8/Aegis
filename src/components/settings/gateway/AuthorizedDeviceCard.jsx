import { Smartphone, RefreshCw, Unlink, ShieldCheck, ShieldAlert } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function AuthorizedDeviceCard({
  authorizedChatId,
  pairingCode,
  onGenerateNewPin,
  onUnpairChat
}) {
  const isPaired = authorizedChatId !== null && authorizedChatId !== undefined;

  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Smartphone size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Dispositivo Móvil Autorizado (Whitelist)
          </span>
        </div>
        <TacticalBadge variant={isPaired ? 'primary' : 'warning'}>
          {isPaired ? 'DISPOSITIVO VINCULADO' : 'PENDIENTE DE VINCULACIÓN'}
        </TacticalBadge>
      </div>

      {isPaired ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-high)' }}>
                Chat ID Protegido: <span style={{ fontFamily: 'monospace' }}>{authorizedChatId}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Solo los mensajes procedentes de este usuario serán ejecutados en Aegis.
              </div>
            </div>
          </div>

          <TacticalButton
            variant="danger"
            onClick={onUnpairChat}
            icon={Unlink}
          >
            Desvincular
          </TacticalButton>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--warning) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600 }}>
            <ShieldAlert size={16} />
            <span>Instrucciones de Emparejamiento Seguro:</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Abre el chat de tu bot en Telegram desde tu smartphone y envía el siguiente comando:
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '1px'
            }}>
              /pair {pairingCode}
            </div>

            <TacticalButton
              variant="secondary"
              onClick={onGenerateNewPin}
              icon={RefreshCw}
            >
              Nuevo PIN
            </TacticalButton>
          </div>
        </div>
      )}
    </div>
  );
}
