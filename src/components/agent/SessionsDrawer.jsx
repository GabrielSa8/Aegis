import { useState, useEffect, useRef } from 'react';
import { History, Plus, X } from 'lucide-react';
import SessionCardItem from './SessionCardItem';

export default function SessionsDrawer({
  isOpen,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose,
  activeMessagesCount
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isActive, setIsActive] = useState(false);
  const dockRef = useRef(null);

  // 🌊 Sincronización de montaje y animación fluida con doble rAF (Zero FOUC / 0 Parpadeos)
  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
      document.body.classList.add('aegis-dock-open');
      const animFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true);
        });
      });
      return () => cancelAnimationFrame(animFrame);
    } else {
      setIsActive(false);
      timer = setTimeout(() => {
        setShouldRender(false);
        document.body.classList.remove('aegis-dock-open');
      }, 150);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => () => document.body.classList.remove('aegis-dock-open'), []);

  // 🔒 Gestión de foco, atajos y cierre exterior táctico
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        if (e.target.closest && e.target.closest('[data-historial-toggle]')) {
          return;
        }
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Cero consumo de GPU / memoria cuando el dock no está renderizado
  if (!shouldRender) return null;

  return (
    <aside
      ref={dockRef}
      className={`sessions-drawer-panel ${isActive ? 'is-open' : ''}`}
    >
      {/* Cabecera Minimalista del Dock */}
      <div
        style={{
          padding: '0.55rem 0.8rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'color-mix(in srgb, var(--bg-card, #161a19) 95%, rgba(0, 0, 0, 0.4))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={13} color="var(--primary)" />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-high)',
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-mono)'
            }}
          >
            HISTORIAL
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {sessions.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            className="historial-new-btn"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            style={{
              padding: '3px 9px',
              fontSize: '0.66rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent, var(--primary)) 100%)',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent)',
              outline: 'none'
            }}
            title="Iniciar nuevo chat"
          >
            <Plus size={11} strokeWidth={3} />
            <span>Nuevo</span>
          </button>
          {onClose && (
            <button
              className="historial-close-btn"
              onClick={onClose}
              style={{
                width: '22px',
                height: '22px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: '4px',
                outline: 'none'
              }}
              title="Cerrar (Esc)"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Lista Compacta Dinámica (Crece según sesiones) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Sin historial previo
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = currentSessionId === sess.id;
            const msgCount = isActive && activeMessagesCount ? activeMessagesCount : sess.messageCount || 0;

            return (
              <SessionCardItem
                key={sess.id}
                session={sess}
                isActive={isActive}
                msgCount={msgCount}
                onSelect={(id) => {
                  onSelectSession(id);
                  onClose();
                }}
                onDelete={onDeleteSession}
              />
            );
          })
        )}
      </div>

      {/* Pie Táctico Minimalista */}
      <div
        style={{
          padding: '4px 8px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.58rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}
      >
        <span>Historial SQLite</span>
        <span>
          <kbd className="tactical-kbd" style={{ fontSize: '0.55rem', padding: '1px 4px' }}>Esc</kbd> cerrar
        </span>
      </div>
    </aside>
  );
}
