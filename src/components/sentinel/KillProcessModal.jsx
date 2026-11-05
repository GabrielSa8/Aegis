import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ModalWrapper } from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function KillProcessModal({
  isOpen,
  target,
  onClose,
  onConfirm
}) {
  if (!target) return null;

  const isSigkill = target.signal === 9;
  const signalName = isSigkill ? 'SIGKILL (-9)' : 'SIGTERM (15)';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isSigkill ? 'Confirmar Forzado SIGKILL' : 'Confirmar Terminación de Proceso'}
      icon={isSigkill ? AlertOctagon : AlertTriangle}
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Banner de Advertencia */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: isSigkill 
            ? 'color-mix(in srgb, var(--danger) 15%, transparent)' 
            : 'color-mix(in srgb, var(--warning) 15%, transparent)',
          border: `1px solid ${isSigkill ? 'color-mix(in srgb, var(--danger) 35%, transparent)' : 'color-mix(in srgb, var(--warning) 35%, transparent)'}`,
          color: isSigkill ? 'var(--danger)' : 'var(--warning)'
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.74rem', lineHeight: '1.35' }}>
            {isSigkill ? (
              <span>
                <strong>¡Atención!</strong> SIGKILL fuerza la interrupción inmediata del proceso sin permitirle guardar datos ni liberar recursos ordenadamente.
              </span>
            ) : (
              <span>
                Se enviará una señal de terminación ordenada (SIGTERM) para permitir que el proceso finalice sus tareas.
              </span>
            )}
          </div>
        </div>

        {/* Ficha Técnica del Proceso */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Proceso:</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
              {target.proc?.name}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PID:</span>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>
              #{target.proc?.pid}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Consumo RAM / CPU:</span>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-high)' }}>
              {target.proc?.memoryMb} MB • {(target.proc?.cpuPercent || 0).toFixed(1)}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Señal a emitir:</span>
            <span style={{
              fontSize: '0.70rem',
              fontWeight: 700,
              color: isSigkill ? 'var(--danger)' : 'var(--primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {signalName}
            </span>
          </div>

          {target.proc?.cmdline && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Línea de comandos:</span>
              <code style={{
                fontSize: '0.64rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                wordBreak: 'break-all',
                maxHeight: '50px',
                overflowY: 'auto'
              }}>
                {target.proc?.cmdline}
              </code>
            </div>
          )}
        </div>

        {/* Acciones del Modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          marginTop: '6px'
        }}>
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </TacticalButton>

          <TacticalButton
            variant={isSigkill ? 'danger' : 'primary'}
            size="sm"
            icon={isSigkill ? AlertOctagon : AlertTriangle}
            onClick={() => onConfirm(target.proc?.pid, target.signal)}
          >
            {isSigkill ? 'Confirmar SIGKILL (-9)' : 'Confirmar Terminación'}
          </TacticalButton>
        </div>
      </div>
    </ModalWrapper>
  );
}
