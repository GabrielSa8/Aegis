import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <CheckSquare color="#10b981" size={18} />
            Bandeja de Tareas Unificada (Inbox Zero)
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Checkboxes <code>- [ ]</code> de notas de Obsidian
          </p>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 600 }}>
          {pendingCount} Pendientes
        </div>
      </div>

      {/* Task List */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: task.done ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {task.done ? (
                <CheckSquare size={16} color="#10b981" />
              ) : (
                <Square size={16} color="var(--text-muted)" />
              )}
              <span style={{
                fontSize: '0.8rem',
                color: task.done ? 'var(--text-muted)' : 'var(--text-high)',
                textDecoration: task.done ? 'line-through' : 'none',
                fontWeight: task.done ? 400 : 500
              }}>
                {task.text}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                {task.category}
              </span>
              <span style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-md)',
                background: task.priority === 'Alta' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                color: task.priority === 'Alta' ? '#f87171' : '#fbbf24',
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
