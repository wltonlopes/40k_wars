#!/bin/sh
# Simula a campanha sem o jogo (gjs): as duas facções jogadas pela IA,
# batalhas pendentes resolvidas automaticamente. Mostra a situação a cada
# 5 turnos e o fim.  Uso (na pasta do mod): sh tools/test/campaign_sim.sh [turnos] [facção do jogador] [campanha: armageddon, damocles, cadia]
MOD=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$(mktemp -d)
{
	cat <<JS
var MOD = "$MOD";
var TURNS = ${1:-40};
var PLAYER = "${2:-imperial}";
var SCENARIO = "${3:-${SCENARIO:-armageddon}}";
const ByteArray = imports.byteArray;
function readText(path) { return ByteArray.toString(imports.gi.GLib.file_get_contents(path)[1]); }
var Engine = { "ReadJSONFile": p => JSON.parse(readText(MOD + "/" + p)) };
function warn(t) { print("WARN " + t); }
function error(t) { print("ERROR " + t); }
JS
	cat "$MOD/gui/campaigns/wh40k/core/Data.js" "$MOD/gui/campaigns/wh40k/core/Game.js" "$MOD/gui/campaigns/wh40k/core/AI.js"
	cat "$MOD/tools/test/campaign_sim_main.js"
} > "$OUT/sim.js"
gjs "$OUT/sim.js"
rm -rf "$OUT"
