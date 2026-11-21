/**
 * 40k Wars: configuração da batalha montada pela campanha
 * (gui/campaigns/wh40k/core/Battle.js). Vai para
 * InitAttributes.settings.WH40K, lida pelo mapa (maps/random/wh40k_battle.js)
 * e pelo trigger (maps/scripts/WH40KBattle.js).
 */
GameSettings.prototype.Attributes.Wh40kBattle = class Wh40kBattle extends GameSetting
{
	init()
	{
		this.value = undefined;
	}

	toInitAttributes(attribs)
	{
		if (this.value)
			attribs.settings.WH40K = this.value;
	}

	fromInitAttributes(attribs)
	{
		this.value = this.getLegacySetting(attribs, "WH40K");
	}

	setValue(value)
	{
		this.value = value;
	}
};
