import { useState } from 'react';
import { CheckSquare, Square, Calendar, Plus, Tag, Clock } from 'lucide-react';

export default function TasksView() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'TADÚ: Ejecutar pruebas de BasesListFunction y preparar PR hacia desarrollo', category: 'TADÚ', done: false, priority: 'Alta' },
    { id: 2, text: 'Aegis: Hito 1 — Configurar puente PTY / Subprocess en Rust para streaming del agente', category: 'Aegis', done: false, priority: 'Alta' },
    { id: 3, text: 'Granja: Agregar nuevos modelos de animales y animaciones elásticas en Compose', category: 'Granja', done: false, priority: 'Media' },
    { id: 4, text: 'MELI: Auditoría de layout y protocolo de ambulancias operativas', category: 'MELI', done: false, priority: 'Media' },
    { id: 5, text: 'Estudios: Generar flashcards de DynamoDB Single-Table para certificación AWS', category: 'Estudios', done: true, priority: 'Baja' },
    { id: 6, text: 'Bóveda: Sincronizar avances de Hito 1 en Bitacora_Proyectos.md y MOC', category: 'Bóveda', done: true, priority: 'Alta' }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const pendingCount = tasks.filter(t => !t.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare color="#6366f1" size={20} />
            Bandeja de Tareas Unificada (Inbox Zero)
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Sincronizadas con checkboxes <code>- [ ]</code> de notas de Obsidian
          </p>
        </div>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600 }}>
          {pendingCount} Pendientes
        </div>
      </div>

      {/* Task List */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '8px',
              background: task.done ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
              border: task.done ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid rgba(255, 255, 255, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {task.done ? (
                <CheckSquare size={18} color="#10b981" />
              ) : (
                <Square size={18} color="#64748b" />
              )}
              <span style={{
                fontSize: '0.85rem',
                color: task.done ? '#64748b' : '#f1f5f9',
                textDecoration: task.done ? 'line-through' : 'none',
                fontWeight: task.done ? 400 : 500
              }}>
                {task.text}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                fontWeight: 600
              }}>
                {task.category}
              </span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: task.priority === 'Alta' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                color: task.priority === 'Alta' ? '#f43f5e' : '#fbbf24',
                fontWeight: 600
              }}>
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
