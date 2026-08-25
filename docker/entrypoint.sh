#!/bin/sh
set -eu

mkdir -p /data

if [ ! -d node_modules/next ] || [ ! -d node_modules/@prisma/client ]; then
  echo "Klarpunkt: npm-Abhängigkeiten im Container installieren …"
  npm ci
fi

echo "Klarpunkt: Prisma-Client erzeugen …"
npx prisma generate --schema=prisma/schema.prisma

echo "Klarpunkt: Datenbankschema anwenden …"
npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss=false

count="$(
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.user.count()
      .then((c) => { console.log(String(c)); return p.\$disconnect(); })
      .catch(async () => { console.log('0'); try { await p.\$disconnect(); } catch {} });
  " 2>/dev/null || echo 0
)"

if [ "$count" = "0" ]; then
  echo "Klarpunkt: leere Datenbank — Demo-Daten werden geladen …"
  npx prisma db seed
else
  echo "Klarpunkt: vorhandene Datenbank mit $count Benutzer(n) — Seed wird übersprungen."
fi

echo "Klarpunkt: Server startet auf ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec "$@"
