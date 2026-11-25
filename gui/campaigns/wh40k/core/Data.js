/**
 * Dados fixos da campanha (campaigns/wh40k/data/): facções, unidades,
 * generais, apoio, setor (corpos e províncias) e os dados gerados dos
 * mapas (data/planets/<corpo>.json: retângulo da máscara, rótulo, vizinhos).
 */
const WH40K_DATA_DIR = "campaigns/wh40k/data/";

/** Rendimento base por terreno (por turno), antes de colmeias e estaleiros. */
const WH40K_TERRAIN_INCOME = {
	"hive": 35, "industrial": 30, "plains": 25, "station": 30, "rok": 25, "tomb": 25, "warp": 20, "biomass": 15,
	"mountains": 12, "jungle": 12, "ash": 10, "ice": 10, "mire": 8
};
const WH40K_TERRAIN_NAMES = {
	"hive": "Cidade-colmeia", "industrial": "Zona industrial", "plains": "Planícies", "station": "Estação orbital",
	"biomass": "Biomassa tiranídea", "warp": "Solo da disformidade", "tomb": "Complexo tumular",
	"rok": "Rocha de asteroide", "mountains": "Montanhas", "jungle": "Selva", "ash": "Ermos de cinzas",
	"ice": "Gelo", "mire": "Pântano", "sea": "Mar"
};
const WH40K_ORDERS = {
	"advance": { "name": "Avançar", "desc": "Marcha contra o inimigo mais próximo e luta." },
	"hold": { "name": "Manter posição", "desc": "Segura o lugar e só enfrenta quem chegar perto." },
	"flank_left": { "name": "Flanquear (esq.)", "desc": "Contorna pela esquerda e ataca de lado." },
	"flank_right": { "name": "Flanquear (dir.)", "desc": "Contorna pela direita e ataca de lado." },
	"reserve": { "name": "Reserva", "desc": "Espera atrás; entra quando o inimigo chega ou as perdas passam de 30%." },
	"retreat": { "name": "Recuar", "desc": "Foge para a borda do seu lado; quem sai escapa." }
};

/**
 * Dificuldade (escolhida na campanha nova): recursos iniciais, rendimento e
 * quanto a IA exige de vantagem para atacar (aiRatio: menor = mais agressiva).
 */
const WH40K_DIFFICULTY = {
	"easy": { "name": "Fácil", "desc": "Mais recursos para você; a IA rende menos e só ataca com muita vantagem.", "playerFunds": 1.4, "aiFunds": 0.8, "playerIncome": 1.2, "aiIncome": 0.85, "aiRatio": 1.6 },
	"normal": { "name": "Normal", "desc": "As regras padrão.", "playerFunds": 1, "aiFunds": 1, "playerIncome": 1, "aiIncome": 1, "aiRatio": 1.25 },
	"hard": { "name": "Difícil", "desc": "A IA começa e rende mais, e ataca com menos vantagem.", "playerFunds": 0.9, "aiFunds": 1.3, "playerIncome": 1, "aiIncome": 1.25, "aiRatio": 1.1 }
};

/** Grupos que não são aliados de saída: se aliam quando têm um inimigo comum e rompem quando ele some. */
var WH40K_INTEREST_GROUPS = ["chaos"];

var WH40KData = {
	"loaded": false,

	/**
	 * Carrega os dados; scenarioId escolhe a campanha (scenarios.json) e o
	 * setor dela. Sem argumento, mantém a que já está carregada.
	 */
	"load": function(scenarioId)
	{
		if (this.loaded && (!scenarioId || scenarioId == this.scenario.id))
			return this;
		const read = file => Engine.ReadJSONFile(WH40K_DATA_DIR + file);
		this.scenarios = read("scenarios.json").scenarios;
		this.scenario = this.scenarios.find(sc => sc.id == scenarioId) || this.scenarios[0];
		const factions = read("factions.json");
		this.factions = factions.factions;
		this.neutral = factions.neutral;

		const units = read("units.json");
		this.units = {};
		this.unitById = {};
		for (const faction in units)
		{
			if (!Array.isArray(units[faction]))
				continue;
			this.units[faction] = units[faction];
			for (const unit of units[faction])
				this.unitById[unit.id] = Object.assign({ "faction": faction }, unit);
		}

		this.generals = {};
		for (const general of read("generals.json").generals)
			this.generals[general.id] = general;

		// Progressão dos generais e relíquias (progression.json, v0.6).
		let progression = {};
		try
		{
			progression = read("progression.json") || {};
		}
		catch (e)
		{
			warn("40k Wars: progression.json indisponível: " + e);
		}
		this.progression = { "levels": progression.levels || [0, 3, 7, 12, 18, 26], "traits": {} };
		for (const t of progression.traits || [])
			this.progression.traits[t.id] = t;
		this.relics = (progression.relics || {})[this.scenario.id] || {};
		this.relicById = {};
		for (const pid in this.relics)
			this.relicById[this.relics[pid].id] = Object.assign({ "province": pid }, this.relics[pid]);

		// Miniaturas recortadas dos retratos (tools/art/gen_minis.py), opcionais.
		this.minis = {};
		try
		{
			for (const p of read("minis.json").minis || [])
				this.minis[p] = true;
		}
		catch (e)
		{
			// sem miniaturas: a batalha usa os retratos
		}
		// Sprites de batalha por unidade (tools/art/gen_sprites.py): têm prioridade.
		// sprites: { unidade: [quadros de marcha, quadros de tiro] }.
		this.sprites = {};
		try
		{
			const sp = read("sprites.json").sprites || {};
			for (const id in sp)
				this.sprites[Array.isArray(sp) ? sp[id] : id] = Array.isArray(sp) ? [1, 0] : sp[id];
		}
		catch (e)
		{
			// sem sprites: miniatura ou retrato
		}

		const support = read("support.json");
		this.support = {};
		for (const faction in support)
			if (Array.isArray(support[faction]))
				this.support[faction] = support[faction];

		this.sector = read(this.scenario.sector);
		if (this.scenario.neutralName)
			this.neutral = Object.assign({}, this.neutral, { "name": this.scenario.neutralName });
		this.bodies = {};
		this.provinces = {};
		for (const body of this.sector.bodies)
		{
			this.bodies[body.id] = body;
			body.landProvinces = [];
			if (!body.provinces)
				continue;
			const generated = read("planets/" + body.id + ".json");
			body.mapSize = generated.mapSize || body.mapSize;
			for (const province of body.provinces)
			{
				if (province.terrain == "sea" || !generated.provinces[province.id])
					continue;
				this.provinces[province.id] = Object.assign({ "body": body.id }, province, generated.provinces[province.id]);
				body.landProvinces.push(province.id);
			}
		}
		this.loaded = true;
		return this;
	},

	/** Facções que o jogador pode escolher nesta campanha. */
	"playableFactions": function()
	{
		return this.scenario.playable.filter(f => this.factions[f] && this.factions[f].enabled);
	},

	/** Aliança da facção nesta campanha (scenario.teams), ou null. */
	"teamOf": function(faction)
	{
		const teams = this.scenario.teams || {};
		for (const t in teams)
			if (teams[t].indexOf(faction) != -1)
				return t;
		return null;
	},

	/** Grupo da facção (pact.group: imperium, chaos, eldar...). */
	"groupOf": function(faction)
	{
		return this.factions[faction]?.pact?.group || null;
	},

	/**
	 * Mesma facção ou aliadas na campanha: não se atacam, se ajudam nas
	 * batalhas e vencem juntas. Vale o time do cenário (scenario.teams) e,
	 * sem ele, o grupo: as facções do Imperium são sempre aliadas. Grupos de
	 * WH40K_INTEREST_GROUPS (o Caos) só se aliam por conveniência, durante
	 * a campanha (Game.allied / core/Mechanics.js).
	 */
	"allied": function(a, b)
	{
		if (!a || !b)
			return a == b && !!a;
		if (a == b)
			return true;
		const ta = this.teamOf(a);
		const tb = this.teamOf(b);
		if (ta && tb)
			return ta == tb;
		const g = this.groupOf(a);
		return !!g && g == this.groupOf(b) && WH40K_INTEREST_GROUPS.indexOf(g) == -1;
	},

	/** Facções em jogo nesta campanha (jogador e IA). */
	"scenarioFactions": function()
	{
		return this.scenario.factions.filter(f => this.factions[f] && this.factions[f].enabled);
	},

	/** Retrato de uma facção para as janelas (vitória, derrota ou padrão). */
	"factionPortrait": function(faction, kind)
	{
		const f = this.factions[faction] || {};
		return (kind == "win" ? f.winPortrait : kind == "lose" ? f.losePortrait : null) || f.portrait || "imperial/r0c6.png";
	},

	"factionName": function(faction)
	{
		return faction && this.factions[faction] ? this.factions[faction].name : this.neutral.name;
	},

	"factionColor": function(faction)
	{
		return faction && this.factions[faction] ? this.factions[faction].color : this.neutral.color;
	},

	/** Posição do corpo na vista do sistema (estrela em 0,0; unidades de órbita). */
	"bodyPos": function(id)
	{
		const body = this.bodies[id];
		const angle = body.angle * Math.PI / 180;
		const local = { "x": Math.cos(angle) * body.orbit, "y": Math.sin(angle) * body.orbit };
		if (!body.parent)
			return local;
		const parent = this.bodyPos(body.parent);
		return { "x": parent.x + local.x, "y": parent.y + local.y };
	},

	"bodyDistance": function(a, b)
	{
		const pa = this.bodyPos(a);
		const pb = this.bodyPos(b);
		return Math.sqrt((pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y));
	},

	/** Turnos de viagem entre dois corpos (lua e planeta: 1). */
	"travelTurns": function(a, b)
	{
		if (a == b)
			return 0;
		const A = this.bodies[a];
		const B = this.bodies[b];
		if (A.parent == b || B.parent == a || (A.parent && A.parent == B.parent))
			return 1;
		return Math.max(1, Math.ceil(this.bodyDistance(a, b) / 0.2));
	},

	"unitsOf": function(faction)
	{
		return this.units[faction] || [];
	},

	"supportOf": function(faction)
	{
		return this.support[faction] || [];
	}
};
