#!/bin/sh
# Abre o jogo numa janela direto na página da campanha (save de teste
# "wh40ktest") e tira capturas de tela de cada vista.
# Uso (na pasta do mod): sh tools/test/guishot.sh <pasta de saída> [vistas...]
# Com a tela bloqueada (ou sem tela), use um X aninhado:
#   Xephyr :5 -screen 1366x768 -ac & DISPLAY=:5 IMPORT_ARGS="-display :5" sh tools/test/guishot.sh ...
#   vistas: new (escolha de facção), planet, system, army, deploy, battle (batalha 2D), battle@<s> (batalha já adiantada <s> segundos), sack (efeitos nas províncias)
MOD=$(cd "$(dirname "$0")/../.." && pwd)
REV=$(echo "$MOD" | sed -n 's|.*/snap/0ad/\([0-9]*\)/.*|\1|p')
SAVES="$HOME/snap/0ad/$REV/.local/share/0ad/saves/campaigns"
OUTDIR=${1:-/tmp}
shift
VIEWS=${*:-new planet system army deploy}
CFG="$HOME/snap/0ad/$REV/.config/0ad/config/user.cfg"
# A página marca o save de teste como "campanha atual": guarda e devolve.
CUR=$(grep '^currentcampaign = ' "$CFG" 2>/dev/null)
mkdir -p "$SAVES" "$OUTDIR" "$MOD/autostart"
# LANG_SHOT=en|pt|es: idioma das capturas (devolve a opção no fim).
OLDLANG=$(grep '^wh40k.language = ' "$CFG" 2>/dev/null)
if [ -n "${LANG_SHOT:-}" ]; then sed -i "/^wh40k.language = /d" "$CFG"; echo "wh40k.language = \"$LANG_SHOT\"" >> "$CFG"; fi
trap 'rm -rf "$MOD/autostart" "$SAVES/wh40ktest.0adcampaign"; sed -i "/^currentcampaign = /d" "$CFG"; [ -n "$CUR" ] && echo "$CUR" >> "$CFG"; if [ -n "${LANG_SHOT:-}" ]; then sed -i "/^wh40k.language = /d" "$CFG"; [ -n "$OLDLANG" ] && echo "$OLDLANG" >> "$CFG"; fi' EXIT
for VIEW in $VIEWS; do
	if [ "$VIEW" = new ]; then
		echo '{"data":{},"meta":{"userDescription":"teste"},"template_identifier":"wh40k"}' > "$SAVES/wh40ktest.0adcampaign"
	else
		sh "$MOD/tools/test/make_state.sh" > "$SAVES/wh40ktest.0adcampaign"
	fi
	if [ "$VIEW" = menu ]; then PAGE='"page_pregame.xml", {}'; else PAGE='"campaigns/wh40k/page.xml", { "filename": "wh40ktest", "debugView": "'$VIEW'" }'; fi
	cat > "$MOD/autostart/autostart.js" <<JS
async function autoStart(cmdLineArgs)
{
	return [$PAGE];
}
JS
	(cd /tmp && timeout ${TIMEOUT:-45} snap run 0ad -mod=public -mod=40k_wars -autostart=x -xres=${XRES:-1366} -yres=${YRES:-768} > /dev/null 2>&1) &
	PID=$!
	sleep ${WAIT:-28}
	import ${IMPORT_ARGS:-} -window root "$OUTDIR/shot_$VIEW.png"
	# BURST=n: mais n capturas, uma por segundo (animações).
	for K in $(seq 1 ${BURST:-0}); do sleep 1; import ${IMPORT_ARGS:-} -window root "$OUTDIR/shot_${VIEW}_$K.png"; done
	kill $PID 2>/dev/null; sleep 1; pkill -x pyrogenesis 2>/dev/null; wait $PID 2>/dev/null
	echo "captura: $OUTDIR/shot_$VIEW.png"
done
LOG="$HOME/snap/0ad/$REV/.local/state/0ad/log/interestinglog.html"
sed 's/<[^>]*>//g' "$LOG" | grep -E "ERROR|WARNING|rror" | head -30
