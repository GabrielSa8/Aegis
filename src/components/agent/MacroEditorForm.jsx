import { useState, useRef } from 'react';
import { Save, Edit3 } from 'lucide-react';
import { TacticalButton } from '../ui';
import { AVAILABLE_VARIABLES } from './macroHelpers';

export default function MacroEditorForm({
  initialLabel = '',
  initialText = '',
  isCreating = false,
  onSave,
  onCancel
}) {
  const [label, setLabel] = useState(initialLabel);
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  const handleInsertVariable = (tag) => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => `${prev} ${tag}`.trim());
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = `${before}${tag}${after}`;

    setText(newText);

    // Reposicionar el cursor justo después de la variable insertada
    requestAnimationFrame(() => {
      el.focus();
      const nextPos = start + tag.length;
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSubmit = () => {
    if (!label.trim() || !text.trim()) return;
    onSave(label.trim(), text.trim());
  };

  return (
    <div
      style={{
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid color-mix(in srgb, var(--primary) 50%, transparent)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Edit3 size={13} />
          <span>{isCreating ? 'Nueva macro' : 'Editar macro'}</span>
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Ctrl + ↵ para guardar
        </span>
      </div>

      {/* Input de Nombre / Etiqueta */}
      <input
        type="text"
        placeholder="Etiqueta corta (ej. Analizar git diff)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          fontSize: '0.76rem',
          padding: '6px 10px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-high)',
          outline: 'none'
        }}
      />

      {/* Barra de inserción de variables dinámicas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          Variables:
        </span>
        {AVAILABLE_VARIABLES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => handleInsertVariable(v.tag)}
            className={`macro-var-insert-btn var-${v.id}`}
            title={`${v.label}: ${v.desc}`}
          >
            <span>+</span>
            <span>{v.tag}</span>
          </button>
        ))}
      </div>

      {/* Textarea de la instrucción del macro */}
      <textarea
        ref={textareaRef}
        placeholder="Instrucción para el agente... Puedes usar {{clip}}, {{diff}}, {{nota}}, {{cwd}}"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        style={{
          fontSize: '0.75rem',
          padding: '6px 10px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-high)',
          outline: 'none',
          resize: 'vertical',
          minHeight: '60px',
          fontFamily: 'inherit'
        }}
      />

      {/* Botones de acción */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <TacticalButton
          variant="ghost"
          size="xs"
          onClick={onCancel}
        >
          Cancelar
        </TacticalButton>
        <TacticalButton
          variant="primary"
          size="xs"
          disabled={!label.trim() || !text.trim()}
          onClick={handleSubmit}
        >
          Guardar
        </TacticalButton>
      </div>
    </div>
  );
}
