import { 
  Puzzle, 
  Coins, 
  CloudRain, 
  Music, 
  Timer, 
  GitPullRequest, 
  Download, 
  CheckCircle2, 
  Star,
  Gamepad2,
  PiggyBank,
  CheckSquare,
  Activity,
  GitBranch,
  Trash2,
  Shield
} from 'lucide-react';
import TacticalBadge from '../../ui/TacticalBadge';
import TacticalButton from '../../ui/TacticalButton';

const ICON_MAP = {
  Gamepad2,
  PiggyBank,
  CheckSquare,
  Activity,
  GitBranch,
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
            background: isInstalled ? 'var(--primary-glow)' : 'color-mix(in srgb, var(--text-high) 4%, transparent)',
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
          <TacticalButton
            variant="secondary"
            size="sm"
            onClick={() => onToggle(item.id, false)}
            title="Desinstalar módulo y liberar memoria"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={12} style={{ marginRight: '4px' }} />
            Desinstalar
          </TacticalButton>
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

      {/* Footer: Estado + Permisos / Métricas Reales */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.5rem',
        borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
        fontSize: '0.66rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {item.stars > 0 && item.downloads > 0 ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent)' }}>
                <Star size={11} fill="currentColor" /> {item.stars}
              </span>
              <span>•</span>
              <span>{item.downloads} descargas</span>
            </>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <Shield size={11} color="var(--primary)" />
              Módulo Nativo
            </span>
          )}
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
