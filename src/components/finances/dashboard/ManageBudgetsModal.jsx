import { Sliders, X, Search, Check } from 'lucide-react';
import { useManageBudgets } from './useManageBudgets';
import { BudgetCategoryRow } from './BudgetCategoryRow';
import { CreateApartadoForm } from './CreateApartadoForm';

/**
 * ManageBudgetsModal — Panel de gestión integral de apartados y presupuestos.
 * Layout respirable, alta ergonomía visual y cero solapamiento de controles.
 */
export function ManageBudgetsModal({
  isOpen,
  onClose,
  categories = [],
  setCategories,
  budgets = {},
  setBudgets,
  expenseByCategory = {},
  onBudgetChange
}) {
  const {
    localBudgets,
    searchTerm,
    setSearchTerm,
    isSaving,
    newCatName,
    setNewCatName,
    newCatLimit,
    setNewCatLimit,
    deletingCategory,
    setDeletingCategory,
    formError,
    setFormError,
    validCategories,
    filteredCategories,
    handleBudgetChange,
    handleQuickAdd,
    handleResetCategory,
    handleCreateApartado,
    handleDeleteApartado,
    handleSaveAllLimits,
    totalAllocated,
    totalExpenses,
    activeLimitsCount
  } = useManageBudgets({
    isOpen,
    onClose,
    categories,
    setCategories,
    budgets,
    setBudgets,
    expenseByCategory,
    onBudgetChange
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 25%, var(--border-color))',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.65), 0 0 24px color-mix(in srgb, var(--accent, var(--primary)) 12%, transparent)',
          overflow: 'hidden',
          background: 'var(--bg-card, #12141a)'
        }}
      >
        {/* Cabecera Táctica */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'color-mix(in srgb, var(--accent, var(--primary)) 6%, transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm, 7px)',
                background: 'color-mix(in srgb, var(--accent, var(--primary)) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent, var(--primary)) 30%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, var(--primary))'
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: 'var(--text-high)', letterSpacing: '-0.01em' }}>
                Gestión de Apartados & Presupuestos
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Crea nuevos apartados, elimina categorías o ajusta sus límites mensuales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="structure-action-btn"
            style={{ width: '34px', height: '34px', minWidth: '34px', minHeight: '34px', padding: 0, borderRadius: '50%', cursor: 'pointer', touchAction: 'manipulation' }}
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario de Creación de Apartado */}
        <CreateApartadoForm
          newCatName={newCatName}
          setNewCatName={setNewCatName}
          newCatLimit={newCatLimit}
          setNewCatLimit={setNewCatLimit}
          formError={formError}
          setFormError={setFormError}
          isSaving={isSaving}
          onSubmit={handleCreateApartado}
        />

        {/* Barra de Búsqueda y Métricas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem 0.6rem 1.5rem',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              height: '34px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'color-mix(in srgb, var(--bg-card) 60%, black)',
              border: '1px solid var(--border-color)',
              flex: '1 1 240px',
              maxWidth: '320px'
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar apartado por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-high)',
                fontSize: '0.8rem',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 5px)',
                background: 'color-mix(in srgb, var(--bg-card) 60%, black)',
                border: '1px solid var(--border-color)'
              }}
            >
              <strong style={{ color: 'var(--text-high)' }}>{activeLimitsCount}</strong> con límite / {validCategories.length} apartados
            </span>
          </div>
        </div>

        {/* Lista Scrolleable de Apartados */}
        <div
          style={{
            flex: 1,
            minHeight: '240px',
            maxHeight: '48vh',
            overflowY: 'auto',
            padding: '0.4rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
          className="no-scrollbar"
        >
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No se encontraron apartados que coincidan con la búsqueda.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <BudgetCategoryRow
                key={cat}
                category={cat}
                limitValue={localBudgets[cat] !== undefined ? localBudgets[cat] : ''}
                spent={expenseByCategory[cat] || 0}
                isConfirmingDelete={deletingCategory === cat}
                onBudgetChange={handleBudgetChange}
                onReset={handleResetCategory}
                onRequestDelete={setDeletingCategory}
                onConfirmDelete={handleDeleteApartado}
                onCancelDelete={() => setDeletingCategory(null)}
              />
            ))
          )}
        </div>
        {/* Footer con Telemetría y Acciones */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.95rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Presupuesto Total:
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--accent, var(--primary))',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
              (Gastado en ciclo: ${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })})
            </span>
          </div>

          <div className="budget-modal-footer-actions">
            <button
              type="button"
              className="budget-modal-btn budget-modal-btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="budget-modal-btn budget-modal-btn-primary"
              onClick={handleSaveAllLimits}
              disabled={isSaving}
            >
              <Check size={15} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Límites'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ManageBudgetsModal;
