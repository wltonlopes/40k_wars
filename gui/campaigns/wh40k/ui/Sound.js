/**
 * Som da campanha: músicas (campanha e batalha) e efeitos da batalha 2D.
 * Músicas: audio/music/wh40k_*.ogg (Kevin MacLeod, incompetech.com, CC-BY 4.0).
 * Efeitos: audio/interface/wh40k/*.ogg, sintetizados por tools/audio/gen_sfx.py.
 * Os efeitos têm limite de frequência para a batalha não virar ruído.
 */
const WH40K_MUSIC = {
	"campaign": ["wh40k_Crusade_Heavy_Industry.ogg", "wh40k_Dark_Times.ogg", "wh40k_Death_of_Kings.ogg", "wh40k_Gregorian_Chant.ogg"],
	"battle": ["wh40k_Five_Armies.ogg", "wh40k_Black_Vortex.ogg", "wh40k_Volatile_Reaction.ogg", "wh40k_Clash_Defiant.ogg"]
};
const WH40K_SFX_DIR = "audio/interface/wh40k/";
const WH40K_SFX_VARIANTS = { "las": 3, "bolt": 3, "auto": 2, "cannon": 2, "explosion": 3 };
/** Intervalo mínimo (ms) entre dois sons do mesmo grupo. */
const WH40K_SFX_GAP = {
	"las": 70, "bolt": 90, "auto": 260, "cannon": 350, "explosion": 160, "flamer": 600, "chainsword": 300,
	"artillery": 900, "bomber": 3000, "bombs": 1500, "orbital": 1200, "drop_pod": 600, "warp": 800, "horn": 3000,
	"ui_card": 150, "ui_click": 60
};
/** Unidades com lança-chamas (pelo id). */
const WH40K_FLAME_RE = /flame|burna|infernus|blightspawn|hellhound|redeemer|warpflamer|aggressor|bommer/;

class WH40KSound
{
	constructor()
	{
		this.last = {};
		this.musicState = null;
		this.window = [];
	}

	music(state)
	{
		if (this.musicState == state || !WH40K_MUSIC[state])
			return;
		this.musicState = state;
		try
		{
			const tracks = WH40K_MUSIC[state].slice();
			// Começa por uma faixa diferente a cada vez.
			const k = Math.floor(Math.random() * tracks.length);
			Engine.ClearPlaylist();
			for (const t of tracks.slice(k).concat(tracks.slice(0, k)))
				Engine.AddPlaylistItem("audio/music/" + t);
			Engine.StartPlaylist(true);
		}
		catch (e)
		{
			warn("40k Wars: música indisponível: " + e);
		}
	}

	/** Toca um efeito, respeitando o intervalo do grupo e no máximo 7 sons a cada 400 ms. */
	play(group, force)
	{
		const now = Date.now();
		if (!force && now - (this.last[group] || 0) < (WH40K_SFX_GAP[group] || 100))
			return false;
		this.window = this.window.filter(t => now - t < 400);
		if (!force && this.window.length >= 7)
			return false;
		this.last[group] = now;
		this.window.push(now);
		const n = WH40K_SFX_VARIANTS[group];
		const file = WH40K_SFX_DIR + group + (n ? "_" + (1 + Math.floor(Math.random() * n)) : "") + ".ogg";
		try
		{
			Engine.PlayUISound(file, false);
		}
		catch (e)
		{
			return false;
		}
		return true;
	}

	ui(name)
	{
		this.play("ui_" + name);
	}

	/** Som do disparo de uma unidade da batalha 2D (u: unidade do WH40KCombat). */
	shot(u, melee, D)
	{
		if (melee)
			return this.play("chainsword");
		const def = D && D.unitById[u.unit];
		const id = u.unit || "";
		if (WH40K_FLAME_RE.test(id))
			return this.play("flamer");
		if (u.category == "air")
			return this.play("auto");
		if (u.category == "vehicle" || u.category == "general")
			return this.play(u.range >= 0.18 ? "artillery" : u.range >= 0.12 ? "cannon" : "auto");
		const f = def ? def.faction : "";
		if (f == "imperial" && def.group == "guard" || f == "tau" || f == "eldar" || f == "necrons")
			return this.play("las");
		if (f == "thousand_sons" && /shaman|horror/.test(id))
			return this.play("warp");
		return this.play("bolt");
	}

	/** Eventos da batalha 2D (os mesmos dos efeitos visuais). */
	battleEvent(ev, D)
	{
		switch (ev.type)
		{
		case "shot":
			if (ev.from)
				this.shot(ev.from, false, D);
			break;
		case "melee":
			this.shot(ev.from || {}, true, D);
			break;
		case "death":
			if (ev.category != "infantry")
				this.play("explosion");
			break;
		case "droppod":
			this.play("drop_pod", true);
			break;
		case "flyover":
			this.play("bomber", true);
			break;
		case "explosion":
		case "impact":
		case "orbital":
			this.play("explosion");
			break;
		case "laser":
			this.play("orbital", true);
			break;
		}
	}
}
