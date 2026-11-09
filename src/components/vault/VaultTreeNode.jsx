import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  GripVertical, 
  Edit3, 
  Trash2,
  Lock
} from 'lucide-react';
import { getFolderFileCount } from './vaultHelpers';

function VaultItemActions({ onRename, onDelete, renameTitle, deleteTitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
      {onRename && (
        <button
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          title={renameTitle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.7'; }}
        >
          <Edit3 size={11} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title={deleteTitle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.7'; }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

/**
 * VaultTreeNode — Renderizado recursivo y memoizado de carpetas y notas de la Bóveda
 * con soporte para Drag & Drop, renombrado y eliminación contextual.
 */
export const VaultTreeNode = React.memo(function VaultTreeNode({
  node,
  depth = 0,
  expandedFolders,
  toggleFolder,
  activeNote,
  loadNote,
  dragDrop,
  onRenameItem,
  onDeleteItem
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const sortedFolderKeys = Object.keys(node.folders).sort();
  const sortedFiles = [...node.files].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sortedFolderKeys.map((key) => {
        const sub = node.folders[key];
        const isExpanded = expandedFolders.has(sub.path);
        const totalFiles = getFolderFileCount(sub);
        const isTopHub = depth === 0;

        const isOverThis = dragDrop?.dragOverTarget === sub.path;
        const isDropAllowed = isOverThis && dragDrop?.isDropAllowed;
        const isBeingDragged = dragDrop?.draggedItem?.type === 'folder' && dragDrop?.draggedItem?.path === sub.path;
        const isHovered = hoveredItem === sub.path;

        return (
          <div key={sub.path} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              draggable={!isTopHub}
              onDragStart={(e) => {
                if (!isTopHub && dragDrop) {
                  dragDrop.handleDragStart(e, { type: 'folder', path: sub.path, name: sub.name });
                }
              }}
              onDragEnd={dragDrop?.handleDragEnd}
              onDragOver={(e) => {
                if (dragDrop) {
                  dragDrop.handleDragOver(e, sub.path, (p) => {
                    if (!expandedFolders.has(p)) toggleFolder(p);
                  });
                }
              }}
              onDragLeave={(e) => {
                if (dragDrop) dragDrop.handleDragLeave(e, sub.path);
              }}
              onDrop={(e) => {
                if (dragDrop) dragDrop.handleDrop(e, sub.path);
              }}
              onClick={() => toggleFolder(sub.path)}
              onMouseEnter={() => setHoveredItem(sub.path)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                paddingLeft: `${depth * 14 + 8}px`,
                borderRadius: 'var(--radius-md)',
                cursor: !isTopHub ? 'grab' : 'pointer',
                userSelect: 'none',
                transition: 'var(--transition)',
                opacity: isBeingDragged ? 0.35 : 1,
                background: isDropAllowed
                  ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                  : isOverThis
                  ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'transparent',
                outline: isDropAllowed
                  ? '1px dashed var(--primary)'
                  : isOverThis
                  ? '1px dashed var(--danger)'
                  : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                {!isTopHub && (
                  <span style={{ color: 'var(--text-muted)', display: 'flex', opacity: 0.4 }}>
                    <GripVertical size={11} />
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span style={{ color: isTopHub ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                </span>
                <span
                  style={{
                    fontSize: isTopHub ? '0.78rem' : '0.74rem',
                    fontWeight: isTopHub ? 700 : 600,
                    color: isTopHub ? 'var(--text-high)' : 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sub.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {!isTopHub && isHovered && (
                  <VaultItemActions
                    onRename={onRenameItem ? () => onRenameItem({ type: 'folder', path: sub.path, name: sub.name }) : null}
                    onDelete={onDeleteItem ? () => onDeleteItem({ type: 'folder', path: sub.path, name: sub.name }) : null}
                    renameTitle="Renombrar carpeta"
                    deleteTitle="Eliminar carpeta permanentemente"
                  />
                )}
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}
                >
                  {totalFiles}
                </span>
              </div>
            </div>

            {isExpanded && (
              <VaultTreeNode
                node={sub}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                activeNote={activeNote}
                loadNote={loadNote}
                dragDrop={dragDrop}
                onRenameItem={onRenameItem}
                onDeleteItem={onDeleteItem}
              />
            )}
          </div>
        );
      })}

      {sortedFiles.map((note) => {
        const isSelected = activeNote?.path === note.path;
        const isBeingDragged =
          dragDrop?.draggedItem?.type === 'note' &&
          (dragDrop?.draggedItem?.path === note.path ||
            dragDrop?.draggedItem?.relativePath === note.relative_path);
        const isHovered = hoveredItem === note.path;

        return (
          <div
            key={note.path}
            draggable={true}
            onDragStart={(e) => {
              if (dragDrop) {
                dragDrop.handleDragStart(e, {
                  type: 'note',
                  path: note.path,
                  relativePath: note.relative_path,
                  title: note.title
                });
              }
            }}
            onDragEnd={dragDrop?.handleDragEnd}
            onClick={() => loadNote(note)}
            onMouseEnter={() => setHoveredItem(note.path)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 8px',
              paddingLeft: `${depth * 14 + 16}px`,
              borderRadius: 'var(--radius-md)',
              cursor: isBeingDragged ? 'grabbing' : 'grab',
              transition: 'var(--transition)',
              opacity: isBeingDragged ? 0.35 : 1,
              background: isSelected
                ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                : isHovered
                ? 'rgba(255, 255, 255, 0.025)'
                : 'transparent',
              borderLeft: isSelected
                ? '2px solid var(--primary)'
                : '2px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', opacity: 0.35 }}>
                <GripVertical size={11} />
              </span>
              {note.is_encrypted ? (
                <Lock
                  size={12}
                  color={isSelected ? 'var(--primary)' : 'var(--warning, #d97706)'}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <FileText
                  size={13}
                  color={isSelected ? 'var(--primary)' : 'var(--text-muted)'}
                  style={{ flexShrink: 0 }}
                />
              )}
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? 'var(--primary)' : 'var(--text-high)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {note.title}
              </span>
            </div>

            {isHovered && (
              <VaultItemActions
                onRename={onRenameItem ? () => onRenameItem({ type: 'note', path: note.path, relativePath: note.relative_path, title: note.title }) : null}
                onDelete={onDeleteItem ? () => onDeleteItem({ type: 'note', path: note.path, relativePath: note.relative_path, title: note.title }) : null}
                renameTitle="Renombrar nota"
                deleteTitle="Eliminar nota permanentemente"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

export default VaultTreeNode;
