/**
 * Painel lateral: detalhes e ações do que está selecionado.
 *   província  guarnição, rendimento, recrutar guarnição, contratar general,
 *              lançar nave (estaleiro)
 *   exército   general (retrato e frase), batalhões, recrutar, embarcar,
 *              saquear, mandar batalhões para a guarnição
 *   frota      naves, carga, destino, bombardeio orbital
 *   corpo      descrição e domínio
 * Clicar num batalhão mostra o retrato do líder e uma frase dele.
 * Modos: recruit (lista de unidades, por força aliada), hire (generais),
 * bombard (escolher alvo), ritual (gastar o recurso especial).
 */
const WH40K_ROW_H = 40;

const WH40K_GAIN_NAMES = {
	"kill": "inimigos abatidos", "battle": "batalhas", "win": "vitórias", "lopsided": "vitórias esmagadoras", "generalKill": "generais inimigos derrubados",
	"sack": "saques", "capture": "províncias tomadas", "hive": "cidades tomadas", "power": "poderes de apoio usados", "infected": "províncias devastadas (por turno)",
	"turn": "cada turno", "sacrifice": "as próprias perdas em batalha"
};

/** Como a facção ganha o recurso especial (texto). */
function specialGainText(sp)
{
	const parts = [];
	for (const k in sp.gain)
	{
		if (k == "decay")
			continue;
		if (k == "hold")
			parts.push(Object.keys(sp.gain.hold).map(t => (WH40K_TERRAIN_NAMES[t] || t).toLowerCase()).join(", ") + " sob seu controle (por turno)");
		else if (WH40K_GAIN_NAMES[k])
			parts.push(WH40K_GAIN_NAMES[k]);
	}
	return parts.join(", ") + "." + (sp.gain.decay ? " Perde " + Math.round(sp.gain.decay * 100) + "% nos turnos sem batalha." : "");
}

class WH40KSidePanel
{
	constructor(page)
	{
		this.page = page;
		this.mode = null;
		this.focusBat = null;
	}

	get g()
	{
		return this.page.game;
	}

	get D()
	{
		return this.page.D;
	}

	/** Desenha o painel: { title, subtitle, portrait, quote, text, rows, actions }. */
	show(p)
	{
		const portrait = gui("sidePortrait");
		portrait.hidden = !p.portrait;
		gui("sidePortraitFrame").hidden = !p.portrait;
		if (p.portrait)
			portrait.sprite = p.portrait;
		const pbtn = gui("sidePortraitBtn");
		pbtn.hidden = !p.portrait || !p.card;
		pbtn.onPress = p.card ? () => this.page.card.open(p.card) : () => {};
		const left = p.portrait ? 118 : 12;
		gui("sideTitle").caption = p.title || "";
		gui("sideTitle").size = left + " 10 100%-10 40";
		gui("sideSubtitle").caption = p.subtitle || "";
		gui("sideSubtitle").size = left + " 40 100%-10 64";
		const quote = gui("sideQuote");
		quote.hidden = !p.quote;
		quote.caption = p.quote ? "“" + p.quote + "”" : "";
		quote.size = left + " 64 100%-10 116";
		const textTop = p.portrait || p.quote ? 118 : 70;
		const textH = p.textHeight || 104;
		gui("sideText").caption = p.text || "";
		gui("sideText").size = "12 " + textTop + " 100%-12 " + (textTop + textH);

		const rows = p.rows || [];
		const panel = gui("side").getComputedSize();
		const panelH = panel.bottom - panel.top;
		const actions = (p.actions || []).filter(Boolean);
		const actionRows = Math.ceil(actions.length / 2);
		const rowsTop = textTop + textH + 6;
		const rowsBottom = panelH - 10 - actionRows * 38;
		const maxRows = Math.max(0, Math.min(14, Math.floor((rowsBottom - rowsTop) / (WH40K_ROW_H + 3))));
		for (let i = 0; i < 14; ++i)
		{
			const row = gui("sideRow[" + i + "]");
			const def = rows[i];
			row.hidden = !def || i >= maxRows;
			if (row.hidden)
				continue;
			row.size = "8 " + (rowsTop + i * (WH40K_ROW_H + 3)) + " 100%-8 " + (rowsTop + i * (WH40K_ROW_H + 3) + WH40K_ROW_H);
			row.sprite = def.selected ? "wh40kRowSelected" : "wh40kRow";
			row.sprite_over = "wh40kRowOver";
			row.tooltip = def.tooltip || "";
			const card = def.card ? () => this.page.card.open(def.card) : null;
			row.onPress = def.onPress || card || (() => {});
			row.onPressRight = def.onPressRight || card || (() => {});
			const icon = gui("sideRowIcon[" + i + "]");
			icon.hidden = !def.icon;
			if (def.icon)
				icon.sprite = def.icon;
			const bar = gui("sideRowBar[" + i + "]");
			bar.hidden = def.bar === undefined;
			if (def.bar !== undefined)
			{
				bar.size = "2 36 " + (2 + Math.round(34 * Math.max(0, Math.min(1, def.bar)))) + " 39";
				bar.sprite = "color:" + (def.bar > 0.6 ? "90 200 90" : def.bar > 0.3 ? "230 190 70" : "230 80 60") + " 255";
			}
			gui("sideRowText[" + i + "]").caption = def.text || "";
			const btn = gui("sideRowBtn[" + i + "]");
			btn.hidden = !def.button;
			if (def.button)
			{
				btn.caption = def.button.caption;
				btn.tooltip = def.button.tooltip || "";
				btn.enabled = def.button.enabled !== false;
				btn.onPress = def.button.onPress;
			}
		}
		for (let i = 0; i < 12; ++i)
		{
			const btn = gui("sideAction[" + i + "]");
			const def = actions[i];
			btn.hidden = !def;
			if (!def)
				continue;
			const row = Math.floor(i / 2);
			const col = i % 2;
			const y = panelH - 10 - (actionRows - row) * 38;
			btn.size = (col ? "50%+3" : "8") + " " + y + " " + (col ? "100%-8" : "50%-3") + " " + (y + 34);
			btn.caption = def.caption;
			btn.tooltip = def.tooltip || "";
			btn.enabled = def.enabled !== false;
			btn.onPress = def.onPress;
		}
	}

	render()
	{
		const sel = this.page.sel;
		if (this.mode == "recruit")
			return this.renderRecruit();
		if (this.mode == "hire")
			return this.renderHire();
		if (this.mode == "ritual")
			return this.renderRitual();
		if (!sel)
			return this.renderOverview();
		if (sel.type == "province" && this.g.province(sel.id))
			return this.renderProvince(sel.id);
		if (sel.type == "army" && this.g.s.armies[sel.id])
			return this.renderArmy(this.g.s.armies[sel.id]);
		if (sel.type == "fleet" && this.g.s.fleets[sel.id])
			return this.renderFleet(this.g.s.fleets[sel.id]);
		if (sel.type == "body")
			return this.renderBody(sel.id);
		return this.renderOverview();
	}

	refresh()
	{
		this.page.save();
		this.page.refresh();
	}

	report(err)
	{
		if (err)
			this.page.flash(err);
		this.refresh();
	}

	// ------------------------------------------------------------ batalhões

	batRow(bat, opts = {})
	{
		const g = this.g;
		const unit = g.unit(bat);
		const level = g.level(bat);
		const own = opts.own !== false;
		return {
			"icon": portraitSprite(unit.icon || unit.portrait),
			"bar": bat.strength,
			"text": unit.name + stars(level) + "\n" + colored(bat.leader + " · " + percent(bat.strength), [190, 180, 160]),
			"tooltip": unit.name + " — " + unit.desc + "\nLíder: " + bat.leader + "\nForça: " + percent(bat.strength) + " · Experiência: " + (bat.xp || 0) + " batalhas" + (level ? " (nível " + level + ")" : "") +
				"\nPoder: " + Math.round(g.batPower(bat)) + " · Manutenção: " + g.upkeepOf(bat, opts.garrison) + "\n\nClique: ficha da unidade e o líder fala.",
			"selected": this.focusBat == bat.id,
			"card": { "bat": bat },
			"onPress": () => {
				this.focusBat = bat.id;
				this.render();
				this.page.card.open({ "bat": bat });
			},
			"button": own && opts.button ? opts.button : undefined
		};
	}

	focusHeader(fallback)
	{
		// Batalhão em foco: retrato e frase do líder.
		const all = [];
		for (const a of Object.values(this.g.s.armies))
			all.push(...a.battalions);
		for (const pid in this.g.s.provinces)
			all.push(...this.g.s.provinces[pid].garrison);
		const bat = this.focusBat && all.find(b => b.id == this.focusBat);
		if (!bat)
			return fallback;
		const unit = this.g.unit(bat);
		return {
			"portrait": portraitSprite(unit.portrait),
			"title": bat.leader,
			"subtitle": unit.name + stars(this.g.level(bat)) + " · " + percent(bat.strength),
			"quote": pickFrom(unit.quotes),
			"card": { "bat": bat }
		};
	}

	// ------------------------------------------------------------ visão geral

	renderOverview()
	{
		const g = this.g;
		const D = this.D;
		const f = this.page.player;
		const rows = g.armiesOf(f).map(army => {
			const general = g.general(army);
			const where = army.province ? D.provinces[army.province].name : "a bordo de " + (g.s.fleets[army.fleet]?.name || "?");
			return {
				"icon": portraitSprite(general ? general.portrait : g.unit(army.battalions[0] || { "unit": D.unitsOf(f)[0].id }).portrait),
				"text": (general ? general.name : "Exército") + "\n" + colored(army.battalions.length + " bat. · " + where, [190, 180, 160]),
				"tooltip": "Clique: selecionar e ir até o exército.",
				"onPress": () => {
					if (army.province)
						this.page.body = D.provinces[army.province].body;
					this.page.view = army.province ? "planet" : "system";
					this.page.select({ "type": "army", "id": army.id });
				}
			};
		});
		this.show({
			"portrait": "stretched:" + D.factions[f].emblem,
			"title": D.factions[f].name,
			"subtitle": "Seus exércitos",
			"text": "Províncias: " + g.provincesOf(f).length + " · Frotas: " + Object.values(g.s.fleets).filter(x => x.faction == f).length +
				"\nRendimento " + g.income(f) + " · Manutenção " + g.upkeep(f) + "\n\nSelecione algo no mapa, ou um exército abaixo.",
			"rows": rows,
			"actions": [
				D.factions[f].special ? { "caption": "Rituais (" + D.factions[f].special.short + ")", "tooltip": "Gaste " + D.factions[f].special.name + ". Os rituais de exército precisam de um exército selecionado.", "onPress": () => this.page.openRituals() } : null,
				{ "caption": "Diplomacia", "tooltip": "Tréguas e traições.", "onPress": () => this.page.showDiplomacy() },
				{ "caption": "Códex", "tooltip": "Todas as unidades e generais das facções, com as fichas.", "onPress": () => this.page.codex.open(f) },
				{ "caption": "Estatísticas", "tooltip": "Territórios por turno, batalhas e baixas.", "onPress": () => this.page.stats.open() },
				{ "caption": "Ajuda", "onPress": () => this.page.dialog.open({ "title": "Como jogar", "text": this.page.tutorialText() }) }
			]
		});
	}

	// ------------------------------------------------------------ rituais

	renderRitual()
	{
		const g = this.g;
		const D = this.D;
		const f = this.page.player;
		const sp = g.special(f);
		const army = this.ritualArmy && g.s.armies[this.ritualArmy];
		if (!sp)
		{
			this.mode = null;
			return this.render();
		}
		const rows = sp.rituals.map(r => {
			const why = r.target == "army" && !army ? "Selecione um exército seu para este ritual." : g.canRitual(f, r.id, army ? army.id : null);
			return {
				"icon": portraitSprite(r.effect.unit ? D.unitById[r.effect.unit].portrait : sp.icon, !!why),
				"text": r.name + "\n" + colored(r.cost + " " + sp.short + (r.target == "faction" ? " · facção" : " · exército"), why ? [200, 110, 90] : [190, 180, 160]),
				"tooltip": r.name + " — " + r.desc + "\nCusto: " + r.cost + " " + sp.name + "." + (why ? "\n\n" + colored(why, [250, 120, 90]) : "\n\nClique: fazer o ritual."),
				"card": r.effect.unit ? { "unit": r.effect.unit } : null,
				"onPress": () => {
					const res = g.ritual(f, r.id, army ? army.id : null);
					if (res.error)
						this.page.flash(res.error);
					else
					{
						this.page.sound.ui("card");
						this.page.flash(res.text);
					}
					this.refresh();
				}
			};
		});
		const buffs = army ? (army.buffs || []).map(b => b.name + " (" + g.buffText(b) + ", " + b.turns + " t)").join(", ") : "";
		this.show({
			"portrait": portraitSprite(sp.icon),
			"title": sp.name + ": " + g.specialAmount(f) + "/" + sp.max,
			"subtitle": army ? "Alvo: " + g.armyLabel(army) : "Sem exército selecionado",
			"text": sp.desc + "\nGanha com: " + specialGainText(sp) + (buffs ? "\nAtivos: " + buffs : ""),
			"textHeight": 96,
			"rows": rows,
			"actions": [
				army ? { "caption": "Ver exército", "onPress": () => { this.mode = null; this.page.select({ "type": "army", "id": army.id }); } } : null,
				{ "caption": "Voltar", "onPress": () => { this.mode = null; this.render(); } }
			]
		});
	}

	// ------------------------------------------------------------ província

	renderProvince(pid)
	{
		const g = this.g;
		const D = this.D;
		const def = D.provinces[pid];
		const st = g.province(pid);
		const own = st.owner == this.page.player;
		const myArmy = g.armiesAt(pid, this.page.player)[0];
		const rows = st.garrison.map(bat => this.batRow(bat, {
			"own": own,
			"garrison": true,
			"button": myArmy ? { "caption": "→ Exército", "tooltip": "Passa este batalhão para o exército na província.", "onPress": () => this.report(g.transfer(myArmy.id, bat.id, false)) } : undefined
		}));
		for (const army of g.armiesAt(pid))
		{
			const general = g.general(army);
			rows.push({
				"icon": portraitSprite(general ? general.portrait : g.unit(army.battalions[0] || { "unit": D.unitsOf(army.faction)[0].id }).portrait),
				"text": colored(general ? general.name : "Exército", D.factionColor(army.faction)) + "\n" + colored(army.battalions.length + " batalhões", [190, 180, 160]),
				"onPress": () => this.page.select({ "type": "army", "id": army.id })
			});
		}
		const fleet = g.fleetsAt(def.body, this.page.player).find(f => !f.dest);
		const actions = [];
		if (own)
		{
			actions.push({ "caption": "Recrutar guarnição", "tooltip": "Batalhões que ficam na província e a defendem (manutenção pela metade).", "onPress": () => { this.mode = "recruit"; this.recruitTarget = { "province": pid }; this.render(); } });
			actions.push({ "caption": "Contratar general", "enabled": g.hireableGenerals(this.page.player).length > 0, "tooltip": "Um novo general assume um exército nesta província.", "onPress": () => { this.mode = "hire"; this.hireProvince = pid; this.render(); } });
			if (def.shipyard)
				actions.push({ "caption": "Lançar nave (" + WH40K_SHIP_COST + ")", "tooltip": "O estaleiro lança uma nave de guerra na órbita deste corpo (uma por turno).", "onPress": () => this.report(g.buildShip(this.page.player, pid)) });
		}
		else if (fleet && !g.canBombard(fleet, pid))
			actions.push({ "caption": "Bombardeio orbital", "tooltip": "A frota " + fleet.name + " bombardeia a guarnição e as defesas desta província (uma vez por turno).", "onPress": () => this.report(g.bombard(fleet.id, pid)) });
		const header = this.focusHeader({
			"title": def.name,
			"subtitle": WH40K_TERRAIN_NAMES[def.terrain] + " · " + colored(D.factionName(st.owner), D.factionColor(st.owner))
		});
		header.text = (st.devastated > 0 ? colored("Devastada por mais " + st.devastated + " turno(s): rendimento reduzido.", [240, 140, 60]) + "\n" : "") +
			"Rendimento: " + g.provinceIncome(pid) + (def.hive == 2 ? " · Cidade-colmeia" : def.hive ? " · Cidade" : "") + (def.shipyard ? " · Estaleiro" : "") +
			"\nFortificações: " + st.forts + " · Guarnição: " + st.garrison.length + "/" + g.maxGarrison(pid) +
			"\nDefesa contra você: " + (own ? "-" : Math.round(g.defensePower(pid, this.page.player))) +
			"\nVizinhas: " + def.neighbors.map(n => D.provinces[n].name).join(", ");
		header.rows = rows;
		header.actions = actions;
		this.show(header);
	}

	// ------------------------------------------------------------ exército

	renderArmy(army)
	{
		const g = this.g;
		const D = this.D;
		const own = army.faction == this.page.player;
		const general = g.general(army);
		const inOwnProvince = army.province && g.province(army.province).owner == army.faction;
		const rows = army.battalions.map(bat => this.batRow(bat, {
			"own": own,
			"button": own && inOwnProvince ? { "caption": "→ Guarnição", "tooltip": "Deixa este batalhão de guarnição na província.", "onPress": () => this.report(g.transfer(army.id, bat.id, true)) } : undefined
		}));
		const where = army.province ? D.provinces[army.province].name : "a bordo de " + (g.s.fleets[army.fleet]?.name || "?");
		const actions = [];
		if (own)
		{
			actions.push({ "caption": "Recrutar", "enabled": !!inOwnProvince, "tooltip": inOwnProvince ? "Recruta batalhões para este exército." : "Só em província própria.", "onPress": () => { this.mode = "recruit"; this.recruitTarget = { "army": army.id }; this.render(); } });
			const sp = g.special(army.faction);
			if (sp)
				actions.push({ "caption": "Rituais (" + g.specialAmount(army.faction) + " " + sp.short + ")", "tooltip": "Gaste " + sp.name + " neste exército: reforços, bônus, cura" + (sp.rituals.some(r => r.effect.type == "ascend") ? ", ascensão a Príncipe-Demônio" : "") + "...",
					"onPress": () => { this.mode = "ritual"; this.ritualArmy = army.id; this.render(); } });
			if (army.province)
			{
				const fleets = g.fleetsAt(D.provinces[army.province].body, army.faction).filter(f => !f.dest && f.cargo.length < g.fleetCapacity(f));
				actions.push({ "caption": "Embarcar", "enabled": fleets.length > 0 && army.moves > 0, "tooltip": fleets.length ? "Embarca na frota " + fleets[0].name + " (em órbita)." : "Nenhuma frota própria com espaço na órbita.", "onPress": () => { this.report(g.embark(army.id, fleets[0].id)); } });
			}
			else
				actions.push({ "caption": "Ver frota", "onPress": () => this.page.select({ "type": "fleet", "id": army.fleet }) });
			if (army.province)
			{
				const why = g.canSack(army);
				const prov = g.province(army.province);
				if (!why || (prov.capturedTurn || -10) >= g.s.turn - 1)
					actions.push({
						"caption": (D.factions[army.faction].sackName || "Saquear") + " (+" + g.sackValue(army.province, army.faction) + ")",
						"enabled": !why,
						"tooltip": why || "Arranca tudo o que a província tem: +" + g.sackValue(army.province, army.faction) + " " + D.factions[army.faction].currencyShort +
							" agora, mas ela fica devastada por " + WH40K_SACK_TURNS + " turnos (rendimento a " + percent(WH40K_DEVASTATED_INCOME) + ") e perde os fortes." +
							(D.factions[army.faction].sackNote ? "\n" + D.factions[army.faction].sackNote : ""),
						"onPress": () => this.report(g.sack(army.id))
					});
			}
		}
		const header = this.focusHeader({
			"portrait": general ? portraitSprite(general.portrait) : null,
			"card": general ? { "general": general.id } : null,
			"title": general ? general.title + " " + general.name : "Exército sem general",
			"subtitle": colored(D.factionName(army.faction), D.factionColor(army.faction)) + " · " + where,
			"quote": general && this.lastQuoteFor != army.id ? (this.armyQuote = pickFrom(general.quotes)) : general ? this.armyQuote : null
		});
		this.lastQuoteFor = army.id;
		const buffs = (army.buffs || []).map(b => colored(b.name + " (" + g.buffText(b) + ", " + b.turns + " t)", [210, 170, 250])).join(", ");
		header.text = (general ? (general.ascended ? colored("Príncipe-Demônio de " + general.ascended + ". ", [230, 120, 120]) : "") +
				(general.level ? "Nível " + general.level + ". " : "") + general.trait + "\n" : "") +
			(buffs ? buffs + "\n" : "") +
			"Força: ataque " + Math.round(g.armyPower(army, "attack")) + " · defesa " + Math.round(g.armyPower(army, "defense")) +
			(own ? "\nMovimentos: " + army.moves + "/" + g.maxMoves(army) + " · Batalhões: " + army.battalions.length + "/" + WH40K_MAX_BATTALIONS : "");
		header.rows = rows;
		header.actions = actions;
		this.show(header);
	}

	renderRecruit()
	{
		const g = this.g;
		const D = this.D;
		const f = this.page.player;
		const target = this.recruitTarget;
		const pid = target.army ? g.s.armies[target.army]?.province : target.province;
		if (!pid)
		{
			this.mode = null;
			return this.render();
		}
		const allies = D.factions[f].allies || {};
		const groups = Object.keys(allies);
		if (groups.indexOf(this.recruitGroup) == -1)
			this.recruitGroup = groups[0];
		const group = allies[this.recruitGroup];
		const units = D.unitsOf(f).filter(u => !u.noRecruit && (!groups.length || (u.group || "guard") == this.recruitGroup));
		const rows = units.map(unit => {
			const reason = g.canRecruit(f, unit.id, pid);
			return {
				"icon": portraitSprite(unit.icon || unit.portrait, !!reason),
				"text": unit.name + "\n" + colored(unit.cost + " " + D.factions[f].currencyShort + " · manutenção " + unit.upkeep + " · poder " + unit.power, reason ? [200, 110, 90] : [190, 180, 160]),
				"tooltip": unit.name + " — " + unit.desc + (unit.needsHive ? "\nExige cidade ou fortaleza." : "") + this.requiresText(unit) + (unitTerrainText(unit) ? "\nTerreno: " + unitTerrainText(unit) + "." : "") + (reason ? "\n\n" + colored(reason, [250, 120, 90]) : "\n\nClique: recrutar.") + "\nBotão direito: ficha da unidade.",
				"card": { "unit": unit.id },
				"onPress": () => {
					const err = g.recruit(f, unit.id, target);
					if (err)
						this.page.flash(err);
					this.refresh();
				}
			};
		});
		const actions = groups.length > 1 ? groups.map(id => ({
			"caption": (id == this.recruitGroup ? "> " : "") + allies[id].name,
			"tooltip": allies[id].desc,
			"onPress": () => { this.recruitGroup = id; this.render(); }
		})) : [];
		actions.push({ "caption": "Voltar", "onPress": () => { this.mode = null; this.render(); } });
		this.show({
			"portrait": group && group.icon ? portraitSprite(group.icon) : null,
			"title": target.army ? "Recrutar para o exército" : "Recrutar guarnição",
			"subtitle": D.provinces[pid].name + " · " + D.factions[f].currency + ": " + g.s.factions[f].funds,
			"text": (group && groups.length > 1 ? colored(group.name, [235, 205, 125]) + ": " + group.desc + "\n" : "") +
				(target.army ? "Batalhões novos entram com força total e sem experiência." : "A guarnição defende a província e paga metade da manutenção. Limite: " + g.maxGarrison(pid) + "."),
			"textHeight": 70,
			"rows": rows,
			"actions": actions
		});
	}

	requiresText(unit)
	{
		const names = { "orbit": "frota própria na órbita", "hive": "cidade-colmeia", "forge": "estaleiro ou zona industrial", "unique": "um só na cruzada" };
		const list = (unit.requires || []).map(r => names[r] || r);
		return list.length ? "\nExige: " + list.join(", ") + "." : "";
	}

	renderHire()
	{
		const g = this.g;
		const D = this.D;
		const f = this.page.player;
		const pid = this.hireProvince;
		const rows = g.hireableGenerals(f).map(gid => {
			const gen = g.generalStats(gid);
			const poor = g.s.factions[f].funds < gen.hireCost;
			return {
				"icon": portraitSprite(gen.portrait, poor),
				"text": gen.title + " " + gen.name + "\n" + colored(gen.hireCost + " " + D.factions[f].currencyShort, poor ? [200, 110, 90] : [190, 180, 160]),
				"tooltip": gen.trait + "\n\n“" + gen.quotes[0] + "”\n\nClique: contratar. Botão direito: ficha do general.",
				"card": { "general": gid },
				"onPress": () => {
					const err = g.hireGeneral(f, gid, pid);
					if (err)
						this.page.flash(err);
					else
					{
						this.mode = null;
						const army = g.armiesAt(pid, f).find(a => a.general == gid);
						if (army)
							this.page.sel = { "type": "army", "id": army.id };
					}
					this.refresh();
				}
			};
		});
		const wounded = Object.keys(g.s.generals).filter(id => g.s.generals[id].state == "wounded" && D.generals[id].faction == f);
		this.show({
			"title": "Contratar general",
			"subtitle": D.provinces[pid].name,
			"text": "O general assume um exército novo (vazio) nesta província; recrute batalhões para ele." + (wounded.length ? "\nFeridos: " + wounded.map(id => D.generals[id].name + " (" + g.s.generals[id].turns + " turnos)").join(", ") : ""),
			"textHeight": 60,
			"rows": rows,
			"actions": [{ "caption": "Voltar", "onPress": () => { this.mode = null; this.render(); } }]
		});
	}

	// ------------------------------------------------------------ frota e corpo

	renderFleet(fleet)
	{
		const g = this.g;
		const D = this.D;
		const own = fleet.faction == this.page.player;
		const rows = fleet.cargo.map(aid => g.s.armies[aid]).filter(Boolean).map(army => {
			const general = g.general(army);
			return {
				"icon": portraitSprite(general ? general.portrait : g.unit(army.battalions[0]).portrait),
				"text": (general ? general.name : "Exército") + "\n" + colored(army.battalions.length + " batalhões a bordo", [190, 180, 160]),
				"tooltip": "Clique: selecionar o exército; depois, botão direito numa província do planeta para desembarcar.",
				"onPress": () => {
					if (fleet.body)
					{
						this.page.body = fleet.body;
						this.page.view = "planet";
					}
					this.page.select({ "type": "army", "id": army.id });
				}
			};
		});
		if (own && fleet.body)
			for (const enemy of g.fleetsAt(fleet.body).filter(f => g.hostile(f.faction, fleet.faction)))
			{
				const why = g.canAttackFleet(fleet, enemy);
				rows.push({
					"icon": shipSprite(D, enemy.faction, enemy.ships),
					"text": colored(enemy.name, D.factionColor(enemy.faction)) + "\n" + colored(enemy.ships + " naves · inimiga na órbita", [230, 150, 120]),
					"tooltip": "Frota inimiga na mesma órbita. Atacar agora dá a iniciativa (+15% de força)." + (why ? "\n" + colored(why, [250, 120, 90]) : ""),
					"button": { "caption": "Atacar", "enabled": !why, "onPress": () => this.page.attackFleet(enemy) }
				});
			}
		let where = fleet.body ? "Em órbita de " + D.bodies[fleet.body].name : "Em trânsito";
		if (fleet.dest)
			where += " → " + D.bodies[fleet.dest].name + " (" + fleet.eta + " turno" + (fleet.eta > 1 ? "s" : "") + ")";
		const actions = [];
		if (own)
		{
			actions.push({ "caption": "Mover (sistema)", "tooltip": "Abre o sistema: botão direito num planeta ou lua para viajar.", "onPress": () => this.page.showSystem() });
			if (fleet.body)
			{
				actions.push({ "caption": "Bombardeio orbital", "enabled": fleet.acted != g.s.turn && g.orbitalControl(fleet.body, fleet.faction), "tooltip": "Escolha uma província inimiga sob esta órbita (botão direito no mapa).", "onPress": () => { this.mode = "bombard"; this.page.showPlanet(fleet.body); } });
				actions.push({ "caption": "Ver planeta", "onPress": () => this.page.showPlanet(fleet.body) });
				const prey = Object.values(g.s.fleets).filter(f => g.hostile(f.faction, fleet.faction) && f.body);
				if (prey.length)
					actions.push({ "caption": "Atacar frota", "enabled": fleet.acted != g.s.turn, "tooltip": "Abre o sistema: botão direito numa frota inimiga para atacá-la (na mesma órbita, a batalha é na hora; longe, a frota viaja e luta ao chegar).",
						"onPress": () => this.page.showSystem() });
				if (fleet.dest)
					actions.push({ "caption": "Cancelar viagem", "onPress": () => this.report(g.moveFleet(fleet.id, fleet.body)) });
			}
		}
		this.show({
			"portrait": shipSprite(D, fleet.faction, fleet.ships),
			"title": fleet.name,
			"subtitle": colored(D.factions[fleet.faction].fleetName, D.factionColor(fleet.faction)),
			"text": fleet.ships + " nave" + (fleet.ships > 1 ? "s" : "") + " de guerra · capacidade " + g.fleetCapacity(fleet) + " exército(s)\n" + where +
				(this.mode == "bombard" ? "\n" + colored("Bombardeio: botão direito numa província inimiga.", [230, 150, 230]) : "") +
				"\n\nCom a órbita livre de inimigos: desembarque em qualquer província, bombardeio e apoio orbital nas batalhas deste corpo.",
			"rows": rows,
			"actions": actions
		});
	}

	renderBody(bodyId)
	{
		const g = this.g;
		const D = this.D;
		const body = D.bodies[bodyId];
		const rows = body.landProvinces.map(pid => {
			const st = g.province(pid);
			return {
				"icon": "color:" + rgbStr(D.factionColor(st.owner), 255) + ":textureAsMask:campaigns/wh40k/icons/" + (D.provinces[pid].hive ? "hive" : "shield") + ".png",
				"text": D.provinces[pid].name + "\n" + colored(D.factionName(st.owner) + " · " + WH40K_TERRAIN_NAMES[D.provinces[pid].terrain], [190, 180, 160]),
				"onPress": () => {
					this.page.body = bodyId;
					this.page.view = "planet";
					this.page.select({ "type": "province", "id": pid });
				}
			};
		});
		const fleets = g.fleetsAt(bodyId);
		this.show({
			"portrait": "stretched:campaigns/wh40k/planets/" + bodyId + "/globe.png",
			"title": body.name,
			"subtitle": body.class + (body.parent ? " · satélite de " + D.bodies[body.parent].name : ""),
			"text": body.desc + "\n" + (fleets.length ? "Em órbita: " + fleets.map(f => colored(f.name + " (" + f.ships + ")", D.factionColor(f.faction))).join(", ") : "Órbita vazia."),
			"rows": rows,
			"actions": [{ "caption": "Abrir mapa", "onPress": () => this.page.showPlanet(bodyId) }]
		});
	}
}
