import { useState } from 'react';
import { Download, HardDrive, Link, CheckCircle, AlertCircle } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function InstallPluginModal({ isOpen, onClose, onInstallPath, onInstallUrl }) {
  const [mode, setMode] = useState('path'); // 'path' | 'url'
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    let res;
    if (mode === 'path') {
      res = await onInstallPath(inputVal.trim());
    } else {
      res = await onInstallUrl(inputVal.trim());
    }

    setSubmitting(false);
    if (res.success) {
      setInputVal('');
      onClose();
    } else {
      setErrorMsg(res.error || 'Fallo durante la instalación del plugin.');
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Instalar Plugin Comunitario (.aegispkg)" maxWidth="460px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Selector de modo: Archivo Local vs URL */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.2)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('path'); setErrorMsg(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'path' ? 'var(--primary-glow)' : 'transparent',
              border: mode === 'path' ? '1px solid var(--primary)' : 'none',
              color: mode === 'path' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: mode === 'path' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <HardDrive size={13} color={mode === 'path' ? 'var(--primary)' : 'currentColor'} />
            <span>Archivo Local (.aegispkg)</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('url'); setErrorMsg(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'url' ? 'var(--primary-glow)' : 'transparent',
              border: mode === 'url' ? '1px solid var(--primary)' : 'none',
              color: mode === 'url' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: mode === 'url' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Link size={13} color={mode === 'url' ? 'var(--primary)' : 'currentColor'} />
            <span>URL de GitHub Release</span>
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            {mode === 'path' ? 'RUTA ABSOLUTA DEL ARCHIVO' : 'URL DIRECTA DE DESCARGA HTTPS'}
          </label>
          <input
            type="text"
            autoFocus
            placeholder={mode === 'path' ? '/home/usuario/Descargas/mi-plugin.aegispkg' : 'https://github.com/autor/repo/releases/download/v1.0/plugin.aegispkg'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--danger)',
            fontSize: '0.72rem',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <TacticalButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </TacticalButton>
          <TacticalButton type="submit" variant="primary" disabled={submitting || !inputVal.trim()}>
            <Download size={13} style={{ marginRight: '5px' }} />
            {submitting ? 'Instalando...' : 'Instalar Plugin'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
