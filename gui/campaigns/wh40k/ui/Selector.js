/**
 * Seletor em grade (no estilo do mod civ_grid): cartões com imagem e nome à
 * esquerda, paginação e zoom; à direita busca, até dois filtros, a prévia do
 * selecionado (imagem grande, nome, informações, descrição), uma opção extra
 * (ex.: dificuldade), "Aleatório", um botão auxiliar, "Voltar" e "Escolher".
 * Duplo clique num cartão também escolhe. A roda do mouse vira a página.
 *
 * open({ title, items: [{ id, name, icon, preview, info, desc, tags: {chave: valor} }],
 *        filters: [{ label, key }], extra: { label, options: [{id, name}], value },
 *        aux: { caption, onPress(id) }, okCaption, onSelect(id, extra), onCancel(), selected })
 */
const WH40K_SEL_ITEMS = 48;

class WH40KSelector
{
	constructor(page)
	{
		this.page = page;
		this.itemW = 170;
		gui("selPrev").onPress = () => this.turn(-1);
		gui("selNext").onPress = () => this.turn(1);
		gui("selZoomIn").onPress = () => this.zoom(30);
		gui("selZoomOut").onPress = () => this.zoom(-30);
		gui("selSearch").onTextEdit = () => this.filter();
		for (const i of [0, 1])
			gui("selFilter[" + i + "]").onSelectionChange = () => this.filter();
		gui("selRandom").onPress = () => {
			if (this.list.length)
				this.select(pickFrom(this.list).id, true);
		};
		gui("selCancel").onPress = () => {
			this.close();
			if (this.opts.onCancel)
				this.opts.onCancel();
		};
		gui("selOk").onPress = () => this.confirm();
		gui("selGrid").onMouseWheelUp = () => this.turn(-1);
		gui("selGrid").onMouseWheelDown = () => this.turn(1);
	}

	isOpen()
	{
		return !gui("selDim").hidden;
	}

	close()
	{
		gui("selDim").hidden = true;
	}

	open(opts)
	{
		this.opts = opts;
		this.pageIndex = 0;
		gui("selDim").hidden = false;
		gui("selTitle").caption = opts.title;
		gui("selSearch").caption = "";
		const filters = opts.filters || [];
		for (const i of [0, 1])
		{
			const f = filters[i];
			const dd = gui("selFilter[" + i + "]");
			gui("selFilterLabel[" + i + "]").hidden = !f;
			dd.hidden = !f;
			if (!f)
				continue;
			gui("selFilterLabel[" + i + "]").caption = f.label + ":";
			const values = [...new Set(opts.items.map(it => it.tags && it.tags[f.key]).filter(Boolean))].sort();
			dd.list = ["Todos"].concat(values);
			dd.list_data = ["*"].concat(values);
			dd.selected = 0;
		}
		const extra = gui("selExtra");
		gui("selExtraLabel").hidden = !opts.extra;
		extra.hidden = !opts.extra;
		if (opts.extra)
		{
			gui("selExtraLabel").caption = opts.extra.label + ":";
			extra.list = opts.extra.options.map(o => o.name);
			extra.list_data = opts.extra.options.map(o => o.id);
			extra.selected = Math.max(0, opts.extra.options.findIndex(o => o.id == opts.extra.value));
		}
		gui("selAux").hidden = !opts.aux;
		if (opts.aux)
		{
			gui("selAux").caption = opts.aux.caption;
			gui("selAux").onPress = () => opts.aux.onPress(this.selected);
		}
		gui("selOk").caption = opts.okCaption || "Escolher";
		this.selected = opts.selected || (opts.items[0] && opts.items[0].id);
		this.filter();
	}

	filter()
	{
		const text = (gui("selSearch").caption || "").toLowerCase();
		const filters = this.opts.filters || [];
		this.list = this.opts.items.filter(it => {
			if (text && tr(it.name + " " + (it.info || "")).toLowerCase().indexOf(text) == -1)
				return false;
			for (const i of [0, 1])
			{
				const f = filters[i];
				const dd = gui("selFilter[" + i + "]");
				if (f && dd.selected > 0 && (it.tags || {})[f.key] != dd.list_data[dd.selected])
					return false;
			}
			return true;
		});
		if (!this.list.some(it => it.id == this.selected) && this.list.length)
			this.selected = this.list[0].id;
		this.goToSelected();
	}

	layout()
	{
		const size = gui("selGrid").getComputedSize();
		const W = size.right - size.left;
		const H = size.bottom - size.top;
		const cols = Math.max(1, Math.floor(W / this.itemW));
		const w = W / cols;
		const h = w * 1.12;
		const rows = Math.max(1, Math.floor(H / h));
		return { "cols": cols, "rows": rows, "w": w, "h": h, "per": Math.min(WH40K_SEL_ITEMS, cols * rows) };
	}

	goToSelected()
	{
		const L = this.layout();
		const idx = Math.max(0, this.list.findIndex(it => it.id == this.selected));
		this.pageIndex = Math.floor(idx / L.per);
		this.render();
	}

	turn(d)
	{
		const L = this.layout();
		const pages = Math.max(1, Math.ceil(this.list.length / L.per));
		this.pageIndex = (this.pageIndex + d + pages) % pages;
		this.render();
	}

	zoom(d)
	{
		this.itemW = Math.max(120, Math.min(300, this.itemW + d));
		this.goToSelected();
	}

	select(id, goTo)
	{
		this.selected = id;
		if (goTo)
			this.goToSelected();
		else
			this.render();
	}

	confirm()
	{
		const it = this.list.find(x => x.id == this.selected);
		if (!it)
			return;
		const extra = this.opts.extra ? gui("selExtra").list_data[gui("selExtra").selected] : undefined;
		this.close();
		this.opts.onSelect(it.id, extra);
	}

	render()
	{
		const L = this.layout();
		const pages = Math.max(1, Math.ceil(this.list.length / L.per));
		const start = this.pageIndex * L.per;
		for (let i = 0; i < WH40K_SEL_ITEMS; ++i)
		{
			const btn = gui("selItem[" + i + "]");
			const it = i < L.per ? this.list[start + i] : null;
			btn.hidden = !it;
			if (!it)
				continue;
			const x = (i % L.cols) * L.w;
			const y = Math.floor(i / L.cols) * L.h;
			setSize(btn, x + 4, y + 4, x + L.w - 4, y + L.h - 4);
			const sel = it.id == this.selected;
			btn.sprite = sel ? "color:150 110 40 230" : "color:30 24 18 220";
			gui("selItemImg[" + i + "]").sprite = it.icon;
			gui("selItemName[" + i + "]").caption = sel ? colored(it.name, [255, 225, 130]) : it.name;
			btn.tooltip = it.name + (it.info ? "\n" + it.info : "");
			btn.onPress = () => this.select(it.id);
			btn.onMouseLeftDoubleClick = () => {
				this.selected = it.id;
				this.confirm();
			};
		}
		gui("selPageStatus").caption = this.list.length ? "Página " + (this.pageIndex + 1) + " de " + pages + " · " + this.list.length + " opções" : "Nada encontrado";
		gui("selPrev").enabled = pages > 1;
		gui("selNext").enabled = pages > 1;
		const it = this.list.find(x => x.id == this.selected);
		gui("selPreview").hidden = !it;
		gui("selPreviewFrame").hidden = !it;
		gui("selName").caption = it ? it.name : "";
		gui("selInfo").caption = it ? it.info || "" : "";
		gui("selDesc").caption = it ? it.desc || "" : "";
		if (it)
			gui("selPreview").sprite = it.preview || it.icon;
		gui("selOk").enabled = !!it;
	}
}
