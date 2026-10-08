#!/bin/bash
# Aplica las migraciones pendientes antes de poner en marcha la nueva versión.
set -euo pipefail
cd /var/app/staging
npx prisma migrate deploy
