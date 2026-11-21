// Roteiro do teste da interface (tools/test/gui_sim.sh).
let closed = null;
var g_SpaceBattles = 0;
const page = new WH40KPage({}, req => { closed = req; });
g_WH40KPage = page;
const press = name => { const o = gui(name); if (!o.onPress) throw new Error("sem onPress: " + name); o.onPress(); };
const dlgButtons = () => [...Array(10).keys()].filter(i => !gui("dlgBtn[" + i + "]").hidden).map(i => gui("dlgBtn[" + i + "]").caption);
const firstEnabled = () => [...Array(10).keys()].find(i => !gui("dlgBtn[" + i + "]").hidden && gui("dlgBtn[" + i + "]").enabled !== false) || 0;
print("diálogo inicial: " + gui("dlgTitle").caption + " | botões: " + dlgButtons().join(", "));
const sidx = WH40KData.scenarios.findIndex(sc => sc.id == SCENARIO);
press("dlgBtn[" + sidx + "]");
print("campanha: " + gui("dlgTitle").caption + " | botões: " + dlgButtons().join(", "));
const idx = WH40KData.playableFactions().indexOf(FACTION);
press("dlgBtn[" + idx + "]");
print("dificuldade: " + gui("dlgTitle").caption + " | botões: " + dlgButtons().join(", "));
press("dlgBtn[1]");
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
	while ((page.dialog.isOpen() || page.view == "space") && guard++ < 30)
	{
		if (page.view == "space")
		{
			++g_SpaceBattles;
			page.space.finish();
			continue;
		}
		const buttons = dlgButtons();
		const auto = buttons.indexOf("Resolver Automaticamente");
		press("dlgBtn[" + (auto != -1 ? auto : firstEnabled()) + "]");
	}
	page.showSystem();
	page.showPlanet("armageddon");
}
print("batalhas espaciais encenadas nos turnos: " + g_SpaceBattles);
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
// v0.6: recurso especial, rituais, diplomacia, eventos, códex e estatísticas.
{
	const me = page.game.player;
	page.dialog.close();
	print("recurso: " + gui("topSpecialText").caption.replace(/\[[^\]]*\]/g, "") + " | oculto " + gui("topSpecial").hidden);
	page.game.s.factions[me].special = 250;
	const army = page.game.armiesOf(me).find(a => a.province);
	if (army)
	{
		page.select({ "type": "army", "id": army.id });
		page.openRituals();
		const rows = [...Array(14).keys()].filter(i => !gui("sideRow[" + i + "]").hidden);
		print("rituais: " + gui("sideTitle").caption + " | " + rows.map(i => gui("sideRowText[" + i + "]").caption.split("\n")[0]).join(", "));
		const ok = rows.find(i => gui("sideRowIcon[" + i + "]").sprite.indexOf("grayscale") == -1);
		if (ok !== undefined)
		{
			gui("sideRow[" + ok + "]").onPress();
			print("ritual feito: " + page.game.s.log[page.game.s.log.length - 1].text.slice(0, 140) + " | resta " + page.game.specialAmount(me));
		}
		page.side.mode = null;
		page.select({ "type": "army", "id": army.id });
		print("exército: " + gui("sideText").caption.replace(/\[[^\]]*\]/g, "").split("\n").slice(0, 3).join(" / "));
		if (army.general)
		{
			page.card.open({ "general": army.general });
			print("ficha general: " + gui("cardStats").caption.replace(/\[[^\]]*\]/g, "").split("\n").join(" / "));
			page.card.close();
		}
	}
	page.showDiplomacy();
	print("diplomacia: " + dlgButtons().join(", "));
	print("  " + gui("dlgText").caption.replace(/\[[^\]]*\]/g, "").split("\n").slice(0, 4).join(" / "));
	page.dialog.close();
	for (const ev of WH40K_EVENTS)
	{
		if (ev.factions && !ev.factions(page.game, me))
			continue;
		const ctx = ev.when(page.game, me);
		if (!ctx)
			continue;
		page.game.s.pendingChoices.push({ "kind": "event", "event": ev.id, "faction": me, "ctx": ctx, "turn": page.game.s.turn });
		page.processQueue();
		print("evento " + ev.id + ": " + gui("dlgTitle").caption + " | " + dlgButtons().join(", "));
		press("dlgBtn[" + firstEnabled() + "]");
		page.dialog.close();
	}
	page.codex.open(me);
	print("códex: " + gui("codexTitle").caption.replace(/\[[^\]]*\]/g, "") + " | ícones " + [...Array(48).keys()].filter(i => !gui("codexIcon[" + i + "]").hidden).length +
		" | facções " + [...Array(26).keys()].filter(i => !gui("codexFac[" + i + "]").hidden).length);
	gui("codexIcon[0]").onPress();
	print("  ficha do códex: " + gui("cardTitle").caption);
	page.card.close();
	page.codex.close();
	page.stats.open();
	print("estatísticas: barras " + [...Array(320).keys()].filter(i => !gui("statsBar[" + i + "]").hidden).length + " | " + gui("statsText").caption.replace(/\[[^\]]*\]/g, "").split("\n")[0]);
	page.stats.close();
	// Ataque a frotas inimigas: na mesma órbita (batalha agora) e em outro corpo (viagem).
	{
		const G = page.game;
		const home = G.provincesOf(me).length ? G.pdef(G.provincesOf(me)[0]).body : Object.keys(G.D.bodies)[0];
		const foe = Object.keys(G.s.factions).find(f => G.hostile(f, me));
		const mineF = Object.values(G.s.fleets).find(f => f.faction == me && f.body && !f.dest) || G.createFleet(me, home, 3);
		const other = Object.keys(G.D.bodies).find(b => b != mineF.body);
		const enemyF = Object.values(G.s.fleets).find(f => G.hostile(f.faction, me) && f.body && f.body != mineF.body) || G.createFleet(foe, other, 2);
		if (mineF && enemyF)
		{
			mineF.acted = 0;
			G.s.storms = {};
			const far = enemyF.body && enemyF.body != mineF.body ? enemyF.body : null;
			page.select({ "type": "fleet", "id": mineF.id });
			if (far)
			{
				page.attackFleet(enemyF);
				print("atacar frota longe: destino " + mineF.dest + " eta " + mineF.eta + " | " + G.s.log[G.s.log.length - 1].text.slice(0, 120));
				G.moveFleet(mineF.id, mineF.body);
			}
			enemyF.body = mineF.body;
			enemyF.dest = null;
			mineF.ships = 4;
			page.select({ "type": "fleet", "id": mineF.id });
			const btnRow = [...Array(14).keys()].find(i => !gui("sideRowBtn[" + i + "]").hidden && gui("sideRowBtn[" + i + "]").caption == "Atacar");
			print("painel da frota: botão Atacar " + (btnRow !== undefined));
			if (btnRow !== undefined)
				gui("sideRowBtn[" + btnRow + "]").onPress();
			print("atacar frota na órbita: vista " + page.view + " | " + gui("spaceHud").caption.replace(/\[[^\]]*\]/g, ""));
			if (page.view == "space")
				page.space.finish();
			print("  relatório: " + gui("dlgTitle").caption + " | " + gui("dlgText").caption.replace(/\[[^\]]*\]/g, "").split("\n").slice(2, 4).join(" / "));
			page.dialog.close();
		}
	}
	page.debug("space");
	print("batalha espacial: vista " + page.view + " | naves " + [...Array(32).keys()].filter(i => !gui("spaceShip[" + i + "]").hidden).length + " | " + gui("spaceHud").caption.replace(/\[[^\]]*\]/g, ""));
	const t0 = Date.now();
	for (let k = 0; k < 400 && page.view == "space"; ++k)
	{
		page.space.last -= 100;
		page.tick();
	}
	print("  fim: vista " + page.view + " | relatório " + gui("dlgTitle").caption + " | " + gui("spaceHud").caption.replace(/\[[^\]]*\]/g, ""));
	page.dialog.close();
	// Códex do menu principal (sem campanha).
	const cpage = new WH40KPage({ "codex": true }, req => { closed = req; });
	print("códex do menu: " + gui("codexTitle").caption.replace(/\[[^\]]*\]/g, ""));
	g_WH40KPage = page;
}
print("OK");
print("sons tocados: " + g_Sounds.length + " (" + [...new Set(g_Sounds.map(p => p.replace(/^.*\//, "").replace(/(_\d)?\.ogg$/, "")))].join(", ") + ")");
