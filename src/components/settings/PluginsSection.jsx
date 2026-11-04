import { useState } from 'react';
import { ShieldCheck, Layers } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
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
      const updated = { ...prev, enabledModules: newModules };
      invoke('save_aegis_config', { config: updated }).catch(console.error);
      window.dispatchEvent(new CustomEvent('aegis:modules-changed', { detail: newModules }));
      return updated;
    });
    if (message) showFeedback(message);
  };

  const handleToggle = (id) => {
    const isCurrentlyEnabled = enabledModules[id] !== false;
    const nextState = !isCurrentlyEnabled;
    const updated = { ...enabledModules, [id]: nextState };
    updateModules(
      updated, 
      nextState ? `Módulo "${id}" activado.` : `Módulo "${id}" desactivado. Recursos liberados.`
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
    updateModules(minimal, 'Modo Mínimo Soberano activo. Solo Agente y Bóveda.');
  };

  const handleEnableAll = () => {
    const all = {
      finances: true,
      tasks: true,
      sentinel: true,
      devops: true,
      gaming: true
    };
    updateModules(all, 'Todos los módulos opcionales activados.');
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

      {/* 🧩 2. Plugins Opcionales & Desacoplables */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <Layers size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Plugins Opcionales & Descargables
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {OPTIONAL_PLUGINS.map((plug) => (
            <PluginCard
              key={plug.id}
              plugin={plug}
              isEnabled={enabledModules[plug.id] !== false}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* 🚀 3. Ecosistema de Extensiones y Sideloading (Fase G.5.1) */}
      <CommunityPluginsDeck />
    </div>
  );
}
