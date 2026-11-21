/**
 * Batalha espacial (mapa de frotas): quando uma batalha espacial do fim do
 * turno envolve o jogador, as duas frotas aparecem frente a frente diante do
 * planeta, trocam tiros e as naves perdidas explodem. O resultado já foi
 * decidido pela campanha (Game.spaceBattles: report.fleetBattle com as naves
 * antes e depois de cada lado); a vista só o encena. "Pular" vai direto ao
 * relatório.
 */
const WH40K_SPACE_SHIPS = 16;
const WH40K_SPACE_BOLTS = 48;
const WH40K_SPACE_TIME = 14;

class WH40KSpaceView
{
	constructor(page)
	{
		this.page = page;
		this.fx = new WH40KFxPool("spaceFx", 24);
		gui("spaceSkip").onPress = () => this.finish();
	}

	open(report)
	{
		const page = this.page;
		const fb = report.fleetBattle;
		this.report = report;
		this.prevView = page.view == "space" ? this.prevView : page.view;
		page.view = "space";
		this.t = 0;
		this.last = Date.now();
		this.done = false;
		this.bolts = [];
		this.fx.clear();
		// Naves de cada lado (no máximo 16 na tela); as perdas proporcionais.
		this.ships = [];
		fb.sides.forEach((side, s) => {
			const shown = Math.max(1, Math.min(WH40K_SPACE_SHIPS, side.before));
			const lost = side.before ? Math.round(shown * (side.before - side.after) / side.before) : 0;
			const order = [];
			for (let i = 0; i < shown; ++i)
				order.push(i);
			// As que morrem: sorteadas, a capitânia (0) por último.
			order.sort(() => Math.random() - 0.5);
			const dying = new Set(order.filter(i => i != 0).slice(0, lost));
			if (lost >= shown)
				dying.add(0);
			for (let i = 0; i < shown; ++i)
			{
				const col = Math.floor(i / 4);
				const row = i % 4;
				this.ships.push({
					"side": s,
					"faction": side.faction,
					// Formação: colunas a partir da borda, a capitânia na frente.
					"x": s == 0 ? 0.08 + col * 0.075 : 0.92 - col * 0.075,
					"y": 0.2 + row * 0.13 + (col % 2) * 0.05,
					"size": i == 0 ? 3 : 1 + (i % 3 == 0 ? 1 : 0),
					"alive": true,
					"dieAt": dying.has(i) ? 3 + Math.random() * (WH40K_SPACE_TIME - 5) : Infinity,
					"nextShot": 0.5 + Math.random() * 1.5
				});
			}
		});
		this.page.sound.play("horn", true);
		page.refresh();
	}

	rect()
	{
		const size = gui("spaceView").getComputedSize();
		return { "w": size.right - size.left, "h": size.bottom - size.top };
	}

	render()
	{
		const fb = this.report.fleetBattle;
		const D = this.page.D;
		const r = this.rect();
		const ps = r.h * 0.9;
		gui("spacePlanet").sprite = "stretched:campaigns/wh40k/planets/" + fb.body + "/globe.png";
		// O planeta embaixo, só o arco de cima à vista; as frotas lutam acima dele.
		setSize(gui("spacePlanet"), r.w / 2 - ps / 2, r.h * 1.18 - ps / 2, r.w / 2 + ps / 2, r.h * 1.18 + ps / 2);
		gui("spaceTitle").caption = "Batalha espacial — " + D.bodies[fb.body].name;
		this.draw();
	}

	pos(ship, t)
	{
		const r = this.rect();
		// Avançam devagar para o centro nos primeiros segundos e balançam.
		const adv = Math.min(1, t / 4) * 0.12 * (ship.side == 0 ? 1 : -1);
		return { "x": (ship.x + adv) * r.w, "y": (ship.y + 0.012 * Math.sin(t * 1.3 + ship.x * 9)) * r.h };
	}

	shipPx(ship)
	{
		return this.rect().h * [0.07, 0.09, 0.11, 0.15][ship.size];
	}

	draw()
	{
		const D = this.page.D;
		const fb = this.report.fleetBattle;
		const t = this.t;
		this.ships.forEach((ship, i) => {
			const obj = gui("spaceShip[" + i + "]");
			obj.hidden = !ship.alive;
			if (!ship.alive)
				return;
			const p = this.pos(ship, t);
			const s = this.shipPx(ship);
			// Proa contra proa: o lado da esquerda aponta para a direita e vice-versa.
			obj.sprite = "stretched:campaigns/wh40k/ships/" + (D.factions[ship.faction]?.ships || "imperial") + "_" + ship.size + (ship.side == 0 ? "_r" : "_l") + ".png";
			setSize(obj, p.x - s / 2, p.y - s / 2, p.x + s / 2, p.y + s / 2);
		});
		for (let i = this.ships.length; i < 2 * WH40K_SPACE_SHIPS; ++i)
			gui("spaceShip[" + i + "]").hidden = true;
		const alive = s => this.ships.filter(x => x.side == s && x.alive).length;
		gui("spaceHud").caption = fb.sides.map((side, s) => colored(D.factionName(side.faction), D.factionColor(side.faction)) + ": " + alive(s) + " naves").join("   ×   ");
	}

	tick(now)
	{
		if (this.done)
			return;
		// Tempo acumulado com passo limitado: travadas não pulam a batalha.
		const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
		this.last = now;
		this.t += dt;
		const t = this.t;
		const r = this.rect();
		for (const ship of this.ships)
		{
			if (!ship.alive)
				continue;
			if (t >= ship.dieAt)
			{
				ship.alive = false;
				const p = this.pos(ship, t);
				this.fx.play("explosion", p.x, p.y, this.shipPx(ship) * 1.6);
				this.page.sound.play("explosion");
				continue;
			}
			ship.nextShot -= dt;
			if (ship.nextShot <= 0 && t < WH40K_SPACE_TIME - 1)
			{
				ship.nextShot = 0.7 + Math.random() * 1.3;
				const targets = this.ships.filter(x => x.side != ship.side && x.alive);
				if (targets.length)
				{
					const target = pickFrom(targets);
					const from = this.pos(ship, t);
					this.bolts.push({ "x0": from.x, "y0": from.y, "target": target, "t0": t, "dur": 0.45, "tint": ship.side == 0 ? [255, 210, 120] : [140, 230, 255] });
					this.page.sound.play(Math.random() < 0.5 ? "las" : "cannon");
				}
			}
		}
		// Tiros: discos que voam até o alvo e viram impacto.
		this.bolts = this.bolts.filter(b => {
			const k = (t - b.t0) / b.dur;
			const to = this.pos(b.target, t);
			if (k >= 1)
			{
				this.fx.play("impact", to.x + (Math.random() - 0.5) * 20, to.y + (Math.random() - 0.5) * 20, this.shipPx(b.target) * 0.6, { "tint": b.tint });
				return false;
			}
			b.x = b.x0 + (to.x - b.x0) * k;
			b.y = b.y0 + (to.y - b.y0) * k;
			return true;
		}).slice(-WH40K_SPACE_BOLTS);
		for (let i = 0; i < WH40K_SPACE_BOLTS; ++i)
		{
			const obj = gui("spaceBolt[" + i + "]");
			const b = this.bolts[i];
			obj.hidden = !b;
			if (!b)
				continue;
			const s = Math.max(6, r.h * 0.012);
			obj.sprite = "color:" + rgbStr(b.tint, 255) + ":textureAsMask:campaigns/wh40k/icons/disc.png";
			setSize(obj, b.x - s, b.y - s, b.x + s, b.y + s);
		}
		this.fx.tick(now);
		this.draw();
		if (t >= WH40K_SPACE_TIME && (!this.fx.busy() || t >= WH40K_SPACE_TIME + 2))
			this.finish();
	}

	finish()
	{
		if (this.done)
			return;
		this.done = true;
		this.fx.clear();
		// Vista de teste (guishot): repete a batalha para as capturas.
		if (this.debugLoop)
		{
			const report = this.report;
			this.open(report);
			return;
		}
		for (let i = 0; i < WH40K_SPACE_BOLTS; ++i)
			gui("spaceBolt[" + i + "]").hidden = true;
		const page = this.page;
		page.view = this.prevView && this.prevView != "space" ? this.prevView : "system";
		page.refresh();
		page.showReport(this.report);
	}
}
