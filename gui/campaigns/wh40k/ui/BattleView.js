/**
 * Batalha 2D em tempo real, no mesmo campo do desdobramento (deployView).
 *
 * Os batalhões são os marcadores com o retrato do líder: andam, atiram
 * (clarões nos alvos), lutam corpo a corpo (faíscas), perdem força (barra)
 * e somem ao morrer (explosão ou sangue). O apoio killstreak cai do céu
 * (cápsulas, bombardeiros, lança e bombardeio orbital).
 *
 * Controles:
 *   clique num batalhão seu   seleciona (o líder aparece e diz uma frase)
 *   botão direito no campo    o selecionado vai até lá e segura a posição
 *   botão direito no inimigo  o selecionado ataca aquele batalhão
 *   painel                    ordens, ordens gerais, apoio, velocidade
 *   apoio pronto              clique no poder e depois no alvo (botão direito cancela)
 */
const WH40K_TOKEN_R = { "infantry": 15, "vehicle": 18, "air": 15, "general": 20 };
const WH40K_SPEEDS = [1, 2, 4];

class WH40KBattleView
{
	constructor(page)
	{
		this.page = page;
		this.fx = new WH40KFxPool("battleFx", 40);
	}

	get active()
	{
		return !!this.combat;
	}

	open(setup, deployment)
	{
		this.setup = setup;
		this.combat = new WH40KCombat(setup.combatOptions(deployment, this.page.deploy.rect ? this.page.deploy.rect.aspect : 1.6));
		this.fx.clear();
		this.speedIndex = 0;
		this.paused = false;
		this.targeting = null;
		this.selected = null;
		this.quote = null;
		this.aiTimer = 0;
		this.panelTimer = 0;
		this.endTimer = null;
		this.lastTick = Date.now();
		this.featuresVersion = 0;
		this.seenMessages = 0;
		const first = this.combat.alive(1).find(u => !u.general) || this.combat.alive(1)[0];
		if (first)
			this.select(first);
		this.combat.message(1, "A batalha por " + setup.pdef.name + " começou!");
	}

	close()
	{
		this.combat = null;
		this.fx.clear();
		gui("battleHud").hidden = true;
		gui("battleMsg").hidden = true;
		gui("battleCursor").hidden = true;
	}

	get rect()
	{
		return this.page.deploy.rect;
	}

	select(u)
	{
		this.selected = u ? u.id : null;
		this.quote = u && u.quotes && u.quotes.length ? pickFrom(u.quotes) : null;
		this.panelTimer = 0;
	}

	selectedUnit()
	{
		const u = this.selected && this.combat.unit(this.selected, 1);
		return u && u.state == "alive" ? u : null;
	}

	// ------------------------------------------------------------ desenho

	/** Desenho completo (page.refresh). */
	render()
	{
		const page = this.page;
		const deploy = page.deploy;
		// O campo, o terreno e as feições vêm do desdobramento.
		deploy.render();
		gui("deployEnemyZone").hidden = true;
		gui("deployOwnZone").hidden = true;
		gui("deployHint").caption = "Clique: selecionar · botão direito: mover / atacar o inimigo · painel: ordens, apoio e velocidade.";
		gui("deployTitle").caption = "Batalha — " + this.setup.pdef.name + " · " + WH40K_WEATHER[this.setup.weather()].name;
		gui("deployTitle").size = "12 6 100%-444 34";
		gui("battleHud").hidden = false;
		gui("battleMsg").hidden = false;
		this.drawUnits();
		this.renderPanel();
	}

	/** Tique da página: simula e anima. */
	tick(now)
	{
		if (!this.combat)
			return;
		const dt = Math.min(0.1, (now - this.lastTick) / 1000);
		this.lastTick = now;
		const c = this.combat;
		if (!this.paused && !c.over && !this.page.dialog.isOpen())
		{
			const total = dt * WH40K_SPEEDS[this.speedIndex];
			const steps = Math.ceil(total / 0.05);
			for (let i = 0; i < steps && !c.over; ++i)
			{
				c.step(total / steps);
				this.aiTimer += total / steps;
				if (this.aiTimer >= 1)
				{
					this.aiTimer = 0;
					c.aiSupport(2);
					c.aiOrders(2);
				}
			}
		}
		this.consumeEvents();
		this.fx.tick(now);
		this.drawUnits();
		this.drawHud();
		this.drawCursor();
		this.panelTimer -= dt;
		if (this.panelTimer <= 0)
		{
			this.panelTimer = 0.3;
			this.renderPanel();
		}
		if (c.over && this.endTimer === null)
			this.endTimer = now + 1800;
		if (this.endTimer !== null && now >= this.endTimer && !this.page.dialog.isOpen())
		{
			this.endTimer = Infinity;
			this.showResult();
		}
	}

	tokenSize(u)
	{
		const scale = this.rect ? Math.max(0.9, Math.min(1.4, this.rect.h / 560)) : 1;
		const r = (WH40K_TOKEN_R[u.category] || 15) * scale;
		return r + (u.side == 1 && u.id == this.selected ? 4 : 0);
	}

	drawUnits()
	{
		const c = this.combat;
		const r = this.rect;
		if (!c || !r)
			return;
		const D = this.page.D;
		const enemyColor = D.factionColor(this.setup.factionOf(this.setup.enemyRole));
		for (const side of [1, 2])
		{
			const list = c.units.filter(u => u.side == side);
			const prefix = side == 1 ? "deployToken" : "deployEnemy";
			for (let i = 0; i < WH40K_TOKENS; ++i)
			{
				const btn = gui(prefix + "[" + i + "]");
				const u = list[i];
				if (!u || u.state != "alive")
				{
					btn.hidden = true;
					continue;
				}
				btn.hidden = false;
				const t = this.tokenSize(u);
				const px = u.x * r.s;
				const py = u.y * r.s;
				setSize(btn, px - t, py - t, px + t, py + t);
				setTokenSprite(prefix, i, u.portrait, side, side == 1 ? D.factionColor(this.page.player) : enemyColor);
				const bar = gui(prefix + "Bar[" + i + "]");
				bar.hidden = false;
				const frac = Math.max(0, Math.min(1, u.hp));
				bar.size = "1 100%-5 " + Math.max(2, Math.round(1 + (2 * t - 2) * frac)) + " 100%-1";
				if (side == 1)
					bar.sprite = "color:" + (frac > 0.6 ? "90 200 90" : frac > 0.3 ? "230 190 70" : "230 80 60") + " 255";
				gui(prefix + "Hit[" + i + "]").hidden = c.time - u.lastHit > 0.15;
				if (side == 1)
				{
					const label = gui("deployTokenOrder[" + i + "]");
					const name = u.order == "move" ? "Mover" : u.order == "attack" ? "Atacar" : WH40K_ORDERS[u.order]?.name || u.order;
					// Só o selecionado mostra a ordem (os outros estão no painel), para não amontoar.
					label.caption = u.id == this.selected ? colored("> " + name, [255, 220, 110]) : "";
					btn.tooltip = u.unitName + (u.general ? "" : "\n" + u.name) + " · " + percent(u.hp) + "\nOrdem: " + name;
					btn.onPress = () => {
						this.select(u);
						this.renderPanel();
					};
					btn.onPressRight = () => {};
				}
				else
				{
					btn.tooltip = colored(u.unitName, enemyColor) + (u.general ? "" : "\n" + u.name) + " · " + percent(u.hp) + "\n\nBotão direito: o seu batalhão selecionado ataca este.";
					btn.onPress = () => {
						if (this.targeting !== null)
							this.firePower(u.x, u.y);
					};
					btn.onPressRight = () => this.attackTarget(u);
				}
			}
		}
		const sel = this.selectedUnit();
		const ring = gui("deploySelRing");
		ring.hidden = !sel;
		if (sel)
		{
			const t = this.tokenSize(sel) + 6;
			setSize(ring, sel.x * r.s - t, sel.y * r.s - t, sel.x * r.s + t, sel.y * r.s + t);
			ring.sprite = "color:255 215 90 255:textureAsMask:campaigns/wh40k/icons/ring.png";
		}
	}

	drawHud()
	{
		const c = this.combat;
		const p1 = c.sidePower(1) / Math.max(1, c.sides[1].initial);
		const p2 = c.sidePower(2) / Math.max(1, c.sides[2].initial);
		gui("battleBar1").size = rel(50 - 50 * Math.min(1, p1), 4) + " 4 50% 100%-4";
		gui("battleBar2").size = "50% 4 " + rel(50 + 50 * Math.min(1, p2), -4) + " 100%-4";
		const time = Math.floor(c.time);
		const left = Math.max(0, WH40K_COMBAT.timeLimit - time);
		gui("battleHudText").caption = "Você " + percent(p1) + "   " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") +
			(this.paused ? "  PAUSA" : WH40K_SPEEDS[this.speedIndex] > 1 ? "  x" + WH40K_SPEEDS[this.speedIndex] : "") + "   Inimigo " + percent(p2);
		gui("battleHudText").tooltip = "Força restante de cada lado. Tempo até o fim: se acabar, o defensor segura a província (a menos que o atacante tenha o dobro da força).";
		const msgs = c.messages.filter(m => c.time - m.time < 10).slice(-5);
		gui("battleMsg").caption = msgs.map(m => colored(m.text, m.side == 1 ? (m.minor ? [200, 220, 180] : [150, 230, 120]) : (m.minor ? [230, 190, 170] : [250, 130, 100]))).join("\n");
	}

	drawCursor()
	{
		const cursor = gui("battleCursor");
		if (this.targeting === null || !this.rect)
		{
			cursor.hidden = true;
			return;
		}
		const r = this.rect;
		const x = g_MouseX - r.absX;
		const y = g_MouseY - r.absY;
		if (x < 0 || y < 0 || x > r.w || y > r.h)
		{
			cursor.hidden = true;
			return;
		}
		let radius;
		if (this.targeting === "ability")
		{
			const g = this.combat.generalOf(1);
			radius = (g && g.ability.type == "smite" ? g.ability.radius || 0.08 : 0.06) * r.s;
		}
		else
		{
			const p = this.combat.sides[1].powers[this.targeting];
			radius = (p.type == "orbital_saturation" ? 0.16 : p.type == "strategic_bomber" ? 0.15 : 0.06) * r.s;
		}
		cursor.hidden = false;
		setSize(cursor, x - radius, y - radius, x + radius, y + radius);
		cursor.sprite = "color:255 70 50 255:textureAsMask:campaigns/wh40k/icons/ring.png";
	}

	/** Eventos da simulação -> efeitos. */
	consumeEvents()
	{
		const c = this.combat;
		const r = this.rect;
		if (!r)
		{
			c.events = [];
			return;
		}
		const s = r.s;
		let shots = 0;
		// Muralhas que caíram viram ruínas na tela.
		if (c.featuresVersion != this.featuresVersion)
		{
			this.featuresVersion = c.featuresVersion;
			c.features.forEach((f, i) => {
				if (i >= 48)
					return;
				const obj = gui("deployFeature[" + i + "]");
				obj.sprite = "stretched:campaigns/wh40k/battle/" + f.type + ".png";
				// Trincheiras cavadas durante a batalha: posição e dica.
				if (f.dug && obj.hidden)
				{
					obj.hidden = false;
					setSize(obj, (f.x - f.r) * s, (f.y - f.r) * s, (f.x + f.r) * s, (f.y + f.r) * s);
					obj.tooltip = WH40K_FEATURE_NAMES.trench + "\n" + terrainTooltip(null, "", ["trench"]);
				}
			});
		}
		for (const ev of c.events)
		{
			this.page.sound.battleEvent(ev, this.page.D);
			const x = ev.x * s;
			const y = ev.y * s;
			const jitter = () => (Math.random() - 0.5) * s * 0.025;
			switch (ev.type)
			{
			case "shot":
				if (shots++ < 6)
					this.fx.play("impact", x + jitter(), y + jitter(), s * (ev.category == "vehicle" ? 0.045 : 0.03));
				break;
			case "melee":
				if (shots++ < 6)
					this.fx.play("clash", x + jitter(), y + jitter(), s * 0.06);
				break;
			case "death":
				if (ev.category == "vehicle" || ev.category == "air" || ev.category == "general")
					this.fx.play("explosion", x, y, s * 0.1);
				else
					this.fx.play("blood", x, y, s * 0.06);
				this.fx.play("smoke", x, y + s * 0.01, s * 0.07, { "loops": 2 });
				break;
			case "ability":
			{
				const tint = { "smite": [190, 120, 255], "warcry": [255, 120, 60], "shield": [120, 200, 255], "heal": [120, 255, 140], "inspire": [255, 220, 110], "teleport": [180, 220, 255] }[ev.kind] || [255, 255, 255];
				const size = Math.max(0.08, (ev.radius || 0.1) * 2) * s;
				this.fx.play("ring", x, y, size, { "tint": tint, "loops": 2 });
				if (ev.kind == "smite")
					this.fx.play("explosion", x, y, size * 0.6);
				break;
			}
			case "entrench":
				this.fx.play("smoke", x, y, s * 0.06, { "loops": 1 });
				break;
			case "wallbreak":
				this.fx.play("explosion", x, y, s * 0.12);
				this.fx.play("smoke", x, y, s * 0.1, { "loops": 3 });
				break;
			case "droppod":
				if (ev.reinforce)
				{
					this.fx.play("ring", x, y, s * 0.08, { "tint": ev.side == 1 ? [120, 230, 120] : [240, 90, 70] });
					break;
				}
				// Teleporta, teia e portais são um clarão na cor da facção (dropFx); os outros caem em cápsulas.
				const dropFx = this.page.D.factions[this.setup.factionOf(ev.side == 1 ? this.setup.playerRole : this.setup.enemyRole)]?.dropFx;
				if (dropFx)
					this.fx.play("ring", x, y, s * 0.12, { "tint": dropFx, "loops": 2 });
				else
					this.fx.play("droppod", x, y, s * 0.075);
				break;
			case "explosion":
				this.fx.play("explosion", x, y, (ev.size || 0.05) * s * 1.8);
				break;
			case "impact":
				this.fx.play("explosion", x, y, (ev.size || 0.05) * s * 1.3);
				break;
			case "laser":
				this.fx.play("laser", x, y, s * 0.06, { "loops": 3 });
				break;
			case "orbital":
				this.fx.play("orbital", x, y, s * 0.08);
				break;
			case "spawn":
				this.fx.play("ring", x, y, s * 0.1, { "tint": ev.unit.side == 1 ? [120, 230, 120] : [240, 90, 70] });
				break;
			}
		}
		c.events = [];
	}

	// ------------------------------------------------------------ comandos

	fieldPoint()
	{
		const r = this.rect;
		if (!r)
			return null;
		const x = (g_MouseX - r.absX) / r.s;
		const y = (g_MouseY - r.absY) / r.s;
		if (x < 0 || x > this.combat.A || y < 0 || y > 1)
			return null;
		return { "x": x, "y": y };
	}

	onFieldClick()
	{
		const p = this.fieldPoint();
		if (!p || !this.combat)
			return;
		if (this.targeting !== null)
			this.firePower(p.x, p.y);
	}

	onFieldRightClick()
	{
		if (!this.combat)
			return;
		if (this.targeting !== null)
		{
			this.targeting = null;
			this.renderPanel();
			return;
		}
		const p = this.fieldPoint();
		const u = this.selectedUnit();
		if (!p || !u)
			return;
		this.combat.setOrder(u, "move", p);
		this.fx.play("ring", p.x * this.rect.s, p.y * this.rect.s, 28, { "tint": [120, 230, 120] });
		this.renderPanel();
	}

	attackTarget(enemy)
	{
		const u = this.selectedUnit();
		if (!u || !this.combat)
			return;
		this.combat.setOrder(u, "attack", { "id": enemy.id });
		this.fx.play("ring", enemy.x * this.rect.s, enemy.y * this.rect.s, 40, { "tint": [255, 80, 60] });
		this.renderPanel();
	}

	firePower(x, y)
	{
		const i = this.targeting;
		this.targeting = null;
		if (i === "ability")
		{
			if (this.combat.useAbility(1, x, y))
				this.fx.play("ring", x * this.rect.s, y * this.rect.s, this.rect.s * 0.12, { "tint": [210, 170, 250] });
			this.renderPanel();
			return;
		}
		if (i !== null && this.combat.usePower(1, i, x, y))
			this.fx.play("ring", x * this.rect.s, y * this.rect.s, this.rect.s * 0.12, { "tint": [255, 200, 90] });
		this.renderPanel();
	}

	order(order)
	{
		const u = this.selectedUnit();
		if (u)
			this.combat.setOrder(u, order);
		this.renderPanel();
	}

	/** Resolve o resto da batalha sem animação (sair, ou pular para o fim). */
	fastForward()
	{
		const c = this.combat;
		let guard = 0;
		while (!c.over && guard++ < 4000)
		{
			c.step(0.25);
			this.aiTimer += 0.25;
			if (this.aiTimer >= 1)
			{
				this.aiTimer = 0;
				c.aiSupport(2);
				c.aiOrders(2);
			}
		}
		c.events = [];
	}

	/** O jogador abandona o campo: retirada geral e o resto se resolve sozinho. */
	abandon()
	{
		if (!this.combat)
			return null;
		if (!this.combat.over)
		{
			this.combat.retreatAll(1);
			this.fastForward();
		}
		return this.finishNow();
	}

	finishNow()
	{
		const res = this.combat.result();
		const report = this.setup.applyCombat(res);
		this.close();
		return report;
	}

	showResult()
	{
		const c = this.combat;
		const won = c.winner == 1;
		const res = c.result();
		const lost1 = c.units.filter(u => u.side == 1 && !u.temp && u.state == "dead").length;
		const lost2 = c.units.filter(u => u.side == 2 && !u.temp && u.state == "dead").length;
		const hero = c.units.filter(u => u.side == 1 && !u.temp).sort((a, b) => b.kills - a.kills)[0];
		this.page.dialog.open({
			"title": won ? "VITÓRIA EM " + tr(this.setup.pdef.name).toUpperCase() : "DERROTA EM " + tr(this.setup.pdef.name).toUpperCase(),
			"text": colored(c.endText, won ? [150, 230, 120] : [240, 110, 90]) + "\n\n" +
				"Baixas causadas: você " + res.kills[1] + " · inimigo " + res.kills[2] + "\n" +
				"Batalhões perdidos: seus " + lost1 + " · do inimigo " + lost2 + "\n" +
				(hero && hero.kills > 0 ? "Destaque: " + hero.name + " (" + hero.unitName + "), " + Math.round(hero.kills) + " baixas.\n" : "") +
				"Poderes de apoio usados: " + (c.sides[1].powers.reduce((n, p) => n + p.uses, 0)) + ".",
			"portrait": hero ? portraitSprite(hero.portrait) : null,
			"buttons": [{ "caption": (this.page.skirmishMode ? "Continuar" : "Voltar à campanha"), "onPress": () => this.page.finishBattle(this.finishNow()) }]
		});
	}

	// ------------------------------------------------------------ painel

	renderPanel()
	{
		if (!this.combat)
			return;
		const c = this.combat;
		const page = this.page;
		const u = this.selectedUnit();
		const rows = [];
		// Poder do general (no topo da lista).
		const gen = c.generalOf(1);
		if (gen)
		{
			const a = gen.ability;
			const ready = c.abilityReady(1);
			const wait = Math.max(0, Math.ceil(gen.abilityReady - c.time));
			const aimed = a.type == "smite" || a.type == "teleport";
			rows.push({
				"icon": portraitSprite(gen.portrait, !ready),
				"bar": ready ? 1 : 1 - wait / (a.cooldown || 50),
				"text": (this.targeting === "ability" ? colored("> ", [255, 220, 110]) : "") + colored(a.name, [210, 170, 250]) + "\n" +
					colored(ready ? (this.targeting === "ability" ? "Clique no alvo (botão direito cancela)" : aimed ? "PRONTO — clique para mirar" : "PRONTO — clique para usar") : "Recarga: " + wait + " s", ready ? [255, 210, 100] : [190, 180, 160]),
				"tooltip": gen.unitName + " — " + a.name + "\n" + a.desc + "\nRecarga: " + (a.cooldown || 50) + " s.",
				"selected": this.targeting === "ability",
				"onPress": () => {
					if (!ready)
						return;
					if (aimed)
						this.targeting = this.targeting === "ability" ? null : "ability";
					else
						c.useAbility(1);
					this.renderPanel();
				}
			});
		}
		c.sides[1].powers.forEach((p, i) => {
			const ready = p.charge >= p.kills;
			rows.push({
				"icon": portraitSprite(p.icon, !ready),
				"bar": p.charge / p.kills,
				"text": (this.targeting === i ? colored("> ", [255, 220, 110]) : "") + p.name + "\n" +
					colored(ready ? (this.targeting === i ? "Clique no alvo (botão direito cancela)" : "PRONTO — clique para mirar") : "Baixas: " + Math.floor(p.charge) + "/" + p.kills, ready ? [255, 210, 100] : [190, 180, 160]),
				"tooltip": p.desc,
				"selected": this.targeting === i,
				"onPress": () => {
					if (ready)
						this.targeting = this.targeting === i ? null : i;
					this.renderPanel();
				}
			});
		});
		for (const o of c.alive(1))
			rows.push({
				"icon": portraitSprite(o.portrait),
				"bar": o.hp,
				"text": o.unitName + "\n" + colored((o.general ? "General" : o.name) + " · " + (o.order == "move" ? "Mover" : o.order == "attack" ? "Atacar" : WH40K_ORDERS[o.order]?.name), [190, 180, 160]),
				"selected": u && o.id == u.id,
				"onPress": () => {
					this.select(o);
					this.renderPanel();
				}
			});
		const orderBtn = order => ({
			"caption": WH40K_ORDERS[order].name,
			"tooltip": WH40K_ORDERS[order].desc,
			"enabled": !!u && u.order != order && !c.sides[1].routing,
			"onPress": () => this.order(order)
		});
		const actions = [
			orderBtn("advance"), orderBtn("hold"), orderBtn("flank_left"), orderBtn("flank_right"), orderBtn("reserve"), orderBtn("retreat"),
			{ "caption": "Ataque Geral", "tooltip": "Todos avançam contra o inimigo.", "enabled": !c.sides[1].routing, "onPress": () => { c.orderAll(1, "advance"); c.message(1, "Ataque geral!"); this.renderPanel(); } },
			{ "caption": "Segurar Linha", "tooltip": "Todos param e seguram onde estão.", "enabled": !c.sides[1].routing, "onPress": () => { c.orderAll(1, "hold"); c.message(1, "Segurem a linha!"); this.renderPanel(); } },
			{ "caption": "RETIRADA!", "tooltip": "Todos fogem para a borda sul. Quem sai do campo escapa; a batalha está perdida.", "onPress": () => { c.retreatAll(1); this.renderPanel(); } },
			{ "caption": "Velocidade x" + WH40K_SPEEDS[this.speedIndex], "tooltip": "Clique: muda a velocidade da batalha (x1, x2, x4).", "onPress": () => { this.speedIndex = (this.speedIndex + 1) % WH40K_SPEEDS.length; this.renderPanel(); } },
			{ "caption": this.paused ? "Continuar" : "Pausar", "tooltip": "Pausado, você ainda pode dar ordens.", "onPress": () => { this.paused = !this.paused; this.renderPanel(); } },
			{ "caption": "Resolver o resto", "tooltip": "Pula para o fim da batalha, com as ordens atuais.", "enabled": !c.over, "onPress": () => { this.fastForward(); this.renderPanel(); } }
		];
		const status = c.sides[1].routing ? colored("Suas tropas debandaram!", [250, 110, 90]) :
			c.sides[2].routing ? colored("O inimigo debanda!", [150, 230, 120]) :
			"Força: você " + percent(c.sidePower(1) / Math.max(1, c.sides[1].initial)) + " · inimigo " + percent(c.sidePower(2) / Math.max(1, c.sides[2].initial));
		page.side.show({
			"portrait": u ? portraitSprite(u.portrait) : null,
			"card": u ? (u.general ? { "general": u.gid } : { "unit": u.unit, "strength": u.hp, "leader": u.name }) : null,
			"title": u ? (u.general ? u.name : u.name) : "Batalha",
			"subtitle": u ? (u.general ? "General" : u.unitName) + " · " + percent(u.hp) : this.setup.pdef.name,
			"quote": u ? this.quote : null,
			"text": (u ? "Ordem: " + (u.order == "move" ? "Mover até o ponto" : u.order == "attack" ? "Atacar o alvo" : WH40K_ORDERS[u.order]?.name) + " · baixas causadas: " + Math.floor(u.kills) + "\n" : "") +
				(u ? colored("Terreno: ", [235, 205, 125]) + (c.modsOf(u).notes.join(", ") || "sem efeito") + "\n" : "") +
				status + (this.targeting !== null ? "\n" + colored("Apoio: clique no alvo no campo. Botão direito cancela.", [255, 210, 100]) : ""),
			"textHeight": 78,
			"rows": rows,
			"actions": actions
		});
	}
}
