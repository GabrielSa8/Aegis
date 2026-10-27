import { GitBranch, Shield, Zap, Terminal, CheckCircle2 } from 'lucide-react';

export default function DevOpsView() {
  const repos = [
    {
      name: 'TADÚ Mobility Platform',
      path: '/home/zabrielsa/Proyects/projects/TADU',
      branch: 'desarrollo',
      stack: 'Python 3.12 · AWS SAM · DynamoDB Single-Table',
      status: 'Clean (git add -A prohibido)'
    },
    {
      name: 'Granja Android App',
      path: '/home/zabrielsa/Proyects/projects/granja',
      branch: 'main',
      stack: 'Kotlin · Jetpack Compose · SoundPool · Material 3',
      status: 'En pruebas locales'
    },
    {
      name: 'Aegis Master Cockpit',
      path: '/home/zabrielsa/Proyects/projects/Aegis',
      branch: 'main',
      stack: 'Tauri v2 · Rust · React 19 · TypeScript · Tailwind',
      status: 'Hito 1 Activo (Nordic Slate)'
    },
    {
      name: 'BrainIA (Obsidian Vault)',
      path: '/home/zabrielsa/Documentos/Obsidian Vault',
      branch: 'main',
      stack: 'Markdown · Frontmatter YAML · 5 Hubs MOC',
      status: 'Sincronizado GitHub (3ffddd2)'
    }
  ];

  const skills = [
    { name: 'impeccable', desc: 'Auditoría y lenguaje de diseño profesional (craft, critique, audit, harden)' },
    { name: 'ponytail', desc: 'Pragmatismo senior (escalera de 7 peldaños contra sobre-ingeniería)' },
    { name: 'superpowers', desc: 'Metodología rigurosa (skill check obligatorio, brainstorming, TDD)' },
    { name: 'find-skills', desc: 'Búsqueda e instalación de skills desde el ecosistema abierto' },
    { name: 'frontend-design', desc: 'Diseño visual intencional, anti-AI-slop y paletas sin azul genérico' },
    { name: 'diagram-design', desc: 'Diagramas HTML/SVG de grado editorial sin dependencias' },
    { name: 'browser-automation', desc: 'Automatización web en Fedora con Playwright/Chromium' },
    { name: 'tadu-backend', desc: 'Reglas estrictas de TADÚ, DynamoDB y compuerta SAM' },
    { name: 'clean-code-security', desc: 'Código limpio, KISS/YAGNI, early returns y OWASP' },
    { name: 'tdd-practitioner', desc: 'Ciclo Red-Green-Refactor y pruebas deterministas' },
    { name: 'obsidian-vault-architect', desc: 'Mantenimiento de 5 Hubs y Frontmatter estricto' },
    { name: 'jetpack-compose-patterns', desc: 'Patrones modernos Android con Compose y ciclo de vida' },
    { name: 'react-ts-performance', desc: 'React 19 con TS estricto y optimización de re-renders' },
    { name: 'input-filter-optimization', desc: 'Supresión de ruido en terminal y lecturas quirúrgicas' },
    { name: 'skill-evolver', desc: 'Bucle de auto-mejora continua de playbooks del agente' },
    { name: 'project-architect-ideation', desc: 'Diseño arquitectónico y trade-offs desde segundo 1' },
    { name: 'skill-project-router', desc: 'Detección automática de stack y asignación de skills' },
    { name: 'project-postmortem-retrospective', desc: 'Auditoría post-mortem al concluir hitos y lecciones' },
    { name: 'feynman-technique-mentor', desc: 'Descomposición de conceptos y preguntas socráticas' },
    { name: 'spaced-repetition-generator', desc: 'Generador de flashcards atómicas para Anki/Obsidian' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <GitBranch color="#10b981" size={18} />
            Radar DevOps & Arsenal de Habilidades
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Flota Git local y 20 skills activas
          </p>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 600 }}>
          20 Skills Activas
        </div>
      </div>

      {/* Git Fleet Section */}
      <div>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Flota de Repositorios Locales
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {repos.map((repo, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-high)' }}>{repo.name}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: '#a7f3d0', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600 }}>
                    {repo.branch}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{repo.stack}</p>
                <code style={{ fontSize: '0.65rem', color: '#52615a', display: 'block', marginTop: '4px' }}>{repo.path}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399', fontWeight: 500, borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                <CheckCircle2 size={12} />
                <span>{repo.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Arsenal Activo (~/.agents/skills/)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '6px'
        }}>
          {skills.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={12} color="#10b981" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)' }}>{s.name}</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
