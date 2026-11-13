#!/bin/sh
# Launcher for chess GUIs, which need an executable file to start the engine.
#
# GUI apps on macOS don't inherit your shell's PATH, so `node` from nvm
# (or similar) is often missing. If node isn't on PATH, load nvm to find it.
# If your node comes from somewhere else, set NODE to its full path below.

NODE="$(command -v node)"

if [ -z "$NODE" ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
  NODE="$(command -v node)"
fi

if [ -z "$NODE" ]; then
  echo "sylar: node not found; set NODE in $0" >&2
  exit 1
fi

exec "$NODE" "$(dirname "$0")/src/main.ts"
