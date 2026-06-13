#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"

cd "$(dirname "$0")/../apps/mobile"

if ! flutter devices | grep -q "emulator"; then
  echo "Starting Pixel_8 emulator..."
  flutter emulators --launch Pixel_8 &
  for i in {1..30}; do
    if flutter devices | grep -q "emulator"; then
      break
    fi
    sleep 2
  done
fi

flutter run -d android "$@"
