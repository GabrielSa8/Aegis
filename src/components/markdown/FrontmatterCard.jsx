import React from 'react';
import { Layers, CheckCircle2, Calendar, Link2, Hash } from 'lucide-react';

export default function FrontmatterCard({ frontmatter, onTagClick }) {
  if (!frontmatter) return null;

  return (
    <div style={{
      marginBottom: '1.25rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '0.75rem'
    }}>
      {/* Cabecera de Metadatos */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {frontmatter.tipo && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--primary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.65rem'
          }}>
            <Layers size={11} />
            {frontmatter.tipo}
          </span>
        )}

        {frontmatter.estado && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(217, 119, 0, 0.15)',
            color: '#fbbf24',
            fontWeight: 600,
            fontSize: '0.65rem'
          }}>
            <CheckCircle2 size={11} />
            {frontmatter.estado}
          </span>
        )}

        {frontmatter.fecha_actualizacion && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <Calendar size={11} />
            {frontmatter.fecha_actualizacion}
          </span>
        )}

        {frontmatter.aliases && frontmatter.aliases.length > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.68rem'
          }}>
            <Link2 size={11} />
            {frontmatter.aliases.join(', ')}
          </span>
        )}
      </div>

      {/* Tags Interactivos */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
          {frontmatter.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                cursor: onTagClick ? 'pointer' : 'default',
                transition: 'var(--transition)'
              }}
              title={`Filtrar por #${tag}`}
            >
              <Hash size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
