/**
 * 40k Wars: comandos da batalha da campanha.
 *   wh40k-order   { entities | all, order }   muda a ordem do plano de batalha
 *   wh40k-support { power, x, z }             lança um poder de apoio pronto
 * Ordens diretas (andar, atacar, parar...) tiram o batalhão do plano: ele
 * deixa de seguir a ordem do desdobramento até receber outra pelo painel.
 */
g_Commands["wh40k-order"] = function(player, cmd, data)
{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger && typeof cmpTrigger.WH40KSetOrder == "function")
		cmpTrigger.WH40KSetOrder(player, data.entities, cmd.order, !!cmd.all);
};

g_Commands["wh40k-support"] = function(player, cmd, data)
{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	if (cmpTrigger && typeof cmpTrigger.WH40KUseSupport == "function")
		cmpTrigger.WH40KUseSupport(player, String(cmd.power), +cmd.x, +cmd.z);
};

for (const type of ["walk", "walk-custom", "walk-to-range", "attack", "attack-walk", "attack-walk-custom", "patrol", "stop", "guard"])
{
	const original = g_Commands[type];
	if (!original)
		continue;
	g_Commands[type] = function(player, cmd, data)
	{
		const ret = original.call(this, player, cmd, data);
		const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
		if (cmpTrigger && typeof cmpTrigger.WH40KManual == "function")
			cmpTrigger.WH40KManual(player, data.entities);
		return ret;
	};
}
