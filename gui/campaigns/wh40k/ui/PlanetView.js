/**
 * Mapa de um corpo celeste: províncias (máscaras pintadas com a cor do
 * dono e usadas como área de clique), rótulos, ícones de colmeia, forte e
 * estaleiro, guarnição, exércitos (retrato do general num anel da cor da
 * facção) e, com um exército selecionado, os destinos possíveis.
 * Barra superior: frotas em órbita.
 */
class WH40KPlanetView
{
	constructor(page)
	{
		this.page = page;
	}

	render(bodyId)
	{
		const page = this.page;
		const g = page.game;
		const D = page.D;
		const body = D.bodies[bodyId];
		const size = gui("planetView").getComputedSize();
		const W = size.right - size.left;
		const H = size.bottom - size.top;
		const top = 36;
		const bottom = H - 24;
		const aspect = body.mapSize[0] / body.mapSize[1];
		let mw = W - 16;
		let mh = mw / aspect;
		if (mh > bottom - top)
		{
			mh = bottom - top;
			mw = mh * aspect;
		}
		const mx = (W - mw) / 2;
		const my = top + (bottom - top - mh) / 2;
		this.rect = { "x": mx, "y": my, "w": mw, "h": mh };
		this.viewW = W;
		const map = gui("planetMap");
		setSize(map, mx, my, mx + mw, my + mh);
		map.sprite = "stretched:campaigns/wh40k/planets/" + bodyId + "/map.png";

		const army = page.selectedArmy();
		const targets = army && army.faction == page.player ? (army.fleet ? g.landTargets(army) : g.armyTargets(army)) : {};
		const fleet = page.selectedFleet();
		const bombarding = fleet && page.side.mode == "bombard";
		const selProv = page.sel && page.sel.type == "province" ? page.sel.id : null;

		const provs = body.landProvinces;
		this.index = {};
		// Exércitos por província (a pilha nome + ícones + exércitos cabe inteira no mapa).
		this.armyCount = {};
		for (const a of Object.values(g.s.armies))
			if (a.province && D.provinces[a.province].body == bodyId)
				this.armyCount[a.province] = (this.armyCount[a.province] || 0) + 1;
		this.anchors = {};
		this.viewW = W;
		this.layoutAnchors(body.landProvinces.slice(0, 24));
		provs.forEach((pid, i) => {
			if (i >= 24)
				return;
			this.index[pid] = i;
			const def = D.provinces[pid];
			const st = g.province(pid);
			const [x0, y0, x1, y1] = def.rect;
			const btn = gui("prov[" + i + "]");
			btn.hidden = false;
			setSize(btn, mx + x0 * mw, my + y0 * mh, mx + x1 * mw, my + y1 * mh);
			const mask = "campaigns/wh40k/planets/" + bodyId + "/p_" + pid + ".png";
			// Devastada (saque ou bombardeio): a cor do dono fica queimada.
			let color = st.devastated > 0 ? D.factionColor(st.owner).map((c, k) => Math.round(c * 0.45 + [110, 35, 10][k] * 0.55)) : D.factionColor(st.owner);
			let alpha = selProv == pid ? 150 : st.owner ? 95 : 55;
			if (page.threatMode)
			{
				// Ameaça: 0 (verde) .. 1 (vermelho).
				const t = this.threat(pid);
				color = [Math.round(60 + 195 * t), Math.round(200 - 150 * t), 60];
				alpha = selProv == pid ? 170 : 125;
			}
			btn.sprite = "color:" + rgbStr(color, alpha) + ":textureAsMask:" + mask;
			btn.sprite_over = "color:" + rgbStr(color.map(c => Math.min(255, c + 50)), alpha + 50) + ":textureAsMask:" + mask;
			btn.mouse_event_mask = "texture:" + mask;
			btn.tooltip = (page.threatMode ? colored(this.threatText(pid), [250, 200, 120]) + "\n" : "") + this.provinceTooltip(pid, targets[pid], bombarding);
			btn.onPress = () => page.select({ "type": "province", "id": pid });
			btn.onPressRight = () => page.orderProvince(pid);

			// Ponto do rótulo: a pilha inteira (nome, ícones, alvo e exércitos) fica dentro do mapa.
			const { "x": lx, "y": ly } = this.anchors[pid] || this.anchor(pid, W);
			// Nome numa placa escura do tamanho do texto (fonte menor em mapas pequenos).
			const small = mw < 900;
			const charW = small ? 6.9 : 7.9;
			const half = Math.max(36, tr(def.name).length * charW / 2 + 6);
			const label = gui("provLabel[" + i + "]");
			label.hidden = false;
			label.caption = def.name;
			label.font = small ? "sans-bold-stroke-12" : "sans-bold-stroke-13";
			setSize(label, lx - half, ly - 30, lx + half, ly - 12);
			const plate = gui("provPlate[" + i + "]");
			plate.hidden = false;
			setSize(plate, lx - half, ly - 29, lx + half, ly - 13);

			// Ícones: colmeia, forte, estaleiro e a guarnição.
			let ix = lx - 34;
			const icon = (name, show, maskName, rgb) => {
				const obj = gui(name + "[" + i + "]");
				obj.hidden = !show;
				if (!show)
					return;
				setSize(obj, ix, ly - 12, ix + 18, ly + 6);
				obj.sprite = "color:" + rgbStr(rgb, 255) + ":textureAsMask:campaigns/wh40k/icons/" + maskName + ".png";
				ix += 20;
			};
			icon("provHive", !!def.hive, "hive", def.hive == 2 ? [255, 200, 110] : [220, 200, 170]);
			icon("provFort", st.forts > 0, "fort", [200, 200, 210]);
			icon("provYard", g.hasShipyard(pid), "shipyard", [150, 200, 255]);
			const garrison = gui("provGarrison[" + i + "]");
			garrison.hidden = !st.garrison.length;
			garrison.caption = "G" + st.garrison.length;
			setSize(garrison, ix, ly - 13, ix + 40, ly + 7);

			// Destino do exército / alvo do bombardeio.
			const target = gui("provTarget[" + i + "]");
			const kind = bombarding ? (!g.canBombard(fleet, pid) ? "attack" : null) : targets[pid];
			target.hidden = !kind;
			if (kind)
			{
				setSize(target, lx - 14, ly + 6, lx + 14, ly + 34);
				target.sprite = kind == "attack" ?
					"color:240 70 50 255:textureAsMask:campaigns/wh40k/icons/battle.png" :
					"color:110 230 110 255:textureAsMask:campaigns/wh40k/icons/arrow.png";
			}
		});
		for (let i = provs.length; i < 24; ++i)
			for (const n of ["prov", "provPlate", "provLabel", "provHive", "provFort", "provYard", "provGarrison", "provTarget"])
				gui(n + "[" + i + "]").hidden = true;

		this.renderArmies(bodyId);
		this.renderOrbit(bodyId);

		let hint = "Clique: selecionar. Botão direito: dar a ordem ao exército ou à frota selecionada.";
		if (army && army.faction == page.player)
			hint = army.fleet ? "Exército embarcado: botão direito numa província para desembarcar (verde) ou assaltar do espaço (vermelho)." :
				army.moves > 0 ? "Botão direito numa província vizinha: marchar (verde) ou atacar (vermelho). Movimentos: " + army.moves : "Este exército já se moveu neste turno.";
		else if (bombarding)
			hint = "Bombardeio orbital: botão direito numa província inimiga (vermelho).";
		gui("planetHint").caption = hint;
	}

	provinceTooltip(pid, targetKind, bombarding)
	{
		const g = this.page.game;
		const D = this.page.D;
		const def = D.provinces[pid];
		const st = g.province(pid);
		let text = def.name + " — " + WH40K_TERRAIN_NAMES[def.terrain] + "\n" + colored(D.factionName(st.owner), D.factionColor(st.owner));
		text += "\nRendimento: " + g.provinceIncome(pid) + (def.hive == 2 ? " · Cidade-colmeia" : def.hive ? " · Cidade" : "") + (g.hasShipyard(pid) ? " · Estaleiro" : "") + (st.forts ? " · Fortes " + st.forts : "") +
			(st.owner && g.hasOrder(st.owner) ? " · Ordem " + g.orderOf(pid) : "") + (g.buildingsOf(pid).length ? "\nConstruções: " + g.buildingsOf(pid).map(b => WH40K_BUILDINGS[b].name).join(", ") : "");
		if (st.devastated > 0)
			text += "\n" + colored("Devastada: mais " + st.devastated + " turno(s) com rendimento reduzido", [240, 140, 60]);
		if (st.garrison.length)
			text += "\nGuarnição: " + st.garrison.map(b => g.unit(b).name).join(", ");
		const armies = g.armiesAt(pid);
		if (armies.length)
			text += "\nExércitos: " + armies.map(a => colored(g.general(a)?.name || "Exército", D.factionColor(a.faction)) + " (" + a.battalions.length + ")").join(", ");
		if (targetKind == "attack")
			text += "\n\n" + colored("Botão direito: ATACAR (defesa " + Math.round(g.defensePower(pid, this.page.player)) + ")", [250, 120, 90]);
		else if (targetKind == "move")
			text += "\n\n" + colored("Botão direito: marchar para cá", [140, 230, 120]);
		else if (bombarding)
			text += "\n\n" + colored("Botão direito: bombardeio orbital", [230, 150, 230]);
		return text;
	}

	/**
	 * Âncora da pilha da província (centro do rótulo): presa dentro do mapa,
	 * contando a largura do nome e dos exércitos e a altura até o último
	 * retrato, e fora dos botões do canto superior direito.
	 */
	/**
	 * Calcula as âncoras de todas as províncias e afasta as pilhas que se
	 * sobrepõem (mapas pequenos: estações, luas), sempre dentro do mapa.
	 */
	layoutAnchors(pids)
	{
		const boxes = pids.map(pid => Object.assign({ "pid": pid }, this.anchor(pid, this.viewW)));
		const { x: mx, y: my, w: mw, h: mh } = this.rect;
		for (let iter = 0; iter < 40; ++iter)
		{
			let moved = false;
			for (let i = 0; i < boxes.length; ++i)
				for (let j = i + 1; j < boxes.length; ++j)
				{
					const a = boxes[i];
					const b = boxes[j];
					const ox = a.half + b.half + 6 - Math.abs(a.x - b.x);
					const oy = Math.min(a.y + a.below, b.y + b.below) - Math.max(a.y - a.above, b.y - b.above) + 6;
					if (ox <= 0 || oy <= 0)
						continue;
					moved = true;
					// Afasta pelo eixo de menor sobreposição, metade para cada lado.
					if (oy * 1.5 < ox)
					{
						const d = oy / 2 + 1;
						const s = a.y <= b.y ? -1 : 1;
						a.y += s * d;
						b.y -= s * d;
					}
					else
					{
						const d = ox / 2 + 1;
						const s = a.x <= b.x ? -1 : 1;
						a.x += s * d;
						b.x -= s * d;
					}
				}
			for (const b of boxes)
			{
				b.x = Math.max(mx + b.half + 4, Math.min(mx + mw - b.half - 4, b.x));
				b.y = Math.max(my + b.above + 4, Math.min(my + mh - b.below - 4, b.y));
			}
			if (!moved)
				break;
		}
		for (const b of boxes)
			this.anchors[b.pid] = b;
	}

	anchor(pid, viewW)
	{
		if (this.anchors[pid])
			return this.anchors[pid];
		const def = this.page.D.provinces[pid];
		const { x: mx, y: my, w: mw, h: mh } = this.rect;
		const n = Math.min(4, this.armyCount[pid] || 0);
		const charW = mw < 900 ? 6.9 : 7.9;
		const half = Math.max(40, tr(def.name).length * charW / 2 + 6, n * 46 / 2 + 4);
		const above = 32;
		const below = n ? 30 + 30 : 36;
		const m = 4;
		let x = Math.max(mx + half + m, Math.min(mx + mw - half - m, mx + def.label[0] * mw));
		let y = Math.max(my + above + m, Math.min(my + mh - below - m, my + def.label[1] * mh));
		// Botões "Mapa de ameaça"/"Desfazer" no canto superior direito da vista.
		const btnBottom = gui("planetUndoBtn").hidden ? 70 : 102;
		if (x + half > viewW - 184 && y - above < btnBottom)
			y = Math.min(my + mh - below - m, btnBottom + above);
		return this.anchors[pid] = { "x": x, "y": y, "half": half, "above": above, "below": below };
	}

	renderArmies(bodyId)
	{
		const page = this.page;
		const g = page.game;
		const D = page.D;
		const { x: mx, y: my, w: mw, h: mh } = this.rect;
		const armies = Object.values(g.s.armies).filter(a => a.province && D.provinces[a.province].body == bodyId);
		const perProv = {};
		armies.slice(0, 16).forEach((army, i) => {
			const def = D.provinces[army.province];
			const k = perProv[army.province] = (perProv[army.province] || 0) + 1;
			const n = Math.min(4, this.armyCount[army.province] || 1);
			const a = this.anchor(army.province, this.viewW);
			// Exércitos lado a lado, centrados sob o nome (até 4 por província; o resto empilha).
			const cx = a.x + ((k - 1) % 4 - (n - 1) / 2) * 46;
			const cy = a.y + 30 + Math.floor((k - 1) / 4) * 6;
			const r = 22;
			const selected = page.sel && page.sel.type == "army" && page.sel.id == army.id;
			const ring = gui("armyRing[" + i + "]");
			ring.hidden = false;
			const rr = selected ? r + 7 : r + 3;
			setSize(ring, cx - rr, cy - rr, cx + rr, cy + rr);
			ring.sprite = "color:" + rgbStr(selected ? [255, 215, 90] : D.factionColor(army.faction), 255) + ":textureAsMask:campaigns/wh40k/icons/" + (selected ? "disc" : "ring") + ".png";
			const btn = gui("army[" + i + "]");
			btn.hidden = false;
			setSize(btn, cx - r, cy - r, cx + r, cy + r);
			const general = g.general(army);
			const portrait = general ? general.portrait : (army.battalions[0] ? g.unit(army.battalions[0]).portrait : D.unitsOf(army.faction)[0].portrait);
			btn.sprite = portraitSprite(portrait);
			btn.sprite_over = portraitSprite(portrait);
			gui("armyCount[" + i + "]").caption = army.battalions.length + (army.faction == page.player && army.moves > 0 ? " •" : "");
			btn.tooltip = colored(general ? general.title + " " + general.name : "Exército sem general", D.factionColor(army.faction)) +
				"\n" + army.battalions.length + " batalhões · força " + Math.round(g.armyPower(army, "attack")) +
				(army.faction == page.player ? "\nMovimentos: " + army.moves : "");
			btn.onPress = () => page.select({ "type": "army", "id": army.id });
			btn.onPressRight = () => page.orderProvince(army.province);
		});
		for (let i = Math.min(16, armies.length); i < 16; ++i)
		{
			gui("army[" + i + "]").hidden = true;
			gui("armyRing[" + i + "]").hidden = true;
		}
	}

	renderOrbit(bodyId)
	{
		const page = this.page;
		const g = page.game;
		const D = page.D;
		const body = D.bodies[bodyId];
		const fleets = g.fleetsAt(bodyId);
		const control = g.orbitalControl(bodyId, page.player);
		const enemy = g.hostileFleetAt(bodyId, page.player);
		let text = body.name + " (" + body.class + ") — órbita: ";
		text += !fleets.length ? "vazia" : control ? colored("sob seu controle", [140, 230, 120]) : enemy && fleets.some(f => f.faction == page.player) ? colored("disputada", [250, 200, 90]) : colored("inimiga", [250, 120, 90]);
		gui("orbitText").caption = text;
		const own = fleets.filter(f => f.faction == page.player);
		for (let i = 0; i < 4; ++i)
		{
			const btn = gui("orbitFleet[" + i + "]");
			btn.hidden = i >= own.length;
			if (btn.hidden)
				continue;
			const fleet = own[i];
			setSize(btn, 0, 3, 0, 31);
			btn.size = rel(100, -410 + i * 102) + " 3 " + rel(100, -312 + i * 102) + " 31";
			const nm = tr(fleet.name);
			btn.caption = nm.length > 12 ? nm.slice(0, 11) + "." : nm;
			btn.tooltip = page.system.fleetTooltip(fleet);
			btn.onPress = () => page.select({ "type": "fleet", "id": fleet.id });
		}
	}

	/** Ameaça da província para o jogador (0..1): suas, perigo de ataque; das outras, dificuldade de tomá-la. */
	threat(pid)
	{
		const g = this.page.game;
		const me = this.page.player;
		const prov = g.province(pid);
		const enemyNear = [pid].concat(g.pdef(pid).neighbors).flatMap(n => g.hostileArmiesAt(n, me)).reduce((s, a) => s + g.armyPower(a, "attack"), 0);
		if (g.friendly(prov.owner, me))
		{
			const def = g.garrisonPower(pid) + g.armiesAt(pid).filter(a => g.friendly(a.faction, me)).reduce((s, a) => s + g.armyPower(a, "defense"), 0);
			return Math.max(0, Math.min(1, enemyNear / Math.max(1, def * 2)));
		}
		const mine = [pid].concat(g.pdef(pid).neighbors).flatMap(n => g.armiesAt(n, me)).reduce((s, a) => Math.max(s, g.armyPower(a, "attack")), 0);
		return Math.max(0, Math.min(1, g.defensePower(pid, me) / Math.max(1, mine * 1.5)));
	}

	threatText(pid)
	{
		const g = this.page.game;
		const t = this.threat(pid);
		const own = g.friendly(g.province(pid).owner, this.page.player);
		const level = t > 0.66 ? "alta" : t > 0.33 ? "média" : "baixa";
		return own ? "Ameaça " + level + " (" + percent(t) + ")" : "Dificuldade de tomar: " + level + " (" + percent(t) + ")";
	}
}
