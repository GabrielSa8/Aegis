import React from 'react';
import AiBudgetSection from '../AiBudgetSection';
import AegisHarnessCard from '../AegisHarnessCard';

export function AiHub({ config, setConfig, updateTokenBudget, onOpenExternal }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <AegisHarnessCard config={config} setConfig={setConfig} />
      <AiBudgetSection
        config={config}
        setConfig={setConfig}
        updateTokenBudget={updateTokenBudget}
        onOpenExternal={onOpenExternal}
      />
    </div>
  );
}
export default AiHub;
