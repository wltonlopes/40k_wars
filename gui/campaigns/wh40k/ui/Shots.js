/**
 * Projéteis da batalha 2D: mostram a direção dos tiros.
 *
 * Cada tiro é uma imagem do conjunto prefixo[n] com um traçante orientado
 * (campaigns/wh40k/tracer/tNN.png, 16 direções: cabeça clara e cauda que
 * some para trás) que voa do atirador ao alvo. Tipos:
 *   bullet  traçante rápido (infantaria)
 *   heavy   traçante maior (veículos, aeronaves)
 *   shell   granada de artilharia: mais lenta, em arco, explode na chegada
 * onHit (opcional) roda quando o projétil chega; delay (s) adia a saída
 * (rajada de uma esquadra).
 */
const WH40K_SHOT_KINDS = {
	"bullet": { "speed": 700, "min": 0.15, "max": 0.45, "size": 22, "arc": 0 },
	"heavy": { "speed": 600, "min": 0.2, "max": 0.55, "size": 30, "arc": 0 },
	"shell": { "speed": 360, "min": 0.55, "max": 1.3, "size": 26, "arc": 0.35 }
};

class WH40KShots
{
	constructor(prefix, count)
	{
		this.prefix = prefix;
		this.count = count;
		this.live = [];
		this.free = [...Array(count).keys()].reverse();
		this.fired = 0;
	}

	clear()
	{
		for (const p of this.live)
			gui(this.prefix + "[" + p.slot + "]").hidden = true;
		this.free = this.free.concat(this.live.map(p => p.slot));
		this.live = [];
	}

	/** Tiro de (x0, y0) a (x1, y1) em px do campo. opts: kind, color, speed (multiplicador), delay, onHit. */
	fire(x0, y0, x1, y1, opts = {})
	{
		const kind = WH40K_SHOT_KINDS[opts.kind] || WH40K_SHOT_KINDS.bullet;
		++this.fired;
		let slot = this.free.pop();
		if (slot === undefined)
		{
			// Sem imagem livre: o mais antigo chega já.
			const old = this.live.shift();
			if (old.onHit)
				old.onHit();
			slot = old.slot;
		}
		const d = Math.hypot(x1 - x0, y1 - y0);
		const dur = Math.max(kind.min, Math.min(kind.max, d / kind.speed)) / Math.max(1, opts.speed || 1);
		const color = (opts.color || [255, 220, 120]).map(v => Math.min(255, v + 30));
		gui(this.prefix + "[" + slot + "]").hidden = true;
		this.live.push({
			"slot": slot, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "d": d, "kind": kind,
			"start": Date.now() + (opts.delay || 0) * 1000, "dur": dur * 1000, "onHit": opts.onHit,
			"color": rgbStr(color, 255), "dir": -1
		});
	}

	/** Posição no instante f (0..1): reta, ou arco para granadas. */
	at(p, f)
	{
		const x = p.x0 + (p.x1 - p.x0) * f;
		const y = p.y0 + (p.y1 - p.y0) * f - Math.sin(Math.PI * f) * p.d * p.kind.arc;
		return [x, y];
	}

	tick(now)
	{
		const keep = [];
		for (const p of this.live)
		{
			const obj = gui(this.prefix + "[" + p.slot + "]");
			const f = (now - p.start) / p.dur;
			if (f < 0)
			{
				keep.push(p);
				continue;
			}
			if (f >= 1)
			{
				obj.hidden = true;
				this.free.push(p.slot);
				if (p.onHit)
					p.onHit();
				continue;
			}
			keep.push(p);
			const [x, y] = this.at(p, f);
			// Direção do voo (no arco muda com o tempo): uma das 16 texturas.
			const [xa, ya] = this.at(p, Math.max(0, f - 0.04));
			const [xb, yb] = this.at(p, Math.min(1, f + 0.04));
			const dir = Math.round(Math.atan2(yb - ya, xb - xa) / (Math.PI / 8) + 16) % 16;
			if (dir != p.dir)
			{
				p.dir = dir;
				obj.sprite = "color:" + p.color + ":textureAsMask:campaigns/wh40k/tracer/t" + (dir < 10 ? "0" : "") + dir + ".png";
			}
			// O traçante cresce ao sair do cano.
			const r = p.kind.size / 2 * Math.min(1, 0.4 + f * 3);
			setSize(obj, x - r, y - r, x + r, y + r);
			obj.hidden = false;
		}
		this.live = keep;
	}
}
