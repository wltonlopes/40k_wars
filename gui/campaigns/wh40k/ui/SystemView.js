/**
 * Vista do sistema estelar: a estrela no centro, órbitas dos planetas,
 * planetas e luas (globos gerados), frotas em órbita ou viajando.
 * Clique num corpo: seleciona (de novo: abre o mapa). Clique direito com
 * uma frota selecionada: viajar para lá.
 */
const WH40K_MOON_SPREAD = 3.2;

class WH40KSystemView
{
	constructor(page)
	{
		this.page = page;
	}

	/** Posição na tela (px dentro de systemView) de um corpo. */
	screenPos(id)
	{
		const D = this.page.D;
		const body = D.bodies[id];
		if (body.parent)
		{
			const parent = this.screenPos(body.parent);
			const a = body.angle * Math.PI / 180;
			return { "x": parent.x + Math.cos(a) * body.orbit * this.R * WH40K_MOON_SPREAD, "y": parent.y + Math.sin(a) * body.orbit * this.R * WH40K_MOON_SPREAD };
		}
		const p = D.bodyPos(id);
		return { "x": this.cx + p.x * this.R, "y": this.cy + p.y * this.R };
	}

	bodyRadius(id)
	{
		return 16 + this.page.D.bodies[id].size * 34;
	}

	render()
	{
		const page = this.page;
		const D = page.D;
		const g = page.game;
		const size = gui("systemView").getComputedSize();
		const w = size.right - size.left;
		const h = size.bottom - size.top;
		this.cx = w / 2;
		this.cy = h / 2 + 10;
		this.R = Math.min(w / 2, h / 2) / 0.53;

		gui("sysTitle").caption = D.sector.system.name;
		const fleet = page.selectedFleet();
		gui("sysHint").caption = fleet && fleet.faction == page.player ?
			"Frota " + fleet.name + " selecionada: clique com o botão direito num planeta ou lua para viajar." :
			"Clique num planeta para ver seus detalhes; clique de novo para abrir o mapa. Selecione uma frota para movê-la.";

		const star = Math.min(w, h) * 0.2;
		setSize(gui("sysStar"), this.cx - star / 2, this.cy - star / 2, this.cx + star / 2, this.cy + star / 2);
		gui("sysStar").tooltip = "Estrela " + D.sector.system.star.name;

		const bodies = D.sector.bodies;
		const tops = bodies.filter(b => !b.parent);
		for (let i = 0; i < 12; ++i)
		{
			const orbit = gui("sysOrbit[" + i + "]");
			orbit.hidden = i >= tops.length;
			if (orbit.hidden)
				continue;
			const r = tops[i].orbit * this.R;
			setSize(orbit, this.cx - r, this.cy - r, this.cx + r, this.cy + r);
			orbit.sprite = "color:200 175 120 60:textureAsMask:campaigns/wh40k/system/orbit.png";
		}

		this.bodyIndex = {};
		bodies.forEach((body, i) => {
			if (i >= 12)
				return;
			this.bodyIndex[body.id] = i;
			const pos = this.screenPos(body.id);
			const r = this.bodyRadius(body.id);
			const btn = gui("sysBody[" + i + "]");
			btn.hidden = false;
			setSize(btn, pos.x - r, pos.y - r, pos.x + r, pos.y + r);
			btn.sprite = "stretched:campaigns/wh40k/planets/" + body.id + "/globe.png";
			btn.sprite_over = btn.sprite;
			btn.tooltip = this.bodyTooltip(body);
			btn.onPress = () => {
				if (page.sel && page.sel.type == "body" && page.sel.id == body.id)
					page.showPlanet(body.id);
				else
				{
					page.body = body.id;
					page.select({ "type": "body", "id": body.id });
				}
			};
			btn.onPressRight = () => page.orderBody(body.id);
			// Barra de domínio: cor de quem tem mais províncias.
			const owners = {};
			for (const pid of body.landProvinces)
			{
				const o = g.province(pid).owner || "neutral";
				owners[o] = (owners[o] || 0) + 1;
			}
			const top = Object.keys(owners).sort((a, b) => owners[b] - owners[a])[0];
			gui("sysBodyOwner[" + i + "]").sprite = "color:" + rgbStr(D.factionColor(top == "neutral" ? null : top), 230);
			const label = gui("sysBodyLabel[" + i + "]");
			label.hidden = false;
			label.caption = body.name + "\n" + colored(body.class, [180, 170, 150]);
			setSize(label, pos.x - 110, pos.y + r + 2, pos.x + 110, pos.y + r + 40);
		});
		for (let i = bodies.length; i < 12; ++i)
		{
			gui("sysBody[" + i + "]").hidden = true;
			gui("sysBodyLabel[" + i + "]").hidden = true;
		}

		// Seleção.
		const halo = gui("sysHalo");
		const selBody = page.sel && page.sel.type == "body" ? page.sel.id : null;
		halo.hidden = !selBody;
		if (selBody)
		{
			const p = this.screenPos(selBody);
			const r = this.bodyRadius(selBody) * 1.45;
			setSize(halo, p.x - r, p.y - r, p.x + r, p.y + r);
		}
		this.renderFleets();
	}

	bodyTooltip(body)
	{
		const g = this.page.game;
		const D = this.page.D;
		const counts = {};
		for (const pid of body.landProvinces)
		{
			const o = g.province(pid).owner;
			counts[o || ""] = (counts[o || ""] || 0) + 1;
		}
		const owners = Object.keys(counts).map(o => colored(D.factionName(o || null), D.factionColor(o || null)) + ": " + counts[o]).join(", ");
		const fleets = g.fleetsAt(body.id).map(f => colored(f.name, D.factionColor(f.faction)) + " (" + f.ships + ")").join(", ");
		return body.name + " — " + body.class + "\n" + body.desc + "\n\nProvíncias: " + owners + (fleets ? "\nEm órbita: " + fleets : "") + "\n\nClique: selecionar. Clique de novo: abrir o mapa.";
	}

	renderFleets()
	{
		const page = this.page;
		const g = page.game;
		const D = page.D;
		const fleets = Object.values(g.s.fleets);
		const perBody = {};
		let routeDot = 0;
		fleets.slice(0, 24).forEach((fleet, i) => {
			const btn = gui("sysFleet[" + i + "]");
			btn.hidden = false;
			let pos;
			if (fleet.body)
			{
				const k = perBody[fleet.body] = (perBody[fleet.body] || 0) + 1;
				const base = this.screenPos(fleet.body);
				const r = this.bodyRadius(fleet.body);
				const a = -Math.PI / 2 - 0.9 + k * 0.9;
				pos = { "x": base.x + Math.cos(a) * (r + 26), "y": base.y + Math.sin(a) * (r + 26) };
			}
			else
			{
				const from = this.screenPos(fleet.from || fleet.dest);
				const to = this.screenPos(fleet.dest);
				const total = Math.max(1, D.travelTurns(fleet.from || fleet.dest, fleet.dest));
				const t = 1 - fleet.eta / total;
				pos = { "x": from.x + (to.x - from.x) * t, "y": from.y + (to.y - from.y) * t };
			}
			const selected = page.sel && page.sel.type == "fleet" && page.sel.id == fleet.id;
			const scale = (1 + Math.min(1, fleet.ships / 6) * 0.6) * (selected ? 1.2 : 1);
			const fs = 56 * scale;
			setSize(btn, pos.x - fs / 2, pos.y - fs / 2, pos.x + fs / 2, pos.y + fs / 2);
			btn.sprite = shipSprite(D, fleet.faction, fleet.ships);
			btn.sprite_over = btn.sprite;
			const label = gui("sysFleetLabel[" + i + "]");
			label.caption = fleet.ships + (fleet.cargo.length ? " +" + fleet.cargo.length : "");
			label.textcolor = rgbStr(selected ? [255, 225, 120] : D.factionColor(fleet.faction));
			btn.tooltip = this.fleetTooltip(fleet);
			btn.onPress = () => page.select({ "type": "fleet", "id": fleet.id });
			btn.onPressRight = () => {
				const mine = page.selectedFleet();
				// Frota inimiga com uma frota sua selecionada: atacar.
				if (mine && mine.faction == page.player && page.game.hostile(fleet.faction, page.player))
					page.attackFleet(fleet);
				else if (fleet.body)
					page.orderBody(fleet.body);
			};
			// Rota da frota selecionada (ou em viagem própria): pontos até o destino.
			if (fleet.dest && fleet.faction == page.player && (selected || !fleet.body))
			{
				const to = this.screenPos(fleet.dest);
				const steps = 5;
				for (let s = 1; s <= steps && routeDot < 12; ++s)
				{
					const dot = gui("sysRoute[" + routeDot++ + "]");
					const x = pos.x + (to.x - pos.x) * s / (steps + 1);
					const y = pos.y + (to.y - pos.y) * s / (steps + 1);
					dot.hidden = false;
					setSize(dot, x - 4, y - 4, x + 4, y + 4);
					dot.sprite = "color:255 220 120 220:textureAsMask:campaigns/wh40k/icons/disc.png";
				}
			}
		});
		for (let i = Math.min(24, fleets.length); i < 24; ++i)
			gui("sysFleet[" + i + "]").hidden = true;
		for (let i = routeDot; i < 12; ++i)
			gui("sysRoute[" + i + "]").hidden = true;
	}

	fleetTooltip(fleet)
	{
		const g = this.page.game;
		const D = this.page.D;
		let where = fleet.body ? "Em órbita de " + D.bodies[fleet.body].name : "Em trânsito";
		if (fleet.dest)
			where += " → " + D.bodies[fleet.dest].name + " (" + fleet.eta + " turno" + (fleet.eta > 1 ? "s" : "") + ")";
		const cargo = fleet.cargo.map(aid => g.s.armies[aid]).filter(Boolean).map(a => {
			const gen = g.general(a);
			return (gen ? gen.name : "Exército") + " (" + a.battalions.length + " bat.)";
		});
		return colored(fleet.name, D.factionColor(fleet.faction)) + " — " + D.factionName(fleet.faction) +
			"\n" + fleet.ships + " nave" + (fleet.ships > 1 ? "s" : "") + " de guerra. " + where +
			(cargo.length ? "\nA bordo: " + cargo.join(", ") : "") +
			(fleet.faction == this.page.player ? "\n\nClique: selecionar. Depois, botão direito num corpo: viajar; numa frota inimiga: atacar." :
				g.hostile(fleet.faction, this.page.player) ? "\n\n" + colored("Botão direito (com uma frota sua selecionada): atacar esta frota.", [250, 150, 110]) : "");
	}
}
