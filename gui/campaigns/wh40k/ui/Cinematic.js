/**
 * Cinemática de introdução da campanha: seis quadros (tools/source/cinematic,
 * gerados por tools/art/gen_cinematic.py) com zoom e deslocamento lentos,
 * passagem pelo preto, faixas de cinema e narração escrita letra a letra.
 *
 * Cada campanha pode ter o seu conjunto (WH40K_CINEMAS[id do cenário], quadros
 * em cinematic/<id>/); as demais usam o conjunto geral ("default").
 * A narração é montada com a campanha (nome, abertura, objetivo), a facção do
 * jogador, os aliados e os inimigos. Clique: completa o texto ou passa ao
 * próximo quadro; "Pular" ou Esc encerra. Toca ao começar uma campanha nova
 * e pela Ajuda ("Rever introdução").
 */
const WH40K_CINEMA_DIR = "campaigns/wh40k/cinematic/";
/** Duração de cada quadro (s), entrada/saída pelo preto (s) e letras por segundo. */
const WH40K_CINEMA_SHOT = 10;
const WH40K_CINEMA_FADE = 1.3;
const WH40K_CINEMA_CPS = 38;

/**
 * Conjuntos de quadros. dir: pasta das imagens (01.png, 02.png...); warp: quadro
 * (0 = primeiro) que toca o som de disformidade; camera: zoom [início, fim] e
 * deslocamento [x, y] de -1 a 1 (início -> fim), em que x > 0 mostra a parte
 * esquerda da imagem e y > 0 a de cima; shots(c): os textos de cada quadro, com
 * os trechos prontos de c (ver WH40KCinematic.context).
 */
const WH40K_CINEMAS = {
	"default": {
		"dir": "",
		"warp": 3,
		"camera": [
			{ "zoom": [1.18, 1.04], "pan": [[0.6, -0.3], [-0.2, 0]] },     // fortaleza no mar
			{ "zoom": [1.02, 1.16], "pan": [[0, 0], [0.4, 0.2]] },        // o mundo visto da órbita
			{ "zoom": [1.06, 1.16], "pan": [[-0.6, 0], [0.5, -0.2]] },    // o governador e as ruínas
			{ "zoom": [1.15, 1.05], "pan": [[-0.6, 0], [0.5, -0.2]] },    // a Guarda diante da horda Ork: do comissário para a horda
			{ "zoom": [1.03, 1.12], "pan": [[0.5, 1.5], [-0.4, 3]] },      // o comissário à frente da coluna (o rosto fica abaixo da faixa)
			{ "zoom": [1.04, 1.12], "pan": [[0.5, 1], [-0.5, 3]] }         // o comissário olha o campo de batalha: termina no rosto dele
		],
		"shots": c => [
			{ "title": c.year, "text": "No sombrio futuro do 41º milênio, só existe guerra. Fortalezas de mil anos guardam as costas de mundos esquecidos, e cada muralha foi erguida sobre os ossos de quem a defendeu." },
			{ "title": c.name, "text": c.intro },
			{ "title": c.name, "text": "Os senhores deste mundo olham para o horizonte. As forjas ainda queimam, as selvas engolem as ruínas, e cada colmeia sabe que o silêncio não vai durar." },
			{ "title": c.enemyTitle, "text": c.enemyText },
			{ "title": c.me, "text": c.allyText },
			{ "title": c.me, "text": c.orders }
		]
	},
	"badab": {
		"dir": "badab/",
		"warp": 2,
		"camera": [
			{ "zoom": [1.2, 1.06], "pan": [[0.8, 0.6], [-0.4, 0]] },      // Huron à janela: do rosto para a cidade
			{ "zoom": [1.04, 1.14], "pan": [[0.6, 0], [-0.4, 0.2]] },     // a frota sobre Badab Primaris
			{ "zoom": [1.16, 1.04], "pan": [[0.5, 0], [-0.2, 0.3]] },     // a esquadra diante do Maelstrom
			{ "zoom": [1.03, 1.15], "pan": [[-0.2, 0.2], [0.3, 0.5]] },   // o avanço sob a chuva
			{ "zoom": [1.18, 1.1], "pan": [[0.8, 0.5], [-0.8, 0.5]] },    // o conselho: rosto a rosto
			{ "zoom": [1.04, 1.14], "pan": [[0.6, 0], [-0.5, 0.3]] }      // o assalto ao palácio do Tirano
		],
		"shots": c => [
			{ "title": c.year, "text": "Do alto do Palácio de Badab, Lugft Huron contempla o mundo que jurou proteger. Por séculos os Astral Claws sangraram nas bordas do Maelstrom, e a Terra nunca veio em seu socorro." },
			{ "title": c.name, "text": c.intro },
			{ "title": "O Maelstrom", "text": "Às margens do Maelstrom, as frotas se encontram. Capítulo contra capítulo, irmão contra irmão: as naves atravessam tempestades de disformidade para alcançar as fortalezas do Tirano." },
			{ "title": c.enemyTitle, "text": c.enemyText },
			{ "title": c.me, "text": "Os mestres de capítulo se debruçam sobre os mapas de Badab. Nenhum deles esquece que, do outro lado, lutam homens da mesma semente. " + c.allyText },
			{ "title": c.me, "text": c.orders }
		]
	},
	"vraks": {
		"dir": "vraks/",
		"warp": 2,
		"camera": [
			{ "zoom": [1.2, 1.05], "pan": [[-0.7, 0.8], [0.5, 0]] },     // Xaphan na sacada: do cardeal para a multidão
			{ "zoom": [1.02, 1.14], "pan": [[0.3, 0], [-0.5, 0]] },      // Vraks Prime vista da órbita: até a Cidadela
			{ "zoom": [1.12, 1.04], "pan": [[0.6, -0.3], [-0.2, 0.3]] },  // a trincheira e a carga rebelde
			{ "zoom": [1.04, 1.14], "pan": [[-0.4, 0], [0.4, 0.4]] },     // a coluna de Krieg: termina no primeiro soldado
			{ "zoom": [1.15, 1.04], "pan": [[0.7, 0.3], [-0.3, 0]] },     // as linhas de cerco e a artilharia
			{ "zoom": [1.04, 1.16], "pan": [[0.4, 0], [-0.5, 0.2]] }      // a brecha na muralha
		],
		"shots": c => [
			{ "title": c.year, "text": "Da sacada da Cidadela, o Cardeal Xaphan ergue o braço sobre a multidão. Milhões juram lealdade a ele e não ao Trono, e os estandartes da estrela de oito pontas sobem as muralhas do maior arsenal do segmento." },
			{ "title": c.name, "text": c.intro },
			{ "title": c.enemyTitle, "text": c.enemyText },
			{ "title": c.me, "text": c.allyText },
			{ "title": "As linhas de cerco", "text": "Trincheira após trincheira, metro após metro. A artilharia martela as muralhas dia e noite, a chuva transforma a terra em lama, e cada palmo conquistado custa mil vidas." },
			{ "title": c.me, "text": c.orders }
		]
	}
};

class WH40KCinematic
{
	constructor(page)
	{
		this.page = page;
		this.active = false;
		gui("cinema").onPress = () => this.advance();
		gui("cinemaSkip").onPress = () => this.finish();
	}

	isOpen()
	{
		return this.active;
	}

	/** Conjunto de quadros da campanha atual. */
	set()
	{
		return WH40K_CINEMAS[this.page.D.scenario.id] || WH40K_CINEMAS.default;
	}

	/** Trechos de narração comuns a todos os conjuntos (campanha, jogador, aliados, inimigos, objetivo). */
	context()
	{
		const page = this.page;
		const D = page.D;
		const g = page.game;
		const me = page.player;
		const sc = D.scenario;
		const name = f => D.factionName(f);
		const others = Object.keys(g.s.factions).filter(f => f != me);
		const allies = others.filter(f => g.allied(f, me));
		const enemies = others.filter(f => !g.allied(f, me));
		const list = fs => fs.map(name).join(", ").replace(/, ([^,]*)$/, " e $1");
		// Ponto final, sem dobrar a pontuação ("Waaagh!.").
		const end = text => /[.!?]$/.test(text) ? text : text + ".";
		const start = D.sector.startingArmies.find(a => a.faction == me && a.general);
		const general = start && D.generals[start.general];
		return {
			"year": (/^(\d{3}\.M\d{2}|M\d{2})/.exec(sc.intro || "") || [])[1] || "999.M41",
			"name": sc.name,
			"intro": sc.intro || sc.summary || "",
			"me": name(me),
			"enemyTitle": enemies.length ? "O inimigo" : sc.name,
			"enemyText": enemies.length ? end("Marcham contra " + name(me) + ": " + list(enemies)) + " Os estandartes já se veem do alto das muralhas." : "A guerra chega a cada província.",
			"allyText": allies.length ? end("Os exércitos de " + name(me) + " marcham para a guerra, lado a lado com " + list(allies)) : "Os exércitos de " + name(me) + " marcham para a guerra. Sozinhos, se preciso.",
			"orders": "Objetivo: " + sc.objective.text + "." + (general ? " " + general.name + " aguarda as suas ordens." : "") + " Que a guerra comece."
		};
	}

	/** Quadros da campanha atual: { image, title, text }. */
	shots()
	{
		const set = this.set();
		return set.shots(this.context()).map((shot, i) =>
			Object.assign(shot, { "image": WH40K_CINEMA_DIR + set.dir + (i < 9 ? "0" : "") + (i + 1) + ".png" }));
	}

	/** onDone: chamado no fim (ou ao pular). */
	open(onDone)
	{
		this.list = this.shots();
		this.camera = this.set().camera;
		this.warp = this.set().warp;
		this.onDone = onDone;
		this.active = true;
		this.index = -1;
		this.closing = false;
		gui("cinema").hidden = false;
		this.page.sound.play("horn", true);
		this.next();
	}

	next()
	{
		++this.index;
		if (this.index >= this.list.length)
		{
			this.finish();
			return;
		}
		const shot = this.list[this.index];
		this.t0 = Date.now();
		this.leaving = 0;
		// O texto é traduzido inteiro e escrito letra a letra direto no objeto (sem passar de novo pela tradução).
		this.text = tr(shot.text);
		this.shown = -1;
		gui("cinemaImg").sprite = "stretched:" + shot.image;
		Engine.GetGUIObjectByName("cinemaTitle").caption = tr(shot.title).toUpperCase();
		gui("cinemaDots").caption = this.list.map((s, i) => i == this.index ? "◆" : "◇").join(" ");
		if (this.index == this.warp)
			this.page.sound.play("warp", true);
		this.tick(this.t0);
	}

	/** Clique: completa o texto; com o texto completo, passa ao próximo quadro. */
	advance()
	{
		if (!this.active || this.leaving)
			return;
		const t = (Date.now() - this.t0) / 1000;
		if (this.typed(t) < this.text.length)
			this.t0 -= (this.text.length / WH40K_CINEMA_CPS) * 1000;
		else
			this.leaving = Date.now();
	}

	typed(t)
	{
		return Math.max(0, Math.floor((t - 0.8) * WH40K_CINEMA_CPS));
	}

	tick(now)
	{
		if (!this.active)
			return;
		const t = (now - this.t0) / 1000;
		// Saída: pelo tempo do quadro ou pelo clique (saída rápida).
		// hold (capturas de tela): o quadro fica parado no meio do movimento, com o texto completo.
		if (this.hold)
			this.t0 = now - this.hold * 1000;
		if (!this.leaving && !this.hold && t >= WH40K_CINEMA_SHOT)
			this.leaving = now;
		let fade = Math.max(0, 1 - t / WH40K_CINEMA_FADE);
		if (this.leaving)
		{
			const out = (now - this.leaving) / 1000 / (WH40K_CINEMA_FADE * 0.7);
			fade = Math.max(fade, Math.min(1, out));
			if (out >= 1)
			{
				this.next();
				return;
			}
		}
		gui("cinemaFade").sprite = "color:0 0 0 " + Math.round(fade * 255);

		// Câmera: o quadro cobre a tela (16:9) e anda devagar.
		const cam = this.camera[this.index % this.camera.length];
		const p = Math.min(1, t / WH40K_CINEMA_SHOT);
		const e = p * p * (3 - 2 * p);
		const box = gui("cinema").getComputedSize();
		const W = box.right - box.left;
		const H = box.bottom - box.top;
		const zoom = cam.zoom[0] + (cam.zoom[1] - cam.zoom[0]) * e;
		const w = Math.max(W, H * 16 / 9) * zoom;
		const h = w * 9 / 16;
		const px = cam.pan[0][0] + (cam.pan[1][0] - cam.pan[0][0]) * e;
		const py = cam.pan[0][1] + (cam.pan[1][1] - cam.pan[0][1]) * e;
		const left = (W - w) / 2 + px * (w - W) / 2;
		// pan y > 1 desce a imagem além da borda: até a faixa de cima (9%), que esconde o vão; embaixo ela sempre cobre.
		const top = Math.max(H - h, Math.min(0.09 * H, (H - h) / 2 + py * (h - H) / 2));
		gui("cinemaImg").size = Math.round(left) + " " + Math.round(top) + " " + Math.round(left + w) + " " + Math.round(top + h);

		// Narração letra a letra.
		const n = Math.min(this.text.length, this.typed(t));
		if (n != this.shown)
		{
			this.shown = n;
			Engine.GetGUIObjectByName("cinemaText").caption = this.text.slice(0, n);
		}
	}

	finish()
	{
		if (!this.active)
			return;
		this.active = false;
		gui("cinema").hidden = true;
		const done = this.onDone;
		this.onDone = null;
		if (done)
			done();
	}
}
