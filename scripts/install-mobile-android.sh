#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
BUILD_TYPE="${1:-debug}"
APK="$MOBILE/build/app/outputs/flutter-apk/app-${BUILD_TYPE}.apk"

cd "$MOBILE"

if [[ ! -f "$APK" ]]; then
  echo "Building ${BUILD_TYPE} APK..."
  flutter build apk --"${BUILD_TYPE}"
fi

if ! adb devices | awk 'NR>1 && $2=="device"{exit 0} END{exit 1}'; then
  echo ""
  echo "No Android device detected."
  echo "1. Enable Developer options on your phone (Settings → About → tap Build number 7 times)"
  echo "2. Turn on USB debugging (Settings → Developer options)"
  echo "3. Connect via USB and accept the 'Allow USB debugging' prompt"
  echo "4. Run: adb devices   (should show your phone as 'device')"
  echo ""
  echo "APK is ready at:"
  echo "  $APK"
  echo ""
  echo "Install manually: copy the APK to your phone and open it,"
  echo "or run this script again once adb sees your device."
  exit 1
fi

echo "Installing on device..."
adb install -r "$APK"
echo "Done. Open StitchHub on your phone."
