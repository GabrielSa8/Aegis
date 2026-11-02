import { Tag, Plus } from 'lucide-react';

/**
 * CreateApartadoForm — Formulario superior para añadir nuevos apartados/presupuestos.
 */
export function CreateApartadoForm({
  newCatName,
  setNewCatName,
  newCatLimit,
  setNewCatLimit,
  formError,
  setFormError,
  isSaving,
  onSubmit
}) {
  return (
    <div
      style={{
        padding: '0.95rem 1.5rem',
        background: 'color-mix(in srgb, var(--accent, var(--primary)) 3%, transparent)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Tag size={13} style={{ color: 'var(--accent, var(--primary))' }} />
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em' }}>
          Crear Nuevo Apartado
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <input
          type="text"
          placeholder="Nombre del apartado (ej. Mascotas, Ahorro...)"
          value={newCatName}
          onChange={(e) => {
            setNewCatName(e.target.value);
            if (formError) setFormError('');
          }}
          style={{
            flex: '1 1 200px',
            minWidth: '160px',
            height: '36px',
            padding: '0 12px',
            fontSize: '0.82rem',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-color)',
            background: 'color-mix(in srgb, var(--bg-card) 70%, black)',
            color: 'var(--text-high)',
            outline: 'none'
          }}
        />

        <div
          className="budget-inline-edit-wrapper"
          style={{ flex: '0 1 130px', minWidth: '100px', height: '36px', padding: '0 10px', gap: '6px' }}
        >
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>$</span>
          <input
            type="number"
            placeholder="0.00"
            value={newCatLimit}
            onChange={(e) => setNewCatLimit(e.target.value)}
            className="budget-inline-input"
            style={{ width: '100%', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <button
          type="submit"
          className="budget-modal-btn budget-modal-btn-create budget-modal-create-btn"
          disabled={isSaving}
        >
          <Plus size={15} />
          <span>Crear Apartado</span>
        </button>
      </form>

      {formError && (
        <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
          {formError}
        </span>
      )}
    </div>
  );
}
