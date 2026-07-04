#!/bin/sh
# Forest installer — https://forest.timi.click
# Usage: curl -fsSL https://forest.timi.click/install.sh | sh
set -e

REPO="Timmyy3000/git-forest"
BIN="forest"
INSTALL_DIR="${FOREST_INSTALL_DIR:-$HOME/.local/bin}"

info() { printf '\033[0;32m%s\033[0m\n' "$1"; }
err()  { printf '\033[0;31merror:\033[0m %s\n' "$1" >&2; }

# --- detect platform ---
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) err "unsupported architecture: $ARCH"; exit 1 ;;
esac
case "$OS" in
  linux|darwin) ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
  *) err "unsupported OS: $OS"; exit 1 ;;
esac

EXT=""
[ "$OS" = "windows" ] && EXT=".exe"

# --- try a prebuilt release binary first ---
LATEST_URL="https://api.github.com/repos/$REPO/releases/latest"
ASSET="forest_${OS}_${ARCH}${EXT}"
DOWNLOAD_URL=$(curl -fsSL "$LATEST_URL" 2>/dev/null \
  | grep -o "\"browser_download_url\": *\"[^\"]*${ASSET}[^\"]*\"" \
  | head -1 | sed 's/.*"\(https[^"]*\)"/\1/') || DOWNLOAD_URL=""

if [ -n "$DOWNLOAD_URL" ]; then
  info "downloading $ASSET ..."
  mkdir -p "$INSTALL_DIR"
  curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/$BIN$EXT"
  chmod +x "$INSTALL_DIR/$BIN$EXT"
  info "installed $BIN to $INSTALL_DIR/$BIN$EXT"
  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *) info "note: add $INSTALL_DIR to your PATH" ;;
  esac
  exit 0
fi

# --- fall back to go install when Go is available ---
if command -v go >/dev/null 2>&1; then
  info "no prebuilt binary for ${OS}/${ARCH} yet — building from source with go install ..."
  go install "github.com/$REPO/cmd/forest@latest"
  info "installed $BIN via go install (in \$(go env GOPATH)/bin)"
  exit 0
fi

err "no prebuilt binary available for ${OS}/${ARCH} and Go is not installed."
err "install Go (https://go.dev/dl) and re-run, or build from source:"
err "  git clone https://github.com/$REPO && cd git-forest && go build ./cmd/forest"
exit 1
