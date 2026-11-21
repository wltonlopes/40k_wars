#!/bin/sh
# Teste da interface da campanha sem o jogo (gjs): objetos da GUI falsos,
# percorre escolha de facção, vistas, seleção, marcha/ataque, desdobramento
# (monta a configuração da batalha) e vários turnos com as janelas.
# Uso (na pasta do mod): sh tools/test/gui_sim.sh [facção] [arquivo para gravar a configuração da batalha]
MOD=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$(mktemp -d)
{
	cat <<JS
var MOD = "$MOD";
var FACTION = "${1:-imperial}";
var SCENARIO = "${SCENARIO:-armageddon}";
var SAVE_BATTLE = "${2:-}";
JS
	cat "$MOD/tools/test/gui_stubs.js"
	for f in "$MOD"/gui/campaigns/wh40k/core/*.js "$MOD"/gui/campaigns/wh40k/ui/*.js; do cat "$f"; echo; done
	cat "$MOD/tools/test/gui_sim_main.js"
} > "$OUT/gui.js"
gjs "$OUT/gui.js"
STATUS=$?
rm -rf "$OUT"
exit $STATUS
