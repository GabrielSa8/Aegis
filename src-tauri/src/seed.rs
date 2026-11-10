use std::fs;
use std::path::{Path, PathBuf};

fn get_aegis_config_dir() -> PathBuf {
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
        if !xdg.is_empty() {
            return PathBuf::from(xdg).join("aegis");
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join(".config").join("aegis");
    }
    PathBuf::from(".config/aegis")
}

fn get_global_skills_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".agents").join("skills")
}

/// Contrato estático ultracompacto alineado para KV-Cache en `harness.rs`.
pub fn get_compact_brain_contract() -> &'static str {
    "- Brain Engineering Contract: SDD/TDD, Jidoka (raíz antes de parchar), Módulos Profundos (≤300 líneas/archivo, DRY, cero #hex fijos -> var(--*)), Skill-First + Subagentes comprimidos, Git quirúrgico por ruta (Conventional Commits en inglés), SemVer por Hitos (PATCH 1.0.1 fixes | MINOR 1.1.0 features/hitos | MAJOR 2.0.0 breaking), Cero Respuestas Declarativas Vacías (órdenes de acción exigen invocar tools en el mismo turno) y Visto Bueno explícito antes de commit/release.\n"
}

/// Contenido íntegro de fábrica para `~/.config/aegis/BRAIN.md` (Nivel Principal Engineer).
pub const FACTORY_BRAIN_MARKDOWN: &str = r#"# 🛡️ Aegis Sovereign Brain — Principal Engineer Directives

## 1. Spec-Driven & Test-Driven Development (SDD + TDD + YAGNI)
- **Claridad antes de Código (`grill-me` / `superpowers`):** Ante requerimientos ambiguos o diseños complejos, alinear las decisiones clave antes de escribir código. Prohibido programar sobre supuestos silenciosos.
- **Ciclo Red-Green-Refactor (`tdd-practitioner`):** Toda nueva lógica de negocio o corrección de bug debe respaldarse con pruebas deterministas reales (`cargo test`, `vitest`, `pytest`).
- **Simplicidad Senior (`ponytail`):** Aplicar YAGNI estricto: la modificación más pequeña y limpia que resuelve el problema real de raíz, sin abstracciones especulativas ni dependencias innecesarias.

## 2. Lean Engineering, Jidoka (Andon Cord) y Aislamiento Quirúrgico
- **Navegación Quirúrgica (`input-filter-optimization`):** Restringir lecturas e intervenciones exclusivamente a los archivos y rangos de líneas afectados. Prohibido ejecutar escaneos globales masivos que contaminen la ventana de contexto.
- **Principio Jidoka / Andon Cord (`triage`):** Si un comando, compilación o test falla, detener la cadena de inmediato. Aislar y comprender la causa raíz antes de aplicar cualquier cambio; prohibido apilar parches por ensayo y error.

## 3. Arquitectura de Módulos Profundos, Anti-Monolitos y Cero Hardcode
- **Módulos Profundos (`codebase-design` / `improve-codebase-architecture`):** Diseñar módulos con interfaz pequeña y mucha lógica encapsulada (*Deep Modules*).
- **Límite Anti-Monolitos (`clean-code-security`):** Ningún componente o archivo de interfaz debe superar `250–300` líneas. Si crece, desarticular en subcomponentes atómicos, custom hooks (`use*.js`) y funciones puras.
- **Cero Hardcode & Tematización Semántica:** Prohibido quemar rutas absolutas privadas, secretos o colores hexadecimales fijos (`#hex`) en UI. Utilizar exclusivamente variables semánticas (`var(--primary)`, `var(--bg-card)`, `var(--text-high)`, `color-mix(in srgb, ...)`).

## 4. Principio Skill-First & Orquestación de Subagentes Paralelos
- **Activación Obligatoria (`skill-project-router` / `find-skills`):** Evaluar y activar las skills vinculadas al contexto activo antes de tocar archivos. Si falta una capacidad de dominio, descubrirla e instalarla con `npx -y skills find <query>`.
- **Delegación Comprimida (`cavecrew`):** Delegar búsquedas amplias, auditorías paralelas o subtareas independientes a subagentes con salida comprimida (~60% ahorro de contexto).

## 5. Higiene Git Quirúrgica & Conventional Commits en Inglés
- **Guardrails de Git (`git-guardrails-claude-code`):** Prohibido usar `git add -A`, `git clean -fdx`, `git reset --hard` o `git push --force` sin orden explícita. Agregar siempre archivos puntualmente por ruta (`git add <path>`).
- **Idioma y Formato (`caveman-commit`):** Todo commit en repositorios de código se redacta en **inglés técnico imperativo** bajo Conventional Commits (`type(scope): summary`, `≤ 72` chars).

## 6. Doctrina SemVer Estricta por Hitos (`1.0.0` / `1.0.1` / `1.1.0`)
- **`PATCH` (`1.0.1`, `1.0.2`):** Bugfixes, correcciones de regresiones, parches de seguridad y optimizaciones internas de rendimiento o refactor sin nuevas funcionalidades ni cambios de contrato.
- **`MINOR` (`1.1.0`, `1.2.0`):** Hitos funcionales completos, nuevos módulos, pestañas o capacidades de producto retrocompatibles.
- **`MAJOR` (`1.0.0`, `2.0.0`):** Hitos arquitectónicos fundacionales o cambios incompatibles con versiones previas (*breaking changes*).
- **Sincronización de Manifiestos:** Mantener versión idéntica en todos los manifiestos del proyecto (`package.json`, `Cargo.toml`, `tauri.conf.json`, etc.) en cada cierre de hito para garantizar compatibilidad con auto-updaters.

## 7. Memoria Viva en Bóveda & Regla de Visto Bueno
- **Cero Conocimiento Volátil (`obsidian-vault-architect`):** Toda decisión arquitectónica, bug resuelto o avance de hito se documenta en la bóveda Markdown (bitácora y nota del proyecto).
- **Prohibición de Respuestas Declarativas Vacías:** Ante verbos de acción ("ejecuta", "aplica", "escribe", "corrige", "modifica"), el agente DEBE invocar las herramientas de edición o terminal (`edit_file`, `write_file`, `run_command`) en ese mismo turno. Prohibido responder con mensajes pasivos ("Listo", "Contrato activo", "Esperando instrucciones") sin ejecutar la acción solicitada.
- **Compuerta de Visto Bueno y Desarrollo Ágil:** Iterar siempre en caliente (HMR / dev server). **Prohibido ejecutar commits en Git, cerrar tareas o lanzar compilaciones release pesadas hasta recibir el visto bueno explícito del operador.**
"#;

const BASE_SKILLS_SEED: &[(&str, &str)] = &[
    (
        "caveman",
        "---\nname: caveman\ndescription: Ultra-compressed communication mode (~75% fewer output tokens) while preserving 100% technical accuracy. Direct to code, commands, and actionable solutions.\n---\n\n# Caveman Mode\n- Drop filler, pleasantries, hedging, and unrequested explanations.\n- Output executable code, exact commands, and concise technical bullets.\n- Keep 100% precision in code blocks, paths, and identifiers.\n",
    ),
    (
        "caveman-commit",
        "---\nname: caveman-commit\ndescription: Conventional Commits generator in imperative English (<=50 chars subject, body only when why is non-obvious).\n---\n\n# Caveman Commit\n- Format: `<type>(<scope>): <imperative summary in English>` (<= 50-72 chars).\n- Stage files explicitly by path (`git add <file>`), never `git add -A`.\n",
    ),
    (
        "cavecrew",
        "---\nname: cavecrew\ndescription: Delegate exploration, isolated edits, and diff reviews to subagents with caveman-compressed output (~60% context savings).\n---\n\n# Cavecrew Subagent Delegation\n- Spawn subagents for broad repository exploration or independent parallel checks.\n- Require subagents to return ultra-compressed findings (`file:line`, root cause, exact fix).\n",
    ),
    (
        "input-filter-optimization",
        "---\nname: input-filter-optimization\ndescription: High-efficiency input filtering and surgical file reading playbook to minimize input token consumption and context bloat.\n---\n\n# Input Filter Optimization\n- Read only affected line ranges instead of entire large files.\n- Filter terminal output (`--quiet`, `head`, `tail`, `grep`) and skip lockfiles/build artifacts.\n",
    ),
    (
        "superpowers",
        "---\nname: superpowers\ndescription: Complete engineering methodology framework (Socratic design alignment, structured planning, strict TDD, systematic debugging, and pre-completion verification).\n---\n\n# Superpowers Engineering Discipline\n1. Check applicable skills before acting.\n2. Clarify design & edge cases before coding.\n3. Follow Red-Green-Refactor TDD and systematic root-cause debugging.\n4. Verify build and tests before claiming completion.\n",
    ),
    (
        "ponytail",
        "---\nname: ponytail\ndescription: Senior YAGNI minimalism: the smallest, cleanest change that solves the real problem without over-engineering or bloat.\n---\n\n# Ponytail (Senior Minimalism)\n- Prefer standard library and existing project primitives over new dependencies.\n- Solve the exact problem requested with the smallest surface area.\n",
    ),
    (
        "clean-code-security",
        "---\nname: clean-code-security\ndescription: Global standard for modular, resilient, and secure code (SRP, <=300 lines per component, DRY, OWASP Top 10, defensive error handling).\n---\n\n# Clean Code & Security\n- Enforce Single Responsibility Principle and <= 250-300 lines per file/component.\n- Reuse shared UI primitives and hooks (DRY).\n- Validate inputs, sanitize paths, and never hardcode secrets or #hex colors.\n",
    ),
    (
        "tdd-practitioner",
        "---\nname: tdd-practitioner\ndescription: Test-Driven Development playbook (Red-Green-Refactor) across Rust, TypeScript/JavaScript, Python, and Kotlin.\n---\n\n# TDD Practitioner\n- Write or update automated tests reproducing the requirement or bug first.\n- Implement minimal code to pass, then refactor cleanly.\n",
    ),
    (
        "grill-me",
        "---\nname: grill-me\ndescription: Relentless Socratic design-tree interview to resolve every ambiguity and decision branch before coding.\n---\n\n# Grill Me — Design Tree Interview\n- Map open design decisions as a tree and ask the current frontier of independent questions in numbered rounds (`❓ Q1`, `➡️ Recommended answer`).\n- Look up codebase facts yourself; only ask the user for architectural/product decisions.\n",
    ),
    (
        "codebase-design",
        "---\nname: codebase-design\ndescription: Deep module architecture design: small interfaces hiding substantial implementation at clean, testable seams.\n---\n\n# Codebase Design (Deep Modules)\n- Maximize module depth: small, simple interface + deep implementation.\n- Apply the deletion test against shallow pass-through wrappers.\n- Test through the module's public seam.\n",
    ),
    (
        "improve-codebase-architecture",
        "---\nname: improve-codebase-architecture\ndescription: Audit codebase hot spots for shallow modules, coupling, and poor locality, proposing high-leverage deep module refactors.\n---\n\n# Improve Codebase Architecture\n- Inspect git hotspots and coupled files.\n- Identify shallow pass-through layers and propose deep-module consolidation with clear before/after trade-offs.\n",
    ),
    (
        "triage",
        "---\nname: triage\ndescription: Systematic bug and issue triage protocol: reproduce, isolate root cause, verify claims, and produce an actionable engineering brief.\n---\n\n# Triage Protocol\n1. Gather context and check for existing implementations.\n2. Reproduce the bug or verify the behavior in code/tests.\n3. Isolate root cause and define a surgical remediation brief.\n",
    ),
    (
        "git-guardrails-claude-code",
        "---\nname: git-guardrails-claude-code\ndescription: Deterministic Git safety guardrails blocking destructive commands (push --force, reset --hard, clean -fdx, checkout .).\n---\n\n# Git Safety Guardrails\n- Never run `git reset --hard`, `git clean -fdx`, `git checkout .`, or `git push --force` without explicit user confirmation.\n- Stage files individually by path (`git add <file>`).\n",
    ),
    (
        "project-architect-ideation",
        "---\nname: project-architect-ideation\ndescription: Full-lifecycle software architecture and ideation playbook: stack trade-offs, data modeling, complexity matrix, and MVP-to-Prod roadmap.\n---\n\n# Project Architect & Ideation\n- Evaluate stack trade-offs, data schemas, and security boundaries from day 1.\n- Structure execution into verifiable milestones (MVP -> Hardening -> Release).\n",
    ),
    (
        "frontend-design",
        "---\nname: frontend-design\ndescription: Intentional, high-craft UI/UX design system guidance using semantic CSS theme variables, clear hierarchy, and zero generic templates.\n---\n\n# Frontend Design\n- Use semantic CSS variables (`var(--primary)`, `var(--bg-card)`, `var(--text-high)`) and `color-mix()`.\n- Maintain crisp visual hierarchy, keyboard accessibility, and responsive layouts.\n",
    ),
    (
        "react-ts-performance",
        "---\nname: react-ts-performance\ndescription: Modern React & TypeScript performance engineering: zero unnecessary re-renders, modular custom hooks, and fast tab transitions.\n---\n\n# React & TypeScript Performance\n- Prevent render cascades with modular state, `useMemo`/`useCallback`, and module-level Stale-While-Revalidate caches.\n- Keep components under 250-300 lines.\n",
    ),
    (
        "obsidian-vault-architect",
        "---\nname: obsidian-vault-architect\ndescription: Personal Knowledge Management (PKM) and Obsidian Vault architecture: MOC hubs, YAML frontmatter, wikilinks, and Mermaid diagrams.\n---\n\n# Obsidian Vault Architect\n- Maintain clean YAML frontmatter, `[[Wikilinks]]`, and valid Mermaid diagrams.\n- Log engineering decisions, root causes, and milestone states continuously.\n",
    ),
    (
        "feynman-technique-mentor",
        "---\nname: feynman-technique-mentor\ndescription: Accelerated technical mastery using the Feynman Technique: first-principles mental models, analogies, and gap detection.\n---\n\n# Feynman Technique Mentor\n- Deconstruct complex systems into clear first-principles mental models.\n- Identify knowledge gaps and verify comprehension with boundary questions.\n",
    ),
    (
        "spaced-repetition-generator",
        "---\nname: spaced-repetition-generator\ndescription: Atomic flashcard generator (Q::A and cloze deletions) for high-retention engineering study and certification prep.\n---\n\n# Spaced Repetition Generator\n- Convert technical concepts into atomic `Q::A` and cloze flashcards.\n",
    ),
    (
        "skill-project-router",
        "---\nname: skill-project-router\ndescription: Dynamic skill dispatcher that inspects project tech stacks and binds the optimal domain skills automatically.\n---\n\n# Skill Project Router\n- Detect repository stack (`Cargo.toml`, `package.json`, `pyproject.toml`) and activate matching domain skills before coding.\n",
    ),
    (
        "find-skills",
        "---\nname: find-skills\ndescription: Discover, evaluate, and install open-source Agent Skills via `npx -y skills find` and `npx -y skills add`.\n---\n\n# Find Skills\n- Search open-source skills with `npx -y skills find <query>` and install verified playbooks into `~/.agents/skills/`.\n",
    ),
    (
        "skill-evolver",
        "---\nname: skill-evolver\ndescription: Continuous self-improvement playbook that captures debugging lessons and architectural patterns into persistent skills and brain notes.\n---\n\n# Skill Evolver\n- Synthesize recurring fixes and user corrections into durable rules and `SKILL.md` updates.\n",
    ),
];

/// Siembra silenciosa y no destructiva de `BRAIN.md` y del pack de 22 skills base al iniciar Aegis.
pub fn ensure_factory_brain_and_skills() {
    // 1. Sembrar ~/.config/aegis/BRAIN.md
    let cfg_dir = get_aegis_config_dir();
    let _ = fs::create_dir_all(&cfg_dir);
    let brain_path = cfg_dir.join("BRAIN.md");
    if !brain_path.exists() {
        let _ = fs::write(&brain_path, FACTORY_BRAIN_MARKDOWN);
    }

    // 2. Sembrar pack de skills base en ~/.agents/skills/<id>/SKILL.md (solo si no existen)
    let skills_root = get_global_skills_dir();
    let _ = fs::create_dir_all(&skills_root);
    for (skill_id, skill_content) in BASE_SKILLS_SEED {
        let skill_dir = skills_root.join(skill_id);
        let skill_md = skill_dir.join("SKILL.md");
        if !skill_md.exists() {
            let _ = fs::create_dir_all(&skill_dir);
            let _ = fs::write(&skill_md, skill_content);
        }
    }
}

/// Siembra `00 Sistema/BRAIN.md` dentro de una bóveda recién creada para que el usuario lo tenga en Obsidian.
pub fn seed_vault_brain_note(vault_dir: &Path) {
    let sys_dir = vault_dir.join("00 Sistema");
    let _ = fs::create_dir_all(&sys_dir);
    let target = sys_dir.join("BRAIN.md");
    if !target.exists() {
        let _ = fs::write(&target, FACTORY_BRAIN_MARKDOWN);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_factory_brain_has_7_axes_and_semver_milestones() {
        assert!(FACTORY_BRAIN_MARKDOWN.contains("1.0.0"));
        assert!(FACTORY_BRAIN_MARKDOWN.contains("1.0.1"));
        assert!(FACTORY_BRAIN_MARKDOWN.contains("1.1.0"));
        assert!(FACTORY_BRAIN_MARKDOWN.contains("grill-me"));
        assert!(FACTORY_BRAIN_MARKDOWN.contains("caveman"));
        assert!(!FACTORY_BRAIN_MARKDOWN.to_lowercase().contains("zabrielsa"));
    }

    #[test]
    fn test_base_skills_seed_is_sanitized() {
        assert!(BASE_SKILLS_SEED.len() >= 20);
        for (id, content) in BASE_SKILLS_SEED {
            assert!(!id.is_empty());
            assert!(content.starts_with("---\nname: "));
            assert!(!content.to_lowercase().contains("zabrielsa"));
        }
    }
}
