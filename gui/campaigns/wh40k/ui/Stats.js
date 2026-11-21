/**
 * Estatísticas da campanha: territórios de cada facção por turno (barras
 * empilhadas, s.stats) e, por facção, batalhas, vitórias, baixas e rituais
 * (s.battleStats).
 */
const WH40K_STATS_BARS = 320;

class WH40KStats
{
	constructor(page)
	{
		this.page = page;
		gui("statsClose").onPress = () => this.close();
	}

	isOpen()
	{
		return !gui("statsDim").hidden;
	}

	close()
	{
		gui("statsDim").hidden = true;
	}

	open()
	{
		const g = this.page.game;
		const D = this.page.D;
		gui("statsDim").hidden = false;
		gui("statsTitle").caption = "Estatísticas — " + D.scenario.name + " (turno " + g.s.turn + ")";
		const factions = Object.keys(g.s.factions);
		const stats = g.s.stats.length ? g.s.stats : [{ "turn": g.s.turn, "prov": {} }];
		const cols = Math.min(stats.length, Math.floor(WH40K_STATS_BARS / Math.max(1, factions.length)), 40);
		const samples = [];
		for (let i = 0; i < cols; ++i)
			samples.push(stats[Math.round(i * (stats.length - 1) / Math.max(1, cols - 1))]);
		const total = Object.keys(g.s.provinces).length;
		const chart = gui("statsChart").getComputedSize();
		const W = chart.right - chart.left;
		const H = chart.bottom - chart.top;
		const colW = W / Math.max(1, cols);
		let n = 0;
		samples.forEach((st, c) => {
			let y = H;
			for (const f of factions)
			{
				const v = st.prov[f] || 0;
				if (!v || n >= WH40K_STATS_BARS)
					continue;
				const h = H * v / total;
				const bar = gui("statsBar[" + n++ + "]");
				bar.hidden = false;
				bar.sprite = "color:" + rgbStr(D.factionColor(f), 230);
				setSize(bar, c * colW + 1, y - h, (c + 1) * colW - 1, y);
				y -= h;
			}
		});
		for (; n < WH40K_STATS_BARS; ++n)
			gui("statsBar[" + n + "]").hidden = true;
		gui("statsAxis").caption = "Turno " + samples[0].turn + (samples.length > 1 ? " … turno " + samples[samples.length - 1].turn : "") + " · altura = parte das " + total + " províncias (o resto é neutro)";
		gui("statsLegend").caption = factions.map(f => colored("■ ", D.factionColor(f)) + D.factionName(f) + "\n   " + g.provincesOf(f).length + " províncias" + (g.s.factions[f].alive ? "" : " (fora da guerra)")).join("\n");
		gui("statsText").caption = factions.map(f => {
			const b = g.s.battleStats[f] || {};
			return colored(D.factionName(f), D.factionColor(f)) + ": " + (b.battles || 0) + " batalhas, " + (b.wins || 0) + " vitórias · baixas causadas " + (b.kills || 0) + ", sofridas " + (b.losses || 0) +
				" · rituais " + (b.rituals || 0) + (g.special(f) ? " · " + g.special(f).short + " " + g.specialAmount(f) : "");
		}).join("\n");
	}
}
