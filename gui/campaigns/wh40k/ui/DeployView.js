/**
 * Desdobramento tático antes da batalha jogada.
 *
 * O campo mostra o terreno da província e as feições (as mesmas que o mapa
 * da batalha vai gerar), a zona do jogador (sul, verde) e a do inimigo
 * (norte, vermelho) com o desdobramento dele (reconhecimento).
 * Clique num batalhão para selecioná-lo (o líder fala) e clique no campo,
 * dentro da sua zona, para reposicioná-lo. No painel: ordem do batalhão e
 * plano geral. "Iniciar Batalha" começa a batalha 2D (ui/BattleView.js)
 * no mesmo campo.
 */
const WH40K_OWN_ZONE = [0.76, 0.96];
const WH40K_TOKENS = 24;

class WH40KDeployView
{
	constructor(page)
	{
		this.page = page;
		this.selected = 0;
		gui("deployField").onPress = () => this.page.view == "battle" ? this.page.battle.onFieldClick() : this.onFieldClick();
		gui("deployField").onPressRight = () => this.page.view == "battle" ? this.page.battle.onFieldRightClick() : null;
	}

	open(setup)
	{
		this.setup = setup;
		this.deployment = setup.deployment();
		this.selected = 0;
		this.plan = setup.playerRole == "defender" ? "line" : "assault";
		this.quote = null;
	}

	fieldRect()
	{
		const size = gui("deployView").getComputedSize();
		const W = size.right - size.left;
		const H = size.bottom - size.top;
		// Campo retangular que usa a área toda (proporção de 1 a 2).
		let h = H - 70;
		let w = Math.min(W - 16, h * 2);
		if (w < h)
			h = w;
		const x = (W - w) / 2;
		const y = 36 + (H - 70 - h) / 2;
		// s = altura: a unidade de comprimento da batalha (x vai de 0 a w/h).
		return { "x": x, "y": y, "w": w, "h": h, "s": h, "aspect": w / h, "absX": size.left + x, "absY": size.top + y };
	}

	render()
	{
		const setup = this.setup;
		const D = this.page.D;
		const r = this.fieldRect();
		this.rect = r;
		setSize(gui("deployField"), r.x, r.y, r.x + r.w, r.y + r.h);
		gui("deployField").sprite = "wh40kBlack";
		gui("deployField").sprite_over = "wh40kBlack";
		gui("deployGround").sprite = "stretched:campaigns/wh40k/battle/ground_" + setup.pdef.terrain + ".png";
		// Província com cidade: a cidade vista de cima no meio do campo.
		const city = gui("deployCity");
		city.hidden = !setup.pdef.hive;
		if (setup.pdef.hive)
		{
			const cs = r.h * (setup.pdef.hive == 2 ? 0.92 : 0.62);
			city.sprite = citySprite(setup.pdef.id);
			setSize(city, r.w / 2 - cs / 2, r.h / 2 - cs / 2, r.w / 2 + cs / 2, r.h / 2 + cs / 2);
		}
		const weather = WH40K_WEATHER[setup.weather()];
		gui("deployTitle").size = "12 6 100%-12 34";
		gui("deployTitle").caption = "Desdobramento — " + setup.pdef.name + " (" + WH40K_TERRAIN_NAMES[setup.pdef.terrain] + ") · " + weather.name;
		const tint = gui("deployWeather");
		tint.hidden = !weather.tint;
		if (weather.tint)
			tint.sprite = "color:" + weather.tint.join(" ");
		tint.tooltip = weather.name;
		const diggers = this.deployment.player.some(e => !e.general && (D.unitById[e.unit] || {}).entrench);
		gui("deployHint").caption = "Clique num batalhão e depois no campo (zona verde) para posicioná-lo. Escolha a ordem de cada um e o plano no painel." +
			(diggers ? " Entrincheirar: com a ordem Segurar começam na trincheira; parados por 6 s, cavam uma." : "");

		const features = setup.features();
		for (let i = 0; i < 48; ++i)
		{
			const obj = gui("deployFeature[" + i + "]");
			const f = features[i];
			obj.hidden = !f;
			if (!f)
				continue;
			const rad = f.r * r.h;
			setSize(obj, f.x * r.w - rad, f.y * r.h - rad, f.x * r.w + rad, f.y * r.h + rad);
			obj.sprite = "stretched:campaigns/wh40k/battle/" + f.type + ".png";
			obj.tooltip = (WH40K_FEATURE_NAMES[f.type] || f.type) + "\n" + terrainTooltip(null, "", [f.type]);
		}

		gui("battleHud").hidden = true;
		gui("battleMsg").hidden = true;
		gui("battleCursor").hidden = true;
		gui("deploySelRing").hidden = true;
		gui("deployEnemyZone").hidden = false;
		gui("deployOwnZone").hidden = false;
		const enemyColor = D.factionColor(setup.factionOf(setup.enemyRole));
		this.deployment.enemy.slice(0, WH40K_TOKENS).forEach((e, i) => {
			const obj = gui("deployEnemy[" + i + "]");
			obj.hidden = false;
			obj.onPress = () => {};
			obj.onPressRight = () => {};
			gui("deployEnemyBar[" + i + "]").hidden = true;
			gui("deployEnemyHit[" + i + "]").hidden = true;
			const t = e.general ? 18 : 14;
			setSize(obj, e.x * r.w - t, e.y * r.h - t, e.x * r.w + t, e.y * r.h + t);
			drawFigures("deployEnemy", i, this.figureOpts(e, 2, enemyColor, i));
			obj.onMouseEnter = () => this.showRange("battleRangeEnemy", e, [255, 80, 60]);
			obj.onMouseLeave = () => gui("battleRangeEnemy").hidden = true;
			obj.tooltip = colored(e.general ? e.name : e.unitName, enemyColor) + "\n" + (e.general ? "General inimigo" : e.name) + " · " + percent(e.strength) +
				"\nOrdem prevista: " + WH40K_ORDERS[e.order].name;
		});
		for (let i = Math.min(WH40K_TOKENS, this.deployment.enemy.length); i < WH40K_TOKENS; ++i)
			gui("deployEnemy[" + i + "]").hidden = true;

		this.deployment.player.slice(0, WH40K_TOKENS).forEach((e, i) => {
			const btn = gui("deployToken[" + i + "]");
			btn.hidden = false;
			btn.onPressRight = () => {};
			gui("deployTokenBar[" + i + "]").hidden = true;
			gui("deployTokenHit[" + i + "]").hidden = true;
			const t = (e.general ? 20 : 15) + (i == this.selected ? 4 : 0);
			setSize(btn, e.x * r.w - t, e.y * r.h - t, e.x * r.w + t, e.y * r.h + t);
			drawFigures("deployToken", i, this.figureOpts(e, 1, D.factionColor(this.page.player), i));
			btn.onMouseEnter = () => {};
			btn.onMouseLeave = () => {};
			btn.tooltip = (e.general ? e.name : e.unitName + "\n" + e.name) + " · " + percent(e.strength) + "\nOrdem: " + WH40K_ORDERS[e.order].name + "\n\nClique: selecionar.";
			btn.onPress = () => {
				this.selected = i;
				this.quote = pickFrom(e.quotes || [""]);
				this.render();
			};
			const label = gui("deployTokenOrder[" + i + "]");
			label.caption = i == this.selected ? colored("> " + WH40K_ORDERS[e.order].name, [255, 220, 110]) : WH40K_ORDERS[e.order].name;
		});
		for (let i = Math.min(WH40K_TOKENS, this.deployment.player.length); i < WH40K_TOKENS; ++i)
			gui("deployToken[" + i + "]").hidden = true;
		for (let i = 0; i < 20; ++i)
			gui("deployArrow[" + i + "]").hidden = true;
		gui("battleRangeEnemy").hidden = true;
		gui("battleRange").hidden = true;
		const sel = this.deployment.player[this.selected];
		if (sel)
			this.showRange("battleRange", sel, [255, 215, 90]);

		this.renderPanel();
	}

	/** Opções de drawFigures para uma entrada do desdobramento (parada, de frente para o inimigo). */
	figureOpts(e, side, color, i)
	{
		const unit = this.page.D.unitById[e.unit] || {};
		return {
			"unit": e.general ? null : e.unit, "portrait": e.portrait, "side": side, "color": color,
			"category": e.general ? "general" : e.category, "men": unit.men || 1, "strength": e.strength,
			"face": side == 1 ? 1 : -1, "seed": i
		};
	}

	/** Alcance da entrada no terreno da província (unidades da batalha: altura do campo = 1). */
	rangeOf(e)
	{
		const cat = e.general ? "general" : e.category;
		const unit = this.page.D.unitById[e.unit];
		const base = (unit && unit.range) || WH40K_COMBAT.category[cat].range;
		return base * WH40KCombat.terrainMods(cat, unit, this.setup.pdef.terrain, [], this.setup.weather()).range;
	}

	/** Anel de alcance para artilharia (alcance longo); some para as outras. */
	showRange(name, e, color)
	{
		const obj = gui(name);
		const unit = this.page.D.unitById[e.unit];
		if (e.general || !unit || !this.rect || (unit.range || 0) < WH40K_ARTILLERY_RANGE)
		{
			obj.hidden = true;
			return;
		}
		placeRange(obj, e.x * this.rect.w, e.y * this.rect.h, this.rangeOf(e) * this.rect.h, color);
	}

	onFieldClick()
	{
		const e = this.deployment.player[this.selected];
		if (!e || !this.rect)
			return;
		const x = (g_MouseX - this.rect.absX) / this.rect.w;
		const y = (g_MouseY - this.rect.absY) / this.rect.h;
		if (x < 0 || x > 1 || y < 0 || y > 1)
			return;
		e.x = +Math.max(0.04, Math.min(0.96, x)).toFixed(3);
		e.y = +Math.max(WH40K_OWN_ZONE[0], Math.min(WH40K_OWN_ZONE[1], y)).toFixed(3);
		if (e.order == "hold" || e.order == "reserve")
			e.anchorMoved = true;
		this.render();
	}

	setOrder(order)
	{
		const e = this.deployment.player[this.selected];
		if (e && !e.general)
			e.order = order;
		this.render();
	}

	nextPlan()
	{
		const plans = Object.keys(WH40K_PLANS);
		this.plan = plans[(plans.indexOf(this.plan) + 1) % plans.length];
		this.setup.applyPlan(this.deployment.player, this.plan);
		this.render();
	}

	renderPanel()
	{
		const page = this.page;
		const setup = this.setup;
		const D = page.D;
		const e = this.deployment.player[this.selected];
		const support = setup.supportFor(setup.playerRole);
		const rows = this.deployment.player.map((x, i) => ({
			"icon": portraitSprite(x.portrait),
			"bar": x.strength,
			"text": (x.general ? x.name : x.unitName) + "\n" + colored(WH40K_ORDERS[x.order].name + (x.general ? "" : " · " + x.name), [200, 190, 160]),
			"selected": i == this.selected,
			"onPress": () => {
				this.selected = i;
				this.quote = pickFrom(x.quotes || [""]);
				this.render();
			}
		}));
		const pending = page.game.s.pendingBattles.length && page.game.s.pendingBattles[0].id == setup.battle.id;
		const orderBtn = (order) => ({
			"caption": WH40K_ORDERS[order].name,
			"tooltip": WH40K_ORDERS[order].desc,
			"enabled": !!e && !e.general && e.order != order,
			"onPress": () => this.setOrder(order)
		});
		const actions = [
			orderBtn("advance"), orderBtn("hold"), orderBtn("flank_left"), orderBtn("flank_right"), orderBtn("reserve"),
			{ "caption": "Plano: " + WH40K_PLANS[this.plan].name, "tooltip": WH40K_PLANS[this.plan].desc + "\n\nClique: próximo plano (muda as ordens de todos).", "onPress": () => this.nextPlan() },
			{ "caption": "INICIAR BATALHA", "tooltip": "Começa a batalha em tempo real neste campo, com este desdobramento.", "onPress": () => page.startBattle(setup, this.deployment) },
			{ "caption": "Resolver Automático", "tooltip": "Decide a batalha agora, sem jogar.", "onPress": () => { page.view = "planet"; page.autoBattle(setup.battle); } }
		];
		if (!pending)
			actions.push({ "caption": "Cancelar ataque", "onPress": () => page.closeDeploy() });
		page.side.show({
			"portrait": e ? portraitSprite(e.portrait) : null,
			"card": e ? (e.general ? { "general": e.gid } : { "unit": e.unit, "strength": e.strength, "level": e.level, "leader": e.name }) : null,
			"title": e ? (e.general ? e.name : e.name) : "Desdobramento",
			"subtitle": e ? (e.general ? "General" : e.unitName) + " · " + percent(e.strength) : "",
			"quote": e ? (this.quote || pickFrom(e.quotes || [""])) : null,
			"text": (e ? colored("Terreno (" + WH40K_TERRAIN_NAMES[setup.pdef.terrain] + "): ", [235, 205, 125]) +
					(WH40KCombat.terrainMods(e.general ? "general" : e.category, page.D.unitById[e.unit], setup.pdef.terrain, [], setup.weather()).notes.join(", ") || "sem efeito") +
					(unitTerrainText(page.D.unitById[e.unit]) ? "\n" + colored("Afinidades: ", [235, 205, 125]) + unitTerrainText(page.D.unitById[e.unit]) : "") + "\n" : "") +
				"Apoio: " + (support.powers.length ? support.powers.map(p => p.name + " (" + p.kills + ")").join(", ") : "nenhum") +
				(support.ready ? " · " + support.ready + " pronto(s)" : "") +
				this.reserveText() +
				"\nPasse o mouse nas feições do campo para ver os efeitos.",
			"textHeight": 96,
			"rows": rows,
			"actions": actions
		});
	}

	/** Reforços dos exércitos vizinhos (entram no meio da batalha). */
	reserveText()
	{
		const setup = this.setup;
		const mine = setup.sides[setup.playerRole].entries.filter(e => e.reserve).length;
		const theirs = setup.sides[setup.enemyRole].entries.filter(e => e.reserve).length;
		return (mine ? "\n" + colored("Reforços: " + mine + " batalhão(ões) seus chegam aos 50 s.", [140, 220, 120]) : "") +
			(theirs ? "\n" + colored("O inimigo tem " + theirs + " batalhão(ões) de reforço a caminho.", [240, 140, 90]) : "");
	}
}

/** Efeitos de terreno para dicas: infantaria e veículos (ou só a unidade). */
function terrainTooltip(unit, field, features)
{
	const cats = unit ? [unit.category] : ["infantry", "vehicle"];
	const label = { "infantry": "Infantaria", "vehicle": "Veículos", "air": "Aeronaves", "general": "General" };
	return cats.map(cat => {
		const notes = WH40KCombat.terrainMods(cat, unit, field, features).notes.map(n => n.replace(/^[^:]*: /, ""));
		return colored(label[cat] + ": ", [235, 205, 125]) + (notes.join(", ") || "sem efeito");
	}).join("\n");
}

/** Afinidades próprias da unidade (units.json: terrain, allTerrain). */
function unitTerrainText(unit)
{
	if (!unit)
		return "";
	const fnames = { "ruins": "ruínas", "forest": "floresta", "crater": "crateras", "rocks": "rochedos", "hill": "colinas", "water": "água" };
	const parts = [];
	for (const key in unit.terrain || {})
	{
		const stats = Object.keys(unit.terrain[key]).map(st => {
			const v = unit.terrain[key][st];
			return WH40K_FX_NAMES[st] + " " + (v > 1 ? "+" : "") + Math.round((v - 1) * 100) + "%";
		});
		parts.push((fnames[key] || tr(WH40K_TERRAIN_NAMES[key] || key).toLowerCase()) + " (" + stats.join(", ") + ")");
	}
	if (unit.allTerrain)
		parts.push("ignora as penalidades de movimento do terreno");
	return parts.join("; ");
}
