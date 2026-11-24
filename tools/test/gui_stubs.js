// Objetos falsos da GUI e do motor para tools/test/gui_sim.sh.
const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;
function readText(path) { return ByteArray.toString(GLib.file_get_contents(path)[1]); }
function warn(t) { print("WARN " + t); }
function error(t) { print("ERROR " + t); throw new Error(t); }
var g_Objects = {};
var g_Saved = null;
const SIZES = { "selGrid": [60, 80, 1300, 1000], "systemView": [0, 44, 1540, 968], "planetView": [0, 44, 1540, 968], "deployView": [0, 44, 1540, 968], "side": [1540, 44, 1920, 968], "wh40kRoot": [0, 0, 1920, 1080] };
function makeObject(name)
{
	const base = name.replace(/\[\d+\]$/, "");
	const r = SIZES[base] || [0, 0, 100, 30];
	const o = {
		"name": name, "hidden": false, "sprite": "", "enabled": true, "size": "",
		"getComputedSize": () => ({ "left": r[0], "top": r[1], "right": r[2], "bottom": r[3] })
	};
	const val = { "caption": "", "tooltip": "" };
	for (const k in val)
		Object.defineProperty(o, k, {
			"get": () => val[k],
			"set": v => { val[k] = v; checkLang(name, v); },
			"enumerable": true
		});
	return o;
}
// Em inglês/espanhol: guarda os textos que ainda parecem português.
var g_Untranslated = new Map();
const PT_MARKS = {
	"en": /[ãõçáéíóúâêô]|\b(de|do|da|dos|das|não|para|com|uma|sem|em|ao|os|as|que|mais|por)\b/i,
	"es": /[ãõç]|\b(não|uma|do|da|dos|das|em|ao|você|são|até|também|nenhum|está)\b/i
};
function checkLang(name, v)
{
	const re = typeof LANG != "undefined" && PT_MARKS[LANG];
	if (!re || typeof v != "string")
		return;
	for (const line of v.replace(/\[[^\]]*\]/g, "").split("\n"))
		if (re.test(line) && !g_Untranslated.has(line))
			g_Untranslated.set(line, name.replace(/\[\d+\]$/, ""));
}
var Engine = {
	"ReadJSONFile": p => JSON.parse(readText(MOD + "/" + p)),
	"GetGUIObjectByName": name => g_Objects[name] || (g_Objects[name] = makeObject(name)),
	"ConfigDB_GetValue": (scope, key) => key == "wh40k.language" ? (typeof LANG != "undefined" ? LANG : "pt") : "",
	"GetSystemUsername": () => "tester",
	"openRequest": "openRequest",
	"ClearPlaylist": () => {},
	"AddPlaylistItem": () => {},
	"StartPlaylist": () => {},
	"PlayUISound": p => { g_Sounds.push(p); }
};
var g_Sounds = [];
class CampaignRun
{
	constructor(filename) { this.filename = filename; this.data = {}; }
	static getCurrentRunFilename() { return "test"; }
	load() { return this; }
	isCurrent() { return true; }
	setCurrent() {}
	save() { g_Saved = JSON.stringify(this.data); return this; }
}

