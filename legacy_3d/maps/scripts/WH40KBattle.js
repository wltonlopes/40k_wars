/**
 * Batalha da campanha 40k Wars (trigger de maps/random/wh40k_battle.js).
 *
 * Configuração: InitAttributes.settings.WH40K, montada pela campanha
 * (gui/campaigns/wh40k/core/BattleSetup.js) depois da tela de desdobramento:
 *   armies[p]   batalhões { id, template, x, y (0..1; y=0 no norte), order,
 *               strength (0..1), name, portrait, quotes, unitName, category }
 *   generals[p] { template, name, title, portrait, quotes, x, y, order }
 *   support[p]  poderes { type, name, icon, kills, desc } (estilo killstreak)
 *   supportReady[p]  quantos poderes já começam prontos
 * O jogador 1 (humano) fica ao sul, o 2 (diretor) ao norte.
 *
 * - Cada batalhão nasce onde foi posto no desdobramento e cumpre a ordem
 *   dada (avançar, manter, flanquear, reserva, recuar). Um batalhão do
 *   jogador que recebe uma ordem direta passa a ser "manual" até receber
 *   uma nova ordem do painel de plano de batalha (gui/session/z_wh40k_battle.js).
 * - Cada baixa inimiga enche as barras de apoio do lado que a causou; uma
 *   barra cheia libera o poder (AirSupportProvider do warhr, na entidade de
 *   comando invisível do jogador; ver simulation/components/ZZ_WH40KSupport.js).
 * - Um lado reduzido a 25% dos soldados, diante do dobro, debanda e recua
 *   para a sua borda. Quem sai pela borda escapa (volta à campanha); quem
 *   continua no campo 45 s depois é capturado. Sem ninguém no campo, perde.
 * - No fim, OnCampaignGameEnd devolve a força de cada batalhão, os
 *   generais vivos e as baixas.
 */

const WH40K_DIRECTOR_INTERVAL = 2500;
const WH40K_CHECK_INTERVAL = 2000;
const WH40K_ROUT_FRACTION = 0.25;
const WH40K_RETREAT_TIMEOUT = 45000;
const WH40K_EDGE = 16;
const WH40K_HOLD_ENGAGE = 75;
const WH40K_HOLD_LEASH = 55;
const WH40K_RESERVE_TRIGGER = 90;
const WH40K_RESERVE_TIMEOUT = 150000;

Trigger.prototype.WH40KTime = function()
{
	return Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer).GetTime();
};

Trigger.prototype.WH40KNotify = function(message, players = [1, 2])
{
	Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface).PushNotification({
		"type": "text",
		"players": players,
		"message": message,
		"translateMessage": false
	});
};

Trigger.prototype.WH40KAlive = function(ent)
{
	const cmpHealth = Engine.QueryInterface(ent, IID_Health);
	const cmpPosition = Engine.QueryInterface(ent, IID_Position);
	return !!cmpHealth && cmpHealth.GetHitpoints() > 0 && !!cmpPosition && cmpPosition.IsInWorld();
};

Trigger.prototype.WH40KPos = function(ent)
{
	const cmpPosition = Engine.QueryInterface(ent, IID_Position);
	return cmpPosition && cmpPosition.IsInWorld() ? cmpPosition.GetPosition2D() : undefined;
};

Trigger.prototype.WH40KWorld = function(x, y)
{
	const size = this.wh40k.mapSize;
	return { "x": Math.max(10, Math.min(size - 10, x * size)), "z": Math.max(10, Math.min(size - 10, (1 - y) * size)) };
};

// ------------------------------------------------------------ preparação

/** Partida avulsa (sem campanha): exércitos de demonstração. */
Trigger.prototype.WH40KDemoSettings = function()
{
	const armies = {
		"imperial": ["units/imperial/battalion_infantry_guardsman", "units/imperial/battalion_infantry_guardsman", "units/imperial/battalion_infantry_grenadier", "units/imperial/vehicle_chimera", "units/imperial/vehicle_leman_russ"],
		"orks": ["units/orks/battalion_boyz", "units/orks/battalion_boyz", "units/orks/battalion_shoota_boyz", "units/orks/battalion_nobz", "units/orks/vehicle_trukk"]
	};
	const support = {
		"imperial": [{ "type": "drop_pod", "name": "C\u00e1psula de Desembarque", "kills": 6 }, { "type": "strategic_bomber", "name": "Bombardeio de Marauders", "kills": 10 }, { "type": "orbital_saturation", "name": "Bombardeio Orbital", "kills": 20 }],
		"orks": [{ "type": "drop_pod", "name": "Teleporta de Rapazes", "kills": 6 }, { "type": "strategic_bomber", "name": "Bombardeio de Dakkajets", "kills": 10 }, { "type": "orbital_saturation", "name": "Chuva de Rokks", "kills": 20 }]
	};
	const generals = { "imperial": "units/imperial/wh40k_general", "orks": "units/orks/wh40k_general" };
	const settings = { "armies": {}, "generals": {}, "support": {}, "supportReady": {}, "ai": [2] };
	for (const p of [1, 2])
	{
		const civ = QueryPlayerIDInterface(p, IID_Identity)?.GetCiv();
		const list = armies[civ] || armies[p == 1 ? "imperial" : "orks"];
		settings.armies[p] = list.map((template, i) => ({
			"id": "demo" + i,
			"template": template,
			"x": 0.3 + 0.1 * i,
			"y": p == 1 ? (template.indexOf("vehicle") != -1 ? 0.88 : 0.82) : (template.indexOf("vehicle") != -1 ? 0.12 : 0.18),
			"order": p == 1 ? "hold" : "advance"
		}));
		settings.generals[p] = { "template": generals[civ] || generals.imperial, "name": "General", "x": 0.5, "y": p == 1 ? 0.93 : 0.07, "order": "hold" };
		settings.support[p] = support[civ] || support.imperial;
	}
	return settings;
};

Trigger.prototype.WH40KSetup = function()
{
	const settings = InitAttributes.settings.WH40K || this.WH40KDemoSettings();
	if (this.wh40k)
		return;

	const mapSize = Engine.QueryInterface(SYSTEM_ENTITY, IID_Terrain).GetMapSize();
	this.wh40k = {
		"settings": settings,
		"mapSize": mapSize,
		"bats": {},
		"entToBat": {},
		"kills": { "1": 0, "2": 0 },
		"support": { "1": {}, "2": {} },
		"command": {},
		"retreating": { "1": 0, "2": 0 },
		"initialMen": { "1": 0, "2": 0 },
		"finished": false,
		"silent": false,
		"start": this.WH40KTime(),
		"nextSupportId": 1
	};

	// Visão de comandante: o desdobramento já mostrou o campo e o inimigo,
	// então a batalha é vista inteira (sem névoa de guerra).
	const cmpRangeManagerReveal = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	if (cmpRangeManagerReveal && typeof cmpRangeManagerReveal.SetLosRevealWholeMapForAll == "function")
		cmpRangeManagerReveal.SetLosRevealWholeMapForAll(true);

	for (const p of [1, 2])
	{
		const cmpPlayer = QueryPlayerIDInterface(p);
		if (cmpPlayer)
		{
			cmpPlayer.SetMaxPopulation(2000);
			cmpPlayer.AddPopulationBonuses(1000);
		}
		const angle = p == 1 ? 0 : Math.PI;
		for (const entry of settings.armies?.[p] || [])
			this.WH40KSpawnBattalion(p, entry, angle);
		const general = settings.generals?.[p];
		if (general)
			this.WH40KSpawnBattalion(p, Object.assign({ "id": "general", "general": true, "strength": 1, "order": general.order || "hold", "category": "general" }, general), angle);

		// Comando invisível na borda do lado do jogador (origem do apoio).
		const civ = QueryPlayerIDInterface(p, IID_Identity)?.GetCiv();
		const template = "special/wh40k/command_" + civ;
		if (Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).TemplateExists(template))
		{
			const ent = Engine.AddEntity(template);
			const cmpPosition = ent != INVALID_ENTITY && Engine.QueryInterface(ent, IID_Position);
			if (cmpPosition)
			{
				cmpPosition.JumpTo(mapSize / 2, p == 1 ? 4 : mapSize - 4);
				Engine.QueryInterface(ent, IID_Ownership).SetOwner(p);
				this.wh40k.command[p] = ent;
			}
		}
		const ready = +(settings.supportReady?.[p] || 0);
		(settings.support?.[p] || []).forEach((power, i) => {
			this.wh40k.support[p][power.type] = {
				"type": power.type,
				"name": power.name,
				"icon": power.icon,
				"desc": power.desc || "",
				"need": Math.max(1, +power.kills || 10),
				"progress": i < ready ? Math.max(1, +power.kills || 10) : 0,
				"uses": 0
			};
		});
	}

	this.DoAfterDelay(1500, "WH40KAfterSpawn", {});
	this.DoRepeatedly(WH40K_DIRECTOR_INTERVAL, "WH40KDirector", {});
	this.DoRepeatedly(WH40K_CHECK_INTERVAL, "WH40KCheck", {});
	this.WH40KNotify("A batalha come\u00e7ou! Os batalh\u00f5es cumprem as ordens do desdobramento. Selecione um batalh\u00e3o para mudar a ordem; baixas inimigas enchem as barras de apoio.");
};

Trigger.prototype.WH40KSpawnBattalion = function(p, entry, angle)
{
	const pos = this.WH40KWorld(+entry.x || 0.5, +entry.y || (p == 1 ? 0.85 : 0.15));
	const ent = Engine.AddEntity(entry.template);
	if (ent == INVALID_ENTITY)
	{
		warn("40k Wars: n\u00e3o foi poss\u00edvel criar '" + entry.template + "'.");
		return;
	}
	const cmpPosition = Engine.QueryInterface(ent, IID_Position);
	cmpPosition.JumpTo(pos.x, pos.z);
	cmpPosition.SetYRotation(angle);
	Engine.QueryInterface(ent, IID_Ownership).SetOwner(p);

	const id = p + ":" + entry.id;
	this.wh40k.bats[id] = {
		"id": id,
		"campaignId": entry.id,
		"player": p,
		"leader": ent,
		"ents": [ent],
		"strength": Math.max(0.05, Math.min(1, entry.strength === undefined ? 1 : +entry.strength)),
		"order": entry.order || "advance",
		"anchor": pos,
		"manual": false,
		"flankDone": false,
		"startAlive": 1,
		"escaped": 0,
		"general": !!entry.general,
		"support": !!entry.support,
		"info": {
			"name": entry.name || "",
			"title": entry.title || "",
			"unitName": entry.unitName || "",
			"portrait": entry.portrait || "",
			"quotes": entry.quotes || []
		}
	};
	this.wh40k.entToBat[ent] = id;
	return id;
};

/** Os soldados já nasceram: corta os que faltam pela força e conta. */
Trigger.prototype.WH40KAfterSpawn = function()
{
	this.wh40k.silent = true;
	for (const id in this.wh40k.bats)
	{
		const bat = this.wh40k.bats[id];
		const cmpLeader = Engine.QueryInterface(bat.leader, IID_BattalionLeader);
		let ents = cmpLeader ? cmpLeader.GetBattalionEntities() : [bat.leader];
		if (cmpLeader && bat.strength < 0.999)
		{
			const keep = Math.max(1, Math.round(ents.length * bat.strength));
			for (const ent of ents.slice(keep))
				if (ent != bat.leader)
					Engine.DestroyEntity(ent);
			ents = ents.slice(0, keep);
		}
		else if (!cmpLeader && bat.strength < 0.999)
		{
			const cmpHealth = Engine.QueryInterface(bat.leader, IID_Health);
			if (cmpHealth)
				cmpHealth.SetHitpoints(Math.max(1, cmpHealth.GetMaxHitpoints() * bat.strength));
		}
		bat.ents = ents.filter(ent => this.WH40KAlive(ent));
		for (const ent of bat.ents)
			this.wh40k.entToBat[ent] = id;
		bat.startAlive = Math.max(1, bat.ents.length);
		this.wh40k.initialMen[bat.player] += this.WH40KMenWeight(bat, bat.ents.length);
	}
	this.wh40k.silent = false;
	this.wh40k.spawned = true;
};

/** Peso de um batalhão na conta de debandada (um veículo vale um pelotão). */
Trigger.prototype.WH40KMenWeight = function(bat, alive)
{
	if (!alive)
		return 0;
	if (bat.general)
		return 2;
	return Engine.QueryInterface(bat.leader, IID_BattalionLeader) || bat.startAlive > 1 ? alive : 6;
};

/** Atualiza os membros (líder promovido, reforços que caíram do céu). */
Trigger.prototype.WH40KRefresh = function()
{
	const w = this.wh40k;
	for (const id in w.bats)
	{
		const bat = w.bats[id];
		bat.ents = bat.ents.filter(ent => this.WH40KAlive(ent));
		if (!this.WH40KAlive(bat.leader) && bat.ents.length)
			bat.leader = bat.ents[0];
	}
	const cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	for (const p of [1, 2])
		for (const ent of cmpRangeManager.GetEntitiesByPlayer(p))
		{
			if (w.entToBat[ent] && w.bats[w.entToBat[ent]]?.ents.indexOf(ent) != -1)
				continue;
			const cmpLeader = Engine.QueryInterface(ent, IID_BattalionLeader);
			if (!cmpLeader || !this.WH40KAlive(ent))
				continue;
			const members = cmpLeader.GetBattalionEntities();
			// Líder novo de um batalhão conhecido (o antigo morreu)?
			let id = members.map(m => w.entToBat[m]).find(b => b && w.bats[b]);
			if (!id)
			{
				// Reforço do apoio (cápsula/teleporta): batalhão novo, avança.
				const name = Engine.QueryInterface(ent, IID_Identity)?.GetGenericName() || "";
				id = this.WH40KSpawnRecord(p, ent, name);
			}
			const bat = w.bats[id];
			bat.leader = ent;
			for (const m of members)
				if (bat.ents.indexOf(m) == -1 && this.WH40KAlive(m))
					bat.ents.push(m);
			for (const m of members)
				w.entToBat[m] = id;
		}
};

Trigger.prototype.WH40KSpawnRecord = function(p, ent, name)
{
	const w = this.wh40k;
	const id = p + ":support_" + w.nextSupportId++;
	const pos = this.WH40KPos(ent);
	w.bats[id] = {
		"id": id, "player": p, "leader": ent, "ents": [ent], "strength": 1, "order": "advance",
		"anchor": pos ? { "x": pos.x, "z": pos.y } : this.WH40KWorld(0.5, 0.5),
		"manual": false, "flankDone": true, "startAlive": 1, "escaped": 0, "support": true,
		"info": { "name": "Refor\u00e7o", "unitName": name, "portrait": "", "quotes": [] }
	};
	return id;
};

// ------------------------------------------------------------ baixas e apoio

Trigger.prototype.WH40KOwnershipChanged = function(msg)
{
	const w = this.wh40k;
	if (!w || w.finished || w.silent || msg.to != INVALID_PLAYER || (msg.from != 1 && msg.from != 2))
		return;
	const cmpIdentity = Engine.QueryInterface(msg.entity, IID_Identity);
	if (!w.entToBat[msg.entity] && (!cmpIdentity || !cmpIdentity.HasClass("Unit") || cmpIdentity.HasClass("Turret")))
		return;
	if (w.escaping && w.escaping[msg.entity])
		return;
	const killer = 3 - msg.from;
	++w.kills[killer];
	for (const type in w.support[killer])
	{
		const power = w.support[killer][type];
		const wasReady = power.progress >= power.need;
		power.progress = Math.min(power.need, power.progress + 1);
		if (!wasReady && power.progress >= power.need)
			this.WH40KNotify("Apoio pronto: " + power.name + "!", [killer]);
	}
};

Trigger.prototype.WH40KPlayerOf = function(ent)
{
	return Engine.QueryInterface(ent, IID_Ownership)?.GetOwner();
};

/** Chamado por AirSupportProvider.IsAvailable (ZZ_WH40KSupport.js). */
Trigger.prototype.WH40KSupportReady = function(ent, type)
{
	const w = this.wh40k;
	if (!w)
		return true;
	const p = this.WH40KPlayerOf(ent);
	const power = w.support[p] && w.support[p][type];
	return !!power && !w.finished && power.progress >= power.need;
};

Trigger.prototype.WH40KSupportUsed = function(ent, type)
{
	const w = this.wh40k;
	const p = this.WH40KPlayerOf(ent);
	const power = w && w.support[p] && w.support[p][type];
	if (!power)
		return;
	power.progress = 0;
	++power.uses;
	this.WH40KNotify(power.name + " a caminho!", [p]);
	this.WH40KNotify("Aten\u00e7\u00e3o: apoio inimigo detectado \u2014 " + power.name + "!", [3 - p]);
};

Trigger.prototype.WH40KUseSupport = function(p, type, x, z)
{
	const ent = this.wh40k?.command[p];
	const cmpProvider = ent && Engine.QueryInterface(ent, IID_AirSupportProvider);
	if (!cmpProvider || !Number.isFinite(x) || !Number.isFinite(z))
		return false;
	return cmpProvider.RequestSupport(type, { "x": x, "z": z }, undefined);
};

// ------------------------------------------------------------ ordens

Trigger.prototype.WH40KSetOrder = function(p, entities, order, all)
{
	const w = this.wh40k;
	if (!w || w.finished)
		return;
	const valid = ["advance", "hold", "flank_left", "flank_right", "reserve", "retreat"];
	if (valid.indexOf(order) == -1)
		return;
	const ids = new Set();
	if (all)
	{
		for (const id in w.bats)
			if (w.bats[id].player == p)
				ids.add(id);
	}
	else
		for (const ent of entities || [])
			if (w.entToBat[ent] && w.bats[w.entToBat[ent]]?.player == p)
				ids.add(w.entToBat[ent]);
	for (const id of ids)
	{
		const bat = w.bats[id];
		bat.order = order;
		bat.manual = false;
		bat.flankDone = false;
		bat.orderTime = this.WH40KTime();
		const pos = this.WH40KPos(bat.leader);
		if (pos && order == "hold")
			bat.anchor = { "x": pos.x, "z": pos.y };
	}
	if (order == "retreat" && all)
		w.retreating[p] = w.retreating[p] || this.WH40KTime();
	this.WH40KDirector();
};

/** Ordem direta do jogador (andar, atacar...): o batalhão sai do plano. */
Trigger.prototype.WH40KManual = function(p, entities)
{
	const w = this.wh40k;
	if (!w || this.wh40kDirecting)
		return;
	for (const ent of entities || [])
	{
		const bat = w.bats[w.entToBat[ent]];
		if (bat && bat.player == p && bat.order != "retreat")
			bat.manual = true;
	}
};

Trigger.prototype.WH40KIssue = function(p, ent, cmd)
{
	ProcessCommand(p, Object.assign({ "entities": [ent], "queued": false }, cmd));
};

Trigger.prototype.WH40KAttackWalk = function(p, ent, pos)
{
	this.WH40KIssue(p, ent, {
		"type": "attack-walk",
		"x": pos.x,
		"z": pos.z,
		"targetClasses": { "attack": ["Unit", "Structure"] },
		"allowCapture": false
	});
};

Trigger.prototype.WH40KWalk = function(p, ent, pos)
{
	this.WH40KIssue(p, ent, { "type": "walk", "x": pos.x, "z": pos.z, "force": true });
};

Trigger.prototype.WH40KBusy = function(ent)
{
	const cmpUnitAI = Engine.QueryInterface(ent, IID_UnitAI);
	const order = cmpUnitAI && cmpUnitAI.order;
	if (!order || order.type != "Attack" || !order.data)
		return false;
	return this.WH40KAlive(order.data.target);
};

Trigger.prototype.WH40KDist = function(a, b)
{
	return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z));
};

Trigger.prototype.WH40KDirector = function()
{
	const w = this.wh40k;
	if (!w || !w.spawned || w.finished)
		return;
	this.WH40KRefresh();
	const centers = { "1": [], "2": [] };
	for (const id in w.bats)
	{
		const bat = w.bats[id];
		const pos = bat.ents.length && this.WH40KPos(bat.leader);
		if (pos)
			centers[bat.player].push({ "x": pos.x, "z": pos.y });
	}
	const now = this.WH40KTime();
	this.wh40kDirecting = true;
	try
	{
		for (const id in w.bats)
		{
			const bat = w.bats[id];
			if (!bat.ents.length || (bat.manual && bat.order != "retreat"))
				continue;
			const p = bat.player;
			const p2 = this.WH40KPos(bat.leader);
			if (!p2)
				continue;
			const pos = { "x": p2.x, "z": p2.y };
			const enemies = centers[3 - p];
			let nearest;
			let nearestDist = Infinity;
			for (const e of enemies)
			{
				const d = this.WH40KDist(pos, e);
				if (d < nearestDist)
				{
					nearestDist = d;
					nearest = e;
				}
			}
			this.WH40KRunOrder(bat, pos, nearest, nearestDist, now);
		}
	}
	finally
	{
		this.wh40kDirecting = false;
	}
};

Trigger.prototype.WH40KRunOrder = function(bat, pos, nearest, nearestDist, now)
{
	const w = this.wh40k;
	const p = bat.player;
	const busy = this.WH40KBusy(bat.leader);
	switch (bat.order)
	{
	case "retreat":
	{
		const edge = { "x": pos.x, "z": p == 1 ? 2 : w.mapSize - 2 };
		if (Math.abs(pos.z - edge.z) < WH40K_EDGE)
			this.WH40KEscape(bat);
		else
			for (const ent of bat.ents)
				this.WH40KWalk(p, ent, { "x": edge.x + (Math.random() - 0.5) * 20, "z": edge.z });
		return;
	}
	case "hold":
	{
		const fromAnchor = this.WH40KDist(pos, bat.anchor);
		if (nearest && this.WH40KDist(nearest, bat.anchor) < WH40K_HOLD_ENGAGE && fromAnchor < WH40K_HOLD_LEASH)
		{
			if (!busy)
				this.WH40KAttackWalk(p, bat.leader, nearest);
		}
		else if (fromAnchor > 12)
			this.WH40KWalk(p, bat.leader, bat.anchor);
		return;
	}
	case "reserve":
	{
		const ownNow = this.WH40KMen(p);
		const weakened = ownNow < w.initialMen[p] * 0.7;
		const threatened = nearest && this.WH40KDist(nearest, bat.anchor) < WH40K_RESERVE_TRIGGER;
		if (weakened || threatened || now - w.start > WH40K_RESERVE_TIMEOUT)
		{
			bat.order = "advance";
			if (bat.player == 1)
				this.WH40KNotify("A reserva (" + (bat.info.name || bat.info.unitName) + ") entrou na batalha!", [1]);
			this.WH40KRunOrder(bat, pos, nearest, nearestDist, now);
		}
		else if (this.WH40KDist(pos, bat.anchor) > 12)
			this.WH40KWalk(p, bat.leader, bat.anchor);
		return;
	}
	case "flank_left":
	case "flank_right":
	{
		if (!bat.flankDone)
		{
			// Esquerda de quem olha para o inimigo: oeste para o sul (1), leste para o norte (2).
			const side = (bat.order == "flank_left" ? -1 : 1) * (p == 1 ? 1 : -1);
			const target = {
				"x": Math.max(20, Math.min(w.mapSize - 20, w.mapSize / 2 + side * w.mapSize * 0.36)),
				"z": w.mapSize / 2 + (p == 1 ? -1 : 1) * w.mapSize * 0.04
			};
			if (this.WH40KDist(pos, target) < 30 || nearestDist < 45)
				bat.flankDone = true;
			else
			{
				if (!busy)
					this.WH40KWalk(p, bat.leader, target);
				return;
			}
		}
		// depois do flanco, avança
	}
	// falls through
	case "advance":
	default:
		if (nearest && !busy)
			this.WH40KAttackWalk(p, bat.leader, nearest);
	}
};

/** O batalhão saiu pela borda: escapou (volta à campanha). */
Trigger.prototype.WH40KEscape = function(bat)
{
	const w = this.wh40k;
	w.escaping = w.escaping || {};
	bat.escaped += bat.ents.length;
	for (const ent of bat.ents)
	{
		w.escaping[ent] = true;
		Engine.DestroyEntity(ent);
	}
	bat.ents = [];
};

/** Soldados (com peso) de um lado ainda no campo. */
Trigger.prototype.WH40KMen = function(p)
{
	let men = 0;
	for (const id in this.wh40k.bats)
	{
		const bat = this.wh40k.bats[id];
		if (bat.player == p && !bat.support)
			men += this.WH40KMenWeight(bat, bat.ents.length);
	}
	return men;
};

// ------------------------------------------------------------ fim

Trigger.prototype.WH40KRetreatAll = function(p, reason)
{
	const w = this.wh40k;
	if (w.retreating[p])
		return;
	w.retreating[p] = this.WH40KTime();
	for (const id in w.bats)
		if (w.bats[id].player == p)
		{
			w.bats[id].order = "retreat";
			w.bats[id].manual = false;
		}
	if (reason == "rout")
		this.WH40KNotify(p == 1 ? "Seu ex\u00e9rcito est\u00e1 debandando! Os sobreviventes fogem para a borda sul." : "O inimigo debanda! Persiga-os antes que fujam pela borda norte.");
};

Trigger.prototype.WH40KCheck = function()
{
	const w = this.wh40k;
	if (!w || !w.spawned || w.finished)
		return;
	this.WH40KRefresh();
	const now = this.WH40KTime();
	const onField = {};
	for (const p of [1, 2])
	{
		onField[p] = 0;
		for (const id in w.bats)
			if (w.bats[id].player == p)
				onField[p] += w.bats[id].ents.length;
	}
	for (const p of [1, 2])
	{
		// Quem ainda está no campo muito depois de mandar recuar é capturado.
		if (w.retreating[p] && now - w.retreating[p] > WH40K_RETREAT_TIMEOUT && onField[p])
		{
			for (const id in w.bats)
				if (w.bats[id].player == p)
				{
					for (const ent of w.bats[id].ents)
						Engine.DestroyEntity(ent);
					w.bats[id].ents = [];
				}
			onField[p] = 0;
		}
	}
	if (!onField[1] || !onField[2])
	{
		// Os dois sem ninguém: perde quem debandou (ou o jogador).
		const loser = !onField[1] && !onField[2] ? (w.retreating[2] && !w.retreating[1] ? 2 : 1) : !onField[1] ? 1 : 2;
		this.WH40KFinish(3 - loser);
		return;
	}
	for (const p of [1, 2])
	{
		const men = this.WH40KMen(p);
		const other = this.WH40KMen(3 - p);
		if (!w.retreating[p] && men <= w.initialMen[p] * WH40K_ROUT_FRACTION && other >= 2 * men)
			this.WH40KRetreatAll(p, "rout");
	}
};

Trigger.prototype.WH40KResult = function(winner)
{
	const w = this.wh40k;
	const result = { "winner": winner, "battalions": { "1": {}, "2": {} }, "generals": { "1": undefined, "2": undefined }, "kills": w.kills, "supportUsed": {} };
	for (const id in w.bats)
	{
		const bat = w.bats[id];
		if (bat.support)
			continue;
		const alive = bat.ents.filter(ent => this.WH40KAlive(ent));
		let strength;
		const cmpLeader = alive.length && Engine.QueryInterface(alive[0], IID_BattalionLeader);
		if (bat.startAlive <= 1 && alive.length && !cmpLeader)
		{
			const cmpHealth = Engine.QueryInterface(alive[0], IID_Health);
			strength = cmpHealth ? cmpHealth.GetHitpoints() / cmpHealth.GetMaxHitpoints() : bat.strength;
		}
		else if (bat.startAlive <= 1 && bat.escaped)
			strength = bat.strength;
		else
			strength = bat.strength * (alive.length + bat.escaped) / bat.startAlive;
		strength = Math.max(0, Math.min(1, strength));
		if (bat.general)
			result.generals[bat.player] = strength > 0;
		else
			result.battalions[bat.player][bat.campaignId] = Math.round(strength * 1000) / 1000;
	}
	for (const p of [1, 2])
		for (const type in w.support[p])
			result.supportUsed[p] = (result.supportUsed[p] || 0) + w.support[p][type].uses;
	return result;
};

Trigger.prototype.WH40KFinish = function(winner)
{
	const w = this.wh40k;
	if (w.finished)
		return;
	w.result = this.WH40KResult(winner);
	w.finished = true;
	const loser = 3 - winner;
	this.WH40KNotify(winner == 1 ? "VIT\u00d3RIA! O campo \u00e9 seu." : "DERROTA. O inimigo domina o campo.");
	QueryPlayerIDInterface(loser)?.Defeat(markForTranslation("%(player)s perdeu a batalha."));
	const cmpWinner = QueryPlayerIDInterface(winner);
	if (cmpWinner && cmpWinner.GetState() == "active")
		cmpWinner.Win(markForTranslation("%(player)s venceu a batalha."));
};

/** Plano de batalha e apoio, para a interface (GuiInterface.GetWH40KBattleState). */
Trigger.prototype.WH40KGuiState = function(player)
{
	const w = this.wh40k;
	if (!w)
		return null;
	const ents = {};
	const bats = {};
	for (const id in w.bats)
	{
		const bat = w.bats[id];
		if (bat.player != player)
			continue;
		for (const ent of bat.ents)
			ents[ent] = id;
		bats[id] = {
			"order": bat.order,
			"manual": bat.manual,
			"general": bat.general,
			"alive": bat.ents.length,
			"start": bat.startAlive,
			"info": bat.info
		};
	}
	// Centro do exército (a interface põe a câmera aqui no começo).
	let cx = 0;
	let cz = 0;
	let n = 0;
	for (const id in bats)
	{
		const pos = this.WH40KPos(w.bats[id].leader);
		if (pos && w.bats[id].ents.length)
		{
			cx += pos.x;
			cz += pos.y;
			++n;
		}
	}
	const support = [];
	for (const type in w.support[player] || {})
	{
		const s = w.support[player][type];
		support.push({ "type": type, "name": s.name, "icon": s.icon, "desc": s.desc, "need": s.need, "progress": s.progress, "ready": s.progress >= s.need });
	}
	return {
		"player": player,
		"ents": ents,
		"bats": bats,
		"support": support,
		"kills": w.kills,
		"men": { "1": this.WH40KMen(1), "2": this.WH40KMen(2) },
		"initialMen": w.initialMen,
		"retreating": w.retreating,
		"finished": w.finished,
		"center": n ? { "x": cx / n, "z": cz / n * 0.55 + w.mapSize * 0.5 * 0.45 } : null,
		"command": w.command[player]
	};
};

/** Resultado para a campanha (GuiInterface.GetCampaignGameEndData). */
Trigger.prototype.OnCampaignGameEnd = function()
{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	const w = cmpTrigger.wh40k;
	if (!w)
		return {};
	return { "wh40k": w.result || cmpTrigger.WH40KResult(2) };
};

{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.DoAfterDelay(0, "WH40KSetup", {});
	cmpTrigger.RegisterTrigger("OnOwnershipChanged", "WH40KOwnershipChanged", { "enabled": true });
}
