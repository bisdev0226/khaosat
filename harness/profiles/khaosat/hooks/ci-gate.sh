#!/usr/bin/env bash
# [khaosat] Đổi so với profile node gốc: áp migration lên TEST_DATABASE_URL trước khi test
# (Prisma — test API vitest+supertest cần schema sẵn trên DB test cách ly).
set -euo pipefail
source "$PROFILE_DIR/profile.env"
echo "harness: [gate 1/3] lint ..."
( cd "$LANE_DIR" && $PKG_MGR run "$LINT_SCRIPT" )
echo "harness: [gate 2/3] migrate DB test cách ly ..."
( cd "$LANE_DIR" && DATABASE_URL="$TEST_DATABASE_URL" $MIGRATE_CMD )
echo "harness: [gate 3/3] test (DB test cách ly) ..."
( cd "$LANE_DIR" && DATABASE_URL="$TEST_DATABASE_URL" REDIS_URL="$REDIS_URL" $PKG_MGR run "$TEST_SCRIPT" )
