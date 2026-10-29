import { Settings, Check, X, Edit3, Trash2 } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  editingCatName,
  setEditingCatName,
  newCatEditValue,
  setNewCatEditValue,
  onSaveEditCategory,
  onSelectDeleteCategory
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Administrar Categorías"
      icon={Settings}
      maxWidth="420px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, lineHeight: '1.25rem' }}>
          Renombra o elimina tus categorías. Al borrar una categoría, todos sus gastos se reclasificarán a <strong style={{ color: '#fff' }}>"Otros"</strong> automáticamente.
        </p>

        <div className="category-manager-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div 
              key={cat} 
              className="category-manager-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {editingCatName === cat ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    value={newCatEditValue}
                    onChange={(e) => setNewCatEditValue(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', height: '30px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                  <TacticalButton
                    variant="primary"
                    size="sm"
                    icon={Check}
                    onClick={() => onSaveEditCategory(cat)}
                    style={{ height: '30px', padding: '0 8px' }}
                  />
                  <TacticalButton
                    variant="secondary"
                    size="sm"
                    icon={X}
                    onClick={() => setEditingCatName('')}
                    style={{ height: '30px', padding: '0 8px' }}
                  />
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-high)' }}>
                    {cat}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <TacticalButton
                      variant="secondary"
                      size="sm"
                      icon={Edit3}
                      onClick={() => { setEditingCatName(cat); setNewCatEditValue(cat); }}
                      title="Renombrar"
                      disabled={cat === 'Otros' || cat === 'Ingresos (Sueldo/Ventas)'}
                      style={{ width: '28px', height: '28px', padding: 0 }}
                    />
                    <TacticalButton
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => onSelectDeleteCategory(cat)}
                      title="Eliminar"
                      disabled={cat === 'Otros' || cat === 'Ingresos (Sueldo/Ventas)'}
                      style={{ width: '28px', height: '28px', padding: 0 }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
}
