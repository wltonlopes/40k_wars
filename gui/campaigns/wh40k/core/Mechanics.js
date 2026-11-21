/**
 * Mecânicas da v0.6, como métodos de WH40KGame (este arquivo carrega depois
 * de Game.js):
 *
 *  - Recurso especial de cada facção (factions.json: special): biomassa,
 *    favor dos deuses, fé, glória... Ganho pelas ações que a facção preza
 *    (gainSpecial) e gasto em rituais (ritual) sobre um exército ou a facção.
 *  - Ascensão a Príncipe-Demônio (ritual "ascend" das legiões do Caos): o
 *    general fica muito mais forte, ou vira uma Cria do Caos.
 *  - Generais com experiência, níveis, traços e relíquias (progression.json).
 *  - Diplomacia: tréguas entre facções com pactos compatíveis
 *    (factions.json: pact) e traição.
 *  - Eventos de campanha (core/Events.js) e estatísticas por turno.
 */
const WH40K_TRUCE_TURNS = 10;
const WH40K_GRUDGE_TURNS = 12;
const WH40K_ASCEND_CHANCE = 0.7;
const WH40K_MAX_FORTS = 3;

Object.assign(WH40KGame.prototype, {

	// ------------------------------------------------------------ dificuldade e estatísticas

	"incomeFactor": function(faction)
	{
		const diff = WH40K_DIFFICULTY[this.s.difficulty] || WH40K_DIFFICULTY.normal;
		return faction == this.player ? diff.playerIncome : diff.aiIncome;
	},

	"recordStats": function()
	{
		const prov = {};
		for (const f in this.s.factions)
			prov[f] = this.provincesOf(f).length;
		const last = this.s.stats[this.s.stats.length - 1];
		if (last && last.turn == this.s.turn)
			last.prov = prov;
		else
			this.s.stats.push({ "turn": this.s.turn, "prov": prov });
		if (this.s.stats.length > 300)
			this.s.stats.splice(0, this.s.stats.length - 300);
	},

	"battleStatsOf": function(faction)
	{
		return this.s.battleStats[faction] = this.s.battleStats[faction] || { "battles": 0, "wins": 0, "kills": 0, "losses": 0, "rituals": 0 };
	},

	// ------------------------------------------------------------ recurso especial

	"special": function(faction)
	{
		return this.D.factions[faction]?.special || null;
	},

	"specialAmount": function(faction)
	{
		return Math.floor(this.s.factions[faction]?.special || 0);
	},

	/** Ganho do recurso especial pela ação key (n vezes); devolve o ganho. */
	"gainSpecial": function(faction, key, n)
	{
		const sp = this.special(faction);
		const fs = this.s.factions[faction];
		if (!sp || !fs || !n)
			return 0;
		const v = sp.gain[key];
		if (typeof v != "number" || v <= 0)
			return 0;
		const before = fs.special || 0;
		fs.special = Math.min(sp.max || 300, before + v * n);
		return fs.special - before;
	},

	/** Ganhos e perdas de fim de turno (terras, praga, passar do tempo, tédio dos deuses). */
	"specialEconomy": function()
	{
		for (const f in this.s.factions)
		{
			const fs = this.s.factions[f];
			const sp = this.special(f);
			if (!fs.alive || !sp)
				continue;
			const provs = this.provincesOf(f);
			let gain = sp.gain.turn || 0;
			if (sp.gain.hold)
				for (const pid of provs)
					gain += sp.gain.hold[this.pdef(pid).terrain] || 0;
			if (sp.gain.infected)
				gain += sp.gain.infected * provs.filter(pid => this.province(pid).devastated > 0).length;
			fs.special = Math.min(sp.max || 300, (fs.special || 0) + gain);
			if (sp.gain.decay && fs.battleTurn != this.s.turn && fs.special > 0)
				fs.special = Math.max(0, fs.special * (1 - sp.gain.decay));
		}
	},

	"ritualDef": function(faction, ritualId)
	{
		const sp = this.special(faction);
		return sp ? sp.rituals.find(r => r.id == ritualId) || null : null;
	},

	/** Pode fazer o ritual (no exército armyId, se o alvo é um exército)? "" ou o motivo. */
	"canRitual": function(faction, ritualId, armyId)
	{
		const r = this.ritualDef(faction, ritualId);
		const fs = this.s.factions[faction];
		if (!r || !fs)
			return "Ritual desconhecido.";
		if ((fs.special || 0) < r.cost)
			return "Faltam " + Math.ceil(r.cost - (fs.special || 0)) + " de " + this.special(faction).name + ".";
		const e = r.effect;
		if (r.target == "faction")
			return (fs.ritualTurns || {})[r.id] == this.s.turn ? "Já feito neste turno." : "";
		const army = this.s.armies[armyId];
		if (!army || army.faction != faction)
			return "Escolha um exército seu.";
		if (army.ritualTurn == this.s.turn)
			return "Este exército já recebeu um ritual neste turno.";
		const prov = army.province ? this.province(army.province) : null;
		switch (e.type)
		{
		case "spawn":
			if (army.battalions.length >= WH40K_MAX_BATTALIONS)
				return "O exército já tem " + WH40K_MAX_BATTALIONS + " batalhões.";
			break;
		case "heal":
			if (!army.battalions.some(b => b.strength < 0.99) && !e.defense)
				return "O exército não tem perdas.";
			break;
		case "xp":
			if (!army.battalions.length)
				return "O exército não tem batalhões.";
			break;
		case "moves":
			if (!army.province)
				return "O exército precisa estar numa província.";
			break;
		case "fort":
		case "restore":
			if (!prov || prov.owner != faction)
				return "O exército precisa estar numa província sua.";
			if (e.type == "fort" && prov.forts >= WH40K_MAX_FORTS)
				return "A província já tem o máximo de fortificações.";
			if (e.type == "restore" && !(prov.devastated > 0) && (!e.fort || prov.forts >= WH40K_MAX_FORTS))
				return "Não há o que santificar aqui.";
			break;
		case "plague":
			if (!army.province || !this.pdef(army.province).neighbors.some(pid => this.isHostileTarget(pid, faction)))
				return "Não há inimigos nas províncias vizinhas.";
			break;
		case "convert":
			if (!army.province || !this.convertTarget(army))
				return "Nenhuma província neutra vizinha com guarnição pequena.";
			break;
		case "ascend":
			if (!army.general)
				return "O exército precisa de um general.";
			if (this.s.generals[army.general].ascended)
				return "O general já é um Príncipe-Demônio.";
			break;
		}
		if (e.moves && !army.province)
			return "O exército precisa estar numa província.";
		return "";
	},

	/** Faz o ritual; devolve { error } ou { text }. */
	"ritual": function(faction, ritualId, armyId)
	{
		const why = this.canRitual(faction, ritualId, armyId);
		if (why)
			return { "error": why };
		const r = this.ritualDef(faction, ritualId);
		const fs = this.s.factions[faction];
		const e = r.effect;
		const army = this.s.armies[armyId];
		const name = this.D.factionName(faction);
		fs.special -= r.cost;
		++this.battleStatsOf(faction).rituals;
		if (army)
			army.ritualTurn = this.s.turn;
		else
			(fs.ritualTurns = fs.ritualTurns || {})[r.id] = this.s.turn;
		const where = army ? this.armyLabel(army) : "";
		let text = "";
		switch (e.type)
		{
		case "spawn":
		{
			let n = 0;
			for (let i = 0; i < (e.count || 1) && army.battalions.length < WH40K_MAX_BATTALIONS; ++i, ++n)
				army.battalions.push(this.newBattalion(e.unit, faction));
			text = r.name + ": " + n + "× " + this.D.unitById[e.unit].name + " para " + where + ".";
			if (army.province)
				this.event("landing", army.province, faction);
			break;
		}
		case "heal":
			for (const b of army.battalions)
				b.strength = Math.min(1, b.strength + (e.amount || 1));
			if (e.defense)
				this.addBuff(army, { "name": r.name, "defense": e.defense, "turns": e.turns || 2 });
			text = r.name + ": " + where + " repõe as perdas.";
			break;
		case "xp":
			for (const b of army.battalions)
				b.xp = (b.xp || 0) + (e.amount || 1);
			text = r.name + ": os batalhões de " + where + " ganham experiência.";
			break;
		case "buff":
			this.addBuff(army, { "name": e.name || r.name, "attack": e.attack || 0, "defense": e.defense || 0, "turns": e.turns || 2 });
			text = r.name + ": " + where + " — " + this.buffText(e) + " por " + (e.turns || 2) + " turno(s).";
			break;
		case "moves":
			army.moves += e.amount || 1;
			text = r.name + ": " + where + " pode marchar mais " + (e.amount || 1) + " vez(es) neste turno.";
			break;
		case "funds":
			fs.funds += e.amount || 0;
			text = r.name + ": +" + e.amount + " " + this.D.factions[faction].currencyShort + ".";
			break;
		case "fort":
			this.province(army.province).forts = Math.min(WH40K_MAX_FORTS, this.province(army.province).forts + 1);
			text = r.name + ": " + this.pdef(army.province).name + " ganha uma fortificação.";
			break;
		case "restore":
		{
			const prov = this.province(army.province);
			prov.devastated = 0;
			if (e.fort)
				prov.forts = Math.min(WH40K_MAX_FORTS, prov.forts + 1);
			text = r.name + ": " + this.pdef(army.province).name + " é santificada.";
			break;
		}
		case "plague":
			text = r.name + ": " + this.plague(army, e);
			break;
		case "convert":
		{
			const pid = this.convertTarget(army);
			const prov = this.province(pid);
			prov.owner = faction;
			prov.garrison = [];
			prov.capturedTurn = this.s.turn;
			this.event("capture", pid, faction);
			text = r.name + ": " + this.pdef(pid).name + " se junta a " + name + " sem disparar um tiro.";
			break;
		}
		case "ascend":
			text = this.ascend(army, e.god);
			break;
		}
		if (e.moves && army)
			army.moves += e.moves;
		this.log(name + " — " + text, "ritual", faction);
		return { "text": text };
	},

	"armyLabel": function(army)
	{
		const g = this.general(army);
		return g ? "o exército de " + g.name : "o exército em " + (army.province ? this.pdef(army.province).name : "órbita");
	},

	"buffText": function(b)
	{
		const pct = v => (v > 0 ? "+" : "") + Math.round(v * 100) + "%";
		const parts = [];
		if (b.attack)
			parts.push(pct(b.attack) + " no ataque");
		if (b.defense)
			parts.push(pct(b.defense) + " na defesa");
		return parts.join(", ");
	},

	"addBuff": function(army, buff)
	{
		army.buffs = (army.buffs || []).filter(b => b.name != buff.name);
		army.buffs.push(buff);
	},

	"buffBonus": function(army, kind)
	{
		return (army.buffs || []).reduce((sum, b) => sum + (b[kind] || 0), 0);
	},

	"tickBuffs": function()
	{
		for (const army of Object.values(this.s.armies))
			if (army.buffs)
				army.buffs = army.buffs.filter(b => --b.turns > 0);
	},

	/** Ritual de dano às províncias vizinhas (barragem, praga, purificação). */
	"plague": function(army, e)
	{
		const hit = [];
		for (const pid of this.pdef(army.province).neighbors)
		{
			if (!this.isHostileTarget(pid, army.faction))
				continue;
			const prov = this.province(pid);
			for (const b of prov.garrison)
				b.strength = Math.max(0.1, b.strength * (1 - e.damage));
			for (const a of this.hostileArmiesAt(pid, army.faction))
				for (const b of a.battalions)
					b.strength = Math.max(0.1, b.strength * (1 - e.damage * 0.7));
			if (e.devastate)
				prov.devastated = Math.max(prov.devastated || 0, 2);
			this.event(e.devastate ? "sack" : "orbital", pid, army.faction);
			hit.push(this.pdef(pid).name);
		}
		return (e.name || "o ataque") + " atinge " + hit.join(", ") + ".";
	},

	"convertTarget": function(army)
	{
		if (!army.province)
			return null;
		const options = this.pdef(army.province).neighbors.filter(pid => {
			const prov = this.province(pid);
			return !prov.owner && prov.garrison.length <= 2 && !this.hostileArmiesAt(pid, army.faction).length;
		});
		options.sort((a, b) => (this.pdef(b).hive || 0) - (this.pdef(a).hive || 0));
		return options[0] || null;
	},

	/** Ascensão a Príncipe-Demônio: 70% de chance; senão, o general vira Cria do Caos. */
	"ascend": function(army, god)
	{
		const gid = army.general;
		const gs = this.s.generals[gid];
		const def = this.D.generals[gid];
		if (Math.random() < WH40K_ASCEND_CHANCE)
		{
			gs.ascended = god;
			this.event("orbital", army.province || this.D.scenario.objective.body, army.faction);
			return def.name + " ascende! Agora é um Príncipe-Demônio de " + god + ".";
		}
		gs.state = "spawn";
		army.general = null;
		const spawn = this.D.unitsOf(army.faction).find(u => u.noRecruit);
		if (spawn)
		{
			if (army.battalions.length >= WH40K_MAX_BATTALIONS)
				army.battalions.sort((a, b) => b.strength - a.strength).pop();
			const bat = this.newBattalion(spawn.id, army.faction);
			bat.leader = "o que restou de " + def.name;
			army.battalions.push(bat);
		}
		return "Os deuses rejeitam " + def.name + ": o corpo se retorce até virar uma Cria do Caos!";
	},

	// ------------------------------------------------------------ generais

	"generalLevel": function(gid)
	{
		const xp = this.s.generals[gid]?.xp || 0;
		const levels = this.D.progression.levels;
		let lvl = 0;
		for (let i = 1; i < levels.length; ++i)
			if (xp >= levels[i])
				lvl = i;
		return lvl;
	},

	/** General com os bônus de nível, traços, relíquias e ascensão. */
	"generalStats": function(gid)
	{
		const def = this.D.generals[gid];
		if (!def)
			return null;
		const gs = this.s.generals[gid] || {};
		const st = Object.assign({}, def);
		const level = this.generalLevel(gid);
		st.level = level;
		st.xp = gs.xp || 0;
		st.attack = (def.attack || 0) + 0.03 * level;
		st.defense = (def.defense || 0) + 0.03 * level;
		st.move = def.move || 0;
		st.support = def.support || 0;
		st.traitList = [];
		st.relicList = [];
		const add = b => {
			st.attack += b.attack || 0;
			st.defense += b.defense || 0;
			st.move += b.move || 0;
			st.support += b.support || 0;
		};
		for (const t of gs.traits || [])
		{
			const data = this.D.progression.traits[t.id];
			if (data)
			{
				add(data);
				st.traitList.push({ "name": t.name, "desc": data.desc });
			}
		}
		for (const rid of gs.relics || [])
		{
			const relic = this.D.relicById[rid];
			if (relic)
			{
				add(relic);
				st.relicList.push(relic);
			}
		}
		if (gs.ascended)
		{
			add({ "attack": 0.2, "defense": 0.15, "support": 1 });
			st.ascended = gs.ascended;
			st.title = "Príncipe-Demônio";
		}
		return st;
	},

	/** Experiência e traços do general depois de uma batalha; devolve as linhas do relatório. */
	"progressGeneral": function(gid, info)
	{
		const gs = this.s.generals[gid];
		const def = this.D.generals[gid];
		if (!gs || !def || gs.state == "spawn")
			return [];
		const lines = [];
		const before = this.generalLevel(gid);
		gs.xp = (gs.xp || 0) + 1 + (info.win ? 1 : 0) + (info.generalKill ? 2 : 0);
		const st = gs.stats = gs.stats || {};
		const inc = (k, n = 1) => st[k] = (st[k] || 0) + n;
		if (info.win)
		{
			if (info.enemyVehicles >= 3)
				inc("vehicles");
			if (info.role == "defender")
				inc("defenseWins");
			if (info.landing)
				inc("landingWins");
			if (info.vsChaos && !info.isChaos)
				inc("chaosWins");
			if (info.isChaos)
				inc("chaosGeneralWins");
		}
		if (info.generalKill)
			inc("generalKills");
		if (info.hive)
			inc("hives");
		st.bodyBattles = st.bodyBattles || {};
		st.bodyBattles[info.body] = (st.bodyBattles[info.body] || 0) + 1;
		const after = this.generalLevel(gid);
		if (after > before)
			lines.push(def.name + " sobe para o nível " + after + " (+3% no ataque e na defesa).");
		gs.traits = gs.traits || [];
		for (const id in this.D.progression.traits)
		{
			const t = this.D.progression.traits[id];
			if (gs.traits.some(x => x.id == id))
				continue;
			let ok;
			let name = t.name;
			if (t.when == "bodyBattles")
			{
				ok = (st.bodyBattles[info.body] || 0) >= t.count;
				name = name.replace("{body}", this.D.bodies[info.body]?.name || "");
			}
			else
				ok = (st[t.when] || 0) >= t.count;
			if (t.when == "chaosGeneralWins")
				name = name.replace("{god}", WH40K_FACTION_GOD[def.faction] || "Caos");
			if (ok)
			{
				gs.traits.push({ "id": id, "name": name });
				lines.push(def.name + " ganha o traço " + colorize(name) + ": " + t.desc);
			}
		}
		return lines;
	},

	/** Generais próprios numa província com relíquia ainda livre a reclamam. */
	"claimRelics": function()
	{
		for (const pid in this.D.relics)
		{
			const relic = this.D.relics[pid];
			if (this.s.relics[relic.id] || !this.province(pid))
				continue;
			const owner = this.province(pid).owner;
			const army = this.armiesAt(pid).find(a => a.general && a.faction == owner && this.s.generals[a.general]);
			if (!army)
				continue;
			const gs = this.s.generals[army.general];
			gs.relics = gs.relics || [];
			gs.relics.push(relic.id);
			this.s.relics[relic.id] = army.general;
			this.log(this.D.generals[army.general].name + " (" + this.D.factionName(owner) + ") reclama a relíquia " + relic.name + " em " + this.pdef(pid).name + ": " + relic.desc, "relic", owner);
		}
	},

	// ------------------------------------------------------------ depois da batalha

	/** Recursos especiais, estatísticas e experiência dos generais; devolve linhas do relatório. */
	"afterBattle": function(battle, sides, result, losses, conquered)
	{
		const lines = [];
		const fallen = result.fallen || {};
		for (const role of ["attacker", "defender"])
		{
			const other = role == "attacker" ? "defender" : "attacker";
			const f = battle[role].faction;
			if (!f || !this.s.factions[f])
				continue;
			const win = result.winner == role;
			const fs = this.s.factions[f];
			fs.battleTurn = this.s.turn;
			const bs = this.battleStatsOf(f);
			++bs.battles;
			bs.wins += win ? 1 : 0;
			bs.kills += Math.round(losses[other]);
			bs.losses += Math.round(losses[role]);
			let gain = this.gainSpecial(f, "kill", losses[other]) + this.gainSpecial(f, "battle", 1) + this.gainSpecial(f, "sacrifice", losses[role]);
			if (win)
			{
				gain += this.gainSpecial(f, "win", 1);
				if (sides[role].power >= 2 * Math.max(1, sides[other].power))
					gain += this.gainSpecial(f, "lopsided", 1);
			}
			if (fallen[other])
				gain += this.gainSpecial(f, "generalKill", 1);
			if (result.powers && result.powers[role])
				gain += this.gainSpecial(f, "power", result.powers[role]);
			if (f == this.player && gain >= 1)
				lines.push(this.special(f).name + ": +" + Math.round(gain) + ".");
			const g = sides[role].general;
			if (g)
			{
				const enemyFaction = battle[other].faction;
				const enemyVehicles = sides[other].entries.filter(e => this.unit(e.bat)?.category != "infantry").length;
				const progress = this.progressGeneral(g.id, {
					"role": role, "win": win, "generalKill": !!fallen[other], "enemyVehicles": enemyVehicles,
					"landing": battle.kind == "landing" && role == "attacker",
					"hive": win && conquered && role == "attacker" && this.pdef(battle.province).hive == 2,
					"body": this.pdef(battle.province).body,
					"vsChaos": this.D.factions[enemyFaction]?.pact?.group == "chaos",
					"isChaos": this.D.factions[f]?.pact?.group == "chaos"
				});
				if (f == this.player)
					lines.push(...progress);
			}
		}
		if (conquered)
			this.claimRelics();
		return lines;
	},

	// ------------------------------------------------------------ diplomacia

	"truceKey": function(a, b)
	{
		return [a, b].sort().join("|");
	},

	"inTruce": function(a, b)
	{
		if (!a || !b || a == b || !this.s.truces)
			return false;
		const t = this.s.truces[this.truceKey(a, b)];
		return !!t && t.until >= this.s.turn;
	},

	"truceWith": function(faction)
	{
		return Object.keys(this.s.factions).filter(f => f != faction && this.inTruce(f, faction));
	},

	/** Podem fazer trégua? "" ou o motivo. */
	"canTruce": function(a, b)
	{
		if (a == b || this.D.allied(a, b))
			return "São aliados.";
		if (!this.s.factions[a]?.alive || !this.s.factions[b]?.alive)
			return "Facção fora da guerra.";
		if (this.inTruce(a, b))
			return "Já estão em trégua.";
		const pa = this.D.factions[a].pact || {};
		const pb = this.D.factions[b].pact || {};
		if (!(pa.with || []).includes(pb.group))
			return pa.never || this.D.factionName(a) + " não trata com " + this.D.factionName(b) + ".";
		if (!(pb.with || []).includes(pa.group))
			return pb.never || this.D.factionName(b) + " não trata com " + this.D.factionName(a) + ".";
		const grudge = this.s.grudges[this.truceKey(a, b)];
		if (grudge && grudge > this.s.turn)
			return "A traição ainda é recente (até o turno " + grudge + ").";
		return "";
	},

	"factionPower": function(faction)
	{
		return this.armiesOf(faction).reduce((sum, a) => sum + this.armyPower(a, "attack"), 0) + this.provincesOf(faction).length * 8;
	},

	/** Chance de judge aceitar a trégua proposta por proposer. */
	"truceChance": function(judge, proposer)
	{
		let chance = 0.4;
		const pj = this.factionPower(judge);
		const pp = this.factionPower(proposer);
		if (pj < pp)
			chance += 0.2;
		// Um inimigo comum mais forte que os dois une as facções.
		const common = Object.keys(this.s.factions).some(c => this.s.factions[c].alive && this.hostile(c, judge) && this.hostile(c, proposer) &&
			this.factionPower(c) > Math.max(pj, pp));
		if (common)
			chance += 0.2;
		chance -= 0.15 * (this.s.factions[proposer].treachery || 0);
		return Math.max(0.05, Math.min(0.9, chance));
	},

	"makeTruce": function(a, b, turns)
	{
		this.s.truces[this.truceKey(a, b)] = { "since": this.s.turn, "until": this.s.turn + (turns || WH40K_TRUCE_TURNS) };
		this.log("Trégua entre " + this.D.factionName(a) + " e " + this.D.factionName(b) + " até o turno " + (this.s.turn + (turns || WH40K_TRUCE_TURNS)) + ".", "diplomacy", a);
	},

	/**
	 * from propõe trégua a to. IA decide na hora; o jogador recebe a proposta
	 * em s.pendingChoices. Devolve { error } | { accepted } | { pending }.
	 */
	"proposeTruce": function(from, to)
	{
		const why = this.canTruce(from, to);
		if (why)
			return { "error": why };
		if (!this.s.factions[to].ai)
		{
			if (!this.s.pendingChoices.some(c => c.kind == "truce" && c.from == from))
				this.s.pendingChoices.push({ "kind": "truce", "from": from, "to": to, "turn": this.s.turn });
			return { "pending": true };
		}
		const fs = this.s.factions[from];
		fs.proposals = fs.proposals || {};
		if (fs.proposals[to] == this.s.turn)
			return { "error": "Já propôs neste turno." };
		fs.proposals[to] = this.s.turn;
		const accepted = Math.random() < this.truceChance(to, from);
		if (accepted)
			this.makeTruce(from, to);
		else if (from == this.player)
			this.log(this.D.factionName(to) + " recusa a trégua.", "diplomacy", from);
		return { "accepted": accepted };
	},

	/** Traição: a trégua acaba e os exércitos do traidor ganham +20% no ataque neste turno. */
	"betray": function(traitor, victim)
	{
		if (!this.inTruce(traitor, victim))
			return "Não há trégua para trair.";
		delete this.s.truces[this.truceKey(traitor, victim)];
		this.s.grudges[this.truceKey(traitor, victim)] = this.s.turn + WH40K_GRUDGE_TURNS;
		this.s.factions[traitor].treachery = (this.s.factions[traitor].treachery || 0) + 1;
		for (const army of this.armiesOf(traitor))
			this.addBuff(army, { "name": "Traição", "attack": 0.2, "turns": 1 });
		this.log(this.D.factionName(traitor) + " TRAI " + this.D.factionName(victim) + "! A trégua acabou com uma faca nas costas.", "warning", traitor);
		return "";
	},

	"tickDiplomacy": function()
	{
		for (const key in this.s.truces)
			if (this.s.truces[key].until <= this.s.turn)
			{
				const [a, b] = key.split("|");
				delete this.s.truces[key];
				this.log("A trégua entre " + this.D.factionName(a) + " e " + this.D.factionName(b) + " acabou.", "diplomacy", a);
			}
		for (const key in this.s.storms)
			if (--this.s.storms[key] <= 0)
			{
				delete this.s.storms[key];
				this.log("A tempestade da disformidade sobre " + this.D.bodies[key].name + " se dissipa.", "info");
			}
	},

	// ------------------------------------------------------------ eventos e escolhas

	/** Sorteia os eventos do turno (core/Events.js): o jogador decide, a IA escolhe sozinha. */
	"rollEvents": function(reports)
	{
		if (typeof WH40K_EVENTS == "undefined" || this.s.gameOver)
			return;
		for (const f in this.s.factions)
		{
			const fs = this.s.factions[f];
			if (!fs.alive || Math.random() > (fs.ai ? 0.12 : 0.3))
				continue;
			const options = WH40K_EVENTS.filter(ev => (!ev.factions || ev.factions(this, f)) && (fs.eventTurns?.[ev.id] || -99) < this.s.turn - (ev.cooldown || 6));
			const ev = weightedPick(options, ev => ev.weight || 1);
			if (!ev)
				continue;
			const ctx = ev.when(this, f);
			if (!ctx)
				continue;
			(fs.eventTurns = fs.eventTurns || {})[ev.id] = this.s.turn;
			if (fs.ai)
				this.applyEventChoice(ev, f, ctx, ev.ai ? ev.ai(this, f, ctx) : 0);
			else
				this.s.pendingChoices.push({ "kind": "event", "event": ev.id, "faction": f, "ctx": ctx, "turn": this.s.turn });
		}
	},

	"applyEventChoice": function(ev, faction, ctx, index)
	{
		const choices = ev.choices(this, faction, ctx);
		const choice = choices[Math.max(0, Math.min(choices.length - 1, index))];
		const why = choice.can ? choice.can(this, faction, ctx) : "";
		if (why)
			return why;
		const text = choice.apply(this, faction, ctx) || "";
		if (text)
			this.log(this.D.factionName(faction) + " — " + ev.title(this, faction, ctx) + ": " + text, "event", faction);
		return "";
	},

	/** Descrição da próxima escolha pendente do jogador (para a janela). */
	"choiceView": function(choice)
	{
		if (choice.kind == "truce")
		{
			const f = this.D.factions[choice.from];
			return {
				"title": "Proposta de trégua",
				"text": wh40kColor(f.name, f.color) + " propõe uma trégua de " + WH40K_TRUCE_TURNS + " turnos: nenhum dos dois ataca o outro, e os exércitos podem passar pelas terras um do outro sem tomá-las.\n\n" +
					"Uma trégua pode ser traída a qualquer momento — com +20% no ataque naquele turno para o traidor, mas ninguém mais confia nele por um bom tempo." +
					(this.s.factions[choice.from].treachery ? "\n\n" + wh40kColor("Atenção: " + f.name + " já traiu " + this.s.factions[choice.from].treachery + " vez(es).", [240, 140, 90]) : ""),
				"portrait": f.portrait,
				"options": [{ "caption": "Aceitar" }, { "caption": "Recusar" }]
			};
		}
		const ev = WH40K_EVENTS.find(e => e.id == choice.event);
		if (!ev)
			return null;
		return {
			"title": ev.title(this, choice.faction, choice.ctx),
			"text": ev.text(this, choice.faction, choice.ctx),
			"portrait": ev.portrait ? ev.portrait(this, choice.faction, choice.ctx) : this.D.factions[choice.faction].portrait,
			"options": ev.choices(this, choice.faction, choice.ctx).map(c => ({ "caption": c.caption, "tooltip": c.tooltip || "", "why": c.can ? c.can(this, choice.faction, choice.ctx) : "" }))
		};
	},

	/** Resolve a escolha pendente; devolve o texto do resultado (ou o motivo de não poder). */
	"resolveChoice": function(choice, index)
	{
		const i = this.s.pendingChoices.indexOf(choice);
		if (i != -1)
			this.s.pendingChoices.splice(i, 1);
		if (choice.kind == "truce")
		{
			if (index == 0 && !this.canTruce(choice.from, choice.to))
			{
				this.makeTruce(choice.from, choice.to);
				return "Trégua aceita.";
			}
			this.log("Você recusa a trégua de " + this.D.factionName(choice.from) + ".", "diplomacy", choice.to);
			return "Trégua recusada.";
		}
		const ev = WH40K_EVENTS.find(e => e.id == choice.event);
		if (!ev)
			return "";
		const why = this.applyEventChoice(ev, choice.faction, choice.ctx, index);
		if (why)
		{
			this.s.pendingChoices.splice(i == -1 ? 0 : i, 0, choice);
			return why;
		}
		return "";
	}
});

/** Deus de cada legião (traços e ascensão). */
const WH40K_FACTION_GOD = { "chaos": "Caos Indiviso", "world_eaters": "Khorne", "death_guard": "Nurgle", "thousand_sons": "Tzeentch", "emperors_children": "Slaanesh" };

function wh40kColor(text, rgb)
{
	return typeof colored == "function" ? colored(text, rgb) : text;
}

function colorize(text)
{
	return wh40kColor(text, [235, 205, 125]);
}

function weightedPick(list, weight)
{
	const total = list.reduce((s, x) => s + weight(x), 0);
	let r = Math.random() * total;
	for (const x of list)
		if ((r -= weight(x)) <= 0)
			return x;
	return list[list.length - 1] || null;
}
