#!/usr/bin/env bash
set -euo pipefail

# Aegis — Empaquetador y Firmador Oficial de Releases
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="$PROJECT_ROOT/src-tauri/target/release"
BINARY="$RELEASE_DIR/aegis"
KEY_FILE="$HOME/.tauri/aegis.key"

echo "🛡️  Empaquetando Aegis v${VERSION} para Release Oficial..."

if [ ! -f "$BINARY" ]; then
    echo "❌ Error: Binario no encontrado en $BINARY. Ejecuta primero 'npm run build && cargo build --manifest-path src-tauri/Cargo.toml --release'" >&2
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: Llave privada de Minisign no encontrada en $KEY_FILE" >&2
    exit 1
fi

# 1. Copiar y strip a copia desacoplada (evita error 'fichero de texto ocupado' si aegis está corriendo)
echo "1️⃣  Optimizando binario ELF (strip symbols)..."
STRIPPED_BIN="$RELEASE_DIR/aegis-stripped"
cp -f "$BINARY" "$STRIPPED_BIN"
strip -s "$STRIPPED_BIN"
cp -f "$STRIPPED_BIN" "$RELEASE_DIR/aegis-linux-x86_64"
cp -f "$STRIPPED_BIN" "$BINARY" 2>/dev/null || true

# 2. Empaquetar tar.gz para auto-updater de Tauri (debe llamarse internamente aegis.AppImage)
TAR_GZ="$RELEASE_DIR/aegis-v${VERSION}_x86_64.AppImage.tar.gz"
echo "2️⃣  Generando tarball para Auto-Updater: $TAR_GZ..."
rm -f "$TAR_GZ" "${TAR_GZ}.sig"
tar -czf "$TAR_GZ" --transform 's|aegis-stripped|aegis.AppImage|' -C "$RELEASE_DIR" aegis-stripped
rm -f "$STRIPPED_BIN"

# 4. Firmar con Tauri / Minisign
echo "3️⃣  Firmando paquete con Minisign..."
SIGN_OUTPUT=$(npx tauri signer sign -f "$KEY_FILE" -p "" --app-version "$VERSION" "$TAR_GZ")
echo "$SIGN_OUTPUT"

SIG_FILE="${TAR_GZ}.sig"
if [ ! -f "$SIG_FILE" ]; then
    echo "❌ Error: No se generó el archivo de firma $SIG_FILE" >&2
    exit 1
fi

SIGNATURE_CONTENT=$(cat "$SIG_FILE")

# 5. Generar manifiesto latest.json obligatorio para Tauri Auto-Updater
LATEST_JSON="$RELEASE_DIR/latest.json"
echo "4️⃣  Generando manifiesto de actualización: $LATEST_JSON..."
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DOWNLOAD_URL="https://github.com/GabrielSa8/Aegis/releases/download/v${VERSION}/aegis-v${VERSION}_x86_64.AppImage.tar.gz"

node -e "
const fs = require('fs');
const manifest = {
  version: '$VERSION',
  notes: 'Aegis v$VERSION release oficial.',
  pub_date: '$PUB_DATE',
  platforms: {
    'linux-x86_64': {
      signature: fs.readFileSync('$SIG_FILE', 'utf8').trim(),
      url: '$DOWNLOAD_URL'
    },
    'linux-x86_64-appimage': {
      signature: fs.readFileSync('$SIG_FILE', 'utf8').trim(),
      url: '$DOWNLOAD_URL'
    }
  }
};
fs.writeFileSync('$LATEST_JSON', JSON.stringify(manifest, null, 2) + '\n');
"

echo ""
echo "✅ Todos los assets obligatorios listos en $RELEASE_DIR:"
echo "   📦 $TAR_GZ"
echo "   🔐 $SIG_FILE"
echo "   📄 $LATEST_JSON"
echo "   ⚙️  $RELEASE_DIR/aegis"
echo "   ⚙️  $RELEASE_DIR/aegis-linux-x86_64"
echo ""
echo "Comando listo para publicar:"
echo "gh release create v${VERSION} \\"
echo "  \"$TAR_GZ\" \\"
echo "  \"$SIG_FILE\" \\"
echo "  \"$RELEASE_DIR/aegis-linux-x86_64\" \\"
echo "  \"$RELEASE_DIR/aegis\" \\"
echo "  \"$LATEST_JSON\" \\"
echo "  --title \"v${VERSION}\" --notes \"Aegis v${VERSION}\""
