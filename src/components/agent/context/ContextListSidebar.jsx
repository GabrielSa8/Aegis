import React from 'react';
import { Plus, Trash2, Folder } from 'lucide-react';
import { TacticalButton } from '../../ui';

export function ContextListSidebar({
  editingList,
  selectedId,
  onSelectId,
  onAddNew,
  onDelete
}) {
  return (
    <div
      style={{
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem',
        minWidth: '220px',
        maxWidth: '240px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
          Perfiles ({editingList.length})
        </span>
        <TacticalButton
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={onAddNew}
        >
          Añadir
        </TacticalButton>
      </div>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {editingList.map((ctx) => {
          const isSelected = ctx.id === selectedId;
          return (
            <div
              key={ctx.id}
              onClick={() => onSelectId(ctx.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Folder size={14} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {ctx.label}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {ctx.effort === 'high' ? '🧠 Profundo' : ctx.effort === 'low' ? '⚡ Flash' : '🛡️ Auto'}
                  </span>
                </div>
              </div>

              {editingList.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(ctx.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Eliminar perfil"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
