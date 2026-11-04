import { ShieldCheck, ShieldAlert, Key, Lock, Unlock } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function MasterPasswordCard({
  status,
  onOpenSetupModal,
  onOpenChangeModal,
  onOpenDisableModal,
  onLockVault
}) {
  const isEnabled = status?.masterPasswordEnabled;

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isEnabled
                ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${
                isEnabled
                  ? 'color-mix(in srgb, var(--primary) 40%, transparent)'
                  : 'var(--border-color)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isEnabled ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            {isEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', color: 'var(--text-high)' }}>
              Contraseña Maestra & Enclave de Seguridad
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isEnabled
                ? 'El enclave está activo. Los datos confidenciales y la base SQLite están resguardados con AES-256-GCM.'
                : 'Sin protección maestra. La base de datos y credenciales residen en texto plano sin cifrado.'}
            </p>
          </div>
        </div>

        <TacticalBadge variant={isEnabled ? 'success' : 'neutral'} size="sm">
          {isEnabled ? 'PROTECCIÓN ACTIVA' : 'DESACTIVADA'}
        </TacticalBadge>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
        {!isEnabled ? (
          <TacticalButton
            variant="primary"
            size="sm"
            icon={Key}
            onClick={onOpenSetupModal}
          >
            Configurar Contraseña Maestra
          </TacticalButton>
        ) : (
          <>
            <TacticalButton
              variant="outline"
              size="sm"
              icon={Lock}
              onClick={onLockVault}
            >
              Bloquear Cockpit Ahora
            </TacticalButton>
            <TacticalButton
              variant="neutral"
              size="sm"
              icon={Key}
              onClick={onOpenChangeModal}
            >
              Cambiar Contraseña
            </TacticalButton>
            <TacticalButton
              variant="danger"
              size="sm"
              icon={Unlock}
              onClick={onOpenDisableModal}
            >
              Desactivar Protección
            </TacticalButton>
          </>
        )}
      </div>
    </div>
  );
}
