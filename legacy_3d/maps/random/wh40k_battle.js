/**
 * Campo de batalha da campanha 40k Wars.
 *
 * O terreno vem da província (settings.WH40K.terrain) e as feições
 * (settings.WH40K.features: colinas, florestas, ruínas, crateras, água,
 * rochas) ficam nas mesmas posições mostradas na tela de desdobramento
 * da campanha (x, y de 0 a 1; y = 0 é o norte, onde fica o jogador 2).
 * Sem configuração (partida avulsa), sorteia um terreno e feições.
 * Os exércitos são criados por maps/scripts/WH40KBattle.js.
 */
Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

const WH40K_TERRAINS = {
	"hive": {
		"main": ["temperate_paving_01", "alpine_paving_stones_02", "medit_road_broken", "dirt_burned", "temperate_paving_03"],
		"patch": ["temp_road_broken", "dirt_burned"], "hill": ["alpine_cliff", "temp_dirt_gravel"],
		"trees": ["gaia/tree/dead", "gaia/tree/oak_dead"], "floor": "dirt_burned",
		"sky": "overcast", "sun": [0.85, 0.7, 0.55], "fog": [0.35, 0.3, 0.27], "fogFactor": 0.003, "saturation": 0.55
	},
	"industrial": {
		"main": ["dirt_brown_d", "temp_dirt_gravel", "dirt_burned", "medit_road_broken"],
		"patch": ["dirt_burned", "temp_road_broken"], "hill": ["desert_cliff_badlands", "dirt_brown_e"],
		"trees": ["gaia/tree/dead", "gaia/tree/elm_dead"], "floor": "dirt_burned",
		"sky": "stormy", "sun": [0.95, 0.65, 0.45], "fog": [0.4, 0.3, 0.22], "fogFactor": 0.007, "saturation": 0.5
	},
	"ash": {
		"main": ["desert_dirt_cracks", "sahara_dirt_cracks_01", "desert_dirt_rough", "dirt_burned"],
		"patch": ["desert_dirt_badlands", "dirt_burned"], "hill": ["desert_cliff_badlands_2", "desert_dirt_rough_2"],
		"trees": ["gaia/tree/date_palm_dead", "gaia/tree/dead"], "floor": "desert_dirt_rough",
		"sky": "sunset", "sun": [1.0, 0.75, 0.5], "fog": [0.5, 0.42, 0.35], "fogFactor": 0.005, "saturation": 0.45
	},
	"jungle": {
		"main": ["tropic_grass_c", "tropic_grass_plants", "tropic_forestfloor_a", "tropic_mud_a"],
		"patch": ["tropic_mud_a", "tropic_dirt_b_plants"], "hill": ["tropic_cliff_a_plants", "tropic_grass_a"],
		"trees": ["gaia/tree/tropic_rainforest", "gaia/tree/palm_tropical", "gaia/tree/teak", "gaia/tree/strangler"], "floor": "tropic_forestfloor_a",
		"sky": "cumulus", "sun": [0.9, 0.95, 0.8], "fog": [0.3, 0.38, 0.3], "fogFactor": 0.006, "saturation": 0.7
	},
	"mire": {
		"main": ["tropic_swamp_a", "temp_mud_a", "mud_flats", "temp_mud_plants"],
		"patch": ["mud_temp", "temp_mud_plants"], "hill": ["tropic_cliff_mud", "temp_mud_a"],
		"trees": ["gaia/tree/mangrove", "gaia/tree/poplar_dead", "gaia/tree/dead"], "floor": "temp_mud_plants",
		"sky": "overcast", "sun": [0.75, 0.8, 0.65], "fog": [0.3, 0.33, 0.25], "fogFactor": 0.01, "saturation": 0.5
	},
	"mountains": {
		"main": ["alpine_dirt", "alpine_grass_rocky", "temp_dirt_gravel", "alpine_mountainside"],
		"patch": ["alpine_cliff_a", "temp_dirt_gravel_b"], "hill": ["alpine_cliff_a", "alpine_cliff_b"],
		"trees": ["gaia/tree/pine_black_dead", "gaia/tree/pine_black", "gaia/tree/fir"], "floor": "alpine_forrestfloor",
		"sky": "stormy", "sun": [0.85, 0.85, 0.9], "fog": [0.4, 0.4, 0.45], "fogFactor": 0.005, "saturation": 0.6
	},
	"plains": {
		"main": ["steppe_grass_dirt_66", "steppe_grass_b", "steppe_dirt_a", "temp_dirt_gravel_plants"],
		"patch": ["steppe_dirt_b", "steppe_grass_c"], "hill": ["steppe_grass_dirt_33", "steppe_dirt_rocks_a"],
		"trees": ["gaia/tree/poplar_lombardy", "gaia/tree/euro_birch", "gaia/tree/oak_dead"], "floor": "steppe_grass_c",
		"sky": "cumulus", "sun": [1.0, 0.92, 0.75], "fog": [0.45, 0.42, 0.35], "fogFactor": 0.004, "saturation": 0.65
	},
	"ice": {
		"main": ["polar_snow_a", "polar_snow_rocks", "polar_ice_snow", "polar_tundra_snow"],
		"patch": ["polar_ice_b", "polar_snow_glacial"], "hill": ["polar_cliff_snow", "polar_cliff_a"],
		"trees": ["gaia/tree/fir_winter", "gaia/tree/pine_w"], "floor": "polar_snow_a",
		"sky": "overcast", "sun": [0.8, 0.85, 1.0], "fog": [0.55, 0.6, 0.7], "fogFactor": 0.007, "saturation": 0.5
	},
	"rok": {
		"main": ["savanna_dirt_rocks_b_red", "desert_dirt_badlands", "dirt_cracked_b", "savanna_dirt_b_red"],
		"patch": ["savanna_dirt_rocks_c_red", "dirt_burned"], "hill": ["savanna_cliff_b_red", "savanna_cliff_a_red"],
		"trees": ["gaia/tree/baobab_4_dead", "gaia/tree/dead"], "floor": "dirt_burned",
		"sky": "dark", "sun": [1.0, 0.7, 0.5], "fog": [0.2, 0.12, 0.1], "fogFactor": 0.004, "saturation": 0.5
	},
	"station": {
		"main": ["medit_city_tile", "desert_city_tile_plaza", "temperate_paving_04", "alpine_paving_stones_01"],
		"patch": ["medit_city_pavement", "temperate_paving_02"], "hill": ["alpine_paving_stones_02", "temperate_paving_03"],
		"trees": ["gaia/tree/dead"], "floor": "temperate_paving_02",
		"sky": "dark", "sun": [0.75, 0.8, 1.0], "fog": [0.1, 0.1, 0.15], "fogFactor": 0.003, "saturation": 0.4
	}
};

const WH40K_RUINS = ["gaia/wh40k/ruin_bunker", "gaia/wh40k/ruin_tower", "gaia/wh40k/ruin_monument", "gaia/wh40k/wreck_tank", "gaia/wh40k/ruin_chaos"];
const WH40K_DECOR = ["actor|geology/stone_granite_med.xml", "actor|geology/stone_granite_small.xml", "actor|props/special/eyecandy/barrels_buried.xml"];

function wh40kRandomFeatures(terrain)
{
	const counts = {
		"hive": { "ruins": 10, "crater": 3 }, "industrial": { "ruins": 7, "crater": 5 }, "ash": { "rocks": 4, "crater": 3, "hill": 2 },
		"jungle": { "forest": 9 }, "mire": { "water": 5, "forest": 3 }, "mountains": { "hill": 6, "rocks": 3 },
		"plains": { "forest": 3, "hill": 2 }, "ice": { "hill": 3, "rocks": 3 }, "rok": { "crater": 8, "rocks": 3 }, "station": { "ruins": 12 }
	}[terrain] || { "hill": 3, "forest": 3 };
	const features = [];
	for (const type in counts)
		for (let i = 0; i < counts[type]; ++i)
			features.push({ "type": type, "x": randFloat(0.08, 0.92), "y": randFloat(0.27, 0.73), "r": randFloat(0.035, 0.07) });
	return features;
}

export function* generateMap(mapSettings)
{
	const wh = mapSettings.WH40K || {};
	const terrain = WH40K_TERRAINS[wh.terrain] ? wh.terrain : pickRandom(Object.keys(WH40K_TERRAINS));
	const T = WH40K_TERRAINS[terrain];

	const heightLand = 3;
	globalThis.g_Map = new RandomMap(heightLand, T.main);
	const mapSize = g_Map.getSize();
	const clFeature = g_Map.createTileClass();
	const clDeploy = g_Map.createTileClass();
	const clWater = g_Map.createTileClass();

	setSkySet(T.sky);
	setSunColor(...T.sun);
	setSunElevation(randFloat(0.45, 0.75));
	setSunRotation(randomAngle());
	setFogColor(...T.fog);
	setFogFactor(T.fogFactor);
	setFogThickness(0.25);
	setPPEffect("hdr");
	setPPSaturation(T.saturation);
	setPPContrast(0.75);
	setPPBloom(0.25);
	setWaterColor(0.12, 0.15, 0.12);
	setWaterTint(0.25, 0.28, 0.2);
	setWaterMurkiness(0.95);

	// Câmera inicial (não há entidades dos jogadores no começo): atrás do
	// exército do jogador 1 (sul), olhando para o norte, para o campo.
	{
		const world = mapSize * TERRAIN_TILE_SIZE;
		const height = 110;
		const target = world * 0.3;
		g_Camera.Position = { "x": world / 2, "y": height, "z": Math.max(0, target - height * 1.732) }; // declinação padrão de 30°
		g_Camera.Rotation = 0;
	}

	const tile = (x, y) => new Vector2D(Math.max(1, Math.min(mapSize - 2, x * mapSize)), Math.max(1, Math.min(mapSize - 2, (1 - y) * mapSize)));

	// Chão variado: manchas do terreno.
	createPatches([scaleByMapSize(3, 6), scaleByMapSize(5, 12)], T.patch, null, scaleByMapSize(25, 80), g_Map.createTileClass());
	createBumps(null, scaleByMapSize(30, 120), 1, 6, 3);

	// Zonas de desdobramento planas (sul e norte).
	for (const y of [0.87, 0.13])
		createArea(
			new RectPlacer(tile(0.03, y + 0.1), tile(0.97, y - 0.1)),
			[new SmoothElevationPainter(ELEVATION_SET, heightLand, 6), new TileClassPainter(clDeploy)]);
	yield 20;

	const features = wh.features && wh.features.length ? wh.features : wh40kRandomFeatures(terrain);
	for (const f of features)
	{
		const center = tile(f.x, f.y);
		const radius = Math.max(3, (+f.r || 0.05) * mapSize);
		const placer = new ClumpPlacer(diskArea(radius), 0.75, 0.1, Infinity, center);
		switch (f.type)
		{
		case "hill":
			createArea(placer, [
				new SmoothElevationPainter(ELEVATION_MODIFY, 6 + radius * 0.35, radius * 0.7),
				new LayeredPainter([T.hill[1], T.hill[0]], [2]),
				new TileClassPainter(clFeature)]);
			break;
		case "forest":
		{
			const trees = T.trees.map(t => T.floor + TERRAIN_SEPARATOR + t);
			createArea(placer, [new TerrainPainter([...trees, T.floor, ...trees]), new TileClassPainter(clFeature)]);
			break;
		}
		case "water":
			createArea(placer, [
				new SmoothElevationPainter(ELEVATION_SET, -2.5, Math.max(2, radius * 0.4)),
				new TerrainPainter(T.patch[0]),
				new TileClassPainter(clWater)]);
			break;
		case "crater":
			createArea(placer, [
				new SmoothElevationPainter(ELEVATION_MODIFY, -5, radius * 0.6),
				new TerrainPainter("dirt_burned"),
				new TileClassPainter(clFeature)]);
			break;
		case "rocks":
		{
			createArea(placer, [new SmoothElevationPainter(ELEVATION_MODIFY, 3, radius * 0.5), new TerrainPainter(T.hill), new TileClassPainter(clFeature)]);
			const count = Math.round(radius * 0.8);
			for (let i = 0; i < count; ++i)
				g_Map.placeEntityAnywhere(pickRandom(WH40K_DECOR), 0,
					Vector2D.add(center, new Vector2D(randFloat(0, radius), 0).rotate(randomAngle())), randomAngle());
			break;
		}
		case "ruins":
		default:
		{
			createArea(new ClumpPlacer(diskArea(radius), 0.9, 0.2, Infinity, center),
				[new SmoothElevationPainter(ELEVATION_SET, heightLand, 3), new TerrainPainter(T.patch), new TileClassPainter(clFeature)]);
			// Algumas construções abandonadas, sem sobrepor (distância mínima).
			const placed = [];
			const tries = Math.max(2, Math.round(radius / 3));
			for (let i = 0; i < tries * 4 && placed.length < tries; ++i)
			{
				const pos = Vector2D.add(center, new Vector2D(randFloat(0, radius * 0.8), 0).rotate(randomAngle()));
				if (placed.some(o => o.distanceTo(pos) < 9))
					continue;
				placed.push(pos);
				const big = randBool(0.18);
				const template = big ? pickRandom(WH40K_RUINS.slice(3)) : pickRandom(WH40K_RUINS.slice(0, 3));
				g_Map.placeEntityPassable(template, 0, pos, randomAngle());
			}
			break;
		}
		}
	}
	yield 60;

	paintTerrainBasedOnHeight(-10, 0.2, Elevation_IncludeMin_ExcludeMax, T.patch[0]);

	// Destroços e árvores mortas espalhados (fora das feições e das zonas).
	createObjectGroupsDeprecated(
		new SimpleGroup([new SimpleObject(pickRandom(T.trees), 1, 2, 0, 3)], true, clFeature),
		0, avoidClasses(clDeploy, 4, clFeature, 4, clWater, 2), scaleByMapSize(8, 30), 50);
	createDecoration(
		[[new SimpleObject(WH40K_DECOR[0], 1, 2, 0, 1)], [new SimpleObject(WH40K_DECOR[1], 2, 4, 0, 2)]],
		[scaleByMapAreaAbsolute(10), scaleByMapAreaAbsolute(14)],
		avoidClasses(clDeploy, 2, clFeature, 1, clWater, 1));
	yield 90;

	return g_Map;
}
