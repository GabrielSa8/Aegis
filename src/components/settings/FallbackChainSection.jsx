import { useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus, ShieldAlert } from 'lucide-react';
import {
  PROVIDER_MODELS,
  INTENSITIES,
  splitIntensity,
  getIntensityLevel,
  withIntensity
} from '../agent/slashCommandFormatters';

const iconBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex'
};

const fieldStyle = { fontSize: '0.8rem', padding: '7px 10px', minHeight: 34 };

const modelName = (engine, id) => {
  const base = splitIntensity(id)?.base;
  const found = (PROVIDER_MODELS[engine] || []).find((m) => m.id === id || (base && splitIntensity(m.id)?.base === base));
  return (found?.name || id).replace(/\s*\((Low|Medium|High)\)/, '');
};

function LevelSelect({ id, onChange }) {
  const hasLevels = Boolean(splitIntensity(id));
  return (
    <select
      value={getIntensityLevel(id) || ''}
      disabled={!hasLevels}
      onChange={(e) => onChange(e.target.value)}
      title={hasLevels ? 'Nivel de razonamiento' : 'Este modelo no admite niveles'}
      style={{ ...fieldStyle, width: 110, fontWeight: 600 }}
    >
      {!hasLevels && <option value="">Sin niveles</option>}
      {INTENSITIES.map((it) => (
        <option key={it.level} value={it.level}>{it.label}</option>
      ))}
    </select>
  );
}

/**
 * Cadena global de respaldo ante 429 / cuota agotada.
 * Cada entrada guarda su motor; solo se usan las del motor activo, las demás se omiten.
 */
export default function FallbackChainSection({ config, setConfig }) {
  const [draft, setDraft] = useState('');
  const [draftLevel, setDraftLevel] = useState('mid');
  const entries = config.fallbackEntries || [];
  const activeEngine = config.agentType || 'agy';

  const update = (next) => setConfig({ ...config, fallbackEntries: next });
  const [draftEngine, draftModel] = draft ? draft.split('::') : ['', ''];

  const add = () => {
    if (!draft) return;
    const model = withIntensity(draftModel, draftLevel);
    if (entries.some((e) => e.engine === draftEngine && e.model === model)) return;
    update([...entries, { engine: draftEngine, model }]);
    setDraft('');
  };
  const setLevel = (i, level) => {
    const next = entries.map((e, k) => (k === i ? { ...e, model: withIntensity(e.model, level) } : e));
    update(next);
  };
  const move = (i, d) => {
    const next = [...entries];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-main) 60%, transparent)',
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <ShieldAlert size={15} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-high)' }}>
          Cadena de Fallback (cuota agotada / 429)
        </span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
        Lista global en orden de prioridad. Si el modelo activo agota su cuota antes de responder, se reintenta con el
        siguiente de <b>{activeEngine}</b>; las entradas de otros motores se omiten.
      </p>

      {entries.length === 0 && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Sin respaldos configurados.</div>
      )}
      {entries.map((e, i) => {
        const active = e.engine === activeEngine;
        return (
          <div
            key={`${e.engine}::${e.model}`}
            title={active ? '' : `Se omite: el motor activo es ${activeEngine}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              marginBottom: '6px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              opacity: active ? 1 : 0.45
            }}
          >
            <span style={{ color: 'var(--primary)', width: 18, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-high)' }}>{modelName(e.engine, e.model)}</span>
            <span
              style={{
                fontSize: '0.64rem',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full, 9999px)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {e.engine}{active ? '' : ' · omitido'}
            </span>
            <LevelSelect id={e.model} onChange={(lv) => setLevel(i, lv)} />
            <button style={iconBtn} onClick={() => move(i, -1)} title="Subir"><ArrowUp size={14} /></button>
            <button style={iconBtn} onClick={() => move(i, 1)} title="Bajar"><ArrowDown size={14} /></button>
            <button style={iconBtn} onClick={() => update(entries.filter((_, k) => k !== i))} title="Quitar"><X size={14} /></button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
        <select value={draft} onChange={(e) => setDraft(e.target.value)} style={{ ...fieldStyle, flex: 1 }}>
          <option value="">Elegir modelo…</option>
          {Object.entries(PROVIDER_MODELS).map(([engine, list]) => (
            <optgroup key={engine} label={engine}>
              {list.map((m) => (
                <option key={m.id} value={`${engine}::${m.id}`}>{modelName(engine, m.id)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <LevelSelect id={draft ? withIntensity(draftModel, draftLevel) : ''} onChange={setDraftLevel} />
        <button
          onClick={add}
          disabled={!draft}
          style={{ ...iconBtn, gap: 4, color: 'var(--primary)', fontSize: '0.8rem', alignItems: 'center', fontWeight: 600 }}
        >
          <Plus size={14} /> Añadir
        </button>
      </div>
    </div>
  );
}
