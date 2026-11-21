#!/bin/sh
# Batalhas 2D (core/Combat.js) sem interface: exércitos aleatórios das duas
# facções, as duas pela IA de ordens e de apoio. Mostra duração, vencedor
# e se o lado mais forte ganha. Uso: sh tools/test/combat_sim.sh [batalhas]
MOD=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$(mktemp -d)
{
	cat <<JS
var MOD = "$MOD";
var N = ${1:-40};
const ByteArray = imports.byteArray;
function readText(path) { return ByteArray.toString(imports.gi.GLib.file_get_contents(path)[1]); }
var Engine = { "ReadJSONFile": p => JSON.parse(readText(MOD + "/" + p)) };
JS
	cat "$MOD/gui/campaigns/wh40k/core/Data.js" "$MOD/gui/campaigns/wh40k/core/Game.js" "$MOD/gui/campaigns/wh40k/core/Combat.js"
	cat <<'JS'
const D = WH40KData.load();
const army = (faction, n, south) => {
	const units = D.unitsOf(faction).filter(u => !(u.requires || []).includes("unique"));
	const list = [];
	for (let i = 0; i < n; ++i)
	{
		const u = pickFrom(units);
		list.push({ "id": faction + i, "name": "L" + i, "unitName": u.name, "category": u.category, "strength": randRange(0.6, 1), "power": u.power, "men": u.men,
			"range": u.range, "speed": u.speed, "armor": u.armor, "terrain": u.terrain, "allTerrain": u.allTerrain, "order": pickFrom(["advance", "advance", "hold", "flank_left", "flank_right", "reserve"]),
			"x": 0.1 + 0.8 * i / Math.max(1, n - 1), "y": south ? 0.85 : 0.15 });
	}
	return list;
};
const support = f => D.supportOf(f).map(p => ({ "id": p.id, "type": p.type, "name": p.name, "kills": p.kills }));
let stronger = 0, total = 0, times = [], routs = 0, timeouts = 0;
for (let b = 0; b < N; ++b)
{
	const f1 = b % 2 ? "imperial" : "orks";
	const f2 = f1 == "orks" ? "imperial" : "orks";
	const u1 = army(f1, 3 + Math.floor(Math.random() * 7), true);
	const u2 = army(f2, 3 + Math.floor(Math.random() * 7), false);
	const features = [];
	for (let i = 0; i < 8; ++i) features.push({ "type": pickFrom(["ruins", "forest", "hill", "crater", "water", "rocks"]), "x": Math.random(), "y": 0.3 + Math.random() * 0.4, "r": 0.05 });
	const field = pickFrom(Object.keys(WH40K_FIELD_FX));
	const c = new WH40KCombat({ "features": features, "aspect": 1.7, "terrain": field, "defender": 2, "seed": b + 1, "sides": {
		"1": { "units": u1, "support": support(f1), "ready": 0, "dps": 1, "armor": 1 },
		"2": { "units": u2, "support": support(f2), "ready": 0, "dps": 1, "armor": 1.1 } } });
	const p1 = c.sides[1].initial, p2 = c.sides[2].initial;
	let ai = 0;
	while (!c.over) { c.step(0.1); ai += 0.1; if (ai >= 1) { ai = 0; c.aiSupport(1); c.aiSupport(2); c.aiOrders(1); c.aiOrders(2); } c.events = []; }
	const r = c.result();
	total++;
	if ((p1 > p2 * 1.1 && r.winner == 1) || (p2 > p1 * 1.1 && r.winner == 2)) stronger++;
	times.push(r.time);
	if (c.sides[1].routing || c.sides[2].routing) routs++;
	if (c.time >= WH40K_COMBAT.timeLimit) timeouts++;
	if (b < 8)
		print(f1 + " " + u1.length + " (" + Math.round(p1) + ") x " + f2 + " " + u2.length + " (" + Math.round(p2) + "): vence " + r.winner + " em " + r.time + "s, baixas " + r.kills[1] + "/" + r.kills[2] +
			", sobreviventes " + Object.values(r.battalions[1]).filter(x => x > 0).length + "/" + Object.values(r.battalions[2]).filter(x => x > 0).length + ", apoios " + c.sides[1].powers.reduce((n, p) => n + p.uses, 0) + "/" + c.sides[2].powers.reduce((n, p) => n + p.uses, 0));
}
times.sort((a, b) => a - b);
const ex = (id, field, feats) => { const u = D.unitById[id]; const m = WH40KCombat.terrainMods(u.category, u, field, feats); return id + " em " + field + "+" + feats.join("+") + ": " + (m.notes.join(", ") || "nada"); };
print(ex("sentinel", "jungle", ["forest"]));
print(ex("leman_russ", "jungle", ["forest"]));
print(ex("assault_marines", "mire", ["water"]));
print(ex("boyz", "jungle", ["ruins"]));
print(ex("skitarii_rangers", "ash", ["hill"]));
print("batalhas " + total + " | o mais forte (>10%) venceu " + stronger + " | duração mediana " + times[times.length >> 1] + "s (min " + times[0] + ", máx " + times[times.length - 1] + ") | debandadas " + routs + " | tempo esgotado " + timeouts);
JS
} > "$OUT/combat.js"
gjs "$OUT/combat.js"
STATUS=$?
rm -rf "$OUT"
exit $STATUS
