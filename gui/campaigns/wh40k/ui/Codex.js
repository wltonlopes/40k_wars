/**
 * Códex: todas as facções, com descrição, mecânicas, recurso especial e
 * rituais, e a grade de unidades e generais (clique: ficha grande).
 * Abre no jogo (painel geral) ou no menu principal (page.xml com {codex: true}).
 */
const WH40K_CODEX_FACTIONS = 26;
const WH40K_CODEX_ICONS = 48;

class WH40KCodex
{
	constructor(page)
	{
		this.page = page;
		gui("codexClose").onPress = () => this.close();
	}

	isOpen()
	{
		return !gui("codexDim").hidden;
	}

	close()
	{
		gui("codexDim").hidden = true;
		if (this.onClose)
			this.onClose();
	}

	factions()
	{
		const D = this.page.D;
		return Object.keys(D.factions).filter(f => D.factions[f].enabled !== false && D.unitsOf(f).length);
	}

	open(faction, onClose)
	{
		this.onClose = onClose || null;
		gui("codexDim").hidden = false;
		const list = this.factions();
		this.show(list.indexOf(faction) != -1 ? faction : list[0]);
	}

	show(faction)
	{
		const D = this.page.D;
		const list = this.factions();
		for (let i = 0; i < WH40K_CODEX_FACTIONS; ++i)
		{
			const btn = gui("codexFac[" + i + "]");
			const f = list[i];
			btn.hidden = !f;
			if (!f)
				continue;
			btn.size = "16 " + (54 + i * 27) + " 216 " + (79 + i * 27);
			btn.caption = (f == faction ? "> " : "") + (D.factions[f].short || D.factions[f].name);
			btn.tooltip = D.factions[f].name;
			btn.onPress = () => this.show(f);
		}
		const fd = D.factions[faction];
		const sp = fd.special;
		const campaigns = D.scenarios.filter(sc => sc.factions.indexOf(faction) != -1).map(sc => sc.name);
		gui("codexTitle").caption = colored(fd.name, fd.color);
		gui("codexText").caption = fd.description + "\n" +
			colored("Campanhas: ", [235, 205, 125]) + (campaigns.join(", ") || "—") + "\n" +
			(fd.tips ? colored("Dica: ", [235, 205, 125]) + fd.tips + "\n" : "") +
			(sp ? colored(sp.name + ": ", [210, 170, 250]) + sp.desc + " Rituais: " + sp.rituals.map(r => r.name + " (" + r.cost + ")").join(", ") + ".\n" : "") +
			(fd.pact ? colored("Diplomacia: ", [150, 220, 210]) + (fd.pact.never || (fd.pact.with.length ? "aceita tréguas." : "não negocia.")) : "");
		const units = D.unitsOf(faction);
		const generals = Object.values(D.generals).filter(g => g.faction == faction);
		const items = generals.map(g => ({ "portrait": g.portrait, "tag": g.name.split(",")[0], "tooltip": g.title + " " + g.name + "\n" + g.trait, "card": { "general": g.id } }))
			.concat(units.map(u => ({ "portrait": u.portrait, "tag": "", "tooltip": u.name + " — " + u.desc + "\nCusto " + u.cost + " · poder " + u.power, "card": { "unit": u.id } })));
		const cols = 9;
		const step = 98;
		for (let i = 0; i < WH40K_CODEX_ICONS; ++i)
		{
			const btn = gui("codexIcon[" + i + "]");
			const it = items[i];
			btn.hidden = !it;
			if (!it)
				continue;
			const x = 232 + (i % cols) * step;
			const y = 184 + Math.floor(i / cols) * step;
			btn.size = x + " " + y + " " + (x + step - 6) + " " + (y + step - 6);
			gui("codexIconImg[" + i + "]").sprite = portraitSprite(it.portrait);
			gui("codexIconTag[" + i + "]").caption = it.tag;
			btn.tooltip = it.tooltip + "\n\nClique: ficha.";
			btn.onPress = () => this.page.card.open(it.card);
		}
	}
}
