#!/bin/sh
set -eu

if [ ! -f /var/lib/clamav/main.cvd ]; then
  freshclam --foreground --stdout
fi

freshclam \
  --checks="${FRESHCLAM_CHECKS:-1}" \
  --daemon \
  --foreground \
  --stdout \
  --user=clamav &

exec clamd --foreground
