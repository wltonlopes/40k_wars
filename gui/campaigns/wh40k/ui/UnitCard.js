/**
 * Ficha grande de unidade ou general: retrato em destaque, atributos,
 * especialidades, afinidades de terreno, descrição e uma fala.
 * Abre ao clicar no retrato do painel lateral, num batalhão ou com o botão
 * direito nas listas de recrutamento e de generais. Fecha com clique ou Esc.
 */
const WH40K_CATEGORY_NAMES = { "infantry": "Infantaria", "vehicle": "Veículo / monstro", "air": "Aeronave", "general": "General" };

class WH40KUnitCard
{
	constructor(page)
	{
		this.page = page;
		gui("cardDim").onPress = () => this.close();
		gui("cardClose").onPress = () => this.close();
	}

	isOpen()
	{
		return !gui("cardDim").hidden;
	}

	close()
	{
		gui("cardDim").hidden = true;
	}

	/** opts: { unit (id), bat?, strength?, level?, leader?, general (id)? } */
	open(opts)
	{
		const D = this.page.D;
		if (opts.general && D.generals[opts.general])
			return this.show(this.generalCard(this.page.game ? this.page.game.generalStats(opts.general) : D.generals[opts.general]));
		const unit = D.unitById[opts.unit || opts.bat?.unit];
		if (unit)
			this.show(this.unitCard(unit, opts));
	}

	show(c)
	{
		gui("cardDim").hidden = false;
		gui("cardPortrait").sprite = portraitSprite(c.portrait);
		gui("cardTitle").caption = c.title;
		gui("cardSubtitle").caption = c.subtitle;
		gui("cardStats").caption = c.stats;
		gui("cardDesc").caption = c.desc;
		gui("cardQuote").caption = c.quote ? "“" + c.quote + "”" : "";
		gui("cardBand").sprite = "color:" + rgbStr(c.color || [180, 150, 90], 255);
		if (this.page.sound)
			this.page.sound.ui("card");
	}

	unitCard(unit, opts)
	{
		const D = this.page.D;
		const f = D.factions[unit.faction] || {};
		const gold = [235, 205, 125];
		const line = (k, v) => colored(k + ": ", gold) + v;
		const cat = WH40K_COMBAT.category[unit.category] || WH40K_COMBAT.category.infantry;
		const range = unit.range || cat.range;
		const speed = unit.speed || cat.speed;
		const rate = (v, a, b) => v >= b ? "alta" : v >= a ? "média" : "baixa";
		const vs = [];
		if (unit.vsVehicle > 1)
			vs.push("blindados +" + Math.round((unit.vsVehicle - 1) * 100) + "%");
		if (unit.vsInfantry > 1)
			vs.push("infantaria +" + Math.round((unit.vsInfantry - 1) * 100) + "%");
		if (unit.vsAir > 1)
			vs.push("aeronaves +" + Math.round((unit.vsAir - 1) * 100) + "%");
		const req = [];
		if (unit.needsHive)
			req.push("cidade ou fortaleza");
		const names = { "orbit": "frota na órbita", "hive": "cidade-colmeia", "forge": "estaleiro ou zona industrial", "unique": "um só por cruzada" };
		for (const r of unit.requires || [])
			req.push(names[r] || r);
		const group = f.allies && f.allies[unit.group || "guard"];
		const stats = [
			line("Custo", unit.cost + " " + (f.currencyShort || "") + " · manutenção " + unit.upkeep),
			line("Poder", unit.power + " · " + unit.men + (unit.men > 1 ? " esquadras" : " modelo")),
			line("Alcance", rate(range, 0.06, 0.12) + " (" + Math.round(range * 1000) + ")") + " · " + line("Velocidade", rate(speed, 0.025, 0.04)),
			line("Blindagem", "x" + ((unit.armor || 1) * cat.armor).toFixed(2)),
			vs.length ? line("Especialista", vs.join(", ")) : "",
			unit.entrench ? line("Entrincheirar", "parado por 6 s, cava uma trincheira (dano recebido -45%); com a ordem Segurar, começa entrincheirado") : "",
			unitTerrainText(unit) ? line("Terreno", unitTerrainText(unit)) : "",
			req.length ? line("Exige", req.join(", ")) : "",
			unit.noRecruit ? colored("Não se recruta.", [230, 120, 120]) : ""
		];
		if (opts.bat || opts.strength !== undefined)
		{
			const bat = opts.bat;
			const level = bat ? this.page.game.level(bat) : opts.level || 0;
			stats.push("");
			stats.push(line("Líder", (bat ? bat.leader : opts.leader || "-") + stars(level)));
			stats.push(line("Força", percent(bat ? bat.strength : opts.strength) + (bat ? " · experiência: " + (bat.xp || 0) + " batalha(s)" : "")));
		}
		return {
			"portrait": unit.portrait,
			"title": unit.name,
			"subtitle": colored(f.name || "", f.color || [200, 200, 200]) + " · " + (WH40K_CATEGORY_NAMES[unit.category] || unit.category) + (group && group.name != f.name ? " · " + group.name : ""),
			"stats": stats.filter(s => s !== "").join("\n").replace(/\n\n+/g, "\n\n"),
			"desc": unit.desc || "",
			"quote": pickFrom(unit.quotes || [""]),
			"color": f.color
		};
	}

	nextLevelText(gen)
	{
		const levels = this.page.D.progression?.levels || [];
		const next = levels[gen.level + 1];
		return next ? " (próximo nível: " + next + ")" : " (nível máximo)";
	}

	generalCard(gen)
	{
		const D = this.page.D;
		const f = D.factions[gen.faction] || {};
		const gold = [235, 205, 125];
		const pct = v => (v > 0 ? "+" : "") + Math.round(v * 100) + "%";
		const st = this.page.game?.s.generals[gen.id];
		const state = { "available": "disponível", "hired": "em campo", "wounded": "ferido", "dead": "morto", "spawn": "virou Cria do Caos", "unavailable": "fora desta campanha" };
		return {
			"portrait": gen.portrait,
			"title": gen.title + " " + gen.name,
			"subtitle": colored(f.name || "", f.color || [200, 200, 200]) + " · General",
			"stats": [
				colored("Ataque: ", gold) + pct(gen.attack) + " · " + colored("Defesa: ", gold) + pct(gen.defense),
				colored("Marcha extra: ", gold) + (gen.move || 0) + " · " + colored("Cargas de apoio: ", gold) + (gen.support || 0),
				colored("Contratação: ", gold) + (gen.hireCost ? gen.hireCost + " " + (f.currencyShort || "") : "comanda desde o início"),
				st ? colored("Situação: ", gold) + (state[st.state] || st.state) : "",
				gen.level !== undefined ? colored("Nível: ", gold) + gen.level + " · experiência " + (gen.xp || 0) + this.nextLevelText(gen) : "",
				gen.ascended ? colored("Príncipe-Demônio de " + gen.ascended, [240, 120, 120]) + " (+20% ataque, +15% defesa, +1 carga)" : "",
				gen.ability ? colored("Poder na batalha: ", gold) + colored(gen.ability.name, [210, 170, 250]) + " — " + gen.ability.desc + " (recarga " + (gen.ability.cooldown || 50) + " s)" : "",
				(gen.traitList || []).length ? colored("Traços: ", gold) + gen.traitList.map(t => t.name).join(", ") : "",
				(gen.relicList || []).length ? colored("Relíquias: ", gold) + gen.relicList.map(r => r.name).join(", ") : ""
			].filter(Boolean).join("\n"),
			"desc": (gen.trait || "") + [...(gen.traitList || []).map(t => "\n• " + t.name + ": " + t.desc), ...(gen.relicList || []).map(r => "\n• " + r.name + ": " + r.desc)].join(""),
			"quote": pickFrom(gen.quotes || [""]),
			"color": f.color
		};
	}
}
