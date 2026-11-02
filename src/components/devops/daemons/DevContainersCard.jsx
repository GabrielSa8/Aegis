import React from 'react';
import { Box, Play, Square, RefreshCw, Plus, Terminal, Trash2 } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * DevContainersCard — Monitor y control integral de contenedores locales (Podman / Docker).
 * Soporta arranque, detención, reinicio, lectura de logs y eliminación.
 */
export function DevContainersCard({
  containers = [],
  runtime,
  onToggleContainer,
  onOpenCreate,
  onViewLogs,
  onDeleteContainer,
  actionLoadingId
}) {
  const activeCount = containers.filter(c => c.state === 'running').length;

  const handleDelete = (c) => {
    if (window.confirm(`¿Eliminar contenedor '${c.name}' (${c.id})?`)) {
      onDeleteContainer(c.id, true);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Contenedores ({containers.length})
          </span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--primary)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
          }}>
            {runtime ? runtime.toUpperCase() : 'NO DETECTADO'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: activeCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
              {activeCount}
            </strong> activos
          </span>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Plus size={11} />}
            onClick={onOpenCreate}
            style={{
              fontSize: '0.65rem',
              padding: '2px 8px',
              color: 'var(--primary)',
              borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
              fontWeight: 700
            }}
          >
            + Crear
          </TacticalButton>
        </div>
      </div>

      {containers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          No se encontraron contenedores configurados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {containers.map((c) => {
            const isRunning = c.state === 'running';
            const isActionLoading = actionLoadingId?.startsWith(`container-${c.id}`);

            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.72rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isRunning ? 'var(--primary)' : 'var(--text-muted)'
                    }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      ({c.id})
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {c.image} {c.ports ? `• ${c.ports}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  {isRunning ? (
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      icon={<Square size={10} />}
                      onClick={() => onToggleContainer(c.id, 'stop')}
                      disabled={isActionLoading}
                      style={{ fontSize: '0.62rem', padding: '2px 6px' }}
                    >
                      Detener
                    </TacticalButton>
                  ) : (
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      icon={<Play size={10} />}
                      onClick={() => onToggleContainer(c.id, 'start')}
                      disabled={isActionLoading}
                      style={{
                        fontSize: '0.62rem',
                        padding: '2px 6px',
                        color: 'var(--primary)',
                        borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)'
                      }}
                    >
                      Iniciar
                    </TacticalButton>
                  )}

                  <TacticalButton
                    variant="ghost"
                    size="xs"
                    icon={<Terminal size={10} />}
                    onClick={() => onViewLogs(c)}
                    title="Ver logs"
                    style={{ padding: '3px' }}
                  />

                  <TacticalButton
                    variant="ghost"
                    size="xs"
                    icon={<RefreshCw size={10} className={isActionLoading ? 'animate-spin' : ''} />}
                    onClick={() => onToggleContainer(c.id, 'restart')}
                    disabled={isActionLoading}
                    title="Reiniciar contenedor"
                    style={{ padding: '3px' }}
                  />

                  <TacticalButton
                    variant="danger"
                    size="xs"
                    icon={<Trash2 size={10} />}
                    onClick={() => handleDelete(c)}
                    disabled={isActionLoading}
                    title="Eliminar contenedor"
                    style={{ padding: '3px' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
