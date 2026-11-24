/**
 * Controlador da página da campanha 40k Wars.
 *
 * Vistas (mapArea): sistema estelar, planeta, desdobramento e batalha 2D. O painel
 * lateral mostra a seleção (província, exército, frota, corpo celeste).
 * Clique esquerdo seleciona; clique direito dá a ordem (mover exército,
 * atacar, desembarcar, mover frota, bombardear).
 */
/**
 * Objeto da GUI pelo nome. As legendas, dicas e listas atribuídas passam
 * pela tradução (core/0_Lang.js); o resto vai direto ao objeto.
 */
var g_GuiProxies = {};
function gui(name)
{
	if (g_GuiProxies[name])
		return g_GuiProxies[name];
	const obj = Engine.GetGUIObjectByName(name);
	if (!obj)
		return obj;
	return g_GuiProxies[name] = new Proxy(obj, {
		"set": (target, key, value) => {
			if ((key == "caption" || key == "tooltip") && typeof value == "string")
			{
				value = WH40KLang.tr(value);
				// Títulos longos (nomes traduzidos) usam letra menor para caber numa linha.
				if (name == "sideTitle" && key == "caption")
				{
					const len = value.replace(/\[[^\]]*\]/g, "").length;
					target.font = len > 30 ? "sans-bold-stroke-12" : len > 24 ? "sans-bold-stroke-14" : "sans-bold-stroke-16";
				}
			}
			else if (key == "list" && Array.isArray(value))
				value = value.map(v => WH40KLang.tr(v));
			target[key] = value;
			return true;
		},
		"get": (target, key) => {
			const value = target[key];
			return typeof value == "function" ? value.bind(target) : value;
		}
	});
}

function rgbStr(rgb, alpha)
{
	return rgb[0] + " " + rgb[1] + " " + rgb[2] + (alpha === undefined ? "" : " " + alpha);
}

function colored(text, rgb)
{
	return "[color=\"" + rgbStr(rgb) + "\"]" + text + "[/color]";
}

function setSize(obj, l, t, r, b)
{
	obj.size = Math.round(l) + " " + Math.round(t) + " " + Math.round(r) + " " + Math.round(b);
}

/** Coordenada relativa "p%+off" no formato de tamanho da GUI. */
function rel(p, off)
{
	off = Math.round(off);
	return p + "%" + (off >= 0 ? "+" : "") + off;
}

function portraitSprite(path, grayscale)
{
	return (grayscale ? "grayscale:" : "") + "stretched:wh40k/portraits/" + path;
}

/** Sprite da nave da facção (factions.json: ships) no tamanho pela quantidade de naves. */
function shipSprite(D, faction, ships)
{
	const style = D.factions[faction]?.ships || "imperial";
	const size = ships >= 6 ? 3 : ships >= 4 ? 2 : ships >= 2 ? 1 : 0;
	return "stretched:campaigns/wh40k/ships/" + style + "_" + size + ".png";
}

/** Cidade-colmeia vista de cima da província (a mesma do mapa: tools/art/gen_planets.py). */
function citySprite(pid)
{
	let n = 0;
	for (let i = 0; i < pid.length; ++i)
		n += pid.charCodeAt(i);
	return "stretched:campaigns/wh40k/cities/city_" + (n % 12) + ".png";
}

function percent(x)
{
	return Math.round(x * 100) + "%";
}

function stars(level)
{
	return level ? " " + "•".repeat(level) : "";
}

var g_MouseX = 0;
var g_MouseY = 0;

function handleInputBeforeGui(ev)
{
	if (ev.type == "mousemotion" || ev.type == "mousebuttondown" || ev.type == "mousebuttonup")
	{
		g_MouseX = ev.x;
		g_MouseY = ev.y;
	}
	return false;
}

class WH40KPage
{
	constructor(initData, closePageCallback)
	{
		this.closePageCallback = closePageCallback;
		if (initData?.codex)
		{
			// Códex aberto do menu principal: só os dados, sem campanha.
			WH40KLang.translateStatic(gui);
			this.D = WH40KData.load();
			this.sound = new WH40KSound();
			this.card = new WH40KUnitCard(this);
			this.codex = new WH40KCodex(this);
			this.dialog = new WH40KDialog();
			this.codexOnly = true;
			for (const id of ["topBar", "side", "bottomBar", "mapArea"])
				gui(id).hidden = true;
			this.codex.open(null, () => this.closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } }));
			return;
		}
		if (initData?.skirmish)
		{
			// Escaramuça: só uma batalha, sem campanha (ui/Skirmish.js).
			this.skirmishMode = true;
			this.initComponents();
			this.skirmish = new WH40KSkirmish(this);
			this.skirmish.menu();
			return;
		}
		const filename = initData?.filename || CampaignRun.getCurrentRunFilename();
		this.run = new CampaignRun(filename).load();
		if (!this.run.isCurrent())
			this.run.setCurrent();
		this.initComponents();
		if (!this.run.data.state)
		{
			this.chooseFaction();
			return;
		}
		this.start();
		this.debugShot = !!initData?.debugView;
		if (initData?.debugView)
			this.debug(initData.debugView);
	}

	initComponents()
	{
		WH40KLang.translateStatic(gui);
		this.sound = new WH40KSound();
		this.dialog = new WH40KDialog();
		this.card = new WH40KUnitCard(this);
		this.codex = new WH40KCodex(this);
		this.selector = new WH40KSelector(this);
		this.stats = new WH40KStats(this);
		this.cinema = new WH40KCinematic(this);
		this.side = new WH40KSidePanel(this);
		this.system = new WH40KSystemView(this);
		this.planet = new WH40KPlanetView(this);
		this.deploy = new WH40KDeployView(this);
		this.battle = new WH40KBattleView(this);
		this.space = new WH40KSpaceView(this);
		this.fx = new WH40KCampaignFx(this);
		this.sel = null;
		this.view = "system";
		this.body = null;

		gui("btnSystem").onPress = () => this.showSystem();
		gui("btnSystem").tooltip = "Vista do sistema estelar: planetas, luas e frotas.";
		gui("btnPlanet").onPress = () => this.showPlanet(this.body || this.homeBody());
		gui("btnPlanet").tooltip = "Mapa do planeta selecionado.";
		gui("btnLog").onPress = () => this.showLog();
		gui("btnLog").tooltip = "Todos os eventos recentes.";
		gui("btnEndTurn").onPress = () => this.endTurn();
		gui("btnEndTurn").tooltip = "Termina o turno: a IA joga, as frotas viajam, a economia rende e as baixas são repostas.";
		gui("btnMenu").onPress = () => this.exit();
		gui("topSpecial").onPress = () => this.openRituals();
		gui("planetThreatBtn").onPress = () => { this.threatMode = !this.threatMode; this.refresh(); };
		gui("planetUndoBtn").onPress = () => this.undo();
		this.undoStack = [];
		gui("btnMenu").tooltip = "Salva a campanha e volta ao menu principal.";
		gui("wh40kRoot").onWindowResized = () => this.refresh();
	}

	/** Usado pelos testes (tools/test/guishot.sh): abre uma vista direto. */
	debug(view)
	{
		const army = this.game.armiesOf(this.player)[0];
		if (view.startsWith("cinema"))
		{
			// cinema ou cinema:<quadro> (1-6): abre já no quadro pedido, no meio do movimento.
			this.cinema.open(null);
			const k = parseInt(view.split(":")[1] || "1", 10) - 1;
			while (this.cinema.index < k)
				this.cinema.next();
			this.cinema.hold = 7;
		}
		else if (view.startsWith("planet:"))
			this.showPlanet(view.slice(7));
		else if (view == "system")
			this.showSystem();
		else if (view == "army" && army)
			this.select({ "type": "army", "id": army.id });
		else if (view == "deploy" && army)
		{
			const targets = this.game.armyTargets(army);
			const attacks = Object.keys(targets).filter(p => targets[p] == "attack");
			const pid = attacks.find(p => this.D.provinces[p].hive) || attacks[0];
			if (pid)
				this.openDeploy(this.game.makeBattle(pid, this.player, [army.id], "assault"));
		}
		else if ((view == "battle" || view == "launch") && army)
		{
			this.debug("deploy");
			if (this.deploy.setup)
				this.startBattle(this.deploy.setup, this.deploy.deployment);
		}
		else if (view == "card" && army)
		{
			this.select({ "type": "army", "id": army.id });
			const bat = army.battalions[army.battalions.length - 1];
			if (bat)
				this.card.open({ "bat": bat });
		}
		else if (view == "gencard" && army && army.general)
			this.card.open({ "general": army.general });
		else if (view == "ritual" && army)
		{
			this.game.s.factions[this.player].special = 200;
			this.select({ "type": "army", "id": army.id });
			this.side.mode = "ritual";
			this.side.ritualArmy = army.id;
			this.refresh();
		}
		else if (view == "space")
		{
			const enemy = Object.keys(this.game.s.factions).find(f => this.game.hostile(f, this.player));
			const body = this.homeBody();
			this.space.debugLoop = !!this.debugShot;
			this.space.open({ "title": "Batalha espacial em " + this.D.bodies[body].name + ": vitória de " + this.D.factionName(this.player), "lines": [], "space": true, "winner": this.player,
				"fleetBattle": { "body": body, "sides": [{ "faction": this.player, "before": 7, "after": 5 }, { "faction": enemy, "before": 6, "after": 0 }] } });
		}
		else if (view == "victory")
		{
			this.game.s.gameOver = { "won": true, "text": "Teste da tela de vitória." };
			this.processQueue();
		}
		else if (view == "codex")
			this.codex.open(this.player);
		else if (view == "stats")
			this.stats.open();
		else if (view == "diplomacy")
			this.showDiplomacy();
		else if (view == "choice")
		{
			const ev = WH40K_EVENTS.find(e => e.when(this.game, this.player) && (!e.factions || e.factions(this.game, this.player)));
			if (ev)
				this.game.s.pendingChoices.push({ "kind": "event", "event": ev.id, "faction": this.player, "ctx": ev.when(this.game, this.player), "turn": this.game.s.turn });
			this.processQueue();
		}
		else if (view == "sack" && army)
		{
			// Mostra os efeitos: saque, bombardeio, conquista e batalha na província do exército.
			// Espera a página estar desenhada (em máquina lenta o primeiro quadro demora).
			this.debugEvents = { "at": Date.now() + 5000, "pid": army.province };
		}
	}

	/** Esc: fecha a janela de cima (ficha, estatísticas, códex). */
	cancel()
	{
		if (this.cinema && this.cinema.isOpen())
			this.cinema.finish();
		else if (this.card.isOpen())
			this.card.close();
		else if (this.codex && this.codex.isOpen())
			this.codex.close();
		else if (this.selector && this.selector.isOpen())
			gui("selCancel").onPress();
		else if (this.stats && this.stats.isOpen())
			this.stats.close();
		else if (this.codex && this.codex.isOpen())
			this.codex.close();
	}

	/** Tique (onTick da raiz): animações e a batalha 2D. */
	tick()
	{
		if (this.codexOnly)
			return;
		const now = Date.now();
		if (this.cinema && this.cinema.isOpen())
			this.cinema.tick(now);
		if (this.fx)
			this.fx.tick(now);
		if (this.view == "battle")
			this.battle.tick(now);
		if (this.view == "space")
			this.space.tick(now);
		if (this.view == "planet" && this.body && !this.dialog.isOpen())
			this.sound.ambient(this.D.bodies[this.body]?.palette);
		if (this.debugEvents && now >= this.debugEvents.at)
		{
			const pid = this.debugEvents.pid;
			// Repete a cada 8 s (para as capturas de tela pegarem as animações).
			this.debugEvents.at = now + 8000;
			for (const kind of ["orbital", "sack", "landing", "battle", "capture"])
				this.game.event(kind, pid, this.player);
			this.game.province(pid).devastated = 2;
			this.refresh();
		}
	}

	start()
	{
		this.game = new WH40KGame(this.run.data.state);
		this.D = this.game.D;
		this.view = "planet";
		this.body = this.homeBody();
		// Resto da versão com batalha 3D: resultado de partida que não se aplica mais.
		delete this.run.data.processEndedGame;
		this.sound.setTheme(this.player, this.D);
		this.sound.music("campaign");
		this.refresh();
		this.processQueue();
	}

	// ------------------------------------------------------------ recurso especial, diplomacia

	/** Painel dos rituais: no exército selecionado (se for seu) ou os da facção. */
	openRituals()
	{
		if (!this.game || this.view == "deploy" || this.view == "battle" || !this.game.special(this.player))
			return;
		const army = this.selectedArmy();
		this.side.mode = "ritual";
		this.side.ritualArmy = army && army.faction == this.player ? army.id : null;
		this.refresh();
	}

	showDiplomacy()
	{
		const g = this.game;
		const me = this.player;
		const others = Object.keys(g.s.factions).filter(f => f != me && g.s.factions[f].alive && !this.D.allied(f, me));
		const lines = others.map(f => {
			const fd = this.D.factions[f];
			let state;
			if (g.inAlliance(f, me))
			{
				const al = g.s.alliances[g.truceKey(f, me)];
				state = colored("aliança de conveniência desde o turno " + al.since + (al.enemy ? " contra " + this.D.factionName(al.enemy) : ""), [150, 220, 150]);
			}
			else if (g.inTruce(f, me))
				state = colored("em trégua até o turno " + g.s.truces[g.truceKey(f, me)].until, [150, 220, 150]);
			else
			{
				const why = g.canTruce(me, f);
				state = why ? colored("em guerra — " + why, [220, 140, 110]) : colored("em guerra — aceita negociar (chance " + percent(g.truceChance(f, me)) + ")", [235, 205, 125]);
				if (!g.canAlly(me, f))
					state += "\n  " + colored("aceitaria uma aliança contra " + this.D.factionName(g.commonThreat(me, f, WH40K_ALLY_THREAT)) + " (chance " + percent(g.allianceChance(f, me)) + ")", [235, 205, 125]);
			}
			return colored(fd.name, fd.color) + (g.s.factions[f].treachery ? " (traiu " + g.s.factions[f].treachery + "×)" : "") + "\n  " + state;
		});
		const allies = Object.keys(g.s.factions).filter(f => f != me && this.D.allied(f, me) && g.s.factions[f].alive);
		const buttons = [];
		for (const f of others)
		{
			const name = this.D.factions[f].short || this.D.factions[f].name;
			if (g.inAlliance(f, me))
				buttons.push({ "caption": "Romper aliança: " + name, "tooltip": "Trai o aliado: +20% no ataque dos seus exércitos neste turno, mas ninguém confiará em você por um bom tempo.",
					"onPress": () => { g.breakAlliance(me, f, "", me); this.save(); this.refresh(); this.showDiplomacy(); } });
			else if (!g.canAlly(me, f))
				buttons.push({ "caption": "Aliança: " + name, "tooltip": "Aliança de conveniência contra " + this.D.factionName(g.commonThreat(me, f, WH40K_ALLY_THREAT)) + ": não se atacam, passam pelas terras um do outro e mandam reforços às batalhas. Chance de aceitar: " + percent(g.allianceChance(f, me)) + ".",
					"onPress": () => {
						const res = g.proposeAlliance(me, f);
						this.save();
						this.refresh();
						this.dialog.open({ "title": "Diplomacia", "text": res.error || (res.accepted ? this.D.factions[f].name + " aceita a aliança." : this.D.factions[f].name + " recusa a proposta."),
							"buttons": [{ "caption": "Voltar", "onPress": () => this.showDiplomacy() }, { "caption": "Fechar" }] });
					} });
			else if (g.inTruce(f, me))
				buttons.push({ "caption": "Trair: " + name, "tooltip": "Rompe a trégua: +20% no ataque dos seus exércitos neste turno, mas ninguém confiará em você por um bom tempo.",
					"onPress": () => { g.betray(me, f); this.save(); this.refresh(); this.showDiplomacy(); } });
			else if (!g.canTruce(me, f))
				buttons.push({ "caption": "Trégua: " + name, "tooltip": "Propõe " + WH40K_TRUCE_TURNS + " turnos sem ataques. Chance de aceitar: " + percent(g.truceChance(f, me)) + ".",
					"onPress": () => {
						const res = g.proposeTruce(me, f);
						this.save();
						this.refresh();
						this.dialog.open({ "title": "Diplomacia", "text": res.error || (res.accepted ? this.D.factions[f].name + " aceita a trégua até o turno " + g.s.truces[g.truceKey(f, me)].until + "." : this.D.factions[f].name + " recusa a proposta."),
							"buttons": [{ "caption": "Voltar", "onPress": () => this.showDiplomacy() }, { "caption": "Fechar" }] });
					} });
		}
		buttons.push({ "caption": "Fechar" });
		this.dialog.open({
			"title": "Diplomacia",
			"text": (allies.length ? "Aliados de campanha: " + allies.map(f => colored(this.D.factions[f].name, this.D.factions[f].color)).join(", ") + "\n\n" : "") +
				lines.join("\n\n") +
				"\n\nTrégua: " + WH40K_TRUCE_TURNS + " turnos sem ataques; os exércitos passam pelas terras um do outro sem tomá-las. A vitória ainda exige derrotar quem está em trégua." +
				"\n\nAliados (os de campanha e os de conveniência) não se atacam e mandam reforços às batalhas vizinhas. As alianças de conveniência do Caos duram enquanto houver um inimigo comum." +
				(this.D.factions[me].pact?.never ? "\n\n" + colored(this.D.factions[me].pact.never, [220, 140, 110]) : ""),
			"portrait": portraitSprite(this.D.factionPortrait(me)),
			"buttons": buttons.slice(0, WH40K_DIALOG_BUTTONS)
		});
	}

	/** Próxima escolha pendente (evento ou proposta de trégua). */
	showChoice(choice)
	{
		const view = this.game.choiceView(choice);
		if (!view)
		{
			this.game.resolveChoice(choice, 0);
			this.processQueue();
			return;
		}
		this.sound.ui("card");
		this.dialog.open({
			"title": view.title,
			"text": view.text,
			"portrait": portraitSprite(view.portrait),
			"buttons": view.options.map((o, i) => ({
				"caption": o.caption,
				"tooltip": (o.tooltip || "") + (o.why ? (o.tooltip ? "\n" : "") + colored(o.why, [250, 120, 90]) : ""),
				"enabled": !o.why,
				"onPress": () => {
					const text = this.game.resolveChoice(choice, i);
					this.save();
					this.refresh();
					if (text && i >= 0 && choice.kind == "event")
						this.flash(text);
					this.processQueue();
				}
			}))
		});
	}

	save()
	{
		if (this.skirmishMode)
			return;
		this.run.data.state = this.game.s;
		this.run.save();
	}

	exit()
	{
		if (this.view == "battle" && this.battle.active)
		{
			// Sair no meio da batalha: retirada geral, o resto se resolve sozinho.
			this.battle.abandon();
			this.view = "planet";
		}
		if (this.game)
			this.save();
		this.closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
	}

	get player()
	{
		return this.game.player;
	}

	homeBody()
	{
		const armies = this.game.armiesOf(this.player).filter(a => a.province);
		if (armies.length)
			return this.D.provinces[armies[0].province].body;
		const provs = this.game.provincesOf(this.player);
		return provs.length ? this.D.provinces[provs[0]].body : this.D.scenario.objective.body;
	}

	// ------------------------------------------------------------ nova campanha

	/** Nova campanha: primeiro a campanha (cenário), depois o lado e a dificuldade (seletor em grade). */
	chooseFaction()
	{
		const D = WH40KData.load();
		const toMenu = () => this.closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
		const items = D.scenarios.map(sc => {
			let year = "";
			let bodies = 0;
			let objectiveBody = sc.objective.body;
			try
			{
				const sector = Engine.ReadJSONFile(WH40K_DATA_DIR + sc.sector);
				year = sector.start.year;
				bodies = sector.bodies.length;
			}
			catch (e)
			{
				// setor ilegível: sem ano
			}
			const factions = sc.factions.filter(f => D.factions[f]);
			return {
				"id": sc.id,
				"name": sc.name,
				"icon": "stretched:campaigns/wh40k/planets/" + objectiveBody + "/globe.png",
				"preview": portraitSprite(sc.portraits[0]),
				"info": year + " · " + factions.length + " facções · " + bodies + " corpos celestes",
				"desc": sc.intro + "\n\n" + colored("Facções: ", [235, 205, 125]) + factions.map(f => colored(D.factions[f].name, D.factions[f].color)).join(", ") +
					(sc.teams ? "\n" + colored("Alianças: ", [235, 205, 125]) + Object.values(sc.teams).map(t => t.map(f => D.factions[f]?.short || f).join(" + ")).join("; ") : "") +
					"\n" + colored("Vitória: ", [235, 205, 125]) + sc.objective.text + ".",
				"tags": { "era": year.indexOf("M42") != -1 ? "M42 (Era Indomitus)" : "M41", "sides": factions.length == 2 ? "Dois lados" : factions.length + " lados" }
			};
		});
		this.selector.open({
			"title": "Escolha a campanha",
			"items": items,
			"filters": [{ "label": "Era", "key": "era" }, { "label": "Lados", "key": "sides" }],
			"okCaption": "Escolher lado",
			"selected": this.lastScenario,
			"onSelect": id => {
				this.lastScenario = id;
				this.chooseSide(id);
			},
			"onCancel": toMenu
		});
	}

	/** Itens de facção para o seletor em grade. */
	factionItems(D, list, scenario)
	{
		const groups = { "imperium": "Imperium", "chaos": "Caos", "secessionists": "Secessionistas", "orks": "Orks", "tyranids": "Tiranídeos", "necrons": "Necrons", "eldar": "Eldar", "drukhari": "Drukhari", "tau": "Tau" };
		return list.map(f => {
			const fd = D.factions[f];
			const team = scenario && D.teamOf(f);
			const allies = team ? scenario.teams[team].filter(x => x != f).map(x => D.factions[x]?.name).filter(Boolean) : [];
			return {
				"id": f,
				"name": fd.short || fd.name,
				"icon": "stretched:" + fd.emblem,
				"preview": portraitSprite(fd.portrait),
				"info": fd.name + (fd.special ? " · " + fd.special.name : ""),
				"desc": fd.description + (fd.tips ? "\n\n" + colored("Como jogar: ", [235, 205, 125]) + fd.tips : "") +
					(fd.special ? "\n\n" + colored(fd.special.name + ": ", [210, 170, 250]) + fd.special.desc : "") +
					(allies.length ? "\n\n" + colored("Aliados: ", [150, 220, 150]) + allies.join(", ") : "") +
					"\n\n" + D.unitsOf(f).filter(u => !u.noRecruit).length + " unidades · " + Object.values(D.generals).filter(g => g.faction == f).length + " generais",
				"tags": { "group": groups[fd.pact?.group] || "Outros", "role": scenario ? (scenario.playable.indexOf(f) != -1 ? "Jogável" : "IA") : "Jogável" }
			};
		});
	}

	chooseSide(scenarioId)
	{
		const D = WH40KData.load(scenarioId);
		const sc = D.scenario;
		this.selector.open({
			"title": sc.name + " — escolha seu lado",
			"items": this.factionItems(D, D.playableFactions(), sc),
			"filters": [{ "label": "Grupo", "key": "group" }],
			"extra": { "label": "Dificuldade", "options": Object.keys(WH40K_DIFFICULTY).map(k => ({ "id": k, "name": WH40K_DIFFICULTY[k].name })), "value": this.lastDifficulty || "normal" },
			"aux": { "caption": "Códex", "onPress": f => this.codex.open(f) },
			"okCaption": "Começar",
			"onSelect": (f, difficulty) => {
				this.lastDifficulty = difficulty;
				this.startCampaign(scenarioId, f, difficulty);
			},
			"onCancel": () => this.chooseFaction()
		});
	}

	startCampaign(scenarioId, f, difficulty)
	{
		const D = WH40KData.load(scenarioId);
		this.run.data.state = WH40KGame.newState(f, scenarioId, difficulty);
		this.run.save();
		this.start();
		const start = D.sector.startingArmies.find(a => a.faction == f && a.general);
		// Primeiro a cinemática de introdução; depois as ordens iniciais.
		this.cinema.open(() => this.dialog.open({
			"title": "Ordens iniciais — " + WH40K_DIFFICULTY[difficulty || "normal"].name,
			"text": this.tutorialText(),
			"portrait": portraitSprite(start ? D.generals[start.general].portrait : D.factionPortrait(f)),
			"buttons": [{ "caption": "Às armas!" }]
		}));
	}

	tutorialText()
	{
		const f = this.D.factions[this.player];
		return "• Sistema: clique num planeta para selecioná-lo, clique de novo (ou 'Planeta') para abrir o mapa. Selecione uma frota e clique com o botão direito num corpo para viajar.\n" +
			"• Planeta: clique num exército (retrato do general) e depois com o botão direito numa província vizinha para marchar ou atacar.\n" +
			"• Frotas levam exércitos (Embarcar) entre planetas e luas; com a órbita livre de inimigos você desembarca em qualquer província, bombardeia guarnições e ganha apoio orbital nas batalhas.\n" +
			"• Ao atacar, escolha 'Comandar': posicione os batalhões, dê ordens e assista à batalha em tempo real no mapa tático, mudando as ordens durante a luta. Baixas inimigas liberam o apoio.\n" +
			"• Uma província recém-conquistada pode ser saqueada: muito dinheiro na hora, mas ela fica devastada por alguns turnos.\n" +
			(f.tips ? "• " + f.tips + "\n" : "") +
			(f.special ? "• " + f.special.name + ": " + f.special.desc + " Gaste em rituais (clique no recurso no topo, ou 'Rituais' no exército).\n" : "") +
			"• Generais ganham experiência, níveis, traços e relíquias (um general seu numa província com relíquia a reclama). Clique no retrato para a ficha.\n" +
			"• Diplomacia: algumas facções aceitam tréguas — e podem traí-las. Eventos pedem decisões no começo do turno.\n" +
			"• Objetivo: " + this.D.scenario.objective.text + ", ou expulsar os inimigos do sistema.";
	}

	// ------------------------------------------------------------ vistas

	showSystem()
	{
		this.view = "system";
		this.refresh();
	}

	showPlanet(body)
	{
		if (!body || !this.D.bodies[body]?.landProvinces.length)
			return;
		this.view = "planet";
		this.body = body;
		this.refresh();
	}

	refresh()
	{
		if (!this.game || this.view == "skirmish")
			return;
		const deploying = this.view == "deploy" || this.view == "battle" || this.view == "space";
		gui("systemView").hidden = this.view != "system";
		gui("planetView").hidden = this.view != "planet";
		gui("deployView").hidden = this.view != "deploy" && this.view != "battle";
		gui("spaceView").hidden = this.view != "space";
		// Desdobramento e batalha: sem o registro, o campo usa a altura toda.
		gui("bottomBar").hidden = deploying;
		gui("mapArea").size = deploying ? "0 44 100%-370 100%" : "0 44 100%-370 100%-62";
		for (const b of ["btnSystem", "btnPlanet", "btnEndTurn", "btnLog"])
			gui(b).enabled = !deploying;
		gui("btnMenu").tooltip = this.view == "battle" ? "Abandona a batalha (retirada geral), salva e volta ao menu principal." : "Salva a campanha e volta ao menu principal.";
		this.renderTop();
		gui("planetUndoBtn").hidden = !this.undoStack.length;
		if (this.undoStack.length)
			gui("planetUndoBtn").tooltip = "Desfaz: " + this.undoStack[this.undoStack.length - 1].label + ".";
		gui("planetThreatBtn").caption = this.threatMode ? "Mapa normal" : "Mapa de ameaça";
		if (this.view == "system")
		{
			this.system.render();
			this.fx.renderSystem(this.system);
		}
		else if (this.view == "planet")
		{
			this.planet.render(this.body);
			this.fx.renderPlanet(this.body, this.planet);
		}
		else if (this.view == "battle")
			this.battle.render();
		else if (this.view == "space")
			this.space.render();
		else
			this.deploy.render();
		if (!deploying)
			this.side.render();
		this.renderLog();
	}

	renderTop()
	{
		const g = this.game;
		const f = this.D.factions[this.player];
		gui("topEmblem").sprite = "stretched:" + f.emblem;
		gui("topFaction").caption = f.name;
		const income = Math.round(g.income(this.player) * g.incomeFactor(this.player));
		const upkeep = g.upkeep(this.player);
		const net = income - upkeep;
		gui("topFunds").caption = f.currency + ": " + g.s.factions[this.player].funds + "  " + colored((net >= 0 ? "+" : "") + net, net >= 0 ? [140, 220, 120] : [240, 110, 90]);
		gui("topFunds").tooltip = "Rendimento das províncias: +" + income + "\nManutenção (exércitos, guarnições, frotas): -" + upkeep + "\nSem recursos, batalhões desertam.";
		gui("topTurn").caption = "Turno " + g.s.turn + " — " + this.D.sector.start.year;
		const sp = g.special(this.player);
		gui("topSpecial").hidden = !sp;
		if (sp)
		{
			gui("topSpecialIcon").sprite = portraitSprite(sp.icon);
			gui("topSpecialText").caption = sp.short + ": " + g.specialAmount(this.player) + colored("/" + sp.max, [170, 160, 140]);
			const ready = sp.rituals.filter(r => r.cost <= g.specialAmount(this.player)).length;
			gui("topSpecial").tooltip = colored(sp.name, [235, 205, 125]) + "\n" + sp.desc + "\n\nGanha com: " + specialGainText(sp) +
				"\n\nRituais disponíveis agora: " + ready + " de " + sp.rituals.length + ".\nClique: abrir os rituais (no exército selecionado).";
		}
		const obj = g.objective();
		gui("topObjective").caption = this.D.scenario.objective.label + ": " + obj.mine + "/" + obj.hives + (obj.holdUntil ? colored(" · resista até o turno " + obj.holdUntil, [240, 200, 120]) :
			obj.mine == obj.hives ? colored(" · segurando " + obj.held + "/" + obj.need + " turnos", [150, 230, 120]) : "");
		gui("topObjective").tooltip = this.D.scenario.name + " — vitória: " + this.D.scenario.objective.text + " por " + WH40K_OBJECTIVE_TURNS + " turnos seguidos, ou expulsar os inimigos do sistema.";
	}

	renderLog()
	{
		const lines = this.game.s.log.slice(-3).reverse().map(e => {
			const color = { "battle": [240, 170, 120], "capture": [200, 220, 140], "space": [150, 190, 240], "orbital": [230, 150, 230], "sack": [240, 140, 60], "warning": [250, 110, 90], "victory": [250, 220, 110],
				"ritual": [210, 170, 250], "relic": [250, 225, 150], "diplomacy": [150, 220, 210], "event": [230, 200, 160] }[e.kind] || [215, 205, 185];
			return colored("T" + e.turn, [150, 140, 120]) + "  " + colored(e.text, color);
		});
		gui("logText").caption = lines.join("\n");
	}

	showLog()
	{
		this.dialog.open({
			"title": "Registro da Cruzada",
			"text": this.game.s.log.slice(-80).reverse().map(e => "T" + e.turn + "  " + e.text).join("\n"),
			"buttons": [{ "caption": "Fechar" }]
		});
	}

	// ------------------------------------------------------------ seleção e ordens

	select(sel)
	{
		this.sel = sel;
		this.side.focusBat = null;
		this.side.mode = null;
		this.refresh();
	}

	selectedArmy()
	{
		return this.sel && this.sel.type == "army" ? this.game.s.armies[this.sel.id] : null;
	}

	selectedFleet()
	{
		return this.sel && this.sel.type == "fleet" ? this.game.s.fleets[this.sel.id] : null;
	}

	// ------------------------------------------------------------ desfazer, conselheiro, salvamento

	/** Guarda o estado antes de um movimento (desfazer). */
	pushUndo(label)
	{
		this.undoStack.push({ "label": label, "state": JSON.stringify(this.game.s) });
		if (this.undoStack.length > 10)
			this.undoStack.shift();
	}

	/** Sem desfazer depois do que tem acaso (batalhas, rituais, eventos, fim de turno). */
	clearUndo()
	{
		this.undoStack = [];
	}

	undo()
	{
		const last = this.undoStack.pop();
		if (!last)
			return;
		const state = JSON.parse(last.state);
		for (const k of Object.keys(this.game.s))
			delete this.game.s[k];
		Object.assign(this.game.s, state);
		this.sel = null;
		this.side.mode = null;
		this.save();
		this.flash("Desfeito: " + last.label + ".");
		this.refresh();
	}

	/** Conselheiro: o que pede atenção neste turno. */
	advice()
	{
		const g = this.game;
		const D = this.D;
		const me = this.player;
		const out = [];
		for (const pid of g.provincesOf(me))
		{
			if (g.hasOrder(me) && g.orderOf(pid) < 25)
				out.push(colored("Ordem baixa", [250, 150, 90]) + " em " + D.provinces[pid].name + " (" + g.orderOf(pid) + "): deixe um exército, uma guarnição ou construa um santuário.");
			if (D.provinces[pid].hive == 2 && !g.province(pid).garrison.length && !g.armiesAt(pid, me).length &&
				D.provinces[pid].neighbors.some(n => g.isHostileTarget(n, me)))
				out.push(colored("Cidade indefesa", [250, 120, 90]) + ": " + D.provinces[pid].name + " está na fronteira sem guarnição nem exército.");
		}
		for (const fleet of Object.values(g.s.fleets))
			if (g.hostile(fleet.faction, me) && fleet.dest && D.bodies[fleet.dest].landProvinces.some(pid => g.province(pid).owner == me))
				out.push(colored("Frota inimiga a caminho", [250, 120, 90]) + ": " + fleet.name + " (" + fleet.ships + " naves) chega a " + D.bodies[fleet.dest].name + " em " + fleet.eta + " turno(s).");
		const idle = g.armiesOf(me).filter(a => a.province && a.moves > 0 && a.battalions.length);
		if (idle.length)
			out.push(idle.length + " exército(s) ainda podem marchar: " + idle.map(a => g.general(a)?.name || "exército em " + D.provinces[a.province].name).join(", ") + ".");
		const sp = g.special(me);
		if (sp && sp.rituals.some(r => r.cost <= g.specialAmount(me)))
			out.push(colored(sp.name, [210, 170, 250]) + ": " + g.specialAmount(me) + " — há rituais ou melhorias ao seu alcance.");
		if (g.s.factions[me].funds > 900)
			out.push("Sobram recursos (" + g.s.factions[me].funds + "): recrute, construa ou contrate um general.");
		const hire = g.hireableGenerals(me).filter(id => D.generals[id].hireCost <= g.s.factions[me].funds);
		if (hire.length)
			out.push("Generais disponíveis: " + hire.map(id => D.generals[id].name).join(", ") + ".");
		const obj = g.objective();
		out.push("Objetivo: " + obj.mine + "/" + obj.hives + " cidades" + (obj.mine == obj.hives ? ", segurando " + obj.held + "/" + obj.need + " turnos" : "") + ".");
		return out;
	}

	showAdvice()
	{
		this.dialog.open({
			"title": "Conselheiro de Guerra",
			"text": this.advice().map(t => "• " + t).join("\n"),
			"portrait": portraitSprite(this.D.factionPortrait(this.player)),
			"buttons": [{ "caption": "Fechar" }]
		});
	}

	/** Salvamento automático por turno (um arquivo "_auto") e cópias manuais. */
	saveCopy(suffix, label)
	{
		try
		{
			const copy = new CampaignRun(this.run.filename.replace(/_(auto|t\d+)$/, "") + "_" + suffix);
			copy.template = this.run.template;
			copy.meta = { "userDescription": ((this.run.meta || {}).userDescription || "Cruzada") + " — " + label };
			copy.data = { "state": JSON.parse(JSON.stringify(this.game.s)) };
			copy.save();
			return true;
		}
		catch (e)
		{
			warn("40k Wars: não foi possível salvar a cópia: " + e);
			return false;
		}
	}

	/** Clique direito numa província do mapa. */
	orderProvince(pid)
	{
		const army = this.selectedArmy();
		const fleet = this.selectedFleet();
		if (army && army.faction == this.player)
		{
			this.pushUndo("movimento de " + (this.game.general(army)?.name || "exército"));
			let res;
			if (army.fleet)
				res = this.game.land(army.id, pid);
			else
				res = this.game.moveArmy(army.id, pid);
			if (res.error)
			{
				this.undoStack.pop();
				this.flash(res.error);
			}
			else if (res.battle)
			{
				this.undoStack.pop();
				this.promptBattle(res.battle, true);
			}
			this.save();
			this.refresh();
			return;
		}
		if (fleet && fleet.faction == this.player && this.side.mode == "bombard")
		{
			const err = this.game.bombard(fleet.id, pid);
			this.side.mode = null;
			if (err)
				this.flash(err);
			this.save();
			this.refresh();
		}
	}

	/** A frota selecionada ataca uma frota inimiga (agora, se na mesma órbita; senão, viaja até ela). */
	attackFleet(target)
	{
		const fleet = this.selectedFleet();
		if (!fleet || fleet.faction != this.player)
			return;
		const res = this.game.attackFleet(fleet.id, target.id);
		this.save();
		if (res.pending)
		{
			this.showSpaceTactics(res.pending);
			return;
		}
		if (res.error)
			this.flash(res.error);
		else if (res.report)
		{
			if (!this.game.s.fleets[fleet.id])
				this.sel = null;
			if (res.report.fleetBattle)
				this.space.open(res.report);
			else
				this.showReport(res.report);
			return;
		}
		else
			this.flash("A frota " + fleet.name + " parte para atacar " + target.name + " em " + this.D.bodies[res.body].name + " (" + res.eta + " turno(s)); a batalha acontece na chegada.");
		this.refresh();
	}

	/** Clique direito num corpo na vista do sistema. */
	orderBody(body)
	{
		const fleet = this.selectedFleet();
		if (!fleet || fleet.faction != this.player)
			return;
		this.pushUndo("viagem da frota " + fleet.name);
		const err = this.game.moveFleet(fleet.id, body);
		if (err)
			this.undoStack.pop();
		if (err)
			this.flash(err);
		this.save();
		this.refresh();
	}

	flash(text)
	{
		this.game.log(text, "warning", this.player);
		this.renderLog();
		gui("planetHint").caption = colored(text, [250, 120, 90]);
		gui("sysHint").caption = colored(text, [250, 120, 90]);
	}

	// ------------------------------------------------------------ turno

	endTurn()
	{
		if (this.dialog.isOpen() || this.game.s.gameOver || this.view == "space")
			return;
		this.clearUndo();
		const res = this.game.endTurn();
		this.save();
		this.saveCopy("auto", "automático, turno " + this.game.s.turn);
		this.queue = (this.queue || []).concat(res.reports.map(r => () => r.fleetBattle ? this.space.open(r) : this.showReport(r)));
		this.refresh();
		this.processQueue();
	}

	/** Mostra os relatórios e as batalhas pendentes, uma janela por vez. */
	processQueue()
	{
		if (this.dialog.isOpen())
			return;
		this.queue = this.queue || [];
		if (this.queue.length)
		{
			this.queue.shift()();
			return;
		}
		const space = this.game.nextPendingSpace();
		if (space)
		{
			this.showSpaceTactics(space);
			return;
		}
		const choice = this.game.s.pendingChoices[0];
		if (choice && !this.game.s.gameOver)
		{
			this.showChoice(choice);
			return;
		}
		const pending = this.game.nextPendingBattle();
		if (pending)
		{
			this.promptBattle(pending, false);
			return;
		}
		if (this.game.s.gameOver && !this.gameOverShown)
		{
			this.gameOverShown = true;
			const won = this.game.s.gameOver.won;
			this.dialog.open({
				"title": won ? "VITÓRIA!" : "DERROTA",
				"text": this.game.s.gameOver.text + "\n\nVocê pode continuar jogando para conquistar o resto do sistema.",
				"portrait": portraitSprite(this.D.factionPortrait(this.player, won ? "win" : "lose")),
				"buttons": [{ "caption": "Continuar" }, { "caption": "Estatísticas", "onPress": () => this.stats.open() }]
					.concat(won && this.nextSystems().length ? [{ "caption": "Seguir pela disformidade", "tooltip": "Leva a sua facção a outro sistema, com os generais (níveis, traços, relíquias), as melhorias e o recurso especial.", "onPress": () => this.chooseNextSystem() }] : [])
					.concat([{ "caption": "Menu principal", "onPress": () => this.exit() }])
			});
			this.showEndCard(won);
		}
	}

	/** Batalha espacial: o jogador escolhe a tática, depois a luta aparece na tela. */
	showSpaceTactics(p)
	{
		const g = this.game;
		const D = this.D;
		const me = this.player;
		const enemy = p.a == me ? p.b : p.a;
		const mine = g.fleetsAt(p.body, me);
		const theirs = g.fleetsAt(p.body, enemy);
		const count = list => list.reduce((s, f) => s + f.ships, 0);
		const cargo = mine.some(f => f.cargo.length);
		this.dialog.open({
			"title": "Batalha espacial em " + D.bodies[p.body].name,
			"text": colored(D.factionName(me), D.factionColor(me)) + ": " + count(mine) + " naves (" + mine.map(f => f.name).join(", ") + ")" + (cargo ? " · com exército a bordo" : "") + "\n" +
				colored(D.factionName(enemy), D.factionColor(enemy)) + ": " + count(theirs) + " naves (" + theirs.map(f => f.name).join(", ") + ")\n" +
				(p.attacker == me ? colored("Você ataca primeiro: +15% de força.", [150, 230, 120]) + "\n" : "") + "\nEscolha a tática:\n" +
				Object.values(WH40K_SPACE_TACTICS).map(t => colored(t.name, [235, 205, 125]) + " — " + t.desc).join("\n"),
			"portrait": shipSprite(D, me, count(mine)),
			"portraitB": shipSprite(D, enemy, count(theirs)),
			"buttons": Object.keys(WH40K_SPACE_TACTICS).map(k => ({
				"caption": WH40K_SPACE_TACTICS[k].name,
				"tooltip": WH40K_SPACE_TACTICS[k].desc,
				"enabled": !WH40K_SPACE_TACTICS[k].cargo || cargo,
				"onPress": () => {
					const report = g.resolveSpace(p, k, p.attacker);
					g.checkElimination();
					if (!g.s.fleets[this.sel?.id] && this.sel?.type == "fleet")
						this.sel = null;
					this.save();
					if (report.fleetBattle)
						this.space.open(report);
					else
					{
						this.refresh();
						this.showReport(report);
					}
				}
			}))
		});
	}

	/** Campanhas onde a facção do jogador pode seguir (cruzada em sequência). */
	nextSystems()
	{
		const done = (this.game.s.chain || []).concat([this.game.s.scenario]);
		return WH40KData.scenarios.filter(sc => sc.playable.indexOf(this.player) != -1 && done.indexOf(sc.id) == -1);
	}

	chooseNextSystem()
	{
		const list = this.nextSystems();
		this.dialog.open({
			"title": "Rotas da Disformidade",
			"text": "A guerra em " + this.D.sector.system.name + " está ganha. Para onde a cruzada segue?\n\n" +
				list.map(sc => colored(sc.name, [235, 205, 125]) + " — " + sc.summary).join("\n\n") +
				"\n\nOs generais levam a experiência, os traços e as relíquias; a facção leva as melhorias e o recurso especial.",
			"portrait": portraitSprite(this.D.factionPortrait(this.player, "win")),
			"buttons": list.slice(0, 9).map(sc => ({ "caption": sc.name, "tooltip": sc.intro, "onPress": () => this.warpTo(sc.id) })).concat([{ "caption": "Ficar" }])
		});
	}

	/** Começa a próxima campanha da cruzada levando o que a facção conquistou. */
	warpTo(scenarioId)
	{
		const old = this.game.s;
		const f = this.player;
		const s = WH40KGame.newState(f, scenarioId, old.difficulty);
		s.chain = (old.chain || []).concat([old.scenario]);
		s.factions[f].special = Math.max(s.factions[f].special || 0, old.factions[f]?.special || 0);
		s.factions[f].upgrades = (old.factions[f]?.upgrades || []).slice();
		for (const g in s.generals)
		{
			const prev = old.generals[g];
			if (prev && WH40KData.generals[g]?.faction == f)
				for (const k of ["xp", "traits", "relics", "stats", "ascended"])
					if (prev[k] !== undefined)
						s.generals[g][k] = JSON.parse(JSON.stringify(prev[k]));
		}
		// Generais que viraram Cria do Caos não voltam.
		for (const g in old.generals)
			if (old.generals[g].state == "spawn" && s.generals[g])
				s.generals[g].state = "spawn";
		this.run.data.state = s;
		this.run.save();
		this.gameOverShown = false;
		this.start();
		this.dialog.open({
			"title": "Saída da Disformidade",
			"text": "A frota sai da disformidade em " + this.D.sector.system.name + ". Campanhas vencidas nesta cruzada: " + s.chain.length + ".\n\n" + this.tutorialText(),
			"portrait": portraitSprite(this.D.factionPortrait(f)),
			"buttons": [{ "caption": "Às armas!" }]
		});
	}

	/** Tela grande de vitória ou derrota (por cima da janela com os botões). */
	showEndCard(won)
	{
		const g = this.game;
		const D = this.D;
		const f = D.factions[this.player];
		const b = g.s.battleStats[this.player] || {};
		const gens = Object.keys(g.s.generals).filter(id => D.generals[id].faction == this.player && g.s.generals[id].state != "unavailable")
			.map(id => g.generalStats(id)).sort((a, c) => c.xp - a.xp);
		const hero = gens[0];
		this.card.show({
			"portrait": D.factionPortrait(this.player, won ? "win" : "lose"),
			"title": won ? "VITÓRIA" : "DERROTA",
			"subtitle": colored(f.name, f.color) + " · " + D.scenario.name + " · turno " + g.s.turn,
			"stats": [
				colored("Províncias: ", [235, 205, 125]) + g.provincesOf(this.player).length + " de " + Object.keys(g.s.provinces).length,
				colored("Batalhas: ", [235, 205, 125]) + (b.battles || 0) + " (" + (b.wins || 0) + " vitórias)",
				colored("Baixas: ", [235, 205, 125]) + "causadas " + (b.kills || 0) + " · sofridas " + (b.losses || 0),
				colored("Rituais: ", [235, 205, 125]) + (b.rituals || 0) + (g.upgradesOf(this.player).length ? " · melhorias " + g.upgradesOf(this.player).length : ""),
				hero ? colored("Herói da guerra: ", [235, 205, 125]) + hero.title + " " + hero.name + " (nível " + hero.level + (hero.traitList.length ? ", " + hero.traitList.map(t => t.name).join(", ") : "") + ")" : ""
			].filter(Boolean).join("\n"),
			"desc": g.s.gameOver.text + "\n\nVocê pode continuar jogando para conquistar o resto do sistema.",
			"quote": hero ? pickFrom(D.generals[hero.id].quotes) : "",
			"color": f.color
		});
	}

	showReport(report)
	{
		const won = report.space ? report.winner == this.player : (report.winner == "attacker" ? report.attacker : report.defender) == this.player;
		this.dialog.open({
			"title": report.title,
			"text": colored(won ? "Vitória!" : "Derrota.", won ? [150, 230, 120] : [240, 110, 90]) + "\n\n" + report.lines.join("\n"),
			"portrait": portraitSprite(this.D.factionPortrait(this.player, won ? "win" : "lose")),
			"buttons": [{ "caption": "Continuar" }]
		});
	}

	// ------------------------------------------------------------ batalha

	describeSide(sides, role)
	{
		const side = sides[role];
		const name = this.D.factionName(side.faction);
		const general = side.general ? this.game.generalStats(side.general.id) : null;
		const counts = {};
		for (const e of side.entries)
		{
			const unit = this.game.unit(e.bat);
			counts[unit.name] = (counts[unit.name] || 0) + 1;
		}
		return colored(name, this.D.factionColor(side.faction)) + (general ? " — " + general.title + " " + general.name : "") +
			"\n  " + (Object.keys(counts).map(n => counts[n] + "× " + n).join(", ") || "sem tropas") +
			"\n  Força: " + Math.round(side.power);
	}

	promptBattle(battle, initiatedByPlayer)
	{
		const g = this.game;
		const sides = g.battleSides(battle);
		const pdef = g.pdef(battle.province);
		const playerRole = battle.attacker.faction == this.player ? "attacker" : "defender";
		const setup = new WH40KBattleSetup(g, battle);
		const support = setup.supportFor(playerRole);
		const chance = g.winChance(battle);
		const myChance = playerRole == "attacker" ? chance : 1 - chance;
		const myGeneral = sides[playerRole].general ? this.game.generalStats(sides[playerRole].general.id) : null;
		const enemyRole = playerRole == "attacker" ? "defender" : "attacker";
		const enemyGeneral = sides[enemyRole].general ? this.game.generalStats(sides[enemyRole].general.id) : null;
		const enemyPortrait = enemyGeneral ? enemyGeneral.portrait : (sides[enemyRole].entries[0] ? this.game.unit(sides[enemyRole].entries[0].bat).portrait : null);
		const prov = g.province(battle.province);
		const text =
			(battle.kind == "landing" ? "Assalto vindo da órbita (-15% de força para o atacante).\n" : "") +
			"Terreno: " + WH40K_TERRAIN_NAMES[pdef.terrain] + (prov.forts ? ", fortificações nível " + prov.forts : "") + (pdef.hive == 2 ? ", cidade-colmeia" : "") + ".\n\n" +
			"Atacante: " + this.describeSide(sides, "attacker") + "\n\n" +
			"Defensor: " + this.describeSide(sides, "defender") + "\n\n" +
			"Chance estimada na resolução automática: " + colored(percent(myChance), myChance >= 0.5 ? [150, 230, 120] : [240, 140, 90]) + "\n" +
			"Seu apoio na batalha: " + (support.powers.length ? support.powers.map(p => p.name + " (" + p.kills + " baixas)").join(", ") : "nenhum") +
			(support.orbit ? "" : "\n  (sem frota própria na órbita: sem cápsulas nem ataques orbitais)") +
			(support.ready ? "\n  " + support.ready + " poder(es) já pronto(s) pelo general." : "");
		const buttons = [
			{ "caption": "Desdobrar e Comandar", "tooltip": "Posicione os batalhões, dê as ordens e lute a batalha em tempo real.", "onPress": () => this.openDeploy(battle) },
			{ "caption": "Resolver Automaticamente", "tooltip": "O resultado sai na hora, pela força dos exércitos.", "onPress": () => this.autoBattle(battle) }
		];
		if (initiatedByPlayer)
			buttons.push({ "caption": "Cancelar", "onPress": () => this.processQueue() });
		this.dialog.open({
			"title": (initiatedByPlayer ? "Ataque a " : "Atacado em ") + pdef.name,
			"text": text,
			"portrait": myGeneral ? portraitSprite(myGeneral.portrait) : null,
			"portraitB": enemyPortrait ? portraitSprite(enemyPortrait) : null,
			"buttons": buttons,
			"keepQueue": true
		});
	}

	autoBattle(battle)
	{
		const pending = this.game.s.pendingBattles;
		if (pending.length && pending[0].id == battle.id)
			pending.shift();
		const report = this.game.applyBattle(battle, this.game.autoResolve(battle));
		this.clearUndo();
		this.save();
		this.refresh();
		this.showReport(report);
	}

	openDeploy(battle)
	{
		this.view = "deploy";
		this.deploy.open(new WH40KBattleSetup(this.game, battle));
		this.refresh();
	}

	closeDeploy()
	{
		if (this.skirmishMode)
			return this.skirmish.menu();
		this.view = "planet";
		this.refresh();
		this.processQueue();
	}

	/** Começa a batalha 2D no campo do desdobramento. */
	startBattle(setup, deployment)
	{
		const pending = this.game.s.pendingBattles;
		if (pending.length && pending[0].id == setup.battle.id)
			pending.shift();
		this.view = "battle";
		this.sound.warcry(this.D.factions[this.player]?.warcry, this.D.factions[setup.factionOf(setup.enemyRole)]?.warcry);
		this.sound.music("battle");
		this.battle.open(setup, deployment);
		this.refresh();
	}

	/** A batalha 2D acabou (relatório já aplicado na campanha). */
	finishBattle(report)
	{
		this.clearUndo();
		if (this.skirmishMode)
			return this.skirmish.finish(report);
		this.sound.music("campaign");
		this.view = "planet";
		this.body = this.D.provinces[report.province].body;
		this.sel = report.conquered && report.attacker == this.player ? { "type": "province", "id": report.province } : this.sel;
		this.save();
		this.refresh();
		this.showReport(report);
	}
}

const WH40K_DIALOG_BUTTONS = 10;

/** Janela modal com título, retratos, texto e até 10 botões (duas linhas acima de 5). */
class WH40KDialog
{
	isOpen()
	{
		return !gui("dialogDim").hidden;
	}

	open(opts)
	{
		gui("dialogDim").hidden = false;
		gui("dlgTitle").caption = opts.title || "";
		gui("dlgText").caption = opts.text || "";
		const a = gui("dlgPortrait");
		const b = gui("dlgPortraitB");
		a.hidden = !opts.portrait;
		b.hidden = !opts.portraitB;
		if (opts.portrait)
			a.sprite = opts.portrait;
		if (opts.portraitB)
			b.sprite = opts.portraitB;
		gui("dlgTitle").size = (opts.portrait ? "156" : "16") + " 20 100%-" + (opts.portraitB ? "156" : "16") + " 140";
		const buttons = opts.buttons || [{ "caption": "OK" }];
		const n = Math.min(WH40K_DIALOG_BUTTONS, buttons.length);
		const lines = n > 5 ? 2 : 1;
		const perLine = Math.ceil(n / lines);
		const width = 620 / perLine;
		gui("dlgText").size = "20 150 100%-20 100%-" + (lines == 2 ? 104 : 64);
		for (let i = 0; i < WH40K_DIALOG_BUTTONS; ++i)
		{
			const btn = gui("dlgBtn[" + i + "]");
			btn.hidden = i >= n;
			if (i >= n)
				continue;
			const def = buttons[i];
			btn.caption = def.caption;
			btn.tooltip = def.tooltip || "";
			btn.enabled = def.enabled !== false;
			const line = Math.floor(i / perLine);
			const col = i % perLine;
			// A última linha (com menos botões) fica centrada.
			const inLine = line == lines - 1 ? n - perLine * (lines - 1) : perLine;
			const x0 = -inLine * width / 2 + col * width;
			const y1 = lines == 2 && line == 0 ? 92 : 52;
			btn.size = rel(50, x0 + 3) + " 100%-" + y1 + " " + rel(50, x0 + width - 3) + " 100%-" + (y1 - 36);
			btn.onPress = () => {
				this.close();
				if (def.onPress)
					def.onPress();
				else if (g_WH40KPage)
					g_WH40KPage.processQueue();
			};
		}
	}

	close()
	{
		gui("dialogDim").hidden = true;
	}
}
