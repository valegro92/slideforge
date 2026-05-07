#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Install JS deps (idempotent — npm install is a no-op when lockfile matches).
npm install --no-audit --no-fund

# Start the Next.js dev server in the background so curl/browser tests work
# during the session. Detach fully so the hook exits and the process survives.
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Skip if a dev server is already listening on :3000.
if curl -fsS -o /dev/null -m 1 http://localhost:3000/ 2>/dev/null; then
  echo "dev server already running on :3000, skipping start"
  exit 0
fi

nohup npm run dev > "$LOG_DIR/dev-server.log" 2>&1 &
disown || true

# Wait briefly for the server to come up so the agent can use it immediately.
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null -m 1 http://localhost:3000/ 2>/dev/null; then
    echo "dev server ready on :3000"
    exit 0
  fi
  sleep 1
done

echo "dev server did not become ready in 30s — see $LOG_DIR/dev-server.log"
exit 0
