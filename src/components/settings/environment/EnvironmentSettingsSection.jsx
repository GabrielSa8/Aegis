import { useEnvironmentSettings } from './useEnvironmentSettings';
import EditorSelectorCard from './EditorSelectorCard';
import TerminalSelectorCard from './TerminalSelectorCard';

export default function EnvironmentSettingsSection({ config, setConfig }) {
  const {
    envConfig,
    installedTools,
    loadingTools,
    testingTool,
    testResult,
    updateEnvironment,
    handleTestTool
  } = useEnvironmentSettings({ config, setConfig });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <EditorSelectorCard
        envConfig={envConfig}
        installedTools={installedTools}
        loadingTools={loadingTools}
        testingTool={testingTool}
        testResult={testResult}
        onUpdateEnvironment={updateEnvironment}
        onTestTool={handleTestTool}
      />

      <TerminalSelectorCard
        envConfig={envConfig}
        installedTools={installedTools}
        loadingTools={loadingTools}
        testingTool={testingTool}
        testResult={testResult}
        onUpdateEnvironment={updateEnvironment}
        onTestTool={handleTestTool}
      />
    </div>
  );
}
