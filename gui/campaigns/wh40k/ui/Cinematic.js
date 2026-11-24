/**
 * Cinemática de introdução da campanha: seis quadros (tools/source/cinematic,
 * gerados por tools/art/gen_cinematic.py) com zoom e deslocamento lentos,
 * passagem pelo preto, faixas de cinema e narração escrita letra a letra.
 *
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
/** Movimento de câmera de cada imagem: zoom [início, fim] e deslocamento [x, y] de -1 a 1 (início -> fim). */
const WH40K_CINEMA_CAMERA = [
	{ "zoom": [1.18, 1.04], "pan": [[0.6, -0.3], [-0.2, 0]] },     // fortaleza no mar
	{ "zoom": [1.02, 1.16], "pan": [[0, 0], [0.4, 0.2]] },        // o mundo visto da órbita
	{ "zoom": [1.06, 1.16], "pan": [[-0.6, 0], [0.5, -0.2]] },    // o governador e as ruínas
	{ "zoom": [1.15, 1.05], "pan": [[-0.6, 0], [0.5, -0.2]] },    // a Guarda diante da horda Ork: do comissário para a horda
	{ "zoom": [1.03, 1.12], "pan": [[0.5, 1.5], [-0.4, 3]] },      // o comissário à frente da coluna (o rosto fica abaixo da faixa)
	{ "zoom": [1.04, 1.12], "pan": [[0.5, 1], [-0.5, 3]] }         // o comissário olha o campo de batalha: termina no rosto dele
];

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

	/** Quadros da campanha atual: { image, title, text }. */
	shots()
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
		const year = (/^(\d{3}\.M\d{2}|M\d{2})/.exec(sc.intro || "") || [])[1] || "999.M41";
		const start = D.sector.startingArmies.find(a => a.faction == me && a.general);
		const general = start && D.generals[start.general];
		return [
			{ "title": year, "text": "No sombrio futuro do 41º milênio, só existe guerra. Fortalezas de mil anos guardam as costas de mundos esquecidos, e cada muralha foi erguida sobre os ossos de quem a defendeu." },
			{ "title": sc.name, "text": sc.intro || sc.summary || "" },
			{ "title": sc.name, "text": "Os senhores deste mundo olham para o horizonte. As forjas ainda queimam, as selvas engolem as ruínas, e cada colmeia sabe que o silêncio não vai durar." },
			{ "title": enemies.length ? "O inimigo" : sc.name, "text": enemies.length ? end("Marcham contra " + name(me) + ": " + list(enemies)) + " Os estandartes já se veem do alto das muralhas." : "A guerra chega a cada província." },
			{ "title": name(me), "text": allies.length ? end("Os exércitos de " + name(me) + " marcham para a guerra, lado a lado com " + list(allies)) : "Os exércitos de " + name(me) + " marcham para a guerra. Sozinhos, se preciso." },
			{ "title": name(me), "text": "Objetivo: " + sc.objective.text + "." + (general ? " " + general.name + " aguarda as suas ordens." : "") + " Que a guerra comece." }
		].map((shot, i) => Object.assign(shot, { "image": WH40K_CINEMA_DIR + (i < 9 ? "0" : "") + (i + 1) + ".png" }));
	}

	/** onDone: chamado no fim (ou ao pular). */
	open(onDone)
	{
		this.list = this.shots();
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
		if (this.index == 3)
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
		const cam = WH40K_CINEMA_CAMERA[this.index % WH40K_CINEMA_CAMERA.length];
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
