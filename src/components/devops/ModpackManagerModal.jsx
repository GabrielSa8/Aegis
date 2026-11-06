import React, { useState, useEffect } from 'react';
import { PackagePlus, Check, X, Sparkles } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';
import { SKILL_CATEGORIES } from './devopsHelpers';

/**
 * ModpackManagerModal — Modal táctico para crear o editar paquetes de Modpacks personalizados.
 */
export function ModpackManagerModal({
  isOpen,
  onClose,
  initialData,
  availableSkills = [],
  onSave
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cloud');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setCategory(initialData.category || 'cloud');
        setSelectedSkills(initialData.skills || []);
      } else {
        setName('');
        setDescription('');
        setCategory('cloud');
        setSelectedSkills([]);
      }
      setSearch('');
      setError(null);
    }
  }, [isOpen, initialData]);

  const toggleSkill = (id) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del modpack es obligatorio');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Debes seleccionar al menos una habilidad');
      return;
    }

    onSave({
      id: initialData?.id || `pack_custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Modpack personalizado',
      category,
      enabled: initialData?.enabled ?? true,
      skills: selectedSkills,
      disabledSubSkills: initialData?.disabledSubSkills || [],
      isCustom: true
    });
    onClose();
  };

  const filteredSkills = availableSkills.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-high)' }}>
              {initialData ? 'Editar Modpack' : 'Crear Nuevo Modpack (Meta-Skill)'}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.72rem' }}>
            {error}
          </div>
        )}

        {/* Inputs Básicos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
              Nombre del Modpack *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Fullstack Microservicios"
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
            >
              {SKILL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
            Descripción Operativa
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Propósito operativo y ahorro de tokens"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem' }}
          />
        </div>

        {/* Selector de Skills */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Skills Vinculadas ({selectedSkills.length} seleccionadas)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar catálogo..."
              style={{ padding: '3px 6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.65rem', width: '140px' }}
            />
          </div>

          <div style={{
            maxHeight: '180px',
            overflowY: 'auto',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xs)',
            padding: '6px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px'
          }}>
            {filteredSkills.map(s => {
              const isChecked = selectedSkills.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    background: isChecked ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                    border: isChecked ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ pointerEvents: 'none' }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isChecked ? 'var(--primary)' : 'var(--text-high)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.3rem' }}>
          <TacticalButton variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </TacticalButton>
          <TacticalButton variant="primary" size="sm" type="submit" icon={<Sparkles size={12} />}>
            {initialData ? 'Guardar Cambios' : 'Crear Modpack'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
