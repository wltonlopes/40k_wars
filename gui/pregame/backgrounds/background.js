/**
 * 40k Wars: um só fundo, a batalha de Armageddon (tools/source/menu_background.png),
 * com zoom e pan lentos e a vinheta do warhr por cima.
 * Os modos "cover" e "fill" estão no gui/pregame/BackgroundHandler.js deste mod.
 */
export const backgrounds = {
	"wh40k": [
		{
			"sprite": "background-wh40k-armageddon",
			"cover": true,
			// proporção da imagem original (1672x941); a textura é 2048x1024 esticada
			"aspect": 1672 / 941,
			"zoom": time => 1.07 + 0.04 * Math.sin(0.035 * time),
			"pan": time => ({
				"x": 0.6 + 0.4 * Math.cos(0.023 * time),
				"y": 0.4 * Math.sin(0.031 * time)
			})
		},
		{
			"sprite": "background-wh40k-vignette",
			"fill": true
		}
	]
};
