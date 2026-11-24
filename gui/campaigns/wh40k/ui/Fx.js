/**
 * Efeitos animados (sprites em quadros, gerados por tools/art/gen_fx.py).
 *
 * Um WH40KFxPool controla N objetos de imagem (prefixo[n]) dentro de uma
 * vista; play() pega um objeto livre e anima a sequência de quadros no
 * ponto (x, y) em pixels da vista. loop() mantém um efeito em laço até
 * clearLoops(). O tique vem do onTick da página (WH40KPage.tick).
 *
 * Eventos da campanha (s.events, ver WH40KGame.event) viram efeitos nas
 * províncias: bombardeio orbital, saque, batalha, conquista, desembarque;
 * províncias devastadas ficam pegando fogo.
 */
const WH40K_FX = {
	"explosion": { "frames": 12, "fps": 16, "aspect": 1, "anchorY": 0.52 },
	"impact": { "frames": 6, "fps": 22, "aspect": 1, "anchorY": 0.5 },
	"blood": { "frames": 6, "fps": 12, "aspect": 1, "anchorY": 0.5 },
	"orbital": { "frames": 14, "fps": 10, "aspect": 0.5, "anchorY": 186 / 256 },
	"droppod": { "frames": 10, "fps": 9, "aspect": 0.5, "anchorY": 205 / 256 },
	"fire": { "frames": 8, "fps": 11, "aspect": 1, "anchorY": 104 / 128 },
	"smoke": { "frames": 8, "fps": 8, "aspect": 1, "anchorY": 0.88 },
	"ring": { "frames": 10, "fps": 14, "aspect": 1, "anchorY": 0.5 },
	"clash": { "frames": 10, "fps": 14, "aspect": 1, "anchorY": 0.5 },
	"laser": { "frames": 10, "fps": 9, "aspect": 0.25, "anchorY": 236 / 256 }
};

function fxFrame(kind, i, tint)
{
	const file = "campaigns/wh40k/fx/" + kind + "_" + (i < 10 ? "0" : "") + i + ".png";
	return tint ? "color:" + rgbStr(tint, 255) + ":textureAsMask:" + file : "stretched:" + file;
}

class WH40KFxPool
{
	constructor(prefix, count)
	{
		this.prefix = prefix;
		this.count = count;
		this.slots = [];
		for (let i = 0; i < count; ++i)
			this.slots.push(null);
	}

	obj(i)
	{
		return gui(this.prefix + "[" + i + "]");
	}

	/**
	 * Toca um efeito. size = largura em px; opts: { tint: [r,g,b], delay (s),
	 * loops (vezes), key (para laços), fps }.
	 */
	play(kind, x, y, size, opts = {})
	{
		const def = WH40K_FX[kind];
		if (!def)
			return -1;
		let i = this.slots.findIndex(s => !s);
		if (i == -1)
		{
			// Sem objeto livre: rouba o efeito (não laço) mais antigo.
			let oldest = -1;
			for (let k = 0; k < this.count; ++k)
				if (!this.slots[k].key && (oldest == -1 || this.slots[k].start < this.slots[oldest].start))
					oldest = k;
			if (oldest == -1)
				return -1;
			i = oldest;
		}
		const w = size;
		const h = size / def.aspect;
		this.slots[i] = {
			"kind": kind,
			"def": def,
			"start": Date.now() + (opts.delay || 0) * 1000,
			"fps": opts.fps || def.fps,
			"loops": opts.loops || 1,
			"key": opts.key || null,
			"tint": opts.tint || null,
			"frame": -1,
			"rect": [x - w / 2, y - h * def.anchorY, x + w / 2, y + h * (1 - def.anchorY)]
		};
		const obj = this.obj(i);
		obj.hidden = true;
		setSize(obj, ...this.slots[i].rect);
		return i;
	}

	/** Efeito em laço (até clearLoops); não repete se a chave já toca. */
	loop(key, kind, x, y, size, opts = {})
	{
		if (this.slots.some(s => s && s.key == key))
			return;
		this.play(kind, x, y, size, Object.assign({}, opts, { "key": key, "loops": Infinity }));
	}

	clearLoops()
	{
		for (let i = 0; i < this.count; ++i)
			if (this.slots[i] && this.slots[i].key)
				this.stop(i);
	}

	clear()
	{
		for (let i = 0; i < this.count; ++i)
			this.stop(i);
	}

	stop(i)
	{
		this.slots[i] = null;
		this.obj(i).hidden = true;
	}

	busy()
	{
		return this.slots.some(s => s && !s.key);
	}

	tick(now)
	{
		for (let i = 0; i < this.count; ++i)
		{
			const s = this.slots[i];
			if (!s)
				continue;
			const t = (now - s.start) / 1000;
			if (t < 0)
				continue;
			const n = Math.floor(t * s.fps);
			if (n >= s.def.frames * s.loops)
			{
				this.stop(i);
				continue;
			}
			const frame = n % s.def.frames;
			if (frame == s.frame)
				continue;
			s.frame = frame;
			const obj = this.obj(i);
			obj.sprite = fxFrame(s.kind, frame, s.tint);
			obj.hidden = false;
		}
	}
}

/**
 * Toca os eventos ainda não vistos da campanha na vista atual (planeta ou
 * sistema) e mantém o fogo nas províncias devastadas.
 */
class WH40KCampaignFx
{
	constructor(page)
	{
		this.page = page;
		this.planet = new WH40KFxPool("planetFx", 32);
		this.system = new WH40KFxPool("sysFx", 16);
		this.seen = {};
		this.body = null;
	}

	tick(now)
	{
		this.planet.tick(now);
		this.system.tick(now);
	}

	/** Chamado depois de desenhar o mapa do corpo. */
	renderPlanet(bodyId, view)
	{
		const page = this.page;
		const g = page.game;
		const D = page.D;
		const { x: mx, y: my, w: mw, h: mh } = view.rect;
		const S = Math.max(60, Math.min(150, mw / 7));
		// Mesma âncora dos rótulos (presa dentro do mapa, PlanetView.anchor).
		const at = pid => view.anchors && view.anchors[pid] ? { "x": view.anchors[pid].x, "y": view.anchors[pid].y } :
			{ "x": mx + D.provinces[pid].label[0] * mw, "y": my + D.provinces[pid].label[1] * mh };
		if (this.body != bodyId || this.mapKey != mw + "x" + mh)
		{
			// Corpo ou tamanho mudou: os efeitos antigos ficariam fora do lugar.
			this.planet.clear();
			this.body = bodyId;
			this.mapKey = mw + "x" + mh;
		}
		// Províncias devastadas (saque ou bombardeio): fogo e fumaça em laço.
		const burning = {};
		for (const pid of D.bodies[bodyId].landProvinces)
			if (g.province(pid).devastated > 0)
				burning[pid] = true;
		for (let i = 0; i < this.planet.count; ++i)
		{
			const s = this.planet.slots[i];
			if (s && s.key && !s.key.startsWith("amb:") && !burning[s.key.split(":")[1]])
				this.planet.stop(i);
		}
		// Ambiente animado: chaminés nas zonas industriais, lava nos ermos vulcânicos,
		// clarões na disformidade (no máximo 8 por mapa).
		const palette = D.bodies[bodyId].palette;
		let amb = 0;
		for (const pid of D.bodies[bodyId].landProvinces)
		{
			if (amb >= 8 || burning[pid])
				continue;
			const t = D.provinces[pid].terrain;
			const p = at(pid);
			if (t == "industrial")
				this.planet.loop("amb:" + pid, "smoke", p.x + S * 0.45, p.y + S * 0.1, S * 0.6, { "fps": 5 });
			else if (t == "ash" && ["volcanic", "forge", "khorne"].indexOf(palette) != -1)
				this.planet.loop("amb:" + pid, "fire", p.x + S * 0.4, p.y + S * 0.35, S * 0.45, { "fps": 7 });
			else if (t == "warp")
				this.planet.loop("amb:" + pid, "ring", p.x + S * 0.4, p.y + S * 0.2, S * 0.55, { "fps": 5, "tint": [220, 70, 170] });
			else
				continue;
			++amb;
		}
		for (const pid in burning)
		{
			const p = at(pid);
			this.planet.loop("smoke:" + pid, "smoke", p.x - S * 0.62, p.y + S * 0.05, S * 0.9);
			this.planet.loop("burn:" + pid, "fire", p.x - S * 0.62, p.y + S * 0.42, S * 0.75, { "fps": 9 });
		}
		// Eventos novos.
		let delay = 0.15;
		for (const ev of g.s.events || [])
		{
			if (this.seen[ev.id] || !ev.pid || !D.provinces[ev.pid] || D.provinces[ev.pid].body != bodyId)
				continue;
			this.seen[ev.id] = true;
			this.playEvent(ev, at(ev.pid), S, delay);
			delay += 0.7;
		}
	}

	playEvent(ev, p, S, delay)
	{
		const fx = this.planet;
		const color = this.page.D.factionColor(ev.faction);
		switch (ev.kind)
		{
		case "orbital":
			for (let k = 0; k < 3; ++k)
			{
				const ox = (k - 1) * S * 0.38;
				const oy = (k % 2) * S * 0.2 - S * 0.05;
				fx.play("orbital", p.x + ox, p.y + oy, S * 0.75, { "delay": delay + k * 0.35 });
			}
			fx.play("smoke", p.x, p.y + S * 0.1, S, { "delay": delay + 1.6, "loops": 2 });
			break;
		case "sack":
			fx.play("explosion", p.x, p.y, S, { "delay": delay });
			for (let k = 0; k < 3; ++k)
				fx.play("fire", p.x + (k - 1) * S * 0.35, p.y + S * 0.15, S * 0.6, { "delay": delay + 0.3 + k * 0.15, "loops": 4 });
			fx.play("smoke", p.x, p.y - S * 0.1, S * 0.9, { "delay": delay + 0.8, "loops": 3 });
			break;
		case "battle":
			fx.play("clash", p.x, p.y, S * 0.9, { "delay": delay, "loops": 2 });
			fx.play("explosion", p.x - S * 0.3, p.y + S * 0.1, S * 0.6, { "delay": delay + 0.3 });
			fx.play("explosion", p.x + S * 0.3, p.y - S * 0.05, S * 0.55, { "delay": delay + 0.8 });
			break;
		case "capture":
			fx.play("ring", p.x, p.y, S * 1.3, { "delay": delay, "tint": color });
			fx.play("ring", p.x, p.y, S * 1.0, { "delay": delay + 0.45, "tint": color });
			break;
		case "landing":
			for (let k = 0; k < 3; ++k)
				fx.play("droppod", p.x + (k - 1) * S * 0.3, p.y + (k == 1 ? -S * 0.1 : S * 0.05), S * 0.55, { "delay": delay + k * 0.25 });
			fx.play("ring", p.x, p.y, S * 1.1, { "delay": delay + 1.0, "tint": color });
			break;
		case "fortify":
			fx.play("ring", p.x, p.y, S, { "delay": delay, "tint": [200, 200, 220] });
			break;
		}
	}

	/** Vista do sistema: batalhas espaciais e bombardeios nos corpos. */
	renderSystem(view)
	{
		const g = this.page.game;
		this.system.clear();
		let delay = 0.2;
		for (const ev of g.s.events || [])
		{
			if (!ev.body || this.seen["sys" + ev.id] || view.bodyIndex[ev.body] === undefined)
				continue;
			if (ev.kind != "space" && ev.kind != "orbital")
				continue;
			this.seen["sys" + ev.id] = true;
			const p = view.screenPos(ev.body);
			const r = view.bodyRadius(ev.body);
			if (ev.kind == "space")
				for (let k = 0; k < 4; ++k)
				{
					const a = k * 1.7 + 0.4;
					this.system.play("explosion", p.x + Math.cos(a) * r * 1.3, p.y + Math.sin(a) * r * 1.1, r * 0.9, { "delay": delay + k * 0.3 });
				}
			else
				this.system.play("ring", p.x, p.y, r * 2.6, { "delay": delay, "tint": this.page.D.factionColor(ev.faction) });
			delay += 0.6;
		}
	}

	/** Eventos que o jogador ainda não viu no corpo (para avisar no registro). */
	unseenOn(bodyId)
	{
		const D = this.page.D;
		return (this.page.game.s.events || []).filter(ev => !this.seen[ev.id] && ev.pid && D.provinces[ev.pid]?.body == bodyId).length;
	}
}
