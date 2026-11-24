/**
 * 40k Wars: idioma do menu principal (o mesmo de gui/campaigns/wh40k/core/0_Lang.js).
 * Os textos estão em português e são a chave de campaigns/wh40k/lang/<idioma>.json.
 */
export const languages = ["en", "pt", "es"];
export const languageNames = { "en": "English", "pt": "Português", "es": "Español" };

export function languageCode()
{
	let l = Engine.ConfigDB_GetValue("user", "wh40k.language") || "";
	if (!l)
	{
		const loc = Engine.ConfigDB_GetValue("user", "locale") || "";
		l = loc.startsWith("pt") ? "pt" : loc.startsWith("es") ? "es" : "en";
	}
	return languages.indexOf(l) == -1 ? "en" : l;
}

let strings = null;

function load()
{
	if (strings)
		return strings;
	strings = {};
	const lang = languageCode();
	if (lang != "pt")
		try
		{
			strings = (Engine.ReadJSONFile("campaigns/wh40k/lang/" + lang + ".json") || {}).strings || {};
		}
		catch (e)
		{
			warn("40k Wars: tradução indisponível (" + lang + "): " + e);
		}
	return strings;
}

/** Traduz um texto inteiro, mantendo a pontuação das pontas (como o catálogo). */
export function t(text)
{
	const s = load();
	const m = /^([\s.,:;()·—–+/|•-]*)(.*?)([\s.,:;()·—–+/|•-]*)$/s.exec(text);
	if (!m || s[m[2]] === undefined)
		return text;
	return m[1] + s[m[2]] + m[3];
}

/** Grava o próximo idioma e reabre o menu. */
export function cycleLanguage(closePageCallback)
{
	const next = languages[(languages.indexOf(languageCode()) + 1) % languages.length];
	Engine.ConfigDB_CreateAndSaveValue("user", "wh40k.language", next);
	closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
}
