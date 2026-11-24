/**
 * Idiomas do 40k Wars: inglês (padrão), português e espanhol.
 *
 * Os textos do jogo (dados e código) estão escritos em português, que serve
 * de chave; campaigns/wh40k/lang/<idioma>.json traz { strings: {texto: tradução},
 * static: [objetos do XML] } (gerados por tools/lang/build.py). A tradução é
 * feita na hora de mostrar (gui() em ui/Page.js): cada legenda ou dica passa
 * por WH40KLang.tr, que troca as frases conhecidas pela tradução — inclusive
 * dentro de frases montadas com nomes e números —, sem mexer nas marcações
 * de cor. Assim até o registro de saves antigos aparece traduzido.
 *
 * O idioma vem da opção "wh40k.language" (botão no menu principal) ou, sem
 * ela, do idioma do jogo (pt* -> português, es* -> espanhol, senão inglês).
 * Este arquivo carrega antes dos outros de core/ (o nome começa com 0).
 */
var WH40KLang = {
	"lang": null,
	"root": null,
	"cache": null,
	"staticNames": [],

	"code": function()
	{
		let l = "";
		try
		{
			l = Engine.ConfigDB_GetValue("user", "wh40k.language") || "";
			if (!l)
			{
				const loc = Engine.ConfigDB_GetValue("user", "locale") || "";
				l = loc.startsWith("pt") ? "pt" : loc.startsWith("es") ? "es" : "en";
			}
		}
		catch (e)
		{
			l = "en";
		}
		return ["en", "pt", "es"].indexOf(l) == -1 ? "en" : l;
	},

	"init": function()
	{
		const lang = this.code();
		if (this.lang == lang)
			return;
		this.lang = lang;
		this.root = null;
		this.cache = new Map();
		this.staticNames = [];
		if (lang == "pt")
			return;
		let data = {};
		try
		{
			data = Engine.ReadJSONFile("campaigns/wh40k/lang/" + lang + ".json") || {};
		}
		catch (e)
		{
			warn("40k Wars: tradução indisponível (" + lang + "): " + e);
		}
		this.staticNames = data.static || [];
		// Árvore de prefixos: um caractere por nível, "$" guarda a tradução.
		const root = {};
		for (const key in data.strings || {})
		{
			let node = root;
			for (const ch of key)
				node = node[ch] = node[ch] || {};
			node.$ = data.strings[key];
		}
		this.root = root;
	},

	"isWord": function(ch)
	{
		return !!ch && /[0-9A-Za-zÀ-ÿ]/.test(ch);
	},

	/** Traduz o texto (frases conhecidas, da mais longa para a mais curta, em limites de palavra). */
	"tr": function(text)
	{
		if (typeof text != "string" || !text)
			return text;
		this.init();
		if (!this.root)
			return text;
		const hit = this.cache.get(text);
		if (hit !== undefined)
			return hit;
		let out = "";
		let i = 0;
		const n = text.length;
		while (i < n)
		{
			const ch = text[i];
			// Marcações [color="..."], [font="..."] e [/color] passam inteiras.
			if (ch == "[")
			{
				const close = text.indexOf("]", i);
				if (close != -1 && /^\[\/?(color|font|icon|tooltip)/.test(text.slice(i, i + 8)))
				{
					out += text.slice(i, close + 1);
					i = close + 1;
					continue;
				}
			}
			if (!this.isWord(text[i - 1]) || !this.isWord(ch))
			{
				let node = this.root;
				let j = i;
				let best = -1;
				let bestText = null;
				while (j < n && node[text[j]])
				{
					node = node[text[j]];
					++j;
					if (node.$ !== undefined && !(this.isWord(text[j - 1]) && this.isWord(text[j])))
					{
						best = j;
						bestText = node.$;
					}
				}
				if (best > i)
				{
					out += bestText;
					i = best;
					continue;
				}
			}
			out += ch;
			++i;
		}
		if (this.cache.size > 6000)
			this.cache.clear();
		this.cache.set(text, out);
		return out;
	},

	/** Traduz as legendas fixas do XML (botões e rótulos com texto próprio). */
	"translateStatic": function(get)
	{
		this.init();
		for (const name of this.staticNames)
		{
			const obj = get(name);
			if (!obj)
				continue;
			obj.caption = obj.caption;
			obj.tooltip = obj.tooltip;
		}
	},

	"names": { "en": "English", "pt": "Português", "es": "Español" }
};

function tr(text)
{
	return WH40KLang.tr(text);
}
