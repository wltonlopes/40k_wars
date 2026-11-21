/**
 * IA de uma facção na campanha 40k Wars.
 *  - Recruta nos exércitos parados em cidades próprias e reforça as
 *    guarnições da fronteira; contrata generais quando sobra dinheiro.
 *  - Exércitos atacam o vizinho que conseguem vencer (preferindo colmeias);
 *    sem alvo, marcham pela própria terra para a fronteira; fracos, esperam
 *    se recuperar.
 *  - Um exército sem fronteira no seu corpo embarca numa frota, que leva o
 *    exército ao corpo inimigo mais próximo; lá desembarca numa província
 *    própria ou assalta a mais fraca.
 *  - Os Orks saqueiam parte das províncias que tomam (menos as colmeias).
 *  - Frotas sem carga caçam frotas inimigas menores e bombardeiam províncias
 *    inimigas sob a sua órbita; estaleiros lançam naves.
 *  - Gasta o recurso especial em rituais (core/Mechanics.js) e, com pactos
 *    compatíveis, propõe tréguas — e às vezes trai quando está forte.
 * Batalhas contra o jogador vão para s.pendingBattles (ele decide como lutar).
 */
class WH40KAI
{
	constructor(game, faction)
	{
		this.g = game;
		this.f = faction;
		this.s = game.s;
		this.D = game.D;
	}

	get funds()
	{
		return this.s.factions[this.f].funds;
	}

	play(reports)
	{
		this.diplomacy();
		this.hireGenerals();
		this.recruit();
		this.rituals();
		this.armies(reports);
		this.fleets(reports);
	}

	get attackRatio()
	{
		return (WH40K_DIFFICULTY[this.s.difficulty] || WH40K_DIFFICULTY.normal).aiRatio;
	}

	/** Tréguas: propõe a quem tem pacto compatível; trai quando ganha muito com isso. */
	diplomacy()
	{
		for (const other of this.g.truceWith(this.f))
		{
			const t = this.s.truces[this.g.truceKey(this.f, other)];
			const myPower = this.g.factionPower(this.f);
			const theirPower = this.g.factionPower(other);
			// Trai quando é bem mais forte, tem um exército na fronteira dele e a trégua já durou um pouco.
			const border = this.g.armiesOf(this.f).some(a => a.province && this.D.provinces[a.province].neighbors.some(pid => this.s.provinces[pid].owner == other));
			const chance = 0.04 + 0.015 * (this.s.turn - t.since) + (myPower > theirPower * 1.5 ? 0.1 : 0);
			if (border && myPower > theirPower && Math.random() < chance)
				this.g.betray(this.f, other);
		}
		if (Math.random() > 0.25)
			return;
		const candidates = Object.keys(this.s.factions).filter(o => !this.g.canTruce(this.f, o));
		if (!candidates.length)
			return;
		// Prefere o vizinho mais forte (para se livrar de uma frente).
		candidates.sort((a, b) => this.g.factionPower(b) - this.g.factionPower(a));
		this.g.proposeTruce(this.f, candidates[0]);
	}

	/** Rituais: gasta quando sobra recurso especial, no exército que mais precisa. */
	rituals()
	{
		const sp = this.g.special(this.f);
		if (!sp)
			return;
		for (let guard = 0; guard < 3; ++guard)
		{
			const amount = this.g.specialAmount(this.f);
			const affordable = sp.rituals.filter(r => r.cost <= amount);
			if (!affordable.length || (amount < sp.max * 0.35 && Math.random() < 0.5))
				return;
			const r = weightedPick(affordable, r => r.ai || 1);
			if (r.target == "faction")
			{
				if (this.g.ritual(this.f, r.id).error)
					return;
				continue;
			}
			const armies = this.g.armiesOf(this.f).filter(a => !this.g.canRitual(this.f, r.id, a.id));
			if (!armies.length)
				return;
			const score = a => {
				const e = r.effect;
				if (e.type == "heal")
					return a.battalions.reduce((s, b) => s + 1 - b.strength, 0);
				if (e.type == "ascend")
					return (this.g.generalStats(a.general)?.level || 0) + Math.random();
				// Bônus, marcha e invocações: no exército da fronteira mais forte.
				return (a.province && this.frontier(a.province) ? 100 : 0) + this.g.armyPower(a, "attack") / 10;
			};
			armies.sort((a, b) => score(b) - score(a));
			if (r.effect.type == "ascend" && amount < r.cost + 15)
				return;
			if (this.g.ritual(this.f, r.id, armies[0].id).error)
				return;
		}
	}

	frontier(pid)
	{
		return this.D.provinces[pid].neighbors.some(n => this.g.isHostileTarget(n, this.f));
	}

	hireGenerals()
	{
		const hives = this.g.provincesOf(this.f).filter(pid => this.D.provinces[pid].hive);
		const armies = this.g.armiesOf(this.f).length;
		if (armies >= 2 + Math.floor(hives.length / 2))
			return;
		for (const gid of this.g.hireableGenerals(this.f))
		{
			const cost = this.D.generals[gid].hireCost;
			if (this.funds < cost + 250)
				continue;
			const free = hives.filter(pid => !this.g.armiesAt(pid, this.f).length).sort((a, b) => +this.frontier(b) - +this.frontier(a));
			if (free.length && !this.g.hireGeneral(this.f, gid, free[0]))
				return;
		}
	}

	pickUnit(pid, preferCheap)
	{
		const options = this.D.unitsOf(this.f).filter(u => !u.noRecruit && !this.g.canRecruit(this.f, u.id, pid) && this.funds - u.cost >= 60);
		if (!options.length)
			return null;
		if (preferCheap)
			return options.reduce((a, b) => a.cost <= b.cost ? a : b);
		// Mistura: 60% infantaria, 40% veículos/aéreos.
		const infantry = options.filter(u => u.category == "infantry");
		const heavy = options.filter(u => u.category != "infantry");
		const list = (Math.random() < 0.6 || !heavy.length) && infantry.length ? infantry : heavy;
		return pickFrom(list);
	}

	recruit()
	{
		for (const army of this.g.armiesOf(this.f))
		{
			if (!army.province || this.s.provinces[army.province].owner != this.f)
				continue;
			let guard = 0;
			while (army.battalions.length < 8 && guard++ < 6 && this.funds > 200)
			{
				const unit = this.pickUnit(army.province, false);
				if (!unit || this.g.recruit(this.f, unit.id, { "army": army.id }))
					break;
			}
		}
		for (const pid of this.g.provincesOf(this.f))
		{
			const prov = this.s.provinces[pid];
			const rich = this.funds > 1500;
			if ((!this.frontier(pid) && !rich) || this.funds < 250)
				continue;
			if (prov.garrison.length < Math.min(this.g.maxGarrison(pid), (rich ? 2 : 1) + prov.forts))
			{
				const unit = this.pickUnit(pid, true);
				if (unit)
					this.g.recruit(this.f, unit.id, { "province": pid });
			}
		}
	}

	armyStrength(army)
	{
		return army.battalions.reduce((sum, b) => sum + b.strength, 0) / Math.max(1, army.battalions.length);
	}

	/** Resolve uma batalha da IA: contra o jogador vira pendente. */
	fight(battle, reports)
	{
		const sides = [battle.attacker.faction, battle.defender.faction];
		if (sides.indexOf(this.g.player) != -1)
		{
			this.s.pendingBattles.push(battle);
			// O exército atacante fica preso à batalha até ela acontecer.
			for (const aid of battle.attacker.armies)
				if (this.s.armies[aid])
					this.s.armies[aid].moves = 0;
			return;
		}
		const report = this.g.applyBattle(battle, this.g.autoResolve(battle));
		return report;
	}

	/** Facções saqueadoras (aiSack em factions.json) saqueiam parte do que tomam; os Tiranídeos devoram até as colmeias. */
	maybeSack(battle)
	{
		const chance = this.D.factions[this.f]?.aiSack || 0;
		if (!chance || (this.D.provinces[battle.province].hive == 2 && this.f != "tyranids") || Math.random() > chance)
			return;
		const army = battle.attacker.armies.map(aid => this.s.armies[aid]).find(a => a && a.province == battle.province);
		if (army)
			this.g.sack(army.id);
	}

	armies(reports)
	{
		for (const army of this.g.armiesOf(this.f))
		{
			if (!this.s.armies[army.id] || !army.province || army.moves <= 0)
				continue;
			if (this.s.pendingBattles.some(b => b.attacker.armies.indexOf(army.id) != -1))
				continue;
			const myPower = this.g.armyPower(army, "attack");
			if (!army.battalions.length)
				continue;
			// Fraco: espera reforços em casa.
			if (this.armyStrength(army) < 0.45 && this.s.provinces[army.province].owner == this.f)
				continue;
			const targets = this.g.armyTargets(army);
			let best;
			let bestScore = 0;
			for (const pid in targets)
			{
				if (targets[pid] != "attack")
					continue;
				const defense = this.g.defensePower(pid, this.f);
				const ratio = myPower / Math.max(1, defense);
				if (ratio < this.attackRatio)
					continue;
				const def = this.D.provinces[pid];
				const score = ratio * (1 + 2 * (def.hive || 0) + (this.s.provinces[pid].owner ? 0.5 : 0));
				if (score > bestScore)
				{
					bestScore = score;
					best = pid;
				}
			}
			if (best)
			{
				const res = this.g.moveArmy(army.id, best);
				if (res.battle)
					this.fight(res.battle, reports);
				continue;
			}
			// Sem alvo: caminha pela própria terra rumo à fronteira mais próxima.
			const step = this.stepTowardFrontier(army);
			if (step)
				this.g.moveArmy(army.id, step);
			else
				this.considerEmbark(army);
		}
	}

	stepTowardFrontier(army)
	{
		if (this.frontier(army.province))
			return null;
		// BFS pela terra própria até uma província de fronteira.
		const prev = { [army.province]: null };
		const queue = [army.province];
		while (queue.length)
		{
			const pid = queue.shift();
			if (pid != army.province && this.frontier(pid))
			{
				let step = pid;
				while (prev[step] != army.province)
					step = prev[step];
				return step;
			}
			for (const n of this.D.provinces[pid].neighbors)
				if (!(n in prev) && this.s.provinces[n].owner == this.f && !this.g.hostileArmiesAt(n, this.f).length)
				{
					prev[n] = pid;
					queue.push(n);
				}
		}
		return null;
	}

	/** Corpo com inimigos mais próximo de um corpo. */
	targetBody(from)
	{
		let best;
		let bestDist = Infinity;
		for (const body in this.D.bodies)
		{
			if (body == from || !this.D.bodies[body].landProvinces.some(pid => this.g.isHostileTarget(pid, this.f)))
				continue;
			const d = this.D.travelTurns(from, body) + (this.g.hostileFleetAt(body, this.f) ? 2 : 0);
			if (d < bestDist)
			{
				bestDist = d;
				best = body;
			}
		}
		return best;
	}

	considerEmbark(army)
	{
		const body = this.D.provinces[army.province].body;
		// Ainda há o que conquistar neste corpo por terra? Então espera.
		if (this.D.bodies[body].landProvinces.some(pid => this.g.isHostileTarget(pid, this.f)))
			return;
		const fleet = this.g.fleetsAt(body, this.f).find(f => !f.dest && f.cargo.length < this.g.fleetCapacity(f));
		if (fleet && this.armyStrength(army) > 0.7)
			this.g.embark(army.id, fleet.id);
	}

	fleets(reports)
	{
		for (const fleet of Object.values(this.s.fleets).filter(f => f.faction == this.f))
		{
			if (!fleet.body || fleet.dest)
				continue;
			if (fleet.cargo.length)
			{
				this.fleetWithCargo(fleet, reports);
				continue;
			}
			// Bombardeia inimigos sob a órbita.
			if (this.g.orbitalControl(fleet.body, this.f))
			{
				const target = this.D.bodies[fleet.body].landProvinces.find(pid => !this.g.canBombard(fleet, pid));
				if (target)
					this.g.bombard(fleet.id, target);
			}
			// Caça frotas inimigas menores.
			let prey;
			for (const other of Object.values(this.s.fleets))
				if (this.g.hostile(other.faction, this.f) && other.body && other.ships < fleet.ships && this.D.travelTurns(fleet.body, other.body) <= 2)
					prey = prey && prey.ships >= other.ships ? prey : other;
			if (prey && Math.random() < 0.5)
			{
				this.g.moveFleet(fleet.id, prey.body);
				continue;
			}
			// Volta para buscar exércitos ociosos em corpos já conquistados.
			const idle = this.g.armiesOf(this.f).find(a => a.province && this.D.provinces[a.province].body != fleet.body &&
				!this.D.bodies[this.D.provinces[a.province].body].landProvinces.some(pid => this.g.isHostileTarget(pid, this.f)) &&
				!this.g.fleetsAt(this.D.provinces[a.province].body, this.f).length);
			if (idle && Math.random() < 0.6)
				this.g.moveFleet(fleet.id, this.D.provinces[idle.province].body);
		}
		// Estaleiros.
		for (const pid of this.g.shipyardsOf(this.f))
			if (this.funds > 700 && Object.values(this.s.fleets).filter(f => f.faction == this.f).reduce((s, f) => s + f.ships, 0) < 6)
				this.g.buildShip(this.f, pid);
	}

	fleetWithCargo(fleet, reports)
	{
		const body = fleet.body;
		const hasTargets = this.D.bodies[body].landProvinces.some(pid => this.g.isHostileTarget(pid, this.f));
		if (!hasTargets || this.g.hostileFleetAt(body, this.f))
		{
			const target = this.targetBody(body);
			if (target)
				this.g.moveFleet(fleet.id, target);
			return;
		}
		for (const aid of fleet.cargo.slice())
		{
			const army = this.s.armies[aid];
			if (!army)
				continue;
			const targets = this.g.landTargets(army);
			const own = Object.keys(targets).find(pid => targets[pid] == "move" && this.s.provinces[pid].owner == this.f);
			if (own)
			{
				this.g.land(aid, own);
				continue;
			}
			const myPower = this.g.armyPower(army, "attack") * (1 - WH40K_LANDING_PENALTY);
			let best;
			let bestRatio = 1.2;
			for (const pid in targets)
			{
				const ratio = myPower / Math.max(1, targets[pid] == "attack" ? this.g.defensePower(pid, this.f) : 0.1);
				if (ratio > bestRatio)
				{
					bestRatio = ratio;
					best = pid;
				}
			}
			if (best)
			{
				const res = this.g.land(aid, best);
				if (res.battle)
					this.fight(res.battle, reports);
			}
		}
	}
}
