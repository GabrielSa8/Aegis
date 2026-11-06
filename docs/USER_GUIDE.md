# 📖 Aegis — User & Modules Operational Guide

Complete field manual for every module in Aegis. Outlines prerequisites, UI breakdown, capabilities, and workflows.

---

## 📑 Index
0. [🧭 Cockpit Architecture: The 3 Docks & Contexts](#0-cockpit-architecture-the-3-docks--contexts)
1. [📚 Obsidian Second Brain (Vault)](#1-obsidian-second-brain-vault)
2. [🚀 DevOps & Git Fleet Radar](#2-devops--git-fleet-radar)
3. [💰 Sovereign Finances & LifeOS Timeline](#3-sovereign-finances--lifeos-timeline)
4. [📋 Daily Tasks & Checkbox Engine](#4-daily-tasks--checkbox-engine)
5. [🤖 Omnichannel AI Agent](#5-omnichannel-ai-agent)
6. [🛡️ Hardware Sentinel & Process Killer](#6-hardware-sentinel--process-killer)
7. [🎮 Gaming Nexus & System Optimizer](#7-gaming-nexus--system-optimizer)
8. [🔄 Local P2P Sync & Fleet Mesh](#8-local-p2p-sync--fleet-mesh)
9. [📱 Telegram Remote Gateway](#9-telegram-remote-gateway)
10. [⚙️ Master Settings & Environment](#10-master-settings--environment)

---

## 0. 🧭 Cockpit Architecture: The 3 Docks & Contexts

Aegis maximizes vertical and horizontal viewport via a zero-overhead, ultra-dense 3-dock spatial design:

### 1. Top Header Dock (38px Unified Control)
* **Status Telemetry:** Real-time Git fleet health and system sentinel indicators.
* **Omnibar (`Ctrl + K`):** Instant fuzzy-search for Obsidian notes, slash commands, sovereign themes, and quick macros.
* **Master Controls:** Master Lock (`Alt + L`), Zen Mode (`Alt + Z`), Module Tour Guide (`[?]`), and Master Settings (`Ctrl + ,`).

### 2. Left Navigation Dock (Tabs & Modules)
* **Quick Switch:** Access the 8 operational modules via `Alt + 1..8`.
* **Zero Viewport Intrusion:** Retractable edge dock that slides in when hovering near the left edge and can be pinned with the top pin button.

### 3. Right Contexts Dock & What are Contexts?
* **Edge Access:** Retractable dock located on the right edge (auto-expands on hover, pin-able).
* **What is a Context?** A context is an isolated cognitive workspace for the AI Agent. Each context binds:
  1. A project filesystem directory (`workingDir`).
  2. A dedicated set of allowed Agent Skills (saving up to 70% of tokens by pruning unnecessary tools).
  3. Linked Obsidian Vault reference notes.
  4. System prompt directives for that specific domain.
* **Switching:** Clicking any context in the Right Dock instantly scopes the AI agent to that project without restarting or clearing chat history.

---

## 1. 📚 Obsidian Second Brain (Vault)
*Hotkey: `Alt + 3`*

### What it does
Full-featured, sovereign local Markdown workspace. Directly interacts with your filesystem notes without cloud lock-in.

### Prerequisites
* **Required:** Any local folder with `.md` files (configured in *Settings* or first-boot wizard).
* **Optional:** Obsidian desktop app (only if you want to open notes externally).

### Sub-sections & Controls
* **Hierarchical Tree (`Ctrl + B`):** Collapsible sidebar listing folders and notes. Supports Drag & Drop to move files between folders.
* **Tactical Markdown Editor:** Real-time syntax highlighting, table editing, and instant Markdown rendering with GitHub Flavored Markdown (GFM).
* **Mermaid Engine:** Auto-renders diagrams (`graph TD`, `sequenceDiagram`, `stateDiagram`, etc.) inline.
* **Network & Micrograph Panel (`Ctrl + M`):** Visualizes incoming/outgoing backlinks and note connections.
* **Modals:**
  * **New Note / Folder:** Instant file creation with templates.
  * **Rename Modal:** Renames files safely on NVMe storage.
  * **Delete Modal:** Tactical deletion with secondary confirmation.

---

## 2. 🚀 DevOps & Git Fleet Radar
*Hotkey: `Alt + 4`*

### What it does
Centralized command deck for developers. Monitors Git repositories across your drives, launches IDEs/terminals, and manages installed Agent Skills.

### Prerequisites
* **Required:** `git` CLI installed on system (`git --version`).
* **Recommended:**
  * Code editor configured in Settings (`cursor`, `code`, `zed`, `nvim`, etc.).
  * Terminal emulator configured in Settings (`ptyxis`, `gnome-terminal`, `kitty`, `alacritty`, etc.).
* **Optional:** `docker` / `docker compose` (for container inspection).

### Sub-sections & Controls
* **Repository Fleet Radar:**
  * **Card Grid:** Displays all tracked projects (auto-discovered or added manually).
  * **Live Git Telemetry:** Shows active branch, uncommitted dirty files, and commits ahead/behind remote.
  * **Action Controls:**
    * `IDE`: Opens the project folder directly in your preferred editor.
    * `Terminal`: Spawns a native terminal session at the repo root.
    * `Diff / Git Status`: Shows exact changed files without switching windows.
* **Agent Skills Directory:**
  * Scans `~/.agents/skills/` and local repos.
  * Search bar to find skills by name or capability.
  * Built-in viewer for `SKILL.md` specifications.

---

## 3. 💰 Sovereign Finances & LifeOS Timeline
*Hotkey: `Alt + 2`*

### What it does
100% offline personal finance cockpit and cross-domain master timeline powered by embedded SQLite.

### Prerequisites
* **Required:** None. Runs on embedded SQLite database (`~/.local/share/aegis/aegis_lifeos.db`) initialized automatically.

### Sub-sections & Controls
* **Burn-Rate Cockpit:**
  * Monthly budget cap vs accumulated spending gauge.
  * Projected end-of-month runway and overrun alerts.
* **Radar & Cutoff Deadlines:**
  * Alerts for upcoming credit card cutoffs (e.g. Day 8, Day 15) and invoice due dates.
* **Interactive Calendar:**
  * Visual days with colored category dots.
  * Daily expense breakdowns on click.
* **Master Timeline:**
  * Integrates deadlines across software releases, personal commitments, and operational milestones.
* **Quick Transaction Entry:**
  * Add expenses/incomes with category tags, notes, and dates in < 3 seconds.

---

## 4. 📋 Daily Tasks & Checkbox Engine
*Hotkey: `Alt + 5`*

### What it does
Vault-wide task scanner. Aggregates all markdown checkboxes (`- [ ]`, `- [x]`) into a prioritized, filterable list.

### Prerequisites
* **Required:** Configured Vault path with notes containing standard markdown checkboxes.

### Sub-sections & Controls
* **Atomic Disk Toggling:** Clicking a checkbox in Aegis immediately mutates the source `.md` file on disk with zero race conditions.
* **Filtering & Search:** Filter by completion status (Pending / Completed), file path, or task priority.
* **Completion Meter:** Visual progress bar showing daily vault task velocity.

---

## 5. 🤖 Omnichannel AI Agent
*Hotkey: `Alt + 1`*

### What it does
Native PTY streaming bridge connecting local AI tools and CLI agents directly into an embedded cockpit.

### Prerequisites
* **Local Mode:** Ollama running locally (`http://localhost:11434`), or CLI agents (`agy`, Claude Code).
* **Cloud Mode (Optional):** API Key for Anthropic / OpenAI / Gemini in settings.

### Sub-sections & Controls
* **PTY Stream Terminal:** Raw bi-directional terminal stream with ANSI color rendering.
* **Execution Mode Switcher:**
  * **Flash:** Fast single-turn queries and small edits.
  * **Profundo:** High-depth agentic planning with tool calling.
* **Macro Injection:** Dynamic variables like `{{clip}}` (paste clipboard) or `{{diff}}` (inject current repo git diff).

---

## 6. 🛡️ Hardware Sentinel & Process Killer
*Hotkey: `Alt + 6`*

### What it does
Ultra-low-overhead Linux system telemetry directly from kernel interfaces (`/proc` and `/sys`).

### Prerequisites
* **Required:** Linux kernel with standard `/proc/stat`, `/proc/meminfo`, and `/sys/class/thermal` permissions (standard on all distros).

### Sub-sections & Controls
* **Per-Core CPU Monitor:** Real-time utilization bar per thread/core.
* **Thermal Sensor:** Live package temperature with throttling risk warnings.
* **DDR5 & ZRAM Swap Gauges:** Displays physical RAM and compressed swap headroom.
* **Process Killer:** Lists top 10 memory and CPU consuming processes with a 1-click `SIGTERM`/`SIGKILL` button.

---

## 7. 🎮 Gaming Nexus & System Optimizer
*Hotkey: `Alt + 7`*

### What it does
Local game launcher with automated Linux performance tweaks.

### Prerequisites
* **Optional:**
  * Steam installed (Aegis reads `appmanifest_*.acf` directly from Steam library paths).
  * `gamemode` installed (`gamemoded`) for CPU governor locking.
  * `gamescope` installed (for FSR upscaling).

### Sub-sections & Controls
* **Library Discovery:** Shows installed Steam and standalone games with icons and sizes without starting Steam.
* **1-Click GameMode:** Enables high-priority CPU scheduler and GPU performance governors.
* **Gamescope FSR Switch:** One-click launcher preset for 720p render scaled to 1080p with AMD FidelityFX Super Resolution.

---

## 8. 🔄 Local P2P Sync & Fleet Mesh
*Hotkey: Settings -> P2P Sync*

### What it does
Peer-to-peer encrypted synchronization across local machines (PC, laptop, Steam Deck) without third-party cloud servers.

### Prerequisites
* **Required:** Both devices on the same Wi-Fi / Local Area Network (LAN).

### Sub-sections & Controls
* **mDNS Device Discovery:** Auto-detects other Aegis instances on the local subnet.
* **Pairing Code Exchange:** One-time numeric handshake for cryptographic trust.
* **Vault & DB Mirror:** Incremental delta replication over encrypted sockets.

---

## 9. 📱 Telegram Remote Gateway
*Hotkey: Settings -> Gateway*

### What it does
Secure bidirectional bot bridge to query your vault, trigger tasks, and receive financial alerts from Telegram.

### Prerequisites
* **Required:**
  1. A Telegram Bot Token from `@BotFather`.
  2. Your personal Telegram Chat ID.

### Sub-sections & Controls
* **Polling Daemon:** Embedded background worker listening strictly to your authorized Chat ID.
* **Quick Commands:**
  * `/today`: Returns today's financial spending and pending vault tasks.
  * `/note <text>`: Ingests an inbox note directly into the configured Vault inbox folder.
  * `/status`: Reports CPU load and battery/thermal status.

---

## 10. ⚙️ Master Settings & Environment
*Hotkey: `Ctrl + ,`*

### What it does
Control center for global configurations, theme customization, paths, and plugin activation.

### Key Sections
* **Appearance:** 5 built-in high-contrast themes (*Nordic Slate*, *Tokyo Night*, *OLED Pure Black*, *Amber Terminal*, *Dracula Dark*) and UI scaling slider.
* **Plugins / Modules:** Toggle any of the 8 main pillars on/off. Unused tabs disappear from the header, freeing resources.
* **Environment Paths:** Configure default Vault folder, Projects directory, Preferred IDE executable, and Preferred Terminal emulator.
* **Draft State Enforcement:** Changes remain in temporary preview until clicking **Guardar Todo** (`Save All`). Clicking **Descartar** (`Discard`) instantly rolls back unsaved changes.
