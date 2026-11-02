import React, { useState } from 'react';
import { Box, Plus, X, Layers } from 'lucide-react';
import { TacticalButton } from '../../ui';

const PRESETS = [
  { name: 'redis_dev', image: 'redis:alpine', port: '6379:6379', env: '' },
  { name: 'postgres_dev', image: 'postgres:16', port: '5432:5432', env: 'POSTGRES_PASSWORD=secret\nPOSTGRES_USER=postgres' },
  { name: 'mongodb_local', image: 'mongo:latest', port: '27017:27017', env: '' },
  { name: 'nginx_test', image: 'nginx:alpine', port: '8080:80', env: '' }
];

/**
 * CreateContainerModal — Modal táctico para instanciar nuevos contenedores.
 */
export function CreateContainerModal({ isOpen, onClose, onCreate, actionLoadingId }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [portMapping, setPortMapping] = useState('');
  const [envString, setEnvString] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setImage(preset.image);
    setPortMapping(preset.port);
    setEnvString(preset.env);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !image.trim()) return;

    const envVars = envString
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    onCreate({
      name: name.trim(),
      image: image.trim(),
      portMapping: portMapping.trim(),
      envVars
    });
  };

  const isCreating = actionLoadingId === 'create-container';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '480px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Crear Nuevo Contenedor
            </span>
          </div>
          <TacticalButton
            variant="ghost"
            size="xs"
            icon={<X size={14} />}
            onClick={onClose}
            style={{ padding: '3px' }}
          />
        </div>

        {/* Presets Rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Plantillas Rápidas:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {PRESETS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-high)', marginBottom: '3px' }}>
              Nombre del Contenedor *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. redis-dev, app-db"
              required
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-high)', marginBottom: '3px' }}>
              Imagen Base *
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="ej. redis:alpine, mongo:latest, postgres:16"
              required
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-high)', marginBottom: '3px' }}>
              Mapeo de Puertos (Host:Container)
            </label>
            <input
              type="text"
              value={portMapping}
              onChange={(e) => setPortMapping(e.target.value)}
              placeholder="ej. 6379:6379 o 8080:80"
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-high)', marginBottom: '3px' }}>
              Variables de Entorno (una por línea: CLAVE=VALOR)
            </label>
            <textarea
              rows={3}
              value={envString}
              onChange={(e) => setEnvString(e.target.value)}
              placeholder="POSTGRES_PASSWORD=secret&#10;APP_ENV=local"
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
            <TacticalButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancelar
            </TacticalButton>
            <TacticalButton
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              disabled={isCreating || !name.trim() || !image.trim()}
            >
              {isCreating ? 'Desplegando...' : 'Crear Contenedor'}
            </TacticalButton>
          </div>
        </form>
      </div>
    </div>
  );
}
