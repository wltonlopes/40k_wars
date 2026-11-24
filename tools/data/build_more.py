"""Três campanhas com facções que já existem (v0.7):

  O Cerco de Baal (999.M41)        Blood Angels × Frota-Colmeia (Tiranídeos)
  A Guerra da Praga (111.M42)      Ultramarines e Guarda Imperial × Death Guard
  O Despertar de Sautekh (014.M42) Império Tau × Necrons × Orks

Escreve sector_baal.json, sector_ultramar.json, sector_sautekh.json e os
cenários em scenarios.json. Rodar depois de build_badab_vraks.py e antes de
build_mechanics.py; depois tools/art/gen_planets.py.
"""
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_factions import load, save  # noqa: E402
from build_sectors import P, SEA, B, station  # noqa: E402

DESC = ("Sistema estelar e corpos celestes (mesmo formato do sector.json). Gerado por tools/data/build_more.py; "
        "mapas por tools/art/gen_planets.py.")

# ============================================================ O Cerco de Baal
BAAL = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "999.M41", "monthsPerTurn": 1}),
    ("system", {"id": "baal", "name": "Sistema Baal", "star": {"name": "Baal", "color": [255, 200, 150]},
                "desc": "O mundo natal dos Blood Angels e as suas luas radioativas. A Frota-Colmeia Leviatã veio devorar o sangue de Sanguinius."}),
    ("bodies", [
        B("baal_prime", "Baal", "planet", "Mundo-Fortaleza", 0.20, 200, 1.0, "fortress", "blood_angels", 241,
          "O planeta da Fortaleza-Mosteiro, a Arx Angelicum. Os esporos tiranídeos já caíram nas planícies do norte.", [
              P("arx", "Arx Angelicum", "hive", 0.50, 0.42, "blood_angels", 2, 3, ["ba_intercessors", "ba_sanguinary_guard"], True),
              P("sanctum", "Santuário do Anjo", "hive", 0.30, 0.62, "blood_angels", 2, 2, ["ba_intercessors"]),
              P("chalice", "Torre do Cálice", "hive", 0.72, 0.62, "blood_angels", 2, 2, ["ba_intercessors"]),
              P("reliquary_b", "Relicário Vermelho", "industrial", 0.50, 0.70, "blood_angels", 1, 1, ["ba_scouts"]),
              P("red_dunes", "Dunas Vermelhas", "ash", 0.22, 0.32, None, 0, 0, []),
              P("salt_wastes", "Ermos de Sal", "plains", 0.80, 0.34, None, 0, 0, []),
              P("angel_peaks", "Picos do Anjo", "mountains", 0.50, 0.88, "blood_angels", 0, 1, []),
              P("rad_plains", "Planícies Radioativas", "ash", 0.12, 0.70, None, 0, 0, []),
              P("crystal_desert", "Deserto de Cristal", "plains", 0.88, 0.76, None, 0, 0, []),
              P("leviathan_nest", "Ninho da Leviatã", "biomass", 0.50, 0.12, "tyranids", 2, 3, ["warriors", "hive_guard", "genestealers", "termagants", "termagants"]),
              P("spore_field", "Ninho dos Esporos", "biomass", 0.28, 0.12, "tyranids", 2, 3, ["warriors", "zoanthropes", "genestealers", "termagants", "termagants"]),
              P("devoured_hills", "Colinas Devoradas", "biomass", 0.74, 0.14, "tyranids", 0, 1, ["hormagaunts", "termagants"]),
          ], big=True),
        B("baal_primus", "Baal Primus", "planet", "Lua Desértica", 0.085, 60, 0.42, "volcanic", "blood_angels", 243,
          "Uma lua de desertos vermelhos onde vivem as tribos que dão aspirantes aos Blood Angels.", [
              P("bp_tribes", "Tendas das Tribos", "hive", 0.48, 0.45, "blood_angels", 2, 1, ["ba_scouts", "ba_intercessors"], True),
              P("bp_dunes", "Mar de Dunas", "ash", 0.22, 0.32, "blood_angels", 0, 0, []),
              P("bp_ruins", "Ruínas da Era de Ouro", "industrial", 0.75, 0.62, "blood_angels", 1, 0, []),
          ], parent="baal_prime"),
        B("baal_secundus", "Baal Secundus", "planet", "Lua Radioativa", 0.13, 250, 0.45, "volcanic", "tyranids", 245,
          "A outra lua, já coberta de biomassa. Os navios-colmeia pousaram aqui primeiro.", [
              P("bs_pool", "Poça Digestiva", "biomass", 0.48, 0.45, "tyranids", 2, 1, ["termagants", "carnifex"], True),
              P("bs_spires", "Agulhas Capilares", "biomass", 0.22, 0.32, "tyranids", 0, 0, []),
              P("bs_ash", "Ermos Calcinados", "ash", 0.75, 0.62, "tyranids", 0, 0, []),
          ], parent="baal_prime"),
        B("leviathan", "Navio-Colmeia Leviatã", "planet", "Navio-Colmeia", 0.42, 140, 0.6, "bio", "tyranids", 247,
          "Uma frota-colmeia inteira presa à órbita alta: carne, ossos e fome.", [
              P("lv_heart", "Coração Sináptico", "biomass", 0.50, 0.45, "tyranids", 2, 2, ["warriors", "zoanthropes"], True),
              P("lv_gut", "Câmaras Digestivas", "biomass", 0.22, 0.32, "tyranids", 0, 0, []),
              P("lv_spines", "Espinhos Dorsais", "biomass", 0.78, 0.30, "tyranids", 0, 0, []),
              P("lv_brood", "Câmaras de Ninhada", "biomass", 0.50, 0.78, "tyranids", 1, 0, []),
          ]),
        station("angel_dock", "Ancoradouro do Anjo", "baal_prime", 0.17, 330, "blood_angels", 249,
                "Os estaleiros orbitais dos Blood Angels.", "ba_intercessors"),
    ]),
    ("startingArmies", [
        {"faction": "blood_angels", "general": "dante", "body": "baal_prime", "province": "arx",
         "battalions": ["ba_intercessors", "ba_intercessors", "ba_assault", "ba_death_company", "ba_sanguinary_guard", "ba_baal_predator"]},
        {"faction": "blood_angels", "general": "mephiston", "body": "baal_prime", "province": "chalice",
         "battalions": ["ba_intercessors", "ba_assault", "ba_inceptors"]},
        {"faction": "tyranids", "general": "hive_tyrant", "body": "baal_prime", "province": "leviathan_nest",
         "battalions": ["termagants", "termagants", "termagants", "hormagaunts", "hormagaunts", "genestealers", "warriors", "carnifex", "hive_guard", "gargoyles"]},
        {"faction": "tyranids", "general": "broodlord", "body": "baal_prime", "province": "spore_field",
         "battalions": ["termagants", "termagants", "hormagaunts", "hormagaunts", "genestealers", "genestealers", "warriors", "carnifex"]},
        {"faction": "tyranids", "general": "old_one_eye", "body": "baal_secundus", "province": "bs_pool",
         "battalions": ["termagants", "hormagaunts", "carnifex", "warriors", "genestealers", "termagants"]},
    ]),
    ("startingFleets", [
        {"faction": "blood_angels", "body": "baal_prime", "ships": 3},
        {"faction": "tyranids", "body": "leviathan", "ships": 5},
    ]),
])
BAAL_SC = OrderedDict([
    ("id", "baal"), ("name", "O Cerco de Baal"), ("sector", "sector_baal.json"),
    ("factions", ["blood_angels", "tyranids"]), ("playable", ["blood_angels", "tyranids"]),
    ("neutralName", "Tribos de Baal"),
    ("objective", {"body": "baal_prime", "label": "Fortalezas de Baal", "text": "controlar todas as cidades de Baal"}),
    ("portraits", ["blood_angels/r2c0.png", "tyranids/r2c3.png"]),
    ("intro", "999.M41. A Frota-Colmeia Leviatã cerca Baal, o mundo natal dos Blood Angels. Dante reúne o que resta do Capítulo na Arx Angelicum. Os esporos já caem nas planícies do norte — e a fome do enxame não tem fim."),
    ("summary", "Os Blood Angels defendem o seu mundo natal contra a Frota-Colmeia Leviatã."),
])

# ============================================================ A Guerra da Praga
ULTRAMAR = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "111.M42", "monthsPerTurn": 1}),
    ("system", {"id": "ultramar", "name": "Sistema Iax (Ultramar)", "star": {"name": "Iax", "color": [255, 240, 210]},
                "desc": "Iax, o mundo-jardim de Ultramar, recebe as bênçãos de Nurgle. A Death Guard quer apodrecer o coração do reino de Guilliman."}),
    ("bodies", [
        B("iax", "Iax", "planet", "Mundo-Jardim", 0.20, 200, 1.0, "agri", "imperial", 261,
          "Campos férteis, cidades de mármore e arquivos antigos. A praga já brota nos pântanos do leste.", [
              P("iax_city", "Cidade de Iax", "hive", 0.48, 0.40, "ultramarines", 2, 3, ["um_intercessors", "guard_platoon"], True),
              P("archive", "Grande Arquivo", "hive", 0.30, 0.24, "ultramarines", 2, 2, ["guard_platoon"]),
              P("gardens", "Jardins de Iax", "plains", 0.30, 0.58, "imperial", 0, 0, ["guard_platoon"]),
              P("granary", "Celeiros Imperiais", "industrial", 0.62, 0.60, "imperial", 1, 1, ["guard_platoon"]),
              P("marble_hive", "Colmeia de Mármore", "hive", 0.68, 0.24, "imperial", 2, 2, ["guard_platoon", "heavy_weapons"]),
              P("olive_hills", "Colinas das Oliveiras", "mountains", 0.14, 0.40, None, 0, 1, ["guard_platoon"]),
              P("river_delta", "Delta do Rio", "jungle", 0.48, 0.80, None, 0, 0, []),
              P("rotting_fields", "Campos Apodrecidos", "mire", 0.86, 0.46, "death_guard", 0, 0, ["dg_poxwalkers"]),
              P("plague_hive", "Colmeia da Praga (caída)", "hive", 0.88, 0.80, "death_guard", 2, 2, ["dg_plague_marines", "dg_poxwalkers", "dg_poxwalkers", "dg_poxwalkers"]),
              P("fly_marsh", "Pântano das Moscas", "mire", 0.70, 0.88, "death_guard", 0, 0, []),
              P("north_woods", "Bosques do Norte", "jungle", 0.50, 0.08, None, 0, 0, []),
              SEA("iax_sea", 0.08, 0.86),
          ], big=True),
        B("espandor", "Espandor", "planet", "Mundo-Colmeia", 0.34, 120, 0.6, "hive", "imperial", 263,
          "Mundo-colmeia de Ultramar que manda regimentos para Iax.", [
              P("es_hive", "Colmeia de Espandor", "hive", 0.48, 0.45, "imperial", 2, 2, ["guard_platoon", "leman_russ"], True),
              P("es_mines", "Minas", "industrial", 0.22, 0.32, "imperial", 1, 0, []),
              P("es_plains", "Planícies", "plains", 0.75, 0.32, "imperial", 0, 0, []),
              P("es_peaks", "Montes", "mountains", 0.50, 0.78, "imperial", 0, 0, []),
          ]),
        station("macragge_fleet", "Frota de Macragge", "iax", 0.09, 300, "ultramarines", 265,
                "A frota dos Ultramarines em órbita de Iax.", "um_intercessors"),
        B("terminus", "Nau da Praga", "planet", "Nau da Praga", 0.42, 30, 0.55, "nurgle", "death_guard", 267,
          "Uma nau de batalha da Death Guard, tão podre que virou um pequeno mundo.", [
              P("tm_garden", "Jardim da Nau", "warp", 0.50, 0.45, "death_guard", 2, 2, ["dg_plague_marines", "dg_poxwalkers"], True),
              P("tm_hold", "Porões Fétidos", "mire", 0.22, 0.32, "death_guard", 0, 0, []),
              P("tm_foundry", "Fundição", "industrial", 0.78, 0.30, "death_guard", 1, 0, []),
              P("tm_decks", "Conveses Podres", "mire", 0.50, 0.78, "death_guard", 0, 0, []),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "ultramarines", "general": "calgar", "body": "iax", "province": "iax_city",
         "battalions": ["um_intercessors", "um_intercessors", "um_hellblasters", "um_aggressors", "um_redemptor"]},
        {"faction": "ultramarines", "general": "tigurius", "body": "macragge_fleet", "province": "macragge_fleet_yards",
         "battalions": ["um_intercessors", "um_inceptors", "um_scouts"]},
        {"faction": "imperial", "general": "yarrick", "body": "iax", "province": "marble_hive",
         "battalions": ["guard_platoon", "guard_platoon", "heavy_weapons", "leman_russ", "chimera"]},
        {"faction": "death_guard", "general": "typhus", "body": "iax", "province": "plague_hive",
         "battalions": ["dg_poxwalkers", "dg_poxwalkers", "dg_poxwalkers", "dg_plague_marines", "dg_plague_marines", "dg_plague_marines", "dg_blight_launchers", "dg_blightspawn", "dg_plagueburst", "dg_deathshroud"]},
        {"faction": "death_guard", "general": "felthius", "body": "iax", "province": "rotting_fields",
         "battalions": ["dg_poxwalkers", "dg_poxwalkers", "dg_plague_marines"]},
    ]),
    ("startingFleets", [
        {"faction": "ultramarines", "body": "macragge_fleet", "ships": 3},
        {"faction": "imperial", "body": "espandor", "ships": 2},
        {"faction": "death_guard", "body": "terminus", "ships": 4},
    ]),
])
ULTRAMAR_SC = OrderedDict([
    ("id", "ultramar"), ("name", "A Guerra da Praga"), ("sector", "sector_ultramar.json"),
    ("factions", ["ultramarines", "imperial", "death_guard"]), ("playable", ["ultramarines", "imperial", "death_guard"]),
    ("teams", {"ultramar": ["ultramarines", "imperial"]}),
    ("neutralName", "Defesa de Ultramar"),
    ("objective", {"body": "iax", "label": "Cidades de Iax", "text": "controlar todas as cidades de Iax (Ultramarines e Guarda vencem juntos)"}),
    ("portraits", ["ultramarines/r2c0.png", "nurgle/r1c2.png"]),
    ("intro", "111.M42. A Death Guard invade Ultramar. Typhus semeia a praga em Iax, o mundo-jardim. Marneus Calgar e os regimentos de Espandor juram queimar cada mosca do planeta."),
    ("summary", "Ultramarines e a Guarda Imperial contra a Death Guard no mundo-jardim de Iax."),
])

# ============================================================ O Despertar de Sautekh
SAUTEKH = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "014.M42", "monthsPerTurn": 1}),
    ("system", {"id": "sautekh", "name": "Sistema Dal'ryn", "star": {"name": "Dal'ryn", "color": [255, 225, 180]},
                "desc": "Uma colônia tau construída sobre um mundo-tumba adormecido. As tumbas despertam — e uma Waaagh! sente o cheiro da briga."}),
    ("bodies", [
        B("dalryn", "Dal'ryn", "planet", "Mundo-Seita Tau", 0.20, 200, 1.0, "tau", "tau", 281,
          "Cidades-seita brancas sobre dunas douradas. Sob as dunas, pirâmides de metal vivo começam a brilhar.", [
              P("sept_city", "Cidade-Seita Dal'ryn", "hive", 0.50, 0.38, "tau", 2, 3, ["fire_warriors", "fire_warriors", "pathfinders", "broadsides"], True),
              P("domes", "Domos de Fio", "hive", 0.30, 0.24, "tau", 2, 2, ["fire_warriors", "fire_warriors", "kroot"]),
              P("sky_port", "Porto Celeste", "industrial", 0.70, 0.24, "tau", 1, 1, ["fire_warriors"]),
              P("kroot_camp", "Acampamento Kroot", "jungle", 0.20, 0.50, "tau", 0, 0, ["kroot"]),
              P("golden_dunes", "Dunas Douradas", "plains", 0.50, 0.60, None, 0, 0, []),
              P("tomb_gate", "Portão da Tumba", "tomb", 0.30, 0.80, "necrons", 2, 2, ["necron_warriors", "necron_warriors", "immortals"]),
              P("pylons", "Pilones Despertos", "tomb", 0.12, 0.70, "necrons", 0, 1, ["necron_warriors"]),
              P("buried_city", "Cidade Soterrada", "tomb", 0.50, 0.86, "necrons", 1, 0, []),
              P("scrap_hill", "Colina de Sucata", "ash", 0.86, 0.66, "orks", 2, 1, ["boyz", "boyz", "shoota_boyz"]),
              P("crash_site", "Destroços do Rok", "rok", 0.88, 0.40, "orks", 0, 0, ["boyz"]),
              P("salt_flats_d", "Salinas", "plains", 0.70, 0.80, None, 0, 0, []),
              P("canyon", "Cânion Vermelho", "mountains", 0.70, 0.50, None, 0, 1, []),
          ], big=True),
        B("tomb_moon", "Kheperah", "planet", "Lua-Tumba", 0.09, 60, 0.45, "tomb", "necrons", 283,
          "Uma lua que é uma tumba inteira.", [
              P("km_pyramid", "Pirâmide do Faraó", "tomb", 0.48, 0.45, "necrons", 2, 2, ["immortals", "lychguard"], True),
              P("km_halls", "Salões Estáticos", "tomb", 0.22, 0.32, "necrons", 0, 0, []),
              P("km_vaults", "Cofres", "tomb", 0.75, 0.62, "necrons", 1, 0, []),
          ], parent="dalryn"),
        station("tau_orbital", "Estação Orbital Kor'vattra", "dalryn", 0.14, 300, "tau", 285,
                "A estação da Casta do Ar sobre Dal'ryn.", "fire_warriors"),
        B("ork_rok", "Rok Gorkamorka", "planet", "Rok Ork", 0.40, 100, 0.5, "rok", "orks", 287,
          "Um asteroide cheio de dentes e motores, rumo a Dal'ryn.", [
              P("or_fort", "Forte do Kaudilho", "hive", 0.48, 0.45, "orks", 2, 2, ["boyz", "nobz"], True),
              P("or_engines", "Motores", "rok", 0.22, 0.35, "orks", 1, 0, []),
              P("or_pits", "Fossos", "rok", 0.72, 0.62, "orks", 0, 0, []),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "tau", "general": "farsight", "body": "dalryn", "province": "sept_city",
         "battalions": ["fire_warriors", "fire_warriors", "pathfinders", "crisis_suits", "broadsides", "hammerhead"]},
        {"faction": "tau", "general": "shadowsun", "body": "tau_orbital", "province": "tau_orbital_yards",
         "battalions": ["fire_warriors", "stealth_suits", "devilfish"]},
        {"faction": "necrons", "general": "imotekh", "body": "dalryn", "province": "tomb_gate",
         "battalions": ["necron_warriors", "necron_warriors", "necron_warriors", "immortals", "immortals", "lychguard", "canoptek_wraiths", "destroyers", "doomsday_ark"]},
        {"faction": "necrons", "general": "trazyn", "body": "tomb_moon", "province": "km_pyramid",
         "battalions": ["necron_warriors", "immortals", "scarabs"]},
        {"faction": "orks", "general": "ghazghkull", "body": "dalryn", "province": "scrap_hill",
         "battalions": ["boyz", "boyz", "boyz", "shoota_boyz", "nobz", "lootas", "trukk", "battlewagon", "deff_dread"]},
        {"faction": "orks", "general": "gorgutz", "body": "ork_rok", "province": "or_fort",
         "battalions": ["boyz", "boyz", "nobz", "trukk"]},
    ]),
    ("startingFleets", [
        {"faction": "tau", "body": "tau_orbital", "ships": 3},
        {"faction": "necrons", "body": "tomb_moon", "ships": 3},
        {"faction": "orks", "body": "ork_rok", "ships": 3},
    ]),
])
SAUTEKH_SC = OrderedDict([
    ("id", "sautekh"), ("name", "O Despertar de Sautekh"), ("sector", "sector_sautekh.json"),
    ("factions", ["tau", "necrons", "orks"]), ("playable", ["tau", "necrons", "orks"]),
    ("neutralName", "Colonos de Dal'ryn"),
    ("objective", {"body": "dalryn", "label": "Cidades de Dal'ryn", "text": "controlar todas as cidades de Dal'ryn"}),
    ("portraits", ["tau/r1c2.png", "necrons/r1c3.png"]),
    ("intro", "014.M42. O Império Tau ergueu a colônia Dal'ryn sobre dunas douradas — sem saber que dormia ali uma tumba da Dinastia Sautekh. Imotekh desperta, furioso. E no céu, um Rok cheio de Orks já sentiu o cheiro da maior briga do setor."),
    ("summary", "Três lados num mundo-tumba: o Império Tau, os Necrons que despertam e uma Waaagh! de Orks."),
])


def main():
    save("sector_baal.json", BAAL)
    save("sector_ultramar.json", ULTRAMAR)
    save("sector_sautekh.json", SAUTEKH)
    sc = load("scenarios.json")
    new = [BAAL_SC, ULTRAMAR_SC, SAUTEKH_SC]
    sc["scenarios"] = [s for s in sc["scenarios"] if s["id"] not in {n["id"] for n in new}] + new
    save("scenarios.json", sc)
    units = {u["id"] for k, v in load("units.json").items() if isinstance(v, list) for u in v}
    gens = {g["id"] for g in load("generals.json")["generals"]}
    for sector in (BAAL, ULTRAMAR, SAUTEKH):
        for a in sector["startingArmies"]:
            assert a["general"] in gens, a["general"]
            for u in a["battalions"]:
                assert u in units, u
        for b in sector["bodies"]:
            for p in b.get("provinces", []):
                for u in p.get("garrison", []):
                    assert u in units, u
    print("3 campanhas: baal, ultramar, sautekh")


if __name__ == "__main__":
    main()
