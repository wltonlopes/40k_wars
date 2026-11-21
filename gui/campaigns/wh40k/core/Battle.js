/**
 * Batalha jogada da campanha: terreno (feições), desdobramento, plano,
 * apoio, opções da batalha 2D (core/Combat.js) e volta do resultado.
 *
 * O jogador é sempre o jogador 1 (sul da tela e do mapa) e o inimigo o 2.
 * Coordenadas do desdobramento: x, y de 0 a 1, y = 0 no norte (inimigo).
 */
const WH40K_FEATURES = {
	"hive": { "ruins": 9, "crater": 3, "rocks": 1 },
	"industrial": { "ruins": 6, "crater": 5 },
	"ash": { "rocks": 4, "crater": 3, "hill": 2 },
	"jungle": { "forest": 9, "hill": 1 },
	"mire": { "water": 5, "forest": 3 },
	"mountains": { "hill": 6, "rocks": 3 },
	"plains": { "forest": 3, "hill": 2, "crater": 1 },
	"ice": { "hill": 3, "rocks": 3, "crater": 1 },
	"rok": { "crater": 7, "rocks": 3 },
	"station": { "ruins": 11 },
	"biomass": { "forest": 5, "crater": 3, "water": 2 },
	"warp": { "ruins": 4, "crater": 4, "rocks": 2 },
	"tomb": { "ruins": 6, "rocks": 3, "hill": 1 }
};
const WH40K_FEATURE_NAMES = {
	"ruins": "Ruínas: cobertura e obstáculo", "crater": "Cratera", "rocks": "Rochedos", "hill": "Colina: vantagem de altura",
	"forest": "Floresta: bloqueia a visão", "water": "Água rasa e lama: lenta"
};
const WH40K_PLANS = {
	"assault": { "name": "Ataque Total", "desc": "Todos avançam juntos contra o inimigo." },
	"line": { "name": "Linha Defensiva", "desc": "A linha segura a posição e espera o inimigo; aeronaves atacam." },
	"hammer": { "name": "Martelo e Bigorna", "desc": "A infantaria segura (bigorna) e os veículos flanqueiam (martelo)." },
	"pincer": { "name": "Pinça", "desc": "As alas flanqueiam pelos dois lados; o centro fica na reserva." }
};

class WH40KBattleSetup
{
	constructor(game, battle)
	{
		this.g = game;
		this.D = game.D;
		this.battle = battle;
		this.playerRole = battle.attacker.faction == game.player ? "attacker" : "defender";
		this.enemyRole = this.playerRole == "attacker" ? "defender" : "attacker";
		this.sides = game.battleSides(battle);
		this.pdef = game.pdef(battle.province);
		this.rng = WH40KBattleSetup.seeded(battle.id + ":" + battle.province);
	}

	static seeded(text)
	{
		let h = 2166136261;
		for (let i = 0; i < text.length; ++i)
			h = Math.imul(h ^ text.charCodeAt(i), 16777619);
		return () => {
			h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
			return ((h ^= h >>> 16) >>> 0) / 4294967296;
		};
	}

	factionOf(role)
	{
		return this.sides[role].faction || this.D.bodies[this.pdef.body].neutralCiv || this.D.scenario.factions[0];
	}

	/** Feições do campo (mesma semente da batalha: iguais na tela e no mapa). */
	features()
	{
		if (this.cachedFeatures)
			return this.cachedFeatures;
		const counts = WH40K_FEATURES[this.pdef.terrain] || { "hill": 3, "forest": 3 };
		const list = [];
		for (const type in counts)
			for (let i = 0; i < counts[type]; ++i)
			{
				let f;
				for (let tries = 0; tries < 12; ++tries)
				{
					f = {
						"type": type,
						"x": 0.07 + this.rng() * 0.86,
						"y": 0.28 + this.rng() * 0.44,
						"r": (type == "ruins" ? 0.04 : 0.035) + this.rng() * 0.035
					};
					if (!list.some(o => Math.hypot(o.x - f.x, o.y - f.y) < o.r + f.r))
						break;
				}
				list.push(f);
			}
		this.cachedFeatures = list.map(f => ({ "type": f.type, "x": +f.x.toFixed(3), "y": +f.y.toFixed(3), "r": +f.r.toFixed(3) }));
		return this.cachedFeatures;
	}

	entryOf(e, role)
	{
		const unit = this.g.unit(e.bat);
		return {
			"id": e.bat.id,
			"unit": unit.id,
			"icon": unit.icon || unit.portrait,
			"unitName": unit.name,
			"name": e.bat.leader,
			"portrait": unit.portrait,
			"quotes": unit.quotes,
			"category": unit.category,
			"strength": e.bat.strength,
			"level": this.g.level(e.bat),
			"garrison": !!e.garrison,
			"order": "advance",
			"x": 0.5,
			"y": 0.5
		};
	}

	generalEntry(role)
	{
		const g = this.sides[role].general;
		if (!g)
			return null;
		const def = this.g.generalStats(g.id);
		return {
			"id": "general",
			"general": true,
			"gid": g.id,
			"name": def.title + " " + def.name,
			"unitName": def.title,
			"portrait": def.portrait,
			"quotes": def.quotes,
			"category": "general",
			"strength": 1,
			"order": "hold",
			"x": 0.5,
			"y": 0.5
		};
	}

	/** Desdobramento inicial dos dois lados (posições e ordens). */
	deployment()
	{
		const deploy = { "player": [], "enemy": [] };
		for (const [key, role] of [["player", this.playerRole], ["enemy", this.enemyRole]])
		{
			const list = this.sides[role].entries.map(e => this.entryOf(e, role));
			const general = this.generalEntry(role);
			if (general)
				list.push(general);
			this.arrange(list, key == "player");
			deploy[key] = list;
		}
		this.applyPlan(deploy.player, this.playerRole == "defender" ? "line" : "assault");
		this.applyPlan(deploy.enemy, this.enemyAIPlan());
		return deploy;
	}

	/** Fileiras: infantaria na frente, veículos atrás, aeronaves e general no fundo. */
	arrange(list, south)
	{
		const rows = { "infantry": -0.01, "vehicle": 0.065, "air": 0.13, "general": 0.13 };
		const groups = {};
		for (const e of list)
			(groups[e.category] = groups[e.category] || []).push(e);
		for (const cat in groups)
		{
			const g = groups[cat];
			const spacing = Math.min(0.1, 0.84 / Math.max(1, g.length));
			g.forEach((e, i) => {
				e.x = +(0.5 + (i - (g.length - 1) / 2) * spacing).toFixed(3);
				const depth = 0.80 + (rows[cat] || 0);
				e.y = +(south ? Math.min(0.95, depth) : Math.max(0.05, 1 - depth)).toFixed(3);
			});
		}
	}

	enemyAIPlan()
	{
		if (this.enemyRole == "defender" && (this.g.province(this.battle.province).forts || this.pdef.hive))
			return "line";
		return pickFrom(["assault", "assault", "hammer", "pincer"]);
	}

	applyPlan(list, plan)
	{
		const vehicles = list.filter(e => e.category == "vehicle");
		list.forEach(e => {
			if (e.general)
			{
				e.order = "hold";
				return;
			}
			switch (plan)
			{
			case "line":
				e.order = e.category == "air" ? "advance" : "hold";
				break;
			case "hammer":
				e.order = e.category == "infantry" ? "hold" : e.category == "vehicle" ? (vehicles.indexOf(e) % 2 ? "flank_right" : "flank_left") : "advance";
				break;
			case "pincer":
				e.order = e.x < 0.4 ? "flank_left" : e.x > 0.6 ? "flank_right" : "reserve";
				break;
			case "assault":
			default:
				e.order = "advance";
			}
		});
	}

	/** Poderes de apoio de um lado (killstreak) e quantos começam prontos. */
	supportFor(role)
	{
		const faction = this.sides[role].faction;
		if (!faction)
			return { "powers": [], "ready": 0 };
		const hasAir = this.sides[role].entries.some(e => this.g.unit(e.bat)?.category == "air");
		const orbit = this.g.orbitalControl(this.pdef.body, faction);
		const powers = this.D.supportOf(faction).filter(p => p.requires == "orbit" ? orbit : p.requires == "air" ? hasAir : true);
		const general = this.sides[role].general && this.g.generalStats(this.sides[role].general.id);
		return { "powers": powers, "ready": general ? general.support || 0 : 0, "orbit": orbit, "air": hasAir };
	}

	killsNeeded(power, role)
	{
		const hasAir = this.sides[role].entries.some(e => this.g.unit(e.bat)?.category == "air");
		return Math.max(3, power.kills - (hasAir ? power.airDiscount || 0 : 0));
	}

	/** Opções da batalha 2D (core/Combat.js). O jogador é sempre o lado 1. */
	combatOptions(deploy, aspect)
	{
		const unitStats = e => {
			if (e.general)
				return { "power": 14, "men": 1 };
			const unit = this.D.unitById[e.unit] || {};
			return { "power": unit.power || 10, "men": unit.men || 1, "range": unit.range, "speed": unit.speed, "armor": unit.armor, "terrain": unit.terrain, "allTerrain": unit.allTerrain,
				"vsVehicle": unit.vsVehicle, "vsInfantry": unit.vsInfantry, "vsAir": unit.vsAir };
		};
		const prov = this.g.province(this.battle.province);
		const sideOpts = (list, role) => {
			const faction = this.sides[role].faction;
			const g = this.sides[role].general && this.g.generalStats(this.sides[role].general.id);
			const sup = this.supportFor(role);
			let armor = 1;
			if (role == "defender")
				armor += 0.12 * prov.forts + (this.pdef.hive == 2 ? 0.1 : 0) + (this.pdef.terrain == "mountains" ? 0.1 : 0) + (g ? g.defense * 0.5 : 0);
			// Bônus dos rituais (exércitos do lado): metade do valor, como os do general.
			let buffAtk = 0;
			let buffDef = 0;
			for (const aid of this.battle[role].armies)
			{
				const army = this.g.s.armies[aid];
				if (army)
				{
					buffAtk = Math.max(buffAtk, this.g.buffBonus(army, "attack"));
					buffDef = Math.max(buffDef, this.g.buffBonus(army, "defense"));
				}
			}
			armor = Math.max(0.5, armor + buffDef * 0.5);
			return {
				"units": list.map(e => Object.assign({}, e, unitStats(e))),
				"support": sup.powers.map(p => ({ "id": p.id, "type": p.type, "name": p.name, "icon": p.icon, "desc": p.desc, "kills": this.killsNeeded(p, role) })),
				"ready": sup.ready,
				"dps": Math.max(0.5, 1 + (this.D.factions[faction]?.attackBonus || 0) + (role == "attacker" && g ? g.attack * 0.5 : 0) + buffAtk * 0.5),
				"morale": this.D.factions[faction]?.morale ?? 1,
				"armor": armor,
				"regen": this.D.factions[faction]?.regen || 0,
				"landing": role == "attacker" && this.battle.kind == "landing"
			};
		};
		return {
			"features": this.features(),
			"aspect": aspect || 1,
			"terrain": this.pdef.terrain,
			"defender": this.playerRole == "defender" ? 1 : 2,
			"seed": Math.floor(this.rng() * 1e9) + 1,
			"sides": {
				"1": sideOpts(deploy.player, this.playerRole),
				"2": sideOpts(deploy.enemy, this.enemyRole)
			}
		};
	}

	/**
	 * Resultado da batalha 2D -> resultado da campanha.
	 * res: { winner: 1|2, battalions: {1: {id: força}, 2: {...}}, generals: {1, 2}, kills }
	 */
	applyCombat(res)
	{
		const battle = this.g.refreshBattle(this.battle) || this.battle;
		const strengths = Object.assign({}, res.battalions[1] || {}, res.battalions[2] || {});
		const generalsAlive = {};
		if (res.generals[1] !== null && res.generals[1] !== undefined)
			generalsAlive[this.playerRole] = !!res.generals[1];
		if (res.generals[2] !== null && res.generals[2] !== undefined)
			generalsAlive[this.enemyRole] = !!res.generals[2];
		const powers = {};
		if (res.powers)
		{
			powers[this.playerRole] = res.powers[1] || 0;
			powers[this.enemyRole] = res.powers[2] || 0;
		}
		const report = this.g.applyBattle(battle, {
			"winner": res.winner == 1 ? this.playerRole : this.enemyRole,
			"strengths": strengths,
			"generalsAlive": generalsAlive,
			"powers": powers
		});
		report.lines.unshift("Baixas causadas: você " + (res.kills[1] || 0) + ", inimigo " + (res.kills[2] || 0) + " (" + Math.floor(res.time / 60) + " min " + (res.time % 60) + " s de combate).");
		return report;
	}
}
