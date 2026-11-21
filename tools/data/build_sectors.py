"""Gera os setores das campanhas novas e a lista de cenários:
campaigns/wh40k/data/scenarios.json, sector_damocles.json, sector_cadia.json.
(O setor de Armageddon, sector.json, é editado à mão.)
Depois rode tools/art/gen_planets.py para gerar os mapas.

Província: (id, nome, terreno, x, y, dono, colmeia, fortes, guarnição, estaleiro)
"""
import json
import os
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "campaigns/wh40k/data")


def P(id, name, terrain, x, y, owner=None, hive=0, forts=0, garrison=(), shipyard=False):
    d = OrderedDict([("id", id), ("name", name), ("terrain", terrain), ("x", x), ("y", y)])
    if owner:
        d["owner"] = owner
    if hive:
        d["hive"] = hive
    if forts:
        d["forts"] = forts
    if shipyard:
        d["shipyard"] = True
    d["garrison"] = list(garrison)
    return d


def SEA(id, x, y):
    return OrderedDict([("id", id), ("name", "Mar"), ("terrain", "sea"), ("x", x), ("y", y)])


def B(id, name, kind, cls, orbit, angle, size, palette, neutral, seed, desc, provinces, parent=None, big=False):
    d = OrderedDict([("id", id), ("name", name), ("kind", kind), ("class", cls)])
    if parent:
        d["parent"] = parent
    d.update([("orbit", orbit), ("angle", angle), ("size", size), ("mapSize", [2048, 1280] if big else [1024, 640]), ("seed", seed),
              ("palette", palette), ("desc", desc), ("neutralCiv", neutral), ("provinces", provinces)])
    return d


def station(prefix, name, parent, orbit, angle, owner, seed, desc, garrison_unit):
    return B(prefix, name, "station", "Estação Orbital", orbit, angle, 0.32, "station", owner, seed, desc, [
        P(prefix + "_yards", "Estaleiros", "station", 0.25, 0.5, owner, 1, 2, [garrison_unit], True),
        P(prefix + "_ring", "Anel de Atracação", "station", 0.55, 0.35, owner, 0, 0, [garrison_unit]),
        P(prefix + "_battery", "Bateria de Defesa", "station", 0.78, 0.62, owner, 0, 1, []),
    ], parent=parent)


DESC = ("Sistema estelar e corpos celestes (mesmo formato do sector.json). Gerado por tools/data/build_sectors.py; "
        "mapas por tools/art/gen_planets.py.")

# ------------------------------------------------------------ Invasão Tirânida: Golfo de Damocles
DAMOCLES = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "999.M41", "monthsPerTurn": 1}),
    ("system", {"id": "damocles", "name": "Golfo de Damocles", "star": {"name": "Sha'draig", "color": [255, 222, 170]},
                "desc": "Fronteira entre o Imperium e o Império Tau, agora no caminho de uma lasca da Frota-Colmeia Gorgon."}),
    ("bodies", [
        B("agrellan", "Agrellan", "planet", "Mundo Contestado", 0.28, 200, 1.0, "hive", "imperial", 63,
          "Mundo-colmeia disputado por Imperium e Tau. Ao sul, os esporos tiranídeos já transformaram selvas em biomassa.", [
              P("mugulath", "Baía de Mu'gulath", "hive", 0.18, 0.28, "imperial", 2, 2, ["guard_platoon", "guard_platoon"], True),
              P("pathos", "Colmeia Pathos", "hive", 0.37, 0.17, "imperial", 2, 1, ["guard_platoon"]),
              P("fort_damocles", "Fortaleza Damocles", "industrial", 0.09, 0.52, "imperial", 1, 3, ["heavy_weapons"]),
              P("arlarn", "Planícies de Ar'larn", "plains", 0.30, 0.43, "imperial", 0, 0, ["guard_platoon"]),
              P("kelshan", "Picos de Kel'shan", "mountains", 0.50, 0.33, None, 0, 1, ["guard_platoon"]),
              P("gelbryn", "Calota de Gel'bryn", "ice", 0.62, 0.08, None, 0, 0, []),
              P("katuo", "Cidade Ka'tuo", "hive", 0.80, 0.25, "tau", 2, 2, ["fire_warriors", "fire_warriors"], True),
              P("vashya", "Vale de Vash'ya", "plains", 0.66, 0.42, "tau", 0, 0, ["kroot"]),
              P("fiotaun", "Domos de Fio'taun", "industrial", 0.91, 0.52, "tau", 1, 1, ["fire_warriors"]),
              P("lorak", "Pântanos de Lorak", "mire", 0.48, 0.56, None, 0, 0, ["guard_platoon"]),
              P("grey_wastes", "Ermos Cinzentos", "ash", 0.19, 0.77, None, 0, 0, []),
              P("devoured", "Selva Devorada", "biomass", 0.36, 0.71, "tyranids", 0, 0, ["hormagaunts"]),
              P("gorgon_nest", "Ninho Gorgon", "biomass", 0.56, 0.81, "tyranids", 2, 1, ["termagants", "termagants", "warriors"]),
              P("spore_chasm", "Abismo de Esporos", "biomass", 0.75, 0.70, "tyranids", 0, 0, ["termagants"]),
              P("shadraig_jungle", "Selva de Sha'draig", "jungle", 0.88, 0.86, None, 0, 0, ["guard_platoon"]),
              SEA("ag_sea_nw", 0.02, 0.06), SEA("ag_sea_sw", 0.05, 0.97), SEA("ag_sea_e", 0.995, 0.75),
          ], big=True),
        station("valiant", "Doca Valiant", "prefectia", 0.075, 130, "imperial", 17,
                "Estaleiro da Marinha Imperial em órbita de Prefectia.", "guard_platoon"),
        B("prefectia", "Prefectia", "planet", "Mundo Agrícola", 0.16, 60, 0.7, "agri", "imperial", 81,
          "Celeiro imperial do Golfo, defendido por regimentos locais.", [
              P("prefectia_hive", "Colmeia Prefectia", "hive", 0.45, 0.40, "imperial", 2, 2, ["guard_platoon", "guard_platoon"], True),
              P("fields_n", "Campos do Norte", "plains", 0.20, 0.30, "imperial", 0, 0, ["guard_platoon"]),
              P("fields_s", "Campos do Sul", "plains", 0.35, 0.74, "imperial", 0, 0, []),
              P("ice_mine", "Minas de Gelo", "ice", 0.76, 0.20, "imperial", 0, 0, []),
              P("prefectia_jungle", "Selva Oriental", "jungle", 0.76, 0.70, None, 0, 0, ["guard_platoon"]),
              SEA("pf_sea_a", 0.96, 0.96), SEA("pf_sea_b", 0.04, 0.96),
          ]),
        B("dalyth", "Dal'yth", "planet", "Mundo-Seita Tau", 0.38, 330, 0.8, "tau", "tau", 71,
          "Mundo-seita tau, todo planejado em domos e cidades brancas.", [
              P("dalyth_city", "Cidade-Seita Dal'yth", "hive", 0.50, 0.45, "tau", 2, 2, ["fire_warriors", "breachers"], True),
              P("korvesa", "Planícies Kor'vesa", "plains", 0.22, 0.35, "tau", 0, 0, ["fire_warriors"]),
              P("dalyth_domes", "Domos de Fio", "industrial", 0.78, 0.35, "tau", 1, 0, ["fire_warriors"]),
              P("kroot_jungle", "Selva Kroot", "jungle", 0.30, 0.76, "tau", 0, 0, ["kroot"]),
              P("shas_mountains", "Montes Shas", "mountains", 0.72, 0.76, "tau", 0, 0, []),
              SEA("dl_sea_a", 0.5, 0.97), SEA("dl_sea_b", 0.03, 0.04),
          ]),
        station("koro", "Estação Kor'O", "dalyth", 0.075, 200, "tau", 23,
                "Estaleiro orbital da casta do ar tau.", "fire_warriors"),
        B("kel", "Kel-Morai", "planet", "Mundo Devorado", 0.47, 140, 0.75, "bio", "tyranids", 91,
          "Um mundo já consumido: oceanos de ácido, florestas de carne e torres capilares que sugam a biomassa para os navios-colmeia.", [
              P("kel_nest", "Ninho Primordial", "biomass", 0.50, 0.45, "tyranids", 2, 1, ["warriors", "termagants"], True),
              P("kel_flesh", "Planícies de Carne", "biomass", 0.20, 0.40, "tyranids", 0, 0, ["termagants"]),
              P("kel_spires", "Torres Capilares", "biomass", 0.76, 0.30, "tyranids", 0, 0, ["hormagaunts"]),
              P("kel_ruins", "Ruínas da Colônia", "ash", 0.70, 0.76, None, 0, 0, []),
              P("kel_ice", "Gelo Morto", "ice", 0.25, 0.80, "tyranids", 0, 0, []),
              SEA("kl_sea_a", 0.5, 0.03), SEA("kl_sea_b", 0.97, 0.97),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "imperial", "general": "straken", "body": "agrellan", "province": "mugulath",
         "battalions": ["guard_platoon", "guard_platoon", "flamers", "sentinel", "chimera", "leman_russ"]},
        {"faction": "tau", "general": "farsight", "body": "agrellan", "province": "katuo",
         "battalions": ["fire_warriors", "fire_warriors", "kroot", "pathfinders", "crisis_suits", "devilfish"]},
        {"faction": "tyranids", "general": "hive_tyrant", "body": "agrellan", "province": "gorgon_nest",
         "battalions": ["termagants", "termagants", "termagants", "hormagaunts", "hormagaunts", "warriors", "carnifex"]},
        {"faction": "tyranids", "general": "old_one_eye", "body": "kel", "province": "kel_nest",
         "battalions": ["termagants", "termagants", "hormagaunts", "carnifex"]},
    ]),
    ("startingFleets", [
        {"faction": "imperial", "body": "agrellan", "ships": 2},
        {"faction": "imperial", "body": "prefectia", "ships": 2},
        {"faction": "tau", "body": "dalyth", "ships": 3},
        {"faction": "tyranids", "body": "kel", "ships": 4},
    ]),
])

# ------------------------------------------------------------ 13ª Cruzada Negra: Portão de Cadia
CADIA = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "999.M41", "monthsPerTurn": 1}),
    ("system", {"id": "cadia", "name": "Portão de Cadia", "star": {"name": "Cadia", "color": [255, 232, 205]},
                "desc": "O único caminho estável para fora do Olho do Terror. Dez mil anos de vigília, e agora a 13ª Cruzada Negra."}),
    ("bodies", [
        B("cadia", "Cadia", "planet", "Mundo-Fortaleza", 0.20, 210, 1.0, "fortress", "imperial", 99,
          "Planeta-fortaleza de kasrs e trincheiras. Os pilones antigos que seguram o Olho ficam em campos proibidos.", [
              P("kasr_myrak", "Kasr Myrak", "hive", 0.28, 0.25, "imperial", 2, 3, ["guard_platoon", "guard_platoon", "heavy_weapons"], True),
              P("kasr_partox", "Kasr Partox", "hive", 0.52, 0.19, "imperial", 2, 2, ["guard_platoon", "guard_platoon"]),
              P("kasr_kraf", "Kasr Kraf", "hive", 0.75, 0.30, "imperial", 2, 2, ["guard_platoon"]),
              P("kasr_sonnen", "Kasr Sonnen", "hive", 0.40, 0.50, "imperial", 2, 2, ["guard_platoon", "heavy_weapons"]),
              P("kasr_gallan", "Kasr Gallan", "hive", 0.67, 0.56, "imperial", 2, 2, ["guard_platoon"]),
              P("caducades", "Planícies Caducades", "plains", 0.14, 0.50, "imperial", 0, 0, ["guard_platoon"]),
              P("elysion", "Campos Elysion", "plains", 0.55, 0.38, "imperial", 0, 0, []),
              P("cadian_peaks", "Montes Cadianos", "mountains", 0.09, 0.22, "imperial", 0, 1, []),
              P("boreal_tundra", "Tundra Boreal", "ice", 0.44, 0.05, "imperial", 0, 0, []),
              P("pylon_holn", "Pilones de Kasr Holn", "tomb", 0.89, 0.15, "necrons", 0, 2, ["necron_warriors", "necron_warriors"]),
              P("pylon_seroleum", "Pilones de Seroleum", "tomb", 0.86, 0.72, "necrons", 0, 1, ["necron_warriors"]),
              P("tyrok_ruins", "Kasr Tyrok (profanado)", "warp", 0.25, 0.76, "chaos", 2, 1, ["cultists", "chaos_marines"]),
              P("black_breach", "Brecha Negra", "warp", 0.46, 0.83, "chaos", 0, 0, ["cultists", "cultists"]),
              P("lorn_mire", "Pântano de Lorn", "mire", 0.64, 0.80, None, 0, 0, ["guard_platoon"]),
              SEA("cd_sea_a", 0.03, 0.92), SEA("cd_sea_b", 0.98, 0.97), SEA("cd_sea_c", 0.99, 0.44),
          ], big=True),
        station("ultima", "Bastião Ultima", "cadia", 0.075, 330, "imperial", 29,
                "Estação-fortaleza da Frota de Batalha Cadiana.", "guard_platoon"),
        B("agripinaa", "Agripinaa", "planet", "Mundo-Forja", 0.31, 330, 0.8, "volcanic", "imperial", 103,
          "Mundo-forja do Mechanicus que arma o Portão de Cadia.", [
              P("agri_forge", "Forja Primária", "industrial", 0.50, 0.45, "imperial", 2, 2, ["skitarii_rangers", "guard_platoon"], True),
              P("agri_mines", "Minas de Adamantium", "mountains", 0.20, 0.30, "imperial", 0, 0, []),
              P("agri_slag", "Ermos de Escória", "ash", 0.76, 0.30, "imperial", 0, 0, ["guard_platoon"]),
              P("agri_vents", "Respiros Vulcânicos", "industrial", 0.30, 0.76, "imperial", 1, 0, []),
              P("agri_soot", "Desertos de Fuligem", "ash", 0.76, 0.76, None, 0, 0, ["guard_platoon"]),
              SEA("ap_sea", 0.5, 0.97),
          ]),
        B("vorkaas", "Vor'kaas", "planet", "Mundo-Demônio", 0.47, 120, 0.85, "warp", "chaos", 107,
          "Um mundo engolido pela disformidade, base avançada da Cruzada Negra na borda do Olho.", [
              P("vork_citadel", "Cidadela da Cruzada", "warp", 0.50, 0.45, "chaos", 2, 2, ["chaos_marines", "cultists"], True),
              P("vork_altars", "Altares de Sangue", "warp", 0.20, 0.35, "chaos", 0, 0, ["cultists"]),
              P("vork_spires", "Torres de Carne", "warp", 0.78, 0.30, "chaos", 0, 0, ["cultists"]),
              P("vork_wastes", "Ermos Gritantes", "ash", 0.30, 0.76, "chaos", 0, 0, []),
              P("vork_mire", "Lodo Profano", "mire", 0.72, 0.76, "chaos", 0, 0, []),
              SEA("vk_sea", 0.5, 0.03),
          ]),
        B("ulthwe", "Mundo-Nave Ulthwé", "station", "Mundo-Nave Eldar", 0.40, 25, 0.45, "station", "eldar", 109,
          "O mundo-nave que vigia o Olho do Terror, guiado pelos videntes de Eldrad Ulthran.", [
              P("ulthwe_dome", "Domo dos Videntes", "station", 0.45, 0.45, "eldar", 2, 2, ["guardians", "dire_avengers"], True),
              P("ulthwe_gardens", "Jardins do Domo", "jungle", 0.22, 0.35, "eldar", 0, 0, []),
              P("ulthwe_shrines", "Santuários dos Aspectos", "station", 0.72, 0.38, "eldar", 1, 1, ["guardians"]),
              P("ulthwe_docks", "Portos da Teia", "station", 0.55, 0.72, "eldar", 0, 0, []),
          ]),
        B("thyrr", "Thyrr", "planet", "Mundo-Tumba", 0.36, 265, 0.7, "tomb", "necrons", 113,
          "Mundo-tumba da Dinastia Sautekh, desperto pelo tremor dos pilones de Cadia.", [
              P("thyrr_pyramid", "Grande Pirâmide", "tomb", 0.50, 0.45, "necrons", 2, 2, ["immortals", "necron_warriors"], True),
              P("thyrr_halls", "Salões Silenciosos", "tomb", 0.20, 0.35, "necrons", 0, 0, ["necron_warriors"]),
              P("thyrr_dunes", "Dunas Mortas", "ash", 0.78, 0.30, "necrons", 0, 0, []),
              P("thyrr_vaults", "Cofres Estáticos", "tomb", 0.30, 0.76, "necrons", 1, 0, ["necron_warriors"]),
              P("thyrr_ice", "Gelo Eterno", "ice", 0.75, 0.76, None, 0, 0, []),
              SEA("th_sea", 0.5, 0.97),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "imperial", "general": "creed", "body": "cadia", "province": "kasr_myrak",
         "battalions": ["guard_platoon", "guard_platoon", "special_weapons", "chimera", "leman_russ", "sentinel"]},
        {"faction": "imperial", "general": "cain", "body": "cadia", "province": "kasr_gallan",
         "battalions": ["guard_platoon", "guard_grenadiers", "chimera"]},
        {"faction": "chaos", "general": "abaddon", "body": "cadia", "province": "tyrok_ruins",
         "battalions": ["chaos_marines", "chaos_marines", "cultists", "cultists", "raptors", "chaos_terminators", "predator"]},
        {"faction": "chaos", "general": "haarken", "body": "vorkaas", "province": "vork_citadel",
         "battalions": ["cultists", "chaos_marines", "chaos_rhino"]},
        {"faction": "eldar", "general": "eldrad", "body": "ulthwe", "province": "ulthwe_dome",
         "battalions": ["guardians", "guardians", "dire_avengers", "fire_dragons", "falcon"]},
        {"faction": "necrons", "general": "imotekh", "body": "thyrr", "province": "thyrr_pyramid",
         "battalions": ["necron_warriors", "necron_warriors", "necron_warriors", "immortals", "destroyers"]},
        {"faction": "necrons", "general": "anrakyr", "body": "cadia", "province": "pylon_holn",
         "battalions": ["necron_warriors", "necron_warriors", "scarabs"]},
    ]),
    ("startingFleets", [
        {"faction": "imperial", "body": "cadia", "ships": 3},
        {"faction": "imperial", "body": "agripinaa", "ships": 1},
        {"faction": "chaos", "body": "vorkaas", "ships": 4},
        {"faction": "eldar", "body": "ulthwe", "ships": 2},
        {"faction": "necrons", "body": "thyrr", "ships": 2},
    ]),
])

SCENARIOS = OrderedDict([
    ("Description", "Campanhas (cenários). sector: arquivo do setor; factions: facções em jogo; playable: as que o jogador pode escolher; "
                    "objective: corpo cujas cidades-colmeia (hive 2) decidem a vitória; intro: texto da escolha de lado; portraits: retratos da janela."),
    ("scenarios", [
        OrderedDict([("id", "armageddon"), ("name", "Cruzada de Armageddon"), ("sector", "sector.json"),
                     ("factions", ["imperial", "orks"]), ("playable", ["imperial", "orks"]),
                     ("objective", {"body": "armageddon", "label": "Colmeias de Armageddon", "text": "controlar todas as cidades-colmeia de Armageddon"}),
                     ("portraits", ["imperial/r0c6.png", "orks/r0c5.png"]),
                     ("intro", "999.M41. A Waaagh! de Ghazghkull Mag Uruk Thraka cai sobre o Sistema Armageddon."),
                     ("summary", "Guarda Imperial contra a Waaagh! de Ghazghkull.")]),
        OrderedDict([("id", "damocles"), ("name", "Invasão Tirânida"), ("sector", "sector_damocles.json"),
                     ("factions", ["imperial", "tau", "tyranids"]), ("playable", ["imperial", "tau", "tyranids"]),
                     ("objective", {"body": "agrellan", "label": "Colmeias de Agrellan", "text": "controlar todas as cidades de Agrellan"}),
                     ("portraits", ["tyranids/r2c3.png", "tau/r1c2.png"]),
                     ("intro", "999.M41. Enquanto Imperium e Tau disputam o Golfo de Damocles, uma lasca da Frota-Colmeia Gorgon desce das estrelas. Agrellan será o campo de batalha — ou o banquete."),
                     ("summary", "Imperium, Império Tau e a Frota-Colmeia Gorgon no Golfo de Damocles.")]),
        OrderedDict([("id", "cadia"), ("name", "13ª Cruzada Negra"), ("sector", "sector_cadia.json"),
                     ("factions", ["imperial", "chaos", "eldar", "necrons"]), ("playable", ["imperial", "chaos", "eldar", "necrons"]),
                     ("objective", {"body": "cadia", "label": "Kasrs de Cadia", "text": "controlar todos os kasrs de Cadia"}),
                     ("portraits", ["chaos/r2c0.png", "imperial/r0c5.png"]),
                     ("intro", "999.M41. Abaddon, o Saqueador, lança a 13ª Cruzada Negra contra Cadia. Os videntes de Ulthwé enxergam a ruína, e sob os pilones algo antigo desperta."),
                     ("summary", "Cadia contra a Legião Negra, com Ulthwé e os Necrons dos pilones.")]),
    ]),
])


def save(name, data):
    with open(os.path.join(DATA, name), "w") as f:
        json.dump(data, f, indent="\t", ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    save("sector_damocles.json", DAMOCLES)
    save("sector_cadia.json", CADIA)
    # Mantém os cenários de outros geradores (ex.: build_great_game.py).
    try:
        with open(os.path.join(DATA, "scenarios.json")) as f:
            old = json.load(f, object_pairs_hook=OrderedDict)
        mine = {s["id"] for s in SCENARIOS["scenarios"]}
        SCENARIOS["scenarios"] += [s for s in old["scenarios"] if s["id"] not in mine]
        SCENARIOS["Description"] = old.get("Description", SCENARIOS["Description"])
    except (OSError, ValueError, KeyError):
        pass
    save("scenarios.json", SCENARIOS)
    print("ok")
