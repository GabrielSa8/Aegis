import React, { useState } from 'react';
import { Maximize2, Minimize2, Plus, AlertCircle } from 'lucide-react';
import { TaskCard } from './TaskCard';

export function SwimlaneColumn({
  title,
  statusKey,
  tasks = [],
  onToggleTask,
  onSetStatus,
  onSelectTask,
  accentColor,
  headerBg,
  isExpanded,
  onToggleExpand,
  emptyMessage,
  columnHeight,
  wipLimit,
  onAddTask,
  filePath
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const isWipExceeded = wipLimit && tasks.length > wipLimit;

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const item = JSON.parse(raw);
        if (item && onSetStatus) {
          onSetStatus(item, statusKey);
        }
      }
    } catch (_) {}
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newText.trim() || !onAddTask || !filePath) return;
    await onAddTask(filePath, newText.trim());
    setNewText('');
    setIsAdding(false);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: isDragOver
          ? 'color-mix(in srgb, var(--primary) 12%, var(--bg-card))'
          : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: isDragOver
          ? '1.5px dashed var(--primary)'
          : `1px solid ${accentColor || 'var(--border-color)'}`,
        borderRadius: '5px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Cabecera de Columna */}
      <div
        style={{
          padding: '5px 8px',
          background: headerBg || 'color-mix(in srgb, var(--text-high) 2%, transparent)',
          borderBottom: `1px solid ${accentColor || 'var(--border-color)'}`,
          fontSize: '0.66rem',
          fontWeight: 700,
          color: 'var(--text-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>{title}</span>
          {isWipExceeded && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.58rem',
                color: 'var(--warning)',
                fontWeight: 700
              }}
              title={`Límite WIP superado (${tasks.length}/${wipLimit})`}
            >
              <AlertCircle size={10} color="var(--warning)" />
              WIP!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: isWipExceeded ? 'var(--warning)' : 'var(--text-muted)'
            }}
          >
            {tasks.length}
          </span>

          {statusKey === 'todo' && onAddTask && filePath && (
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              style={{
                background: isAdding ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'transparent',
                border: 'none',
                color: isAdding ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '1px',
                display: 'flex',
                borderRadius: '3px'
              }}
              title="Agregar tarea rápida a este proyecto"
            >
              <Plus size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', display: 'flex' }}
            title={isExpanded ? 'Ver 3 columnas' : 'Expandir columna al 100%'}
          >
            {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>
      </div>

      {/* Input de Agregar Tarea Rápida */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          style={{
            padding: '4px 6px',
            background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: '4px'
          }}
        >
          <input
            type="text"
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Nueva tarea... (Enter)"
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.72rem',
              color: 'var(--text-high)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--bg-main)',
              fontSize: '0.64rem',
              fontWeight: 700,
              padding: '2px 7px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </form>
      )}

      {/* Lista de Tareas y Dropzone */}
      <div
        style={{
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minHeight: '120px',
          maxHeight: columnHeight,
          overflowY: 'auto'
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              flex: 1,
              minHeight: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.68rem',
              opacity: 0.6,
              border: '1px dashed transparent'
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={onToggleTask}
              onSetStatus={onSetStatus}
              onSelectTask={onSelectTask}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
}
export default SwimlaneColumn;
