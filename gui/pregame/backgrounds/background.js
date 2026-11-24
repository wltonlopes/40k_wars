/**
 * 40k Wars: fundos do menu principal, com zoom e pan lentos e a vinheta do
 * warhr por cima. O menu sorteia um conjunto a cada vez que abre.
 *   wh40k            a batalha de Armageddon (tools/source/menu_background.png)
 *   wh40k_gothic     batalha gótica sob um céu infernal (tools/source/menu/gothic_battle.png)
 *   wh40k_eldar      vidente eldar sobre as ruínas (tools/source/menu/eldar.png)
 * As imagens originais são 1672x941; as texturas, 2048x1024 esticadas.
 * Os modos "cover" e "fill" estão no gui/pregame/BackgroundHandler.js deste mod.
 */
const VIGNETTE = { "sprite": "background-wh40k-vignette", "fill": true };

export const backgrounds = {
	"wh40k": [
		{
			"sprite": "background-wh40k-armageddon",
			"cover": true,
			"aspect": 1672 / 941,
			"zoom": time => 1.07 + 0.04 * Math.sin(0.035 * time),
			"pan": time => ({
				"x": 0.6 + 0.4 * Math.cos(0.023 * time),
				"y": 0.4 * Math.sin(0.031 * time)
			})
		},
		VIGNETTE
	],
	"wh40k_gothic": [
		{
			"sprite": "background-wh40k-gothic",
			"cover": true,
			"aspect": 1672 / 941,
			"zoom": time => 1.08 + 0.05 * Math.sin(0.03 * time),
			"pan": time => ({
				"x": 0.5 * Math.sin(0.02 * time),
				"y": -0.3 + 0.3 * Math.cos(0.027 * time)
			})
		},
		VIGNETTE
	],
	"wh40k_eldar": [
		{
			"sprite": "background-wh40k-eldar",
			"cover": true,
			"aspect": 1672 / 941,
			"zoom": time => 1.06 + 0.04 * Math.sin(0.032 * time),
			// A vidente fica à esquerda: o pan não a tira da tela.
			"pan": time => ({
				"x": -0.6 + 0.35 * Math.cos(0.021 * time),
				"y": 0.3 * Math.sin(0.029 * time)
			})
		},
		VIGNETTE
	]
};
