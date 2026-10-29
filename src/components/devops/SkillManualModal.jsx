import React from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { ModalWrapper } from '../ui';
import MarkdownViewer from '../MarkdownViewer';

/**
 * SkillManualModal — Modal táctico para visualizar el archivo SKILL.md en Markdown.
 */
export function SkillManualModal({
  skill,
  markdown,
  loading = false,
  onClose
}) {
  return (
    <ModalWrapper
      isOpen={Boolean(skill)}
      onClose={onClose}
      title={skill?.name || 'Manual de Habilidad'}
      icon={<BookOpen size={16} color="var(--primary, #10b981)" />}
      maxWidth="850px"
      bodyStyle={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '8px' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span>Cargando manual...</span>
        </div>
      ) : (
        <MarkdownViewer content={markdown} />
      )}
    </ModalWrapper>
  );
}
