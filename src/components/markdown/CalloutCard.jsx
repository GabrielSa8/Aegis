import React from 'react';
import { Info } from 'lucide-react';
import { CALLOUT_CONFIGS } from './calloutConfigs';
import { formatInline } from './markdownHelpers';

export default function CalloutCard({ type, customTitle, bodyLines, onNavigateNote }) {
  const normalizedType = (type || 'note').toLowerCase();
  const config = CALLOUT_CONFIGS[normalizedType] || {
    title: normalizedType.toUpperCase(),
    color: 'var(--primary)',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: Info
  };
  const IconComponent = config.icon;
  const titleText = customTitle || config.title;

  return (
    <div style={{
      margin: '10px 0',
      borderRadius: 'var(--radius-md)',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderLeft: `4px solid ${config.color}`,
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Cabecera del Callout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconComponent size={16} color={config.color} />
        <span style={{
          fontSize: '0.84rem',
          fontWeight: 700,
          color: config.color,
          letterSpacing: '0.02em',
          textTransform: customTitle ? 'none' : 'uppercase'
        }}>
          {titleText}
        </span>
      </div>

      {/* Cuerpo del Callout */}
      {bodyLines.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '0.82rem',
          color: 'var(--text-high)',
          lineHeight: '1.5',
          fontStyle: normalizedType === 'quote' || normalizedType === 'cite' ? 'italic' : 'normal',
          paddingLeft: '24px'
        }}>
          {bodyLines.map((bLine, bIdx) => {
            if (!bLine.trim()) return <div key={bIdx} style={{ height: '4px' }} />;
            return (
              <p key={bIdx} style={{ margin: 0 }}>
                {formatInline(bLine, onNavigateNote)}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
