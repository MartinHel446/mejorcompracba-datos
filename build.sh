#!/bin/sh
# Build de Vercel: baja data.json del commit indicado y aplica los parches de código del sitio.
# Uso (buildCommand): curl -fsSL https://raw.githubusercontent.com/MartinHel446/mejorcompracba-datos/<SHA>/build.sh | sh -s <SHA>
set -e
[ -n "$1" ] || { echo "falta el SHA del commit"; exit 1; }
B="https://raw.githubusercontent.com/MartinHel446/mejorcompracba-datos/$1"
curl -fsSL "$B/data.json" -o data.json
curl -fsSL "$B/parches/filtro-ingreso.mjs" -o /tmp/filtro-ingreso.mjs
node /tmp/filtro-ingreso.mjs
