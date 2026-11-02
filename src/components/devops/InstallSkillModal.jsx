import React, { useState } from 'react';
import { DownloadCloud, Sparkles, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';

/**
 * InstallSkillModal — Modal para buscar e instalar nuevas Agent Skills del ecosistema open source.
 * Invoca el CLI estándar `npx -y skills add <pkg>`.
 */
export function InstallSkillModal({
  isOpen,
  onClose,
  onInstall,
  actionLoading
}) {
  const [packageName, setPackageName] = useState('');
  const [outputLog, setOutputLog] = useState(null);
  const [error, setError] = useState(null);

  const SUGGESTIONS = [
    'vercel-labs/agent-skills',
    'anthropics/skills',
    'obra/superpowers'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!packageName.trim()) return;
    setError(null);
    setOutputLog(null);
    try {
      const res = await onInstall(packageName.trim());
      setOutputLog(res || 'Habilidad instalada exitosamente');
      setPackageName('');
    } catch (err) {
      setError(String(err));
    }
  };

  const isLoading = actionLoading === 'install-skill';

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DownloadCloud size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Instalar Habilidad (Agent Skills CLI)
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Paquete, Repositorio o URL de GitHub *
          </label>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="ej. vercel-labs/agent-skills o usuario/repo"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-high)', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
            required
          />
        </div>

        {/* Sugerencias Rápidas */}
        <div>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Fuentes recomendadas del ecosistema:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPackageName(s)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback / Logs */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.72rem' }}>
            <AlertCircle size={14} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {outputLog && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px 10px', background: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontSize: '0.72rem' }}>
            <CheckCircle2 size={14} flexShrink={0} style={{ marginTop: '2px' }} />
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{outputLog}</pre>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.3rem' }}>
          <TacticalButton variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cerrar
          </TacticalButton>
          <TacticalButton variant="primary" size="sm" type="submit" disabled={isLoading} icon={<DownloadCloud size={13} />}>
            {isLoading ? 'Instalando...' : 'Descargar e Instalar'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
