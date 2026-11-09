import { useState } from 'react';
import { Puzzle, Shield, Trash2, ExternalLink } from 'lucide-react';
import TacticalBadge from '../../ui/TacticalBadge';
import TacticalButton from '../../ui/TacticalButton';

export default function CommunityPluginCard({ plugin, onToggle, onUninstall }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { manifest, isEnabled, sizeBytes } = plugin;

  const sizeKb = Math.round(sizeBytes / 1024);

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
      border: isEnabled ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.75rem',
      transition: 'all 0.15s ease'
    }}>
      {/* Header: Icono + Nombre + Versión + Toggle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: isEnabled ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (isEnabled ? 'var(--primary)' : 'var(--border-color)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isEnabled ? 'var(--primary)' : 'var(--text-muted)'
          }}>
            <Puzzle size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {manifest.name}
              </span>
              <TacticalBadge variant="default" size="sm">
                v{manifest.version}
              </TacticalBadge>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              por {manifest.author} • {manifest.category}
            </span>
          </div>
        </div>

        <label className="tactical-switch" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => onToggle(manifest.id, isEnabled)}
          />
        </label>
      </div>

      {/* Descripción */}
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {manifest.description}
      </p>

      {/* Permisos requeridos */}
      {manifest.permissions?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <Shield size={11} color="var(--primary)" style={{ opacity: 0.8 }} />
          {manifest.permissions.map(perm => (
            <span
              key={perm}
              style={{
                fontSize: '0.62rem',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                padding: '1px 5px',
                borderRadius: '3px',
                color: 'var(--text-muted)'
              }}
            >
              {perm}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Peso + Acciones */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.65rem',
        color: 'var(--text-muted)'
      }}>
        <span>Peso: {sizeKb} KB</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {manifest.homeUrl && (
            <a
              href={manifest.homeUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
              title="Ver repositorio / autor"
            >
              <ExternalLink size={11} />
            </a>
          )}

          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => onUninstall(manifest.id)}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                  fontSize: '0.62rem',
                  cursor: 'pointer'
                }}
              >
                ¿Confirmar?
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                  fontSize: '0.62rem',
                  cursor: 'pointer'
                }}
              >
                No
              </button>
            </div>
          ) : (
            <TacticalButton
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              title="Desinstalar plugin comunitario"
              style={{ color: 'var(--danger)', padding: '2px 4px' }}
            >
              <Trash2 size={12} />
            </TacticalButton>
          )}
        </div>
      </div>
    </div>
  );
}
