#!/usr/bin/env bash
set -euo pipefail

required_major=24

# Load nvm (works for typical Linux setups)
if [[ -z "${NVM_DIR:-}" ]]; then
  export NVM_DIR="$HOME/.nvm"
fi

if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm not found at $NVM_DIR/nvm.sh" >&2
  echo "Install nvm or run commands with Node ${required_major}.x." >&2
  exit 1
fi

nvm install "$required_major" >/dev/null
nvm use "$required_major" >/dev/null

node_bin="$(nvm which "$required_major")"
if [[ ! -x "$node_bin" ]]; then
  echo "nvm did not return an executable Node path for ${required_major}." >&2
  echo "nvm which ${required_major}: $node_bin" >&2
  exit 1
fi

node_bin_dir="$(dirname "$node_bin")"
npm_bin="$node_bin_dir/npm"

# Ensure all npm lifecycle scripts resolve `node` to the nvm-selected Node.
export PATH="$node_bin_dir:$PATH"
export npm_config_scripts_prepend_node_path=true
hash -r 2>/dev/null || true

active_node_version="$(node -v)"
if [[ "$active_node_version" != v24.* ]]; then
  echo "Failed to activate Node 24 via nvm." >&2
  echo "node: $(command -v node) ($active_node_version)" >&2
  echo "PATH: $PATH" >&2
  exit 1
fi

if [[ ! -x "$npm_bin" ]]; then
  echo "Expected npm next to Node at: $npm_bin" >&2
  echo "Active Node is: $node_bin" >&2
  exit 1
fi

# Rebuild better-sqlite3 for the active Node version if present.
# This avoids 'Module did not self-register' after switching Node versions.
if [[ -d "node_modules/better-sqlite3" ]]; then
  "$npm_bin" rebuild better-sqlite3 >/dev/null || true
fi

exec "$npm_bin" "$@"
