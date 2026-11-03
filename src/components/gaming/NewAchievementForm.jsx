import React, { useState } from 'react';
import TacticalButton from '../ui/TacticalButton';

export default function NewAchievementForm({ onSubmit, onCancel, loading }) {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSubmit(newTitle.trim(), newDesc.trim() || null);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'color-mix(in srgb, var(--primary) 8%, var(--bg-card))',
      border: '1px solid var(--primary)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
        Registrar Nuevo Logro Personalizado
      </span>
      <input
        type="text"
        required
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Título del logro (ej. Derrotar al Rey de las Sombras)"
        style={{
          height: '26px',
          padding: '0 8px',
          fontSize: '0.74rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-high)'
        }}
      />
      <input
        type="text"
        value={newDesc}
        onChange={(e) => setNewDesc(e.target.value)}
        placeholder="Descripción u objetivo opcional..."
        style={{
          height: '26px',
          padding: '0 8px',
          fontSize: '0.74rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-high)'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
        <TacticalButton variant="ghost" size="xs" onClick={onCancel}>
          Cancelar
        </TacticalButton>
        <TacticalButton variant="primary" size="xs" type="submit" disabled={loading}>
          Guardar Logro
        </TacticalButton>
      </div>
    </form>
  );
}
