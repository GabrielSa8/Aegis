import { useState } from 'react';
import {
  FolderGit2,
  Server,
  Layout,
  BookOpen,
  Layers,
  Database,
  Cloud,
  SlidersHorizontal,
  Pin,
  PinOff
} from 'lucide-react';

// Mapeo semántico de íconos según identificador y etiquetas de contexto
const getContextIcon = (ctx) => {
  const id = (ctx.id || '').toLowerCase();
  const label = (ctx.label || '').toLowerCase();
  if (id.includes('back') || label.includes('api') || label.includes('back')) return Server;
  if (id.includes('front') || label.includes('ui') || label.includes('ux')) return Layout;
  if (id.includes('research') || id.includes('estudio') || label.includes('investig') || label.includes('estudio')) return BookOpen;
  if (id.includes('data') || label.includes('base') || label.includes('sql')) return Database;
  if (id.includes('devops') || label.includes('cloud') || label.includes('infra')) return Cloud;
  if (id.includes('general') || label.includes('bóveda') || label.includes('vault')) return FolderGit2;
  return Layers;
};

export default function RightContextsDock({
  contexts = [],
  selectedContextId,
  onSelectContext,
  onOpenContextModal,
  isPinned: externalIsPinned,
  onTogglePin: externalOnTogglePin
}) {
  const [localPinned, setLocalPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_right_dock_pinned') === 'true';
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
          localStorage.setItem('aegis_right_dock_pinned', String(next));
        } catch {}
        return next;
      });
    }
  };

  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered;

  // Dimensiones y traslación táctica hacia el borde derecho
  // Desanclado: retraído al borde derecho (peek de 5px) -> Salto elástico hacia la izquierda en hover
  // Fijado: Visible permanente a 54px (puros logos) -> Salto elástico de expansión hacia la izquierda
  const dockWidth = isExpanded ? '204px' : (isPinned ? '54px' : '204px');
  const triggerWidth = isExpanded ? '204px' : (isPinned ? '54px' : '14px');

  const dockTransform = !isPinned && !isHovered
    ? 'translateX(calc(100% - 5px)) scale(0.96)'
    : 'translateX(0) scale(1)';

  return (
    <div
      className="right-dock-trigger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 90,
        width: triggerWidth,
        pointerEvents: 'auto',
        display: 'flex',
        justifyContent: 'flex-end',
        transition: isHovered
          ? 'width 0.32s cubic-bezier(0.34, 1.4, 0.64, 1)'
          : 'width 0.22s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      <aside
        aria-label="Selector de contextos de IA"
        className={`right-dock-capsule ${isPinned ? 'is-pinned' : ''}`}
        style={{
          width: dockWidth,
          transform: dockTransform,
          transformOrigin: 'center right',
          marginLeft: 'auto',
          flexShrink: 0,
          borderRadius: '18px 0 0 18px',
          border: '1px solid var(--border-color)',
          borderRight: 'none',
          background: 'color-mix(in srgb, var(--bg-card) 96%, black)',
          boxShadow: isHovered
            ? '-8px 0 36px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 0 20px color-mix(in srgb, var(--accent) 20%, transparent)'
            : (isPinned ? '-4px 0 20px rgba(0, 0, 0, 0.45)' : '-2px 0 12px rgba(0, 0, 0, 0.3)'),
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
        {/* 📌 Pin Toggle & Actions Micro-Header */}
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
              Contextos
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        </div>

        {/* 📁 Lista de Perfiles de Contexto */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          maxHeight: '352px',
          overflowY: 'auto'
        }}>
          {contexts.map((ctx, idx) => {
            const Icon = getContextIcon(ctx);
            const isActive = ctx.id === selectedContextId;
            const stepRatio = idx / Math.max(contexts.length - 1, 1);

            // Recorrido al 100% del espectro dinámico entre acento y primario
            const accentPct = Math.round((1 - stepRatio) * 100);
            const primaryPct = 100 - accentPct;
            const stepColor = `color-mix(in srgb, var(--accent) ${accentPct}%, var(--primary) ${primaryPct}%)`;
            const stepBg = isActive
              ? `color-mix(in srgb, ${stepColor} 24%, var(--bg-card))`
              : `color-mix(in srgb, ${stepColor} 8%, var(--bg-card))`;

            const isLast = idx === contexts.length - 1;

            return (
              <button
                key={ctx.id}
                onClick={() => onSelectContext(ctx.id)}
                title={`${ctx.label} (${ctx.effort === 'high' ? 'Modo Profundo' : 'Modo Flash'})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  height: '44px',
                  padding: isExpanded ? '0 12px 0 12px' : '0',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  background: stepBg,
                  border: 'none',
                  borderRight: isActive
                    ? `4px solid ${stepColor}`
                    : `3.5px solid color-mix(in srgb, ${stepColor} 45%, transparent)`,
                  boxShadow: isActive ? `-3px 0 12px color-mix(in srgb, ${stepColor} 35%, transparent)` : 'none',
                  borderBottom: isLast ? 'none' : '1px solid rgba(0, 0, 0, 0.35)',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease, border-right 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `color-mix(in srgb, ${stepColor} 18%, var(--bg-card))`;
                    e.currentTarget.style.color = 'var(--text-high)';
                    e.currentTarget.style.borderRight = `4px solid ${stepColor}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = stepBg;
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderRight = `3.5px solid color-mix(in srgb, ${stepColor} 45%, transparent)`;
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
                    color={isActive ? stepColor : `color-mix(in srgb, ${stepColor} 85%, var(--text-muted))`}
                  />
                </div>

                {isExpanded && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0,
                    gap: '8px',
                    justifyContent: 'space-between'
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
                      {ctx.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.55rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: isActive 
                          ? `color-mix(in srgb, ${stepColor} 30%, transparent)` 
                          : `color-mix(in srgb, ${stepColor} 14%, rgba(0, 0, 0, 0.35))`,
                        color: isActive ? 'var(--text-high)' : stepColor,
                        border: `1px solid color-mix(in srgb, ${stepColor} 35%, transparent)`
                      }}>
                        {ctx.skills?.length || 0}sk
                      </span>
                      <span style={{ fontSize: '0.6rem', opacity: isActive ? 1 : 0.7 }}>
                        {ctx.effort === 'high' ? '🧠' : '⚡'}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* ⚙️ Footer: Botón de Administración de Contextos */}
        <button
          onClick={onOpenContextModal}
          title="Administrar y crear perfiles de contexto"
          style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isExpanded ? '6px' : '0',
            border: 'none',
            borderTop: '1px solid rgba(0, 0, 0, 0.35)',
            background: 'rgba(0, 0, 0, 0.25)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: isExpanded ? '0 10px' : '0',
            transition: 'color 0.15s ease, background 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-high)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)';
          }}
        >
          <SlidersHorizontal size={13} />
          {isExpanded && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em'
            }}>
              Gestionar
            </span>
          )}
        </button>
      </aside>
    </div>
  );
}
