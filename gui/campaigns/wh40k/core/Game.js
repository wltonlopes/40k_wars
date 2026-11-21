/**
 * Regras da campanha 40k Wars. O estado (this.s) é JSON puro e vai inteiro
 * para o save da campanha (run.data.state).
 *
 *   factions[f]   { funds, ai, alive }
 *   provinces[p]  { owner, garrison: [batalhão], forts, devastated (turnos), capturedTurn }
 *   armies[a]     { id, faction, general, province | null, fleet | null, battalions, moves }
 *   fleets[f]     { id, faction, name, ships, body | null, dest, eta, from, cargo: [exército] }
 *   batalhão      { id, unit, strength (0..1), xp, leader }
 *   generals[g]   { state: available | hired | wounded, turns }
 *   pendingBattles  batalhas que esperam a decisão do jogador (atacado pela IA)
 *   events        [{ id, turn, kind, pid | body, faction }] ações de peso dos
 *                 últimos turnos (orbital, sack, battle, capture, landing,
 *                 space): a interface toca os efeitos (ui/Fx.js)
 *
 * Batalha: { id, province, kind (assault | landing), attacker: {faction, armies},
 *            defender: {faction, armies, garrison} }.
 */
const WH40K_MAX_BATTALIONS = 10;
const WH40K_FLEET_CAPACITY = 1;
const WH40K_SHIP_COST = 250;
const WH40K_HEAL_PER_TURN = 0.15;
const WH40K_WOUND_TURNS = 4;
const WH40K_LANDING_PENALTY = 0.15;
const WH40K_SACK_TURNS = 4;
const WH40K_DEVASTATED_INCOME = 0.25;

class WH40KGame
{
	constructor(state)
	{
		this.D = WH40KData.load(state.scenario || "armageddon");
		this.s = state;
		this.s.events = this.s.events || [];
		// Saves antigos (versão com a batalha 3D): a partida em andamento é resolvida automaticamente.
		this.s.activeBattle = null;
	}

	// ------------------------------------------------------------ novo jogo

	static newState(playerFaction, scenarioId)
	{
		const D = WH40KData.load(scenarioId || "armageddon");
		const s = {
			"version": 2,
			"scenario": D.scenario.id,
			"turn": 1,
			"playerFaction": playerFaction,
			"nextId": 1,
			"factions": {},
			"provinces": {},
			"armies": {},
			"fleets": {},
			"generals": {},
			"log": [],
			"pendingBattles": [],
			"events": [],
			"activeBattle": null,
			"gameOver": null
		};
		const game = new WH40KGame(s);
		for (const f of D.scenarioFactions())
			s.factions[f] = { "funds": D.factions[f].startingFunds, "ai": f != playerFaction, "alive": true };
		for (const g in D.generals)
			s.generals[g] = { "state": D.factions[D.generals[g].faction]?.enabled ? "available" : "unavailable", "turns": 0 };
		for (const pid in D.provinces)
		{
			const def = D.provinces[pid];
			const owner = def.owner && s.factions[def.owner] ? def.owner : null;
			const civFaction = owner || D.bodies[def.body].neutralCiv || D.scenario.factions[0];
			s.provinces[pid] = {
				"owner": owner,
				"forts": def.forts || 0,
				"garrison": (def.garrison || []).filter(u => D.unitById[u]).map(u => game.newBattalion(owner ? u : game.neutralUnit(u, civFaction), owner || civFaction))
			};
		}
		for (const start of D.sector.startingArmies)
		{
			if (!s.factions[start.faction])
				continue;
			const army = game.createArmy(start.faction, start.general, start.province);
			for (const u of start.battalions)
				army.battalions.push(game.newBattalion(u, start.faction));
		}
		for (const start of D.sector.startingFleets)
			if (s.factions[start.faction])
				game.createFleet(start.faction, start.body, start.ships);
		game.log(D.scenario.name + " — " + D.sector.system.name + ". " + D.factionName(playerFaction) + ": que comece a guerra!", "info");
		return s;
	}

	/** Unidade da guarnição neutra: a mesma, ou a equivalente da civ do corpo. */
	neutralUnit(unitId, civFaction)
	{
		const unit = this.D.unitById[unitId];
		if (unit && unit.faction == civFaction)
			return unitId;
		const list = this.D.unitsOf(civFaction);
		return (list.find(u => u.category == (unit && unit.category)) || list[0] || unit).id;
	}

	nextId(prefix)
	{
		return prefix + (this.s.nextId++);
	}

	log(text, kind = "info", faction)
	{
		this.s.log.push({ "turn": this.s.turn, "text": text, "kind": kind, "faction": faction });
		if (this.s.log.length > 200)
			this.s.log.splice(0, this.s.log.length - 200);
	}

	/** Ação de peso para a interface tocar o efeito (s.events). */
	event(kind, where, faction)
	{
		const ev = { "id": this.nextId("ev"), "turn": this.s.turn, "kind": kind, "faction": faction };
		if (this.D.provinces[where])
		{
			ev.pid = where;
			ev.body = this.D.provinces[where].body;
		}
		else
			ev.body = where;
		this.s.events.push(ev);
		if (this.s.events.length > 120)
			this.s.events.splice(0, this.s.events.length - 120);
		return ev;
	}

	newBattalion(unitId, faction)
	{
		const fdata = this.D.factions[faction] || this.D.factions.imperial;
		const unit = this.D.unitById[unitId];
		// Forças aliadas (Astartes, Sororitas...) têm os seus próprios títulos e nomes.
		const group = unit && unit.group && fdata.allies && fdata.allies[unit.group];
		const title = pickFrom(unit?.leaderTitles || group?.leaderTitles || fdata.leaderTitles);
		const name = pickFrom(group?.leaderNames || fdata.leaderNames);
		return { "id": this.nextId("b"), "unit": unitId, "strength": 1, "xp": 0, "leader": title + " " + name };
	}

	createArmy(faction, generalId, provinceId)
	{
		const army = { "id": this.nextId("a"), "faction": faction, "general": generalId, "province": provinceId, "fleet": null, "battalions": [], "moves": 0 };
		this.s.armies[army.id] = army;
		if (generalId && this.s.generals[generalId])
			this.s.generals[generalId].state = "hired";
		army.moves = this.maxMoves(army);
		return army;
	}

	createFleet(faction, body, ships)
	{
		const names = this.D.factions[faction].shipNames;
		const used = Object.values(this.s.fleets).filter(f => f.faction == faction).length;
		const fleet = { "id": this.nextId("f"), "faction": faction, "name": names[used % names.length], "ships": ships, "body": body, "dest": null, "eta": 0, "from": null, "cargo": [], "acted": 0 };
		this.s.fleets[fleet.id] = fleet;
		return fleet;
	}

	// ------------------------------------------------------------ consultas

	get player()
	{
		return this.s.playerFaction;
	}

	province(pid)
	{
		return this.s.provinces[pid];
	}

	pdef(pid)
	{
		return this.D.provinces[pid];
	}

	unit(bat)
	{
		return this.D.unitById[bat.unit];
	}

	general(army)
	{
		return army && army.general ? this.D.generals[army.general] : null;
	}

	hostile(a, b)
	{
		return a != b && !this.D.allied(a, b);
	}

	armiesAt(pid, faction)
	{
		return Object.values(this.s.armies).filter(a => a.province == pid && (!faction || a.faction == faction));
	}

	hostileArmiesAt(pid, faction)
	{
		return Object.values(this.s.armies).filter(a => a.province == pid && this.hostile(a.faction, faction));
	}

	fleetsAt(body, faction)
	{
		return Object.values(this.s.fleets).filter(f => f.body == body && (!faction || f.faction == faction));
	}

	armiesOf(faction)
	{
		return Object.values(this.s.armies).filter(a => a.faction == faction);
	}

	provincesOf(faction)
	{
		return Object.keys(this.s.provinces).filter(p => this.s.provinces[p].owner == faction);
	}

	/** Frota própria em órbita e nenhuma inimiga: desembarque e apoio orbital. */
	orbitalControl(body, faction)
	{
		const fleets = this.fleetsAt(body);
		return fleets.some(f => f.faction == faction) && !fleets.some(f => this.hostile(f.faction, faction));
	}

	hostileFleetAt(body, faction)
	{
		return this.fleetsAt(body).some(f => this.hostile(f.faction, faction));
	}

	maxMoves(army)
	{
		return 1 + (this.general(army)?.move || 0);
	}

	level(bat)
	{
		return Math.min(3, Math.floor((bat.xp || 0) / 2));
	}

	batPower(bat)
	{
		const unit = this.unit(bat);
		return unit ? unit.power * bat.strength * (1 + 0.1 * this.level(bat)) : 0;
	}

	armyPower(army, role)
	{
		const base = army.battalions.reduce((sum, bat) => sum + this.batPower(bat), 0);
		const general = this.general(army);
		let bonus = general ? (role == "attack" ? general.attack : general.defense) || 0 : 0;
		if (role == "attack")
			bonus += this.D.factions[army.faction]?.attackBonus || 0;
		if (general)
			bonus += 0.05;
		return base * (1 + bonus) + (general ? 4 : 0);
	}

	garrisonPower(pid)
	{
		return this.province(pid).garrison.reduce((sum, bat) => sum + this.batPower(bat), 0);
	}

	/** Força de defesa de uma província contra a facção atacante. */
	defensePower(pid, attackerFaction)
	{
		const prov = this.province(pid);
		const def = this.pdef(pid);
		let power = 0;
		const defender = prov.owner;
		if (this.hostile(defender, attackerFaction))
			power += this.garrisonPower(pid);
		for (const army of this.hostileArmiesAt(pid, attackerFaction))
			power += this.armyPower(army, "defense");
		const mult = 1 + 0.15 * prov.forts + (def.hive == 2 ? 0.1 : 0) + (def.terrain == "mountains" ? 0.1 : 0);
		return power * mult;
	}

	maxGarrison(pid)
	{
		return 2 + this.province(pid).forts + (this.pdef(pid).hive || 0);
	}

	provinceIncome(pid)
	{
		const def = this.pdef(pid);
		let income = WH40K_TERRAIN_INCOME[def.terrain] || 15;
		income += (def.hive || 0) * 20 + (def.shipyard ? 15 : 0);
		if (this.province(pid).devastated > 0)
			income *= WH40K_DEVASTATED_INCOME;
		return Math.round(income * (this.D.factions[this.province(pid).owner]?.incomeMult || 1));
	}

	upkeepOf(bat, garrison)
	{
		const unit = this.unit(bat);
		return unit ? Math.round(unit.upkeep * (garrison ? 0.5 : 1)) : 0;
	}

	income(faction)
	{
		return this.provincesOf(faction).reduce((sum, pid) => sum + this.provinceIncome(pid), 0);
	}

	upkeep(faction)
	{
		let total = 0;
		for (const army of this.armiesOf(faction))
		{
			const mult = 1 + (this.general(army)?.upkeep || 0);
			total += army.battalions.reduce((sum, bat) => sum + this.upkeepOf(bat, false), 0) * mult;
			total += army.general ? 15 : 0;
		}
		for (const pid of this.provincesOf(faction))
			total += this.province(pid).garrison.reduce((sum, bat) => sum + this.upkeepOf(bat, true), 0);
		for (const fleet of Object.values(this.s.fleets))
			if (fleet.faction == faction)
				total += fleet.ships * 12;
		return Math.round(total);
	}

	/** Pode recrutar este tipo nesta província? Devolve "" ou o motivo. */
	canRecruit(faction, unitId, pid)
	{
		const unit = this.D.unitById[unitId];
		const def = this.pdef(pid);
		if (!unit || unit.faction != faction)
			return "Unidade de outra facção.";
		if (this.province(pid).owner != faction)
			return "A província não é sua.";
		if (unit.needsHive && !def.hive && !this.province(pid).forts)
			return "Exige cidade ou fortaleza.";
		const why = this.allyRequirement(faction, unit, pid);
		if (why)
			return why;
		if (this.s.factions[faction].funds < unit.cost)
			return "Recursos insuficientes.";
		return "";
	}

	/**
	 * Requisitos das forças aliadas (units.json: requires):
	 *   orbit   frota própria na órbita do corpo, sem inimigos (descem das naves)
	 *   hive    cidade-colmeia (catedrais e santuários)
	 *   forge   estaleiro ou zona industrial (forjas do Mechanicus)
	 *   unique  só um batalhão deste tipo na facção
	 */
	allyRequirement(faction, unit, pid)
	{
		const def = this.pdef(pid);
		for (const req of unit.requires || [])
		{
			if (req == "orbit" && !this.orbitalControl(def.body, faction))
				return "Exige frota própria na órbita (sem inimigos).";
			if (req == "hive" && def.hive != 2)
				return "Exige cidade-colmeia.";
			if (req == "forge" && !def.shipyard && def.terrain != "industrial")
				return "Exige estaleiro ou zona industrial (forja).";
			if (req == "unique" && this.countUnit(faction, unit.id))
				return "Só pode haver um na cruzada.";
		}
		return "";
	}

	countUnit(faction, unitId)
	{
		let n = 0;
		for (const army of this.armiesOf(faction))
			n += army.battalions.filter(b => b.unit == unitId).length;
		for (const pid of this.provincesOf(faction))
			n += this.province(pid).garrison.filter(b => b.unit == unitId).length;
		return n;
	}

	recruit(faction, unitId, target)
	{
		const unit = this.D.unitById[unitId];
		const pid = target.army ? this.s.armies[target.army].province : target.province;
		if (!pid)
			return "O exército está embarcado.";
		const reason = this.canRecruit(faction, unitId, pid);
		if (reason)
			return reason;
		if (target.army)
		{
			const army = this.s.armies[target.army];
			if (army.battalions.length >= WH40K_MAX_BATTALIONS)
				return "O exército já tem " + WH40K_MAX_BATTALIONS + " batalhões.";
			army.battalions.push(this.newBattalion(unitId, faction));
		}
		else
		{
			const prov = this.province(pid);
			if (prov.garrison.length >= this.maxGarrison(pid))
				return "A guarnição está cheia (" + this.maxGarrison(pid) + ").";
			prov.garrison.push(this.newBattalion(unitId, faction));
		}
		this.s.factions[faction].funds -= unit.cost;
		return "";
	}

	/** Move um batalhão entre o exército e a guarnição da mesma província. */
	transfer(armyId, batId, toGarrison)
	{
		const army = this.s.armies[armyId];
		if (!army || !army.province)
			return "O exército não está numa província.";
		const prov = this.province(army.province);
		if (prov.owner != army.faction)
			return "A província não é sua.";
		if (toGarrison)
		{
			const i = army.battalions.findIndex(b => b.id == batId);
			if (i == -1)
				return "Batalhão não encontrado.";
			if (prov.garrison.length >= this.maxGarrison(army.province))
				return "A guarnição está cheia.";
			prov.garrison.push(army.battalions.splice(i, 1)[0]);
		}
		else
		{
			const i = prov.garrison.findIndex(b => b.id == batId);
			if (i == -1)
				return "Batalhão não encontrado.";
			if (army.battalions.length >= WH40K_MAX_BATTALIONS)
				return "O exército está cheio.";
			army.battalions.push(prov.garrison.splice(i, 1)[0]);
		}
		return "";
	}

	hireableGenerals(faction)
	{
		return Object.keys(this.D.generals).filter(g => this.D.generals[g].faction == faction && this.s.generals[g].state == "available");
	}

	hireGeneral(faction, gid, pid)
	{
		const general = this.D.generals[gid];
		if (!general || general.faction != faction || this.s.generals[gid].state != "available")
			return "General indisponível.";
		if (this.province(pid).owner != faction)
			return "A província não é sua.";
		if (this.s.factions[faction].funds < general.hireCost)
			return "Recursos insuficientes.";
		this.s.factions[faction].funds -= general.hireCost;
		const army = this.createArmy(faction, gid, pid);
		army.moves = 0;
		this.log(general.title + " " + general.name + " assume um exército em " + this.pdef(pid).name + ".", "info", faction);
		return "";
	}

	// ------------------------------------------------------------ movimento

	/**
	 * Destinos possíveis de um exército: { pid: "move" | "attack" }.
	 */
	armyTargets(army)
	{
		const result = {};
		if (!army.province || army.moves <= 0)
			return result;
		for (const pid of this.pdef(army.province).neighbors)
			result[pid] = this.isHostileTarget(pid, army.faction) ? "attack" : "move";
		return result;
	}

	isHostileTarget(pid, faction)
	{
		const prov = this.province(pid);
		if (this.hostileArmiesAt(pid, faction).length)
			return true;
		if (this.D.allied(prov.owner, faction))
			return false;
		return !!prov.owner || prov.garrison.length > 0;
	}

	/**
	 * Move o exército. Devolve { battle } se houver luta (a batalha não é
	 * resolvida aqui), { error } ou {}.
	 */
	moveArmy(armyId, pid)
	{
		const army = this.s.armies[armyId];
		const targets = this.armyTargets(army);
		if (!targets[pid])
			return { "error": "Destino fora de alcance." };
		if (targets[pid] == "attack")
			return { "battle": this.makeBattle(pid, army.faction, [army.id], "assault") };
		army.province = pid;
		--army.moves;
		this.captureIfEmpty(pid, army.faction);
		return {};
	}

	captureIfEmpty(pid, faction)
	{
		const prov = this.province(pid);
		if (this.D.allied(prov.owner, faction) || this.isHostileTarget(pid, faction))
			return false;
		const old = prov.owner;
		prov.owner = faction;
		prov.garrison = [];
		prov.capturedTurn = this.s.turn;
		this.event("capture", pid, faction);
		this.log(this.D.factionName(faction) + " ocupa " + this.pdef(pid).name + (old ? "" : " sem resistência") + ".", "capture", faction);
		return true;
	}

	makeBattle(pid, attackerFaction, armyIds, kind)
	{
		const prov = this.province(pid);
		const defenderArmies = this.hostileArmiesAt(pid, attackerFaction);
		const defenderFaction = defenderArmies[0]?.faction || prov.owner;
		return {
			"id": this.nextId("bt"),
			"province": pid,
			"kind": kind,
			"turn": this.s.turn,
			"attacker": { "faction": attackerFaction, "armies": armyIds.slice() },
			"defender": {
				"faction": defenderFaction,
				"armies": defenderArmies.filter(a => a.faction == defenderFaction).map(a => a.id),
				"garrison": prov.owner == defenderFaction || (!prov.owner && !defenderFaction)
			}
		};
	}

	/**
	 * Refaz uma batalha guardada (pendente) com a situação atual; null se
	 * ela não faz mais sentido (atacante sumiu ou o alvo já não é inimigo).
	 */
	refreshBattle(battle)
	{
		const body = this.pdef(battle.province).body;
		const armies = battle.attacker.armies.filter(aid => {
			const army = this.s.armies[aid];
			if (!army || army.faction != battle.attacker.faction || !army.battalions.length)
				return false;
			if (battle.kind == "landing")
				return !!army.fleet && this.s.fleets[army.fleet]?.body == body;
			return !!army.province && this.pdef(army.province).neighbors.indexOf(battle.province) != -1;
		});
		if (!armies.length || !this.isHostileTarget(battle.province, battle.attacker.faction))
			return null;
		const fresh = this.makeBattle(battle.province, battle.attacker.faction, armies, battle.kind);
		fresh.id = battle.id;
		return fresh;
	}

	/** Próxima batalha pendente ainda válida (as inválidas são descartadas). */
	nextPendingBattle()
	{
		while (this.s.pendingBattles.length)
		{
			const fresh = this.refreshBattle(this.s.pendingBattles[0]);
			if (fresh)
			{
				this.s.pendingBattles[0] = fresh;
				return fresh;
			}
			this.s.pendingBattles.shift();
		}
		return null;
	}

	/** Lados de uma batalha: batalhões (com referência de origem) e força. */
	battleSides(battle)
	{
		const prov = this.province(battle.province);
		const sides = {};
		for (const role of ["attacker", "defender"])
		{
			const side = battle[role];
			const entries = [];
			let power = 0;
			let general = null;
			for (const aid of side.armies)
			{
				const army = this.s.armies[aid];
				if (!army)
					continue;
				for (const bat of army.battalions)
					entries.push({ "bat": bat, "army": aid });
				power += this.armyPower(army, role == "attacker" ? "attack" : "defense");
				general = general || (army.general ? { "id": army.general, "army": aid } : null);
			}
			if (role == "defender" && side.garrison)
			{
				for (const bat of prov.garrison)
					entries.push({ "bat": bat, "garrison": true });
				power += this.garrisonPower(battle.province);
			}
			if (role == "defender")
			{
				const def = this.pdef(battle.province);
				power *= 1 + 0.15 * prov.forts + (def.hive == 2 ? 0.1 : 0) + (def.terrain == "mountains" ? 0.1 : 0);
			}
			else if (battle.kind == "landing")
				power *= 1 - WH40K_LANDING_PENALTY;
			sides[role] = { "faction": side.faction, "entries": entries, "power": power, "general": general };
		}
		return sides;
	}

	/** Chance (0..1) de o atacante vencer na resolução automática. */
	winChance(battle)
	{
		const sides = this.battleSides(battle);
		const a = Math.pow(Math.max(0.1, sides.attacker.power), 1.6);
		const d = Math.pow(Math.max(0.1, sides.defender.power), 1.6);
		return sides.defender.entries.length ? a / (a + d) : 1;
	}

	/** Resolução automática: devolve o resultado no mesmo formato da batalha jogada. */
	autoResolve(battle)
	{
		const sides = this.battleSides(battle);
		const attackerWins = !sides.defender.entries.length || Math.random() < this.winChance(battle);
		const winner = attackerWins ? "attacker" : "defender";
		const loser = attackerWins ? "defender" : "attacker";
		const ratio = sides[loser].power / Math.max(1, sides[winner].power);
		const winLoss = Math.max(0.05, Math.min(0.6, 0.12 + 0.35 * ratio * randRange(0.7, 1.3)));
		const loseLoss = Math.max(0.35, Math.min(0.95, 0.55 + 0.3 * Math.random() - 0.15 * ratio));
		const strengths = {};
		for (const role of ["attacker", "defender"])
		{
			const loss = role == winner ? winLoss : loseLoss;
			for (const e of sides[role].entries)
				strengths[e.bat.id] = Math.max(0, e.bat.strength * (1 - loss * randRange(0.5, 1.5)));
		}
		const generalsAlive = {};
		for (const role of ["attacker", "defender"])
			if (sides[role].general)
				generalsAlive[role] = role == winner || Math.random() > 0.35;
		return { "winner": winner, "strengths": strengths, "generalsAlive": generalsAlive, "auto": true };
	}

	/**
	 * Aplica o resultado (automático ou jogado) e devolve o relatório:
	 * { title, lines[], winner, conquered }.
	 */
	applyBattle(battle, result)
	{
		const prov = this.province(battle.province);
		const def = this.pdef(battle.province);
		const sides = this.battleSides(battle);
		const lines = [];
		const losses = { "attacker": 0, "defender": 0 };
		this.event(battle.kind == "landing" ? "landing" : "battle", battle.province, battle.attacker.faction);
		for (const role of ["attacker", "defender"])
			for (const e of sides[role].entries)
			{
				const before = e.bat.strength;
				const after = result.strengths[e.bat.id] === undefined ? before : result.strengths[e.bat.id];
				losses[role] += Math.max(0, before - after) * (this.unit(e.bat)?.men || 1);
				e.bat.strength = Math.round(after * 1000) / 1000;
				if (e.bat.strength >= 0.1)
					e.bat.xp = (e.bat.xp || 0) + 1;
			}
		// Batalhões destruídos.
		for (const role of ["attacker", "defender"])
		{
			for (const aid of battle[role].armies)
				if (this.s.armies[aid])
					this.s.armies[aid].battalions = this.s.armies[aid].battalions.filter(b => b.strength >= 0.1);
		}
		prov.garrison = prov.garrison.filter(b => b.strength >= 0.1);

		const attackerName = this.D.factionName(battle.attacker.faction);
		const defenderName = this.D.factionName(battle.defender.faction);
		const title = (result.winner == "attacker" ? "Vitória de " + attackerName : "Vitória de " + defenderName) + " em " + def.name;
		lines.push(attackerName + " (atacante) perdeu cerca de " + Math.round(losses.attacker) + " homens/veículos; " + defenderName + " perdeu cerca de " + Math.round(losses.defender) + ".");

		// Generais.
		for (const role of ["attacker", "defender"])
		{
			const g = sides[role].general;
			if (!g || result.generalsAlive[role] !== false)
				continue;
			const army = this.s.armies[g.army];
			if (army)
				lines.push(this.woundGeneral(army));
		}

		let conquered = false;
		if (result.winner == "attacker")
		{
			// Defensores recuam ou se dispersam; a guarnição cai.
			for (const aid of battle.defender.armies)
			{
				const army = this.s.armies[aid];
				if (army)
					lines.push(this.retreatArmy(army, battle.province));
			}
			const attackers = battle.attacker.armies.map(aid => this.s.armies[aid]).filter(a => a && (a.battalions.length || a.general));
			if (attackers.length && !this.hostileArmiesAt(battle.province, battle.attacker.faction).length)
			{
				const old = prov.owner;
				prov.owner = battle.attacker.faction;
				prov.garrison = [];
				prov.capturedTurn = this.s.turn;
				this.event("capture", battle.province, battle.attacker.faction);
				prov.forts = Math.max(0, prov.forts - 1);
				for (const army of attackers)
				{
					army.province = battle.province;
					army.fleet = this.unloadFromFleet(army);
					army.moves = 0;
				}
				const loot = (def.hive || 0) * 120 + 30;
				this.s.factions[battle.attacker.faction].funds += loot;
				conquered = true;
				lines.push(def.name + " foi conquistada" + (old ? " de " + this.D.factionName(old) : "") + ". Saque: " + loot + " " + this.D.factions[battle.attacker.faction].currencyShort + ".");
			}
		}
		else
		{
			for (const aid of battle.attacker.armies)
			{
				const army = this.s.armies[aid];
				if (!army)
					continue;
				army.moves = 0;
				if (battle.kind == "landing")
					lines.push(army.fleet ? "Os sobreviventes do desembarque voltam às naves." : "");
				else if (!army.battalions.length)
					lines.push(this.disbandArmy(army, "O exército atacante foi destruído."));
			}
		}
		const report = { "title": title, "lines": lines.filter(Boolean), "winner": result.winner, "conquered": conquered, "province": battle.province, "attacker": battle.attacker.faction, "defender": battle.defender.faction };
		this.log(title + ". " + report.lines.join(" "), "battle", battle.attacker.faction);
		// A IA vencedora decide se saqueia (também nas batalhas contra o jogador).
		if (conquered && this.s.factions[battle.attacker.faction]?.ai && typeof WH40KAI != "undefined")
			new WH40KAI(this, battle.attacker.faction).maybeSack(battle);
		this.checkElimination();
		return report;
	}

	unloadFromFleet(army)
	{
		if (army.fleet && this.s.fleets[army.fleet])
		{
			const fleet = this.s.fleets[army.fleet];
			fleet.cargo = fleet.cargo.filter(a => a != army.id);
		}
		return null;
	}

	woundGeneral(army)
	{
		const general = this.general(army);
		if (!general)
			return "";
		this.s.generals[army.general] = { "state": "wounded", "turns": WH40K_WOUND_TURNS };
		army.general = null;
		const text = general.title + " " + general.name + " foi gravemente ferido e deixa o comando por " + WH40K_WOUND_TURNS + " turnos.";
		if (!army.battalions.length)
			this.disbandArmy(army, "");
		return text;
	}

	/** O exército vencido recua para uma província vizinha própria, ou se dispersa. */
	retreatArmy(army, fromPid)
	{
		if (!army.battalions.length)
			return this.disbandArmy(army, "O exército de " + this.D.factionName(army.faction) + " foi aniquilado.");
		const options = this.pdef(fromPid).neighbors.filter(pid => this.D.allied(this.province(pid).owner, army.faction) && !this.hostileArmiesAt(pid, army.faction).length);
		if (!options.length)
			return this.disbandArmy(army, "Sem para onde recuar, o exército de " + this.D.factionName(army.faction) + " se dispersa.");
		army.province = options[0];
		army.moves = 0;
		return "O exército de " + this.D.factionName(army.faction) + " recua para " + this.pdef(options[0]).name + ".";
	}

	disbandArmy(army, text)
	{
		if (army.general)
		{
			const general = this.general(army);
			this.s.generals[army.general] = { "state": "wounded", "turns": WH40K_WOUND_TURNS };
			text += " " + general.title + " " + general.name + " escapa ferido.";
		}
		this.unloadFromFleet(army);
		delete this.s.armies[army.id];
		return text.trim();
	}

	// ------------------------------------------------------------ frotas

	fleetCapacity(fleet)
	{
		return Math.max(1, fleet.ships * WH40K_FLEET_CAPACITY);
	}

	/** Embarca um exército numa frota do mesmo corpo. */
	embark(armyId, fleetId)
	{
		const army = this.s.armies[armyId];
		const fleet = this.s.fleets[fleetId];
		if (!army || !fleet || army.faction != fleet.faction)
			return "Frota inválida.";
		if (!army.province || fleet.body != this.pdef(army.province).body || fleet.dest)
			return "A frota precisa estar na órbita deste corpo.";
		if (army.moves <= 0)
			return "O exército já se moveu neste turno.";
		if (fleet.cargo.length >= this.fleetCapacity(fleet))
			return "A frota está cheia (" + this.fleetCapacity(fleet) + " exército por nave).";
		army.province = null;
		army.fleet = fleet.id;
		army.moves = 0;
		fleet.cargo.push(army.id);
		return "";
	}

	/** Desembarque: própria/vazia = move; inimiga = batalha (assalto do espaço). */
	landTargets(army)
	{
		const result = {};
		const fleet = army.fleet && this.s.fleets[army.fleet];
		if (!fleet || !fleet.body || fleet.dest || army.moves <= 0 || this.hostileFleetAt(fleet.body, army.faction))
			return result;
		for (const pid of this.D.bodies[fleet.body].landProvinces)
			result[pid] = this.isHostileTarget(pid, army.faction) ? "attack" : "move";
		return result;
	}

	land(armyId, pid)
	{
		const army = this.s.armies[armyId];
		const targets = this.landTargets(army);
		if (!targets[pid])
			return { "error": "Não é possível desembarcar aí (frota em trânsito, inimigos em órbita ou exército já moveu)." };
		if (targets[pid] == "attack")
			return { "battle": this.makeBattle(pid, army.faction, [army.id], "landing") };
		this.unloadFromFleet(army);
		army.fleet = null;
		army.province = pid;
		army.moves = 0;
		this.event("landing", pid, army.faction);
		this.captureIfEmpty(pid, army.faction);
		return {};
	}

	moveFleet(fleetId, body)
	{
		const fleet = this.s.fleets[fleetId];
		if (!fleet || !fleet.body)
			return "A frota está em trânsito.";
		if (fleet.body == body)
		{
			fleet.dest = null;
			fleet.eta = 0;
			return "";
		}
		fleet.dest = body;
		fleet.eta = this.D.travelTurns(fleet.body, body);
		return "";
	}

	shipyardsOf(faction, body)
	{
		return this.provincesOf(faction).filter(pid => this.pdef(pid).shipyard && (!body || this.pdef(pid).body == body));
	}

	buildShip(faction, pid)
	{
		if (this.province(pid).owner != faction || !this.pdef(pid).shipyard)
			return "Precisa de um estaleiro próprio.";
		if (this.s.factions[faction].funds < WH40K_SHIP_COST)
			return "Recursos insuficientes.";
		const prov = this.province(pid);
		if (prov.builtTurn == this.s.turn)
			return "O estaleiro já lançou uma nave neste turno.";
		const body = this.pdef(pid).body;
		this.s.factions[faction].funds -= WH40K_SHIP_COST;
		prov.builtTurn = this.s.turn;
		const fleet = this.fleetsAt(body, faction).find(f => !f.dest);
		if (fleet)
			++fleet.ships;
		else
			this.createFleet(faction, body, 1);
		return "";
	}

	/** Bombardeio orbital de uma província inimiga: guarnição e fortes sofrem. */
	canBombard(fleet, pid)
	{
		if (!fleet.body || fleet.dest || fleet.acted == this.s.turn)
			return "A frota já agiu neste turno ou está em trânsito.";
		if (this.pdef(pid).body != fleet.body)
			return "A província não está sob esta órbita.";
		if (!this.orbitalControl(fleet.body, fleet.faction))
			return "Há naves inimigas na órbita.";
		if (!this.isHostileTarget(pid, fleet.faction))
			return "Não há inimigos lá.";
		return "";
	}

	bombard(fleetId, pid)
	{
		const fleet = this.s.fleets[fleetId];
		const reason = this.canBombard(fleet, pid);
		if (reason)
			return reason;
		fleet.acted = this.s.turn;
		const prov = this.province(pid);
		const hit = Math.min(0.45, 0.12 + 0.06 * fleet.ships);
		for (const bat of prov.garrison)
			bat.strength = Math.max(0.1, bat.strength * (1 - hit * randRange(0.6, 1.2)));
		for (const army of this.hostileArmiesAt(pid, fleet.faction))
			for (const bat of army.battalions)
				bat.strength = Math.max(0.1, bat.strength * (1 - hit * 0.6 * randRange(0.6, 1.2)));
		if (prov.forts && Math.random() < 0.5)
			--prov.forts;
		prov.devastated = Math.max(prov.devastated || 0, 1);
		this.event("orbital", pid, fleet.faction);
		this.event("orbital", fleet.body, fleet.faction);
		this.log("Bombardeio orbital de " + this.D.factionName(fleet.faction) + " sobre " + this.pdef(pid).name + ".", "orbital", fleet.faction);
		return "";
	}

	// ------------------------------------------------------------ saque

	/**
	 * Saque: um exército numa província que a sua facção tomou neste turno
	 * ou no anterior arranca tudo o que puder. Rende vários turnos de
	 * rendimento de uma vez, mas a província fica devastada (rendimento a
	 * 25%) e perde as fortificações. Os Orks saqueiam melhor.
	 */
	canSack(army)
	{
		if (!army || !army.province)
			return "O exército precisa estar numa província.";
		const prov = this.province(army.province);
		if (prov.owner != army.faction)
			return "A província não é sua.";
		if ((prov.capturedTurn || -10) < this.s.turn - 1)
			return "Só se saqueia uma província recém-conquistada (neste turno ou no anterior).";
		if (prov.devastated > 0)
			return "Já está devastada.";
		if (army.sackedTurn == this.s.turn)
			return "O exército já saqueou neste turno.";
		return "";
	}

	sackValue(pid, faction)
	{
		const def = this.pdef(pid);
		const base = (WH40K_TERRAIN_INCOME[def.terrain] || 15) + (def.hive || 0) * 20 + (def.shipyard ? 15 : 0);
		return Math.round((base * 4 + (def.hive || 0) * 60) * (this.D.factions[faction]?.sackMult || 1));
	}

	sack(armyId)
	{
		const army = this.s.armies[armyId];
		const reason = this.canSack(army);
		if (reason)
			return reason;
		const pid = army.province;
		const prov = this.province(pid);
		const loot = this.sackValue(pid, army.faction);
		this.s.factions[army.faction].funds += loot;
		prov.devastated = WH40K_SACK_TURNS;
		prov.forts = 0;
		army.sackedTurn = this.s.turn;
		for (const bat of army.battalions)
			bat.xp = (bat.xp || 0) + (this.D.factions[army.faction]?.sackXp || 0);
		this.event("sack", pid, army.faction);
		this.log(this.D.factionName(army.faction) + " — " + (this.D.factions[army.faction]?.sackName || "Saquear").toLowerCase() + ": " + this.pdef(pid).name + ": +" + loot + " " + this.D.factions[army.faction].currencyShort +
			". A província fica devastada por " + WH40K_SACK_TURNS + " turnos.", "sack", army.faction);
		return "";
	}

	// ------------------------------------------------------------ fim do turno

	/**
	 * Fim do turno do jogador: IA, frotas, batalhas espaciais, economia.
	 * Batalhas da IA contra o jogador vão para s.pendingBattles.
	 * Devolve { reports: [...] } (relatórios das batalhas automáticas que
	 * envolvem o jogador e das batalhas espaciais).
	 */
	endTurn()
	{
		const reports = [];
		for (const f in this.s.factions)
			if (this.s.factions[f].ai && this.s.factions[f].alive)
				new WH40KAI(this, f).play(reports);
		this.moveFleets(reports);
		this.spaceBattles(reports);
		this.economy(reports);
		this.checkElimination();
		++this.s.turn;
		this.s.events = this.s.events.filter(ev => ev.turn >= this.s.turn - 1);
		for (const army of Object.values(this.s.armies))
			army.moves = this.maxMoves(army);
		return { "reports": reports };
	}

	moveFleets(reports)
	{
		for (const fleet of Object.values(this.s.fleets))
		{
			if (!fleet.dest)
				continue;
			if (fleet.body)
				fleet.from = fleet.body;
			fleet.body = null;
			--fleet.eta;
			if (fleet.eta <= 0)
			{
				fleet.body = fleet.dest;
				fleet.dest = null;
				fleet.eta = 0;
				if (fleet.faction == this.player)
					this.log("A frota " + fleet.name + " chegou a " + this.D.bodies[fleet.body].name + ".", "fleet", fleet.faction);
			}
		}
	}

	spaceBattles(reports)
	{
		for (const body in this.D.bodies)
		{
			const fleets = this.fleetsAt(body);
			const factions = [...new Set(fleets.map(f => f.faction))];
			if (factions.length < 2)
				continue;
			const power = f => fleets.filter(x => x.faction == f).reduce((sum, x) => sum + x.ships, 0);
			factions.sort((a, b) => power(b) - power(a));
			const [a, b] = factions;
			const pa = power(a) * randRange(0.75, 1.35);
			const pb = power(b) * randRange(0.75, 1.35);
			const winner = pa >= pb ? a : b;
			const loser = winner == a ? b : a;
			const lines = [];
			for (const fleet of fleets)
			{
				let loss;
				if (fleet.faction == loser)
					loss = Math.max(1, Math.ceil(fleet.ships * randRange(0.5, 1.0)));
				else if (fleet.faction == winner)
					loss = Math.floor(power(loser) * 0.35 * Math.random());
				else
					continue;
				fleet.ships = Math.max(0, fleet.ships - loss);
				if (!fleet.ships)
				{
					lines.push("A frota " + fleet.name + " (" + this.D.factionName(fleet.faction) + ") foi destruída" + (fleet.cargo.length ? ", com os exércitos a bordo" : "") + ".");
					for (const aid of fleet.cargo.slice())
						if (this.s.armies[aid])
							this.disbandArmy(this.s.armies[aid], "");
					delete this.s.fleets[fleet.id];
				}
				else if (fleet.faction == loser && !fleet.dest)
				{
					// recua para o corpo de onde veio ou um corpo próprio
					const home = fleet.from && fleet.from != body ? fleet.from : this.homeBody(fleet.faction, body);
					if (home && home != body)
					{
						fleet.dest = home;
						fleet.eta = this.D.travelTurns(body, home);
						lines.push("A frota " + fleet.name + " recua para " + this.D.bodies[home].name + ".");
					}
				}
			}
			const title = "Batalha espacial em " + this.D.bodies[body].name + ": vitória de " + this.D.factionName(winner);
			this.event("space", body, winner);
			this.log(title + ". " + lines.join(" "), "space", winner);
			if (a == this.player || b == this.player)
				reports.push({ "title": title, "lines": lines, "space": true, "winner": winner });
		}
	}

	homeBody(faction, exclude)
	{
		const owned = this.provincesOf(faction).map(pid => this.pdef(pid).body).filter(b => b != exclude);
		return owned[0];
	}

	economy(reports)
	{
		for (const f in this.s.factions)
		{
			const fs = this.s.factions[f];
			if (!fs.alive)
				continue;
			fs.funds += this.income(f) - this.upkeep(f);
			if (fs.funds < 0)
			{
				// Deserção: o batalhão mais fraco some.
				let worst;
				for (const army of this.armiesOf(f))
					for (const bat of army.battalions)
						if (!worst || bat.strength < worst.bat.strength)
							worst = { "bat": bat, "list": army.battalions };
				if (worst)
				{
					worst.list.splice(worst.list.indexOf(worst.bat), 1);
					if (f == this.player)
						this.log("Sem recursos para a manutenção: um batalhão desertou!", "warning", f);
				}
				fs.funds = 0;
			}
		}
		// Províncias devastadas se recuperam aos poucos.
		for (const pid in this.s.provinces)
			if (this.s.provinces[pid].devastated > 0)
				--this.s.provinces[pid].devastated;
		// Reposição das baixas em território próprio.
		for (const army of Object.values(this.s.armies))
			if (army.province && this.D.allied(this.province(army.province).owner, army.faction))
				for (const bat of army.battalions)
					bat.strength = Math.min(1, bat.strength + WH40K_HEAL_PER_TURN);
		for (const pid in this.s.provinces)
			for (const bat of this.s.provinces[pid].garrison)
				bat.strength = Math.min(1, bat.strength + WH40K_HEAL_PER_TURN);
		// Generais feridos voltam.
		for (const g in this.s.generals)
		{
			const gs = this.s.generals[g];
			if (gs.state == "wounded" && --gs.turns <= 0)
			{
				gs.state = "available";
				if (this.D.generals[g].faction == this.player)
					this.log(this.D.generals[g].title + " " + this.D.generals[g].name + " se recuperou e pode ser contratado de novo.", "info", this.player);
			}
		}
	}

	checkElimination()
	{
		for (const f in this.s.factions)
		{
			const fs = this.s.factions[f];
			if (!fs.alive)
				continue;
			if (!this.provincesOf(f).length && !this.armiesOf(f).length)
			{
				fs.alive = false;
				this.log(this.D.factionName(f) + " foi expulsa do " + this.D.sector.system.name + "!", "victory", f);
			}
		}
		if (this.s.gameOver)
			return;
		if (!this.s.factions[this.player].alive)
			this.s.gameOver = { "won": false, "text": "Sua facção foi expulsa do sistema. " + this.D.sector.system.name + " está perdido." };
		else if (Object.keys(this.s.factions).every(f => this.D.allied(f, this.player) || !this.s.factions[f].alive))
			this.s.gameOver = { "won": true, "text": "Todos os inimigos foram expulsos. " + this.D.sector.system.name + " é seu!" };
		else
		{
			const hives = this.objectiveProvinces();
			if (hives.length && hives.every(pid => this.D.allied(this.province(pid).owner, this.player)))
				this.s.gameOver = { "won": true, "text": this.D.scenario.objective.label + ": todas sob seu controle. A guerra está ganha!" };
		}
	}

	/** Províncias do objetivo: as cidades-colmeia do corpo principal da campanha. */
	objectiveProvinces()
	{
		const body = this.D.bodies[this.D.scenario.objective.body];
		return body ? body.landProvinces.filter(pid => this.pdef(pid).hive == 2) : [];
	}

	/** Objetivo de vitória (para a interface). */
	objective()
	{
		const hives = this.objectiveProvinces();
		const mine = hives.filter(pid => this.D.allied(this.province(pid).owner, this.player)).length;
		return { "hives": hives.length, "mine": mine };
	}
}

// ------------------------------------------------------------ utilidades

function pickFrom(list)
{
	return list[Math.floor(Math.random() * list.length)];
}

function randRange(a, b)
{
	return a + Math.random() * (b - a);
}
