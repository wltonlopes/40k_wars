/**
 * 40k Wars: interface da batalha da campanha.
 *  - Selecionar um batalhão mostra o retrato do líder, o nome e uma frase de
 *    efeito (esperando ordens), a ordem atual e a força.
 *  - Ordens dos selecionados (avançar, manter, flanquear, reserva, recuar) e
 *    plano geral (ataque geral, segurar a linha, retirada): comando
 *    "wh40k-order". Ordens diretas (botão direito no mapa) tiram o batalhão
 *    do plano até ele receber outra ordem daqui.
 *  - Apoio estilo killstreak: cada barra enche com as baixas que você causa;
 *    cheia, clique no botão e depois no mapa (botão direito cancela):
 *    comando "wh40k-support".
 * O estado vem de GuiInterface.GetWH40KBattleState (maps/scripts/WH40KBattle.js).
 */
var g_WH40K = {
	"state": null,
	"tick": 0,
	"leaderEnt": null,
	"quote": "",
	"targeting": null
};

const WH40K_ORDER_BUTTONS = [
	["advance", "Avançar", "Marcha contra o inimigo mais próximo e luta."],
	["hold", "Manter", "Segura a posição atual e só enfrenta quem chegar perto."],
	["flank_left", "Flanco Esq.", "Contorna pela esquerda e ataca de lado."],
	["flank_right", "Flanco Dir.", "Contorna pela direita e ataca de lado."],
	["reserve", "Reserva", "Espera e entra quando o inimigo chega ou as perdas crescem."],
	["retreat", "Recuar", "Foge para a borda sul; quem sai pela borda escapa e volta à campanha."]
];
const WH40K_PLAN_BUTTONS = [
	["advance", "Ataque Geral", "Todo o exército avança."],
	["hold", "Segurar Linha", "Todo o exército segura onde está."],
	["retreat", "RETIRADA!", "Todo o exército recua para a borda sul. Quem escapa volta à campanha; a batalha é perdida."]
];
const WH40K_ORDER_NAMES = { "advance": "Avançar", "hold": "Manter posição", "flank_left": "Flanquear pela esquerda", "flank_right": "Flanquear pela direita", "reserve": "Reserva", "retreat": "Recuar" };

function wh40kInitPanels()
{
	WH40K_ORDER_BUTTONS.forEach(([order, caption, tooltip], i) => {
		const btn = Engine.GetGUIObjectByName("wh40kOrder[" + i + "]");
		const col = i % 3;
		const row = Math.floor(i / 3);
		btn.size = (8 + col * 106) + " " + (24 + row * 36) + " " + (8 + col * 106 + 100) + " " + (24 + row * 36 + 32);
		btn.caption = caption;
		btn.tooltip = tooltip;
		btn.onPress = () => wh40kOrderSelected(order);
	});
	WH40K_PLAN_BUTTONS.forEach(([order, caption, tooltip], i) => {
		const btn = Engine.GetGUIObjectByName("wh40kPlan[" + i + "]");
		btn.size = (8 + i * 106) + " 124 " + (8 + i * 106 + 100) + " 156";
		btn.caption = caption;
		btn.tooltip = tooltip;
		btn.onPress = () => wh40kOrderAll(order);
	});
}

function wh40kSelectedOwn()
{
	const state = g_WH40K.state;
	if (!state)
		return [];
	return g_Selection.toList().filter(ent => state.ents[ent]);
}

function wh40kOrderSelected(order)
{
	const ents = wh40kSelectedOwn();
	if (!ents.length)
		return;
	Engine.PostNetworkCommand({ "type": "wh40k-order", "entities": ents, "order": order });
	wh40kSay(order == "retreat" ? "Recuando!" : null);
}

function wh40kOrderAll(order)
{
	Engine.PostNetworkCommand({ "type": "wh40k-order", "entities": [], "all": true, "order": order });
}

function wh40kSay(text)
{
	if (text)
		g_WH40K.quote = text;
}

function wh40kUpdate()
{
	if (++g_WH40K.tick % 3 && g_WH40K.state)
		return;
	const state = Engine.GuiInterfaceCall("GetWH40KBattleState", Engine.GetPlayerID());
	g_WH40K.state = state;
	const root = Engine.GetGUIObjectByName("wh40kBattle");
	root.hidden = !state;
	if (!state)
		return;
	if (!g_WH40K.init)
	{
		g_WH40K.init = true;
		wh40kInitPanels();
	}
	wh40kRenderStatus(state);
	wh40kRenderSupport(state);
	wh40kRenderLeader(state);
}

function wh40kRenderStatus(state)
{
	const own = state.player;
	const enemy = 3 - own;
	const frac = p => state.initialMen[p] ? Math.max(0, Math.min(1, state.men[p] / state.initialMen[p])) : 1;
	Engine.GetGUIObjectByName("wh40kBarOwn").size = "8 8 " + Math.round(8 + frac(own) * 182) + " 22";
	Engine.GetGUIObjectByName("wh40kBarEnemy").size = "100%-" + Math.round(8 + frac(enemy) * 182) + " 8 100%-8 22";
	const text = Engine.GetGUIObjectByName("wh40kStatusText");
	text.caption = state.kills[own] + " : " + state.kills[enemy];
	text.tooltip = "Baixas causadas por você : pelo inimigo.\nBarras: tropas ainda em campo (você à esquerda, inimigo à direita).\nUm lado reduzido a 25%, diante do dobro, debanda." +
		(state.retreating[own] ? "\nSEU EXÉRCITO ESTÁ RECUANDO." : "") + (state.retreating[enemy] ? "\nO inimigo está fugindo: persiga-o!" : "");
}

function wh40kRenderSupport(state)
{
	for (let i = 0; i < 4; ++i)
	{
		const power = state.support[i];
		const btn = Engine.GetGUIObjectByName("wh40kPower[" + i + "]");
		const name = Engine.GetGUIObjectByName("wh40kPowerName[" + i + "]");
		btn.hidden = !power;
		name.hidden = true;
		if (!power)
			continue;
		btn.size = (6 + i * 70) + " 22 " + (6 + i * 70 + 64) + " 86";
		name.size = (i * 70) + " 86 " + (i * 70 + 76) + " 104";
		name.caption = power.name.split(" ").slice(-1)[0];
		const icon = power.icon ? "stretched:wh40k/portraits/" + power.icon : "stretched:session/icons/production.png";
		Engine.GetGUIObjectByName("wh40kPowerIcon[" + i + "]").sprite = (power.ready ? "" : "color:0 0 0 110:grayscale:") + icon;
		Engine.GetGUIObjectByName("wh40kPowerFill[" + i + "]").size = "0 100%-8 " + Math.round(100 * power.progress / power.need) + "% 100%";
		const targeting = g_WH40K.targeting == power.type;
		Engine.GetGUIObjectByName("wh40kPowerReady[" + i + "]").caption = targeting ? "ALVO" : power.ready ? "PRONTO" : power.progress + "/" + power.need;
		btn.tooltip = power.name + "\n" + (power.desc || "") + "\n\n" + (power.ready ? "Pronto! Clique e escolha o alvo no mapa (botão direito cancela)." : "Faltam " + (power.need - power.progress) + " baixas inimigas.");
		btn.enabled = power.ready && !state.finished;
		btn.onPress = () => {
			g_WH40K.targeting = power.type;
			wh40kSay("Coordenadas, comandante! Onde quer o " + power.name + "?");
		};
	}
}

function wh40kRenderLeader(state)
{
	const panel = Engine.GetGUIObjectByName("wh40kLeader");
	const ents = wh40kSelectedOwn();
	const ent = ents[0];
	const bid = ent && state.ents[ent];
	const bat = bid && state.bats[bid];
	panel.hidden = !bat;
	if (!bat)
	{
		g_WH40K.leaderBat = null;
		return;
	}
	if (g_WH40K.leaderBat != bid)
	{
		g_WH40K.leaderBat = bid;
		const quotes = bat.info.quotes || [];
		g_WH40K.quote = quotes.length ? quotes[Math.floor(Math.random() * quotes.length)] : "Às ordens!";
	}
	const portrait = bat.info.portrait;
	Engine.GetGUIObjectByName("wh40kLeaderPortrait").sprite = portrait ? "stretched:wh40k/portraits/" + portrait : "stretched:session/portraits/units/squad_rifle.png";
	Engine.GetGUIObjectByName("wh40kLeaderName").caption = (bat.general ? (bat.info.title ? bat.info.title + " " : "") : "") + (bat.info.name || bat.info.unitName);
	Engine.GetGUIObjectByName("wh40kLeaderUnit").caption = bat.general ? "General do exército" : bat.info.unitName + (ents.length > 1 ? "  (+" + (new Set(ents.map(e => state.ents[e])).size - 1) + " batalhões)" : "");
	Engine.GetGUIObjectByName("wh40kLeaderQuote").caption = "“" + g_WH40K.quote + "”";
	Engine.GetGUIObjectByName("wh40kLeaderOrder").caption = "Ordem: " + (bat.manual ? "comando direto" : WH40K_ORDER_NAMES[bat.order] || bat.order);
	Engine.GetGUIObjectByName("wh40kLeaderStatus").caption = "Soldados: " + bat.alive + "/" + bat.start +
		(bat.manual ? "\nSegue suas ordens diretas. Use os botões de ordem para devolvê-lo ao plano." : "");
}

registerSimulationUpdateHandler(wh40kUpdate);
registerEntitySelectionChangeHandler(() => {
	g_WH40K.tick = 0;
	if (g_WH40K.state)
		wh40kRenderLeader(g_WH40K.state);
});

// Mira do apoio: clique esquerdo no terreno lança, direito cancela.
{
	const wh40kHandleInputBeforeGui = handleInputBeforeGui;
	handleInputBeforeGui = function(ev, hoveredObject)
	{
		if (g_WH40K.targeting && ev.type == "mousebuttondown")
		{
			if (ev.button == SDL_BUTTON_RIGHT)
			{
				g_WH40K.targeting = null;
				return true;
			}
			if (ev.button == SDL_BUTTON_LEFT && !hoveredObject)
			{
				const pos = Engine.GetTerrainAtScreenPoint(ev.x, ev.y);
				Engine.PostNetworkCommand({ "type": "wh40k-support", "power": g_WH40K.targeting, "x": pos.x, "z": pos.z });
				DrawTargetMarker({ "x": pos.x, "z": pos.z });
				g_WH40K.targeting = null;
				return true;
			}
		}
		if (g_WH40K.targeting && ev.type == "mousemotion")
			Engine.SetCursor("action-attack");
		return wh40kHandleInputBeforeGui(ev, hoveredObject);
	};
}
