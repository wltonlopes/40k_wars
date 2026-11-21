/**
 * Trigger de teste (tools/test/battletest.sh): censo a cada 15 s de jogo,
 * lança os apoios assim que ficam prontos (no inimigo mais próximo do
 * centro) e registra o resultado final.
 */
Trigger.prototype.WH40KTestCensus = function()
{
	const w = this.wh40k;
	if (!w)
		return;
	const t = Math.round(this.WH40KTime() / 1000);
	const parts = [];
	for (const p of [1, 2])
	{
		let bats = 0;
		const orders = {};
		for (const id in w.bats)
			if (w.bats[id].player == p && w.bats[id].ents.length)
			{
				++bats;
				orders[w.bats[id].order] = (orders[w.bats[id].order] || 0) + 1;
			}
		const sup = Object.keys(w.support[p]).map(k => k + ":" + w.support[p][k].progress + "/" + w.support[p][k].need + "x" + w.support[p][k].uses).join(" ");
		parts.push("P" + p + " homens " + this.WH40KMen(p) + "/" + w.initialMen[p] + " bat " + bats + " kills " + w.kills[p] + " " + uneval(orders) + " apoio[" + sup + "]" + (w.retreating[p] ? " RECUANDO" : ""));
	}
	warn("[wh40ktest] t=" + t + "s " + parts.join(" | ") + " centro1=" + uneval(this.WH40KGuiState(1).center) + " mapa=" + w.mapSize);
	// Usa o apoio pronto.
	for (const p of [1, 2])
		for (const type in w.support[p])
			if (w.support[p][type].progress >= w.support[p][type].need)
			{
				let target;
				for (const id in w.bats)
					if (w.bats[id].player == 3 - p && w.bats[id].ents.length)
					{
						const pos = this.WH40KPos(w.bats[id].leader);
						if (pos)
						{
							target = pos;
							break;
						}
					}
				if (target)
				{
					const ok = this.WH40KUseSupport(p, type, target.x, target.y);
					warn("[wh40ktest] P" + p + " lança " + type + ": " + ok);
				}
			}
	if (w.finished && !this.wh40kTestDone)
	{
		this.wh40kTestDone = true;
		warn("[wh40ktest] RESULTADO " + uneval(w.result));
	}
};

{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.DoRepeatedly(15000, "WH40KTestCensus", {});
}

// Mostra o resultado no momento do fim (a partida sem janela fecha logo depois).
Trigger.prototype.WH40KTestWrap = function()
{
	const finish = Trigger.prototype.WH40KFinish;
	Trigger.prototype.WH40KFinish = function(winner)
	{
		finish.call(this, winner);
		warn("[wh40ktest] FIM t=" + Math.round(this.WH40KTime() / 1000) + "s RESULTADO " + uneval(this.wh40k.result));
	};
};
Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger).DoAfterDelay(10, "WH40KTestWrap", {});
