import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Bot, Terminal, ExternalLink, FolderGit2, Copy, Check, FileText } from 'lucide-react';
import { TacticalButton } from '../ui/TacticalButton';
import { queueMacro } from '../agent/macroBus';

export function TaskInspectorActions({ task }) {
  const [copied, setCopied] = useState(false);
  const [openingEditor, setOpeningEditor] = useState(false);

  if (!task) return null;

  const handleCopyLink = () => {
    const linkText = `[[${task.file_name.replace(/\.md$/i, '')}#L${task.line_number}]]`;
    navigator.clipboard.writeText(linkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOpenInVault = () => {
    window.dispatchEvent(
      new CustomEvent('aegis:open-vault-note', {
        detail: { path: task.file_path, relative_path: task.relative_path }
      })
    );
    window.dispatchEvent(new CustomEvent('aegis:switch-tab', { detail: { tab: 'vault' } }));
  };

  const handleOpenInEditor = async (editor = 'cursor') => {
    try {
      setOpeningEditor(true);
      await invoke('open_repo_in_editor', { path: task.file_path, editor });
    } catch (err) {
      console.warn('Error abriendo editor externo:', err);
    } finally {
      setOpeningEditor(false);
    }
  };

  const handleAskAgent = () => {
    const prompt =
      `Analiza y ayúdame a resolver la siguiente tarea de mi flujo diario:\n\n` +
      `📌 Tarea: "${task.cleanText}"\n` +
      `📁 Proyecto: ${task.project} (Hub: ${task.hub})\n` +
      `📄 Archivo: ${task.relative_path} (Línea ${task.line_number})\n` +
      (task.dueDate ? `📅 Vencimiento: ${task.dueDate}\n` : '') +
      (task.priority === 'high' ? `🔥 Prioridad: ALTA\n` : '') +
      (task.isBlocked ? `⛔ Bloqueada por: "${task.blockingTask?.cleanText || task.dependsOn}"\n` : '');

    queueMacro(
      {
        id: 'macro-task-solve',
        label: 'Resolver Tarea',
        text: prompt
      },
      false
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Sección de Origen en Bóveda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Origen en Bóveda Obsidian
        </label>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.72rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-high)' }}>
              <FileText size={13} color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>{task.file_name}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>
              L{task.line_number}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem', wordBreak: 'break-all' }}>
            {task.relative_path}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <TacticalButton size="xs" variant="secondary" onClick={handleOpenInVault} icon={<FolderGit2 size={11} />}>
              Ver en Bóveda
            </TacticalButton>
            <TacticalButton size="xs" variant="ghost" onClick={handleCopyLink} icon={copied ? <Check size={11} /> : <Copy size={11} />}>
              {copied ? 'Copiado' : 'Copiar WikiLink'}
            </TacticalButton>
          </div>
        </div>
      </div>

      {/* Acciones Contextuales Directas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Acciones Contextuales
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <TacticalButton
            variant="primary"
            size="sm"
            onClick={handleAskAgent}
            icon={<Bot size={13} />}
            style={{ justifyContent: 'center' }}
          >
            Consultar al Agente IA
          </TacticalButton>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <TacticalButton
              variant="secondary"
              size="xs"
              onClick={() => handleOpenInEditor('cursor')}
              disabled={openingEditor}
              icon={<Terminal size={11} />}
              style={{ justifyContent: 'center' }}
            >
              Abrir en Cursor
            </TacticalButton>
            <TacticalButton
              variant="secondary"
              size="xs"
              onClick={() => handleOpenInEditor('code')}
              disabled={openingEditor}
              icon={<ExternalLink size={11} />}
              style={{ justifyContent: 'center' }}
            >
              Abrir en Code
            </TacticalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
