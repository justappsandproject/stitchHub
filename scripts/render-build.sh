#!/usr/bin/env bash
# Render build script — run from repo root.
set -euo pipefail
corepack enable
pnpm install
pnpm --filter @stitchhub/api db:generate
pnpm --filter @stitchhub/api build
