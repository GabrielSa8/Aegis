import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export const CATEGORY_LIQUID_COLORS = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Electric Blue
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#0ea5e9'  // Sky Blue
];

export function BudgetWaterCard({
  cat,
  index = 0,
  expenseAmount = 0,
  budgetAmount = 0,
  onSaveBudget
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState('');

  const hasBudget = budgetAmount > 0;
  const rawPct = hasBudget ? (expenseAmount / budgetAmount) * 100 : 0;
  const fillPct = Math.min(Math.max(rawPct, 0), 100);
  const remaining = budgetAmount - expenseAmount;
  const isExceeded = hasBudget && rawPct >= 100;
  const isWarning = hasBudget && rawPct >= 80 && rawPct < 100;

  // Asignar color de agua distintivo por categoría según índice
  const baseColor = CATEGORY_LIQUID_COLORS[index % CATEGORY_LIQUID_COLORS.length];
  const waterTone = isExceeded ? 'var(--danger)' : isWarning ? 'var(--warning)' : baseColor;

  const handleStartEdit = () => {
    setTempBudget(hasBudget ? String(budgetAmount) : '');
    setIsEditing(true);
  };

  const handleCommitEdit = () => {
    const amt = parseFloat(tempBudget);
    if (!isNaN(amt) && amt >= 0) {
      onSaveBudget(cat, amt);
    }
    setIsEditing(false);
    setTempBudget('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempBudget('');
  };

  return (
    <div
      className={`budget-water-card-v ${isExceeded ? 'exceeded' : ''}`}
      style={{
        borderColor: isEditing
          ? waterTone
          : isExceeded
          ? 'color-mix(in srgb, var(--danger) 50%, var(--border-color))'
          : isWarning
          ? 'color-mix(in srgb, var(--warning) 40%, var(--border-color))'
          : 'var(--border-color)',
        boxShadow: isEditing
          ? `0 0 16px color-mix(in srgb, ${waterTone} 25%, transparent)`
          : isExceeded
          ? '0 0 14px color-mix(in srgb, var(--danger) 22%, transparent)'
          : 'none'
      }}
    >
      {/* 🌊 Nivel de Agua Vertical con Oleaje */}
      {hasBudget && fillPct > 0 && !isEditing && (
        <div
          className="budget-water-vessel"
          style={{ height: `${fillPct}%` }}
        >
          {fillPct < 98 && (
            <div className="budget-water-waves-header">
              <svg className="budget-wave-svg wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path
                  d="M0,0 C150,90 350,-40 500,45 C650,130 900,-20 1200,40 L1200,120 L0,120 Z"
                  fill={`color-mix(in srgb, ${waterTone} 28%, transparent)`}
                />
              </svg>
              <svg className="budget-wave-svg wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path
                  d="M0,0 C200,60 400,-30 600,50 C800,120 1000,-10 1200,30 L1200,120 L0,120 Z"
                  fill={`color-mix(in srgb, ${waterTone} 52%, transparent)`}
                />
              </svg>
            </div>
          )}
          <div
            className="budget-water-body"
            style={{
              background: `linear-gradient(to top, color-mix(in srgb, ${waterTone} 45%, transparent), color-mix(in srgb, ${waterTone} 20%, transparent))`
            }}
          />
        </div>
      )}

      {/* 🪟 Capa Frontal de Contenido */}
      <div className="budget-water-content-v">
        {isEditing ? (
          /* 🛠️ MODO EDICIÓN ERGONÓMICO Y CÓMODO */
          <div className="budget-water-edit-panel">
            <div className="budget-water-edit-panel-top">
              <span className="budget-water-cat-name" title={cat}>
                {cat}
              </span>
              <span className="budget-water-edit-badge">Ajustar Límite</span>
            </div>

            <div className="budget-water-edit-center">
              <div
                className="budget-water-edit-input-box"
                style={{ borderColor: `color-mix(in srgb, ${waterTone} 45%, var(--border-color))` }}
              >
                <span className="budget-water-edit-currency" style={{ color: waterTone }}>$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="budget-water-edit-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="budget-water-edit-actions">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="budget-water-edit-btn-cancel"
                title="Cancelar (Esc)"
              >
                <X size={12} />
              </button>
              <button
                type="button"
                onClick={handleCommitEdit}
                className="budget-water-edit-btn-save"
                style={{
                  background: `color-mix(in srgb, ${waterTone} 22%, transparent)`,
                  borderColor: waterTone,
                  color: 'var(--text-high)'
                }}
                title="Guardar límite (Enter)"
              >
                <Check size={12} />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        ) : (
          /* 📊 MODO NORMAL CON BOTÓN DE EDICIÓN VISUAL */
          <>
            {/* Cabecera: Título y Botón Táctil de Límite */}
            <div className="budget-water-header-v">
              <span className="budget-water-cat-name" title={cat}>
                {cat}
              </span>

              <button
                type="button"
                onClick={handleStartEdit}
                className="budget-water-limit-pill"
                title={`Hacer clic para editar límite de ${cat}`}
              >
                <Pencil size={9} style={{ opacity: 0.75 }} />
                <span>{hasBudget ? `$${budgetAmount.toLocaleString()}` : 'Fijar tope'}</span>
              </button>
            </div>

            {/* Centro: Porcentaje Dinámico y Estado */}
            <div className="budget-water-center-v">
              {hasBudget ? (
                <>
                  <div
                    className="budget-water-big-pct"
                    style={{ color: isExceeded ? 'var(--danger)' : isWarning ? 'var(--warning)' : baseColor }}
                  >
                    {rawPct.toFixed(0)}%
                  </div>
                  <div
                    className="budget-water-diff-label"
                    style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--text-muted)' }}
                  >
                    {remaining < 0
                      ? `-$${Math.abs(remaining).toLocaleString()} exc.`
                      : `+$${remaining.toLocaleString()} libre`}
                  </div>
                </>
              ) : (
                <div className="budget-water-unlimited-box">
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Sin límite</span>
                </div>
              )}
            </div>

            {/* Pie: Monto Gastado */}
            <div className="budget-water-footer-v">
              <span className="budget-water-spent-tag">Gastado</span>
              <span className="budget-water-spent-val">
                ${expenseAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
