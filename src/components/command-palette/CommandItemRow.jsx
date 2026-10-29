import React from 'react';
import { CornerDownLeft } from 'lucide-react';

export function CommandItemRow({ item, isSelected, onSelect }) {
  const Icon = item.icon;

  return (
    <div
      onClick={() => item.action()}
      onMouseEnter={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.55rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
        border: isSelected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.1s ease',
        marginBottom: '2px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            color: isSelected ? '#10b981' : 'var(--text-muted)'
          }}
        >
          <Icon size={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.title}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>
            {item.category}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {item.shortcut && (
          <kbd
            style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              padding: '1px 5px',
              borderRadius: '3px'
            }}
          >
            {item.shortcut}
          </kbd>
        )}
        {isSelected && <CornerDownLeft size={12} color="#10b981" />}
      </div>
    </div>
  );
}
