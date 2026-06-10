#!/usr/bin/env bash
# Render build script — run from repo root.
set -euo pipefail
corepack enable
pnpm install --prod=false
pnpm --filter @stitchhub/api... build
