import { t } from "gui/pregame/Lang.js";

// 40k Wars: logotipo e texto do menu; sem os botões da comunidade.
export const projectInformation = {
	"productLogo": {
		"sprite": "WH40KLogo"
	},
	"productBuild": {
		"caption": getBuildString()
	},
	"productDescription": {
		"caption": setStringTags(t("999.M41 — No sombrio futuro do 41º milênio, só existe guerra."), { "font": "sans-bold-14", "color": "201 160 72" }) + "\n" +
			setStringTags(t("A Waaagh! de Ghazghkull cai sobre Armageddon."), { "color": "200 190 170" })
	}
};

export const communityButtons = [];
