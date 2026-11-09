export const AVAILABLE_SKILLS = [
  'caveman',
  'caveman-commit',
  'cavecrew',
  'input-filter-optimization',
  'superpowers',
  'ponytail',
  'clean-code-security',
  'tdd-practitioner',
  'grill-me',
  'codebase-design',
  'improve-codebase-architecture',
  'triage',
  'git-guardrails-claude-code',
  'project-architect-ideation',
  'project-postmortem-retrospective',
  'frontend-design',
  'impeccable',
  'react-ts-performance',
  'obsidian-vault-architect',
  'feynman-technique-mentor',
  'spaced-repetition-generator',
  'skill-project-router',
  'find-skills',
  'skill-evolver',
  'browser-automation',
  'diagram-design',
  'jetpack-compose-patterns'
];

export const DEFAULT_CONTEXTS = [
  {
    id: 'general',
    label: 'General & Bóveda',
    path: '',
    effort: 'low',
    skills: [
      'caveman',
      'superpowers',
      'ponytail',
      'input-filter-optimization',
      'obsidian-vault-architect',
      'skill-project-router',
      'find-skills'
    ]
  },
  {
    id: 'backend',
    label: 'Backend & Arquitectura',
    path: '',
    effort: 'high',
    skills: [
      'caveman',
      'superpowers',
      'ponytail',
      'clean-code-security',
      'tdd-practitioner',
      'codebase-design',
      'improve-codebase-architecture',
      'project-architect-ideation',
      'triage',
      'git-guardrails-claude-code',
      'caveman-commit',
      'cavecrew'
    ]
  },
  {
    id: 'frontend',
    label: 'Frontend & UI/UX',
    path: '',
    effort: 'high',
    skills: [
      'caveman',
      'superpowers',
      'ponytail',
      'frontend-design',
      'impeccable',
      'react-ts-performance',
      'clean-code-security'
    ]
  },
  {
    id: 'research',
    label: 'Investigación & Diseño',
    path: '',
    effort: 'low',
    skills: [
      'caveman',
      'superpowers',
      'grill-me',
      'obsidian-vault-architect',
      'feynman-technique-mentor',
      'spaced-repetition-generator',
      'skill-evolver'
    ]
  }
];
