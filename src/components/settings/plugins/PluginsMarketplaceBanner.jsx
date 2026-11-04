import { Sparkles, FolderOpen } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function PluginsMarketplaceBanner({ onFeedback }) {
  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
      border: '1px dashed var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} color="var(--primary)" />
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-high)' }}>
            Ecosistema de Plugins Comunitarios (Fase G.5)
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            En la Fase G.5 se integrará la descarga directa de paquetes `.aegispkg` desde GitHub Releases y sandbox WASM.
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          invoke('open_path', { path: '.config/aegis/plugins' }).catch(() => {
            if (onFeedback) onFeedback('Directorio local: ~/.config/aegis/plugins/');
          });
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 9px',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-high)',
          fontSize: '0.68rem',
          cursor: 'pointer'
        }}
      >
        <FolderOpen size={12} color="var(--primary)" />
        <span>Abrir Carpeta de Plugins</span>
      </button>
    </div>
  );
}
