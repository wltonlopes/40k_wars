/**
 * Eventos de campanha (sorteados no fim do turno por WH40KGame.rollEvents).
 * Cada evento: id, weight, cooldown (turnos entre repetições para a mesma
 * facção), factions(game, f) (quem pode receber), when(game, f) -> contexto
 * ou null (não acontece agora), title/text/portrait(game, f, ctx),
 * choices(game, f, ctx) -> [{ caption, tooltip, can?(…) -> motivo, apply(…) -> texto }]
 * e ai(game, f, ctx) -> índice da escolha da IA.
 * O jogador decide numa janela (s.pendingChoices); a IA decide na hora.
 */
const WH40K_IMPERIUM = ["imperial", "ultramarines", "blood_angels", "salamanders", "grey_knights", "sororitas", "mechanicus", "custodes"];

function evGroup(game, f)
{
	return game.D.factions[f]?.pact?.group;
}

function evOwnProvince(game, f, filter)
{
	const list = game.provincesOf(f).filter(pid => !filter || filter(pid));
	return list.length ? pickFrom(list) : null;
}

function evName(game, pid)
{
	return game.pdef(pid).name;
}

/** Exército próprio numa província própria, com espaço; ou null. */
function evArmyAtHome(game, f)
{
	const list = game.armiesOf(f).filter(a => a.province && game.province(a.province).owner == f && a.battalions.length < WH40K_MAX_BATTALIONS);
	return list.length ? pickFrom(list) : null;
}

function evAddBattalion(game, f, unitId, ctx)
{
	const army = ctx.army && game.s.armies[ctx.army];
	if (army && army.battalions.length < WH40K_MAX_BATTALIONS)
	{
		army.battalions.push(game.newBattalion(unitId, f));
		return game.armyLabel(army);
	}
	const pid = evOwnProvince(game, f, p => game.province(p).garrison.length < game.maxGarrison(p));
	if (pid)
	{
		game.province(pid).garrison.push(game.newBattalion(unitId, f));
		return "a guarnição de " + evName(game, pid);
	}
	return null;
}

/** Unidade de elite da facção sem exigências especiais. */
function evEliteUnit(game, f)
{
	const list = game.D.unitsOf(f).filter(u => !u.noRecruit && !(u.requires || []).length);
	list.sort((a, b) => b.power - a.power);
	return list[Math.min(1, list.length - 1)] || null;
}

function evFlags(game, f)
{
	return game.s.factions[f].flags = game.s.factions[f].flags || {};
}

const WH40K_EVENTS = [
	// ---------------- cadeia: o culto oculto (3 passos)
	{
		"id": "cult_whispers", "weight": 0.9, "cooldown": 20,
		"factions": (game, f) => evGroup(game, f) != "chaos" && game.hasOrder(f) && !evFlags(game, f).cult,
		"when": (game, f) => {
			const pid = evOwnProvince(game, f, p => game.pdef(p).hive);
			return pid ? { "pid": pid } : null;
		},
		"title": () => "Sussurros nos Subterrâneos",
		"text": (game, f, ctx) => "Operários de " + evName(game, ctx.pid) + " falam de reuniões secretas e de símbolos de oito pontas riscados nas paredes. Pode não ser nada... ou o começo de um culto.",
		"portrait": () => "chaos/r0c0.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Investigar (100)", "can": (game, f) => game.s.factions[f].funds >= 100 ? "" : "Recursos insuficientes.",
				"apply": (game, f) => { game.s.factions[f].funds -= 100; game.gainSpecial(f, "win", 1); return "os investigadores desmontam o culto antes que cresça."; } },
			{ "caption": "Ignorar", "tooltip": "Economiza agora. O culto pode crescer.",
				"apply": (game, f, ctx) => { evFlags(game, f).cult = { "pid": ctx.pid, "stage": 1, "turn": game.s.turn }; return "os rumores são ignorados."; } }
		],
		"ai": (game, f) => game.s.factions[f].funds > 500 ? 0 : 1
	},
	{
		"id": "cult_grows", "weight": 4, "cooldown": 3,
		"factions": (game, f) => { const c = evFlags(game, f).cult; return !!c && c.stage == 1 && game.s.turn - c.turn >= 3; },
		"when": (game, f) => { const c = evFlags(game, f).cult; return game.province(c.pid).owner == f ? { "pid": c.pid } : (delete evFlags(game, f).cult, null); },
		"title": () => "O Culto Cresce",
		"text": (game, f, ctx) => "O culto de " + evName(game, ctx.pid) + " já recruta nas fábricas e nos quartéis. A ordem pública desaba. Ainda dá para esmagá-lo — custa caro.",
		"portrait": () => "chaos/r1c3.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Expurgo total (250)", "tooltip": "A província fica devastada por 2 turnos, mas o culto acaba.", "can": (game, f) => game.s.factions[f].funds >= 250 ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { game.s.factions[f].funds -= 250; game.province(ctx.pid).devastated = Math.max(2, game.province(ctx.pid).devastated || 0); delete evFlags(game, f).cult; return "o expurgo queima o culto de " + evName(game, ctx.pid) + "."; } },
			{ "caption": "Ignorar de novo", "tooltip": "A ordem cai 30 agora; o culto vai se levantar.",
				"apply": (game, f, ctx) => { game.province(ctx.pid).order = Math.max(0, game.orderOf(ctx.pid) - 30); evFlags(game, f).cult = { "pid": ctx.pid, "stage": 2, "turn": game.s.turn }; return "o culto cresce nas sombras de " + evName(game, ctx.pid) + "."; } }
		],
		"ai": (game, f) => game.s.factions[f].funds > 600 ? 0 : 1
	},
	{
		"id": "cult_rises", "weight": 6, "cooldown": 3,
		"factions": (game, f) => { const c = evFlags(game, f).cult; return !!c && c.stage == 2 && game.s.turn - c.turn >= 3; },
		"when": (game, f) => { const c = evFlags(game, f).cult; return { "pid": c.pid }; },
		"title": () => "Levante Herético!",
		"text": (game, f, ctx) => "O culto de " + evName(game, ctx.pid) + " pega em armas. As fábricas viram fortalezas hereges e a revolta se espalha para as províncias vizinhas.",
		"portrait": () => "chaos/r1c1.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Às armas!", "apply": (game, f, ctx) => {
				delete evFlags(game, f).cult;
				const lost = [ctx.pid].concat(game.pdef(ctx.pid).neighbors.filter(p => game.province(p).owner == f && !game.armiesAt(p, f).length).slice(0, 1));
				for (const pid of lost)
				{
					if (game.armiesAt(pid, f).length && pid != ctx.pid)
						continue;
					const prov = game.province(pid);
					prov.owner = null;
					prov.garrison = [game.newBattalion("cultists", "chaos"), game.newBattalion("cultists", "chaos"), game.newBattalion("chaos_marines", "chaos")];
					prov.buildings = [];
					game.event("sack", pid, f);
				}
				game.checkElimination();
				return "o levante toma " + lost.map(p => evName(game, p)).join(" e ") + ".";
			} }
		]
	},
	// ---------------- cadeia: sinal de socorro (2 passos)
	{
		"id": "distress", "weight": 0.8, "cooldown": 15,
		"factions": (game, f) => !evFlags(game, f).distress && f != "tyranids",
		"when": (game, f) => {
			const options = Object.keys(game.s.provinces).filter(p => !game.province(p).owner && game.pdef(p).neighbors.some(n => game.province(n).owner == f));
			return options.length ? { "pid": pickFrom(options) } : null;
		},
		"title": () => "Sinal de Socorro",
		"text": (game, f, ctx) => "Os sobreviventes de " + evName(game, ctx.pid) + " pedem ajuda: comida, munição, remédios. Prometem lealdade a quem os salvar.",
		"portrait": () => "astra_inf/r0c0.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Enviar ajuda (200)", "tooltip": "Em 2 turnos a província pode se juntar a você.", "can": (game, f) => game.s.factions[f].funds >= 200 ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { game.s.factions[f].funds -= 200; evFlags(game, f).distress = { "pid": ctx.pid, "turn": game.s.turn }; return "a ajuda parte para " + evName(game, ctx.pid) + "."; } },
			{ "caption": "Ignorar", "apply": () => "o sinal se apaga." }
		],
		"ai": (game, f) => game.s.factions[f].funds > 700 ? 0 : 1
	},
	{
		"id": "distress_answer", "weight": 6, "cooldown": 2,
		"factions": (game, f) => { const d = evFlags(game, f).distress; return !!d && game.s.turn - d.turn >= 2; },
		"when": (game, f) => ({ "pid": evFlags(game, f).distress.pid }),
		"title": (game, f, ctx) => "A Resposta de " + evName(game, ctx.pid),
		"text": (game, f, ctx) => game.province(ctx.pid).owner ? evName(game, ctx.pid) + " caiu nas mãos de outros antes que a ajuda chegasse." :
			"A ajuda chegou a " + evName(game, ctx.pid) + ". Os sobreviventes cumprem a promessa — ou não.",
		"choices": (game, f, ctx) => [
			{ "caption": "Ver o resultado", "apply": (game, f, ctx) => {
				delete evFlags(game, f).distress;
				const prov = game.province(ctx.pid);
				if (prov.owner)
					return "tarde demais para " + evName(game, ctx.pid) + ".";
				if (Math.random() < 0.7)
				{
					prov.owner = f;
					prov.order = 80;
					prov.capturedTurn = game.s.turn;
					game.event("capture", ctx.pid, f);
					return evName(game, ctx.pid) + " se junta a você, grata.";
				}
				for (const b of prov.garrison)
					b.strength = 1;
				prov.garrison.push(game.newBattalion(game.neutralUnit("guard_platoon", game.D.bodies[game.pdef(ctx.pid).body].neutralCiv || f), game.D.bodies[game.pdef(ctx.pid).body].neutralCiv || f));
				return "era uma armadilha: a ajuda foi roubada e a guarnição de " + evName(game, ctx.pid) + " ficou mais forte.";
			} }
		]
	},
	{
		"id": "warp_storm", "weight": 1.2, "cooldown": 10,
		"when": (game, f) => {
			const bodies = Object.keys(game.D.bodies).filter(b => !game.s.storms[b] && game.D.bodies[b].landProvinces.length);
			if (!bodies.length)
				return null;
			const mine = bodies.filter(b => game.fleetsAt(b, f).length || game.D.bodies[b].landProvinces.some(pid => game.province(pid).owner == f));
			return { "body": pickFrom(mine.length ? mine : bodies) };
		},
		"title": () => "Tempestade da Disformidade",
		"text": (game, f, ctx) => "Uma tempestade da disformidade envolve " + game.D.bodies[ctx.body].name + ". Por 3 turnos nenhuma frota sai de lá ou chega lá, e as viagens para lá atrasam.\n\n" +
			(evGroup(game, f) == "chaos" ? "Os feiticeiros dizem que dá para cavalgar a tempestade e colher o favor dos deuses." : "Os navegadores aconselham esperar."),
		"portrait": () => "eldar/r2c2.png",
		"choices": (game, f, ctx) => {
			const list = [{ "caption": "Esperar a tempestade passar", "apply": (game, f, ctx) => { game.s.storms[ctx.body] = 3; return "a tempestade fecha " + game.D.bodies[ctx.body].name + " por 3 turnos."; } }];
			if (evGroup(game, f) == "chaos" && game.special(f))
				list.push({ "caption": "Cavalgar a tempestade", "tooltip": "+25 de " + game.special(f).name + "; a tempestade dura 5 turnos.",
					"apply": (game, f, ctx) => { game.s.storms[ctx.body] = 5; game.s.factions[f].special = Math.min(game.special(f).max, (game.s.factions[f].special || 0) + 25); return "os feiticeiros alimentam a tempestade (+25 " + game.special(f).short + ")."; } });
			return list;
		},
		"ai": (game, f) => evGroup(game, f) == "chaos" ? 1 : 0
	},
	{
		"id": "inquisition", "weight": 1, "cooldown": 12,
		"factions": (game, f) => WH40K_IMPERIUM.includes(f),
		"when": (game, f) => game.s.factions[f].funds >= 100 ? { "tithe": Math.min(400, Math.max(100, Math.round(game.s.factions[f].funds * 0.25 / 10) * 10)) } : null,
		"title": () => "A Inquisição Exige o Dízimo",
		"text": (game, f, ctx) => "Um Inquisidor do Ordo Hereticus chega com uma ordem selada: o dízimo de guerra de " + ctx.tithe + " " + game.D.factions[f].currencyShort + ". Recusar pode levantar suspeitas de heresia sobre seus comandantes.",
		"portrait": () => "imperium/inquisitor.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Pagar " + ctx.tithe, "can": (game, f, ctx) => game.s.factions[f].funds >= ctx.tithe ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { game.s.factions[f].funds -= ctx.tithe; return "o dízimo de " + ctx.tithe + " foi pago. O Inquisidor parte satisfeito."; } },
			{ "caption": "Recusar", "tooltip": "Metade das chances: um expurgo enfraquece uma guarnição e custa recurso especial.",
				"apply": (game, f) => {
					if (Math.random() < 0.5)
						return "o Inquisidor resmunga e vai embora.";
					const pid = evOwnProvince(game, f, p => game.province(p).garrison.length);
					if (pid)
						for (const b of game.province(pid).garrison)
							b.strength = Math.max(0.1, b.strength * 0.6);
					if (game.special(f))
						game.s.factions[f].special = Math.max(0, (game.s.factions[f].special || 0) - 20);
					return "expurgo! " + (pid ? "A guarnição de " + evName(game, pid) + " é dizimada pela Inquisição." : "Oficiais são executados.");
				} }
		],
		"ai": (game, f, ctx) => game.s.factions[f].funds >= ctx.tithe * 2 ? 0 : 1
	},
	{
		"id": "exterminatus", "weight": 0.6, "cooldown": 20,
		"factions": (game, f) => WH40K_IMPERIUM.includes(f),
		"when": (game, f) => {
			const bodies = Object.keys(game.D.bodies).filter(b => b != game.D.scenario.objective.body && game.D.bodies[b].landProvinces.length >= 3 &&
				game.D.bodies[b].landProvinces.every(pid => !game.friendly(game.province(pid).owner, f)) &&
				game.D.bodies[b].landProvinces.filter(pid => game.province(pid).owner && game.hostile(game.province(pid).owner, f)).length >= 2);
			return bodies.length ? { "body": pickFrom(bodies) } : null;
		},
		"title": () => "Exterminatus",
		"text": (game, f, ctx) => game.D.bodies[ctx.body].name + " está perdido para o inimigo. Um Inquisidor oferece o último recurso: o Exterminatus. Bombas de vírus apagam toda a vida do planeta — exércitos, guarnições, cidades.\n\nCusto: 500 " + game.D.factions[f].currencyShort + ". O mundo fica devastado por 10 turnos e sem dono.",
		"portrait": () => "imperium/inquisitor.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Ordenar o Exterminatus", "can": (game, f) => game.s.factions[f].funds >= 500 ? "" : "Faltam recursos (500).",
				"apply": (game, f, ctx) => {
					game.s.factions[f].funds -= 500;
					for (const pid of game.D.bodies[ctx.body].landProvinces)
					{
						const prov = game.province(pid);
						prov.owner = null;
						prov.garrison = [];
						prov.forts = 0;
						prov.devastated = 10;
						for (const army of game.armiesAt(pid))
							game.disbandArmy(army, "");
						game.event("orbital", pid, f);
					}
					game.event("orbital", ctx.body, f);
					game.checkElimination();
					return "EXTERMINATUS sobre " + game.D.bodies[ctx.body].name + ". Nada sobreviveu.";
				} },
			{ "caption": "Recusar", "apply": () => "o Inquisidor guarda as ordens. Por enquanto." }
		],
		"ai": (game, f) => game.s.factions[f].funds > 1200 && Math.random() < 0.5 ? 0 : 1
	},
	{
		"id": "reinforcements", "weight": 1, "cooldown": 8,
		"factions": (game, f) => !!evEliteUnit(game, f),
		"when": (game, f) => {
			const army = evArmyAtHome(game, f);
			return army || game.provincesOf(f).length ? { "army": army ? army.id : null } : null;
		},
		"title": (game, f) => "Reforços Inesperados",
		"text": (game, f, ctx) => {
			const u = evEliteUnit(game, f);
			return "Uma força perdida — " + u.name + " — atravessa o sistema e se apresenta ao comando de " + game.D.factionName(f) + ".";
		},
		"portrait": (game, f) => evEliteUnit(game, f).portrait,
		"choices": (game, f, ctx) => [
			{ "caption": "Recebê-los", "apply": (game, f, ctx) => {
				const u = evEliteUnit(game, f);
				const where = evAddBattalion(game, f, u.id, ctx);
				return where ? u.name + " se junta a " + where + "." : "não havia onde recebê-los.";
			} }
		]
	},
	{
		"id": "cult_uprising", "weight": 1, "cooldown": 10,
		"factions": (game, f) => evGroup(game, f) != "chaos" && f != "tyranids",
		"when": (game, f) => {
			const pid = evOwnProvince(game, f, p => game.pdef(p).hive != 2 && !game.armiesAt(p, f).length);
			return pid ? { "pid": pid } : null;
		},
		"title": () => "Revolta de Cultistas",
		"text": (game, f, ctx) => "Um culto proibido sai dos subterrâneos de " + evName(game, ctx.pid) + ". Se nada for feito, a província pode cair nas mãos dos hereges.",
		"portrait": () => "chaos/r0c0.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Expurgar (150)", "tooltip": "Custa 150; a província fica devastada por 1 turno.", "can": (game, f) => game.s.factions[f].funds >= 150 ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { game.s.factions[f].funds -= 150; game.province(ctx.pid).devastated = Math.max(game.province(ctx.pid).devastated || 0, 1); return "o culto de " + evName(game, ctx.pid) + " foi expurgado."; } },
			{ "caption": "Ignorar", "tooltip": "Metade das chances de a província se rebelar.",
				"apply": (game, f, ctx) => {
					if (Math.random() < 0.5 || game.province(ctx.pid).owner != f)
						return "o culto se dispersa sozinho.";
					const prov = game.province(ctx.pid);
					prov.owner = null;
					prov.garrison = [game.newBattalion("cultists", "chaos"), game.newBattalion("cultists", "chaos")];
					game.event("sack", ctx.pid, f);
					game.checkElimination();
					return evName(game, ctx.pid) + " se rebela! Os cultistas tomam a província.";
				} }
		],
		"ai": (game, f) => game.s.factions[f].funds > 400 ? 0 : 1
	},
	{
		"id": "plague", "weight": 0.8, "cooldown": 10,
		"factions": (game, f) => f != "death_guard" && f != "necrons",
		"when": (game, f) => {
			const pid = evOwnProvince(game, f, p => game.province(p).garrison.length);
			return pid ? { "pid": pid } : null;
		},
		"title": () => "Surto de Praga",
		"text": (game, f, ctx) => "Uma febre que apodrece a carne se espalha pela guarnição de " + evName(game, ctx.pid) + ".",
		"portrait": () => "nurgle/r0c0.png",
		"choices": (game, f, ctx) => [
			{ "caption": "Queimar os doentes", "tooltip": "A guarnição perde 20% e a província fica devastada por 2 turnos.",
				"apply": (game, f, ctx) => { for (const b of game.province(ctx.pid).garrison) b.strength = Math.max(0.1, b.strength * 0.8); game.province(ctx.pid).devastated = Math.max(game.province(ctx.pid).devastated || 0, 2); return "os doentes de " + evName(game, ctx.pid) + " foram queimados."; } },
			{ "caption": "Quarentena (100)", "tooltip": "Custa 100; a guarnição perde 10%.", "can": (game, f) => game.s.factions[f].funds >= 100 ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { game.s.factions[f].funds -= 100; for (const b of game.province(ctx.pid).garrison) b.strength = Math.max(0.1, b.strength * 0.9); return "a quarentena em " + evName(game, ctx.pid) + " segura a praga."; } }
		],
		"ai": (game, f) => game.s.factions[f].funds > 300 ? 1 : 0
	},
	{
		"id": "relic_dig", "weight": 1, "cooldown": 8,
		"when": (game, f) => {
			const pid = evOwnProvince(game, f, p => ["ruins", "warp", "tomb", "ash", "mountains", "ice", "industrial"].includes(game.pdef(p).terrain));
			return pid && game.special(f) ? { "pid": pid } : null;
		},
		"title": (game, f) => f == "mechanicus" ? "Fragmento de STC" : "Achado Arqueológico",
		"text": (game, f, ctx) => "Escavações em " + evName(game, ctx.pid) + " revelam um artefato antigo. Estudá-lo pode render " + game.special(f).name + "; vendê-lo, recursos imediatos.",
		"portrait": (game, f) => game.special(f).icon || game.D.factions[f].portrait,
		"choices": (game, f, ctx) => [
			{ "caption": "Estudar (+30 " + game.special(f).short + ")", "apply": (game, f) => { game.s.factions[f].special = Math.min(game.special(f).max, (game.s.factions[f].special || 0) + 30); return "o artefato é estudado: +30 " + game.special(f).short + "."; } },
			{ "caption": "Vender (+250)", "apply": (game, f) => { game.s.factions[f].funds += 250; return "o artefato é vendido: +250 " + game.D.factions[f].currencyShort + "."; } }
		],
		"ai": () => Math.random() < 0.5 ? 0 : 1
	},
	{
		"id": "mercenaries", "weight": 0.8, "cooldown": 10,
		"factions": (game, f) => f != "tyranids" && f != "necrons" && !!evEliteUnit(game, f),
		"when": (game, f) => {
			const army = evArmyAtHome(game, f);
			return army && game.s.factions[f].funds >= 250 ? { "army": army.id } : null;
		},
		"title": () => "Mercenários Oferecem Serviço",
		"text": (game, f, ctx) => {
			const u = evEliteUnit(game, f);
			return "Um bando de guerreiros sem senhor — equipados como " + u.name + " — oferece a espada a " + game.armyLabel(game.s.armies[ctx.army]) + " por 250 " + game.D.factions[f].currencyShort + " (custam " + u.cost + " no recrutamento).";
		},
		"portrait": (game, f) => evEliteUnit(game, f).portrait,
		"choices": (game, f, ctx) => [
			{ "caption": "Contratar (250)", "can": (game, f) => game.s.factions[f].funds >= 250 ? "" : "Recursos insuficientes.",
				"apply": (game, f, ctx) => { const u = evEliteUnit(game, f); const where = evAddBattalion(game, f, u.id, ctx); if (!where) return "não havia onde recebê-los."; game.s.factions[f].funds -= 250; return u.name + " contratados para " + where + "."; } },
			{ "caption": "Dispensar", "apply": () => "os mercenários seguem caminho." }
		],
		"ai": (game, f) => game.s.factions[f].funds > 600 ? 0 : 1
	},
	{
		"id": "waaagh", "weight": 1.5, "cooldown": 8,
		"factions": (game, f) => f == "orks",
		"when": (game, f) => {
			const army = evArmyAtHome(game, f);
			return army ? { "army": army.id } : null;
		},
		"title": () => "Os Rapazes Ouvem a Waaagh!",
		"text": (game, f, ctx) => "Bandos de Orks selvagens ouvem o barulho da guerra e vêm correndo se juntar a " + game.armyLabel(game.s.armies[ctx.army]) + ".",
		"portrait": () => "orks/r0c5.png",
		"choices": (game, f, ctx) => [
			{ "caption": "WAAAGH!", "apply": (game, f, ctx) => { const a = evAddBattalion(game, f, "boyz", ctx); evAddBattalion(game, f, "boyz", ctx); game.gainSpecial(f, "battle", 1); return "rapazes novos chegam a " + (a || "lugar nenhum") + "."; } }
		]
	},
	{
		"id": "daemon_gift", "weight": 1, "cooldown": 8,
		"factions": (game, f) => evGroup(game, f) == "chaos" && !!game.special(f),
		"when": (game, f) => {
			const army = game.armiesOf(f).find(a => a.general && !game.s.generals[a.general].ascended);
			return army ? { "army": army.id } : null;
		},
		"title": () => "Um Sussurro dos Deuses",
		"text": (game, f, ctx) => "Uma voz da disformidade oferece poder a " + game.D.generals[game.s.armies[ctx.army]?.general]?.name + " — em troca de devoção. Aceitar enche o favor dos deuses; recusar pode irritá-los.",
		"portrait": (game, f, ctx) => game.D.generals[game.s.armies[ctx.army]?.general]?.portrait || game.D.factions[f].portrait,
		"choices": (game, f, ctx) => [
			{ "caption": "Aceitar a dádiva", "tooltip": "+30 de " + game.special(f).name + " e os batalhões do exército ganham experiência; 15% de chance de mutação (o exército perde força).",
				"apply": (game, f, ctx) => {
					const army = game.s.armies[ctx.army];
					game.s.factions[f].special = Math.min(game.special(f).max, (game.s.factions[f].special || 0) + 30);
					if (!army)
						return "a dádiva se perde.";
					for (const b of army.battalions)
						b.xp = (b.xp || 0) + 1;
					if (army.general)
					{
						const st = game.s.generals[army.general].stats = game.s.generals[army.general].stats || {};
						st.corrupted = (st.corrupted || 0) + 1;
					}
					if (Math.random() < 0.15)
					{
						for (const b of army.battalions)
							b.strength = Math.max(0.1, b.strength * 0.75);
						return "a dádiva vem com mutações: o exército perde força, mas o favor cresce.";
					}
					return "os deuses sorriem (+30 " + game.special(f).short + ").";
				} },
			{ "caption": "Recusar", "apply": (game, f) => { game.s.factions[f].special = Math.max(0, (game.s.factions[f].special || 0) - 10); return "os deuses se ofendem (-10 " + game.special(f).short + ")."; } }
		],
		"ai": () => 0
	}
];
