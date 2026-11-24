/**
 * Mais regras da campanha (v0.7), como métodos de WH40KGame (carrega depois
 * de Game.js e Mechanics.js):
 *
 *  - Construções nas províncias (WH40K_BUILDINGS): santuário, quartel,
 *    bateria antiorbital, manufactorum, estaleiro. Vagas: 1 + nível da cidade.
 *  - Ordem pública (province.order, 0..100): sobe com guarnição, exército e
 *    santuário; cai com devastação, saque e conquista recente. Abaixo de 40
 *    o rendimento cai; abaixo de 15, sem exército e passados 4 turnos da
 *    conquista, a província pode se rebelar. Tiranídeos e Necrons não têm ordem (noOrder).
 *  - Melhorias permanentes compradas com o recurso especial (WH40K_UPGRADES).
 *  - Inimigos lendários que surgem no meio da guerra (WH40K_LEGENDS).
 *  - Mecânicas únicas: Necrons se reerguem, Orks crescem com as vitórias.
 */
const WH40K_BUILDINGS = {
	"shrine": { "name": "Santuário", "cost": 300, "desc": "+8 de ordem por turno e +2 do recurso especial por turno.", "icon": "hive" },
	"barracks": { "name": "Quartel", "cost": 350, "desc": "Recrutar aqui custa 20% menos e a guarnição comporta +1 batalhão.", "icon": "fort" },
	"battery": { "name": "Bateria Antiorbital", "cost": 400, "desc": "Bombardeios contra a província causam metade do dano; frotas inimigas na órbita perdem naves.", "icon": "shield" },
	"manufactorum": { "name": "Manufactorum", "cost": 400, "desc": "+30% de rendimento na província.", "icon": "shipyard" },
	"shipyard": { "name": "Estaleiro", "cost": 600, "desc": "Permite lançar naves (e conta como forja para o Mechanicus).", "icon": "shipyard", "needsHive": true }
};
const WH40K_NO_ORDER = ["tyranids", "necrons"];

/** Melhorias permanentes: efeito e nome por grupo de pacto (factions.json: pact.group). */
const WH40K_UPGRADES = [
	{ "id": "weapons", "cost": 90, "attack": 0.08, "desc": "+8% no ataque de todos os exércitos." },
	{ "id": "armor", "cost": 90, "defense": 0.08, "desc": "+8% na defesa de todos os exércitos." },
	{ "id": "logistics", "cost": 110, "upkeep": 0.12, "desc": "-12% na manutenção." },
	{ "id": "recruit", "cost": 110, "recruit": 0.12, "desc": "-12% no custo de recrutamento." },
	{ "id": "veterans", "cost": 140, "xp": 2, "desc": "Batalhões novos já começam no nível 1." }
];
const WH40K_UPGRADE_NAMES = {
	"imperium": { "weapons": "Armas Abençoadas", "armor": "Armaduras Consagradas", "logistics": "Logística do Munitorum", "recruit": "Dízimo de Recrutas", "veterans": "Doutrina Veterana" },
	"secessionists": { "weapons": "Arsenais de Badab", "armor": "Armaduras Firstborn", "logistics": "Rotas Corsárias", "recruit": "Semente Retida", "veterans": "Veteranos do Tirano" },
	"chaos": { "weapons": "Armas Demoníacas", "armor": "Armadura Profana", "logistics": "Saque Organizado", "recruit": "Cultos de Recrutamento", "veterans": "Bênção dos Veteranos" },
	"orks": { "weapons": "Dakka Maior", "armor": "Placas Extras", "logistics": "Pilhagem Esperta", "recruit": "Mais Rapazes", "veterans": "Rapazes Grandões" },
	"tyranids": { "weapons": "Bioarmas Evoluídas", "armor": "Carapaça Reforçada", "logistics": "Digestão Eficiente", "recruit": "Ninhadas Rápidas", "veterans": "Memória Genética" },
	"default": { "weapons": "Armas Avançadas", "armor": "Blindagem Avançada", "logistics": "Logística", "recruit": "Recrutamento Eficiente", "veterans": "Doutrina Veterana" }
};

/**
 * Inimigos lendários por campanha: entre os turnos dados, a facção (a mais
 * fraca da lista que ainda está viva) recebe um exército com as suas
 * unidades mais fortes numa cidade própria.
 */
const WH40K_LEGENDS = {
	"armageddon": { "turns": [12, 22], "factions": ["orks"], "size": 8, "title": "A Grande Waaagh! de Ghazghkull", "text": "Ghazghkull urra do topo de um Stompa e milhares de Orks respondem. Uma nova onda da Waaagh! desce sobre Armageddon." },
	"damocles": { "turns": [10, 20], "factions": ["tyranids"], "size": 8, "title": "Um Navio-Colmeia rompe a órbita", "text": "Um Navio-Colmeia colossal atravessa o bloqueio e despeja um enxame inteiro de organismos de guerra." },
	"cadia": { "turns": [12, 22], "factions": ["chaos"], "size": 8, "title": "O Planeta Assassino", "text": "A fortaleza de Abaddon surge no céu de Cadia e despeja os Escolhidos da Legião Negra." },
	"great_game": { "turns": [12, 24], "factions": ["world_eaters", "death_guard", "thousand_sons", "emperors_children"], "size": 7, "title": "Um Campeão dos Deuses caminha", "text": "Um dos Deuses, insatisfeito com a sua legião, envia os seus campeões mais terríveis ao Grande Jogo." },
	"thaurus": { "turns": [12, 22], "factions": ["death_guard", "thousand_sons", "drukhari"], "size": 7, "title": "Reforços da Disformidade", "text": "Uma frota sai da disformidade sobre Thaurus: o invasor mais desesperado recebe reforços de elite." },
	"badab": { "turns": [12, 22], "factions": ["ultramarines", "salamanders"], "size": 7, "title": "Os capítulos lealistas chegam de Terra", "text": "Mais Astartes lealistas respondem ao chamado da Cruzada e chegam a Badab." },
	"vraks": { "turns": [12, 22], "factions": ["world_eaters"], "size": 7, "title": "A Fenda de Sangue se abre", "text": "Os sacrifícios de Xaphan rasgam a realidade: os servos de Khorne caminham sobre Vraks." },
	"baal": { "turns": [6, 12], "factions": ["tyranids"], "size": 8, "title": "A Frota-Colmeia Leviatã chega", "text": "O enxame principal da Leviatã escurece as estrelas de Baal." },
	"ultramar": { "turns": [12, 22], "factions": ["death_guard"], "size": 7, "title": "O Jardim Flutuante de Mortarion", "text": "A nau do Primarca da Praga entra no sistema. As bênçãos de Nurgle chovem do céu." },
	"sautekh": { "turns": [12, 22], "factions": ["necrons"], "size": 7, "title": "O Despertar da Dinastia", "text": "Uma tumba inteira desperta sob as dunas: legiões de metal vivo se levantam." }
};

Object.assign(WH40KGame.prototype, {

	// ------------------------------------------------------------ construções

	"buildingsOf": function(pid)
	{
		return this.province(pid).buildings || [];
	},

	"hasBuilding": function(pid, id)
	{
		return this.buildingsOf(pid).indexOf(id) != -1;
	},

	"hasShipyard": function(pid)
	{
		return !!this.pdef(pid).shipyard || this.hasBuilding(pid, "shipyard");
	},

	"buildingSlots": function(pid)
	{
		return 1 + (this.pdef(pid).hive || 0);
	},

	"canBuild": function(faction, pid, id)
	{
		const b = WH40K_BUILDINGS[id];
		const prov = this.province(pid);
		if (!b)
			return "Construção desconhecida.";
		if (prov.owner != faction)
			return "A província não é sua.";
		if (this.hasBuilding(pid, id) || id == "shipyard" && this.pdef(pid).shipyard)
			return "Já existe.";
		if (b.needsHive && !this.pdef(pid).hive)
			return "Exige uma cidade.";
		if (this.buildingsOf(pid).length >= this.buildingSlots(pid))
			return "Sem vagas (" + this.buildingSlots(pid) + "): cidades maiores têm mais.";
		if (prov.builtTurn == this.s.turn)
			return "Já se construiu aqui neste turno.";
		if (this.s.factions[faction].funds < b.cost)
			return "Recursos insuficientes.";
		return "";
	},

	"build": function(faction, pid, id)
	{
		const why = this.canBuild(faction, pid, id);
		if (why)
			return why;
		const prov = this.province(pid);
		prov.buildings = this.buildingsOf(pid).concat([id]);
		prov.builtTurn = this.s.turn;
		this.s.factions[faction].funds -= WH40K_BUILDINGS[id].cost;
		this.log(this.D.factionName(faction) + " ergue " + WH40K_BUILDINGS[id].name + " em " + this.pdef(pid).name + ".", "info", faction);
		return "";
	},

	/** Conquista: metade das construções se perde e a ordem cai. */
	"onCapture": function(pid)
	{
		const prov = this.province(pid);
		prov.buildings = this.buildingsOf(pid).filter(() => Math.random() < 0.5);
		prov.order = 35;
	},

	// ------------------------------------------------------------ ordem pública

	"hasOrder": function(faction)
	{
		return !!faction && WH40K_NO_ORDER.indexOf(faction) == -1;
	},

	"orderOf": function(pid)
	{
		const prov = this.province(pid);
		if (!this.hasOrder(prov.owner))
			return 100;
		return prov.order === undefined ? 70 : prov.order;
	},

	"orderDelta": function(pid)
	{
		const prov = this.province(pid);
		let d = 3 + 2 * Math.min(3, prov.garrison.length);
		if (this.armiesAt(pid, prov.owner).length)
			d += 4;
		if (this.hasBuilding(pid, "shrine"))
			d += 8;
		if (prov.devastated > 0)
			d -= 6;
		if ((prov.capturedTurn || -10) > this.s.turn - 3)
			d -= 4;
		return d;
	},

	/** Fim do turno: ordem, revoltas, santuários, baterias e inimigos lendários. */
	"tickRealm": function(reports)
	{
		for (const pid in this.s.provinces)
		{
			const prov = this.province(pid);
			if (!this.hasOrder(prov.owner))
				continue;
			prov.order = Math.max(0, Math.min(100, this.orderOf(pid) + this.orderDelta(pid)));
			if (this.hasBuilding(pid, "shrine"))
				this.s.factions[prov.owner].special = Math.min(this.special(prov.owner)?.max || 300, (this.s.factions[prov.owner].special || 0) + 2);
			// Revolta: ordem muito baixa e nenhum exército para segurar.
			if (prov.order < 15 && !this.armiesAt(pid, prov.owner).length && (prov.capturedTurn || -10) < this.s.turn - 4 && Math.random() < 0.15)
			{
				const old = prov.owner;
				const civ = this.D.bodies[this.pdef(pid).body].neutralCiv || this.D.scenario.factions[0];
				prov.owner = null;
				prov.garrison = [this.newBattalion(this.neutralUnit("guard_platoon", civ), civ), this.newBattalion(this.neutralUnit("guard_platoon", civ), civ)];
				prov.order = 50;
				prov.buildings = [];
				this.event("sack", pid, old);
				this.log("REVOLTA em " + this.pdef(pid).name + "! A província expulsa " + this.D.factionName(old) + ".", "warning", old);
				if (old == this.player)
					this.s.pendingChoices.push({ "kind": "info", "title": "Revolta em " + this.pdef(pid).name, "text": "Sem ordem e sem um exército para segurá-la, " + this.pdef(pid).name + " se rebelou e agora é neutra.\n\nMantenha guarnições, exércitos e santuários nas províncias recém-conquistadas; evite saquear o que pretende manter.", "portrait": "chaos/r0c0.png" });
				this.checkElimination();
			}
		}
		// Baterias antiorbitais atiram nas frotas inimigas da órbita.
		for (const pid in this.s.provinces)
		{
			if (!this.hasBuilding(pid, "battery"))
				continue;
			const owner = this.province(pid).owner;
			for (const fleet of this.fleetsAt(this.pdef(pid).body).filter(f => this.hostile(f.faction, owner)))
				if (Math.random() < 0.4 && fleet.ships > 0)
				{
					--fleet.ships;
					this.log("A bateria de " + this.pdef(pid).name + " abate uma nave de " + fleet.name + ".", "orbital", owner);
					if (!fleet.ships)
					{
						for (const aid of fleet.cargo.slice())
							if (this.s.armies[aid])
								this.disbandArmy(this.s.armies[aid], "");
						delete this.s.fleets[fleet.id];
					}
				}
		}
		this.tickLegend();
	},

	// ------------------------------------------------------------ melhorias permanentes

	"upgradeName": function(faction, id)
	{
		const group = this.D.factions[faction]?.pact?.group;
		return (WH40K_UPGRADE_NAMES[group] || WH40K_UPGRADE_NAMES.default)[id];
	},

	"upgradesOf": function(faction)
	{
		return this.s.factions[faction]?.upgrades || [];
	},

	"upgradeBonus": function(faction, key)
	{
		return WH40K_UPGRADES.filter(u => this.upgradesOf(faction).indexOf(u.id) != -1).reduce((s, u) => s + (u[key] || 0), 0);
	},

	"canUpgrade": function(faction, id)
	{
		const up = WH40K_UPGRADES.find(u => u.id == id);
		const sp = this.special(faction);
		if (!up || !sp)
			return "Indisponível.";
		if (this.upgradesOf(faction).indexOf(id) != -1)
			return "Já adquirida.";
		if ((this.s.factions[faction].special || 0) < up.cost)
			return "Faltam " + Math.ceil(up.cost - (this.s.factions[faction].special || 0)) + " de " + sp.name + ".";
		return "";
	},

	"buyUpgrade": function(faction, id)
	{
		const why = this.canUpgrade(faction, id);
		if (why)
			return why;
		const fs = this.s.factions[faction];
		fs.special -= WH40K_UPGRADES.find(u => u.id == id).cost;
		fs.upgrades = this.upgradesOf(faction).concat([id]);
		this.log(this.D.factionName(faction) + " adquire " + this.upgradeName(faction, id) + ".", "ritual", faction);
		return "";
	},

	/** Custo de recrutar a unidade na província (quartel e melhoria). */
	"recruitCost": function(faction, unit, pid)
	{
		let mult = 1 - this.upgradeBonus(faction, "recruit");
		if (pid && this.hasBuilding(pid, "barracks"))
			mult -= 0.2;
		return Math.round(unit.cost * mult);
	},

	// ------------------------------------------------------------ inimigos lendários

	"tickLegend": function()
	{
		const L = WH40K_LEGENDS[this.s.scenario];
		if (!L || this.s.legendDone || this.s.turn < L.turns[0])
			return;
		this.s.legendTurn = this.s.legendTurn || L.turns[0] + Math.floor(Math.random() * (L.turns[1] - L.turns[0] + 1));
		if (this.s.turn < this.s.legendTurn)
			return;
		const alive = L.factions.filter(f => this.s.factions[f]?.alive && this.provincesOf(f).length);
		if (!alive.length)
		{
			this.s.legendDone = true;
			return;
		}
		alive.sort((a, b) => this.factionPower(a) - this.factionPower(b));
		const f = alive[0];
		const provs = this.provincesOf(f).sort((a, b) => (this.pdef(b).hive || 0) - (this.pdef(a).hive || 0));
		const units = this.D.unitsOf(f).filter(u => !u.noRecruit).sort((a, b) => b.power - a.power);
		const army = this.createArmy(f, null, provs[0]);
		for (let i = 0; i < L.size && units.length; ++i)
		{
			const bat = this.newBattalion(units[i % Math.min(4, units.length)].id, f);
			bat.xp = 4;
			army.battalions.push(bat);
		}
		this.s.legendDone = true;
		this.event("landing", provs[0], f);
		this.log(L.title + "! " + this.D.factionName(f) + " recebe um exército lendário em " + this.pdef(provs[0]).name + ".", "warning", f);
		const mine = this.allied(f, this.player);
		this.s.pendingChoices.push({ "kind": "info", "title": L.title, "portrait": this.D.factionPortrait(f, "win"),
			"text": L.text + "\n\n" + (mine ? "Um exército de elite (" + army.battalions.length + " batalhões veteranos) chega para " + this.D.factionName(f) + " em " + this.pdef(provs[0]).name + "." :
				this.D.factionName(f) + " recebe um exército de elite (" + army.battalions.length + " batalhões veteranos) em " + this.pdef(provs[0]).name + ". Prepare-se.") });
	},

	// ------------------------------------------------------------ mecânicas únicas

	/** Depois da batalha: Necrons se reerguem, Orks crescem com a vitória. Devolve linhas do relatório. */
	"factionAfterBattle": function(battle, sides, result)
	{
		const lines = [];
		for (const role of ["attacker", "defender"])
		{
			const f = battle[role].faction;
			if (!f)
				continue;
			if (f == "necrons")
			{
				let n = 0;
				for (const e of sides[role].entries)
				{
					const army = e.army && this.s.armies[e.army];
					if (e.bat.strength < 0.1 && army && army.battalions.length < WH40K_MAX_BATTALIONS && Math.random() < 0.5)
					{
						e.bat.strength = 0.35;
						army.battalions.push(e.bat);
						++n;
					}
				}
				if (n)
				{
					lines.push("Protocolos de reanimação: " + n + " batalhão(ões) necron se reerguem.");
					this.log(lines[lines.length - 1], "info", f);
				}
			}
			if (f == "orks" && result.winner == role && Math.random() < 0.5)
			{
				const army = battle[role].armies.map(id => this.s.armies[id]).find(a => a && a.battalions.length < WH40K_MAX_BATTALIONS);
				if (army)
				{
					army.battalions.push(this.newBattalion("boyz", "orks"));
					lines.push("A vitória atrai mais rapazes: um bando novo se junta à Waaagh!");
				}
			}
		}
		return lines;
	}
});
