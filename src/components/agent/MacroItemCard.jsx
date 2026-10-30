import { useState } from 'react';
import { Edit3, Trash2, Check, X } from 'lucide-react';
import { TacticalButton } from '../ui';
import { getMacroVariables } from './macroHelpers';

export default function MacroItemCard({
  macro,
  idx,
  onEdit,
  onDelete
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const detectedVars = getMacroVariables(macro.text);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (isConfirming) {
      onDelete(macro.id);
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  const handleCancelConfirm = (e) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  return (
    <div
      className="macro-card-item"
      onMouseLeave={() => isConfirming && setIsConfirming(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
        {/* Fila de Título y Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <kbd className="tactical-kbd" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
            {idx + 1}
          </kbd>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            {macro.label}
          </span>

          {/* Badges de variables dinámicas presentes */}
          {detectedVars.map((v) => (
            <span key={v} className={`macro-var-badge var-${v}`}>
              {`{{${v}}}`}
            </span>
          ))}
        </div>

        {/* Vista previa del prompt / texto */}
        <span
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)'
          }}
          title={macro.text}
        >
          {macro.text}
        </span>
      </div>

      {/* Controles de Acción (Editar / Micro-confirmación Borrar) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <TacticalButton
          variant="ghost"
          size="xs"
          icon={<Edit3 size={12} />}
          onClick={() => onEdit(macro)}
          title="Editar macro"
        />

        {isConfirming ? (
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDeleteClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                fontSize: '0.58rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.22)',
                border: '1px solid var(--danger, #ef4444)',
                color: 'var(--danger, #ef4444)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              title="Confirmar eliminación permanente"
            >
              <Check size={10} strokeWidth={2.5} />
              <span>¿Borrar?</span>
            </button>
            <button
              onClick={handleCancelConfirm}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                padding: 0,
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Cancelar"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <TacticalButton
            variant="danger"
            size="xs"
            icon={<Trash2 size={12} />}
            onClick={() => setIsConfirming(true)}
            title="Eliminar macro"
          />
        )}
      </div>
    </div>
  );
}
