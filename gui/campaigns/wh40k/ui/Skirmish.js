/**
 * Escaramuça (botão do menu principal): escolha a sua facção, a inimiga, o
 * terreno, o tamanho e as fortificações, e jogue só a batalha 2D, sem
 * campanha. Monta um estado mínimo de campanha (uma província "skirmish"
 * acrescentada aos dados) para reaproveitar o desdobramento e a batalha.
 */
const WH40K_SKIRMISH_SIZES = { "Pequena (4)": 4, "Média (7)": 7, "Grande (10)": 10 };
const WH40K_SKIRMISH_TERRAINS = ["plains", "hive", "industrial", "ash", "jungle", "mire", "mountains", "ice", "warp", "biomass", "tomb", "station", "rok"];

class WH40KSkirmish
{
	constructor(page)
	{
		this.page = page;
		this.D = WH40KData.load("armageddon");
		page.D = this.D;
		this.opts = { "size": 7, "forts": 0 };
		for (const id of ["bottomBar"])
			gui(id).hidden = true;
	}

	factions()
	{
		return Object.keys(this.D.factions).filter(f => this.D.factions[f].enabled !== false && this.D.unitsOf(f).filter(u => !u.noRecruit).length >= 3);
	}

	/** Lista paginada no diálogo (até 8 opções por página). */
	pick(title, text, items, onPick, page = 0, back)
	{
		const per = 7;
		const slice = items.slice(page * per, page * per + per);
		const buttons = slice.map(it => ({ "caption": it.caption, "tooltip": it.tooltip || "", "onPress": () => onPick(it.value) }));
		if (items.length > per)
			buttons.push({ "caption": "Mais...", "onPress": () => this.pick(title, text, items, onPick, (page + 1) % Math.ceil(items.length / per), back) });
		buttons.push({ "caption": back ? "Voltar" : "Menu principal", "onPress": back || (() => this.exit()) });
		this.page.dialog.open({ "title": title, "text": text, "buttons": buttons, "portrait": this.opts.player ? portraitSprite(this.D.factionPortrait(this.opts.player)) : null,
			"portraitB": this.opts.enemy ? portraitSprite(this.D.factionPortrait(this.opts.enemy)) : null });
	}

	menu()
	{
		const page = this.page;
		page.view = "skirmish";
		page.dialog.close();
		for (const id of ["topBar", "side", "mapArea"])
			gui(id).hidden = true;
		const items = page.factionItems(this.D, this.factions(), null);
		page.selector.open({
			"title": "Escaramuça — sua facção",
			"items": items,
			"filters": [{ "label": "Grupo", "key": "group" }],
			"aux": { "caption": "Códex", "onPress": f => page.codex.open(f) },
			"okCaption": "Escolher inimigo",
			"selected": this.opts.player,
			"onSelect": f => {
				this.opts.player = f;
				page.selector.open({
					"title": "Escaramuça — inimigo de " + (this.D.factions[f].short || this.D.factions[f].name),
					"items": items.filter(it => it.id != f),
					"filters": [{ "label": "Grupo", "key": "group" }],
					"aux": { "caption": "Códex", "onPress": e => page.codex.open(e) },
					"okCaption": "Escolher terreno",
					"selected": this.opts.enemy,
					"onSelect": e => {
						this.opts.enemy = e;
						this.chooseTerrain();
					},
					"onCancel": () => this.menu()
				});
			},
			"onCancel": () => this.exit()
		});
	}

	chooseTerrain()
	{
		const items = WH40K_SKIRMISH_TERRAINS.map(t => ({ "caption": WH40K_TERRAIN_NAMES[t], "value": t }));
		this.pick("Escaramuça — terreno", "Onde é a batalha? (o clima é sorteado pelo terreno)", items, t => {
			this.opts.terrain = t;
			this.chooseSize();
		}, 0, () => this.menu());
	}

	chooseSize()
	{
		const D = this.D;
		const buttons = Object.keys(WH40K_SKIRMISH_SIZES).map(k => ({ "caption": k, "onPress": () => { this.opts.size = WH40K_SKIRMISH_SIZES[k]; this.chooseSize(); } }))
			.concat([
				{ "caption": "Muralhas: " + (this.opts.forts ? "sim" : "não"), "tooltip": "O inimigo defende atrás de muralhas.", "onPress": () => { this.opts.forts = this.opts.forts ? 0 : 2; this.chooseSize(); } },
				{ "caption": "LUTAR!", "onPress": () => this.start() },
				{ "caption": "Voltar", "onPress": () => this.chooseTerrain() }
			]);
		this.page.dialog.open({
			"title": "Escaramuça — exércitos",
			"text": colored(D.factions[this.opts.player].name, D.factions[this.opts.player].color) + " × " + colored(D.factions[this.opts.enemy].name, D.factions[this.opts.enemy].color) +
				"\nTerreno: " + WH40K_TERRAIN_NAMES[this.opts.terrain] + "\nTamanho: " + this.opts.size + " batalhões de cada lado, com um general\nMuralhas do inimigo: " + (this.opts.forts ? "sim" : "não") +
				"\n\nVocê ataca; o inimigo defende.",
			"portrait": portraitSprite(D.factionPortrait(this.opts.player)),
			"portraitB": portraitSprite(D.factionPortrait(this.opts.enemy)),
			"buttons": buttons
		});
	}

	/** Monta o estado mínimo e abre o desdobramento. */
	start()
	{
		const D = this.D;
		const { player, enemy, terrain, size, forts } = this.opts;
		const body = Object.keys(D.bodies)[0];
		D.provinces.skirmish = { "id": "skirmish", "name": "Campo da Escaramuça", "terrain": terrain, "body": body, "neighbors": [], "hive": terrain == "hive" ? 2 : 0, "label": [0.5, 0.5], "rect": [0, 0, 1, 1] };
		const s = {
			"version": 2, "scenario": D.scenario.id, "turn": 1, "playerFaction": player, "nextId": 1, "difficulty": "normal",
			"factions": {}, "provinces": {}, "armies": {}, "fleets": {}, "generals": {}, "log": [], "pendingBattles": [], "events": [], "gameOver": null
		};
		for (const f of [player, enemy])
			s.factions[f] = { "funds": 0, "ai": f != player, "alive": true, "special": 0 };
		for (const g in D.generals)
			s.generals[g] = { "state": "available", "turns": 0, "xp": 0, "traits": [], "relics": [], "stats": {} };
		for (const pid in D.provinces)
			s.provinces[pid] = { "owner": null, "forts": 0, "garrison": [] };
		s.provinces.skirmish = { "owner": enemy, "forts": forts, "garrison": [] };
		const game = new WH40KGame(s);
		this.page.game = game;
		const armyOf = f => {
			const gen = Object.values(D.generals).find(g => g.faction == f);
			const army = game.createArmy(f, gen ? gen.id : null, null);
			const units = D.unitsOf(f).filter(u => !u.noRecruit && !(u.requires || []).includes("unique"));
			const infantry = units.filter(u => u.category == "infantry");
			const heavy = units.filter(u => u.category != "infantry");
			for (let i = 0; i < size; ++i)
			{
				const list = i % 3 == 2 && heavy.length ? heavy : infantry.length ? infantry : units;
				army.battalions.push(game.newBattalion(pickFrom(list).id, f));
			}
			return army;
		};
		const mine = armyOf(player);
		const theirs = armyOf(enemy);
		const battle = {
			"id": "sk" + Date.now(), "province": "skirmish", "kind": "assault", "turn": 1,
			"attacker": { "faction": player, "armies": [mine.id], "reserves": [] },
			"defender": { "faction": enemy, "armies": [theirs.id], "garrison": false, "reserves": [] }
		};
		for (const id of ["topBar", "side", "mapArea"])
			gui(id).hidden = false;
		this.page.dialog.close();
		this.page.sel = null;
		this.page.openDeploy(battle);
	}

	finish(report)
	{
		const won = report.winner == "attacker";
		this.page.view = "skirmish";
		for (const id of ["side", "mapArea"])
			gui(id).hidden = true;
		this.page.sound.music("campaign");
		this.page.dialog.open({
			"title": won ? "VITÓRIA!" : "DERROTA",
			"text": report.lines.join("\n"),
			"portrait": portraitSprite(this.D.factionPortrait(this.opts.player, won ? "win" : "lose")),
			"portraitB": portraitSprite(this.D.factionPortrait(this.opts.enemy, won ? "lose" : "win")),
			"buttons": [
				{ "caption": "Revanche", "onPress": () => this.start() },
				{ "caption": "Nova escaramuça", "onPress": () => this.menu() },
				{ "caption": "Menu principal", "onPress": () => this.exit() }
			]
		});
	}

	exit()
	{
		this.page.closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
	}
}
