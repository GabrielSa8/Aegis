import { memo } from 'react';
import { X, FileText } from 'lucide-react';

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function AttachmentStrip({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return (
    <div
      className="attachment-strip"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 10px 2px', width: '100%' }}
    >
      {attachments.map((a) => (
        <div
          key={a.id}
          data-attachment={a.name}
          title={`${a.name} · ${fmtSize(a.size)}`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            maxWidth: '180px',
            padding: a.previewUrl ? '2px' : '4px 8px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'color-mix(in srgb, var(--primary) 8%, var(--bg-card))',
            color: 'var(--text-high)',
            fontSize: '0.68rem'
          }}
        >
          {a.previewUrl ? (
            <img src={a.previewUrl} alt={a.name} style={{ height: 38, borderRadius: 4, display: 'block' }} />
          ) : (
            <>
              <FileText size={13} color="var(--primary)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
            </>
          )}
          <button
            onClick={() => onRemove(a.id)}
            aria-label={`Quitar ${a.name}`}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-high)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default memo(AttachmentStrip);
