/**
 * Batalha 2D em tempo real (substitui, por enquanto, a partida 3D).
 *
 * O campo é o mesmo do desdobramento, retangular: internamente x vai de 0 a
 * A (proporção largura/altura) e y de 0 a 1; as entradas e as feições vêm
 * normalizadas (0..1) e são convertidas. Lado 1 (jogador) no sul (y alto),
 * lado 2 (inimigo) no norte. Cada batalhão é um marcador que
 * anda, atira e perde força (hp = força do batalhão, 0..1). Sem interface:
 * a vista (ui/BattleView.js) chama step(dt) e lê units/events.
 *
 * Ordens: advance, hold, flank_left, flank_right, reserve, retreat,
 *         move (ponto escolhido) e attack (alvo escolhido).
 * Terreno: o terreno da província (field) e as feições sob cada batalhão
 *          mudam velocidade, alcance, dano causado e dano recebido, conforme
 *          a categoria (WH40K_FIELD_FX, WH40K_FEATURE_FX) e as afinidades da
 *          unidade (units.json: terrain, allTerrain). Ver terrainMods().
 * Apoio "killstreak": as baixas (homens) que um lado causa enchem as barras
 *          dos poderes; cheio, o poder é lançado num ponto do campo.
 * Debandada: um lado reduzido a 25% da força inicial, diante do dobro, foge.
 * Moral: um batalhão que cai abaixo de 30% da força (× moral da facção; 0 =
 *          nunca) sob fogo recua em pânico por 8 s e depois se reagrupa.
 * Fim: um lado sem ninguém em campo perde; tempo esgotado = o defensor segura.
 * Clima (opts.weather, WH40K_WEATHER): noite, tempestade de cinzas, chuva
 *          ácida, nevasca, tempestade da disformidade — modificadores como os
 *          do terreno; a chuva ácida fere a infantria sem cobertura.
 * Muralhas (feições "wall", do defensor com fortificações): cobertura forte;
 *          os tiros contra quem está nelas as desgastam até virarem ruínas.
 * Reforços: entradas com arrive (s) entram pela borda do próprio lado.
 * Poder do general (entrada.ability, generals.json): smite, warcry, shield,
 *          heal, inspire, summon, teleport — com recarga; ver useAbility().
 */
const WH40K_WEATHER = {
	"clear": { "name": "Tempo limpo", "fx": {} },
	"night": { "name": "Noite", "tint": [10, 14, 40, 110], "fx": { "infantry": { "range": 0.8 }, "vehicle": { "range": 0.8 }, "general": { "range": 0.8 } } },
	"ash": { "name": "Tempestade de cinzas", "tint": [90, 70, 50, 90], "fx": { "infantry": { "range": 0.85, "speed": 0.9 }, "vehicle": { "range": 0.8, "speed": 0.9 }, "air": { "range": 0.75, "speed": 0.85 } } },
	"acid": { "name": "Chuva ácida", "tint": [60, 90, 30, 70], "dot": 0.0025, "fx": { "infantry": { "taken": 1.08 }, "air": { "range": 0.85 } } },
	"snow": { "name": "Nevasca", "tint": [200, 210, 230, 70], "fx": { "infantry": { "speed": 0.85 }, "vehicle": { "speed": 0.8 }, "air": { "range": 0.8 } } },
	"warpstorm": { "name": "Tempestade da disformidade", "tint": [120, 30, 90, 80], "fx": { "infantry": { "dmg": 1.15, "taken": 1.1 }, "vehicle": { "dmg": 1.15, "taken": 1.1 }, "general": { "dmg": 1.15, "taken": 1.1 } } }
};
const WH40K_COMBAT = {
	"timeLimit": 300,
	"routRatio": 0.25,
	"routCatch": 30,
	"reserveDelay": 45,
	"damage": 0.0105,
	"category": {
		"infantry": { "speed": 0.021, "range": 0.075, "armor": 1.0 },
		"vehicle": { "speed": 0.032, "range": 0.13, "armor": 1.5 },
		"air": { "speed": 0.065, "range": 0.1, "armor": 1.2 },
		"general": { "speed": 0.024, "range": 0.07, "armor": 1.6 }
	},
};

/**
 * Efeitos de terreno por categoria. speed, range, dmg (dano causado) e
 * taken (dano recebido: < 1 = cobertura) multiplicam. Aeronaves ignoram as
 * feições. O general usa os da infantaria se não tiver os seus.
 */
const WH40K_FEATURE_FX = {
	"ruins": { "infantry": { "taken": 0.6 }, "vehicle": { "speed": 0.6, "taken": 0.85 }, "general": { "taken": 0.7 } },
	"forest": { "infantry": { "taken": 0.7, "speed": 0.85 }, "vehicle": { "speed": 0.5, "taken": 0.9, "range": 0.8 } },
	"crater": { "infantry": { "taken": 0.8 }, "vehicle": { "speed": 0.7 } },
	"rocks": { "infantry": { "taken": 0.75, "speed": 0.85 }, "vehicle": { "speed": 0.6, "taken": 0.9 } },
	"hill": { "infantry": { "range": 1.25, "dmg": 1.1, "speed": 0.85 }, "vehicle": { "range": 1.2, "dmg": 1.1, "speed": 0.8 } },
	"water": { "infantry": { "speed": 0.5, "taken": 1.15 }, "vehicle": { "speed": 0.35, "taken": 1.1 } },
	"wall": { "infantry": { "taken": 0.45, "speed": 0.6 }, "vehicle": { "taken": 0.7, "speed": 0.35 }, "general": { "taken": 0.5 } },
	"trench": { "infantry": { "taken": 0.55, "speed": 0.75 }, "vehicle": { "speed": 0.6 }, "general": { "taken": 0.6 } }
};
/** Entrincheirar (Krieg): parado este tempo, o batalhão cava uma trincheira (feição "trench"). */
const WH40K_DIG_TIME = 6;
const WH40K_TRENCH_R = 0.05;
const WH40K_TRENCH_MAX = 24;
const WH40K_FIELD_FX = {
	"hive": { "infantry": { "taken": 0.9 }, "vehicle": { "range": 0.85, "speed": 0.85 } },
	"industrial": { "infantry": { "taken": 0.9 }, "vehicle": { "speed": 0.9 } },
	"jungle": { "infantry": { "taken": 0.9 }, "vehicle": { "speed": 0.75, "range": 0.85 }, "air": { "range": 0.85 } },
	"mire": { "infantry": { "speed": 0.85 }, "vehicle": { "speed": 0.7 } },
	"mountains": { "infantry": { "speed": 0.9 }, "vehicle": { "speed": 0.8 } },
	"ice": { "infantry": { "speed": 0.85, "dmg": 0.95 }, "vehicle": { "speed": 0.85 } },
	"ash": { "infantry": { "taken": 1.05 }, "vehicle": { "speed": 1.1, "range": 1.1 } },
	"plains": { "infantry": { "taken": 1.05 }, "vehicle": { "speed": 1.1, "range": 1.1 } },
	"station": { "infantry": { "taken": 0.9 }, "vehicle": { "speed": 0.8, "range": 0.85 } },
	"rok": { "vehicle": { "speed": 0.85 } },
	"biomass": { "infantry": { "speed": 0.85 }, "vehicle": { "speed": 0.7 } },
	"warp": { "infantry": { "dmg": 1.1, "taken": 1.1 }, "vehicle": { "dmg": 1.1, "taken": 1.1 } },
	"tomb": { "infantry": { "taken": 0.85 }, "vehicle": { "speed": 0.85 } }
};
const WH40K_FX_NAMES = { "speed": "velocidade", "range": "alcance", "dmg": "dano", "taken": "dano recebido" };

class WH40KCombat
{
	/**
	 * opts: {
	 *   features: [{type, x, y, r}],
	 *   sides: { 1: side, 2: side }  side = { units: [entrada do desdobramento], support: [poder], ready, dps, armor, landing }
	 *   defender: 1 | 2, seed
	 * }
	 * entrada: { id, name, unitName, portrait, quotes, category, strength, level, order, x, y, general?, power, men, range?, speed?, armor? }
	 * poder: { id, type, name, icon, kills, desc }
	 */
	constructor(opts)
	{
		this.A = opts.aspect || 1;
		this.field = opts.terrain || "";
		this.features = (opts.features || []).map(f => ({ "type": f.type, "x": f.x * this.A, "y": f.y, "r": f.r, "hp": f.type == "wall" ? 1 : 0 }));
		this.featuresVersion = 0;
		this.weather = WH40K_WEATHER[opts.weather] ? opts.weather : "clear";
		this.defender = opts.defender || 2;
		this.time = 0;
		this.over = false;
		this.winner = 0;
		this.events = [];
		this.scheduled = [];
		this.units = [];
		this.sides = {};
		this.messages = [];
		let seed = opts.seed || 12345;
		this.rand = () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed / 0x7fffffff;
		};
		for (const s of [1, 2])
		{
			const def = opts.sides[s];
			const side = {
				"id": s,
				"kills": 0,
				"dps": def.dps || 1,
				"armor": def.armor || 1,
				"regen": def.regen || 0,
				"morale": def.morale === undefined ? 1 : def.morale,
				"landing": !!def.landing,
				"routing": false,
				"routTime": 0,
				"powers": (def.support || []).map((p, i) => ({
					"id": p.id, "type": p.type, "name": p.name, "icon": p.icon, "desc": p.desc,
					"kills": Math.max(1, p.kills),
					"charge": i < (def.ready || 0) ? Math.max(1, p.kills) : 0,
					"uses": 0
				}))
			};
			this.sides[s] = side;
			const late = [];
			for (const e of def.units)
				if (e.arrive)
					late.push(e);
				else
					this.addUnit(e, s);
			// Quem sabe cavar e começa com a ordem "segurar" já está entrincheirado.
			for (const u of this.alive(s))
				if (u.entrench && u.order == "hold" && !this.inTrench(u))
					this.addTrench(u);
			side.initial = this.sidePower(s);
			// Reforços de exércitos vizinhos: entram pela própria borda.
			late.forEach((e, i) => this.schedule(e.arrive, () => {
				if (this.over)
					return;
				const u = this.addUnit(Object.assign({}, e, { "x": (0.2 + 0.6 * ((i + 0.5) / late.length)), "y": s == 1 ? 0.97 : 0.03, "order": "advance" }), s);
				u.reinforcement = true;
				u.allyName = e.allyName || null;
				// Um aviso por grupo: os próprios reforços e os de cada aliado.
				if (late.findIndex(o => (o.allyName || null) == (e.allyName || null)) == i)
					this.message(s, e.allyName ? (s == 1 ? e.allyName + " chega para ajudar!" : "Aliados do inimigo chegam: " + e.allyName + "!") :
						s == 1 ? "Reforços chegam pela retaguarda!" : "Reforços inimigos chegam!");
				this.events.push({ "type": "droppod", "x": u.x, "y": u.y, "side": s, "reinforce": true });
			}));
		}
	}

	addUnit(e, side, temp)
	{
		const cat = WH40K_COMBAT.category[e.general ? "general" : e.category] || WH40K_COMBAT.category.infantry;
		const u = {
			"id": e.id,
			"side": side,
			"name": e.name,
			"unitName": e.unitName,
			"unit": e.unit,
			"gid": e.gid,
			"ability": e.ability || null,
			"abilityReady": e.ability ? 15 : Infinity,
			"buffs": [],
			"portrait": e.portrait,
			"icon": e.icon,
			"quotes": e.quotes,
			"category": e.general ? "general" : e.category,
			"general": !!e.general,
			"temp": !!temp,
			"hp": Math.max(0.05, e.strength === undefined ? 1 : e.strength),
			"hp0": Math.max(0.05, e.strength === undefined ? 1 : e.strength),
			"power": (e.power || 10) * (1 + 0.1 * (e.level || 0)),
			"men": e.men || 1,
			"speed": e.speed || cat.speed,
			"range": e.range || cat.range,
			"armor": (e.armor || 1) * cat.armor,
			"order": e.order || "advance",
			"terrain": e.terrain || null,
			"allTerrain": !!e.allTerrain,
			"entrench": !!e.entrench,
			"still": 0,
			"stillX": temp ? e.x : e.x * this.A,
			"stillY": e.y,
			"vsVehicle": e.vsVehicle || 1,
			"vsInfantry": e.vsInfantry || 1,
			"vsAir": e.vsAir || 1,
			"x": temp ? e.x : e.x * this.A,
			"y": e.y,
			"anchor": { "x": temp ? e.x : e.x * this.A, "y": e.y },
			"phase": 0,
			"point": null,
			"target": null,
			"state": "alive",
			"shotTimer": this.rand() * 0.8,
			"lastHit": -10,
			"lastFire": -10,
			"kills": 0
		};
		this.units.push(u);
		return u;
	}

	// ------------------------------------------------------------ consultas

	alive(side)
	{
		return this.units.filter(u => u.state == "alive" && (side === undefined || u.side == side));
	}

	unit(id, side)
	{
		return this.units.find(u => u.id == id && (side === undefined || u.side == side));
	}

	sidePower(side)
	{
		return this.alive(side).reduce((sum, u) => sum + u.hp * u.power, 0);
	}

	featureAt(x, y)
	{
		return this.features.filter(f => Math.hypot(f.x - x, f.y - y) < f.r);
	}

	/**
	 * Multiplicadores de terreno de uma unidade (categoria + afinidades) no
	 * terreno da província e nas feições dadas. Devolve { speed, range, dmg,
	 * taken, notes: [texto] }. Usado na simulação e na interface.
	 */
	static terrainMods(category, unit, field, featureTypes, weather)
	{
		const mods = { "speed": 1, "range": 1, "dmg": 1, "taken": 1, "notes": [] };
		const own = (unit && unit.terrain) || {};
		const apply = (table, key, label) => {
			const byCat = table && (table[category] || (category == "general" ? table.infantry : null));
			const fx = Object.assign({}, byCat || {});
			for (const stat in own[key] || {})
				fx[stat] = (fx[stat] || 1) * own[key][stat];
			for (const stat in fx)
			{
				let v = fx[stat];
				if (stat == "speed" && unit && unit.allTerrain && v < 1)
					v = 1;
				if (Math.abs(v - 1) < 0.001)
					continue;
				mods[stat] *= v;
				mods.notes.push(label + ": " + WH40K_FX_NAMES[stat] + " " + (v > 1 ? "+" : "") + Math.round((v - 1) * 100) + "%");
			}
		};
		const names = typeof WH40K_TERRAIN_NAMES != "undefined" ? WH40K_TERRAIN_NAMES : {};
		const fnames = { "ruins": "Ruínas", "forest": "Floresta", "crater": "Cratera", "rocks": "Rochedos", "hill": "Colina", "water": "Água", "wall": "Muralha", "trench": "Trincheira" };
		if (weather && WH40K_WEATHER[weather] && weather != "clear")
			apply(WH40K_WEATHER[weather].fx, "weather_" + weather, WH40K_WEATHER[weather].name);
		if (field)
			apply(WH40K_FIELD_FX[field], field, names[field] || field);
		if (category != "air")
			for (const type of [...new Set(featureTypes || [])])
				apply(WH40K_FEATURE_FX[type], type, fnames[type] || type);
		return mods;
	}

	/** Modificadores de terreno da unidade onde ela está agora. */
	modsOf(u)
	{
		// Trincheira só protege quem a cavou (o inimigo que chega ao corpo a corpo não ganha a cobertura).
		const types = this.featureAt(u.x, u.y).filter(f => f.type != "trench" || f.side == u.side).map(f => f.type);
		const key = types.join(",") + "#" + this.featuresVersion;
		if (u.modsKey !== key)
		{
			u.modsKey = key;
			u.mods = WH40KCombat.terrainMods(u.category, u, this.field, types, this.weather);
		}
		return u.mods;
	}

	rangeOf(u)
	{
		return u.range * this.modsOf(u).range;
	}

	nearestEnemy(u, maxDist)
	{
		let best = null;
		let bestD = maxDist === undefined ? Infinity : maxDist;
		for (const o of this.units)
		{
			if (o.state != "alive" || o.side == u.side)
				continue;
			const d = Math.hypot(o.x - u.x, o.y - u.y);
			if (d < bestD)
			{
				bestD = d;
				best = o;
			}
		}
		return best;
	}

	homeY(side)
	{
		return side == 1 ? 1 : 0;
	}

	/** Direção "para a frente" do lado: o lado 1 avança para y menor. */
	forward(side)
	{
		return side == 1 ? -1 : 1;
	}

	// ------------------------------------------------------------ ordens

	setOrder(u, order, data)
	{
		if (!u || u.state != "alive" || this.sides[u.side].routing && order != "retreat")
			return;
		u.order = order;
		u.phase = 0;
		u.target = null;
		u.point = null;
		if (order == "move" && data)
			u.point = { "x": Math.max(0.02, Math.min(this.A - 0.02, data.x)), "y": Math.max(0.02, Math.min(0.98, data.y)) };
		if (order == "attack" && data)
			u.target = data.id;
		if (order == "hold" || order == "reserve")
			u.anchor = { "x": u.x, "y": u.y };
	}

	orderAll(side, order)
	{
		for (const u of this.alive(side))
			if (!u.general || order == "retreat")
				this.setOrder(u, order);
	}

	// ------------------------------------------------------------ passo

	step(dt)
	{
		if (this.over)
			return;
		dt = Math.min(dt, 0.25);
		this.time += dt;
		this.runScheduled();
		for (const u of this.units)
			if (u.state == "alive")
			{
				this.checkMorale(u);
				this.think(u, dt);
				if (u.entrench && !u.temp)
					this.dig(u, dt);
				// Chuva ácida: a infantaria sem cobertura se desgasta.
				const dot = WH40K_WEATHER[this.weather].dot;
				if (dot && u.category == "infantry" && !this.featureAt(u.x, u.y).length && u.hp > 0.06)
					u.hp -= dot * dt;
				// Protocolos de reanimação (Necrons): sem levar dano por 4 s, a força volta aos poucos.
				const regen = this.sides[u.side].regen;
				if (regen && !u.temp && this.time - u.lastHit > 4 && u.hp < u.hp0)
					u.hp = Math.min(u.hp0, u.hp + regen * dt);
			}
		this.separate();
		this.checkRout();
		this.checkEnd();
	}

	inTrench(u)
	{
		return this.featureAt(u.x, u.y).some(f => (f.type == "trench" && f.side == u.side) || f.type == "wall");
	}

	/** Entrincheirar: parado por WH40K_DIG_TIME segundos, cava uma trincheira onde está. */
	dig(u, dt)
	{
		if (Math.hypot(u.x - u.stillX, u.y - u.stillY) > 0.012)
		{
			u.stillX = u.x;
			u.stillY = u.y;
			u.still = 0;
			return;
		}
		u.still += dt;
		if (u.still < WH40K_DIG_TIME || this.inTrench(u))
			return;
		u.still = 0;
		if (this.features.filter(f => f.type == "trench").length >= WH40K_TRENCH_MAX)
			return;
		this.addTrench(u);
		this.message(u.side, u.name + " se entrincheira!", true);
	}

	addTrench(u)
	{
		this.features.push({ "type": "trench", "x": u.x, "y": u.y, "r": WH40K_TRENCH_R, "hp": 0, "dug": true, "side": u.side });
		++this.featuresVersion;
		this.events.push({ "type": "entrench", "x": u.x, "y": u.y, "side": u.side });
	}

	moveTowards(u, tx, ty, dt, factor = 1)
	{
		const dx = tx - u.x;
		const dy = ty - u.y;
		const d = Math.hypot(dx, dy);
		if (d < 1e-4)
			return true;
		let speed = u.speed * factor * this.modsOf(u).speed * this.buffMul(u, "speed");
		if (this.sides[u.side].routing || u.order == "retreat")
			speed *= 1.15;
		const stepLen = Math.min(d, speed * dt);
		u.x += dx / d * stepLen;
		u.y += dy / d * stepLen;
		return stepLen >= d - 1e-4;
	}

	/** Atira no alvo se estiver no alcance. Devolve true se atirou. */
	fire(u, target, dt, factor = 1)
	{
		if (!target || target.state != "alive")
			return false;
		const d = Math.hypot(target.x - u.x, target.y - u.y);
		if (d > this.rangeOf(u))
			return false;
		const side = this.sides[u.side];
		let dmg = WH40K_COMBAT.damage * u.power * (0.35 + 0.65 * Math.min(1, u.hp / Math.max(0.3, u.hp0))) * side.dps * factor * dt;
		dmg *= this.modsOf(u).dmg * this.buffMul(u, "dmg");
		// Especialistas: caça-tanques, lança-chamas, antiaéreos.
		dmg *= target.category == "vehicle" ? u.vsVehicle : target.category == "air" ? u.vsAir : u.vsInfantry;
		if (side.landing && this.time < 25)
			dmg *= 0.85;
		// Aura do general: +15% a quem estiver perto.
		if (!u.general && this.alive(u.side).some(g => g.general && Math.hypot(g.x - u.x, g.y - u.y) < 0.16))
			dmg *= 1.15;
		// Corpo a corpo (muito perto): infantaria bate mais forte.
		if (d < 0.03 && u.category == "infantry")
			dmg *= 1.25;
		this.damage(target, dmg, u.side, u);
		u.lastFire = this.time;
		u.shotTimer -= dt;
		if (u.shotTimer <= 0)
		{
			u.shotTimer = 0.55 + this.rand() * 0.6;
			this.events.push({ "type": d < 0.03 ? "melee" : "shot", "from": u, "to": target, "x": target.x, "y": target.y, "category": u.category });
		}
		return true;
	}

	/** Dano em "poder"; o hp perdido depende do poder e da blindagem do alvo. */
	damage(target, dmg, bySide, byUnit)
	{
		if (target.state != "alive")
			return;
		const tside = this.sides[target.side];
		const loss = dmg / (target.power * target.armor * tside.armor) * this.modsOf(target).taken * this.buffMul(target, "taken");
		// Muralha: os tiros contra quem está nela a desgastam (veículos e artilharia mais).
		if (byUnit && target.category != "air")
			for (const f of this.features)
				if (f.type == "wall" && Math.hypot(f.x - target.x, f.y - target.y) < f.r)
				{
					f.hp -= dmg * 0.04 * (byUnit.category == "vehicle" ? 3 : 1);
					if (f.hp <= 0)
					{
						f.type = "ruins";
						++this.featuresVersion;
						this.events.push({ "type": "wallbreak", "x": f.x, "y": f.y });
						this.message(target.side, "Uma muralha desaba!", true);
					}
				}
		const before = target.hp;
		target.hp = Math.max(0, target.hp - loss);
		target.lastHit = this.time;
		const killed = (before - target.hp) * target.men;
		if (bySide && bySide != target.side)
		{
			this.sides[bySide].kills += killed;
			if (byUnit)
				byUnit.kills += killed;
			for (const p of this.sides[bySide].powers)
				p.charge = Math.min(p.kills, p.charge + killed);
		}
		if (target.hp <= 0.02)
		{
			target.hp = 0;
			target.state = "dead";
			this.events.push({ "type": "death", "unit": target, "x": target.x, "y": target.y, "category": target.category });
			if (target.general)
				this.message(target.side, target.name + " caiu em combate!");
		}
	}

	/** Pânico: uma vez por batalha, o batalhão muito ferido sob fogo recua por 8 s. */
	checkMorale(u)
	{
		const morale = this.sides[u.side].morale;
		if (u.general || u.temp || u.brokeOnce || !morale || this.sides[u.side].routing)
			return;
		if (u.hp < u.hp0 * 0.3 * morale && this.time - u.lastHit < 2)
		{
			u.brokeOnce = true;
			u.brokenUntil = this.time + 8;
			this.message(u.side, u.name + " recua em pânico!", true);
			this.events.push({ "type": "panic", "unit": u, "x": u.x, "y": u.y });
		}
	}

	think(u, dt)
	{
		const side = this.sides[u.side];
		if (u.brokenUntil)
		{
			if (this.time < u.brokenUntil && !side.routing)
			{
				const homeY = this.homeY(u.side);
				if (Math.abs(u.y - homeY) > 0.06)
					this.moveTowards(u, u.x, homeY, dt, 1.1);
				return;
			}
			u.brokenUntil = 0;
			if (u.order != "retreat")
				u.order = "hold";
			this.message(u.side, u.name + " se reagrupa.", true);
		}
		if (side.routing || u.order == "retreat")
		{
			const enemy = this.nearestEnemy(u, this.rangeOf(u));
			if (enemy && !side.routing)
				this.fire(u, enemy, dt, 0.4);
			const homeY = this.homeY(u.side);
			this.moveTowards(u, u.x, homeY, dt);
			if (Math.abs(u.y - homeY) < 0.015)
			{
				u.state = "escaped";
				this.events.push({ "type": "escape", "unit": u, "x": u.x, "y": u.y });
			}
			return;
		}
		const range = this.rangeOf(u);
		const nearest = this.nearestEnemy(u);
		const fwd = this.forward(u.side);
		switch (u.order)
		{
		case "hold":
		{
			const t = this.nearestEnemy(u, range * 1.1);
			if (!this.fire(u, t, dt))
				if (Math.hypot(u.anchor.x - u.x, u.anchor.y - u.y) > 0.01)
					this.moveTowards(u, u.anchor.x, u.anchor.y, dt);
			// Defensor de posição: dano extra parado na cobertura.
			break;
		}
		case "reserve":
		{
			const losses = 1 - this.sidePower(u.side) / Math.max(1, side.initial);
			const close = nearest && Math.hypot(nearest.x - u.x, nearest.y - u.y) < 0.22;
			if (this.time > WH40K_COMBAT.reserveDelay || losses > 0.3 || close)
			{
				u.order = "advance";
				this.message(u.side, u.unitName + " (reserva) entra na luta.", true);
			}
			else
				this.fire(u, this.nearestEnemy(u, range), dt);
			break;
		}
		case "flank_left":
		case "flank_right":
		{
			const tx = u.order == "flank_left" ? 0.07 * this.A : 0.93 * this.A;
			const ty = 0.5 + fwd * 0.08;
			const t = this.nearestEnemy(u, range);
			const fired = this.fire(u, t, dt, 0.6);
			if (u.phase == 0)
			{
				if (this.moveTowards(u, tx, ty, dt, fired ? 0.6 : 1) || (nearest && Math.hypot(nearest.x - u.x, nearest.y - u.y) < range * 0.9))
					u.phase = 1;
			}
			else
				this.engage(u, nearest, dt);
			break;
		}
		case "move":
		{
			const t = this.nearestEnemy(u, range);
			const fired = this.fire(u, t, dt, 0.7);
			if (!u.point || this.moveTowards(u, u.point.x, u.point.y, dt, fired ? 0.7 : 1))
			{
				u.order = "hold";
				u.anchor = { "x": u.x, "y": u.y };
				u.point = null;
			}
			break;
		}
		case "attack":
		{
			const t = this.unit(u.target);
			if (!t || t.state != "alive" || t.side == u.side)
			{
				u.order = "advance";
				u.target = null;
				break;
			}
			this.engage(u, t, dt);
			break;
		}
		case "advance":
		default:
			this.engage(u, nearest, dt);
		}
	}

	/** Vai até o alvo e atira quando estiver no alcance. */
	engage(u, target, dt)
	{
		if (!target)
			return;
		if (this.fire(u, target, dt))
		{
			// Infantaria fecha a distância para o corpo a corpo devagar; veículos param.
			if (u.category == "infantry" && Math.hypot(target.x - u.x, target.y - u.y) > 0.025)
				this.moveTowards(u, target.x, target.y, dt, 0.25);
			return;
		}
		this.moveTowards(u, target.x, target.y, dt);
	}

	/** Afasta marcadores sobrepostos. */
	separate()
	{
		const alive = this.alive();
		for (let i = 0; i < alive.length; ++i)
			for (let j = i + 1; j < alive.length; ++j)
			{
				const a = alive[i];
				const b = alive[j];
				if (a.category == "air" || b.category == "air")
					continue;
				const min = a.side == b.side ? 0.034 : 0.018;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d = Math.hypot(dx, dy);
				if (d >= min)
					continue;
				const push = (min - d) / 2;
				const nx = d > 1e-5 ? dx / d : this.rand() - 0.5;
				const ny = d > 1e-5 ? dy / d : this.rand() - 0.5;
				a.x = Math.max(0.01, Math.min(this.A - 0.01, a.x - nx * push));
				a.y = Math.max(0.01, Math.min(0.99, a.y - ny * push));
				b.x = Math.max(0.01, Math.min(this.A - 0.01, b.x + nx * push));
				b.y = Math.max(0.01, Math.min(0.99, b.y + ny * push));
			}
	}

	checkRout()
	{
		for (const s of [1, 2])
		{
			const side = this.sides[s];
			const other = 3 - s;
			if (side.routing)
				continue;
			const mine = this.sidePower(s);
			const theirs = this.sidePower(other);
			if (mine <= side.initial * WH40K_COMBAT.routRatio && theirs >= mine * 2 && this.alive(s).length)
			{
				side.routing = true;
				side.routTime = this.time;
				for (const u of this.alive(s))
					u.order = "retreat";
				this.message(s, s == 1 ? "Suas tropas DEBANDAM!" : "O inimigo DEBANDA!");
			}
		}
	}

	checkEnd()
	{
		const a1 = this.alive(1).length;
		const a2 = this.alive(2).length;
		for (const s of [1, 2])
		{
			const side = this.sides[s];
			if (side.routing && this.time - side.routTime > WH40K_COMBAT.routCatch)
			{
				// Quem não saiu do campo a tempo é pego na fuga.
				for (const u of this.alive(s))
				{
					u.hp *= 0.5;
					u.state = u.hp > 0.05 ? "escaped" : "dead";
				}
			}
		}
		if (!this.alive(1).length || !this.alive(2).length)
		{
			const w = this.alive(1).length ? 1 : this.alive(2).length ? 2 : this.defender;
			this.finish(w, w == 1 ? "O campo é seu." : "O inimigo domina o campo.");
			return;
		}
		if (this.time >= WH40K_COMBAT.timeLimit)
		{
			const attacker = 3 - this.defender;
			const w = this.sidePower(attacker) > this.sidePower(this.defender) * 2 ? attacker : this.defender;
			this.finish(w, "Tempo esgotado: " + (w == this.defender ? "o defensor segura a posição." : "o atacante domina o campo."));
		}
		void a1;
		void a2;
	}

	finish(winner, text)
	{
		this.over = true;
		this.winner = winner;
		this.endText = text;
		this.events.push({ "type": "end", "winner": winner });
	}

	/** Retirada geral (o lado desiste). */
	retreatAll(side)
	{
		this.orderAll(side, "retreat");
		this.message(side, side == 1 ? "RETIRADA! Todos para a borda sul!" : "O inimigo recua!");
	}

	message(side, text, minor)
	{
		this.messages.push({ "time": this.time, "side": side, "text": text, "minor": !!minor });
	}

	// ------------------------------------------------------------ apoio

	powerReady(side, i)
	{
		const p = this.sides[side].powers[i];
		return p && p.charge >= p.kills;
	}

	schedule(delay, fn)
	{
		this.scheduled.push({ "t": this.time + delay, "fn": fn });
	}

	runScheduled()
	{
		const due = this.scheduled.filter(s => s.t <= this.time);
		this.scheduled = this.scheduled.filter(s => s.t > this.time);
		for (const s of due)
			s.fn();
	}

	/** Dano em área: frac = parte do hp de um batalhão completo de poder 10. */
	blast(x, y, radius, frac, side, friendly)
	{
		for (const u of this.units)
		{
			if (u.state != "alive" || (!friendly && u.side == side))
				continue;
			const d = Math.hypot(u.x - x, u.y - y);
			if (d > radius)
				continue;
			const k = 1 - d / radius * 0.5;
			// Dano em "poder" equivalente: proporcional ao poder do alvo, para tirar frac do hp.
			this.damage(u, frac * k * u.power * u.armor * this.sides[u.side].armor / this.modsOf(u).taken * (u.category == "vehicle" ? 0.6 : 1), side == u.side ? 0 : side, null);
		}
	}

	/** Lança o poder i do lado no ponto (x, y). */
	usePower(side, i, x, y)
	{
		if (!this.powerReady(side, i) || this.over)
			return false;
		const p = this.sides[side].powers[i];
		p.charge = 0;
		++p.uses;
		x = Math.max(0.03, Math.min(this.A - 0.03, x));
		y = Math.max(0.03, Math.min(0.97, y));
		this.message(side, (side == 1 ? "Apoio: " : "O inimigo lança: ") + p.name + "!");
		switch (p.type)
		{
		case "drop_pod":
		{
			this.events.push({ "type": "droppod", "x": x, "y": y, "side": side });
			this.schedule(0.9, () => {
				this.blast(x, y, 0.05, 0.35, side, false);
				this.events.push({ "type": "explosion", "x": x, "y": y, "size": 0.06 });
				const n = this.units.filter(u => u.temp && u.side == side).length;
				const u = this.addUnit({
					"id": "drop" + side + "_" + n, "name": p.name, "unitName": p.name, "portrait": p.icon, "quotes": [],
					"category": "infantry", "strength": 1, "power": 12, "men": 7, "order": "advance", "x": x, "y": y
				}, side, true);
				this.events.push({ "type": "spawn", "unit": u, "x": x, "y": y });
			});
			break;
		}
		case "strategic_bomber":
		{
			// Passagem em linha, de leste para oeste, sobre o alvo.
			for (let k = 0; k < 7; ++k)
			{
				const bx = x + (k - 3) * 0.045;
				this.schedule(0.5 + k * 0.18, () => {
					this.blast(bx, y, 0.055, 0.2, side, false);
					this.events.push({ "type": "explosion", "x": bx, "y": y, "size": 0.055 });
				});
			}
			this.events.push({ "type": "flyover", "x": x, "y": y, "side": side });
			break;
		}
		case "orbital_laser":
		{
			this.events.push({ "type": "laser", "x": x, "y": y });
			for (let k = 0; k < 4; ++k)
				this.schedule(0.3 + k * 0.6, () => {
					this.blast(x, y, 0.05, 0.3, side, true);
					this.events.push({ "type": "impact", "x": x, "y": y, "size": 0.05 });
				});
			break;
		}
		case "orbital_saturation":
		default:
		{
			for (let k = 0; k < 11; ++k)
			{
				const a = this.rand() * Math.PI * 2;
				const d = Math.sqrt(this.rand()) * 0.13;
				const bx = x + Math.cos(a) * d;
				const by = y + Math.sin(a) * d;
				this.schedule(0.3 + k * 0.28, () => {
					this.blast(bx, by, 0.05, 0.18, side, true);
					this.events.push({ "type": "orbital", "x": bx, "y": by, "size": 0.06 });
				});
			}
		}
		}
		return true;
	}

	/** IA do lado: lança os poderes prontos onde há mais inimigos juntos. */
	// ------------------------------------------------------------ poder do general

	/** Multiplicador dos efeitos temporários (poderes de general) na unidade. */
	buffMul(u, key)
	{
		let m = 1;
		if (u.buffs && u.buffs.length)
		{
			u.buffs = u.buffs.filter(b => b.until > this.time);
			for (const b of u.buffs)
				m *= b[key] || 1;
		}
		return m;
	}

	/** O general do lado (vivo) e o poder dele. */
	generalOf(side)
	{
		return this.alive(side).find(u => u.general && u.ability) || null;
	}

	abilityReady(side)
	{
		const g = this.generalOf(side);
		return !!g && this.time >= g.abilityReady && !this.over;
	}

	/** Usa o poder do general (x, y: alvo, para smite e teleport). */
	useAbility(side, x, y)
	{
		if (!this.abilityReady(side))
			return false;
		const g = this.generalOf(side);
		const a = g.ability;
		g.abilityReady = this.time + (a.cooldown || 50);
		const near = (cx, cy, r, s) => this.alive(s).filter(o => Math.hypot(o.x - cx, o.y - cy) <= r);
		if (x === undefined)
		{
			x = g.x;
			y = g.y;
		}
		x = Math.max(0.03, Math.min(this.A - 0.03, x));
		y = Math.max(0.03, Math.min(0.97, y));
		this.message(side, (side == 1 ? "" : "Inimigo: ") + g.unitName + " — " + a.name + (/[!?]$/.test(a.name) ? "" : "!"));
		switch (a.type)
		{
		case "smite":
			for (const t of near(x, y, a.radius || 0.08, 3 - side))
				this.damage(t, (a.power || 0.25) * t.power * t.armor * this.sides[t.side].armor, side, g);
			this.events.push({ "type": "ability", "kind": "smite", "x": x, "y": y, "radius": a.radius || 0.08, "side": side });
			break;
		case "warcry":
		case "shield":
			for (const o of near(g.x, g.y, a.radius || 0.18, side))
				o.buffs.push(a.type == "warcry" ? { "until": this.time + (a.duration || 15), "dmg": 1 + (a.power || 0.4) } : { "until": this.time + (a.duration || 15), "taken": 1 - (a.power || 0.4) });
			this.events.push({ "type": "ability", "kind": a.type, "x": g.x, "y": g.y, "radius": a.radius || 0.18, "side": side });
			break;
		case "heal":
			for (const o of near(g.x, g.y, a.radius || 0.18, side))
				o.hp = Math.min(o.hp0, o.hp + (a.power || 0.25));
			this.events.push({ "type": "ability", "kind": "heal", "x": g.x, "y": g.y, "radius": a.radius || 0.18, "side": side });
			break;
		case "inspire":
			for (const o of this.alive(side))
			{
				o.brokenUntil = 0;
				o.brokeOnce = true;
				o.buffs.push({ "until": this.time + (a.duration || 20), "dmg": 1 + (a.power || 0.15), "speed": 1 + (a.power || 0.15) });
			}
			this.events.push({ "type": "ability", "kind": "inspire", "x": g.x, "y": g.y, "radius": 0.25, "side": side });
			break;
		case "summon":
		{
			const n = a.power || 2;
			for (let k = 0; k < n; ++k)
			{
				const sx = Math.max(0.03, Math.min(this.A - 0.03, g.x + (k - (n - 1) / 2) * 0.05));
				const sy = Math.max(0.03, Math.min(0.97, g.y + (side == 1 ? -0.05 : 0.05)));
				const u = this.addUnit(Object.assign({ "id": "summon" + side + "_" + this.units.length, "category": "infantry", "strength": 1, "order": "advance", "x": sx, "y": sy, "quotes": [] }, a.summon || {}, { "x": sx, "y": sy }), side, true);
				this.events.push({ "type": "spawn", "unit": u, "x": sx, "y": sy });
			}
			break;
		}
		case "teleport":
		{
			// O ponto fica até a distância do poder; leva o general e os 2 aliados mais próximos.
			const d = Math.hypot(x - g.x, y - g.y);
			const r = a.radius || 0.35;
			if (d > r)
			{
				x = g.x + (x - g.x) * r / d;
				y = g.y + (y - g.y) * r / d;
			}
			const group = [g].concat(this.alive(side).filter(o => o != g && o.category != "air").sort((p, q) => Math.hypot(p.x - g.x, p.y - g.y) - Math.hypot(q.x - g.x, q.y - g.y)).slice(0, 2));
			this.events.push({ "type": "ability", "kind": "teleport", "x": g.x, "y": g.y, "radius": 0.08, "side": side });
			group.forEach((o, k) => {
				o.x = Math.max(0.02, Math.min(this.A - 0.02, x + (k - 1) * 0.04));
				o.y = y;
				o.anchor = { "x": o.x, "y": o.y };
				if (o.order == "move" || o.order == "hold" || o.order == "reserve")
					o.order = "advance";
			});
			this.events.push({ "type": "ability", "kind": "teleport", "x": x, "y": y, "radius": 0.08, "side": side });
			break;
		}
		}
		return true;
	}

	/** IA do poder do general. */
	aiAbility(side)
	{
		if (!this.abilityReady(side))
			return;
		const g = this.generalOf(side);
		const a = g.ability;
		const enemies = this.alive(3 - side);
		const allies = this.alive(side);
		const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
		if (a.type == "smite" || a.type == "teleport")
		{
			let best = null;
			let bestScore = 0;
			for (const t of enemies)
			{
				if (dist(t, g) > 0.45)
					continue;
				const score = enemies.filter(o => dist(o, t) < (a.radius || 0.1)).reduce((s, o) => s + o.hp * o.power, 0);
				if (score > bestScore)
				{
					bestScore = score;
					best = t;
				}
			}
			if (best && bestScore > 15)
				this.useAbility(side, best.x, best.y);
			return;
		}
		const close = enemies.some(o => dist(o, g) < 0.22);
		if ((a.type == "warcry" || a.type == "shield" || a.type == "summon") && close)
			this.useAbility(side);
		else if (a.type == "heal" && allies.filter(o => dist(o, g) < (a.radius || 0.18)).reduce((s, o) => s + o.hp0 - o.hp, 0) > 0.6)
			this.useAbility(side);
		else if (a.type == "inspire" && (this.sidePower(side) < this.sides[side].initial * 0.7 || allies.some(o => o.brokenUntil > this.time)))
			this.useAbility(side);
	}

	aiSupport(side)
	{
		this.aiAbility(side);
		const powers = this.sides[side].powers;
		for (let i = 0; i < powers.length; ++i)
		{
			if (!this.powerReady(side, i))
				continue;
			const friendlyFire = powers[i].type == "orbital_laser" || powers[i].type == "orbital_saturation";
			let best = null;
			let bestScore = 0;
			for (const t of this.alive(3 - side))
			{
				let score = 0;
				for (const o of this.alive())
				{
					const d = Math.hypot(o.x - t.x, o.y - t.y);
					if (d > 0.12)
						continue;
					score += o.side == side ? (friendlyFire ? -1.5 : 0) : o.hp * o.power / 10;
				}
				if (score > bestScore)
				{
					bestScore = score;
					best = t;
				}
			}
			if (best && bestScore > 0.6)
				this.usePower(side, i, best.x, best.y);
		}
	}

	/** IA de ordens do lado: reage quando o plano não funciona. */
	aiOrders(side)
	{
		if (this.sides[side].routing)
			return;
		const attacker = 3 - this.defender;
		// O atacante que passou metade do tempo parado avança tudo.
		if (side == attacker && this.time > WH40K_COMBAT.timeLimit * 0.35)
			for (const u of this.alive(side))
				if (!u.general && (u.order == "hold" || u.order == "reserve"))
					u.order = "advance";
		// General longe dos seus acompanha o grosso do exército.
		const general = this.alive(side).find(u => u.general);
		const others = this.alive(side).filter(u => !u.general);
		if (general && others.length && general.order == "hold")
		{
			const cx = others.reduce((s, u) => s + u.x, 0) / others.length;
			const cy = others.reduce((s, u) => s + u.y, 0) / others.length;
			if (Math.hypot(cx - general.x, cy - general.y) > 0.25)
				this.setOrder(general, "move", { "x": cx, "y": cy + (side == 1 ? 0.06 : -0.06) });
		}
	}

	/** Resultado no formato da campanha (lado 1 = jogador). */
	result()
	{
		const strengths = { "1": {}, "2": {} };
		const generals = { "1": null, "2": null };
		for (const u of this.units)
		{
			if (u.temp)
				continue;
			const hp = u.state == "dead" ? 0 : Math.round(u.hp * 1000) / 1000;
			if (u.general)
				generals[u.side] = u.state != "dead";
			else
				strengths[u.side][u.id] = hp;
		}
		return {
			"winner": this.winner,
			"battalions": strengths,
			"generals": generals,
			"kills": { "1": Math.round(this.sides[1].kills), "2": Math.round(this.sides[2].kills) },
			"powers": { "1": this.sides[1].powers.reduce((n, p) => n + (p.uses || 0), 0), "2": this.sides[2].powers.reduce((n, p) => n + (p.uses || 0), 0) },
			"time": Math.round(this.time)
		};
	}
}
