import { t, languageCode, languageNames, cycleLanguage } from "gui/pregame/Lang.js";

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
		"caption": t("INICIAR CRUZADA"),
		"tooltip": t("Começa uma nova campanha: escolha o cenário, o lado e a dificuldade."),
		"onPress": startNewCrusade
	},
	{
		"caption": t("Continuar Cruzada"),
		"tooltip": t("Volta para a última cruzada jogada."),
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
		"caption": t("Carregar Cruzada"),
		"tooltip": t("Escolhe uma cruzada salva."),
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "campaigns/load_modal/page.xml"
			} });
		}
	},
	{
		"caption": t("Escaramuça"),
		"tooltip": t("Uma batalha avulsa, sem campanha: escolha as facções, o terreno e o tamanho."),
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "campaigns/wh40k/page.xml",
				"argument": { "skirmish": true }
			} });
		}
	},
	{
		"caption": t("Códex"),
		"tooltip": t("Todas as facções: unidades, generais, recursos especiais e rituais."),
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "campaigns/wh40k/page.xml",
				"argument": { "codex": true }
			} });
		}
	},
	{
		"caption": t("Opções"),
		"tooltip": colorizeHotkey(t("%(hotkey)s: vídeo, som, interface e atalhos."), "options"),
		"hotkey": "options",
		"onPress": async() =>
		{
			fireConfigChangeHandlers(await Engine.OpenChildPage("page_options.xml"));
		}
	},
	{
		"caption": t("Mods"),
		"tooltip": t("Ativa ou desativa mods (desative o 40k Wars aqui para voltar ao 0 A.D. normal)."),
		"onPress": closePageCallback =>
		{
			closePageCallback({ [Engine.openRequest]: {
				"page": "page_modmod.xml"
			} });
		}
	},
	{
		"caption": t("Idioma") + ": " + languageNames[languageCode()],
		"tooltip": "Language / Idioma: English · Português · Español",
		"onPress": cycleLanguage
	},
	{
		"caption": t("Sair"),
		"tooltip": t("Fecha o jogo."),
		"onPress": async(closePageCallback) =>
		{
			const buttonIndex = await messageBox(400, 200, t("Abandonar o campo de batalha e fechar o jogo?"), t("Sair"), [t("Não"), t("Sim")]);
			if (buttonIndex === 1)
				closePageCallback();
		}
	}
];
