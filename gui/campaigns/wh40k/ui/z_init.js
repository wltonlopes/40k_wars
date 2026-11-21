var g_WH40KPage;

function init(initData)
{
	return new Promise(closePageCallback => {
		try
		{
			g_WH40KPage = new WH40KPage(initData, closePageCallback);
		}
		catch (err)
		{
			error("40k Wars: " + err + "\n" + err.stack);
			closePageCallback({ [Engine.openRequest]: { "page": "page_pregame.xml" } });
		}
	});
}
