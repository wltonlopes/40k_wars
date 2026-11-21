// Objetos falsos da GUI e do motor para tools/test/gui_sim.sh.
const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;
function readText(path) { return ByteArray.toString(GLib.file_get_contents(path)[1]); }
function warn(t) { print("WARN " + t); }
function error(t) { print("ERROR " + t); throw new Error(t); }
var g_Objects = {};
var g_Saved = null;
const SIZES = { "systemView": [0, 44, 1540, 968], "planetView": [0, 44, 1540, 968], "deployView": [0, 44, 1540, 968], "side": [1540, 44, 1920, 968], "wh40kRoot": [0, 0, 1920, 1080] };
function makeObject(name)
{
	const base = name.replace(/\[\d+\]$/, "");
	const r = SIZES[base] || [0, 0, 100, 30];
	return {
		"name": name, "hidden": false, "caption": "", "sprite": "", "tooltip": "", "enabled": true, "size": "",
		"getComputedSize": () => ({ "left": r[0], "top": r[1], "right": r[2], "bottom": r[3] })
	};
}
var Engine = {
	"ReadJSONFile": p => JSON.parse(readText(MOD + "/" + p)),
	"GetGUIObjectByName": name => g_Objects[name] || (g_Objects[name] = makeObject(name)),
	"ConfigDB_GetValue": () => "",
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

