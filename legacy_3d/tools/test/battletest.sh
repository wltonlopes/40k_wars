#!/bin/sh
# Batalha de teste sem interface no campo de batalha do 40k Wars: exércitos
# de demonstração (ou WH_SETTINGS=<json> com a configuração montada pela
# campanha), os dois lados comandados pelo diretor do trigger. O trigger de
# teste (tools/test/zz_wh40ktest.js) registra o censo a cada 15 s, lança os
# apoios prontos e mostra o resultado.
#
# Uso (na pasta do mod):  sh tools/test/battletest.sh [segundos]
# WH_CIV1/WH_CIV2: civs (imperial, orks). WH_VISUAL=1 abre a janela.
# Nunca rode dois testes ao mesmo tempo (o log é o mesmo).
MOD=$(cd "$(dirname "$0")/../.." && pwd)
NAME=$(basename "$MOD")
REV=$(echo "$MOD" | sed -n 's|.*/snap/0ad/\([0-9]*\)/.*|\1|p')
LOG="$HOME/snap/0ad/$REV/.local/state/0ad/log/interestinglog.html"
WAIT=${1:-240}

cp "$MOD/tools/test/zz_wh40ktest.js" "$MOD/maps/scripts/zz_wh40ktest.js"
if [ -n "$WH_SETTINGS" ]; then
	python3 - "$WH_SETTINGS" "$MOD/maps/scripts/zz_wh40ktest.js" <<'PY'
import json, sys
s = json.load(open(sys.argv[1]))
code = open(sys.argv[2]).read()
open(sys.argv[2], "w").write("InitAttributes.settings.WH40K = " + json.dumps(s) + ";\n" + code)
PY
fi
python3 - "$MOD/maps/random/wh40k_battle.json" "$MOD/maps/random/zz_wh40ktest.json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
data["settings"]["Name"] = "zz test"
# o teste entra antes do trigger da batalha (para WH_SETTINGS valer na preparação)
data["settings"]["TriggerScripts"].insert(1, "scripts/zz_wh40ktest.js")
json.dump(data, open(sys.argv[2], "w"), indent="\t")
PY
trap 'rm -f "$MOD/maps/scripts/zz_wh40ktest.js" "$MOD/maps/random/zz_wh40ktest.json"' EXIT

(cd /tmp && timeout "$WAIT" snap run 0ad -mod=public -mod=warhr -mod="$NAME" \
	-autostart="random/zz_wh40ktest" -autostart-size=${WH_SIZE:-192} -autostart-players=2 \
	-autostart-civ=1:${WH_CIV1:-imperial} -autostart-civ=2:${WH_CIV2:-orks} ${WH_VISUAL:+-autostart-player=1} \
	-autostart-victory=endless ${WH_VISUAL:+-xres=1280 -yres=800}${WH_VISUAL:--autostart-nonvisual} -autostart-disable-replay > /dev/null 2>&1)

sed 's/<[^>]*>//g' "$LOG" | grep -E 'wh40ktest|ERROR|WARNING|JavaScript|rror' | sed 's/^WARNING: \[wh40ktest\] /  /' | cut -c1-600
