"""Sexta e sétima campanhas:

  A Guerra de Badab (904.M41): Lugft Huron e os Secessionistas — Astral Claws,
    a Legião do Tirano e os capítulos aliados (Lamenters, Mantis Warriors,
    Executioners, como forças de recrutamento da mesma facção) — contra os
    lealistas (Salamandras, Ultramarines e a Guarda Imperial).
  O Cerco de Vraks (813.M41): os Death Korps of Krieg e os Grey Knights
    contra os rebeldes do Cardeal Xaphan e uma incursão de demônios de Khorne
    (World Eaters).

Escreve units.json, factions.json, generals.json, support.json,
sector_badab.json, sector_vraks.json e scenarios.json. Rodar depois de
build_thaurus.py e antes de build_mechanics.py; depois tools/art/gen_planets.py.

Retratos: tools/source/sheets/{badab_claws,badab_allies,krieg,vraks}.png.
"""
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_factions import U, G, S, HOVER, load, save  # noqa: E402
from build_sectors import P, SEA, B, station  # noqa: E402
from build_great_game import F  # noqa: E402

AC = "badab_claws/"
BA = "badab_allies/"
KR = "krieg/"
VR = "vraks/"


def grp(units, group):
    for u in units:
        u["group"] = group
    return units


# ============================================================ Secessionistas de Badab
BADAB = grp([
    U("ac_tactical", "Esquadra Tática dos Astral Claws", "infantry", 250, 17, 24, 5, AC + "r0c0.png",
      "Marines da Primeira Fundação de Huron, em armadura de prata e azul.", ["Pelo Tirano de Badab!", "Nenhum dízimo para Terra.", "Firmes, irmãos."],
      range=0.1, armor=1.35),
    U("ac_assault", "Esquadra de Assalto", "infantry", 260, 18, 24, 5, AC + "r0c1.png",
      "Mochilas de salto e espadas-serra: caem sobre os lealistas.", ["Saltar!", "Do céu, a lâmina.", "Pelo Tirano!"],
      range=0.03, speed=0.042, armor=1.3, allTerrain=True),
    U("ac_devastators", "Devastadores", "infantry", 340, 24, 28, 5, AC + "r0c2.png",
      "Armas pesadas para quebrar os assaltos lealistas.", ["Fogo pesado!", "Que venham.", "Ninguém passa da muralha."],
      range=0.15, speed=0.016, armor=1.35, vsVehicle=1.25),
    U("ac_terminators", "Exterminadores dos Astral Claws", "infantry", 540, 36, 42, 5, AC + "r0c3.png",
      "A guarda de honra do Tirano, em Armadura Tática Dreadnought.", ["Teleporte.", "O Tirano manda.", "Esmaguem os lealistas."],
      range=0.06, speed=0.016, armor=1.7, needsHive=True),
    U("ac_apothecary", "Apotecário", "infantry", 180, 12, 12, 1, AC + "r1c2.png",
      "Guarda a semente genética que Huron se recusa a entregar a Terra.", ["A semente é nossa.", "Aguente, irmão.", "Nada se perde."],
      range=0.06, armor=1.45),
    U("ac_dreadnought", "Dreadnought", "vehicle", 480, 32, 44, 1, AC + "r1c3.png",
      "Um herói antigo do capítulo, preso num sarcófago de guerra.", ["Lembro de Badab antes do Tirano.", "Avante.", "Ainda luto."],
      range=0.1, speed=0.02, armor=1.4, needsHive=True),
    U("ac_rhino", "Rhino", "vehicle", 200, 14, 20, 1, AC + "r3c0.png",
      "Transporte blindado de prata e azul.", ["Todos a bordo.", "Motores ligados.", "Avançar."]),
    U("ac_predator", "Predator", "vehicle", 360, 24, 36, 1, AC + "r3c1.png",
      "Tanque de apoio dos Astral Claws.", ["Canhões prontos.", "Alvo blindado.", "Fogo!"],
      range=0.15, vsVehicle=1.2, needsHive=True),
], "claws") + grp([
    U("tl_rifles", "Fuzileiros da Legião do Tirano", "infantry", 50, 3, 7, 10, AC + "r2c0.png",
      "Mercenários e renegados humanos armados pelo Tirano.", ["Pago para lutar.", "Pelo Tirano... e pelo soldo.", "Fogo!"],
      range=0.08, armor=0.85),
    U("tl_veterans", "Veteranos da Legião", "infantry", 110, 7, 12, 8, AC + "r2c1.png",
      "Sargentos endurecidos que mantêm os mercenários na linha.", ["Ninguém foge!", "Linha firme!", "Atirem!"],
      range=0.09),
    U("tl_heavy", "Equipe de Armas Pesadas", "infantry", 130, 9, 12, 6, AC + "r2c2.png",
      "Autocanhões e bolters pesados em tripés.", ["Tripé montado.", "Varrer a linha.", "Munição!"],
      range=0.15, speed=0.016, armor=0.8),
    U("tl_chimera", "Chimera da Legião", "vehicle", 200, 14, 20, 1, AC + "r3c2.png",
      "Transporte blindado com as cores do Tirano.", ["Blindado pronto.", "Todos dentro.", "Avançar."]),
    U("tl_russ", "Leman Russ da Legião", "vehicle", 320, 22, 32, 1, AC + "r3c3.png",
      "Tanques de batalha tomados dos arsenais de Badab.", ["Canhão carregado.", "Esmaga!", "Pelo Tirano."],
      range=0.16, speed=0.022, armor=1.2, needsHive=True),
], "tyrant") + grp([
    U("lm_tactical", "Táticos dos Lamenters", "infantry", 250, 17, 24, 5, BA + "r0c0.png",
      "Sucessores amaldiçoados de Sanguinius, em amarelo e xadrez.", ["Pela honra perdida.", "Seguimos Huron.", "Avante."],
      range=0.1, armor=1.35),
    U("lm_assault", "Assalto dos Lamenters", "infantry", 270, 18, 26, 5, BA + "r0c1.png",
      "A Sede Vermelha os leva ao corpo a corpo.", ["Sangue!", "Saltar!", "Pela linhagem do Anjo!"],
      range=0.03, speed=0.042, armor=1.3, vsInfantry=1.15, allTerrain=True),
    U("lm_priest", "Sacerdote Sanguinário", "infantry", 200, 14, 14, 1, BA + "r0c2.png",
      "Guardião do Cálice e da sanidade dos irmãos.", ["O Cálice nos fortalece.", "Resista à Sede.", "Aguente, irmão."],
      range=0.05, armor=1.45),
    U("lm_dreadnought", "Dreadnought dos Lamenters", "vehicle", 480, 32, 44, 1, BA + "r3c0.png",
      "Andador de guerra do capítulo amaldiçoado.", ["Ainda luto.", "Pelo Anjo.", "Avançar."],
      range=0.08, speed=0.022, armor=1.4, needsHive=True),
    U("lm_baal", "Baal Predator", "vehicle", 360, 24, 34, 1, BA + "r3c1.png",
      "Tanque rápido de lança-chamas e canhões de assalto.", ["Fogo e velocidade!", "Atropelem.", "Pelo Anjo!"],
      range=0.08, speed=0.04, vsInfantry=1.25),
], "lamenters") + grp([
    U("mw_scouts", "Batedores dos Mantis Warriors", "infantry", 130, 9, 12, 5, BA + "r1c0.png",
      "Mestres da emboscada nas selvas e ruínas.", ["Ninguém nos viu.", "Emboscada pronta.", "Um tiro."],
      range=0.1, speed=0.03, terrain={"jungle": {"taken": 0.7, "dmg": 1.15}, "forest": {"taken": 0.7}, "ruins": {"taken": 0.75}}),
    U("mw_tactical", "Táticos dos Mantis Warriors", "infantry", 250, 17, 24, 5, BA + "r1c1.png",
      "Guerreiros verdes de táticas de guerrilha.", ["Golpear e sumir.", "Paciência.", "Pelo capítulo."],
      range=0.1, armor=1.3, terrain={"jungle": {"taken": 0.85}}),
    U("mw_snipers", "Atiradores 'Tranquilidade'", "infantry", 200, 14, 16, 5, BA + "r1c2.png",
      "Atiradores camuflados que derrubam oficiais de muito longe.", ["Respire...", "Alvo abatido.", "Silêncio."],
      range=0.24, speed=0.018, terrain={"jungle": {"taken": 0.65}, "forest": {"taken": 0.65}, "hill": {"range": 1.15}}),
    U("mw_speeder", "Land Speeder", "vehicle", 240, 16, 22, 2, BA + "r3c2.png",
      "Antigravitacional rápido para ataques relâmpago.", ["Rasante!", "Passar e atirar.", "Rápido demais."],
      range=0.09, speed=0.06, armor=0.9, terrain=dict(HOVER)),
], "mantis") + grp([
    U("ex_tactical", "Táticos dos Executioners", "infantry", 250, 17, 24, 5, BA + "r2c0.png",
      "Os caçadores de troféus de cinza e vermelho.", ["Mais uma cabeça.", "Caçar.", "Pelos Executioners!"],
      range=0.1, armor=1.35),
    U("ex_vanguard", "Veteranos de Vanguarda", "infantry", 340, 22, 30, 5, BA + "r2c1.png",
      "Machados e mochilas de salto: caçam os campeões inimigos.", ["Ao campeão deles!", "Machados!", "Do alto!"],
      range=0.03, speed=0.042, armor=1.35, vsInfantry=1.25, allTerrain=True),
    U("ex_terminators", "Exterminadores dos Executioners", "infantry", 540, 36, 42, 5, BA + "r2c2.png",
      "Veteranos em Armadura Tática Dreadnought, com machados de troféu.", ["Teleporte.", "Cabeças para o salão.", "Avante."],
      range=0.05, speed=0.016, armor=1.7, needsHive=True),
    U("ex_land_raider", "Land Raider dos Executioners", "vehicle", 640, 42, 56, 1, BA + "r3c3.png",
      "Fortaleza blindada que leva os caçadores ao alvo.", ["Blindagem total.", "Canhões laser!", "Caçada."],
      range=0.15, armor=1.5, vsVehicle=1.3, requires=["hive", "unique"]),
], "executioners")

# ============================================================ Death Korps of Krieg
KRIEG = [
    U("kr_rifles", "Pelotão de Fuzileiros de Krieg", "infantry", 45, 3, 7, 12, KR + "r0c0.png",
      "Soldados que nasceram para morrer pelo Imperador. Nunca recuam.", ["Pelo Imperador, a morte.", "Avançar.", "Nossas vidas não importam."],
      range=0.08),
    U("kr_watchmaster", "Esquadra de Watchmaster", "infantry", 100, 7, 12, 8, KR + "r0c1.png",
      "Veteranos de trincheira com espadas-serra e pistolas.", ["Por cima da trincheira!", "Sigam-me.", "Sem medo."],
      range=0.05, vsInfantry=1.15),
    U("kr_grenadiers", "Granadeiros de Krieg", "infantry", 180, 12, 18, 6, KR + "r0c2.png",
      "Tropas de choque com armadura de carapaça e armas de raio quente.", ["Granadeiros, avante!", "Limpar a trincheira.", "Pelo Trono."],
      range=0.08, armor=1.25, terrain={"ruins": {"dmg": 1.15}}),
    U("kr_engineers", "Engenheiros de Combate", "infantry", 120, 8, 12, 6, KR + "r0c3.png",
      "Sapadores que cavam, minam e explodem fortificações.", ["Carga colocada.", "Cavar.", "Abrir caminho."],
      range=0.04, vsVehicle=1.2, terrain={"ruins": {"taken": 0.75}, "hive": {"dmg": 1.15}}),
    U("kr_plasma", "Esquadra de Plasma", "infantry", 170, 12, 16, 6, KR + "r1c0.png",
      "Rifles de plasma contra blindados rebeldes.", ["Plasma carregado.", "Derreter.", "Cuidado com o calor."],
      range=0.09, vsVehicle=1.3),
    U("kr_flamers", "Esquadra de Lança-Chamas", "infantry", 150, 10, 14, 6, KR + "r1c1.png",
      "Limpam bunkers e trincheiras com prometio.", ["Queimar a trincheira.", "Fogo!", "Nada sai vivo."],
      range=0.04, vsInfantry=1.3, terrain={"ruins": {"dmg": 1.2}}),
    U("kr_heavy", "Equipe de Bolter Pesado", "infantry", 140, 9, 14, 6, KR + "r1c2.png",
      "Fogo de supressão sobre a terra de ninguém.", ["Suprimir!", "Varrer.", "Munição!"],
      range=0.15, speed=0.016, armor=0.85),
    U("kr_riders", "Cavaleiros da Morte (Death Riders)", "vehicle", 200, 14, 18, 4, KR + "r1c3.png",
      "Cavalaria de lanças explosivas, montada em cavalos de Krieg.", ["Carga!", "Lanças baixas!", "Pelo Imperador!"],
      range=0.03, speed=0.055, vsInfantry=1.2),
    U("kr_quartermaster", "Quartermaster", "infantry", 120, 8, 10, 1, KR + "r2c2.png",
      "Decide quem ainda serve e quem recebe a misericórdia do Imperador.", ["Ainda serve.", "O Imperador o recebe.", "Próximo."],
      range=0.05, armor=1.2),
    U("kr_vox", "Operador Vox", "infantry", 90, 6, 8, 1, KR + "r2c3.png",
      "Chama a artilharia sobre as coordenadas inimigas.", ["Coordenadas enviadas.", "Barragem a caminho.", "Câmbio."],
      range=0.12, armor=1.0),
    U("kr_centaur", "Centaur", "vehicle", 140, 10, 14, 1, KR + "r3c0.png",
      "Trator blindado que reboca a artilharia.", ["Rebocando.", "Lagartas firmes.", "Avançar."],
      range=0.08, speed=0.035),
    U("kr_demolisher", "Leman Russ Demolisher", "vehicle", 380, 26, 38, 1, KR + "r3c1.png",
      "Canhão de demolição para derrubar muralhas.", ["Muralha à frente.", "Demolir.", "Fogo!"],
      range=0.1, speed=0.02, armor=1.3, vsVehicle=1.15, terrain={"hive": {"dmg": 1.2}}),
    U("kr_earthshaker", "Canhão Earthshaker", "vehicle", 260, 18, 26, 2, KR + "r3c2.png",
      "A artilharia que transforma Vraks num mar de crateras.", ["Carregar!", "Fogo!", "Mais um mês de barragem."],
      range=0.32, speed=0.008, armor=0.7, needsHive=True),
    U("kr_hades", "Perfuratriz Hades", "vehicle", 300, 20, 28, 1, KR + "r3c3.png",
      "Escava túneis por baixo das linhas e surge atrás delas.", ["Perfurando.", "Saindo atrás deles.", "Surpresa."],
      range=0.04, speed=0.03, armor=1.2, allTerrain=True),
]

# ============================================================ Rebeldes de Vraks
VRAKS = [
    U("vr_rifles", "Fuzileiros Renegados", "infantry", 40, 3, 6, 12, VR + "r0c0.png",
      "Milicianos de Vraks com armas do arsenal imperial.", ["Por Xaphan!", "Morte a Krieg!", "Livres do Imperador!"],
      range=0.08, armor=0.85),
    U("vr_raiders", "Assaltantes de Trincheira", "infantry", 70, 5, 10, 10, VR + "r0c1.png",
      "Rebeldes com porretes cravejados que saltam nas trincheiras de Krieg.", ["Na trincheira!", "Esmaga!", "Sangue!"],
      range=0.03, speed=0.032, vsInfantry=1.2),
    U("vr_grenadiers", "Granadeiros Traidores", "infantry", 150, 10, 16, 6, VR + "r0c2.png",
      "Antigos soldados imperiais que viraram as costas ao Trono.", ["O Trono mentiu.", "Avançar!", "Granadas!"],
      range=0.08, armor=1.15),
    U("vr_hmg", "Equipe de Metralhadora Pesada", "infantry", 120, 8, 14, 6, VR + "r0c3.png",
      "Ninhos de metralhadora nas ruínas da cidadela.", ["Varrer!", "Ninguém passa.", "Mais fita!"],
      range=0.15, speed=0.016, armor=0.85, terrain={"ruins": {"taken": 0.8}}),
    U("vr_preachers", "Pregadores Apóstatas", "infantry", 110, 7, 10, 3, VR + "r1c0.png",
      "Sacerdotes renegados que inflamam a milícia.", ["Xaphan é a verdade!", "Queimem os fiéis do cadáver!", "Ouçam!"],
      range=0.05, vsInfantry=1.1),
    U("vr_disciplinarians", "Disciplinadores da Milícia", "infantry", 130, 9, 14, 5, VR + "r1c1.png",
      "Mantêm os rebeldes na linha com porretes e medo.", ["Ninguém recua!", "Lute ou morra!", "Avante, vermes!"],
      range=0.04, armor=1.1),
    U("vr_heretek", "Heretek", "infantry", 160, 11, 14, 1, VR + "r1c3.png",
      "Tecno-sacerdote renegado que mantém as máquinas profanas.", ["As máquinas servem a outros deuses agora.", "Reparo profano.", "Óleo e sangue."],
      range=0.08, armor=1.3),
    U("vr_cultists", "Cultistas do Caos", "infantry", 45, 3, 6, 12, VR + "r2c1.png",
      "Fanáticos encapuzados que adoram os Deuses Sombrios.", ["Sangue para os Deuses!", "O Imperador está morto!", "Morte!"],
      range=0.05, speed=0.03, armor=0.8),
    U("vr_alpha", "Infiltradores da Alpha Legion", "infantry", 320, 22, 28, 5, VR + "r2c2.png",
      "Marines traidores que ninguém sabe de onde vieram. Atacam pelas sombras.", ["Eu sou Alpharius.", "Já estávamos aqui.", "Golpe preciso."],
      range=0.08, speed=0.03, armor=1.35, terrain={"ruins": {"taken": 0.7}, "hive": {"taken": 0.8}}, needsHive=True),
    U("vr_chimera", "Chimera Capturado", "vehicle", 180, 12, 18, 1, VR + "r3c0.png",
      "Transporte imperial pintado com as estrelas do Caos.", ["Motores do ódio.", "Todos dentro.", "Atropelar!"]),
    U("vr_russ", "Leman Russ Saqueado", "vehicle", 300, 20, 30, 1, VR + "r3c1.png",
      "Tanques roubados do arsenal de Vraks.", ["Canhão roubado, fogo roubado.", "Esmaga Krieg!", "Fogo!"],
      range=0.15, speed=0.022, armor=1.15, needsHive=True),
    U("vr_basilisk", "Basilisk Capturado", "vehicle", 240, 16, 24, 1, VR + "r3c2.png",
      "Artilharia do arsenal virada contra o Imperium.", ["Coordenadas de Krieg.", "Fogo!", "Barragem!"],
      range=0.3, speed=0.012, armor=0.75, needsHive=True),
    U("vr_truck", "Caminhão Blindado Improvisado", "vehicle", 110, 7, 12, 2, VR + "r3c3.png",
      "Caminhões com placas soldadas e metralhadoras: rápidos e frágeis.", ["Pisa fundo!", "Pula, pula!", "Atropela!"],
      range=0.08, speed=0.05, armor=0.7),
]

FACTION_UNITS = OrderedDict([("astral_claws", BADAB), ("krieg", KRIEG), ("vraks", VRAKS)])

# ============================================================ generais
GENERALS = [
    G("huron", "astral_claws", "Lugft Huron", "Tirano de Badab", AC + "r1c0.png", 0.3, 0.25, 0, 2, 0, "Mestre dos Astral Claws que se recusou a entregar o dízimo a Terra: +30% no ataque, +25% na defesa, duas cargas.",
      ["Terra esqueceu as Marcas de Badab. Eu não.", "Sou o Tirano, e isto é meu.", "Que venham os lealistas."], start=True),
    G("vharkus", "astral_claws", "Garrox Vharkus", "Capitão dos Astral Claws", AC + "r1c1.png", 0.25, 0.15, 1, 1, 0, "Capitão de confiança do Tirano: +25% no ataque e marcha uma província a mais.",
      ["O Tirano manda, eu cumpro.", "Avançar, irmãos.", "Nenhuma piedade."], start=True),
    G("tarrek", "astral_claws", "Tarrek Mund", "Coronel da Legião do Tirano", AC + "r2c3.png", 0.1, 0.25, 0, 1, 340, "Comandante dos mercenários humanos: +25% na defesa; tropas baratas.",
      ["Os homens lutam pelo soldo.", "Firmes!", "Linha de fogo!"], ),
    G("phoros", "astral_claws", "Malakim Phoros", "Mestre dos Lamenters", BA + "r0c3.png", 0.25, 0.2, 0, 1, 420, "Mestre do capítulo amaldiçoado que seguiu Huron: +25% no ataque, +20% na defesa.",
      ["A honra nos trouxe até aqui.", "Lamentamos, e lutamos.", "Pelo Anjo."]),
    G("redth", "astral_claws", "Ahazra Redth", "Bibliotecário-Chefe dos Mantis Warriors", BA + "r1c3.png", 0.15, 0.2, 0, 3, 420, "Psíquico dos Mantis Warriors: três cargas de apoio.",
      ["Eu vejo a emboscada antes deles.", "A mente é uma lâmina.", "Paciência."]),
    G("kane", "astral_claws", "Thulsa Kane", "Mestre dos Executioners", BA + "r2c3.png", 0.35, 0.05, 0, 0, 420, "Caçador de troféus: +35% no ataque.",
      ["Mais uma cabeça para o salão.", "Caçem o campeão deles.", "Morte com honra."]),
    G("zuehlke", "krieg", "Zuehlke", "Lorde-Comandante", KR + "r2c0.png", 0.15, 0.3, 0, 2, 0, "Comandante do cerco de Vraks: paciência de anos, +30% na defesa e duas cargas de artilharia.",
      ["Vraks cairá. O tempo não importa.", "Mais uma onda.", "O Imperador conta os mortos."], start=True),
    G("vosk", "krieg", "Vosk", "Comissário-Mor", KR + "r2c1.png", 0.25, 0.15, 0, 1, 0, "Ninguém recua com ele por perto: +25% no ataque.",
      ["Avancem.", "A morte é dever.", "Recuar é heresia."], start=True),
    G("kerrig", "krieg", "Kerrig", "Marechal da Cavalaria", KR + "r1c3.png", 0.25, 0.05, 1, 0, 360, "Comandante dos Death Riders: +25% no ataque e marcha uma província a mais.",
      ["Lanças baixas!", "Carga!", "Pela glória da morte."]),
    G("xaphan", "vraks", "Cardeal Xaphan", "Senhor de Vraks", VR + "r2c0.png", 0.15, 0.3, 0, 2, 0, "O cardeal apóstata que entregou Vraks ao Caos: +30% na defesa e duas cargas.",
      ["O Imperador é um cadáver.", "Vraks é livre.", "Ajoelhem-se perante a verdade."], start=True),
    G("drax", "vraks", "Vosen Drax", "Comandante Rebelde", VR + "r1c2.png", 0.25, 0.15, 1, 1, 0, "Antigo oficial imperial: +25% no ataque e marcha uma província a mais.",
      ["Eu conheço as táticas deles.", "Avançar!", "Krieg sangrará."], start=True),
    G("ugrak", "vraks", "Ugrak, o Marcado", "Campeão do Caos", VR + "r2c3.png", 0.35, 0.1, 0, 0, 400, "Campeão escolhido dos Deuses: +35% no ataque.",
      ["Sangue para o Deus do Sangue!", "Desafio!", "Os Deuses me olham."]),
]

SUPPORT = {
    "astral_claws": [
        S("ac_pod", "drop_pod", "Cápsula de Desembarque", 8, "orbit", AC + "r0c0.png", "Uma cápsula cai com uma esquadra tática."),
        S("ac_thunderhawk", "strategic_bomber", "Ataque de Thunderhawks", 15, "", AC + "r3c1.png", "Canhoneiras passam em linha disparando.", airDiscount=6),
        S("ac_lance", "orbital_laser", "Lança da Frota do Tirano", 18, "orbit", AC + "r1c0.png", "A frota de Huron queima o alvo."),
    ],
    "krieg": [
        S("kr_barrage", "orbital_saturation", "Barragem Earthshaker", 18, "", KR + "r3c2.png", "Dias de artilharia condensados em minutos. Atinge todos."),
        S("kr_valkyrie", "drop_pod", "Assalto de Valkyries", 9, "", KR + "r0c2.png", "Granadeiros descem de Valkyries no ponto escolhido."),
        S("kr_marauder", "strategic_bomber", "Bombardeiros Marauder", 15, "", KR + "r2c3.png", "A Armada passa em linha soltando bombas.", airDiscount=6),
    ],
    "vraks": [
        S("vr_basilisks", "orbital_saturation", "Basiliscos da Cidadela", 18, "", VR + "r3c2.png", "A artilharia roubada satura a área. Atinge todos."),
        S("vr_tunnels", "drop_pod", "Túneis da Cidadela", 8, "", VR + "r0c1.png", "Rebeldes saem de um túnel no ponto escolhido."),
        S("vr_daemon", "orbital_laser", "Invocação Profana", 20, "", VR + "r2c0.png", "Xaphan abre a disformidade sobre o alvo. Atinge todos."),
    ],
}

GROUPS = OrderedDict([
    ("claws", {"name": "Astral Claws", "desc": "Os Marines de Huron.", "icon": AC + "r1c0.png"}),
    ("tyrant", {"name": "Legião do Tirano", "desc": "Auxiliares humanos: baratos e numerosos.", "icon": AC + "r2c3.png",
                "leaderTitles": ["Sargento", "Tenente", "Capitão"], "leaderNames": ["Varro", "Kesh", "Dorran", "Mulk", "Hesk", "Tallin", "Brask", "Oren"]}),
    ("lamenters", {"name": "Lamenters", "desc": "Sucessores de Sanguinius que seguiram Huron.", "icon": BA + "r0c3.png",
                   "leaderNames": ["Ariel", "Danath", "Sabrael", "Ithurel", "Zadkiel", "Lucan"]}),
    ("mantis", {"name": "Mantis Warriors", "desc": "Mestres da guerrilha e da emboscada.", "icon": BA + "r1c3.png",
                "leaderNames": ["Kel'than", "Ixar", "Vhoren", "Tanric", "Silas", "Dreyl"]}),
    ("executioners", {"name": "Executioners", "desc": "Caçadores de troféus. Os Land Raiders exigem cidade-colmeia.", "icon": BA + "r2c3.png",
                      "leaderNames": ["Mordek", "Hrazz", "Kael", "Thorne", "Vulkis", "Gharr"]}),
])

BADAB_F = F("astral_claws", "Secessionistas de Badab", "Badab", [70, 110, 190], AC + "r1c0.png", "Dízimo", "Díz", "Frota do Tirano",
            ["Sargento", "Veterano", "Capitão"], ["Corvan", "Mordaci", "Sabrus", "Haldane", "Kaedus", "Varrian", "Dexter", "Tamburlaine"],
            ["Tirano Eterno", "Garra Astral", "Coroa de Badab", "Dízimo Negado"],
            AC + "r1c0.png", AC + "r1c1.png", AC + "r2c0.png",
            "Lugft Huron, o Tirano de Badab, recusou o dízimo de semente genética a Terra. Os Astral Claws, a Legião do Tirano e três capítulos aliados enfrentam a cruzada lealista.",
            "Badab: escolha a força em 'Recrutar' — Astral Claws, a Legião do Tirano (barata), Lamenters (assalto), Mantis Warriors (emboscada e atiradores) e Executioners (elite).",
            "Astral Claws", attackBonus=0.06, incomeMult=1.3, funds=1000, dropFx=[150, 180, 255])
BADAB_F["allies"] = GROUPS

KRIEG_F = F("krieg", "Death Korps of Krieg", "Krieg", [110, 120, 130], KR + "r2c0.png", "Suprimentos", "Supr", "Frota de Desembarque",
            ["Watchmaster", "Tenente", "Capitão"], ["Haller", "Brandt", "Vogt", "Kessel", "Reiss", "Strahl", "Wendt", "Falk", "Gerold", "Ulrich"],
            ["Expiação", "Fé de Krieg", "Vigília Cinzenta", "Martírio"],
            KR + "r2c0.png", KR + "r2c1.png", KR + "r0c0.png",
            "Os filhos de Krieg buscam expiar o pecado do seu mundo morrendo pelo Imperador. Ondas de infantaria, artilharia sem fim e uma paciência de anos.",
            "Krieg: infantaria baratíssima que nunca debanda e a melhor artilharia (Earthshaker). O recurso Expiação cresce com as próprias perdas.",
            "Krieg", attackBonus=0.0, incomeMult=2.0, funds=1300, dropFx=[200, 200, 210])

VRAKS_F = F("vraks", "Rebeldes de Vraks", "Vraks", [150, 60, 40], VR + "r2c0.png", "Arsenal", "Ars", "Frota Renegada",
            ["Sargento", "Capitão", "Apóstata"], ["Mardek", "Sorn", "Vexx", "Halek", "Druun", "Kalder", "Rusk", "Ossen", "Tavik"],
            ["Estrela de Vraks", "Cálice Negro", "Apostasia", "Arsenal Eterno"],
            VR + "r2c0.png", VR + "r1c2.png", VR + "r0c0.png",
            "O Cardeal Xaphan virou o mundo-arsenal Vraks contra o Imperador. Milícias armadas até os dentes com o arsenal imperial, cultistas, hereges da Mechanicus e Marines da Alpha Legion.",
            "Vraks: tropas baratas e muito armamento capturado (Basiliscos, Leman Russ). Lutam melhor nas ruínas e nas cidades.",
            "Vraks", attackBonus=0.05, incomeMult=1.6, sackName="Pilhar o Arsenal", sackMult=1.4, aiSack=0.5, sackXp=1,
            sackNote="O arsenal da província vira armas para a rebelião.", dropFx=[220, 80, 50])

FACTIONS = OrderedDict([("astral_claws", BADAB_F), ("krieg", KRIEG_F), ("vraks", VRAKS_F)])

# ============================================================ setor de Badab
DESC = ("Sistema estelar e corpos celestes (mesmo formato do sector.json). Gerado por tools/data/build_badab_vraks.py; "
        "mapas por tools/art/gen_planets.py.")

BADAB_SECTOR = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "904.M41", "monthsPerTurn": 1}),
    ("system", {"id": "badab", "name": "Sistema Badab", "star": {"name": "Badab", "color": [255, 225, 190]},
                "desc": "À beira do Maelstrom, Lugft Huron se declarou Tirano de Badab. A cruzada lealista chega para acabar com a secessão."}),
    ("bodies", [
        B("badab_primaris", "Badab Primaris", "planet", "Mundo-Colmeia", 0.20, 200, 1.0, "hive", "imperial", 201,
          "O mundo-colmeia de Huron, coberto de fortalezas. O Palácio dos Tiranos domina a maior colmeia. Os lealistas já abriram duas cabeças de ponte.", [
              P("tyrant_palace", "Palácio dos Tiranos", "hive", 0.50, 0.40, "astral_claws", 2, 3, ["ac_tactical", "tl_rifles", "ac_devastators"], True),
              P("ironspire", "Colmeia Agulha de Ferro", "hive", 0.32, 0.25, "astral_claws", 2, 2, ["tl_rifles", "tl_veterans"]),
              P("talon_hive", "Colmeia Garra", "hive", 0.68, 0.24, "astral_claws", 2, 2, ["tl_rifles", "lm_tactical"]),
              P("greenwood", "Selvas de Vilamus", "jungle", 0.30, 0.58, "astral_claws", 0, 0, ["mw_scouts"]),
              P("tithe_vaults", "Cofres do Dízimo", "industrial", 0.64, 0.55, "astral_claws", 1, 1, ["tl_heavy"]),
              P("salt_flats", "Salinas de Badab", "plains", 0.50, 0.66, None, 0, 0, ["guard_platoon"]),
              P("spine_mts", "Montes da Espinha", "mountains", 0.16, 0.42, None, 0, 1, ["guard_platoon"]),
              P("ash_belt", "Cinturão de Cinzas", "ash", 0.84, 0.44, None, 0, 0, ["guard_platoon"]),
              P("north_ice", "Calota Norte", "ice", 0.50, 0.08, None, 0, 0, []),
              P("south_swamp", "Pântanos do Sul", "mire", 0.36, 0.84, None, 0, 0, ["guard_platoon"]),
              P("salamander_head", "Cabeça de Ponte Nocturne", "hive", 0.10, 0.74, "salamanders", 2, 1, ["sal_intercessors", "sal_intercessors"]),
              P("loyal_landing", "Desembarque de Macragge", "hive", 0.90, 0.78, "ultramarines", 2, 1, ["um_intercessors", "um_intercessors"]),
              P("rust_district", "Distrito Ferrugem", "industrial", 0.66, 0.86, None, 1, 0, ["guard_platoon"]),
              SEA("bp_sea", 0.92, 0.10),
          ], big=True),
        station("claw_fort", "Fortaleza Garra Astral", "badab_primaris", 0.085, 40, "astral_claws", 203,
                "A fortaleza orbital dos Astral Claws sobre Badab Primaris.", "ac_tactical"),
        B("carcharias", "Carcharias", "planet", "Mundo dos Executioners", 0.34, 120, 0.62, "ice", "astral_claws", 205,
          "Mundo gelado onde os Executioners guardam os seus troféus.", [
              P("cr_hall", "Salão dos Troféus", "hive", 0.48, 0.45, "astral_claws", 2, 2, ["ex_tactical", "tl_rifles"], True),
              P("cr_glacier", "Glaciar das Cabeças", "ice", 0.20, 0.32, "astral_claws", 0, 0, []),
              P("cr_peaks", "Picos Cinzentos", "mountains", 0.78, 0.32, "astral_claws", 0, 1, ["tl_rifles"]),
              P("cr_mines", "Minas Profundas", "industrial", 0.32, 0.76, "astral_claws", 1, 0, []),
              P("cr_wastes", "Ermos Brancos", "ice", 0.72, 0.76, None, 0, 0, ["guard_platoon"]),
          ]),
        B("nocturne_fleet", "Frota de Cerco Nocturne", "station", "Barca de Batalha", 0.36, 260, 0.42, "station", "salamanders", 207,
          "A barca de batalha dos Salamandras, à frente da cruzada lealista.", [
              P("nf_bridge", "Ponte de Comando", "station", 0.45, 0.45, "salamanders", 2, 2, ["sal_intercessors", "sal_eradicators"], True),
              P("nf_forge", "Forja da Barca", "station", 0.22, 0.35, "salamanders", 0, 0, []),
              P("nf_hangars", "Hangares", "station", 0.72, 0.38, "salamanders", 1, 1, ["sal_scouts"]),
          ]),
        B("macragge_anchor", "Ancoradouro de Macragge", "planet", "Lua Agrícola", 0.46, 330, 0.55, "agri", "ultramarines", 209,
          "Uma lua agrícola tomada como base de partida dos Ultramarines.", [
              P("ma_keep", "Fortaleza do Ancoradouro", "hive", 0.50, 0.45, "ultramarines", 2, 2, ["um_intercessors", "um_scouts"], True),
              P("ma_fields", "Campos de Grãos", "plains", 0.20, 0.32, "ultramarines", 0, 0, []),
              P("ma_silos", "Silos", "industrial", 0.78, 0.32, "ultramarines", 1, 0, []),
              P("ma_hills", "Colinas", "mountains", 0.50, 0.78, "ultramarines", 0, 0, []),
          ]),
        B("segmentum_dock", "Doca do Segmentum", "station", "Estação da Armada", 0.44, 190, 0.42, "station", "imperial", 211,
          "A doca da Armada Imperial que abastece o cerco.", [
              P("sd_yards", "Estaleiros", "station", 0.30, 0.45, "imperial", 2, 2, ["guard_platoon", "leman_russ"], True),
              P("sd_ring", "Anel de Atracação", "station", 0.62, 0.35, "imperial", 0, 0, ["guard_platoon"]),
              P("sd_battery", "Bateria", "station", 0.72, 0.68, "imperial", 0, 1, []),
          ]),
        B("maelstrom_rok", "Rocha do Maelstrom", "planet", "Asteroide Fortificado", 0.30, 30, 0.42, "rok", "astral_claws", 213,
          "Uma rocha escavada à beira do Maelstrom, cheia de corsários e mercenários do Tirano.", [
              P("mr_den", "Covil dos Corsários", "hive", 0.48, 0.45, "astral_claws", 2, 1, ["tl_rifles", "tl_heavy"], True),
              P("mr_tunnels", "Túneis", "rok", 0.22, 0.35, "astral_claws", 0, 0, []),
              P("mr_docks", "Docas Ocultas", "rok", 0.72, 0.62, "astral_claws", 0, 0, []),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "astral_claws", "general": "huron", "body": "badab_primaris", "province": "tyrant_palace",
         "battalions": ["ac_tactical", "ac_tactical", "ac_assault", "ac_devastators", "ac_terminators", "tl_rifles", "tl_rifles", "ac_predator"]},
        {"faction": "astral_claws", "general": "vharkus", "body": "carcharias", "province": "cr_hall",
         "battalions": ["ex_tactical", "ex_vanguard", "tl_rifles", "tl_heavy"]},
        {"faction": "salamanders", "general": "tushan", "body": "badab_primaris", "province": "salamander_head",
         "battalions": ["sal_intercessors", "sal_intercessors", "sal_infernus", "sal_eradicators", "sal_redemptor"]},
        {"faction": "salamanders", "general": "hestan", "body": "nocturne_fleet", "province": "nf_bridge",
         "battalions": ["sal_intercessors", "sal_assault", "sal_scouts"]},
        {"faction": "ultramarines", "general": "sicarius", "body": "badab_primaris", "province": "loyal_landing",
         "battalions": ["um_intercessors", "um_intercessors", "um_hellblasters", "um_inceptors"]},
        {"faction": "ultramarines", "general": "ventris", "body": "macragge_anchor", "province": "ma_keep",
         "battalions": ["um_intercessors", "um_scouts", "um_predator"]},
        {"faction": "imperial", "general": None, "body": "segmentum_dock", "province": "sd_yards",
         "battalions": ["guard_platoon", "guard_platoon", "leman_russ", "chimera"]},
    ]),
    ("startingFleets", [
        {"faction": "astral_claws", "body": "badab_primaris", "ships": 3},
        {"faction": "astral_claws", "body": "maelstrom_rok", "ships": 2},
        {"faction": "salamanders", "body": "nocturne_fleet", "ships": 3},
        {"faction": "ultramarines", "body": "macragge_anchor", "ships": 2},
        {"faction": "imperial", "body": "segmentum_dock", "ships": 3},
    ]),
])

BADAB_SCENARIO = OrderedDict([
    ("id", "badab"), ("name", "A Guerra de Badab"), ("sector", "sector_badab.json"),
    ("factions", ["astral_claws", "salamanders", "ultramarines", "imperial"]),
    ("playable", ["astral_claws", "salamanders", "ultramarines", "imperial"]),
    ("teams", {"loyalists": ["salamanders", "ultramarines", "imperial"]}),
    ("neutralName", "Forças de Defesa de Badab"),
    ("objective", {"body": "badab_primaris", "label": "Colmeias de Badab", "text": "controlar todas as cidades de Badab Primaris (os lealistas vencem juntos)"}),
    ("portraits", [AC + "r1c0.png", "salamanders/r2c0.png"]),
    ("intro", "904.M41. Lugft Huron, Mestre dos Astral Claws, recusou o dízimo de semente genética e se declarou Tirano de Badab. Lamenters, Mantis Warriors e Executioners o seguiram. Agora a cruzada lealista — Salamandras, Ultramarines e a Armada — chega para esmagar a secessão."),
    ("summary", "Huron e os capítulos secessionistas contra a cruzada lealista: Salamandras, Ultramarines e a Guarda Imperial."),
])

# ============================================================ setor de Vraks
VRAKS_SECTOR = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "813.M41", "monthsPerTurn": 3}),
    ("system", {"id": "vraks", "name": "Sistema Vraks", "star": {"name": "Vraks", "color": [255, 200, 160]},
                "desc": "O mundo-arsenal Vraks Prime guarda armas para mil regimentos. O Cardeal Xaphan o entregou ao Caos — e Krieg veio cobrar."}),
    ("bodies", [
        B("vraks_prime", "Vraks Prime", "planet", "Mundo-Arsenal", 0.20, 200, 1.0, "forge", "imperial", 221,
          "Um planeta de bunkers, depósitos e trincheiras. A Cidadela de Vraks é cercada por linhas de defesa em anéis. Krieg desembarcou no sul.", [
              P("citadel", "Cidadela de Vraks", "hive", 0.50, 0.24, "vraks", 2, 3, ["vr_rifles", "vr_hmg", "vr_grenadiers"], True),
              P("arsenal_east", "Arsenal Oriental", "industrial", 0.72, 0.28, "vraks", 2, 2, ["vr_rifles", "vr_hmg"]),
              P("arsenal_west", "Arsenal Ocidental", "industrial", 0.28, 0.28, "vraks", 2, 2, ["vr_rifles", "vr_raiders"]),
              P("cathedral", "Catedral Profanada", "hive", 0.50, 0.08, "vraks", 2, 2, ["vr_cultists", "vr_preachers"]),
              P("outer_line", "Linha Exterior", "ash", 0.50, 0.46, "vraks", 0, 2, ["vr_rifles", "vr_hmg"]),
              P("east_redoubt", "Reduto Leste", "mountains", 0.80, 0.50, "vraks", 0, 2, ["vr_rifles"]),
              P("west_redoubt", "Reduto Oeste", "mountains", 0.20, 0.50, "vraks", 0, 2, ["vr_rifles"]),
              P("no_mans_land", "Terra de Ninguém", "ash", 0.50, 0.64, None, 0, 0, []),
              P("crater_fields", "Campos de Crateras", "ash", 0.30, 0.70, None, 0, 0, ["vr_rifles"]),
              P("east_trenches", "Trincheiras do Leste", "ash", 0.72, 0.70, None, 0, 0, ["vr_rifles"]),
              P("krieg_camp", "Acampamento de Krieg", "plains", 0.50, 0.86, "krieg", 1, 2, ["kr_rifles", "kr_heavy"], True),
              P("west_camp", "Linha de Abastecimento Oeste", "plains", 0.20, 0.86, "krieg", 0, 1, ["kr_rifles"]),
              P("east_camp", "Linha de Abastecimento Leste", "plains", 0.82, 0.88, "krieg", 0, 1, ["kr_rifles"]),
              P("toxic_marsh", "Pântano Tóxico", "mire", 0.08, 0.66, None, 0, 0, []),
              P("burned_forest", "Floresta Queimada", "jungle", 0.92, 0.70, None, 0, 0, []),
          ], big=True),
        B("vraks_minor", "Vraks Menor", "planet", "Lua-Depósito", 0.085, 120, 0.42, "rok", "vraks", 223,
          "A lua-depósito do arsenal, cheia de silos e bunkers rebeldes.", [
              P("vm_silos", "Silos de Munição", "hive", 0.48, 0.45, "vraks", 2, 2, ["vr_rifles", "vr_basilisk"], True),
              P("vm_bunkers", "Bunkers", "rok", 0.22, 0.35, "vraks", 0, 1, ["vr_rifles"]),
              P("vm_docks", "Docas", "rok", 0.72, 0.62, "vraks", 0, 0, []),
          ], parent="vraks_prime"),
        station("krieg_dock", "Doca de Desembarque de Krieg", "vraks_prime", 0.13, 300, "krieg", 225,
                "A estação por onde chegam os regimentos de Krieg, um atrás do outro.", "kr_rifles"),
        B("grey_aegis", "Nau Negra Silêncio", "station", "Nau Negra", 0.38, 70, 0.42, "station", "grey_knights", 227,
          "A nau negra dos Cavaleiros Cinzentos, chamada pelos presságios de uma grande incursão demoníaca.", [
              P("ga_bridge", "Ponte da Nau", "station", 0.45, 0.45, "grey_knights", 2, 2, ["gk_strike", "gk_purgators"], True),
              P("ga_librarium", "Librarium", "station", 0.22, 0.35, "grey_knights", 0, 0, []),
              P("ga_teleport", "Sala de Teleporte", "station", 0.72, 0.38, "grey_knights", 1, 1, []),
          ]),
        B("warp_rift", "Fenda de Sangue", "planet", "Fenda da Disformidade", 0.42, 160, 0.6, "khorne", "world_eaters", 229,
          "Uma ferida na realidade aberta pelos sacrifícios de Xaphan. Por ela passam os servos de Khorne.", [
              P("wr_throne", "Trono de Bronze", "warp", 0.50, 0.45, "world_eaters", 2, 2, ["we_berzerkers", "we_bloodletters"], True),
              P("wr_pits", "Poços de Sangue", "warp", 0.20, 0.35, "world_eaters", 0, 0, ["we_jakhals"]),
              P("wr_bones", "Campos de Ossos", "ash", 0.78, 0.30, "world_eaters", 0, 0, []),
              P("wr_brass", "Torres de Bronze", "industrial", 0.50, 0.78, "world_eaters", 1, 0, []),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "krieg", "general": "zuehlke", "body": "vraks_prime", "province": "krieg_camp",
         "battalions": ["kr_rifles", "kr_rifles", "kr_rifles", "kr_watchmaster", "kr_grenadiers", "kr_engineers", "kr_heavy", "kr_earthshaker", "kr_demolisher"]},
        {"faction": "krieg", "general": "vosk", "body": "vraks_prime", "province": "west_camp",
         "battalions": ["kr_rifles", "kr_rifles", "kr_flamers", "kr_plasma", "kr_riders"]},
        {"faction": "krieg", "general": "kerrig", "body": "vraks_prime", "province": "east_camp",
         "battalions": ["kr_rifles", "kr_rifles", "kr_rifles", "kr_grenadiers", "kr_riders", "kr_heavy", "kr_earthshaker"]},
        {"faction": "vraks", "general": "xaphan", "body": "vraks_prime", "province": "citadel",
         "battalions": ["vr_rifles", "vr_rifles", "vr_grenadiers", "vr_hmg", "vr_alpha", "vr_russ", "vr_basilisk"]},
        {"faction": "vraks", "general": "drax", "body": "vraks_prime", "province": "arsenal_west",
         "battalions": ["vr_rifles", "vr_raiders", "vr_raiders", "vr_disciplinarians", "vr_chimera"]},
        {"faction": "grey_knights", "general": "voldus", "body": "grey_aegis", "province": "ga_bridge",
         "battalions": ["gk_strike", "gk_purifiers", "gk_terminators"]},
        {"faction": "world_eaters", "general": "invocatus", "body": "warp_rift", "province": "wr_throne",
         "battalions": ["we_jakhals", "we_berzerkers", "we_bloodletters", "we_bloodcrushers"]},
    ]),
    ("startingFleets", [
        {"faction": "krieg", "body": "krieg_dock", "ships": 3},
        {"faction": "vraks", "body": "vraks_minor", "ships": 2},
        {"faction": "grey_knights", "body": "grey_aegis", "ships": 2},
        {"faction": "world_eaters", "body": "warp_rift", "ships": 2},
    ]),
])

VRAKS_SCENARIO = OrderedDict([
    ("id", "vraks"), ("name", "O Cerco de Vraks"), ("sector", "sector_vraks.json"),
    ("factions", ["krieg", "vraks", "grey_knights", "world_eaters"]),
    ("playable", ["krieg", "vraks", "grey_knights", "world_eaters"]),
    ("teams", {"imperium": ["krieg", "grey_knights"], "traitors": ["vraks", "world_eaters"]}),
    ("neutralName", "Terra de Ninguém"),
    ("objective", {"body": "vraks_prime", "label": "Cidadelas de Vraks", "text": "controlar todas as cidades e arsenais de Vraks Prime (cada aliança vence junta)"}),
    ("portraits", [KR + "r2c0.png", VR + "r2c0.png"]),
    ("intro", "813.M41. O Cardeal Xaphan proclamou Vraks livre do Imperador e entregou o arsenal ao Caos. Os Death Korps of Krieg cavam trincheiras ao redor da Cidadela: o cerco vai durar anos. Nas sombras, a Alpha Legion arma os rebeldes, uma fenda de sangue se abre para Khorne — e os Cavaleiros Cinzentos vigiam."),
    ("summary", "Krieg e os Grey Knights contra os rebeldes de Xaphan e os demônios de Khorne, numa guerra de trincheiras."),
])


def main():
    units = load("units.json")
    for k, v in FACTION_UNITS.items():
        units[k] = v
    ids = [u["id"] for k, lst in units.items() if isinstance(lst, list) for u in lst]
    dup = {i for i in ids if ids.count(i) > 1}
    assert not dup, dup
    save("units.json", units)

    fac = load("factions.json")
    for k, v in FACTIONS.items():
        fac["factions"][k] = v
    save("factions.json", fac)

    gens = load("generals.json")
    gids = {g["id"] for g in GENERALS}
    gens["generals"] = [g for g in gens["generals"] if g["id"] not in gids] + GENERALS
    save("generals.json", gens)

    sup = load("support.json")
    for k, v in SUPPORT.items():
        sup[k] = v
    save("support.json", sup)

    save("sector_badab.json", BADAB_SECTOR)
    save("sector_vraks.json", VRAKS_SECTOR)
    sc = load("scenarios.json")
    new = [BADAB_SCENARIO, VRAKS_SCENARIO]
    sc["scenarios"] = [s for s in sc["scenarios"] if s["id"] not in {n["id"] for n in new}] + new
    save("scenarios.json", sc)
    print("unidades:", {k: len(v) for k, v in FACTION_UNITS.items()})


if __name__ == "__main__":
    main()
