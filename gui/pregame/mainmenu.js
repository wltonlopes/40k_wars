// 40k Wars: igual ao menu do jogo, sem o painel de relatório de uso.
import { MainMenuPage } from "gui/pregame/MainMenuPage.js";
import { mainMenuItems } from "gui/pregame/MainMenuItems.js";
import { projectInformation, communityButtons } from "gui/pregame/ProjectInformation.js";
import { backgrounds } from "gui/pregame/backgrounds/background.js";

export let getHotloadData;

export function init(data, hotloadData)
{
	return new Promise(closePageCallback =>
	{
		const mainMenuPage = new MainMenuPage(
			closePageCallback,
			data,
			hotloadData,
			mainMenuItems,
			Object.values(backgrounds),
			projectInformation,
			communityButtons);

		getHotloadData = () => mainMenuPage.getHotloadData();
	});
}
