#!/bin/sh
set -eu
cd /workspace
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
SOCKET="${LISTINGS_PROXY_SOCKET:-/tmp/listings-proxy.sock}"
if ! curl --unix-socket "$SOCKET" -sf -o /dev/null --max-time 2 http://localhost/health 2>/dev/null; then
  rm -f "$SOCKET"
  node scripts/listings-proxy.mjs >>/tmp/listings-proxy.log 2>&1 &
  i=0
  while [ "$i" -lt 20 ]; do
    if curl --unix-socket "$SOCKET" -sf -o /dev/null --max-time 1 http://localhost/health 2>/dev/null; then
      break
    fi
    i=$((i + 1))
    sleep 0.25
  done
fi
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
