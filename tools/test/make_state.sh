#!/bin/sh
# Imprime um save de campanha novo (Guarda Imperial) para os testes.
MOD=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$(mktemp -d)
{
	echo "var MOD = \"$MOD\";"
	echo 'const ByteArray = imports.byteArray; function readText(p) { return ByteArray.toString(imports.gi.GLib.file_get_contents(p)[1]); }'
	echo 'var Engine = { "ReadJSONFile": p => JSON.parse(readText(MOD + "/" + p)) };'
	cat "$MOD/gui/campaigns/wh40k/core/Data.js" "$MOD/gui/campaigns/wh40k/core/Events.js" "$MOD/gui/campaigns/wh40k/core/Game.js" "$MOD/gui/campaigns/wh40k/core/Mechanics.js" "$MOD/gui/campaigns/wh40k/core/AI.js"
	echo "function warn(t) {} function error(t) { print(t); }"
	echo 'print(JSON.stringify({ "data": { "state": WH40KGame.newState("'${FACTION:-imperial}'", "'${SCENARIO:-armageddon}'") }, "meta": { "userDescription": "teste" }, "template_identifier": "wh40k" }));'
} > "$OUT/s.js"
gjs "$OUT/s.js"
rm -rf "$OUT"
