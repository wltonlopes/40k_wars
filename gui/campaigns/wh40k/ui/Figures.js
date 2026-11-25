/**
 * Figuras dos batalhões no campo (desdobramento e batalha 2D).
 *
 * Cada marcador (prefixo[i]: deployToken / deployEnemy) tem WH40K_FIGS
 * imagens prefixoFig[i][k]. Um batalhão de infantaria mostra várias figuras
 * em formação (menos quando perde força); veículos, até 3; generais, 1.
 *
 * Sprites com quadros (gen_sprites.py, D.sprites[unidade] = [marcha, tiro]):
 *   <id>.png, <id>_w<i>.png  andando (ciclo)   <id>_f<i>.png  atirando
 *   sufixo _m: virado para a esquerda.
 * Sem quadros de marcha, a figura balança (passo) ao andar. Sem sprite da
 * unidade, a miniatura do retrato (gen_minis.py); sem ela, o retrato redondo.
 */
const WH40K_FIGS = 6;

/**
 * Posições na formação, em raios do marcador (dx, dy dos pés; dy < 0 = atrás).
 * Ordem: de trás para a frente (as da frente desenham por cima).
 */
const WH40K_FORMATIONS = {
	"1": [[0, 0]],
	"2": [[-0.55, -0.25], [0.55, 0.12]],
	"3": [[0, -0.5], [-0.85, 0.12], [0.85, 0.12]],
	"4": [[-0.55, -0.5], [0.55, -0.5], [-0.85, 0.15], [0.85, 0.15]],
	"5": [[-0.55, -0.55], [0.55, -0.55], [-1.05, 0.12], [0, 0.2], [1.05, 0.12]],
	"6": [[-1.0, -0.5], [0, -0.58], [1.0, -0.5], [-1.0, 0.15], [0, 0.22], [1.0, 0.15]]
};

/** Escala de cada figura: modelos únicos ocupam o marcador; esquadras, figuras menores. */
function figureScale(category, men)
{
	if (category == "general" || (men || 1) <= 1)
		return 1;
	return category == "infantry" ? 0.66 : 0.72;
}

/** Quantas figuras mostrar: infantaria pelos homens e pela força restante. */
function figureCount(category, men, strength)
{
	if (category == "general")
		return 1;
	const max = category == "infantry" ? Math.min(WH40K_FIGS, men || 1) : Math.min(3, men || 1);
	return Math.max(1, Math.min(max, Math.ceil(max * Math.max(0, Math.min(1, strength)) - 1e-6)));
}

/**
 * Desenha as figuras de um marcador.
 * o: { unit, portrait, side, color, category, men, strength, face (1 direita, -1 esquerda),
 *      moving, firing, time (s), seed }
 */
function drawFigures(prefix, i, o)
{
	const btn = gui(prefix + "[" + i + "]");
	const D = g_WH40KPage && g_WH40KPage.D;
	const frames = o.unit && D && D.sprites && D.sprites[o.unit];
	const mini = !frames && D && D.minis && D.minis[o.portrait];
	const cache = drawFigures.cache || (drawFigures.cache = {});
	const key = prefix + i;
	const st = cache[key] || (cache[key] = { "sprites": [], "sizes": [], "base": "" });
	if (!frames && !mini)
	{
		const s = portraitSprite(o.portrait);
		if (st.base != s)
		{
			st.base = s;
			btn.sprite = s;
			btn.sprite_over = s;
		}
		for (let k = 0; k < WH40K_FIGS; ++k)
			setFig(prefix, i, k, st, null, null);
		return;
	}
	const base = "color:" + rgbStr(o.color, 170) + ":textureAsMask:campaigns/wh40k/icons/disc.png";
	if (st.base != base)
	{
		st.base = base;
		btn.sprite = base;
		btn.sprite_over = "color:" + rgbStr(o.color.map(c => Math.min(255, c + 60)), 230) + ":textureAsMask:campaigns/wh40k/icons/disc.png";
	}
	const size = btn.getComputedSize();
	const t = (size.right - size.left) / 2;
	const n = figureCount(o.category, o.men, o.strength);
	const form = WH40K_FORMATIONS[n];
	const scale = figureScale(o.category, o.men);
	const left = o.face < 0;
	const suffix = left ? "_m.png" : ".png";
	// Caixa da figura: o quadrado do sprite com folga, como o marcador único.
	const box = sizeOfFig(t, !!frames) * scale;
	const [nWalk, nFire] = frames || [1, 0];
	const time = o.time || 0;
	const vehicle = o.category == "vehicle" || o.category == "air";
	for (let k = 0; k < WH40K_FIGS; ++k)
	{
		if (k >= n)
		{
			setFig(prefix, i, k, st, null, null);
			continue;
		}
		const ph = (o.seed || 0) * 0.37 + k * 0.29;
		let file;
		if (!frames)
			file = "campaigns/wh40k/minis/" + o.portrait.replace(/\.png$/, suffix);
		else
		{
			let name = o.unit;
			if (o.firing && nFire)
				name += "_f" + (Math.floor(time * 6 + ph * 7) % nFire);
			else if (o.moving && nWalk > 1)
			{
				const w = Math.floor(time * (nWalk > 6 ? 12 : 7) + ph * nWalk) % nWalk;
				name += w ? "_w" + w : "";
			}
			else if (nWalk > 1 && nWalk <= 4)
			{
				// Parado: poses diferentes na mesma esquadra.
				const w = (k + (o.seed || 0)) % nWalk;
				name += w ? "_w" + w : "";
			}
			file = "campaigns/wh40k/sprites/" + name + suffix;
		}
		// Passo: sem quadros de marcha, a figura sobe e desce (veículo: trepida).
		let bob = 0;
		let sway = 0;
		if (o.moving && nWalk <= 1)
		{
			bob = vehicle ? Math.sin(time * 40 + ph * 9) * 0.8 : -Math.abs(Math.sin(time * 9 + ph * 6)) * 2.6;
			sway = vehicle ? 0 : Math.sin(time * 4.5 + ph * 6) * 1.2;
		}
		else if (o.firing && !nFire)
			sway = -(o.face || 1) * (Math.floor(time * 14 + ph * 5) % 2); // recuo
		const [dx, dy] = form[k];
		const fx = t + dx * t * (left ? -1 : 1) + sway;
		const feet = 2 * t - 1 + dy * t + bob;
		const sz = Math.round(fx - box / 2) + " " + Math.round(feet - box) + " " + Math.round(fx + box / 2) + " " + Math.round(feet);
		setFig(prefix, i, k, st, "stretched:" + file, sz);
	}
}

/** Lado do quadrado da figura (px) para um marcador de raio t. */
function sizeOfFig(t, sprite)
{
	return sprite ? 2 * t + 26 : 2 * t + 14;
}

function setFig(prefix, i, k, st, sprite, size)
{
	if (st.sprites[k] === sprite && st.sizes[k] === size)
		return;
	const fig = gui(prefix + "Fig[" + i + "][" + k + "]");
	if (!sprite)
	{
		fig.hidden = true;
		st.sprites[k] = null;
		st.sizes[k] = null;
		return;
	}
	if (st.sprites[k] !== sprite)
		fig.sprite = sprite;
	if (st.sizes[k] !== size)
		fig.size = size;
	fig.hidden = false;
	st.sprites[k] = sprite;
	st.sizes[k] = size;
}

/** Esquece o estado desenhado (a página foi recriada ou os marcadores trocaram de dono). */
function resetFigures()
{
	drawFigures.cache = {};
}

/** Alcance "de artilharia": o anel de alcance aparece ao selecionar. */
const WH40K_ARTILLERY_RANGE = 0.15;

/** Posiciona um anel de alcance (centro e raio em px do campo). */
function placeRange(obj, cx, cy, radius, color)
{
	setSize(obj, cx - radius, cy - radius, cx + radius, cy + radius);
	obj.sprite = "color:" + rgbStr(color, 255) + ":textureAsMask:campaigns/wh40k/icons/range.png";
	obj.hidden = false;
}
