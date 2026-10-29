import React from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileText 
} from 'lucide-react';
import { getFolderFileCount } from './vaultHelpers';

/**
 * VaultTreeNode — Renderizado recursivo y memoizado de carpetas y notas de la Bóveda.
 */
export const VaultTreeNode = React.memo(function VaultTreeNode({
  node,
  depth = 0,
  expandedFolders,
  toggleFolder,
  activeNote,
  loadNote
}) {
  const sortedFolderKeys = Object.keys(node.folders).sort();
  const sortedFiles = [...node.files].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Subcarpetas */}
      {sortedFolderKeys.map((key) => {
        const sub = node.folders[key];
        const isExpanded = expandedFolders.has(sub.path);
        const totalFiles = getFolderFileCount(sub);
        const isTopHub = depth === 0;

        return (
          <div key={sub.path} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Fila de la Carpeta */}
            <div
              onClick={() => toggleFolder(sub.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                paddingLeft: `${depth * 14 + 8}px`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'var(--transition)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span style={{ color: isTopHub ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
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

            {/* Contenido desplegado de la carpeta */}
            {isExpanded && (
              <VaultTreeNode
                node={sub}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                activeNote={activeNote}
                loadNote={loadNote}
              />
            )}
          </div>
        );
      })}

      {/* Archivos en el nivel actual */}
      {sortedFiles.map((note) => {
        const isSelected = activeNote?.path === note.path;
        return (
          <div
            key={note.path}
            onClick={() => loadNote(note)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 8px',
              paddingLeft: `${depth * 14 + 22}px`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              borderLeft: isSelected ? '2px solid #10b981' : '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'transparent';
            }}
          >
            <FileText size={13} color={isSelected ? '#34d399' : 'var(--text-muted)'} />
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? '#34d399' : 'var(--text-high)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {note.title}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export default VaultTreeNode;
