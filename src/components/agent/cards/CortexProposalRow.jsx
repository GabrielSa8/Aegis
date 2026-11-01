import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Check, X, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function CortexProposalRow({ prop, onResolved }) {
  const [status, setStatus] = useState(prop.status || 'pending');
  const [savedPath, setSavedPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [draftMd, setDraftMd] = useState(prop.skillMarkdown || '');

  const handleResolve = async (approve) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await invoke('cortex_resolve_proposal', {
        proposalId: prop.id,
        approve,
        customMarkdown: approve ? draftMd : null
      });
      setStatus(approve ? 'approved' : 'dismissed');
      if (approve && res) setSavedPath(res);
      setShowEditor(false);
      onResolved?.(prop.id, approve ? 'approved' : 'dismissed');
    } catch (e) {
      console.error('Error resolviendo propuesta Cortex:', e);
    } finally {
      setBusy(false);
    }
  };

  const isApproved = status === 'approved';
  const isDismissed = status === 'dismissed';

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm, 6px)',
        border: '1px solid var(--border-color)',
        background: isApproved
          ? 'color-mix(in srgb, var(--primary) 10%, var(--bg-main))'
          : 'color-mix(in srgb, var(--bg-main) 65%, transparent)',
        opacity: isDismissed ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            {prop.title}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.64rem',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid var(--border-color)',
              color: 'var(--primary)'
            }}
          >
            {prop.skillSlug}
          </span>
        </div>

        {status === 'pending' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleResolve(true)}
              disabled={busy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 5px)',
                background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Check size={12} /> {prop.title?.startsWith('Evolución') ? 'Actualizar Skill' : 'Aprobar Skill & Perfil'}
            </button>
            <button
              onClick={() => handleResolve(false)}
              disabled={busy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm, 5px)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              <X size={12} /> Descartar
            </button>
          </div>
        ) : (
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              color: isApproved ? 'var(--primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            {isApproved ? '✓ SKILL CREADA & PERFIL SINCRONIZADO' : '✕ DESCARTADA'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{prop.reason}</div>
        <button
          type="button"
          onClick={() => setShowEditor((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 5px)',
            color: 'var(--text-muted)',
            fontSize: '0.66rem',
            padding: '2px 7px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {showEditor ? <EyeOff size={11} /> : <Eye size={11} />}
          {showEditor ? 'Ocultar SKILL.md' : 'Ver / Editar SKILL.md'}
        </button>
      </div>

      {showEditor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <textarea
            value={draftMd}
            onChange={(e) => setDraftMd(e.target.value)}
            rows={9}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              lineHeight: 1.4,
              padding: '8px',
              borderRadius: 'var(--radius-sm, 5px)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-high)',
              resize: 'vertical'
            }}
          />
          {isApproved && (
            <button
              type="button"
              onClick={() => handleResolve(true)}
              disabled={busy}
              style={{
                alignSelf: 'flex-end',
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm, 5px)',
                background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Guardar cambios en SKILL.md
            </button>
          )}
        </div>
      )}

      {savedPath && (
        <div style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--primary)' }}>
          Guardada en: {savedPath}
        </div>
      )}
    </div>
  );
}
