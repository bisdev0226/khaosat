#!/usr/bin/env bash
# [khaosat] Đổi so với profile node gốc: cài thêm deps cho client/ (client có
# package.json riêng — cần cho `npm run build` = vite build client).
set -euo pipefail
source "$PROFILE_DIR/profile.env"
cd "$LANE_DIR"
case "$PKG_MGR" in
  pnpm) pnpm install --frozen-lockfile ;;
  yarn) yarn install --immutable ;;
  *)    npm ci ;;
esac
if [ -n "${FRONTEND_DIR:-}" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
  npm --prefix "$FRONTEND_DIR" ci
fi
