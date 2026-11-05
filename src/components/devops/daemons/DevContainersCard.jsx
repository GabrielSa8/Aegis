import React from 'react';
import { Box, Play, Square, Plus, Terminal, Trash2, Layers } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * DevContainersCard — Monitor y control integral de contenedores locales (Podman / Docker).
 * Soporta presets de despliegue rápido, logs, arranque, parada y eliminación.
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
      padding: '0.75rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.55rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Contenedores ({containers.length})
          </span>
          <span style={{
            fontSize: '0.6rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--primary)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
          }}>
            {runtime ? runtime.toUpperCase() : 'PODMAN'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: activeCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
              {activeCount}
            </strong> activos
          </span>

          <TacticalButton
            variant="secondary"
            size="xs"
            icon={<Plus size={10} />}
            onClick={onOpenCreate}
            style={{
              fontSize: '0.62rem',
              padding: '2px 7px',
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
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px',
          background: 'color-mix(in srgb, var(--border-color) 10%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
              Sin contenedores en {runtime?.toUpperCase() || 'Podman'}. Presets recomendados:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { name: 'Redis', tag: 'redis_dev' },
              { name: 'Postgres', tag: 'postgres_dev' },
              { name: 'MongoDB', tag: 'mongodb_local' },
              { name: 'Nginx', tag: 'nginx_test' }
            ].map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={onOpenCreate}
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                  color: 'var(--primary)',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Layers size={9} />
                <span>+ {preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
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
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isRunning ? 'var(--primary)' : 'var(--text-muted)'
                    }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-high)' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      ({c.id})
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {c.image} {c.ports ? `• ${c.ports}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                  {isRunning ? (
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      icon={<Square size={9} />}
                      onClick={() => onToggleContainer(c.id, 'stop')}
                      disabled={isActionLoading}
                      style={{ fontSize: '0.6rem', padding: '1px 5px' }}
                    >
                      Detener
                    </TacticalButton>
                  ) : (
                    <TacticalButton
                      variant="secondary"
                      size="xs"
                      icon={<Play size={9} />}
                      onClick={() => onToggleContainer(c.id, 'start')}
                      disabled={isActionLoading}
                      style={{ fontSize: '0.6rem', padding: '1px 5px', color: 'var(--primary)' }}
                    >
                      Iniciar
                    </TacticalButton>
                  )}

                  <TacticalButton
                    variant="ghost"
                    size="xs"
                    icon={<Terminal size={10} />}
                    onClick={() => onViewLogs(c)}
                    title="Ver logs en vivo"
                    style={{ padding: '2px 5px' }}
                  />

                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={isActionLoading}
                    className="devops-icon-action-btn danger"
                    title="Eliminar contenedor"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
