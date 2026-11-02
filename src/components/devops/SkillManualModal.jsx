import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Edit3, Eye, Save, Trash2 } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';
import MarkdownViewer from '../MarkdownViewer';

/**
 * SkillManualModal — Modal táctico para visualizar y editar el archivo SKILL.md.
 */
export function SkillManualModal({
  skill,
  markdown,
  loading = false,
  onClose,
  onSave,
  onDelete
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(markdown || '');
    setIsEditing(false);
  }, [markdown, skill]);

  const handleSave = async () => {
    if (!onSave || !skill) return;
    setSaving(true);
    try {
      await onSave(skill.id, content);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={Boolean(skill)}
      onClose={onClose}
      maxWidth="850px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-high)' }}>
              {skill?.name || 'Manual de Habilidad'}
            </span>
            <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '3px' }}>
              ~/.agents/skills/{skill?.id}/SKILL.md
            </code>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TacticalButton
              variant="secondary"
              size="xs"
              icon={isEditing ? <Eye size={12} /> : <Edit3 size={12} />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Ver Markdown' : 'Editar SKILL.md'}
            </TacticalButton>

            {isEditing && (
              <TacticalButton
                variant="primary"
                size="xs"
                icon={<Save size={12} />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </TacticalButton>
            )}

            {onDelete && (
              <TacticalButton
                variant="danger"
                size="xs"
                icon={<Trash2 size={12} />}
                onClick={() => {
                  if (confirm(`¿Desinstalar permanentemente la habilidad '${skill.name}'?`)) {
                    onDelete(skill);
                    onClose();
                  }
                }}
              >
                Desinstalar
              </TacticalButton>
            )}

            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', marginLeft: '6px' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '8px' }}>
              <RefreshCw size={16} className="animate-spin" />
              <span>Cargando manual...</span>
            </div>
          ) : isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                height: '450px',
                boxSizing: 'border-box',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-high)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                lineHeight: '1.5',
                padding: '0.75rem',
                resize: 'vertical'
              }}
            />
          ) : (
            <MarkdownViewer content={content} />
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
