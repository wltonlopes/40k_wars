/**
 * Controlador da página da campanha 40k Wars.
 *
 * Vistas (mapArea): sistema estelar, planeta, desdobramento e batalha 2D. O painel
 * lateral mostra a seleção (província, exército, frota, corpo celeste).
 * Clique esquerdo seleciona; clique direito dá a ordem (mover exército,
 * atacar, desembarcar, mover frota, bombardear).
 */
function gui(name)
{
	return Engine.GetGUIObjectByName(name);
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
		const filename = initData?.filename || CampaignRun.getCurrentRunFilename();
		this.run = new CampaignRun(filename).load();
		if (!this.run.isCurrent())
			this.run.setCurrent();

		this.sound = new WH40KSound();
		this.dialog = new WH40KDialog();
		this.card = new WH40KUnitCard(this);
		this.codex = new WH40KCodex(this);
		this.stats = new WH40KStats(this);
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
		gui("btnMenu").tooltip = "Salva a campanha e volta ao menu principal.";
		gui("wh40kRoot").onWindowResized = () => this.refresh();

		if (!this.run.data.state)
		{
			this.chooseFaction();
			return;
		}
		this.start();
		if (initData?.debugView)
			this.debug(initData.debugView);
	}

	/** Usado pelos testes (tools/test/guishot.sh): abre uma vista direto. */
	debug(view)
	{
		const army = this.game.armiesOf(this.player)[0];
		if (view == "system")
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
			this.space.debugLoop = true;
			this.space.open({ "title": "Batalha espacial em " + this.D.bodies[body].name + ": vitória de " + this.D.factionName(this.player), "lines": [], "space": true, "winner": this.player,
				"fleetBattle": { "body": body, "sides": [{ "faction": this.player, "before": 7, "after": 5 }, { "faction": enemy, "before": 6, "after": 0 }] } });
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
		if (this.card.isOpen())
			this.card.close();
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
			if (g.inTruce(f, me))
				state = colored("em trégua até o turno " + g.s.truces[g.truceKey(f, me)].until, [150, 220, 150]);
			else
			{
				const why = g.canTruce(me, f);
				state = why ? colored("em guerra — " + why, [220, 140, 110]) : colored("em guerra — aceita negociar (chance " + percent(g.truceChance(f, me)) + ")", [235, 205, 125]);
			}
			return colored(fd.name, fd.color) + (g.s.factions[f].treachery ? " (traiu " + g.s.factions[f].treachery + "×)" : "") + "\n  " + state;
		});
		const allies = Object.keys(g.s.factions).filter(f => f != me && this.D.allied(f, me) && g.s.factions[f].alive);
		const buttons = [];
		for (const f of others)
		{
			const name = this.D.factions[f].short || this.D.factions[f].name;
			if (g.inTruce(f, me))
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

	/** Nova campanha: primeiro a campanha (cenário), depois o lado. */
	chooseFaction()
	{
		const D = WH40KData.load();
		const toMenu = () => this.closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
		this.dialog.open({
			"title": "Escolha a campanha",
			"text": D.scenarios.map(sc => colored(sc.name, [235, 205, 125]) + " — " + sc.summary).join("\n\n"),
			"portrait": portraitSprite("imperial/r0c6.png"),
			"portraitB": portraitSprite("chaos/r2c0.png"),
			"buttons": D.scenarios.map(sc => ({ "caption": sc.name, "tooltip": sc.intro, "onPress": () => this.chooseSide(sc.id) }))
				.concat([{ "caption": "Voltar", "onPress": toMenu }])
		});
	}

	chooseSide(scenarioId)
	{
		const D = WH40KData.load(scenarioId);
		const sc = D.scenario;
		const factions = D.playableFactions();
		const others = D.scenarioFactions().filter(f => factions.indexOf(f) == -1);
		this.dialog.open({
			"title": sc.name + " — escolha seu lado",
			"text": sc.intro + "\n\n" +
				factions.map(f => colored(D.factions[f].name, D.factions[f].color) + ": " + D.factions[f].description).join("\n\n") +
				(others.length ? "\n\nTambém em jogo (IA): " + others.map(f => D.factions[f].name).join(", ") + "." : ""),
			"portrait": portraitSprite(sc.portraits[0]),
			"portraitB": portraitSprite(sc.portraits[1]),
			"buttons": factions.map(f => ({
				"caption": D.factions[f].short || D.factions[f].name,
				"tooltip": D.factions[f].name,
				"onPress": () => this.chooseDifficulty(scenarioId, f)
			})).concat([{ "caption": "Voltar", "onPress": () => this.chooseFaction() }])
		});
	}

	chooseDifficulty(scenarioId, f)
	{
		const D = WH40KData.load(scenarioId);
		this.dialog.open({
			"title": "Dificuldade",
			"text": Object.keys(WH40K_DIFFICULTY).map(k => colored(WH40K_DIFFICULTY[k].name, [235, 205, 125]) + " — " + WH40K_DIFFICULTY[k].desc).join("\n\n"),
			"portrait": portraitSprite(D.factionPortrait(f)),
			"buttons": Object.keys(WH40K_DIFFICULTY).map(k => ({
				"caption": WH40K_DIFFICULTY[k].name,
				"tooltip": WH40K_DIFFICULTY[k].desc,
				"onPress": () => {
					this.run.data.state = WH40KGame.newState(f, scenarioId, k);
					this.run.save();
					this.start();
					const start = D.sector.startingArmies.find(a => a.faction == f && a.general);
					this.dialog.open({
						"title": "Ordens iniciais",
						"text": this.tutorialText(),
						"portrait": portraitSprite(start ? D.generals[start.general].portrait : D.factionPortrait(f)),
						"buttons": [{ "caption": "Às armas!" }]
					});
				}
			})).concat([{ "caption": "Voltar", "onPress": () => this.chooseSide(scenarioId) }])
		});
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
		if (!this.game)
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
		gui("topObjective").caption = this.D.scenario.objective.label + ": " + obj.mine + "/" + obj.hives;
		gui("topObjective").tooltip = this.D.scenario.name + " — vitória: " + this.D.scenario.objective.text + ", ou expulsar os inimigos do sistema.";
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

	/** Clique direito numa província do mapa. */
	orderProvince(pid)
	{
		const army = this.selectedArmy();
		const fleet = this.selectedFleet();
		if (army && army.faction == this.player)
		{
			let res;
			if (army.fleet)
				res = this.game.land(army.id, pid);
			else
				res = this.game.moveArmy(army.id, pid);
			if (res.error)
				this.flash(res.error);
			else if (res.battle)
				this.promptBattle(res.battle, true);
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
		const err = this.game.moveFleet(fleet.id, body);
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
		const res = this.game.endTurn();
		this.save();
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
				"buttons": [{ "caption": "Continuar" }, { "caption": "Estatísticas", "onPress": () => this.stats.open() }, { "caption": "Menu principal", "onPress": () => this.exit() }]
			});
		}
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
