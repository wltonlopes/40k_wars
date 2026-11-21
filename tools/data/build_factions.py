"""Monta (ou refaz) os dados das facções nos JSON da campanha:
units.json, factions.json, generals.json e support.json.

Retratos das pranchas de tools/source/sheets/ (recortadas por
tools/art/slice_sheets.py). Rodar de novo sobrescreve as facções listadas
aqui; as entradas que não estão aqui (ex.: aliados do Império) ficam.
"""
import json
import os
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "campaigns/wh40k/data")


def load(name):
    with open(os.path.join(DATA, name)) as f:
        return json.load(f, object_pairs_hook=OrderedDict)


def save(name, data):
    with open(os.path.join(DATA, name), "w") as f:
        json.dump(data, f, indent="\t", ensure_ascii=False)
        f.write("\n")


def U(id, name, cat, cost, upkeep, power, men, portrait, desc, quotes, **kw):
    d = OrderedDict([("id", id), ("name", name), ("group", kw.pop("group", "guard")), ("category", cat), ("cost", cost),
                     ("upkeep", upkeep), ("power", power), ("men", men), ("portrait", portrait), ("icon", portrait)])
    d.update(kw)
    d["desc"] = desc
    d["quotes"] = quotes
    return d


HOVER = {"water": {"speed": 2.5}, "mire": {"speed": 1.3}}

# ------------------------------------------------------------ Guarda Imperial (retratos novos + unidades)
IMPERIAL_PORTRAITS = {
    "guard_platoon": "astra_inf/r0c0.png", "guard_grenadiers": "astra_inf/r1c3.png", "heavy_weapons": "astra_inf/r1c2.png",
    "commissar": "astra_inf/r2c0.png", "sentinel": "astra_veh/r0c2.png", "chimera": "astra_veh/r0c0.png",
    "leman_russ": "astra_veh/r1c0.png", "valkyrie": "astra_veh/r3c0.png", "field_artillery": "astra_veh/r2c0.png",
}
IMPERIAL_NEW = [
    U("special_weapons", "Esquadra de Armas Especiais", "infantry", 170, 12, 16, 6, "astra_inf/r0c2.png",
      "Rifles de plasma e fuzis de fusão: fura blindagem de perto.", ["Plasma carregado. Cuidado com o superaquecimento.", "Mostre o blindado e ele derrete.", "Arma especial, sorte especial."],
      range=0.09, vsVehicle=1.3),
    U("flamers", "Esquadra de Lança-Chamas", "infantry", 150, 10, 14, 6, "astra_inf/r0c3.png",
      "Purificação pelo fogo. Devastadora em ruínas e selvas.", ["Queimem tudo!", "O fogo purifica.", "Prometio pronto, sargento."],
      range=0.04, vsInfantry=1.3, terrain={"ruins": {"dmg": 1.2}, "forest": {"dmg": 1.2}, "jungle": {"dmg": 1.15}}),
    U("ogryns", "Ogryns", "infantry", 220, 16, 22, 3, "astra_inf/r3c0.png",
      "Abomináveis leais: grandes, fortes e não muito espertos.", ["Ogryn esmaga!", "Senhor diz, Ogryn faz.", "Cadê os inimigo pequeno?"],
      range=0.04, armor=1.3, speed=0.024),
    U("bullgryns", "Bullgryns", "infantry", 260, 18, 24, 3, "astra_inf/r3c1.png",
      "Ogryns com escudos de laje: muralha viva.", ["Escudo levantado!", "Ninguém passa por Bullgryn.", "Bate no escudo, bate de volta."],
      range=0.04, armor=1.7, speed=0.018),
    U("ratlings", "Atiradores Ratling", "infantry", 150, 10, 12, 5, "astra_inf/r3c2.png",
      "Abhumanos franco-atiradores, mestres da camuflagem.", ["Um tiro, um herege.", "Fica quieto que eu acerto.", "Tem chá? Depois do tiro."],
      range=0.22, speed=0.018, terrain={"ruins": {"taken": 0.7}, "forest": {"taken": 0.7}, "hill": {"range": 1.15}}),
    U("hellhound", "Hellhound", "vehicle", 230, 16, 22, 1, "astra_veh/r0c3.png",
      "Tanque lança-chamas: limpa trincheiras e selvas.", ["Tanque de prometio cheio.", "Vamos acender essa selva.", "Nada se esconde do fogo."],
      range=0.06, vsInfantry=1.3, terrain={"forest": {"dmg": 1.2}, "jungle": {"dmg": 1.15}}),
    U("manticore", "Manticore", "vehicle", 280, 20, 24, 1, "astra_veh/r2c2.png",
      "Lança-foguetes Storm Eagle: saturação de longo alcance.", ["Foguetes no trilho.", "Coordenadas recebidas.", "Salva completa pronta."],
      range=0.3, speed=0.016, armor=0.8, needsHive=True),
    U("hydra", "Hydra", "vehicle", 240, 16, 20, 1, "astra_veh/r2c3.png",
      "Autocanhões quádruplos antiaéreos.", ["Céu limpo? Por pouco tempo.", "Autocanhões rodando.", "Nenhum caça passa."],
      range=0.16, vsAir=1.6),
    U("vendetta", "Vendetta", "air", 300, 22, 28, 1, "astra_veh/r3c1.png",
      "Caça-tanques com canhões laser gêmeos.", ["Vendetta no ar.", "Lasers carregados, caçando blindados.", "Alvo travado."],
      needsHive=True, vsVehicle=1.3),
    U("baneblade", "Baneblade", "vehicle", 900, 60, 70, 1, "astra_veh/r3c2.png",
      "Super-pesado: uma catedral de aço sobre lagartas.", ["A Baneblade avança. Abram caminho.", "Canhão principal pronto. Que o Imperador guie.", "Somos a fortaleza que anda."],
      range=0.18, speed=0.014, armor=1.3, requires=["hive", "unique"]),
]

# ------------------------------------------------------------ Orks
ORK_PORTRAITS = {
    "boyz": "orks_inf/r0c0.png", "shoota_boyz": "orks_inf/r0c1.png", "nobz": "orks_inf/r1c0.png",
    "trukk": "orks_veh/r1c0.png", "looted_wagon": "orks_veh/r1c2.png", "dakkajet": "orks_veh/r2c1.png",
}
ORK_NEW = [
    U("gretchin", "Bando de Grots", "infantry", 40, 3, 5, 12, "orks_inf/r0c2.png",
      "Grots baratos e covardes. Servem para absorver tiros.", ["Precisa mesmo, chefe?", "A gente vai... depois de vocês.", "Grot também briga! Um pouquinho."],
      range=0.06, armor=0.8),
    U("kommandos", "Kommandos", "infantry", 150, 10, 14, 6, "orks_inf/r1c2.png",
      "Orks furtivos (pra um Ork). Atacam de onde ninguém espera.", ["Shhh... os humies não viu a gente.", "Pega pelas costas!", "Sorrateiro é o nosso nome."],
      range=0.04, terrain={"forest": {"taken": 0.7}, "jungle": {"taken": 0.75, "dmg": 1.15}, "ruins": {"taken": 0.75}}),
    U("stormboyz", "Rapazes Foguete", "infantry", 170, 12, 16, 6, "orks_inf/r1c3.png",
      "Mochilas-foguete que às vezes explodem. Às vezes no inimigo.", ["FOGUETE LIGADO!", "Lá vem nóis do céu!", "Se cair, cai em cima deles!"],
      range=0.04, speed=0.042, allTerrain=True),
    U("burna_boyz", "Rapazes Lança-Chamas", "infantry", 160, 11, 16, 5, "orks_inf/r2c0.png",
      "Queimadores: fogo e cortes de maçarico.", ["Esquenta eles!", "Fogo bonito, chefe!", "Queima, queima, QUEIMA!"],
      range=0.045, vsInfantry=1.3, terrain={"ruins": {"dmg": 1.25}, "hive": {"dmg": 1.15}}),
    U("lootas", "Saqueadores (Lootas)", "infantry", 200, 14, 18, 5, "orks_inf/r2c1.png",
      "Deffguns montadas com peças saqueadas: muito dakka de longe.", ["Deffgun cheia de dakka!", "Mais dente pra nóis!", "Mira? Pra que mira?"],
      range=0.15, speed=0.017),
    U("tankbustas", "Caça-Tanques", "infantry", 190, 13, 18, 5, "orks_inf/r2c2.png",
      "Orks obcecados por explodir blindados com foguetes.", ["Cadê os tanque?", "Bum na lata!", "Foguete grande pra lata grande!"],
      range=0.1, vsVehicle=1.6),
    U("meganobz", "Meganobz", "infantry", 320, 22, 30, 3, "orks_inf/r1c1.png",
      "Nobz em mega-armadura: lentos e quase inquebráveis.", ["Mega-armadura no talo!", "Pode atirar, num faz cosquinha!", "A gente é os mais grandão!"],
      range=0.04, armor=1.6, speed=0.015, needsHive=True),
    U("warbikers", "Motoqueiros da Guerra", "vehicle", 200, 14, 18, 3, "orks_veh/r0c3.png",
      "Motos barulhentas com dakka. Velocidade é tudo.", ["Acelera!", "Vruuum dakka dakka!", "Ninguém pega nóis!"],
      speed=0.055, range=0.08, terrain={"plains": {"speed": 1.2}, "ash": {"speed": 1.2}}),
    U("battlewagon", "Vagão de Batalha", "vehicle", 380, 26, 40, 1, "orks_veh/r1c1.png",
      "Fortaleza sobre lagartas, cheia de rapazes e dentes.", ["Todo mundo a bordo!", "Mais placas, mais dentes!", "Atropela que é mais rápido!"],
      armor=1.2, needsHive=True),
    U("deffkoptas", "Deffkoptas", "air", 180, 12, 16, 2, "orks_veh/r2c0.png",
      "Helicópteros de sucata com serras e foguetes.", ["Hélice girando, chefe!", "Mergulho de dakka!", "Voa que nem doido!"]),
    U("burna_bommer", "Burna-Bommer", "air", 280, 20, 26, 1, "orks_veh/r2c2.png",
      "Bombardeiro de bombas incendiárias.", ["Bombas de fogo prontas!", "Vai cair fogo do céu!", "Queima geral!"],
      needsHive=True, vsInfantry=1.2),
    U("big_gunz", "Grandes Kanhões", "vehicle", 180, 12, 18, 3, "orks_veh/r2c3.png",
      "Kanhões enormes operados por grots apavorados.", ["Kanhão carregado... eu acho.", "Tampa os ouvido!", "Fogo! FOGO!"],
      range=0.26, speed=0.01, armor=0.7),
    U("killa_kans", "Killa Kans", "vehicle", 210, 14, 22, 3, "orks_veh/r3c0.png",
      "Latas-andantes pilotadas por grots com raiva.", ["Agora o grot é grandão!", "Esmaga!", "Lata de matar pronta!"]),
    U("deff_dread", "Deff Dread", "vehicle", 300, 20, 32, 1, "orks_veh/r3c1.png",
      "Andador de garras e kanhões: um Mek muito orgulhoso.", ["Garras afiadas!", "Corta e atira!", "Dread de Ork é o melhor!"],
      needsHive=True, range=0.06),
    U("gorkanaut", "Gorkanaut", "vehicle", 700, 46, 60, 1, "orks_veh/r3c2.png",
      "Andador gigante à imagem de Gork (ou Mork).", ["Pisa neles!", "Gork tá aqui!", "Maior é melhor!"],
      armor=1.3, speed=0.015, requires=["hive", "unique"]),
    U("stompa", "Stompa", "vehicle", 1100, 70, 85, 1, "orks_veh/r3c3.png",
      "Uma catedral de sucata que anda. A maior lata da Waaagh!", ["STOMPA PISA!", "Pequenino tudo lá embaixo!", "WAAAAAGH!"],
      armor=1.4, speed=0.011, range=0.18, requires=["hive", "unique"]),
]


def biomass(units):
    for u in units:
        u.setdefault("terrain", OrderedDict())
        u["terrain"]["biomass"] = {"speed": 1.25, "taken": 0.9}
    return units


# ------------------------------------------------------------ Tiranídeos
TYRANIDS = biomass([
    U("termagants", "Ninhada de Termagantes", "infantry", 50, 4, 7, 12, "tyranids/r0c0.png",
      "Criaturas de enxame com armas vivas. Muitas e descartáveis.", ["(chiado do enxame)", "...fome...", "(sibilos em uníssono)"], range=0.06),
    U("hormagaunts", "Ninhada de Hormagantes", "infantry", 55, 4, 8, 12, "tyranids/r0c1.png",
      "Garras-foice e saltos: avançam rápido para o corpo a corpo.", ["(guinchos famintos)", "...rasgar...", "(estalar de garras)"], speed=0.032, range=0.03, vsInfantry=1.1),
    U("gargoyles", "Revoada de Gárgulas", "air", 90, 6, 10, 10, "tyranids/r0c2.png",
      "Enxame alado que escurece o céu.", ["(bater de asas)", "...caçar do alto...", "(gritos estridentes)"]),
    U("genestealers", "Genestealers", "infantry", 170, 12, 18, 6, "tyranids/r0c3.png",
      "Predadores infiltradores com garras que rasgam ceramita.", ["...a prole cresce...", "(silêncio mortal)", "...o Patriarca chama..."],
      speed=0.032, range=0.03, terrain={"hive": {"dmg": 1.2, "taken": 0.85}, "ruins": {"dmg": 1.15}, "station": {"dmg": 1.2}}),
    U("warriors", "Guerreiros Tiranídeos", "infantry", 190, 13, 20, 3, "tyranids/r1c0.png",
      "Criaturas sinápticas: conduzem o enxame menor.", ["A Mente da Colmeia ordena.", "...consumir...", "(rugido sináptico)"], armor=1.3, range=0.08),
    U("raveners", "Raveners", "infantry", 180, 12, 18, 3, "tyranids/r1c1.png",
      "Serpentes escavadoras que surgem do chão.", ["(tremor no solo)", "...por baixo...", "(silvo)"], speed=0.04, range=0.03, allTerrain=True),
    U("lictor", "Lictor", "infantry", 150, 10, 14, 1, "tyranids/r1c2.png",
      "Caçador camaleônico que marca as presas para o enxame.", ["...observando...", "(nada se ouve)", "...presa marcada..."],
      range=0.03, terrain={"forest": {"taken": 0.6, "dmg": 1.2}, "jungle": {"taken": 0.6, "dmg": 1.2}, "ruins": {"taken": 0.65}}),
    U("zoanthropes", "Zoantropos", "infantry", 240, 16, 22, 3, "tyranids/r1c3.png",
      "Cérebros flutuantes que disparam raios psíquicos.", ["(zumbido psíquico)", "...a sombra na disformidade...", "(pressão na mente)"],
      range=0.14, armor=1.3, needsHive=True),
    U("hive_guard", "Guarda da Colmeia", "infantry", 260, 18, 24, 3, "tyranids/r2c0.png",
      "Armas impaladoras que caçam blindados.", ["...proteger a sinapse...", "(estalos de quitina)", "...perfurar..."], range=0.16, vsVehicle=1.4),
    U("tyrant_guard", "Guarda do Tirano", "infantry", 280, 18, 26, 3, "tyranids/r3c0.png",
      "Escudos vivos com lâminas de osso.", ["(passos pesados)", "...guardar...", "(rosnado)"], armor=1.6, range=0.03),
    U("carnifex", "Carnifex", "vehicle", 320, 22, 36, 1, "tyranids/r2c1.png",
      "Monstro-aríete que derruba muralhas e tanques.", ["(rugido ensurdecedor)", "...esmagar...", "(carga)"], armor=1.2, range=0.05, vsVehicle=1.3),
    U("haruspex", "Haruspex", "vehicle", 360, 24, 40, 1, "tyranids/r3c1.png",
      "Devorador colossal que engole as presas inteiras.", ["(mandíbulas)", "...devorar...", "(fome sem fim)"], range=0.03, needsHive=True),
    U("mawloc", "Mawloc", "vehicle", 420, 28, 44, 1, "tyranids/r3c2.png",
      "Verme gigante que emerge sob o inimigo.", ["(o chão se abre)", "...por baixo...", "(estrondo)"], range=0.04, allTerrain=True, needsHive=True),
    U("tervigon", "Tervigon", "vehicle", 520, 34, 50, 1, "tyranids/r3c3.png",
      "Ninhada viva que gera termagantes sem parar.", ["...a prole nasce...", "(pulsar dos sacos)", "...mais..."], armor=1.3, needsHive=True),
])

# ------------------------------------------------------------ Caos (Legião Negra)
CHAOS = [
    U("cultists", "Cultistas", "infantry", 45, 3, 6, 12, "chaos/r0c0.png",
      "Fanáticos armados com o que encontram.", ["Sangue para os Deuses!", "O Saqueador nos guia!", "Morte ao Falso Imperador!"], range=0.06, armor=0.8),
    U("chaos_marines", "Marines do Caos", "infantry", 300, 22, 26, 5, "chaos/r0c1.png",
      "Traidores da Legião Negra, dez mil anos de ódio.", ["Pela Legião Negra!", "Lembramos da traição.", "Nossas armas têm fome."], armor=1.3),
    U("havocs", "Havocs", "infantry", 360, 24, 28, 5, "chaos/r0c2.png",
      "Armas pesadas dos traidores.", ["Fogo pesado!", "Destruam as muralhas.", "Que nada fique de pé."], range=0.15, speed=0.016, armor=1.3, vsVehicle=1.3),
    U("raptors", "Raptores", "infantry", 320, 22, 24, 5, "chaos/r0c3.png",
      "Mochilas de salto e gritos de terror.", ["Do céu, o terror!", "Caçamos os fracos.", "Ouçam nossos gritos!"], speed=0.04, range=0.05, armor=1.2, allTerrain=True),
    U("warp_talons", "Garras da Disformidade", "infantry", 360, 24, 28, 5, "chaos/r1c0.png",
      "Raptores mutados que saltam pela disformidade.", ["A disformidade nos leva.", "Garras famintas.", "Rasgar a carne!"], speed=0.042, range=0.03, armor=1.2, allTerrain=True),
    U("chosen", "Escolhidos", "infantry", 400, 26, 32, 5, "chaos/r1c1.png",
      "Os veteranos favoritos dos Deuses.", ["Os Deuses nos olham.", "Provaremos nosso valor.", "Glória ao Caos!"], armor=1.4, needsHive=True),
    U("chaos_terminators", "Exterminadores do Caos", "infantry", 560, 38, 42, 5, "chaos/r1c2.png",
      "Armadura Tática Dreadnought profanada.", ["Teleporte concluído. Matem todos.", "Somos imortais.", "A Legião Negra marcha."], speed=0.015, armor=1.7, needsHive=True),
    U("possessed", "Possuídos", "infantry", 380, 26, 30, 5, "chaos/r1c3.png",
      "Marines com demônios na carne.", ["(risos que não são humanos)", "A carne é nossa.", "Libertem-nos!"], speed=0.03, range=0.03, armor=1.3),
    U("chaos_rhino", "Rhino do Caos", "vehicle", 200, 14, 20, 1, "chaos/r3c0.png",
      "Transporte blindado coberto de espinhos.", ["Motores do ódio.", "Todos a bordo, irmãos.", "Atropelem os fracos."]),
    U("predator", "Predator", "vehicle", 340, 24, 34, 1, "chaos/r3c1.png",
      "Tanque de apoio dos traidores.", ["Canhões prontos.", "Caçamos blindados.", "Nada sobrevive."], range=0.14, needsHive=True, vsVehicle=1.2),
    U("obliterators", "Obliteradores", "vehicle", 420, 28, 40, 1, "chaos/r3c2.png",
      "Marines fundidos às armas pelo vírus da obliteração.", ["(metal e carne rangem)", "Armas... de carne...", "OBLITERAR!"], range=0.12, speed=0.015, needsHive=True),
    U("defiler", "Profanador", "vehicle", 480, 32, 46, 1, "chaos/r3c3.png",
      "Máquina-demônio aracnídea com canhão de batalha.", ["(o demônio ruge na máquina)", "Profanar tudo.", "Esmagar os fiéis."], range=0.2, needsHive=True),
]
for u in CHAOS:
    u.setdefault("terrain", OrderedDict())["warp"] = {"dmg": 1.15, "taken": 0.85}

# ------------------------------------------------------------ Eldar (Ulthwé)
ELDAR = [
    U("guardians", "Guardiões", "infantry", 80, 6, 9, 10, "eldar/r0c0.png",
      "Civis do mundo-nave chamados às armas, com catapultas shuriken.", ["Por Ulthwé.", "O caminho nos guia.", "Que o futuro seja nosso."], range=0.08, armor=0.9),
    U("dire_avengers", "Vingadores Implacáveis", "infantry", 180, 12, 18, 5, "eldar/r0c3.png",
      "Guerreiros de Aspecto: disciplina e catapultas.", ["Vingança para os caídos.", "O Aspecto nos fortalece.", "Nenhum passo atrás."], range=0.09),
    U("rangers", "Patrulheiros", "infantry", 160, 11, 12, 5, "eldar/r0c2.png",
      "Exilados do caminho com rifles longos e mantos camaleônicos.", ["Já vi seu destino.", "Um tiro, uma alma.", "As sombras são minhas."],
      range=0.22, speed=0.02, terrain={"forest": {"taken": 0.65}, "ruins": {"taken": 0.65}}),
    U("howling_banshees", "Banshees Uivantes", "infantry", 190, 13, 18, 5, "eldar/r1c0.png",
      "O grito delas paralisa; as espadas terminam o trabalho.", ["Ouçam nosso lamento!", "A morte é rápida.", "Silêncio, depois o grito."], speed=0.034, range=0.03, vsInfantry=1.2),
    U("striking_scorpions", "Escorpiões Golpeadores", "infantry", 200, 14, 20, 5, "eldar/r1c1.png",
      "Emboscadores das selvas, ferrão nas máscaras.", ["O escorpião espera.", "Da selva, a morte.", "Ferrão pronto."],
      range=0.03, terrain={"forest": {"taken": 0.75, "dmg": 1.15}, "jungle": {"taken": 0.75, "dmg": 1.15}}),
    U("fire_dragons", "Dragões de Fogo", "infantry", 230, 16, 22, 5, "eldar/r1c2.png",
      "Armas de fusão: derretem qualquer blindado.", ["Cinzas a cinzas.", "O dragão desperta.", "Nenhuma armadura resiste."], range=0.05, vsVehicle=1.8),
    U("dark_reapers", "Ceifadores Sombrios", "infantry", 240, 16, 22, 5, "eldar/r1c3.png",
      "Lança-mísseis precisos: ceifam de longe.", ["A morte tem muitos nomes.", "Ceifamos.", "Alvos à vista."], range=0.17, speed=0.016),
    U("swooping_hawks", "Falcões Mergulhadores", "infantry", 200, 14, 16, 5, "eldar/r2c0.png",
      "Asas e granadas: caem de qualquer lugar.", ["Do céu!", "As asas nos levam.", "Mergulho!"], speed=0.045, allTerrain=True),
    U("warp_spiders", "Aranhas da Disformidade", "infantry", 220, 15, 20, 5, "eldar/r2c1.png",
      "Saltam curtas distâncias pela disformidade.", ["Salto.", "Estamos em toda parte.", "A teia nos guarda."], speed=0.045, range=0.07, allTerrain=True),
    U("wraithguard", "Guarda Espectral", "infantry", 380, 26, 34, 3, "eldar/r3c1.png",
      "Construtos de osso-espectral animados por almas.", ["(eco das almas)", "Nós lembramos.", "Os mortos guardam os vivos."], armor=1.6, speed=0.014, needsHive=True),
    U("jetbikes", "Jetbikes", "vehicle", 220, 15, 18, 3, "eldar/r3c2.png",
      "Motos antigravitacionais velozes.", ["Mais rápido que o pensamento.", "Ventos de Ulthwé!", "Ataque e sumiço."], speed=0.06, terrain=HOVER),
    U("falcon", "Falcão", "vehicle", 360, 24, 34, 1, "eldar/r3c3.png",
      "Tanque antigravitacional gracioso e mortal.", ["Graça e fúria.", "Canhões de pulso prontos.", "Flutuando sobre a ruína."], range=0.15, speed=0.04, needsHive=True, terrain=HOVER),
]

# ------------------------------------------------------------ Necrons (Dinastia Sautekh)
NECRONS = [
    U("necron_warriors", "Guerreiros Necrons", "infantry", 120, 8, 12, 10, "necrons/r0c0.png",
      "Legiões de metal vivo com esfoladores gauss. Levantam-se de novo.", ["(estalos metálicos)", "...protocolos ativos...", "Obedecemos."], armor=1.2),
    U("immortals", "Imortais", "infantry", 240, 16, 22, 5, "necrons/r0c1.png",
      "Veteranos de elite das dinastias.", ["Somos eternos.", "A galáxia é nossa por direito.", "Ordens recebidas."], armor=1.4),
    U("deathmarks", "Marcadores da Morte", "infantry", 200, 14, 16, 5, "necrons/r0c2.png",
      "Assassinos que caçam de dimensões paralelas.", ["Alvo marcado.", "Caçamos entre dimensões.", "Ninguém escapa."], range=0.22, speed=0.018),
    U("flayed_ones", "Esfolados", "infantry", 170, 11, 18, 6, "necrons/r0c3.png",
      "Necrons amaldiçoados que vestem a pele das vítimas.", ["(raspar de garras)", "...carne...", "(sussurros loucos)"],
      speed=0.028, range=0.03, terrain={"ruins": {"dmg": 1.2}, "hive": {"dmg": 1.2}}),
    U("lychguard", "Guarda-Lych", "infantry", 340, 22, 30, 5, "necrons/r1c0.png",
      "Guarda pessoal dos nobres, com escudos dispersores.", ["Protegemos o Senhor.", "Nenhum passo.", "Lealdade eterna."], armor=1.6, needsHive=True),
    U("praetorians", "Pretorianos Triarcas", "infantry", 320, 22, 26, 5, "necrons/r1c1.png",
      "Juízes antigos que voam com motores antigravitacionais.", ["As leis antigas valem.", "Julgamento.", "Desonrados morrerão."], allTerrain=True, speed=0.032, armor=1.3),
    U("scarabs", "Enxame de Escaravelhos", "infantry", 100, 7, 10, 12, "necrons/r2c0.png",
      "Construtos que devoram matéria — e blindagem.", ["(zumbido metálico)", "(enxame)", "(estalidos)"], speed=0.035, range=0.02, vsVehicle=1.3),
    U("canoptek_wraiths", "Espectros Canoptek", "infantry", 320, 22, 26, 3, "necrons/r2c1.png",
      "Construtos que atravessam paredes.", ["(fase)", "(atravessando)", "(garras)"], speed=0.04, range=0.03, allTerrain=True),
    U("skorpekh", "Destruidores Skorpekh", "infantry", 340, 22, 30, 3, "necrons/r2c3.png",
      "Niilistas com lâminas hiperfásicas.", ["Exterminar.", "Toda vida acabará.", "Lâminas famintas."], speed=0.03, range=0.03, armor=1.3),
    U("spyder", "Aranha Canoptek", "vehicle", 260, 18, 24, 1, "necrons/r2c2.png",
      "Construto que repara a legião e solta escaravelhos.", ["(reparo em andamento)", "(zumbido)", "(escaravelhos liberados)"]),
    U("destroyers", "Destruidores", "vehicle", 340, 22, 28, 3, "necrons/r3c0.png",
      "Necrons fundidos a plataformas flutuantes de canhões.", ["Purgar a vida.", "Disparo.", "Nenhum sobrevivente."], range=0.16, speed=0.035, terrain=HOVER),
    U("doomsday_ark", "Arca do Juízo Final", "vehicle", 480, 32, 44, 1, "necrons/r3c2.png",
      "Barca com canhão do juízo final.", ["Carregando o juízo.", "Fim.", "Disparo apocalíptico."], range=0.26, speed=0.02, needsHive=True),
    U("monolith", "Monólito", "vehicle", 1100, 70, 80, 1, "necrons/r3c3.png",
      "Pirâmide flutuante e portal da eternidade.", ["(o portal se abre)", "A eternidade chegou.", "(ressonância)"], armor=1.6, speed=0.01, range=0.16, requires=["hive", "unique"]),
]
for u in NECRONS:
    u.setdefault("terrain", OrderedDict())["tomb"] = {"taken": 0.85, "dmg": 1.1}

# ------------------------------------------------------------ Tau (Seita de Dal'yth)
TAU = [
    U("fire_warriors", "Guerreiros de Fogo", "infantry", 120, 8, 12, 8, "tau/r0c0.png",
      "Rifles de pulso de longo alcance: fogo constante.", ["Pelo Bem Maior!", "Fogo de pulso pronto.", "Mantenham a distância."], range=0.14, armor=0.9),
    U("breachers", "Equipe de Rompedores", "infantry", 130, 9, 14, 8, "tau/r0c1.png",
      "Carabinas de pulso para combate a curta distância.", ["Rompendo.", "Curta distância, alto impacto.", "Avancem com cautela."], range=0.06),
    U("pathfinders", "Batedores", "infantry", 120, 8, 10, 6, "tau/r0c2.png",
      "Marcadores laser: guiam o fogo do resto do exército.", ["Alvo marcado.", "Batedores em posição.", "Vemos tudo."],
      range=0.16, terrain={"forest": {"taken": 0.75}, "ruins": {"taken": 0.75}}),
    U("kroot", "Kroot", "infantry", 80, 6, 10, 10, "tau/r0c3.png",
      "Mercenários caçadores, mestres da selva.", ["A caça começa.", "Carne fresca.", "Os Kroot seguem a trilha."],
      range=0.05, terrain={"jungle": {"dmg": 1.2, "taken": 0.75}, "forest": {"dmg": 1.2, "taken": 0.75}}),
    U("vespid", "Vespídeos", "infantry", 130, 9, 12, 6, "tau/r1c0.png",
      "Insetoides alados com armas de neutrões.", ["(zumbido)", "A colmeia serve ao Bem Maior.", "Voar e atacar."], speed=0.042, allTerrain=True),
    U("drones", "Esquadrilha de Drones", "air", 70, 5, 8, 6, "tau/r1c3.png",
      "Drones de combate autônomos.", ["(bip)", "Protocolo de combate.", "(zumbido)"]),
    U("stealth_suits", "Trajes Furtivos", "infantry", 220, 15, 18, 3, "tau/r2c0.png",
      "Trajes com camuflagem: atacam sem ser vistos.", ["Invisíveis.", "Atacamos das sombras.", "Ninguém nos viu."],
      allTerrain=True, terrain={"ruins": {"taken": 0.7}, "forest": {"taken": 0.7}}),
    U("crisis_suits", "Trajes de Batalha Crisis", "infantry", 300, 20, 26, 3, "tau/r2c1.png",
      "Armaduras saltadoras com armas pesadas: a elite.", ["Propulsores prontos.", "Mont'ka: o golpe mortal.", "Pelo Bem Maior."], armor=1.3, allTerrain=True, speed=0.03, range=0.1),
    U("broadsides", "Trajes Broadside", "infantry", 360, 24, 30, 3, "tau/r2c2.png",
      "Canhões ferroviários: destroem tanques de longe.", ["Canhões ferroviários carregados.", "Alvo blindado à vista.", "Firmes."],
      range=0.2, speed=0.014, armor=1.4, vsVehicle=1.4, needsHive=True),
    U("riptide", "Riptide", "vehicle", 600, 40, 52, 1, "tau/r2c3.png",
      "Traje gigante com canhão de íons e reator nova.", ["Reator nova pronto.", "Riptide em campo.", "Sobrecarga autorizada."], armor=1.3, needsHive=True),
    U("piranha", "Piranha", "vehicle", 180, 12, 16, 1, "tau/r3c0.png",
      "Skimmer leve e veloz.", ["Velocidade máxima.", "Ataque rápido.", "Já estamos longe."], speed=0.055, terrain=HOVER),
    U("devilfish", "Devilfish", "vehicle", 220, 15, 22, 1, "tau/r3c1.png",
      "Transporte antigravitacional.", ["Embarquem.", "Flutuando para a linha.", "Blindagem pronta."], terrain=HOVER),
    U("hammerhead", "Hammerhead", "vehicle", 400, 27, 38, 1, "tau/r3c2.png",
      "Tanque antigravitacional com canhão ferroviário.", ["Canhão ferroviário pronto.", "Nenhum tanque resiste.", "Alvo destruído."], range=0.2, vsVehicle=1.4, needsHive=True, terrain=HOVER),
    U("sky_ray", "Sky Ray", "vehicle", 360, 24, 30, 1, "tau/r3c3.png",
      "Lançador de mísseis buscadores guiados.", ["Mísseis buscadores armados.", "Céu limpo.", "Disparo guiado."], range=0.22, needsHive=True, vsAir=1.5, terrain=HOVER),
]


def G(id, faction, name, title, portrait, attack, defense, move, support, cost, trait, quotes, start=False):
    d = OrderedDict([("id", id), ("faction", faction), ("name", name), ("title", title), ("portrait", portrait), ("attack", attack),
                     ("defense", defense), ("move", move), ("support", support), ("hireCost", cost)])
    if start:
        d["start"] = True
    d["trait"] = trait
    d["quotes"] = quotes
    return d


GENERALS = [
    G("buzzgob", "orks", "Buzzgob", "Grande Mek", "orks_inf/r3c1.png", 0.15, 0.15, 0, 1, 380, "Mek de Ghazghkull: +15% no ataque e na defesa; as máquinas dele quase sempre funcionam.",
      ["Mais peças, mais dakka!", "Funciona? Funciona!", "Vô consertar essa lata."]),
    G("grotsnik", "orks", "Grotsnik", "Doutor Louco", "orks_inf/r3c2.png", 0.1, 0.25, 0, 1, 360, "Cirurgião doido: os rapazes dele aguentam mais (+25% na defesa).",
      ["Fica parado que dói menos.", "Um cérebro novo? Tenho aqui!", "Hehehe... próximo paciente!"]),
    # Tiranídeos
    G("hive_tyrant", "tyranids", "Gorgon Primus", "Tirano da Colmeia", "tyranids/r2c3.png", 0.25, 0.2, 0, 1, 0, "Comandante da Frota-Colmeia: +25% no ataque, o enxame obedece sem medo.",
      ["(a Mente da Colmeia fala através dele)", "...consumir...", "Tudo será biomassa."], start=True),
    G("old_one_eye", "tyranids", "Velho Olho Vermelho", "Carnifex Lendário", "tyranids/r2c1.png", 0.35, 0.1, 0, 0, 500, "Carnifex que regenera e não morre: +35% no ataque.",
      ["(rugido que faz tremer a terra)", "...esmagar...", "(o olho brilha)"], start=True),
    G("deathleaper", "tyranids", "Saltador da Morte", "Lictor", "tyranids/r1c2.png", 0.2, 0.05, 1, 1, 420, "Caçador que aterroriza comandantes: +20% no ataque e marcha uma província a mais.",
      ["...eu vejo você...", "(nada)", "...o caçador espera..."]),
    G("broodlord", "tyranids", "Xhar'kun", "Patriarca Genestealer", "tyranids/r2c2.png", 0.2, 0.15, 0, 2, 450, "Pai do culto: começa as batalhas com duas cargas de apoio.",
      ["...meus filhos estão em toda parte...", "A prole aguarda.", "(sorriso de muitas presas)"]),
    G("neurothrope", "tyranids", "Sombra Sináptica", "Neurotropo", "tyranids/r1c3.png", 0.1, 0.3, 0, 2, 400, "Sombra na disformidade: +30% na defesa.",
      ["(pressão psíquica)", "...silêncio...", "A sombra cai."]),
    # Caos
    G("abaddon", "chaos", "Abaddon, o Saqueador", "Mestre de Guerra", "chaos/r2c0.png", 0.35, 0.15, 1, 2, 0, "Senhor da 13ª Cruzada Negra: +35% no ataque, marcha uma província a mais e começa com duas cargas.",
      ["Cadia cairá.", "Dez mil anos esperei por isto.", "Ajoelhem-se ou morram."], start=True),
    G("haarken", "chaos", "Haarken Worldclaimer", "Arauto", "chaos/r1c1.png", 0.3, 0.05, 1, 1, 480, "Arauto de Abaddon: +30% no ataque e marcha uma província a mais.",
      ["O Saqueador chega!", "Eu proclamo o fim deste mundo.", "Sangue e glória!"]),
    G("zaraphiston", "chaos", "Zaraphiston", "Feiticeiro", "chaos/r2c1.png", 0.15, 0.2, 0, 3, 460, "Mestre da disformidade: começa as batalhas com três cargas de apoio.",
      ["A disformidade sussurra.", "Vejo seus medos.", "O véu está fino."]),
    G("jarulek", "chaos", "Jarulek", "Apóstolo Sombrio", "chaos/r2c2.png", 0.2, 0.25, 0, 1, 420, "Pregador da Palavra: os fiéis lutam sem medo (+25% na defesa).",
      ["A Palavra é verdade.", "Ajoelhem-se perante os Deuses.", "Queimem os falsos ídolos."]),
    G("vorkh", "chaos", "Vorkh", "Ferreiro da Disformidade", "chaos/r2c3.png", 0.15, 0.2, 0, 1, 400, "Senhor das máquinas-demônio: +20% na defesa.",
      ["As máquinas têm fome.", "Metal e demônio, unidos.", "Forjamos o apocalipse."]),
    # Eldar
    G("eldrad", "eldar", "Eldrad Ulthran", "Vidente-Mor", "eldar/r2c2.png", 0.15, 0.2, 0, 3, 0, "Vidente lendário: começa as batalhas com três cargas de apoio.",
      ["Eu vi este momento mil vezes.", "O destino é um fio que eu puxo.", "Sigam meus passos e vivam."], start=True),
    G("taldeer", "eldar", "Taldeer", "Vidente", "eldar/r2c3.png", 0.1, 0.3, 0, 2, 420, "Visões de defesa: +30% na defesa.",
      ["O futuro mostra perigo.", "Não nesta noite.", "As runas falam."]),
    G("jain_zar", "eldar", "Jain Zar", "Senhora Fênix", "eldar/r1c0.png", 0.35, 0.05, 1, 0, 520, "Primeira das Banshees: +35% no ataque e marcha uma província a mais.",
      ["Ouçam o grito.", "Silêncio... e morte.", "Eu fui a primeira."]),
    G("karandras", "eldar", "Karandras", "Senhor Fênix", "eldar/r1c1.png", 0.25, 0.15, 0, 1, 480, "Mestre da emboscada: +25% no ataque.",
      ["O escorpião não se apressa.", "Das sombras.", "Ferrão e lâmina."]),
    G("fuegan", "eldar", "Fuegan", "Senhor Fênix", "eldar/r1c2.png", 0.3, 0.1, 0, 1, 480, "Senhor dos Dragões de Fogo: +30% no ataque.",
      ["Eu sou a chama.", "Nada resiste ao fogo.", "Cinzas."]),
    # Necrons
    G("imotekh", "necrons", "Imotekh, o Senhor da Tempestade", "Faraó", "necrons/r1c3.png", 0.3, 0.15, 0, 2, 0, "Faraó da Dinastia Sautekh: +30% no ataque, duas cargas de apoio.",
      ["Ajoelhem-se perante a dinastia.", "Eu domino as tempestades.", "Esta galáxia é minha."], start=True),
    G("trazyn", "necrons", "Trazyn, o Infinito", "Senhor", "necrons/r1c1.png", 0.15, 0.25, 0, 1, 460, "Colecionador eterno: +25% na defesa; se cair, um corpo novo aparece.",
      ["Que peça magnífica para a coleção!", "Eu nunca morro de verdade.", "Ah, um artefato!"]),
    G("orikan", "necrons", "Orikan, o Adivinho", "Criptek", "necrons/r1c2.png", 0.1, 0.2, 0, 3, 440, "Cronomante: começa as batalhas com três cargas de apoio.",
      ["Eu já sei como isto termina.", "As estrelas se alinham.", "O tempo é meu instrumento."]),
    G("anrakyr", "necrons", "Anrakyr, o Viajante", "Senhor", "necrons/r1c0.png", 0.25, 0.2, 1, 0, 480, "Senhor que desperta tumbas: +25% no ataque e marcha uma província a mais.",
      ["Despertem, irmãos.", "A guerra nunca acabou.", "Os vivos tomaram o que é nosso."]),
    # Tau
    G("farsight", "tau", "Farsight", "Comandante", "tau/r1c2.png", 0.3, 0.1, 1, 1, 0, "Senhor dos Enclaves: +30% no ataque e marcha uma província a mais.",
      ["Pelo Bem Maior — à minha maneira.", "Mont'ka: o golpe mortal.", "A lâmina do alvorecer está pronta."], start=True),
    G("shadowsun", "tau", "Sombra do Sol", "Comandante", "tau/r2c0.png", 0.15, 0.25, 0, 2, 460, "Mestre do Kauyon: +25% na defesa e duas cargas de apoio.",
      ["Kauyon: a paciência do caçador.", "Eles virão até nós.", "Em silêncio, vencemos."]),
    G("aunva", "tau", "Aun'Va", "Etéreo Supremo", "tau/r1c1.png", 0.0, 0.35, 0, 3, 420, "Etéreo supremo: os guerreiros não recuam (+35% na defesa) e três cargas de apoio.",
      ["O Bem Maior une todos.", "Lutem pela harmonia.", "Nossa causa é justa."]),
    G("anghkor", "tau", "Anghkor Prok", "Modelador Kroot", "tau/r0c3.png", 0.25, 0.1, 1, 0, 380, "Caçador Kroot: +25% no ataque e marcha uma província a mais.",
      ["A caça nos fortalece.", "Comeremos os fortes.", "Sigam a trilha."]),
]

# Generais existentes com retratos melhores nas pranchas novas.
GENERAL_PORTRAITS = {"wazdakka": "orks_veh/r0c3.png", "nazdreg": "orks_inf/r2c3.png", "zogwort": "orks_inf/r3c3.png"}


def S(id, type, name, kills, requires, icon, desc, **kw):
    d = OrderedDict([("id", id), ("type", type), ("name", name), ("kills", kills), ("requires", requires), ("icon", icon), ("desc", desc)])
    d.update(kw)
    return d


SUPPORT = {
    "tyranids": [
        S("mycetic", "drop_pod", "Esporo Mycetic", 8, "orbit", "tyranids/r0c3.png", "Um esporo cai do navio-colmeia e solta uma ninhada no ponto escolhido."),
        S("harpies", "strategic_bomber", "Revoada de Harpias", 14, "", "tyranids/r0c2.png", "Criaturas aladas mergulham soltando esporos explosivos em linha.", airDiscount=6),
        S("spore_rain", "orbital_saturation", "Chuva de Esporos-Mina", 25, "orbit", "tyranids/r3c3.png", "Os navios-colmeia saturam a área com esporos ácidos. Atinge também o enxame!"),
    ],
    "chaos": [
        S("dreadclaw", "drop_pod", "Assalto de Dreadclaw", 8, "orbit", "chaos/r1c3.png", "Uma cápsula de assalto do Caos cai sobre o ponto escolhido."),
        S("heldrakes", "strategic_bomber", "Garras Celestes", 16, "", "chaos/r0c3.png", "Máquinas-demônio voadoras varrem a linha com fogo infernal.", airDiscount=6),
        S("planet_killer", "orbital_saturation", "Fúria do Planeta Assassino", 30, "orbit", "chaos/r2c0.png", "A nau de Abaddon bombardeia a área. Atinge todos."),
        S("dark_lance", "orbital_laser", "Lança da Barca Negra", 18, "orbit", "chaos/r2c1.png", "As lanças de uma barca negra queimam o alvo."),
    ],
    "eldar": [
        S("webway", "drop_pod", "Portal da Teia", 8, "", "eldar/r2c1.png", "Guerreiros surgem de um portal da Teia no ponto escolhido."),
        S("nightwing", "strategic_bomber", "Ataque de Nightwings", 15, "", "eldar/r3c2.png", "Caças eldar passam em linha disparando.", airDiscount=6),
        S("eldritch_storm", "orbital_laser", "Tempestade Eldritch", 20, "", "eldar/r2c2.png", "O vidente invoca uma tempestade psíquica sobre o alvo. Atinge todos."),
    ],
    "necrons": [
        S("veil", "drop_pod", "Véu da Escuridão", 8, "", "necrons/r3c3.png", "Uma falange de guerreiros surge do portal no ponto escolhido."),
        S("night_scythe", "strategic_bomber", "Foices Noturnas", 15, "", "necrons/r3c2.png", "Naves necrons passam em linha disparando feixes tesla.", airDiscount=6),
        S("storm", "orbital_laser", "Tempestade de Relâmpagos", 20, "", "necrons/r1c3.png", "Imotekh desce relâmpagos sobre o alvo. Atinge todos."),
    ],
    "tau": [
        S("manta", "drop_pod", "Desembarque de Manta", 9, "orbit", "tau/r2c1.png", "Uma nave Manta solta trajes Crisis no ponto escolhido."),
        S("barracuda", "strategic_bomber", "Ataque de Barracudas", 15, "", "tau/r3c0.png", "Caças Barracuda varrem a linha com mísseis.", airDiscount=6),
        S("seeker", "orbital_laser", "Mísseis Buscadores", 16, "", "tau/r1c3.png", "Drones marcadores guiam mísseis buscadores ao alvo."),
        S("kroor", "orbital_saturation", "Salva da Frota Kor'vattra", 28, "orbit", "tau/r3c3.png", "A frota tau satura a área com canhões ferroviários. Atinge todos."),
    ],
}

FACTIONS = OrderedDict([
    ("tyranids", OrderedDict([
        ("name", "Frota-Colmeia Gorgon"), ("short", "Tiranídeos"), ("civ", "tyranids"), ("enabled", True), ("playable", True),
        ("color", [150, 60, 170]), ("emblem", "wh40k/emblems/tyranids.png"), ("emblemSource", "tyranids/r2c3.png"),
        ("currency", "Biomassa"), ("currencyShort", "Bio"), ("startingFunds", 900), ("fleetName", "Frota-Colmeia"),
        ("leaderTitles", ["Organismo Alfa", "Nódulo Sináptico", "Prole"]),
        ("leaderNames", ["Gorgon-I", "Gorgon-VII", "Ômega", "Sigma", "Kappa", "Delta", "Épsilon", "Teta", "Lambda", "Zeta"]),
        ("shipNames", ["Navio-Colmeia Fome Eterna", "Navio-Colmeia Abismo", "Navio-Colmeia Devorador", "Navio-Colmeia Sombra", "Navio-Colmeia Gorgon"]),
        ("attackBonus", 0.05), ("incomeMult", 2.0), ("sackName", "Devorar"), ("sackMult", 1.8), ("aiSack", 0.8), ("sackXp", 1),
        ("sackNote", "O enxame devora tudo: muita biomassa, província devastada."),
        ("dropFx", [190, 90, 220]),
        ("portrait", "tyranids/r2c3.png"), ("winPortrait", "tyranids/r2c1.png"), ("losePortrait", "tyranids/r0c0.png"),
        ("description", "A Mente da Colmeia só conhece a fome. Enxames baratos e numerosos, monstros colossais e esporos que caem dos navios-colmeia. Devoram as províncias que conquistam."),
        ("tips", "Tiranídeos: recrute enxames baratos e monstros nas colmeias; 'Devorar' arranca muita biomassa de uma província recém-tomada. Na biomassa, o enxame anda mais rápido e aguenta mais."),
        ("allies", OrderedDict([("guard", {"name": "Enxame", "desc": "Organismos da Frota-Colmeia.", "icon": "tyranids/r2c3.png"})])),
    ])),
    ("chaos", OrderedDict([
        ("name", "Legião Negra"), ("short", "Caos"), ("civ", "chaos"), ("enabled", True), ("playable", True),
        ("color", [150, 25, 25]), ("emblem", "wh40k/emblems/chaos.png"), ("emblemSource", "chaos/r2c0.png"),
        ("currency", "Almas"), ("currencyShort", "Almas"), ("startingFunds", 900), ("fleetName", "Frota Negra"),
        ("leaderTitles", ["Campeão", "Senhor", "Aspirante", "Profanador"]),
        ("leaderNames", ["Kharn'ek", "Vorlag", "Draxus", "Morghast", "Ezrakh", "Thulsa", "Skarr", "Vhorn", "Malakai", "Zorvash"]),
        ("shipNames", ["Espírito Vingativo", "Lâmina da Traição", "Coroa Negra", "Fúria Profana", "Garra do Saqueador"]),
        ("attackBonus", 0.05), ("incomeMult", 1.8), ("sackName", "Profanar"), ("sackMult", 1.4), ("aiSack", 0.6), ("sackXp", 1),
        ("sackNote", "Profanar: os Deuses recompensam a destruição."),
        ("dropFx", [200, 40, 40]),
        ("portrait", "chaos/r2c0.png"), ("winPortrait", "chaos/r1c1.png"), ("losePortrait", "chaos/r0c0.png"),
        ("description", "A 13ª Cruzada Negra de Abaddon. Marines traidores, cultistas fanáticos, máquinas-demônio e o Planeta Assassino em órbita. Na disformidade, ficam mais fortes."),
        ("tips", "Caos: cultistas baratos seguram a linha, Marines do Caos e Exterminadores quebram muralhas; 'Profanar' rende almas. No solo da disformidade, as suas tropas causam e aguentam mais."),
        ("allies", OrderedDict([("guard", {"name": "Legião Negra", "desc": "Traidores, cultistas e máquinas-demônio.", "icon": "chaos/r2c0.png"})])),
    ])),
    ("necrons", OrderedDict([
        ("name", "Dinastia Sautekh"), ("short", "Necrons"), ("civ", "necrons"), ("enabled", True), ("playable", True),
        ("color", [80, 210, 120]), ("emblem", "wh40k/emblems/necrons.png"), ("emblemSource", "necrons/r1c3.png"),
        ("currency", "Energia"), ("currencyShort", "Energia"), ("startingFunds", 800), ("fleetName", "Frota Tumular"),
        ("leaderTitles", ["Lorde", "Nemesor", "Vargard", "Criptek"]),
        ("leaderNames", ["Zahndrekh", "Amonhotek", "Sethrak", "Khemret", "Anubrekh", "Nefertekh", "Rahmotek", "Szerakh"]),
        ("shipNames", ["Foice da Eternidade", "Tumba Celeste", "Silêncio Eterno", "Arca de Sautekh"]),
        ("regen", 0.006), ("incomeMult", 1.5),
        ("dropFx", [90, 255, 130]),
        ("portrait", "necrons/r1c3.png"), ("winPortrait", "necrons/r1c3.png"), ("losePortrait", "necrons/r0c3.png"),
        ("description", "Os antigos senhores despertam sob os pilones de Cadia. Legiões de metal vivo que se levantam de novo: em batalha, os batalhões se reparam sozinhos."),
        ("tips", "Necrons: os batalhões se reparam durante a batalha (protocolos de reanimação). Nas tumbas, lutam melhor."),
        ("allies", OrderedDict([("guard", {"name": "Legiões", "desc": "Guerreiros, construtos e destruidores.", "icon": "necrons/r1c3.png"})])),
    ])),
    ("tau", OrderedDict([
        ("name", "Império Tau"), ("short", "Tau"), ("civ", "tau"), ("enabled", True), ("playable", True),
        ("color", [235, 120, 30]), ("emblem", "wh40k/emblems/tau.png"), ("emblemSource", "tau/r1c1.png"),
        ("currency", "Créditos"), ("currencyShort", "Cr"), ("startingFunds", 850), ("fleetName", "Frota Kor'vattra"),
        ("leaderTitles", ["Shas'ui", "Shas'vre", "Shas'el"]),
        ("leaderNames", ["Vior'la Kais", "Sa'cea Teng", "Dal'yth Ko", "Bork'an Saal", "Fal'shia Vral", "T'au Mesme", "Elsy'eir Ral"]),
        ("shipNames", ["Lâmina do Alvorecer", "Bem Maior", "Kauyon", "Mont'ka", "Brisa Solar"]),
        ("incomeMult", 1.05),
        ("dropFx", [255, 170, 80]),
        ("portrait", "tau/r1c2.png"), ("winPortrait", "tau/r1c2.png"), ("losePortrait", "tau/r0c0.png"),
        ("description", "Pelo Bem Maior. Fogo de pulso de longo alcance, trajes de batalha saltadores, tanques antigravitacionais e auxiliares Kroot e Vespídeos."),
        ("tips", "Tau: mantenha distância — os Guerreiros de Fogo e Broadsides atiram muito longe, os Kroot seguram a selva. Os skimmers atravessam água e pântanos."),
        ("allies", OrderedDict([("guard", {"name": "Bem Maior", "desc": "Casta do Fogo e auxiliares.", "icon": "tau/r1c1.png"})])),
    ])),
])


def main():
    units = load("units.json")
    for u in units["imperial"]:
        if u["id"] in IMPERIAL_PORTRAITS:
            u["portrait"] = u["icon"] = IMPERIAL_PORTRAITS[u["id"]]
    units["imperial"] = [u for u in units["imperial"] if u["id"] not in {n["id"] for n in IMPERIAL_NEW}]
    pos = max(i for i, u in enumerate(units["imperial"]) if u.get("group") == "guard") + 1
    units["imperial"][pos:pos] = IMPERIAL_NEW
    for u in units["orks"]:
        if u["id"] in ORK_PORTRAITS:
            u["portrait"] = u["icon"] = ORK_PORTRAITS[u["id"]]
    units["orks"] = [u for u in units["orks"] if u["id"] not in {n["id"] for n in ORK_NEW}] + ORK_NEW
    units["tyranids"] = TYRANIDS
    units["chaos"] = CHAOS
    units["eldar"] = ELDAR
    units["necrons"] = NECRONS
    units["tau"] = TAU
    units["Description"] = units["Description"].split(" vsVehicle")[0] + " vsVehicle/vsInfantry/vsAir: multiplicador do dano contra veículos, infantaria ou aeronaves."
    save("units.json", units)

    fac = load("factions.json")
    for k, v in FACTIONS.items():
        fac["factions"][k] = v
    e = fac["factions"]["eldar"]
    e.update(OrderedDict([("name", "Eldar de Ulthwé"), ("enabled", True), ("playable", True), ("color", [80, 110, 190]),
                          ("emblemSource", "eldar/r2c2.png"), ("currency", "Influência"), ("currencyShort", "Inf"),
                          ("incomeMult", 1.6), ("dropFx", [140, 200, 255]),
                          ("portrait", "eldar/r2c2.png"), ("winPortrait", "eldar/r1c0.png"), ("losePortrait", "eldar/r0c0.png"),
                          ("description", "O mundo-nave Ulthwé vigia o Olho do Terror. Poucos guerreiros, mas de elite: Aspectos, construtos espectrais e tanques antigravitacionais, guiados pelas visões de Eldrad."),
                          ("tips", "Eldar: tropas caras e especializadas — Dragões de Fogo contra blindados, Banshees no corpo a corpo, Ceifadores de longe. O Portal da Teia e a Tempestade Eldritch não precisam de frota."),
                          ("allies", OrderedDict([("guard", {"name": "Ulthwé", "desc": "Guardiões, Aspectos e construtos.", "icon": "eldar/r2c2.png"})]))]))
    e.setdefault("leaderNames", ["Aethiel", "Illic", "Naruthel", "Caerys", "Elarique", "Taelis", "Yriel", "Arhul"])
    e["leaderTitles"] = ["Exarca", "Guardião-Líder", "Videira"]
    e["shipNames"] = e.get("shipNames") or ["Lança Estelar", "Sombra de Asuryan", "Canção Silenciosa"]
    o = fac["factions"]["orks"]
    o.update(OrderedDict([("emblemSource", "orks/r0c6.png"), ("sackName", "Saquear"), ("sackMult", 1.5), ("aiSack", 0.6), ("sackXp", 1),
                          ("sackNote", "Orks saqueiam melhor (+50%) e os rapazes ganham experiência."), ("dropFx", [120, 255, 90]),
                          ("portrait", "orks/r0c5.png"), ("winPortrait", "orks/r0c5.png"), ("losePortrait", "orks/r2c0.png"),
                          ("tips", "Orks: muitos rapazes baratos, Nobz e máquinas dos Meks; saquear rende mais e dá experiência.")]))
    i = fac["factions"]["imperial"]
    i.update(OrderedDict([("emblemSource", "imperial/r4c6.png"), ("portrait", "imperial/r0c6.png"),
                          ("winPortrait", "astra_inf/r2c0.png"), ("losePortrait", "astra_inf/r2c3.png"),
                          ("tips", "Aliados do Império: Space Marines (frota na órbita), Irmãs de Batalha (colmeias), Mechanicus (forjas) e agentes da Inquisição — escolha a força em 'Recrutar'.")]))
    # Ultramarines, Blood Angels, Salamandras e as legiões do Caos: tools/data/build_great_game.py.
    fac["Description"] = fac["Description"].split(" Campos das facções:")[0] + (
        " Campos das facções: portrait/winPortrait/losePortrait (retratos das janelas), emblemSource (retrato do emblema, tools/art/gen_planets.py),"
        " sackName/sackMult/aiSack/sackXp/sackNote (saque: nome, multiplicador, chance da IA, experiência), regen (reparo por segundo na batalha 2D),"
        " dropFx (cor do clarão do reforço; sem ele, cápsula), tips (dica do tutorial).")
    save("factions.json", fac)

    gens = load("generals.json")
    ids = {g["id"] for g in GENERALS}
    gens["generals"] = [g for g in gens["generals"] if g["id"] not in ids] + GENERALS
    for g in gens["generals"]:
        if g["id"] in GENERAL_PORTRAITS:
            g["portrait"] = GENERAL_PORTRAITS[g["id"]]
    save("generals.json", gens)

    sup = load("support.json")
    for k, v in SUPPORT.items():
        sup[k] = v
    save("support.json", sup)
    print("unidades:", {k: len(v) for k, v in units.items() if isinstance(v, list)})


if __name__ == "__main__":
    main()
