import { useState, memo } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import { formatRelativeTime } from './agentHelpers';

function SessionCardItem({
  session: sess,
  isActive,
  msgCount,
  onSelect,
  onDelete
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (isConfirming) {
      onDelete(sess.id, e);
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsConfirming(false);
  };
  return (
    <div
      onClick={() => onSelect(sess.id)}
      style={{
        padding: '6px 10px',
        borderRadius: '8px',
        background: isActive
          ? 'color-mix(in srgb, var(--primary) 12%, rgba(255, 255, 255, 0.03))'
          : 'rgba(255, 255, 255, 0.02)',
        border: isActive
          ? '1px solid color-mix(in srgb, var(--primary) 40%, var(--border-color))'
          : '1px solid rgba(255, 255, 255, 0.04)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        transition: 'background-color 0.15s ease, border-color 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 6%, rgba(255, 255, 255, 0.04))';
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 25%, transparent)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
        }
        setIsConfirming(false);
      }}
    >
      {/* Indicador de Estado Activo + Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.18)',
            boxShadow: isActive ? '0 0 8px var(--primary)' : 'none',
            flexShrink: 0
          }}
        />
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--text-high)' : 'var(--text-normal)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'inherit'
          }}
          title={sess.title}
        >
          {sess.title}
        </span>
      </div>

      {/* Micro-Chips Tácticos y Acciones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}
      >
        <span
          style={{
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            textTransform: 'uppercase',
            fontSize: '0.56rem'
          }}
        >
          {sess.contextId || 'general'}
        </span>

        <span
          style={{
            padding: '1px 4px',
            borderRadius: '4px',
            background:
              sess.effort === 'high'
                ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                : 'rgba(255, 255, 255, 0.03)',
            color: sess.effort === 'high' ? 'var(--primary)' : 'var(--text-muted)',
            border: `1px solid ${
              sess.effort === 'high'
                ? 'color-mix(in srgb, var(--primary) 30%, transparent)'
                : 'var(--border-color)'
            }`,
            fontSize: '0.56rem'
          }}
        >
          {sess.effort === 'high' ? '🧠' : '⚡'}
        </span>

        {msgCount > 0 && <span style={{ opacity: 0.75 }}>💬 {msgCount}</span>}

        <span style={{ opacity: 0.85, minWidth: '42px', textAlign: 'right' }}>
          {formatRelativeTime(sess.updatedAt)}
        </span>

        {isConfirming ? (
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDeleteClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.22)',
                border: '1px solid var(--danger, #ef4444)',
                color: 'var(--danger, #ef4444)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              title="Confirmar eliminación permanente"
            >
              <Check size={10} strokeWidth={2.5} />
              <span>¿Borrar?</span>
            </button>
            <button
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                padding: 0,
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                outline: 'none'
              }}
              title="Cancelar"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
              opacity: 0.45,
              transition: 'var(--transition)'
            }}
            title="Eliminar sesión"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger, #ef4444)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.opacity = '0.45';
            }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(SessionCardItem);
