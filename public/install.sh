#!/bin/sh
# Forest installer — https://forest.timi.click
# Usage: curl -fsSL https://forest.timi.click/install.sh | sh
set -e

REPO="Timmyy3000/git-forest"
BIN="forest"

info() { printf '\033[0;32m%s\033[0m\n' "$1"; }
warn() { printf '\033[0;33mwarning:\033[0m %s\n' "$1" >&2; }
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
  linux|darwin) ASSET="forest_${OS}_${ARCH}.tar.gz"; BINFILE="forest" ;;
  mingw*|msys*|cygwin*) OS="windows"; ASSET="forest_windows_${ARCH}.zip"; BINFILE="forest.exe" ;;
  *) err "unsupported OS: $OS"; exit 1 ;;
esac

# One canonical install location per OS. On Windows this matches
# install.ps1 (%LOCALAPPDATA%\forest\bin) so the two installers never
# leave duplicate forest binaries shadowing each other on PATH.
if [ "$OS" = "windows" ] && [ -n "${LOCALAPPDATA:-}" ]; then
  DEFAULT_INSTALL_DIR="$LOCALAPPDATA/forest/bin"
else
  DEFAULT_INSTALL_DIR="$HOME/.local/bin"
fi
INSTALL_DIR="${FOREST_INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"
# Normalize Windows-style paths (C:\...) to the shell's form (/c/...) so
# mkdir, the PATH hint, and the shadow comparison all agree.
if command -v cygpath >/dev/null 2>&1; then
  INSTALL_DIR=$(cygpath -u "$INSTALL_DIR")
fi

# warn_on_shadow flags any other forest on PATH that would win over the
# freshly installed binary.
warn_on_shadow() {
  installed="$1"
  resolved=$(command -v "$BIN" 2>/dev/null) || return 0
  [ -n "$resolved" ] || return 0
  resolved_real="$(cd "$(dirname "$resolved")" 2>/dev/null && pwd -P)/$(basename "$resolved")"
  installed_real="$(cd "$(dirname "$installed")" 2>/dev/null && pwd -P)/$(basename "$installed")"
  # command -v may omit the .exe suffix on Windows; normalize before comparing.
  case "$resolved_real" in
    *.exe) ;;
    *) [ -f "$resolved_real.exe" ] && resolved_real="$resolved_real.exe" ;;
  esac
  if [ "$resolved_real" != "$installed_real" ]; then
    warn "another forest at $resolved_real shadows the one just installed"
    warn "remove it (or adjust PATH) so 'forest' picks up new versions:"
    warn "  rm \"$resolved_real\""
  fi
}

# --- try a prebuilt release archive first ---
LATEST_URL="https://api.github.com/repos/$REPO/releases/latest"
DOWNLOAD_URL=$(curl -fsSL "$LATEST_URL" 2>/dev/null \
  | grep -o "\"browser_download_url\": *\"[^\"]*${ASSET}\"" \
  | head -1 | sed 's/.*"\(https[^"]*\)"/\1/') || DOWNLOAD_URL=""

if [ -n "$DOWNLOAD_URL" ]; then
  info "downloading $ASSET ..."
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT
  curl -fsSL "$DOWNLOAD_URL" -o "$TMP/$ASSET"
  case "$ASSET" in
    *.tar.gz) tar -xzf "$TMP/$ASSET" -C "$TMP" "$BINFILE" ;;
    *.zip)
      if command -v unzip >/dev/null 2>&1; then
        unzip -oq "$TMP/$ASSET" "$BINFILE" -d "$TMP"
      else
        # bsdtar (built into Windows 10+) reads zip archives
        tar -xf "$TMP/$ASSET" -C "$TMP" "$BINFILE"
      fi
      ;;
  esac
  mkdir -p "$INSTALL_DIR"
  mv "$TMP/$BINFILE" "$INSTALL_DIR/$BINFILE"
  chmod +x "$INSTALL_DIR/$BINFILE"
  info "installed $BIN to $INSTALL_DIR/$BINFILE"
  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *) info "note: add $INSTALL_DIR to your PATH" ;;
  esac
  warn_on_shadow "$INSTALL_DIR/$BINFILE"
  exit 0
fi

# --- fall back to go install when Go is available ---
if command -v go >/dev/null 2>&1; then
  info "no prebuilt archive for ${OS}/${ARCH} — building from source with go install ..."
  go install "github.com/$REPO/cmd/forest@latest"
  info "installed $BIN via go install (in \$(go env GOPATH)/bin)"
  exit 0
fi

err "no prebuilt archive available for ${OS}/${ARCH} and Go is not installed."
err "install Go (https://go.dev/dl) and re-run, or build from source:"
err "  git clone https://github.com/$REPO && cd git-forest && go build ./cmd/forest"
exit 1
