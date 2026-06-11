#!/usr/bin/env bash
set -euo pipefail

# Registers StitchHub mobile with Firebase project stitchhubpromax and
# writes google-services.json, GoogleService-Info.plist, firebase_options.dart.
#
# Prerequisites:
#   firebase login
#   dart pub global activate flutterfire_cli
#
# Usage (from repo root):
#   ./apps/mobile/scripts/configure_firebase.sh

cd "$(dirname "$0")/.."

echo "Configuring Firebase for stitchhubpromax..."
flutterfire configure \
  --project=stitchhubpromax \
  --android-app-id=com.stitchhub.stitchhub_mobile \
  --ios-bundle-id=com.stitchhub.stitchhubMobile \
  --out=lib/firebase_options.dart \
  --yes

echo "Done. Firebase config files updated."
