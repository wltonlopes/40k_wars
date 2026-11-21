// Corpo do simulador (tools/test/campaign_sim.sh).
const state = WH40KGame.newState(PLAYER, SCENARIO);
let game = new WH40KGame(state);
for (const f in state.factions)
	state.factions[f].ai = true;
function summary()
{
	const parts = [];
	for (const f in state.factions)
	{
		const provs = game.provincesOf(f);
		const armies = game.armiesOf(f);
		const bats = armies.reduce((s, a) => s + a.battalions.length, 0);
		const ships = Object.values(state.fleets).filter(x => x.faction == f).reduce((s, x) => s + x.ships, 0);
		const bodies = [...new Set(provs.map(p => game.pdef(p).body))].join(",");
		parts.push(f + ": " + provs.length + " prov [" + bodies + "], " + armies.length + " exérc/" + bats + " bat, " + ships + " naves, $" + state.factions[f].funds + " (+" + game.income(f) + " -" + game.upkeep(f) + ")");
	}
	const neutral = Object.keys(state.provinces).filter(p => !state.provinces[p].owner).length;
	return "T" + state.turn + " | " + parts.join(" | ") + " | neutras " + neutral;
}
print(summary());
let battles = 0;
for (let t = 0; t < TURNS && !state.gameOver; ++t)
{
	game.endTurn();
	// Batalhas pendentes (o "jogador" é IA aqui): resolve automaticamente.
	let b;
	while ((b = game.nextPendingBattle()))
	{
		state.pendingBattles.shift();
		game.applyBattle(b, game.autoResolve(b));
		++battles;
	}
	// JSON ida e volta (como o save).
	game = new WH40KGame(JSON.parse(JSON.stringify(state)));
	Object.assign(state, game.s);
	game.s = state;
	if (state.turn % 5 == 0)
		print(summary());
}
print(summary());
print("batalhas pendentes resolvidas: " + battles + "; fim: " + JSON.stringify(state.gameOver));
print("últimos eventos:");
for (const e of state.log.slice(-12))
	print("  [T" + e.turn + " " + e.kind + "] " + e.text);
