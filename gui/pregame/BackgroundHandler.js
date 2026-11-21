class BackgroundLayer
{
	constructor(layer, i)
	{
		this.layer = layer;

		this.background = Engine.GetGUIObjectByName("background[" + i + "]");
		this.background.sprite = this.layer.sprite;
		this.background.z = i;
		this.background.hidden = false;
	}

	update(time, backgroundsSize)
	{
		if (this.layer.fill)
		{
			this.background.size = backgroundsSize;
			return;
		}
		if (this.layer.cover)
		{
			this.updateCover(time / 1000, backgroundsSize);
			return;
		}

		const height = backgroundsSize.bottom - backgroundsSize.top;
		const width = height * this.AspectRatio;
		const offset = this.layer.offset(time / 1000, width);

		if (this.layer.tiling)
		{
			const iw = height * 2;
			let left = offset % iw;
			if (left >= 0)
				left -= iw;
			this.background.size = {
				"left": left,
				"top": backgroundsSize.top,
				"right": backgroundsSize.right,
				"bottom": backgroundsSize.bottom
			};
		}
		else if (this.layer.halign)
		{
			const left = ({
				"left": 0.0,
				"center": (backgroundsSize.right - width) / 2,
				"right": backgroundsSize.right - width,
			}[this.layer.halign] || 0.0) + offset;
			this.background.size = {
				"left": left,
				"top": backgroundsSize.top,
				"right": left + width,
				"bottom": backgroundsSize.bottom
			};
		}
		else
		{
			const right = backgroundsSize.right / 2 + offset;
			this.background.size = {
				"left": right - height,
				"top": backgroundsSize.top,
				"right": right + height,
				"bottom": backgroundsSize.bottom
			};
		}
	}

	/**
	 * 40k Wars (do warhr): cobre a tela toda mantendo a proporção da imagem, com zoom e pan
	 * (pan.x/pan.y em -1..1 da folga que sobra para cada lado).
	 */
	updateCover(time, bs)
	{
		const W = bs.right - bs.left;
		const H = bs.bottom - bs.top;
		const aspect = this.layer.aspect || this.AspectRatio;
		const zoom = this.layer.zoom ? this.layer.zoom(time) : 1;
		const pan = this.layer.pan ? this.layer.pan(time) : { "x": 0, "y": 0 };

		const w = Math.max(W, H * aspect) * zoom;
		const h = w / aspect;
		const left = bs.left + (W - w) / 2 + pan.x * (w - W) / 2;
		const top = bs.top + (H - h) / 2 + pan.y * (h - H) / 2;
		this.background.size = { "left": left, "top": top, "right": left + w, "bottom": top + h };
	}
}

export class BackgroundHandler
{
	constructor(layers)
	{
		this.backgroundLayers = layers.map((layer, i) =>
			new BackgroundLayer(layer, i));

		this.initTime = Date.now();

		this.backgrounds = Engine.GetGUIObjectByName("backgrounds");
		this.backgrounds.onTick = this.onTick.bind(this);
		this.backgrounds.onWindowResized = this.onWindowResized.bind(this);
		this.onWindowResized();
	}

	onWindowResized()
	{
		const size = this.backgrounds.getComputedSize();
		this.backgroundsSize = { "left": size.left, "top": size.top, "right": size.right, "bottom": size.bottom };
	}

	onTick()
	{
		const time = Date.now() - this.initTime;
		for (const background of this.backgroundLayers)
			background.update(time, this.backgroundsSize);
	}
}

BackgroundLayer.prototype.AspectRatio = 16 / 9;
