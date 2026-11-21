// Roteiro do teste da interface (tools/test/gui_sim.sh).
let closed = null;
const page = new WH40KPage({}, req => { closed = req; });
g_WH40KPage = page;
const press = name => { const o = gui(name); if (!o.onPress) throw new Error("sem onPress: " + name); o.onPress(); };
const dlgButtons = () => [...Array(10).keys()].filter(i => !gui("dlgBtn[" + i + "]").hidden).map(i => gui("dlgBtn[" + i + "]").caption);
print("diálogo inicial: " + gui("dlgTitle").caption + " | botões: " + dlgButtons().join(", "));
const sidx = WH40KData.scenarios.findIndex(sc => sc.id == SCENARIO);
press("dlgBtn[" + sidx + "]");
print("campanha: " + gui("dlgTitle").caption + " | botões: " + dlgButtons().join(", "));
const idx = WH40KData.playableFactions().indexOf(FACTION);
press("dlgBtn[" + idx + "]");
print("tutorial: " + gui("dlgTitle").caption);
press("dlgBtn[0]");
const g = page.game;
print("facção: " + g.player + " | topo: " + gui("topFunds").caption + " | " + gui("topTurn").caption + " | vista " + page.view + " corpo " + page.body);
// Sistema
press("btnSystem");
print("sistema: corpos visíveis " + [0,1,2,3,4,5,6,7].filter(i => !gui("sysBody[" + i + "]").hidden).length + ", frotas " + [...Array(14).keys()].filter(i => !gui("sysFleet[" + i + "]").hidden).length);
gui("sysBody[0]").onPress();
print("painel corpo: " + gui("sideTitle").caption);
gui("sysBody[0]").onPress();
print("vista após 2º clique: " + page.view);
// Exército do jogador
const army = g.armiesOf(g.player)[0];
page.select({ "type": "army", "id": army.id });
print("painel exército: " + gui("sideTitle").caption + " / frase: " + gui("sideQuote").caption);
gui("sideRow[0]").onPress();
print("foco no batalhão: " + gui("sideTitle").caption + " / " + gui("sideQuote").caption);
print("ficha: aberta=" + page.card.isOpen() + " | " + gui("cardTitle").caption + " | " + gui("cardSubtitle").caption + "\n" + gui("cardStats").caption);
press("cardDim");
gui("sidePortraitBtn").onPress();
print("ficha do retrato: " + gui("cardTitle").caption);
page.card.close();
const targets = g.armyTargets(army);
print("alvos: " + JSON.stringify(targets));
// Recrutar
page.side.mode = "recruit"; page.side.recruitTarget = { "army": army.id }; page.refresh();
print("recrutar: " + gui("sideTitle").caption + " linhas " + [...Array(14).keys()].filter(i => !gui("sideRow[" + i + "]").hidden).length + " abas " + [...Array(12).keys()].filter(i => !gui("sideAction[" + i + "]").hidden).map(i => gui("sideAction[" + i + "]").caption).join("/"));
if (FACTION == "imperial")
{
	gui("sideAction[1]").onPress();
	print("aba astartes: " + [...Array(14).keys()].filter(i => !gui("sideRow[" + i + "]").hidden).map(i => gui("sideRow[" + i + "]").caption || gui("sideRowText[" + i + "]").caption.split("\n")[0]).join(", "));
	print("  motivo: " + gui("sideRow[0]").tooltip.split("\n").pop().replace(/\[[^\]]*\]/g, ""));
	gui("sideAction[0]").onPress();
}
gui("sideRow[0]").onPress();
print("após recrutar: batalhões " + army.battalions.length + " fundos " + g.s.factions[g.player].funds);
page.side.mode = null;
// Atacar
const attack = Object.keys(targets).find(p => targets[p] == "attack");
if (attack)
{
	page.select({ "type": "army", "id": army.id });
	const pi = page.planet.index[attack];
	if (pi === undefined) print("província de ataque fora da vista!");
	else gui("prov[" + pi + "]").onPressRight();
	print("diálogo de batalha: " + gui("dlgTitle").caption + " | " + dlgButtons().join(", "));
	press("dlgBtn[0]"); // desdobrar
	print("vista: " + page.view + " | tokens " + [...Array(24).keys()].filter(i => !gui("deployToken[" + i + "]").hidden).length + " inimigos " + [...Array(24).keys()].filter(i => !gui("deployEnemy[" + i + "]").hidden).length + " feições " + [...Array(48).keys()].filter(i => !gui("deployFeature[" + i + "]").hidden).length);
	gui("deployToken[1]").onPress();
	g_MouseX = page.deploy.rect.absX + page.deploy.rect.s * 0.2; g_MouseY = page.deploy.rect.absY + page.deploy.rect.s * 0.5;
	page.deploy.onFieldClick();
	print("token 1 movido para " + JSON.stringify([page.deploy.deployment.player[1].x, page.deploy.deployment.player[1].y]));
	page.deploy.nextPlan(); page.deploy.nextPlan();
	print("plano: " + page.deploy.plan + " ordens: " + page.deploy.deployment.player.map(e => e.order).join(","));
	// Batalha 2D: começa, dá ordens, usa o apoio e corre até o fim.
	const setup = page.deploy.setup;
	press("sideAction[6]"); // INICIAR BATALHA
	const bv = page.battle;
	print("batalha: vista " + page.view + " | unidades " + bv.combat.alive(1).length + " x " + bv.combat.alive(2).length + " | apoio " + bv.combat.sides[1].powers.map(p => p.name + " " + p.charge + "/" + p.kills).join(", "));
	let now = Date.now();
	const tickN = n => { for (let i = 0; i < n; ++i) { now += 100; bv.tick(now); page.fx.tick(now); } };
	tickN(30);
	const sel = bv.selectedUnit();
	print("selecionado: " + (sel && sel.name) + " / " + gui("sideTitle").caption + " / frase: " + gui("sideQuote").caption);
	g_MouseX = page.deploy.rect.absX + page.deploy.rect.s * 0.3; g_MouseY = page.deploy.rect.absY + page.deploy.rect.s * 0.6;
	page.deploy.rect && gui("deployField").onPressRight();
	print("ordem manual: " + (sel && sel.order) + " -> " + JSON.stringify(sel && sel.point));
	const enemy = bv.combat.alive(2)[0];
	gui("deployEnemy[0]").onPressRight();
	print("atacar alvo: " + (sel && sel.order) + " " + (sel && sel.target == enemy.id));
	let used = 0;
	for (let k = 0; k < 400 && !bv.combat.over; ++k)
	{
		tickN(10);
		const powers = bv.combat.sides[1].powers;
		const i = powers.findIndex(p => p.charge >= p.kills);
		if (i != -1)
		{
			gui("sideRow[" + i + "]").onPress();
			const t = bv.combat.alive(2)[0];
			if (t)
			{
				g_MouseX = page.deploy.rect.absX + page.deploy.rect.s * t.x; g_MouseY = page.deploy.rect.absY + page.deploy.rect.s * t.y;
				gui("deployField").onPress();
				++used;
			}
		}
		if (k == 20)
			press("sideAction[9]"); // velocidade x2
	}
	const fxVisible = [...Array(40).keys()].filter(i => !gui("battleFx[" + i + "]").hidden).length;
	print("fim da batalha: over " + bv.combat.over + " vencedor " + bv.combat.winner + " tempo " + Math.round(bv.combat.time) + "s apoios usados " + used + " efeitos visíveis " + fxVisible);
	print("mensagens: " + bv.combat.messages.slice(-4).map(m => m.text).join(" | "));
	tickN(25);
	print("diálogo: " + gui("dlgTitle").caption + " | " + dlgButtons().join(", "));
	print("  " + gui("dlgText").caption.replace(/\[[^\]]*\]/g, "").split("\n").join(" / "));
	press("dlgBtn[0]");
	print("relatório: " + gui("dlgTitle").caption + " | vista " + page.view);
	print("  " + gui("dlgText").caption.replace(/\[[^\]]*\]/g, "").split("\n").join(" / "));
	press("dlgBtn[0]");
	print("eventos: " + g.s.events.map(e => e.kind + "@" + (e.pid || e.body)).join(", "));
	// Saque, se a província foi tomada.
	if (g.province(attack).owner == g.player)
	{
		const a2 = g.armiesAt(attack, g.player)[0];
		if (a2)
		{
			page.select({ "type": "army", "id": a2.id });
			const si = [...Array(12).keys()].find(i => !gui("sideAction[" + i + "]").hidden && gui("sideAction[" + i + "]").caption.indexOf("(+") != -1);
			const before = g.s.factions[g.player].funds;
			print("botão: " + (si === undefined ? "sem saque" : gui("sideAction[" + si + "]").caption + " habilitado " + gui("sideAction[" + si + "]").enabled));
			if (si !== undefined)
				press("sideAction[" + si + "]");
			tickN(15);
			const pfx = [...Array(32).keys()].filter(i => !gui("planetFx[" + i + "]").hidden).length;
			print("saque: fundos " + before + " -> " + g.s.factions[g.player].funds + " devastada " + g.province(attack).devastated + " efeitos no mapa " + pfx + " rendimento " + g.provinceIncome(attack));
		}
	}
	print("dono de " + attack + ": " + page.game.province(attack).owner);
}
// Vários turnos, aceitando as batalhas pendentes como resolução automática.
for (let t = 0; t < 15; ++t)
{
	page.endTurn();
	let guard = 0;
	while (page.dialog.isOpen() && guard++ < 30)
	{
		const buttons = dlgButtons();
		const auto = buttons.indexOf("Resolver Automaticamente");
		press("dlgBtn[" + (auto != -1 ? auto : 0) + "]");
	}
	page.showSystem();
	page.showPlanet("armageddon");
}
print("após turnos: " + gui("topTurn").caption + " | " + gui("topFunds").caption + " | " + gui("topObjective").caption);
print("log (topo): " + gui("logText").caption.split("\n").slice(0, 3).join(" || ").replace(/\[[^\]]*\]/g, ""));
// Frota: mover e embarcar
const fleet = Object.values(page.game.s.fleets).find(f => f.faction == page.game.player && f.body);
if (fleet)
{
	page.select({ "type": "fleet", "id": fleet.id });
	print("frota: " + gui("sideTitle").caption + " | " + gui("sideText").caption.split("\n")[1]);
	page.showSystem();
	const target = Object.keys(page.D.bodies).find(b => b != fleet.body);
	gui("sysBody[" + page.system.bodyIndex[target] + "]").onPressRight();
	print("frota rumo a " + fleet.dest + " eta " + fleet.eta);
}
print("OK");
print("sons tocados: " + g_Sounds.length + " (" + [...new Set(g_Sounds.map(p => p.replace(/^.*\//, "").replace(/(_\d)?\.ogg$/, "")))].join(", ") + ")");
