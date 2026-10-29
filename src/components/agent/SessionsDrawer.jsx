import { MessageSquare, Plus, Trash2 } from 'lucide-react';

export default function SessionsDrawer({
  isOpen,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      width: '240px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {/* Header del Drawer */}
      <div style={{
        padding: '0.45rem 0.65rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>Sesiones</span>
        </div>
        <button
          onClick={onNewSession}
          className="btn btn-primary"
          style={{ padding: '2px 7px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}
          title="Iniciar nueva sesión táctica"
        >
          <Plus size={11} />
          <span>Nueva</span>
        </button>
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
