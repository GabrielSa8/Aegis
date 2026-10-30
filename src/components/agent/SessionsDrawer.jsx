import { MessageSquare, Plus, Trash2, X } from 'lucide-react';

export default function SessionsDrawer({
  isOpen,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      width: '240px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      zIndex: 10,
      paddingTop: '3.25rem'
    }}>
      {/* Header del Drawer */}
      <div style={{
        padding: '0.55rem 0.75rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>Sesiones</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({sessions.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onNewSession}
            style={{
              padding: '3px 8px',
              fontSize: '0.66rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--primary)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
            title="Iniciar nueva sesión táctica"
          >
            <Plus size={11} />
            <span>Nueva</span>
          </button>
          {onClose && (
            <button
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
                borderRadius: '4px'
              }}
              title="Cerrar panel de sesiones"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-high)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de sesiones */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Sin sesiones
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = currentSessionId === sess.id;
            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess.id)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'rgba(0, 0, 0, 0.15)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-high)' : 'var(--text-normal)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {sess.title}
                  </span>
                  <button
                    onClick={(e) => onDeleteSession(sess.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.6
                    }}
                    title="Eliminar sesión"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <span style={{ textTransform: 'uppercase', opacity: 0.8 }}>
                    {sess.contextId} · {sess.effort === 'high' ? 'Profundo' : 'Flash'}
                  </span>
                  <span>
                    {new Date(sess.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
