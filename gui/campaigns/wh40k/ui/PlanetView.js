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
			const color = st.devastated > 0 ? D.factionColor(st.owner).map((c, k) => Math.round(c * 0.45 + [110, 35, 10][k] * 0.55)) : D.factionColor(st.owner);
			const alpha = selProv == pid ? 150 : st.owner ? 95 : 55;
			btn.sprite = "color:" + rgbStr(color, alpha) + ":textureAsMask:" + mask;
			btn.sprite_over = "color:" + rgbStr(color.map(c => Math.min(255, c + 50)), alpha + 50) + ":textureAsMask:" + mask;
			btn.mouse_event_mask = "texture:" + mask;
			btn.tooltip = this.provinceTooltip(pid, targets[pid], bombarding);
			btn.onPress = () => page.select({ "type": "province", "id": pid });
			btn.onPressRight = () => page.orderProvince(pid);

			// Ponto do rótulo; o nome não sai das bordas do mapa.
			const halfName = Math.max(36, def.name.length * (mw < 900 ? 6.3 : 7.2) / 2 + 6);
			const lx = Math.max(mx + halfName, Math.min(mx + mw - halfName, mx + def.label[0] * mw));
			// Abaixo da barra da órbita (34 px) e acima da dica do rodapé.
			const ly = Math.max(my + 66, Math.min(my + mh - 30, my + def.label[1] * mh));
			// Nome numa placa escura do tamanho do texto (fonte menor em mapas pequenos).
			const small = mw < 900;
			const charW = small ? 6.3 : 7.2;
			const half = Math.max(36, def.name.length * charW / 2 + 6);
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
			icon("provYard", !!def.shipyard, "shipyard", [150, 200, 255]);
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
		text += "\nRendimento: " + g.provinceIncome(pid) + (def.hive == 2 ? " · Cidade-colmeia" : def.hive ? " · Cidade" : "") + (def.shipyard ? " · Estaleiro" : "") + (st.forts ? " · Fortes " + st.forts : "");
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
			const cx = mx + def.label[0] * mw + (k - 1) * 46 - (k > 1 ? 0 : 0);
			const cy = my + def.label[1] * mh + 30;
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
			btn.caption = fleet.name.length > 12 ? fleet.name.slice(0, 11) + "." : fleet.name;
			btn.tooltip = page.system.fleetTooltip(fleet);
			btn.onPress = () => page.select({ "type": "fleet", "id": fleet.id });
		}
	}
}
