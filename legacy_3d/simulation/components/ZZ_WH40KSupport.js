/**
 * 40k Wars: apoio estilo "killstreak" e estado da batalha para a interface.
 *
 * - AirSupportProvider (warhr) só libera um poder quando o trigger da batalha
 *   da campanha (maps/scripts/WH40KBattle.js) diz que a barra de baixas dele
 *   está cheia; ao lançar, a barra volta a zero. Fora dessas batalhas (sem
 *   WH40KSupportReady no trigger), nada muda.
 * - GuiInterface.GetWH40KBattleState: plano de batalha, batalhões (líder,
 *   retrato, frases) e barras de apoio do jogador.
 */
{
	const wh40kIsAvailable = AirSupportProvider.prototype.IsAvailable;
	AirSupportProvider.prototype.IsAvailable = function(type)
	{
		if (!wh40kIsAvailable.call(this, type))
			return false;
		const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
		if (!cmpTrigger || typeof cmpTrigger.WH40KSupportReady != "function" || !cmpTrigger.wh40k)
			return true;
		return cmpTrigger.WH40KSupportReady(this.entity, type);
	};

	const wh40kRequestSupport = AirSupportProvider.prototype.RequestSupport;
	AirSupportProvider.prototype.RequestSupport = function(type, target, battalion)
	{
		const ok = wh40kRequestSupport.call(this, type, target, battalion);
		const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
		if (ok && cmpTrigger && cmpTrigger.wh40k && typeof cmpTrigger.WH40KSupportUsed == "function")
			cmpTrigger.WH40KSupportUsed(this.entity, type);
		return ok;
	};
}

GuiInterface.prototype.exposedFunctions.GetWH40KBattleState = 1;
GuiInterface.prototype.GetWH40KBattleState = function(player)
{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (!cmpTrigger || typeof cmpTrigger.WH40KGuiState != "function")
		return null;
	return cmpTrigger.WH40KGuiState(player);
};
