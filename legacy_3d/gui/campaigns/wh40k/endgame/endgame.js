/**
 * Página transitória aberta pela sessão (CampaignSession.onFinish) no fim
 * da batalha: guarda o resultado no save da campanha. O mapa da campanha
 * aplica o resultado ao abrir (WH40KPage.applyEndedGame).
 * Precisa devolver uma Promise resolvida para fechar a página filha.
 */
function init(endGameData)
{
	try
	{
		const run = CampaignRun.getCurrentRun();
		run.data.processEndedGame = {
			"won": !!endGameData.won,
			"custom": endGameData.custom || {}
		};
		run.save();
	}
	catch (err)
	{
		error("40k Wars endgame: " + err + "\n" + err.stack);
	}
	return Promise.resolve();
}
