import { 
  Puzzle, 
  Coins, 
  CloudRain, 
  Music, 
  Timer, 
  GitPullRequest, 
  Download, 
  CheckCircle2, 
  Star 
} from 'lucide-react';
import TacticalBadge from '../../ui/TacticalBadge';
import TacticalButton from '../../ui/TacticalButton';

const ICON_MAP = {
  Coins,
  CloudRain,
  Music,
  Timer,
  GitPullRequest,
  Puzzle
};

export default function CatalogPluginCard({
  item,
  isInstalled,
  isEnabled,
  isInstalling,
  onInstall,
  onToggle
}) {
  const IconComponent = ICON_MAP[item.icon] || Puzzle;

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
      border: isInstalled ? '1px solid color-mix(in srgb, var(--primary) 35%, transparent)' : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.75rem',
      transition: 'all 0.15s ease'
    }}>
      {/* Header: Icono + Título + Versión + Acción */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: isInstalled ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (isInstalled ? 'var(--primary)' : 'var(--border-color)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isInstalled ? 'var(--primary)' : 'var(--text-muted)'
          }}>
            <IconComponent size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
                {item.name}
              </span>
              <TacticalBadge variant="default" size="sm">
                v{item.version}
              </TacticalBadge>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              por {item.author} • {item.category}
            </span>
          </div>
        </div>

        {isInstalled ? (
          <label className="tactical-switch" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => onToggle(item.id, isEnabled)}
            />
            <span className="slider round"></span>
          </label>
        ) : (
          <TacticalButton
            variant="primary"
            size="sm"
            disabled={isInstalling}
            onClick={() => onInstall(item)}
            title="Instalar plugin en 1-clic"
          >
            <Download size={12} style={{ marginRight: '4px' }} />
            {isInstalling ? 'Instalando...' : 'Instalar'}
          </TacticalButton>
        )}
      </div>

      {/* Descripción */}
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {item.description}
      </p>

      {/* Footer: Calificación + Descargas + Estado */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.66rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent)' }}>
            <Star size={11} fill="currentColor" /> {item.stars}
          </span>
          <span>•</span>
          <span>{item.downloads} descargas</span>
        </div>

        {isInstalled && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--primary)', fontWeight: 600 }}>
            <CheckCircle2 size={12} /> Instalado
          </span>
        )}
      </div>
    </div>
  );
}
