"""Sprites das unidades para o campo de batalha 2D, a partir das folhas do
usuário (tools/source/sprites/s*.png, recortadas por cut_sprites.py).

Cada unidade aponta para uma figura pela posição na folha ("s1:x,y", em pixels
da folha 1536x1024: vale a figura cuja caixa contém o ponto, ou a mais
próxima), com uma recoloração opcional ("|red" etc.) para capítulos e legiões
sem folha própria. Saída: art/textures/ui/campaigns/wh40k/sprites/<unidade>.png
(128x128, figura assentada na base) + <unidade>_m.png espelhado (lado inimigo),
e campaigns/wh40k/data/sprites.json. Unidades fora do mapa (tiranídeos,
necrons, tau) continuam com a miniatura do retrato.

Uso: python3 tools/art/gen_sprites.py [--preview arquivo.png]
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cut_sprites  # noqa: E402

ROOT = cut_sprites.ROOT
OUT = os.path.join(ROOT, "art/textures/ui/campaigns/wh40k/sprites")
DATA = os.path.join(ROOT, "campaigns/wh40k/data/sprites.json")
SIZE = 128

# Marines de cor azul -> outra cor (só os pixels azuis mudam de matiz).
HUE_SHIFT = {
    "red": (0, 1.1, 0.95),       # Blood Angels
    "green": (60, 1.0, 0.9),     # Salamanders
    "yellow": (25, 1.1, 1.35),   # Lamenters
    "mantis": (70, 0.8, 0.75),   # Mantis Warriors
    "maroon": (175, 0.9, 0.6),   # Executioners
    "slate": (105, 0.25, 1.05),  # Astral Claws (azul-acinzentado)
    "silver": (105, 0.0, 1.25),  # Grey Knights
    "gold": (22, 1.2, 1.3),      # Custodes
}
# Tintura geral (figuras sem azul dominante: Caos, drukhari): (RGB, força).
TINT = {
    "we": ((200, 40, 30), 0.45),     # World Eaters
    "dg": ((150, 170, 90), 0.45),    # Death Guard
    "ts": ((40, 110, 190), 0.45),    # Thousand Sons
    "ec": ((200, 80, 190), 0.45),    # Emperor's Children
    "dk": ((90, 50, 120), 0.5),      # Drukhari
    "rust": ((150, 60, 40), 0.3),
}

UNITS = {
    # --- Imperium (Guarda + aliados) ---
    "guard_platoon": "s1:40,45", "guard_grenadiers": "s1:45,118", "sentinel": "s1:460,265",
    "chimera": "s1:90,380", "leman_russ": "s1:275,380", "valkyrie": "s1:240,470",
    "heavy_weapons": "s1:220,265", "field_artillery": "s5:400,190", "commissar": "s3:215,45",
    "special_weapons": "s1:165,118", "flamers": "s7:270,150", "ogryns": "s1:455,190",
    "bullgryns": "s3:320,265", "ratlings": "s3:30,435", "hellhound": "s7:165,410",
    "manticore": "s7:265,410", "hydra": "s7:345,410", "vendetta": "s1:240,470",
    "baneblade": "s5:430,270",
    "intercessors": "s1:355,575", "assault_marines": "s1:410,630", "devastators": "s1:410,705",
    "terminators": "s1:560,770", "dreadnought": "s1:560,850",
    "battle_sisters": "s1:40,580", "retributors": "s1:150,640", "seraphim": "s1:150,775",
    "exorcist": "s1:270,940",
    "skitarii_rangers": "s1:655,575", "sicarians": "s1:660,775", "kataphron": "s1:740,775",
    "onager": "s7:500,945", "skorpius": "s7:670,945",
    "inquisitor": "s1:1075,770", "custodes": "s1:965,580", "grey_knights": "s1:970,645",
    "eversor": "s1:1185,830", "deathwatch": "s1:965,705",
    # --- Orks ---
    "boyz": "s1:570,45", "shoota_boyz": "s1:630,45", "nobz": "s1:1000,45", "trukk": "s1:605,470",
    "looted_wagon": "s1:970,470", "dakkajet": "s3:600,430", "gretchin": "s1:560,270",
    "kommandos": "s1:760,195", "stormboyz": "s3:670,190", "burna_boyz": "s1:1020,118",
    "lootas": "s1:920,195", "tankbustas": "s1:880,270", "meganobz": "s1:1000,270",
    "warbikers": "s1:585,355", "battlewagon": "s1:785,470", "deffkoptas": "s3:520,430",
    "burna_bommer": "s3:600,430", "big_gunz": "s5:935,275", "killa_kans": "s1:830,355",
    "deff_dread": "s3:700,350", "gorkanaut": "s1:985,355", "stompa": "s5:910,195",
    # --- Caos ---
    "cultists": "s1:1260,700", "chaos_marines": "s1:1260,575", "havocs": "s1:1490,640",
    "raptors": "s1:1270,765", "warp_talons": "s1:1350,765", "chosen": "s1:1385,850",
    "chaos_terminators": "s1:1285,850", "possessed": "s1:1420,765", "chaos_rhino": "s3:360,925",
    "predator": "s1:1380,950", "obliterators": "s1:1480,850", "defiler": "s3:475,840",
    "chaos_spawn": "s3:475,765",
    # --- Eldar ---
    "guardians": "s1:1100,45", "dire_avengers": "s1:1325,45", "rangers": "s3:810,270",
    "howling_banshees": "s3:800,120", "striking_scorpions": "s3:970,120", "fire_dragons": "s3:800,190",
    "dark_reapers": "s1:1470,45", "swooping_hawks": "s7:1095,150", "warp_spiders": "s3:975,190",
    "wraithguard": "s7:960,320", "jetbikes": "s3:810,350", "falcon": "s1:1210,470",
    # --- World Eaters ---
    "we_jakhals": "s1:1315,700|we", "we_berzerkers": "s5:900,755|we", "we_eightbound": "s1:1420,765|we",
    "we_exalted": "s5:1320,840|we", "we_terminators": "s1:1285,850|we", "we_bloodletters": "s5:1260,755|we",
    "we_bloodcrushers": "s3:475,765|we", "we_flesh_hounds": "s1:1500,765|we", "we_skull_cannon": "s1:1380,950|we",
    "we_rhino": "s3:360,925|we", "we_helbrute": "s3:475,840|we", "we_forgefiend": "s1:1480,850|we",
    "we_maulerfiend": "s5:1320,840|we", "we_spawn": "s3:475,765|we",
    # --- Death Guard ---
    "dg_poxwalkers": "s3:30,925|dg", "dg_plague_marines": "s1:1310,575|dg", "dg_blight_launchers": "s1:1490,640|dg",
    "dg_blightlords": "s1:1285,850|dg", "dg_deathshroud": "s1:1480,850|dg", "dg_tallyman": "s7:1490,565|dg",
    "dg_blightspawn": "s1:1500,765|dg", "dg_putrifier": "s3:260,925|dg", "dg_blightbringer": "s5:1250,940|dg",
    "dg_rhino": "s3:360,925|dg", "dg_blight_hauler": "s5:1420,940|dg", "dg_bloat_drone": "s7:1290,730|dg",
    "dg_plagueburst": "s1:1380,950|dg", "dg_spawn": "s3:475,765|dg",
    # --- Thousand Sons ---
    "ts_cultists": "s7:1190,650|ts", "ts_tzaangors": "s7:1300,650|ts", "ts_rubrics": "s1:1370,575|ts",
    "ts_warpflamers": "s1:1425,575|ts", "ts_scarab_occult": "s1:1385,850|ts", "ts_shaman": "s7:1480,650|ts",
    "ts_enlightened": "s7:1200,730|ts", "ts_horrors": "s1:1420,765|ts", "ts_screamers": "s7:1380,730|ts",
    "ts_rhino": "s3:360,925|ts", "ts_helbrute": "s3:475,840|ts", "ts_mutalith": "s5:1320,840|ts",
    "ts_defiler": "s1:1480,850|ts", "ts_spawn": "s3:475,765|ts",
    # --- Emperor's Children ---
    "ec_tormentors": "s5:840,755|ec", "ec_infractors": "s5:970,755|ec", "ec_noise_marines": "s5:1045,755|ec",
    "ec_blastmaster": "s5:1125,840|ec", "ec_terminators": "s5:1420,840|ec", "ec_daemonettes": "s7:1310,825|ec",
    "ec_seekers": "s7:1475,730|ec", "ec_fiends": "s1:1500,765|ec", "ec_keeper": "s1:1385,850|ec",
    "ec_rhino": "s3:360,925|ec", "ec_predator": "s7:1375,940|ec", "ec_land_raider": "s5:1420,940|ec",
    "ec_maulerfiend": "s5:1320,840|ec", "ec_spawn": "s3:475,765|ec",
    # --- Ultramarines ---
    "um_intercessors": "s7:25,570", "um_assault_intercessors": "s5:590,380", "um_sternguard": "s5:645,380",
    "um_scouts": "s3:340,595", "um_hellblasters": "s7:205,650", "um_aggressors": "s1:570,630",
    "um_inceptors": "s5:960,380", "um_snipers": "s7:345,650", "um_apothecary": "s5:530,520",
    "um_eradicators": "s7:120,735", "um_redemptor": "s7:300,825", "um_repulsor": "s7:75,935",
    "um_predator": "s7:210,935",
    # --- Blood Angels ---
    "ba_intercessors": "s1:455,575|red", "ba_assault": "s1:510,575|red", "ba_scouts": "s3:150,595|red",
    "ba_bladeguard": "s1:510,705|red", "ba_inceptors": "s7:190,735|red", "ba_death_company": "s5:690,520",
    "ba_sanguinary_guard": "s1:1020,580", "ba_assault_terminators": "s1:560,770|red",
    "ba_baal_predator": "s1:390,935|red", "ba_furioso": "s1:560,850|red", "ba_dc_dreadnought": "s3:460,525|red",
    "ba_stormraven": "s3:460,680|red",
    # --- Salamanders ---
    "sal_intercessors": "s3:35,525|green", "sal_assault": "s3:95,525|green", "sal_scouts": "s3:340,595|green",
    "sal_bladeguard": "s3:215,525|green", "sal_infernus": "s7:280,650|green", "sal_eradicators": "s7:190,735|green",
    "sal_vanguard": "s3:160,595|green", "sal_terminators": "s3:400,595|green", "sal_techmarine": "s3:285,595|green",
    "sal_apothecary": "s5:530,520|green", "sal_invictor": "s5:950,465|green", "sal_redemptor": "s7:300,825|green",
    "sal_redeemer": "s5:930,620|green", "sal_gladiator": "s7:65,825|green",
    # --- Grey Knights ---
    "gk_strike": "s1:970,645", "gk_purifiers": "s1:1025,645", "gk_interceptors": "s1:1080,645",
    "gk_purgators": "s1:1135,645", "gk_terminators": "s1:1185,645", "gk_paladins": "s5:345,755",
    "gk_librarian": "s7:945,640", "gk_chaplain": "s3:1300,595", "gk_dreadknight": "s7:300,825|silver",
    "gk_dreadnought": "s5:950,465|silver", "gk_land_raider": "s5:930,620|silver", "gk_stormraven": "s3:460,680|silver",
    # --- Adeptus Mechanicus ---
    "mc_rangers": "s1:700,575", "mc_vanguard": "s1:755,575", "mc_infiltrators": "s5:1080,385",
    "mc_ruststalkers": "s5:1360,465", "mc_corpuscarii": "s3:690,525", "mc_fulgurites": "s3:800,525",
    "mc_pteraxii": "s1:850,945", "mc_serberys": "s1:665,860", "mc_kataphron": "s3:810,680",
    "mc_kastelan": "s7:580,835", "mc_ironstrider": "s5:1450,465", "mc_onager": "s3:590,910",
    "mc_skorpius": "s5:1290,620",
    # --- Adepta Sororitas ---
    "sr_novitiates": "s3:1190,45", "sr_militants": "s3:1240,45", "sr_battle_sisters": "s7:1190,75",
    "sr_dominions": "s7:1270,150", "sr_veterans": "s5:230,385", "sr_celestians": "s1:40,775",
    "sr_repentia": "s3:1255,270", "sr_crusaders": "s3:1320,270", "sr_geminae": "s1:210,775",
    "sr_arco": "s3:1470,270", "sr_penitent": "s7:1460,230", "sr_mortifier": "s5:375,460",
    "sr_castigator": "s7:1460,410",
    # --- Custodes ---
    "cu_spears": "s1:965,580", "cu_shields": "s7:870,560", "cu_wardens": "s1:1075,580",
    "cu_vexilus": "s7:1050,560", "cu_allarus": "s1:1185,580", "cu_aquilon": "s1:1125,580",
    "cu_vertus": "s5:695,840", "cu_venatari": "s3:1210,520", "cu_witchseekers": "s3:1310,775",
    "cu_achillus": "s5:790,620|gold", "cu_galatus": "s1:560,850|gold", "cu_telemon": "s7:300,825|gold",
    "cu_caladius": "s7:330,935|gold",
    # --- Drukhari ---
    "dk_kabalites": "s7:805,150|dk", "dk_trueborn": "s7:855,150|dk", "dk_wyches": "s3:850,120|dk",
    "dk_bloodbrides": "s3:905,120|dk", "dk_incubi": "s3:970,120|dk", "dk_mandrakes": "s3:1030,120|dk",
    "dk_hellions": "s1:1200,285|dk", "dk_scourges": "s7:1095,150|dk", "dk_wracks": "s3:660,680",
    "dk_talos": "s7:960,320|dk", "dk_reavers": "s3:890,350|dk", "dk_raider": "s5:1220,275|dk",
    "dk_ravager": "s7:1070,410|dk",
    # --- Badab: Astral Claws, Tyrant's Legion, Lamenters, Mantis Warriors, Executioners ---
    "ac_tactical": "s1:355,575|slate", "ac_assault": "s1:405,575|slate", "ac_devastators": "s1:410,705|slate",
    "ac_terminators": "s1:560,770|slate", "ac_apothecary": "s5:530,520|slate", "ac_dreadnought": "s1:560,850|slate",
    "ac_rhino": "s1:390,935|slate", "ac_predator": "s5:680,620|slate",
    "tl_rifles": "s1:40,190", "tl_veterans": "s1:90,190", "tl_heavy": "s1:140,190",
    "tl_chimera": "s1:90,380|slate", "tl_russ": "s1:275,380|slate",
    "lm_tactical": "s7:80,570|yellow", "lm_assault": "s7:130,570|yellow", "lm_priest": "s5:830,520|yellow",
    "lm_dreadnought": "s5:950,465|yellow", "lm_baal": "s7:210,935|yellow",
    "mw_scouts": "s3:340,595|mantis", "mw_tactical": "s3:35,525|mantis", "mw_snipers": "s7:345,650|mantis",
    "mw_speeder": "s5:790,620|mantis",
    "ex_tactical": "s5:535,380|maroon", "ex_vanguard": "s5:590,380|maroon", "ex_terminators": "s1:570,705|maroon",
    "ex_land_raider": "s5:930,620|maroon",
    # --- Krieg ---
    "kr_rifles": "s3:35,265", "kr_watchmaster": "s3:85,265", "kr_grenadiers": "s3:140,265",
    "kr_engineers": "s3:190,265", "kr_plasma": "s3:245,265", "kr_flamers": "s7:240,75",
    "kr_heavy": "s3:140,185", "kr_riders": "s7:60,305", "kr_quartermaster": "s7:345,75",
    "kr_vox": "s7:295,75", "kr_centaur": "s7:335,305", "kr_demolisher": "s7:60,410",
    "kr_earthshaker": "s7:265,410", "kr_hades": "s7:345,410",
    # --- Vraks (traidores) ---
    "vr_rifles": "s3:75,435", "vr_raiders": "s3:115,435", "vr_grenadiers": "s3:160,435",
    "vr_hmg": "s1:300,265", "vr_preachers": "s3:1110,680", "vr_disciplinarians": "s3:215,45|rust",
    "vr_heretek": "s3:260,925", "vr_cultists": "s3:80,925", "vr_alpha": "s3:215,435",
    "vr_chimera": "s1:90,380|rust", "vr_russ": "s5:65,270|rust", "vr_basilisk": "s1:440,380|rust",
    "vr_truck": "s7:335,305|rust",
}


def row(sheet, y, x0, x1, walk, fire=(), mode=""):
    """Quadros de animação de uma linha das folhas novas: as figuras cuja caixa
    tem o centro na faixa y±28 e x0..x1, em ordem de x; walk/fire são índices."""
    spec = "%s@%d,%d,%d" % (sheet, y, x0, x1)
    m = "|" + mode if mode else ""
    return {"walk": ["%s:%d%s" % (spec, i, m) for i in walk], "fire": ["%s:%d%s" % (spec, i, m) for i in fire]}


def rect(sheet, boxes, fire=(), mode=""):
    """Quadros recortados por retângulo (rect_cut), para folhas com figuras coladas."""
    m = "|" + mode if mode else ""
    return {"walk": ["%s#%d,%d,%d,%d%s" % ((sheet,) + b + (m,)) for b in boxes],
            "fire": ["%s#%d,%d,%d,%d%s" % ((sheet,) + b + (m,)) for b in fire]}


# Folhas novas (fundo escuro, com quadros de animação): substituem as de cima.
DK, TAU, NEC, TYR = (170, 760), (940, 1530), (170, 760), (940, 1530)
INF = dict(walk=(0, 1, 2), fire=(3, 4, 5))
VEH = dict(walk=(0, 1), fire=(2,))
# Cultistas: quadros por retângulo (as figuras da corrida saem partidas no recorte automático).
CULT_RUN = [(x0, 285, x1, 388) for x0, x1 in ((35, 126), (158, 256), (280, 370), (404, 492), (528, 602), (648, 724),
                                              (774, 872), (898, 1002), (1033, 1132), (1155, 1243), (1253, 1392), (1403, 1507))]
CULT_FIRE = [(x0, 408, x1, 516) for x0, x1 in ((280, 400), (398, 527), (526, 662))]
CULT_MELEE = [(x0, 530, x1, 657) for x0, x1 in ((28, 118), (148, 262), (263, 362), (378, 482), (503, 607))]
CULT_POX = [(x0, 664, x1, 778) for x0, x1 in ((33, 98), (143, 218), (256, 338), (373, 458), (493, 598))]
UNITS.update({
    # Drukhari
    "dk_kabalites": row("alguns", 88, *DK, **INF), "dk_trueborn": row("alguns", 88, *DK, **INF),
    "dk_wyches": row("alguns", 145, *DK, **INF), "dk_bloodbrides": row("alguns", 145, *DK, **INF),
    "dk_incubi": row("alguns", 205, *DK, **INF), "dk_wracks": row("alguns", 258, *DK, **INF),
    "dk_raider": row("alguns", 325, *DK, **VEH), "dk_ravager": row("alguns", 385, *DK, **VEH),
    # T'au
    "fire_warriors": row("alguns", 88, *TAU, **INF), "breachers": row("alguns", 88, *TAU, **INF),
    "pathfinders": row("alguns", 145, *TAU, **INF),
    "crisis_suits": row("alguns", 200, *TAU, walk=(0, 1, 3), fire=(2, 4)),
    "stealth_suits": row("alguns", 255, *TAU, walk=(0, 1, 3), fire=(2, 4)),
    "broadsides": row("alguns", 310, *TAU, walk=(0, 1, 3), fire=(2, 4)),
    "riptide": row("alguns", 310, *TAU, walk=(0, 1, 3), fire=(2, 4)),
    "devilfish": row("alguns", 375, *TAU, **VEH), "piranha": row("alguns", 375, *TAU, **VEH),
    "hammerhead": row("alguns", 435, *TAU, **VEH), "sky_ray": row("alguns", 435, *TAU, **VEH),
    # Necrons
    "necron_warriors": row("alguns", 580, *NEC, **INF), "flayed_ones": row("alguns", 580, *NEC, **INF),
    "destroyers": row("alguns", 632, *NEC, **INF), "skorpekh": row("alguns", 632, *NEC, **INF),
    "immortals": row("alguns", 688, *NEC, **INF), "deathmarks": row("alguns", 688, *NEC, **INF),
    "lychguard": row("alguns", 740, *NEC, **INF), "praetorians": row("alguns", 740, *NEC, **INF),
    "doomsday_ark": row("alguns", 855, *NEC, **VEH), "monolith": row("alguns", 950, *NEC, **VEH),
    # Tiranídeos
    "termagants": row("alguns", 578, *TYR, **INF), "hormagaunts": row("alguns", 626, *TYR, walk=(0, 1, 2, 3, 4, 5)),
    "genestealers": row("alguns", 672, *TYR, walk=(0, 1, 2, 3, 4, 5)),
    "warriors": row("alguns", 722, *TYR, **INF), "hive_guard": row("alguns", 722, *TYR, **INF),
    "raveners": row("alguns", 672, *TYR, walk=(0, 1, 2, 3, 4, 5)),
    "lictor": row("alguns", 778, *TYR, walk=(0, 1, 2, 3, 4, 5)),
    "carnifex": row("alguns", 832, *TYR, **INF), "tyrant_guard": row("alguns", 832, *TYR, **INF),
    "haruspex": row("alguns", 832, *TYR, **INF), "mawloc": row("alguns", 832, *TYR, **INF),
    "tervigon": row("alguns", 920, *TYR, walk=(0, 1, 2)), "gargoyles": row("alguns", 920, *TYR, walk=(0, 1, 2)),
    # Cultistas (corrida em 12 quadros; tiro com clarão)
    "cultists": rect("cults", CULT_RUN, fire=CULT_FIRE),
    "vr_cultists": rect("cults", CULT_RUN, fire=CULT_FIRE),
    "ts_cultists": rect("cults", CULT_RUN, fire=CULT_FIRE, mode="ts"),
    "we_jakhals": rect("cults", CULT_RUN, fire=CULT_MELEE),
    "dg_poxwalkers": rect("cults", CULT_POX, mode="dg"),
    "vr_rifles": "cults:75,905", "vr_alpha": "cults:305,905",
    "vr_disciplinarians": "cults:425,905",
    "vr_hmg": {"walk": ["cults:545,905"], "fire": ["cults:680,905"]},
    "vr_grenadiers": "cults:835,905", "vr_raiders": "cults:960,905",
    "vr_preachers": "cults:1200,915", "vr_heretek": "cults:1465,905",
    # Krieg (figuras coladas: recorte por retângulo)
    "kr_rifles": rect("kreag", [(45, 38, 122, 122), (130, 38, 212, 122), (225, 38, 305, 122)], fire=[(868, 105, 965, 186)]),
    "kr_grenadiers": rect("kreag", [(45, 520, 125, 602), (120, 520, 200, 602), (195, 520, 278, 602), (268, 520, 350, 605)]),
    "kr_plasma": rect("kreag", [(418, 522, 500, 612), (490, 522, 562, 612), (560, 522, 652, 612)]),
    "kr_flamers": rect("kreag", [(1003, 193, 1082, 270), (1082, 193, 1165, 270)], fire=[(1172, 188, 1292, 270)]),
    "kr_heavy": rect("kreag", [(1250, 343, 1492, 468)]),
    "kr_watchmaster": rect("kreag", [(45, 350, 165, 478)]),
    "kr_vox": rect("kreag", [(370, 335, 446, 472)]),
    "kr_quartermaster": rect("kreag", [(540, 355, 612, 472)]),
    "kr_engineers": rect("kreag", [(775, 528, 850, 625), (858, 528, 948, 630)]),
    "kr_demolisher": rect("kreag", [(405, 795, 722, 972)]),
    "kr_earthshaker": rect("kreag", [(778, 762, 1092, 975)]),
    "kr_hades": rect("kreag", [(1150, 795, 1502, 975)]),
})


def pick(items, x, y):
    """Figura cuja caixa contém (x, y) — a menor —, ou a de centro mais próximo."""
    inside = [it for it in items if it[1][0] <= x < it[1][0] + it[1][2] and it[1][1] <= y < it[1][1] + it[1][3]]
    if inside:
        return min(inside, key=lambda it: it[1][2] * it[1][3])
    return min(items, key=lambda it: (it[1][0] + it[1][2] / 2 - x) ** 2 + (it[1][1] + it[1][3] / 2 - y) ** 2)


_BG = {}


def rect_cut(sheet, box, thr=24):
    """Recorta a figura dentro do retângulo pela distância de cor ao fundo local
    (mediana larga, como em cut_sprites): para folhas com figuras coladas."""
    if sheet not in _BG:
        im = np.array(Image.open(os.path.join(cut_sprites.SRC, sheet + ".png")).convert("RGB"))
        d = cut_sprites.dark_diff(im, sheet)
        _BG[sheet] = (im, d)
    im, d = _BG[sheet]
    x0, y0, x1, y1 = box
    sub = im[y0:y1, x0:x1]
    m = (d[y0:y1, x0:x1] > thr).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = st[1:, 4].max()
        keep = [i for i in range(1, n) if st[i][4] >= 0.08 * big]
        m = np.isin(lab, keep).astype(np.uint8) * 255
    # Buracos internos.
    ff = np.pad(m, 1)
    cv2.floodFill(ff, np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8), (0, 0), 128)
    m = np.where(ff[1:-1, 1:-1] == 128, 0, 255).astype(np.uint8)
    m = cv2.GaussianBlur(m, (3, 3), 0)
    ys, xs = np.nonzero(m > 20)
    return np.dstack([sub, m])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def resolve(spec, sheets):
    """Uma figura (RGBA) a partir da especificação; devolve (rgba, mode)."""
    src, _, mode = spec.partition("|")
    if "#" in src:
        sheet, b = src.split("#")
        return rect_cut(sheet, tuple(map(int, b.split(",")))), mode
    if "@" in src:
        sheet, rest = src.split("@")
        band, idx = rest.split(":")
        y, x0, x1 = map(int, band.split(","))
        items = sheets(sheet)
        r = sorted((it for it in items if abs(it[1][1] + it[1][3] / 2 - y) < 28 and x0 <= it[1][0] + it[1][2] / 2 <= x1
                    and it[1][2] * it[1][3] > 700 and it[1][2] >= 30), key=lambda it: it[1][0])
        if int(idx) >= len(r):
            raise IndexError("%s: só %d figuras na faixa" % (spec, len(r)))
        return r[int(idx)][2], mode
    sheet, xy = src.split(":")
    x, y = map(int, xy.split(","))
    return pick(sheets(sheet), x, y)[2], mode


def recolor(rgba, mode):
    if not mode:
        return rgba
    rgb = rgba[..., :3].copy()
    if mode in HUE_SHIFT:
        hue, satk, valk = HUE_SHIFT[mode]
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
        blue = (hsv[..., 0] > 92) & (hsv[..., 0] < 135) & (hsv[..., 1] > 45)
        # Transição suave nas bordas da área azul.
        wgt = cv2.GaussianBlur(blue.astype(np.float32), (3, 3), 0)
        new = hsv.copy()
        new[..., 0] = hue
        new[..., 1] = np.clip(hsv[..., 1] * satk, 0, 255)
        new[..., 2] = np.clip(hsv[..., 2] * valk, 0, 255)
        out = cv2.cvtColor(new.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)
        rgb = (rgb * (1 - wgt[..., None]) + out * wgt[..., None]).astype(np.uint8)
    elif mode in TINT:
        col, k = TINT[mode]
        lum = rgb.astype(np.float32).mean(axis=2, keepdims=True) / 255.0
        tinted = np.clip(lum * np.array(col, np.float32) * 1.6, 0, 255)
        rgb = (rgb * (1 - k) + tinted * k).astype(np.uint8)
    return np.dstack([rgb, rgba[..., 3]])


def feet_x(rgba):
    """x do centro dos pés (mediana da opacidade no terço de baixo): alinha os
    quadros de uma animação mesmo quando o clarão do tiro alarga a caixa."""
    a = rgba[..., 3]
    h = a.shape[0]
    ys, xs = np.nonzero(a[int(h * 0.66):] > 128)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def place_set(frames, nwalk):
    """Assenta todos os quadros na mesma escala, pés no mesmo ponto. A escala
    vem dos quadros de marcha: o clarão do tiro pode passar da borda."""
    walk = frames[:nwalk]
    W = max(max(f.shape[1] - feet_x(f), feet_x(f)) * 2 for f in walk)
    H = max(f.shape[0] for f in frames)
    s = min(2.6, (SIZE - 4) / max(W, H))
    out = []
    for f in frames:
        h, w = f.shape[:2]
        im = Image.fromarray(f, "RGBA").resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, (round(SIZE / 2 - feet_x(f) * s), SIZE - 2 - im.height), im)
        out.append(canvas)
    return out


def main():
    units = json.load(open(os.path.join(ROOT, "campaigns/wh40k/data/units.json")))
    known = {u["id"]: (fac, u) for fac, lst in units.items() if fac != "Description" for u in lst}
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT, f))
    cache = {}

    def sheets(name):
        if name not in cache:
            cache[name] = cut_sprites.cut(name)
        return cache[name]

    done, tiles = {}, []
    for uid, spec in UNITS.items():
        if uid not in known:
            print("unidade desconhecida:", uid)
            continue
        if isinstance(spec, str):
            spec = {"walk": [spec], "fire": []}
        walk = [recolor(*resolve(x, sheets)) for x in spec["walk"]]
        fire = [recolor(*resolve(x, sheets)) for x in spec.get("fire", [])]
        ims = place_set(walk + fire, len(walk))
        names = [uid] + ["%s_w%d" % (uid, i) for i in range(1, len(walk))] + ["%s_f%d" % (uid, i) for i in range(len(fire))]
        if len(walk) == 1:
            names = [uid] + ["%s_f%d" % (uid, i) for i in range(len(fire))]
        for name, im in zip(names, ims):
            im.save(os.path.join(OUT, name + ".png"), optimize=True)
            im.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(OUT, name + "_m.png"), optimize=True)
        done[uid] = [len(walk), len(fire)]
        tiles.append((known[uid][0], uid, "", ims[0]))
    with open(os.path.join(OUT, "textures.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<Textures>\n  <File pattern="*" format="rgba" mipmap="false"/>\n</Textures>\n')
    with open(DATA, "w") as f:
        json.dump({"Description": "Sprites de batalha por unidade: [quadros de marcha, quadros de tiro] (tools/art/gen_sprites.py). Arquivos: <id>.png, <id>_w<i>.png (i>=1), <id>_f<i>.png e as versões _m espelhadas.", "sprites": dict(sorted(done.items()))}, f, indent="\t")
    missing = [u for u in known if u not in UNITS]
    print(len(done), "sprites;", len(missing), "unidades sem sprite (usam a miniatura do retrato)")
    if "--preview" in sys.argv:
        path = sys.argv[sys.argv.index("--preview") + 1]
        cols, cell = 14, 110
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell, rows * (cell + 14)), (60, 70, 50))
        d = ImageDraw.Draw(sheet)
        for i, (fac, uid, sid, im) in enumerate(tiles):
            cx, cy = (i % cols) * cell, (i // cols) * (cell + 14)
            sheet.paste(im.resize((cell - 6, cell - 6)), (cx + 3, cy), im.resize((cell - 6, cell - 6)))
            d.text((cx + 2, cy + cell - 6), uid[:18], fill=(255, 255, 160))
        sheet.save(path)


if __name__ == "__main__":
    main()
