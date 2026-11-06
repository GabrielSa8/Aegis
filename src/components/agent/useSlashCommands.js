import { useState, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { filterSlashCommands, resolveModelByQuery } from './slashCommands';
import {
  withIntensity,
  getIntensityLevel,
  resolveIntensity,
  splitIntensity,
  formatUsageResponse,
  formatModelInspectionResponse,
  formatModelSwitchSuccessResponse,
  formatCreditsResponse,
  parseProviderQuota,
  parseProviderSkills
} from './slashCommandFormatters';

const FALLBACK_QUOTAS = [
  { family: 'Gemini Models', limitType: 'Five Hour Limit Remaining', percent: 82, reset: 'Hoy en ~3h' },
  { family: 'Gemini Models', limitType: 'Weekly Limit Remaining', percent: 8, reset: 'Domingo 12:58 CST' },
  { family: 'Claude and GPT models', limitType: 'Five Hour Limit Remaining', percent: 97, reset: 'Hoy en ~4h' },
  { family: 'Claude and GPT models', limitType: 'Weekly Limit Remaining', percent: 98, reset: '2026-11-06 15:26 CST' },
  { family: 'Gemini 4 Argon', limitType: 'Gemini 4 Argon Weekly Limit', percent: 100, reset: '2026-11-06 15:26 CST' }
];

/**
 * Hook modular para control y ejecución de Slash Commands conectados al proveedor de IA activo
 */
export function useSlashCommands({
  prompt,
  onChangePrompt,
  onClearHistory,
  effortMode,
  onSetEffortMode,
  messages = [],
  activeContext = {},
  currentSessionId,
  onSubmitPrompt,
  activeModel,
  onSelectModel,
  onInjectSystemMessage,
  agentType = 'agy'
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isSlashMode = prompt.startsWith('/') && !prompt.includes('\n');
  const query = isSlashMode ? prompt.slice(1) : '';

  // Filtra comandos considerando estrictamente el proveedor activo
  const filteredCommands = useMemo(() => {
    if (!isSlashMode) return [];
    return filterSlashCommands(query, agentType);
  }, [isSlashMode, query, agentType]);

  const isOpen = isSlashMode && filteredCommands.length > 0;

  // Ejecución de comandos del catálogo o argumentos dinámicos
  const executeCommand = useCallback(
    async (cmdOrString) => {
      const cmdText = typeof cmdOrString === 'string' ? cmdOrString : cmdOrString?.command || '';
      const cmdId = typeof cmdOrString === 'string' ? '' : cmdOrString?.id || '';
      onChangePrompt('');

      // A. Comandos de selección directa o conmutación de modelos según proveedor
      const matchedModel =
        cmdId.startsWith('model-') || cmdText.startsWith('/model ')
          ? resolveModelByQuery(cmdText || cmdId.replace('model-', ''), agentType)
          : null;

      // A0. Intensidad (/intensity low|mid|high)
      if (cmdId.startsWith('intensity-') || cmdText.startsWith('/intensity')) {
        const level = resolveIntensity(cmdText.replace('/intensity', '') || cmdId.replace('intensity-', ''));
        const next = level ? withIntensity(activeModel, level) : null;
        const ok = !!level && !!splitIntensity(activeModel);
        if (ok) onSelectModel?.(next);
        onInjectSystemMessage?.({
          id: 'sys_intensity_' + Date.now(),
          role: 'assistant',
          content: ok
            ? `> [!NOTE] Intensidad Actualizada\n> ### 🎚️ \`${next}\``
            : `> [!WARNING] Intensidad no disponible\n> Modelo activo sin niveles, o argumento inválido (usa low, mid, high).`,
          context: activeContext?.label || 'General',
          timestamp: 'Ahora'
        });
        return;
      }

      if (matchedModel) {
        // Conserva la intensidad vigente al cambiar de modelo
        const lvl = getIntensityLevel(activeModel);
        onSelectModel?.(lvl ? withIntensity(matchedModel.id, lvl) : matchedModel.id);
        if (matchedModel.effort && onSetEffortMode) {
          onSetEffortMode(matchedModel.effort);
        }

        onInjectSystemMessage?.({
          id: 'sys_model_switch_' + Date.now(),
          role: 'assistant',
          content: formatModelSwitchSuccessResponse(matchedModel),
          context: activeContext?.label || 'General',
          timestamp: 'Ahora'
        });
        return;
      }

      // B. Inspección de modelo (/model sin argumentos) -> NUNCA conmuta effortMode
      if (cmdId === 'model' || cmdText === '/model') {
        try {
          const rawOutput = await invoke('execute_provider_command', { command: '/model' });
          onInjectSystemMessage?.({
            id: 'sys_model_info_' + Date.now(),
            role: 'assistant',
            cardType: 'model',
            cardData: { activeModel, agentType },
            content: formatModelInspectionResponse(activeModel, rawOutput, agentType),
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (e) {
          onInjectSystemMessage?.({
            id: 'sys_model_info_' + Date.now(),
            role: 'assistant',
            cardType: 'model',
            cardData: { activeModel, agentType },
            content: formatModelInspectionResponse(activeModel, null, agentType),
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // C. Cuotas reales de la cuenta (/usage) -> Soportado en agy, claude y codex
      if (cmdId === 'usage' || cmdText === '/usage') {
        try {
          const cfg = await invoke('get_aegis_config').catch(() => null);
          const currentAgentType = cfg?.agentType || agentType || 'agy';
          const commandToRun = (currentAgentType === 'claude' || currentAgentType === 'anthropic') ? '/cost' : '/usage';
          const rawOutput = await invoke('execute_provider_command', { command: commandToRun });
          const parsedQuotas = parseProviderQuota(rawOutput, currentAgentType);
          onInjectSystemMessage?.({
            id: 'sys_usage_' + Date.now(),
            role: 'assistant',
            cardType: 'usage',
            cardData: { quotas: parsedQuotas || [], provider: currentAgentType, raw: rawOutput },
            content: '',
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (e) {
          const totalChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
          const estTokens = Math.round(totalChars / 4);
          onInjectSystemMessage?.({
            id: 'sys_usage_' + Date.now(),
            role: 'assistant',
            cardType: 'usage',
            cardData: { quotas: [], provider: agentType, tokens: estTokens, messagesCount: messages.length },
            content: '',
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // D. Compactar memoria del agente (/compact)
      if (cmdId === 'compact' || cmdText === '/compact') {
        onSubmitPrompt?.(
          '/compact Por favor resume y compacta de forma concisa todo el contexto acumulado en esta conversación para liberar memoria en la ventana de contexto y optimizar la cuota de tokens.'
        );
        return;
      }

      // E. Saldo y créditos (/credits) -> Exclusivo de agy / G1
      if (cmdId === 'credits' || cmdText === '/credits') {
        try {
          const rawCredits = await invoke('execute_provider_command', { command: '/credits' });
          onInjectSystemMessage?.({
            id: 'sys_credits_' + Date.now(),
            role: 'assistant',
            cardType: 'credits',
            cardData: { credits: '0 G1' },
            content: formatCreditsResponse(rawCredits),
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (e) {
          onInjectSystemMessage?.({
            id: 'sys_credits_' + Date.now(),
            role: 'assistant',
            cardType: 'credits',
            cardData: { credits: '0 G1' },
            content: formatCreditsResponse(null),
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // F. Costo acumulado (/cost) -> Exclusivo de Claude Code
      if (cmdId === 'cost' || cmdText === '/cost') {
        try {
          const costRaw = await invoke('execute_provider_command', { command: '/cost' });
          onInjectSystemMessage?.({
            id: 'sys_cost_' + Date.now(),
            role: 'assistant',
            content: `> [!NOTE] Costo de Sesión en Claude Code\n\`\`\`text\n${costRaw.trim()}\n\`\`\``,
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (e) {
          onInjectSystemMessage?.({
            id: 'sys_cost_' + Date.now(),
            role: 'assistant',
            content: `> [!NOTE] Costo de Sesión\nNo se pudo consultar telemetría de costo en el proveedor activo.`,
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // G. Skills del agente (/skills)
      if (cmdId === 'skills' || cmdText === '/skills') {
        try {
          const skillsRaw = await invoke('execute_provider_command', { command: '/skills' });
          const parsedSkills = parseProviderSkills(skillsRaw);
          onInjectSystemMessage?.({
            id: 'sys_skills_' + Date.now(),
            role: 'assistant',
            cardType: 'skills',
            cardData: { skills: parsedSkills },
            content: `> [!NOTE] Skills Activas en el Agente\n\`\`\`text\n${skillsRaw.trim().slice(0, 2000)}\n\`\`\``,
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (e) {
          onInjectSystemMessage?.({
            id: 'sys_skills_' + Date.now(),
            role: 'assistant',
            cardType: 'skills',
            cardData: { skills: [] },
            content: `> [!NOTE] Skills Activas\nConsulta la pestaña **DevOps** para gestionar el catálogo en disco.`,
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // H. Limpiar pantalla (/clear)
      if (cmdId === 'clear' || cmdText === '/clear') {
        onClearHistory?.();
        return;
      }

      // H2. Hermes Cortex (/cortex)
      if (cmdId === 'cortex' || cmdText === '/cortex') {
        try {
          const telemetry = await invoke('cortex_get_telemetry');
          onInjectSystemMessage?.({
            id: 'sys_cortex_' + Date.now(),
            role: 'assistant',
            cardType: 'cortex',
            cardData: telemetry,
            content: '',
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        } catch (err) {
          onInjectSystemMessage?.({
            id: 'sys_cortex_' + Date.now(),
            role: 'assistant',
            content: `> [!WARNING]\n> Error consultando Hermes Cortex: ${err}`,
            context: activeContext?.label || 'General',
            timestamp: 'Ahora'
          });
        }
        return;
      }

      // I. Pegar portapapeles (/clip)
      if (cmdId === 'clip' || cmdText === '/clip') {
        try {
          if (navigator?.clipboard?.readText) {
            const clipText = await navigator.clipboard.readText();
            onChangePrompt(clipText ? clipText.trim() : '');
          }
        } catch (e) {
          console.warn('Error leyendo portapapeles:', e);
        }
        return;
      }

      // J. Inyectar Git Diff (/diff)
      if (cmdId === 'diff' || cmdText === '/diff') {
        try {
          const repoPath = activeContext?.path || '.';
          const details = await invoke('get_git_repo_details', { path: repoPath });
          const diffContent = details?.diff || '';
          if (diffContent.trim()) {
            onChangePrompt(`Revisa este git diff y resume los cambios:\n\`\`\`diff\n${diffContent.slice(0, 4000)}\n\`\`\`\n`);
          } else {
            onChangePrompt('No hay cambios sin confirmar en el workspace activo (working tree limpio).');
          }
        } catch (e) {
          onChangePrompt(`Error al obtener git diff: ${e}`);
        }
        return;
      }
    },
    [
      onChangePrompt,
      onSelectModel,
      onSetEffortMode,
      onInjectSystemMessage,
      activeModel,
      activeContext,
      messages,
      onSubmitPrompt,
      onClearHistory,
      agentType
    ]
  );

  const handleSlashKeyDown = useCallback(
    (e) => {
      if (!isOpen) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return true;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return true;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const targetCmd = filteredCommands[selectedIndex] || filteredCommands[0];
        if (targetCmd) {
          executeCommand(targetCmd);
        }
        return true;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onChangePrompt('');
        return true;
      }

      return false;
    },
    [isOpen, filteredCommands, selectedIndex, executeCommand, onChangePrompt]
  );

  return {
    isOpen,
    filteredCommands,
    selectedIndex,
    executeCommand,
    handleSlashKeyDown
  };
}
