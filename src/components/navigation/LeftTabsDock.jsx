import { useState } from 'react';
import { 
  Bot, 
  PiggyBank, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2, 
  Settings,
  Pin,
  PinOff
} from 'lucide-react';

const TABS = [
  { id: 'agent', label: 'Agente', icon: Bot, shortcut: '1' },
  { id: 'finances', label: 'Finanzas', icon: PiggyBank, shortcut: '2' },
  { id: 'vault', label: 'Bóveda', icon: BookOpen, shortcut: '3' },
  { id: 'devops', label: 'DevOps', icon: GitBranch, shortcut: '4' },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare, shortcut: '5' },
  { id: 'sentinel', label: 'Centinela', icon: Activity, shortcut: '6' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, shortcut: '7' },
  { id: 'settings', label: 'Sistema', icon: Settings, shortcut: '8' }
];

export default function LeftTabsDock({ 
  activeTab, 
  onSelectTab, 
  isPinned: externalIsPinned, 
  onTogglePin: externalOnTogglePin 
}) {
  const [localPinned, setLocalPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_dock_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const isPinned = externalIsPinned !== undefined ? externalIsPinned : localPinned;

  const togglePin = () => {
    if (externalOnTogglePin) {
      externalOnTogglePin();
    } else {
      setLocalPinned((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('aegis_dock_pinned', String(next));
        } catch {}
        return next;
      });
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  // Expansión de textos y shortcuts activa únicamente en hover
  const isExpanded = isHovered;

  // Dinámica de dimensiones y traslación táctica
  // Desanclado: retraído al borde (peek de 5px) -> Salto elástico con spring bounce en hover
  // Fijado: Visible permanente a 54px (puros logos) -> Salto elástico de expansión en hover
  const dockWidth = isExpanded ? '176px' : (isPinned ? '54px' : '176px');
  const triggerWidth = isExpanded ? '176px' : (isPinned ? '54px' : '14px');
  
  const dockTransform = !isPinned && !isHovered
    ? 'translateX(calc(-100% + 5px)) scale(0.96)'
    : 'translateX(0) scale(1)';

  return (
    <div
      className="left-dock-trigger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 90,
        width: triggerWidth,
        pointerEvents: 'auto',
        transition: 'width 0.25s ease'
      }}
    >
      <aside
        aria-label="Navegación de pestañas de Aegis"
        className={`left-dock-capsule ${isPinned ? 'is-pinned' : ''}`}
        style={{
          width: dockWidth,
          transform: dockTransform,
          transformOrigin: 'center left',
          borderRadius: '0 18px 18px 0',
          border: '1px solid var(--border-color)',
          borderLeft: 'none',
          background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
          backdropFilter: 'blur(20px)',
          boxShadow: isHovered 
            ? '8px 0 36px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 0 20px color-mix(in srgb, var(--primary) 20%, transparent)' 
            : (isPinned ? '4px 0 20px rgba(0, 0, 0, 0.45)' : '2px 0 12px rgba(0, 0, 0, 0.3)'),
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          overflow: 'hidden',
          transition: isHovered
            ? 'transform 0.36s cubic-bezier(0.34, 1.48, 0.64, 1), width 0.32s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.25s ease, opacity 0.2s ease'
            : 'transform 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.22s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s ease, opacity 0.2s ease',
          opacity: (!isPinned && !isHovered) ? 0.6 : 1
        }}
      >
        {/* 📌 Pin Toggle Micro-Header */}
        <div style={{
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          padding: isExpanded ? '0 10px 0 12px' : '0',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.4)'
        }}>
          {isExpanded && (
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              Vistas
            </span>
          )}

          <button
            onClick={togglePin}
            title={isPinned ? 'Desanclar dock (ocultamiento automático)' : 'Fijar dock (modo puros logos)'}
            style={{
              background: 'transparent',
              border: 'none',
              color: isPinned ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-high)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isPinned ? 'var(--primary)' : 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
          </button>
        </div>

        {/* 🪜 Escalones Secuenciales en Gradiente del Tema */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0
        }}>
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const stepRatio = idx / (TABS.length - 1);
            
            const stepColor = `color-mix(in srgb, var(--primary) ${Math.round(100 - stepRatio * 60)}%, var(--accent) ${Math.round(stepRatio * 60)}%)`;
            const stepBg = isActive 
              ? `color-mix(in srgb, ${stepColor} 22%, var(--bg-card))` 
              : `color-mix(in srgb, ${stepColor} 4%, transparent)`;

            const isLast = idx === TABS.length - 1;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={`${tab.label} (Alt + ${tab.shortcut})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  height: '44px',
                  padding: isExpanded ? '0 12px 0 12px' : '0',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  background: stepBg,
                  border: 'none',
                  borderLeft: isActive 
                    ? `4px solid ${stepColor}` 
                    : `4px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
                  borderBottom: isLast ? 'none' : '1px solid rgba(0, 0, 0, 0.35)',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease, border-left 0.15s ease',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `color-mix(in srgb, ${stepColor} 14%, var(--bg-card))`;
                    e.currentTarget.style.color = 'var(--text-high)';
                    e.currentTarget.style.borderLeft = `4px solid ${stepColor}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = stepBg;
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderLeft = `4px solid color-mix(in srgb, ${stepColor} 30%, transparent)`;
                  }
                }}
              >
                <div style={{
                  width: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon 
                    size={18} 
                    color={isActive ? stepColor : `color-mix(in srgb, ${stepColor} 70%, var(--text-muted))`} 
                  />
                </div>

                {isExpanded && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0,
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.01em',
                      flex: 1,
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {tab.label}
                    </span>

                    <span style={{
                      fontSize: '0.58rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.28)',
                      color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                      opacity: isActive ? 1 : 0.65,
                      flexShrink: 0
                    }}>
                      {tab.shortcut}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}