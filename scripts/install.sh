#!/usr/bin/env bash
# ==============================================================================
# Aegis — Cognitive Desktop Cockpit
# One-Line Installer & Updater for Linux
# https://github.com/GabrielSa8/Aegis
# ==============================================================================

set -euo pipefail

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

REPO="${AEGIS_REPO:-GabrielSa8/Aegis}"
INSTALL_DIR="${AEGIS_INSTALL_DIR:-$HOME/.local/bin}"
APPLICATIONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps"
TARGET_BIN="$INSTALL_DIR/aegis"
TARGET_DESKTOP="$APPLICATIONS_DIR/aegis.desktop"
TARGET_ICON="$ICONS_DIR/aegis.png"

# --- Uninstall Handler ---
if [[ "${1:-}" == "--uninstall" || "${1:-}" == "-u" ]]; then
    echo -e "${YELLOW}🛡️  Desinstalando Aegis...${NC}"
    rm -f "$TARGET_BIN" "$TARGET_DESKTOP" "$TARGET_ICON"
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
    fi
    echo -e "${GREEN}✅ Aegis ha sido eliminado de $INSTALL_DIR y de los lanzadores del sistema.${NC}"
    echo -e "${CYAN}ℹ️  Nota: Tus datos de Obsidian Vault y bases de datos locales no fueron tocados.${NC}"
    exit 0
fi

echo -e "${BOLD}${CYAN}"
echo "  █████╗ ███████╗ ██████╗ ██╗███████╗"
echo " ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝"
echo " ███████║█████╗  ██║  ███╗██║███████╗"
echo " ██╔══██║██╔══╝  ██║   ██║██║╚════██║"
echo " ██║  ██║███████╗╚██████╔╝██║███████║"
echo " ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝"
echo -e "${NC}"
echo -e "${BOLD}Cognitive Desktop Cockpit — One-Line Installer${NC}"
echo "---------------------------------------------------------"

# 1. OS & Architecture Check
OS="$(uname -s)"
ARCH="$(uname -m)"

if [[ "$OS" != "Linux" ]]; then
    echo -e "${RED}❌ Error: Aegis está optimizado actualmente para Linux (Wayland / X11). Detectado: $OS${NC}"
    exit 1
fi

if [[ "$ARCH" != "x86_64" ]]; then
    echo -e "${YELLOW}⚠️ Advertencia: Arquitectura detectada ($ARCH). Los binarios oficiales actuales son x86_64.${NC}"
fi

# 2. Dependency Check (WebKitGTK 4.1)
check_dependencies() {
    local missing=0
    if ! ldconfig -p 2>/dev/null | grep -q "libwebkit2gtk-4.1.so"; then
        if ! find /usr/lib /usr/lib64 /usr/local/lib -name "libwebkit2gtk-4.1.so*" 2>/dev/null | grep -q "libwebkit2gtk"; then
            missing=1
        fi
    fi

    if [[ $missing -eq 1 ]]; then
        echo -e "${YELLOW}⚠️ Falta la dependencia de sistema WebKitGTK 4.1 requerida por Tauri.${NC}"
        echo -e "${CYAN}Comando sugerido para instalarla según tu distribución:${NC}"
        if command -v dnf >/dev/null 2>&1; then
            echo -e "  ${BOLD}sudo dnf install webkit2gtk4.1 libappindicator-gtk3 librsvg2${NC}"
        elif command -v apt-get >/dev/null 2>&1; then
            echo -e "  ${BOLD}sudo apt update && sudo apt install libwebkit2gtk-4.1-0 libayatana-appindicator3-1 librsvg2-2${NC}"
        elif command -v pacman >/dev/null 2>&1; then
            echo -e "  ${BOLD}sudo pacman -S webkit2gtk-4.1 libappindicator-gtk3 librsvg${NC}"
        fi
        echo -e "${YELLOW}Continuando instalación del binario...${NC}"
    fi
}

check_dependencies

# 3. Resolve Latest Release Tag dynamically (Resilient to GitHub API rate-limits)
echo -e "${BLUE}🔍 Consultando última versión oficial en GitHub...${NC}"

LATEST_TAG=""
if command -v curl >/dev/null 2>&1; then
    # Try GitHub API first
    LATEST_TAG=$(curl -sSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep -o '"tag_name": *"[^"]*"' | head -n 1 | cut -d '"' -f 4 || true)
    
    # Fallback to redirect URL if rate-limited
    if [[ -z "$LATEST_TAG" ]]; then
        FINAL_URL=$(curl -fsSL -o /dev/null -w "%{url_effective}" "https://github.com/$REPO/releases/latest" 2>/dev/null || true)
        LATEST_TAG="${FINAL_URL##*/}"
    fi
fi

if [[ -z "$LATEST_TAG" || "$LATEST_TAG" == "latest" || "$LATEST_TAG" == "releases" ]]; then
    LATEST_TAG="v2.19.3"
fi

echo -e "${GREEN}✓ Versión objetivo detectada:${NC} ${BOLD}$LATEST_TAG${NC}"

# 4. Prepare Directories
mkdir -p "$INSTALL_DIR" "$APPLICATIONS_DIR" "$ICONS_DIR"

# 5. Download Release Binary
BINARY_URL="https://github.com/$REPO/releases/download/$LATEST_TAG/aegis-linux-x86_64"
echo -e "${BLUE}📦 Descargando binario ejecutable ($LATEST_TAG)...${NC}"

TMP_BIN="$(mktemp)"
if ! curl -fSL --progress-bar "$BINARY_URL" -o "$TMP_BIN"; then
    echo -e "${RED}❌ Error: No se pudo descargar el binario desde $BINARY_URL.${NC}"
    echo -e "${YELLOW}Verifica tu conexión o si el release $LATEST_TAG cuenta con assets públicos cargados.${NC}"
    rm -f "$TMP_BIN"
    exit 1
fi

mv "$TMP_BIN" "$TARGET_BIN"
chmod +x "$TARGET_BIN"
echo -e "${GREEN}✓ Binario instalado en:${NC} $TARGET_BIN"

# 6. Download Official 512x512 Icon
ICON_URL="https://raw.githubusercontent.com/$REPO/main/src-tauri/icons/icon.png"
echo -e "${BLUE}🎨 Registrando icono táctico de alta resolución...${NC}"
curl -fsSL "$ICON_URL" -o "$TARGET_ICON" 2>/dev/null || true

# 7. Generate Desktop Launcher (.desktop)
echo -e "${BLUE}🚀 Creando lanzador de aplicaciones del sistema...${NC}"
cat <<EOF > "$TARGET_DESKTOP"
[Desktop Entry]
Name=Aegis
GenericName=Cognitive Desktop Cockpit
Comment=Sovereign Engineering & Life OS Cockpit
Exec=$TARGET_BIN %U
Icon=$TARGET_ICON
Terminal=false
Type=Application
Categories=Development;Utility;Office;System;
Keywords=cockpit;agent;obsidian;devops;finance;sovereign;
StartupWMClass=aegis
EOF

chmod +x "$TARGET_DESKTOP"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
fi

# 8. Check PATH
PATH_WARNING=""
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    PATH_WARNING="\n${YELLOW}⚠️  Aviso: $INSTALL_DIR no está en tu \$PATH actual.${NC}\nPara ejecutar 'aegis' directamente desde la terminal, añade esto a tu ~/.bashrc o ~/.zshrc:\n  ${BOLD}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
fi

echo "---------------------------------------------------------"
echo -e "${BOLD}${GREEN}🎉 ¡Aegis $LATEST_TAG instalado con éxito!${NC}"
echo -e "• Ejecutable: ${BOLD}$TARGET_BIN${NC}"
echo -e "• Lanzador:   ${BOLD}$TARGET_DESKTOP${NC}"
echo -e "• Icono:      ${BOLD}$TARGET_ICON${NC}"
if [[ -n "$PATH_WARNING" ]]; then
    echo -e "$PATH_WARNING"
fi
echo -e "\nPuedes buscar ${BOLD}Aegis${NC} en el menú de aplicaciones de tu sistema o ejecutar:"
echo -e "  ${BOLD}$TARGET_BIN &${NC}\n"
