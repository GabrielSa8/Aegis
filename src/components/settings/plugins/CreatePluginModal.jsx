import { useState } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import ModalWrapper from '../../ui/ModalWrapper';
import TacticalButton from '../../ui/TacticalButton';

export default function CreatePluginModal({ isOpen, onClose, onCreateScaffold }) {
  const [pluginId, setPluginId] = useState('');
  const [pluginName, setPluginName] = useState('');
  const [category, setCategory] = useState('Utilidades');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pluginId.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    const res = await onCreateScaffold(pluginId.trim(), pluginName.trim() || pluginId.trim(), category);
    setSubmitting(false);

    if (res.success) {
      setPluginId('');
      setPluginName('');
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo crear la plantilla del plugin.');
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Crear Plantilla de Plugin" maxWidth="420px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            ID ÚNICO DEL PLUGIN (Kebab-case)
          </label>
          <input
            type="text"
            autoFocus
            placeholder="ej: crypto-ticker"
            value={pluginId}
            onChange={(e) => setPluginId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.78rem',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            NOMBRE VISIBLE
          </label>
          <input
            type="text"
            placeholder="ej: Crypto Live Ticker"
            value={pluginName}
            onChange={(e) => setPluginName(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.78rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            CATEGORÍA
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-high)',
              fontSize: '0.78rem'
            }}
          >
            <option value="Utilidades">Utilidades & Widgets</option>
            <option value="Finanzas">Finanzas & Cripto</option>
            <option value="Productividad">Productividad & Enfoque</option>
            <option value="DevOps">DevOps & Cloud</option>
            <option value="Gaming">Gaming & Audio</option>
          </select>
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
          <TacticalButton type="submit" variant="primary" disabled={submitting || !pluginId.trim()}>
            <Plus size={13} style={{ marginRight: '5px' }} />
            {submitting ? 'Creando...' : 'Crear en ~/.config/aegis/plugins'}
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
