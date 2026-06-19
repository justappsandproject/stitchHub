#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "==> Cleaning previous iOS builds"
flutter clean

echo "==> Fetching dependencies"
flutter pub get
(cd ios && pod install)

echo "==> Archiving for device"
flutter build ipa --release

ARCHIVE="$ROOT/build/ios/archive/Runner.xcarchive"
IPA_DIR="$ROOT/build/ios/ipa"
EXPORT_PLIST="$ROOT/ios/ExportOptionsDevelopment.plist"

if [[ ! -d "$ARCHIVE" ]]; then
  echo "Archive missing at $ARCHIVE" >&2
  exit 1
fi

echo "==> Exporting debugging IPA (install via Xcode or Apple Configurator)"
mkdir -p "$IPA_DIR"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$IPA_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates

IPA_FILE="$IPA_DIR/stitchhub_mobile.ipa"
if [[ ! -f "$IPA_FILE" ]]; then
  IPA_FILE="$(find "$IPA_DIR" -maxdepth 1 -name '*.ipa' | head -1)"
fi

if [[ ! -f "$IPA_FILE" ]]; then
  echo "IPA export failed" >&2
  exit 1
fi

echo "==> Validating IPA structure"
unzip -l "$IPA_FILE" | grep -q "Payload/Runner.app/Runner" || {
  echo "Invalid IPA: missing Runner binary" >&2
  exit 1
}
unzip -l "$IPA_FILE" | grep -q "embedded.mobileprovision" || {
  echo "Invalid IPA: missing provisioning profile" >&2
  exit 1
}

ls -lh "$IPA_FILE"
echo ""
echo "Install on iPhone (device must be registered in your Apple team):"
echo "  xcrun devicectl list devices"
echo "  xcrun devicectl device install app --device <DEVICE_ID> \"$IPA_FILE\""
echo ""
echo "Or open Apple Configurator 2 and drag the IPA onto your connected iPhone."
echo "Note: Opening the IPA in the iPhone Files app shows 'No file to preview' — use one of the methods above."
