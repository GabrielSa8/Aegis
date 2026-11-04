import { Send, ShieldCheck, Play, Square, Loader2 } from 'lucide-react';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function GatewayHeaderCard({
  status,
  statusActionLoading,
  onToggleDaemon,
  hasToken
}) {
  const isRunning = status.running;

  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '2.75rem',
          height: '2.75rem',
          borderRadius: 'var(--radius-sm)',
          background: isRunning 
            ? 'color-mix(in srgb, var(--primary) 15%, transparent)' 
            : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
          border: `1px solid ${isRunning ? 'var(--primary)' : 'var(--border-color)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Send 
            size={20} 
            color={isRunning ? 'var(--primary)' : 'var(--text-muted)'} 
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Aegis Remote Gateway (Telegram Daemon)
            </span>
            <TacticalBadge variant={isRunning ? 'primary' : 'muted'}>
              {isRunning ? 'EN LÍNEA (POLLING)' : 'DETENIDO'}
            </TacticalBadge>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Controla tu entorno desde el celular: registra gastos, apunta tareas a Obsidian y consulta estado sin servidores intermedios.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <TacticalButton
          variant={isRunning ? 'danger' : 'primary'}
          onClick={onToggleDaemon}
          disabled={statusActionLoading || (!isRunning && !hasToken)}
          icon={statusActionLoading ? Loader2 : isRunning ? Square : Play}
        >
          {statusActionLoading 
            ? 'Procesando...' 
            : isRunning 
              ? 'Detener Gateway' 
              : 'Iniciar Gateway'}
        </TacticalButton>
      </div>
    </div>
  );
}
