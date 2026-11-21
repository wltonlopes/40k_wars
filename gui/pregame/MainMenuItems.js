/**
 * 40k Wars: só os botões essenciais. O primeiro começa uma cruzada nova
 * direto na campanha (sem passar pela lista de campanhas do jogo).
 */
function startNewCrusade(closePageCallback)
{
	const template = CampaignTemplate.getTemplate("wh40k");
	if (!template)
	{
		error("40k Wars: campanha 'wh40k' não encontrada.");
		return;
	}
	const run = new CampaignRun("wh40k_" + Date.now() + "_" + Math.floor(Math.random() * 100000))
		.setTemplate(template)
		.setMeta("Cruzada de Armageddon")
		.save()
		.setCurrent();
	closePageCallback({ [Engine.openRequest]: {
		"page": run.getMenuPath(),
		"argument": { "filename": run.filename }
	} });
}

export const mainMenuItems = [
	{
		"caption": "INICIAR CRUZADA",
		"tooltip": "Começa uma nova campanha: Cruzada de Armageddon, Invasão Tirânida ou 13ª Cruzada Negra.",
		"onPress": startNewCrusade
	},
	{
		"caption": "Continuar Cruzada",
		"tooltip": "Volta para a última cruzada jogada.",
		"onPress": closePageCallback =>
		{
			try
			{
				closePageCallback({ [Engine.openRequest]: {
					"page": CampaignRun.getCurrentRun().getMenuPath()
				} });
			}
			catch (err)
			{
				error("Erro ao abrir a cruzada: " + err);
			}
		},
		"enabled": () => CampaignRun.hasCurrentRun()
	},
	{
		"caption": "Carregar Cruzada",
		"tooltip": "Escolhe uma cruzada salva.",
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "campaigns/load_modal/page.xml"
			} });
		}
	},
	{
		"caption": "Opções",
		"tooltip": colorizeHotkey("%(hotkey)s: vídeo, som, interface e atalhos.", "options"),
		"hotkey": "options",
		"onPress": async() =>
		{
			fireConfigChangeHandlers(await Engine.OpenChildPage("page_options.xml"));
		}
	},
	{
		"caption": "Mods",
		"tooltip": "Ativa ou desativa mods (desative o 40k Wars aqui para voltar ao 0 A.D. normal).",
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "page_modmod.xml"
			} });
		}
	},
	{
		"caption": "Sair",
		"tooltip": "Fecha o jogo.",
		"onPress": async(closePageCallback) =>
		{
			const buttonIndex = await messageBox(400, 200, "Abandonar o campo de batalha e fechar o jogo?", "Sair", ["Não", "Sim"]);
			if (buttonIndex === 1)
				closePageCallback();
		}
	}
];
