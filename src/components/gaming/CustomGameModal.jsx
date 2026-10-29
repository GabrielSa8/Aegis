import React from 'react';
import { Gamepad2 } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function CustomGameModal({
  isOpen,
  onClose,
  gameFormData,
  setGameFormData,
  onSubmit
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Nuevo Lanzador de Juego"
      icon={Gamepad2}
      maxWidth="460px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Título del Juego *
          </label>
          <input
            type="text"
            required
            value={gameFormData.title}
            onChange={(e) => setGameFormData({ ...gameFormData, title: e.target.value })}
            placeholder="ej. PokéRogue, RetroArch, Chess..."
            style={{
              width: '100%',
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Tipo de Lanzador
            </label>
            <select
              value={gameFormData.launchType}
              onChange={(e) => setGameFormData({ ...gameFormData, launchType: e.target.value })}
              style={{
                width: '100%',
                height: '28px',
                padding: '2px 6px',
                fontSize: '0.72rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff'
              }}
            >
              <option value="url">Navegador Web (URL)</option>
              <option value="flatpak">Flatpak (App ID)</option>
              <option value="cmd">Comando Binario / Shell</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Categoría / Etiqueta
            </label>
            <input
              type="text"
              value={gameFormData.category}
              onChange={(e) => setGameFormData({ ...gameFormData, category: e.target.value })}
              placeholder="Roguelike, Emulación..."
              style={{
                width: '100%',
                height: '28px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Destino de Ejecución (URL, ID Flatpak o Comando) *
          </label>
          <input
            type="text"
            required
            value={gameFormData.launchTarget}
            onChange={(e) => setGameFormData({ ...gameFormData, launchTarget: e.target.value })}
            placeholder="https://... o io.mgba.mGBA o /usr/bin/..."
            style={{
              width: '100%',
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            URL de Imagen de Portada (Opcional)
          </label>
          <input
            type="text"
            value={gameFormData.bannerUrl}
            onChange={(e) => setGameFormData({ ...gameFormData, bannerUrl: e.target.value })}
            placeholder="https://... (JPG/PNG vertical u horizontal)"
            style={{
              width: '100%',
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Descripción Breve
          </label>
          <input
            type="text"
            value={gameFormData.description}
            onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
            placeholder="Resumen o notas del juego..."
            style={{
              width: '100%',
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <TacticalButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </TacticalButton>
          <TacticalButton
            type="submit"
            variant="primary"
            size="sm"
          >
            Guardar Lanzador
          </TacticalButton>
        </div>
      </form>
    </ModalWrapper>
  );
}
