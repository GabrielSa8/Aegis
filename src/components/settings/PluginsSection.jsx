import { useState } from 'react';
import { ShieldCheck, Layers, AlertTriangle } from 'lucide-react';
import { CORE_MODULES, OPTIONAL_PLUGINS, DEFAULT_ENABLED_MODULES } from '../../plugins/pluginRegistry';
import PluginsHeader from './plugins/PluginsHeader';
import CoreModuleCard from './plugins/CoreModuleCard';
import PluginCard from './plugins/PluginCard';
import CommunityPluginsDeck from './plugins/CommunityPluginsDeck';

export default function PluginsSection({ config, setConfig }) {
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const enabledModules = config?.enabledModules || DEFAULT_ENABLED_MODULES;

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const updateModules = (newModules, message) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, enabledModules: newModules };
    });
    if (message) showFeedback(message);
  };

  const handleToggle = (id) => {
    const isCurrentlyEnabled = Boolean(enabledModules[id]);
    const nextState = !isCurrentlyEnabled;
    const updated = { ...enabledModules, [id]: nextState };
    updateModules(
      updated, 
      nextState ? `Módulo "${id}" instalado y activado.` : `Módulo "${id}" desactivado. Recursos liberados.`
    );
  };

  const handleMinimalMode = () => {
    const minimal = {
      finances: false,
      tasks: false,
      sentinel: false,
      devops: false,
      gaming: false
    };
    updateModules(minimal, 'Modo Mínimo activo. Solo Agente, Bóveda y Sistema (~18 MB RAM).');
  };

  const handleEnableAll = () => {
    const all = {
      finances: true,
      tasks: true,
      sentinel: true,
      devops: true,
      gaming: true
    };
    updateModules(all, 'Todos los módulos opcionales instalados y activados.');
  };

  const activeCount = Object.entries(enabledModules)
    .filter(([k, v]) => ['finances', 'tasks', 'sentinel', 'devops', 'gaming'].includes(k) && Boolean(v))
    .length;
  const disabledCount = 5 - activeCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PluginsHeader
        activeCount={activeCount}
        disabledCount={disabledCount}
        feedbackMsg={feedbackMsg}
        onMinimalMode={handleMinimalMode}
        onEnableAll={handleEnableAll}
      />

      {/* 🛡️ 1. Núcleo Base Inamovible */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <ShieldCheck size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Núcleo Inamovible (Siempre Activo)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {CORE_MODULES.map((mod) => (
            <CoreModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      </div>

      {/* ⚠️ Aclaración importante de persistencia */}
      <div style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
        border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
        fontSize: '0.72rem',
        color: 'var(--text-high)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertTriangle size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Aviso de Persistencia:</strong> Ningún cambio será realizado de forma permanente hasta no dar en guardar. Si instalas o desinstalas un módulo, debes pulsar <strong>"Guardar Todo"</strong> en la cabecera superior para que se preserve en tu Dock y sistema.
        </span>
      </div>

      {/* 🧩 2. Catálogo & Extensiones Instaladas */}
      <CommunityPluginsDeck
        enabledModules={enabledModules}
        onToggleModule={handleToggle}
      />
    </div>
  );
}
