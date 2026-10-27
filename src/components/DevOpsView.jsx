import { GitBranch, Shield, Zap, Terminal, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function DevOpsView() {
  const repos = [
    {
      name: 'TADÚ Mobility Platform',
      path: '/home/zabrielsa/Proyects/projects/TADU',
      branch: 'desarrollo',
      stack: 'Python 3.12 · AWS SAM · DynamoDB Single-Table',
      status: 'Clean (git add -A prohibido)',
      verified: true
    },
    {
      name: 'Granja Android App',
      path: '/home/zabrielsa/Proyects/projects/granja',
      branch: 'main',
      stack: 'Kotlin · Jetpack Compose · SoundPool · Material 3',
      status: 'En pruebas locales',
      verified: true
    },
    {
      name: 'Aegis Master Cockpit',
      path: '/home/zabrielsa/Proyects/projects/Aegis',
      branch: 'main',
      stack: 'Tauri v2 · Rust · React 19 · TypeScript · Tailwind',
      status: 'Hito 1 Activo (d457b5c)',
      verified: true
    },
    {
      name: 'BrainIA (Obsidian Vault)',
      path: '/home/zabrielsa/Documentos/Obsidian Vault',
      branch: 'main',
      stack: 'Markdown · Frontmatter YAML · 5 Hubs MOC',
      status: 'Sincronizado GitHub (670e1b3)',
      verified: true
    }
  ];

  const skills = [
    { name: 'diagram-design', desc: 'Diagramas HTML/SVG de grado editorial sin Mermaid' },
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', overflowY: 'auto' }}>
      {/* Top Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch color="#6366f1" size={20} />
            Radar DevOps & Arsenal de Habilidades
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Monitor de flota Git local y playbooks de ingeniería activos
          </p>
        </div>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600 }}>
          15 Skills Activas
        </div>
      </div>

      {/* Git Fleet Section */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Flota de Repositorios Locales
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {repos.map((repo, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{repo.name}</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 600 }}>
                    {repo.branch}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{repo.stack}</p>
                <code style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '6px' }}>{repo.path}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#34d399', fontWeight: 500, borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                <CheckCircle2 size={13} />
                <span>{repo.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arsenal Skills Section */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Arsenal de 15 Agent Skills (~/.agents/skills/)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '8px'
        }}>
          {skills.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(17, 24, 39, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="#818cf8" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>{s.name}</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: 1.3 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
