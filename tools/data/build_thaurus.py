"""Quinta campanha, "A Profanação de Thaurus", e as facções novas:
Grey Knights, Adeptus Mechanicus, Adepta Sororitas, Adeptus Custodes
(aliados entre si) contra os Drukhari, a Death Guard e os Thousand Sons.

Também põe os Grey Knights no Grande Jogo dos Deuses, aliados dos capítulos
Astartes, com uma estação própria (Lâmina de Titã).

Escreve units.json, factions.json, generals.json, support.json,
sector_thaurus.json, sector_great_game.json e scenarios.json.
Rodar depois de build_great_game.py; depois build_mechanics.py e
tools/art/gen_planets.py (mapas e emblemas).

Retratos: tools/source/sheets/{grey_knights,mechanicus,sororitas,custodes,
drukhari}.png, recortadas por tools/art/slice_sheets.py.
"""
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_factions import U, G, S, HOVER, load, save  # noqa: E402
from build_sectors import P, SEA, B, station  # noqa: E402
from build_great_game import F, with_terrain  # noqa: E402

WARPBANE = {"warp": {"dmg": 1.25, "taken": 0.85}}

# ============================================================ Grey Knights
GK = "grey_knights/"
GREY_KNIGHTS = with_terrain([
    U("gk_strike", "Esquadra de Ataque", "infantry", 300, 21, 28, 5, GK + "r0c0.png",
      "Cavaleiros Cinzentos com bolters de tempestade e armas Nêmesis: psíquicos, puros e incorruptíveis.", ["Eu sou o martelo.", "Nenhuma mancha nos toca.", "O Imperador protege os puros."],
      range=0.09, armor=1.4),
    U("gk_purifiers", "Purificadores", "infantry", 360, 25, 32, 5, GK + "r0c1.png",
      "Os mais puros da ordem. A Chama Purificadora queima demônios e hereges ao redor.", ["A chama purifica.", "Queimem a mácula!", "Nenhum demônio resiste."],
      range=0.05, armor=1.4, vsInfantry=1.25),
    U("gk_interceptors", "Interceptadores", "infantry", 340, 24, 28, 5, GK + "r0c2.png",
      "Teleportadores pessoais: saltam pelo campo e caem sobre o inimigo.", ["Teleporte!", "Estamos atrás deles.", "Golpeiem e sumam."],
      range=0.07, speed=0.046, armor=1.35, allTerrain=True),
    U("gk_purgators", "Purgadores", "infantry", 360, 25, 30, 5, GK + "r0c3.png",
      "Armas pesadas psíquicas: canhões psíquicos e incineradores de longo alcance.", ["Fogo pesado sobre a mácula.", "Canhões psíquicos prontos.", "Nada se aproxima."],
      range=0.15, speed=0.017, armor=1.35, vsVehicle=1.2),
    U("gk_terminators", "Exterminadores da Irmandade", "infantry", 540, 36, 44, 5, GK + "r1c0.png",
      "A espinha da ordem: Armadura Tática Dreadnought e alabardas Nêmesis.", ["Teleporte concluído.", "Somos a muralha contra a disformidade.", "Nenhum passo atrás."],
      range=0.06, speed=0.016, armor=1.75, needsHive=True),
    U("gk_paladins", "Paladinos", "infantry", 640, 42, 50, 3, GK + "r1c1.png",
      "Os campeões da ordem, cada um vencedor das Provas dos Paladinos.", ["Eu venci as provas.", "Pela honra da ordem.", "Mostrem-me o demônio maior."],
      range=0.04, speed=0.016, armor=1.85, requires=["hive"]),
    U("gk_librarian", "Bibliotecário da Irmandade", "infantry", 260, 18, 22, 1, GK + "r1c2.png",
      "Mestre psíquico: tempestades da mente que despedaçam esquadras inteiras.", ["Minha mente é uma espada.", "Sinto a mácula.", "Silêncio, demônio."],
      range=0.12, armor=1.6, vsInfantry=1.3),
    U("gk_chaplain", "Capelão da Irmandade", "infantry", 240, 16, 20, 1, GK + "r1c3.png",
      "Guardião do espírito da ordem: ninguém recua perto dele.", ["A fé é nossa armadura.", "Queimem o herege.", "Avante, irmãos!"],
      range=0.04, armor=1.6, vsInfantry=1.15),
    U("gk_dreadknight", "Cavaleiro Nêmesis (Dreadknight)", "vehicle", 560, 38, 50, 1, GK + "r3c0.png",
      "Um Cavaleiro Cinzento dentro de um exoesqueleto gigante com espada e canhões.", ["Um passo, um demônio a menos.", "Espada Nêmesis erguida.", "Eu caminho sobre eles."],
      range=0.06, speed=0.03, armor=1.4, needsHive=True),
    U("gk_dreadnought", "Dreadnought Venerável", "vehicle", 520, 34, 46, 1, GK + "r3c1.png",
      "Um herói antigo da ordem, ainda lutando num sarcófago.", ["Eu vi a Heresia.", "Ainda sirvo.", "A ordem não esquece."],
      range=0.12, speed=0.02, armor=1.45, needsHive=True),
    U("gk_land_raider", "Land Raider", "vehicle", 680, 44, 58, 1, GK + "r3c2.png",
      "Fortaleza blindada com canhões laser: leva Paladinos ao coração do inimigo.", ["Blindagem total.", "Canhões laser carregados.", "Ninguém nos para."],
      range=0.15, armor=1.5, vsVehicle=1.3, requires=["hive", "orbit"]),
    U("gk_stormraven", "Stormraven", "air", 460, 30, 38, 1, GK + "r3c3.png",
      "Canhoneira da ordem: mísseis, canhões e uma esquadra a bordo.", ["Stormraven no ar.", "Descendo sobre o alvo.", "Mísseis prontos."],
      armor=1.2, vsVehicle=1.2, requires=["orbit"]),
], WARPBANE)

# ============================================================ Adeptus Mechanicus
MC = "mechanicus/"
MECHANICUS = [
    U("mc_rangers", "Skitarii Rangers", "infantry", 120, 8, 12, 8, MC + "r0c0.png",
      "Soldados cibernéticos com rifles galvânicos: precisos e incansáveis.", ["Alvo calculado.", "Pela vontade do Omnissiah.", "Disparo dentro dos parâmetros."],
      range=0.13, speed=0.022),
    U("mc_vanguard", "Skitarii Vanguard", "infantry", 130, 9, 14, 8, MC + "r0c1.png",
      "Carabinas de radiação: envenenam o inimigo só de chegar perto.", ["Radiação liberada.", "Corpos falham. Máquinas não.", "Avançar e saturar."],
      range=0.08, vsInfantry=1.2),
    U("mc_infiltrators", "Sicarian Infiltrators", "infantry", 260, 18, 22, 5, MC + "r0c2.png",
      "Assassinos cibernéticos que embaralham os sentidos do inimigo.", ["Neurostática ativa.", "Eles não nos veem.", "Execução silenciosa."],
      range=0.05, speed=0.032, terrain={"ruins": {"taken": 0.7}, "industrial": {"taken": 0.75}}),
    U("mc_ruststalkers", "Sicarian Ruststalkers", "infantry", 260, 18, 24, 5, MC + "r0c3.png",
      "Lâminas transônicas que cortam ceramita e armadura de tanque.", ["Frequência de corte ajustada.", "Lâminas vibrando.", "Partir ao meio."],
      range=0.03, speed=0.034, vsVehicle=1.2),
    U("mc_corpuscarii", "Eletro-Sacerdotes Corpuscarii", "infantry", 200, 14, 20, 5, MC + "r1c0.png",
      "Fanáticos que acumulam a Força-Motriz e a soltam em relâmpagos.", ["A Força-Motriz flui!", "Sintam a fúria do Omnissiah!", "Relâmpago sagrado!"],
      range=0.06, vsInfantry=1.15),
    U("mc_fulgurites", "Eletro-Sacerdotes Fulguritas", "infantry", 210, 15, 22, 5, MC + "r1c1.png",
      "Bebem a energia do inimigo com cajados elétricos no corpo a corpo.", ["Drenar a energia!", "O impuro se apaga.", "Bendita voltagem."],
      range=0.03, speed=0.026, armor=1.2),
    U("mc_pteraxii", "Pteraxii Esterilizadores", "infantry", 260, 18, 22, 5, MC + "r1c2.png",
      "Skitarii com asas mecânicas e lança-chamas de fósforo.", ["Esterilização aérea.", "Purgar por cima.", "Asas ativas."],
      range=0.05, speed=0.045, vsInfantry=1.2, allTerrain=True),
    U("mc_serberys", "Cavaleiros Serberys", "vehicle", 240, 16, 22, 3, MC + "r1c3.png",
      "Batedores montados em cães-autômatos de guerra.", ["Varredura completa.", "Perseguir e caçar.", "Montarias em velocidade máxima."],
      range=0.09, speed=0.055, terrain={"plains": {"speed": 1.15}, "ash": {"speed": 1.15}}),
    U("mc_kataphron", "Kataphron Breachers", "infantry", 360, 24, 32, 3, MC + "r2c3.png",
      "Servos de combate sobre lagartas, com canhões arc pesados.", ["Brecha aberta.", "Peso total.", "Lagartas avançando."],
      range=0.07, speed=0.015, armor=1.6, vsVehicle=1.3),
    U("mc_kastelan", "Robôs Kastelan", "vehicle", 520, 34, 48, 2, MC + "r3c0.png",
      "Autômatos antigos guiados por protocolos de batalha. Escudos de repulsão.", ["PROTOCOLO: AEGIS.", "PROTOCOLO: CONQUISTADOR.", "ALVO IDENTIFICADO."],
      range=0.08, speed=0.016, armor=1.5, needsHive=True),
    U("mc_ironstrider", "Ironstrider Ballistarius", "vehicle", 280, 18, 26, 1, MC + "r3c1.png",
      "Andador ágil com autocanhões gêmeos ou canhão laser.", ["Passos rápidos.", "Mira travada.", "Caçando blindados."],
      range=0.14, speed=0.04, vsVehicle=1.2),
    U("mc_onager", "Onager Dunecrawler", "vehicle", 360, 24, 36, 1, MC + "r3c2.png",
      "Plataforma de quatro patas com canhão de erradicação ou neutron-laser.", ["Escudo de emanação ativo.", "Canhão carregado.", "Pelo Deus-Máquina."],
      range=0.17, speed=0.022, armor=1.25, vsVehicle=1.25, requires=["forge"]),
    U("mc_skorpius", "Skorpius Disintegrator", "vehicle", 420, 28, 40, 1, MC + "r3c3.png",
      "Tanque antigravitacional com canhão desintegrador.", ["Desintegração em curso.", "Flutuando sobre o campo.", "Matéria apagada."],
      range=0.16, speed=0.03, armor=1.25, needsHive=True, terrain=dict(HOVER)),
]

# ============================================================ Adepta Sororitas
SR = "sororitas/"
SORORITAS = [
    U("sr_novitiates", "Noviças", "infantry", 80, 5, 9, 10, SR + "r0c0.png",
      "Jovens irmãs ainda em treinamento, com fé no lugar da experiência.", ["Pelo Imperador!", "Minha fé é meu escudo.", "Eu não temo."],
      range=0.06, speed=0.026, armor=0.9),
    U("sr_militants", "Noviças Militantes", "infantry", 110, 7, 12, 8, SR + "r0c1.png",
      "Noviças com espadas sagradas, guiadas por uma superiora.", ["Espadas ao alto!", "Que o Imperador guie a lâmina.", "Atacar!"],
      range=0.03, speed=0.03, vsInfantry=1.1),
    U("sr_battle_sisters", "Esquadra de Irmãs de Batalha", "infantry", 220, 15, 22, 6, SR + "r0c2.png",
      "Irmãs em armadura de poder com bolters de tempestade: a espinha das Ordens Militantes.", ["Fé e fogo.", "O Imperador protege.", "Purguem o herege!"],
      range=0.1, armor=1.25),
    U("sr_dominions", "Dominions", "infantry", 230, 16, 22, 5, SR + "r0c3.png",
      "Vanguarda das Ordens: lança-chamas e fusões para abrir caminho.", ["Fogo sagrado!", "Queimem os ímpios.", "Na frente da fé."],
      range=0.05, speed=0.028, armor=1.2, vsInfantry=1.25, terrain={"ruins": {"dmg": 1.2}, "jungle": {"dmg": 1.15}}),
    U("sr_veterans", "Irmãs Veteranas", "infantry", 300, 20, 28, 5, SR + "r1c0.png",
      "Irmãs superioras de muitas guerras, com espadas de energia.", ["Já vi pior.", "Firmes, irmãs.", "A fé nunca falha."],
      range=0.07, armor=1.3, needsHive=True),
    U("sr_celestians", "Celestinas Sacresantas", "infantry", 340, 22, 30, 5, SR + "r1c1.png",
      "Guardiãs dos santos e das cônegas, com escudos e maças sagradas.", ["Nenhum mal a alcança.", "Escudos sagrados!", "Morreremos antes."],
      range=0.04, armor=1.55, needsHive=True),
    U("sr_repentia", "Repentia", "infantry", 180, 12, 22, 5, SR + "r1c2.png",
      "Irmãs que buscam o perdão na morte, com espadas-serra gigantes.", ["Perdão pela lâmina!", "Minha culpa morre comigo.", "Que o sangue me lave."],
      range=0.03, speed=0.034, armor=0.85, vsInfantry=1.3, vsVehicle=1.15),
    U("sr_crusaders", "Cruzados do Ministorum", "infantry", 160, 11, 16, 5, SR + "r1c3.png",
      "Guerreiros devotos com escudos e espadas de energia.", ["Pela Eclesiarquia!", "Meu escudo, sua fé.", "Avante!"],
      range=0.03, armor=1.3),
    U("sr_geminae", "Gêmeas Superia", "infantry", 260, 18, 24, 2, SR + "r2c1.png",
      "Guardiãs aladas da Santa, com mochilas de salto.", ["Pela Santa!", "Do céu, a fúria.", "Asas sagradas."],
      range=0.06, speed=0.046, armor=1.3, allTerrain=True),
    U("sr_arco", "Arco-Flagelantes", "infantry", 150, 10, 18, 5, SR + "r3c0.png",
      "Hereges reprogramados em máquinas de matar com chicotes elétricos.", ["(gritos de êxtase)", "...matar...", "(estalos elétricos)"],
      range=0.03, speed=0.038, armor=0.9, vsInfantry=1.3),
    U("sr_penitent", "Motor Penitente", "vehicle", 300, 20, 32, 1, SR + "r3c1.png",
      "Um condenado preso a um andador com serras e lança-chamas.", ["(lamento sem fim)", "Perdão! Perdão!", "(serras rugindo)"],
      range=0.04, speed=0.03, vsInfantry=1.2),
    U("sr_mortifier", "Mortificador", "vehicle", 340, 22, 36, 1, SR + "r3c2.png",
      "Andador penitente com estandarte sagrado e armas pesadas.", ["(orações gritadas)", "A dor me guia.", "Pelo Trono!"],
      range=0.08, speed=0.026, armor=1.1, needsHive=True),
    U("sr_castigator", "Castigator", "vehicle", 480, 32, 44, 1, SR + "r3c3.png",
      "Tanque-relicário com canhão de batalha e altares em cada torre.", ["Canhão abençoado.", "O fogo do céu desce.", "Que o herege queime."],
      range=0.17, armor=1.3, vsVehicle=1.2, needsHive=True),
]

# ============================================================ Adeptus Custodes
CU = "custodes/"
CUSTODES = [
    U("cu_spears", "Guarda Custódia (lanças)", "infantry", 420, 28, 40, 3, CU + "r0c0.png",
      "Os guarda-costas do Imperador. Cada um vale um esquadrão inteiro de Marines.", ["Nós somos os Dez Mil.", "Ninguém passa.", "Pelo Imperador, sempre."],
      range=0.08, armor=1.8),
    U("cu_shields", "Guarda Custódia (escudos)", "infantry", 440, 30, 40, 3, CU + "r0c1.png",
      "Espadas sentinela e escudos de tempestade: muralha dourada.", ["Escudos ao alto.", "Eu sou a muralha.", "O Trono vive."],
      range=0.04, armor=2.0),
    U("cu_wardens", "Guardiões Custódios", "infantry", 520, 34, 46, 3, CU + "r0c2.png",
      "Veteranos das Câmaras Seladas, com lâminas castelãs.", ["Guardamos o que não pode cair.", "Mil anos de vigília.", "Avançar."],
      range=0.06, armor=1.9, needsHive=True),
    U("cu_vexilus", "Vexilus Praetor", "infantry", 300, 20, 26, 1, CU + "r0c3.png",
      "Porta-estandarte custódio: onde a bandeira está, os Dez Mil não cedem.", ["O estandarte não cai.", "Sob a águia!", "Firmes."],
      range=0.05, armor=1.9),
    U("cu_allarus", "Exterminadores Allarus", "infantry", 620, 42, 52, 3, CU + "r1c0.png",
      "A armadura de exterminador dos Custódios: teleporte e alabardas guardiãs.", ["Teleporte.", "Decapitar o comando inimigo.", "Ninguém escapa."],
      range=0.06, speed=0.018, armor=2.1, needsHive=True),
    U("cu_aquilon", "Exterminadores Aquilon", "infantry", 640, 42, 54, 3, CU + "r1c1.png",
      "Exterminadores com armas pesadas de última geração.", ["Fogo pesado.", "Nada passa por nós.", "Abram caminho."],
      range=0.12, speed=0.016, armor=2.1, vsVehicle=1.2, requires=["hive"]),
    U("cu_vertus", "Vertus Praetors", "vehicle", 560, 36, 46, 3, CU + "r1c2.png",
      "Motos antigravitacionais Dawneagle: caçadores rápidos.", ["Velocidade e ouro.", "Caçar.", "Varrer o flanco."],
      range=0.09, speed=0.058, armor=1.6, terrain=dict(HOVER)),
    U("cu_venatari", "Venatari", "infantry", 480, 32, 42, 3, CU + "r1c3.png",
      "Custódios com mochilas de salto e lanças kinetos.", ["Do alto!", "Lança em riste.", "Caímos sobre eles."],
      range=0.06, speed=0.046, armor=1.8, allTerrain=True),
    U("cu_witchseekers", "Caçadoras de Bruxas (Irmãs do Silêncio)", "infantry", 220, 15, 20, 5, CU + "r2c3.png",
      "Irmãs sem alma psíquica, com lança-chamas. Os feiticeiros perdem a força perto delas.", ["(silêncio)", "(gesto de mão: queimem)", "(olhar frio)"],
      range=0.05, speed=0.028, vsInfantry=1.2, terrain=dict(WARPBANE)),
    U("cu_achillus", "Contemptor-Achillus", "vehicle", 560, 36, 48, 1, CU + "r3c0.png",
      "Dreadnought custódio com lança Achillus.", ["A lança perfura.", "Ainda sirvo ao Trono.", "Avante."],
      range=0.07, speed=0.022, armor=1.5, vsVehicle=1.3, needsHive=True),
    U("cu_galatus", "Contemptor-Galatus", "vehicle", 560, 36, 48, 1, CU + "r3c1.png",
      "Dreadnought com escudo e lâmina: defensor imóvel.", ["Escudo erguido.", "Nada passa.", "A muralha anda."],
      range=0.04, speed=0.02, armor=1.7, needsHive=True),
    U("cu_telemon", "Dreadnought Pesado Telemon", "vehicle", 820, 54, 68, 1, CU + "r3c2.png",
      "Um colosso de ouro com punhos de cauterização e armas espirais.", ["O peso do Imperium.", "Esmagar.", "Ninguém resiste."],
      range=0.1, speed=0.016, armor=1.8, requires=["hive", "unique"]),
    U("cu_caladius", "Caladius Grav-Tank", "vehicle", 620, 40, 52, 1, CU + "r3c3.png",
      "Tanque antigravitacional com canhões iliastus de disparo rápido.", ["Canhões girando.", "Flutuar e destruir.", "Caçando blindados."],
      range=0.16, speed=0.032, armor=1.5, vsVehicle=1.35, needsHive=True, terrain=dict(HOVER)),
]

# ============================================================ Drukhari
DK = "drukhari/"
DRUKHARI = [
    U("dk_kabalites", "Guerreiros Kabalitas", "infantry", 100, 7, 11, 8, DK + "r0c0.png",
      "Atiradores das cabalas de Commorragh, com rifles de estilhaços venenosos.", ["Que gritem bonito.", "Seus escravos serão nossos.", "Um tiro, uma agonia."],
      range=0.11, speed=0.03, armor=0.9),
    U("dk_trueborn", "Natos-Verdadeiros", "infantry", 220, 15, 22, 5, DK + "r0c1.png",
      "A elite da cabala, com armas de lança negra e um sibarita no comando.", ["Nascidos para governar.", "Vocês são gado.", "Lanças escuras, mirem."],
      range=0.12, speed=0.03, vsVehicle=1.3),
    U("dk_wyches", "Wyches", "infantry", 140, 10, 16, 8, DK + "r0c2.png",
      "Gladiadoras das arenas, rápidas como o pensamento.", ["Dancem comigo.", "A arena me chama.", "Mais rápido, mais sangue!"],
      range=0.03, speed=0.04, vsInfantry=1.2),
    U("dk_bloodbrides", "Noivas de Sangue", "infantry", 240, 16, 24, 5, DK + "r0c3.png",
      "Veteranas das arenas lideradas por uma Hekatrix.", ["Que comece o espetáculo.", "A plateia quer sangue.", "Dançaremos sobre eles."],
      range=0.03, speed=0.04, vsInfantry=1.3, needsHive=True),
    U("dk_incubi", "Íncubos", "infantry", 340, 22, 32, 5, DK + "r1c0.png",
      "Mercenários-monges com klaives: matadores perfeitos por um preço.", ["O contrato está pago.", "Klaives prontas.", "Silêncio e corte."],
      range=0.03, speed=0.032, armor=1.3, vsInfantry=1.3),
    U("dk_mandrakes", "Mandrágoras", "infantry", 200, 14, 18, 5, DK + "r1c1.png",
      "Criaturas da sombra que surgem de qualquer escuridão.", ["(sussurros)", "...nas sombras...", "(fogo-frio verde)"],
      range=0.05, speed=0.036, terrain={"ruins": {"taken": 0.6, "dmg": 1.2}, "forest": {"taken": 0.6}, "jungle": {"taken": 0.65, "dmg": 1.15}}),
    U("dk_hellions", "Hellions", "infantry", 220, 15, 20, 5, DK + "r1c2.png",
      "Gangues em skyboards com glaives: chegam e somem num piscar.", ["Woo-hoo! Vamos cortar!", "Ninguém nos pega.", "Rápido demais pra vocês!"],
      range=0.04, speed=0.058, allTerrain=True),
    U("dk_scourges", "Flagelos", "infantry", 280, 19, 24, 5, DK + "r1c3.png",
      "Mercenários alados com armas pesadas: caçam blindados do alto.", ["Do céu, a lança.", "Asas e veneno.", "Alvo marcado."],
      range=0.12, speed=0.05, vsVehicle=1.3, allTerrain=True),
    U("dk_wracks", "Wracks", "infantry", 160, 11, 18, 5, DK + "r2c3.png",
      "Servos do Haemonculus, carne remendada e cheia de toxinas.", ["(respiração molhada)", "O mestre quer amostras.", "Dor é arte."],
      range=0.03, armor=1.2, vsInfantry=1.1),
    U("dk_talos", "Talos", "vehicle", 420, 28, 40, 1, DK + "r3c0.png",
      "Motor de dor esculpido pelos Haemonculi: garras, ferrões e canhões.", ["(zumbido de lâminas)", "(gritos presos)", "(o motor sente fome)"],
      range=0.05, speed=0.026, armor=1.3, needsHive=True),
    U("dk_reavers", "Reavers", "vehicle", 220, 15, 20, 3, DK + "r3c1.png",
      "Motos a jato que cortam o inimigo ao passar.", ["Vruuum!", "Cortar e sumir.", "Ninguém é mais rápido."],
      range=0.05, speed=0.066, vsInfantry=1.15, terrain=dict(HOVER)),
    U("dk_raider", "Raider", "vehicle", 260, 18, 26, 1, DK + "r3c2.png",
      "Barca antigravitacional rápida que despeja a tripulação no inimigo.", ["Velas abertas.", "Todos a bordo.", "Caçar escravos!"],
      range=0.1, speed=0.05, armor=0.9, terrain=dict(HOVER)),
    U("dk_ravager", "Ravager", "vehicle", 380, 26, 36, 1, DK + "r3c3.png",
      "Barca de guerra com três lanças escuras: o terror dos blindados.", ["Lanças escuras carregadas.", "Nenhum tanque escapa.", "Fogo de cima."],
      range=0.16, speed=0.042, armor=0.95, vsVehicle=1.35, needsHive=True, terrain=dict(HOVER)),
]

FACTION_UNITS = OrderedDict([
    ("grey_knights", GREY_KNIGHTS), ("mechanicus", MECHANICUS), ("sororitas", SORORITAS),
    ("custodes", CUSTODES), ("drukhari", DRUKHARI),
])

# ============================================================ generais
GENERALS = [
    G("draigo", "grey_knights", "Kaldor Draigo", "Mestre Supremo", GK + "r2c3.png", 0.3, 0.25, 0, 2, 0, "O Mestre Supremo que caminha pela disformidade: +30% no ataque, +25% na defesa, duas cargas de apoio.",
      ["Eu gravei o meu nome no coração de Mortarion.", "Somos o martelo.", "A disformidade não me prende."], start=True),
    G("voldus", "grey_knights", "Aldrik Voldus", "Grão-Mestre", GK + "r2c1.png", 0.2, 0.2, 0, 3, 0, "Grão-Mestre da 3ª Irmandade, o maior psíquico da ordem: três cargas de apoio.",
      ["A mente é a arma mais afiada.", "Abram o portal.", "Pela pureza."], start=True),
    G("crowe", "grey_knights", "Castelão Crowe", "Campeão da Espada", GK + "r2c2.png", 0.35, 0.1, 0, 0, 420, "Guardião da Lâmina Negra de Antwyr: +35% no ataque.",
      ["A espada sussurra. Eu não escuto.", "Nada me corrompe.", "Em guarda."]),
    G("stern", "grey_knights", "Arvann Stern", "Capitão da Irmandade", GK + "r2c0.png", 0.2, 0.25, 1, 1, 400, "Caçador de demônios incansável: +25% na defesa e marcha uma província a mais.",
      ["O nome do demônio é meu escudo.", "Avançar.", "Já matei pior."]),
    G("dominus_vantor", "mechanicus", "Orsk Vantor", "Magos Dominus", MC + "r2c0.png", 0.2, 0.25, 0, 2, 0, "Senhor da Forja de Thaurus: +25% na defesa e duas cargas de apoio.",
      ["O Omnissiah calcula a vitória.", "Carne é fraca.", "Parâmetros de guerra aceitos."], start=True),
    G("manipulus_hexa", "mechanicus", "Hexa-Rho", "Magos Manipulus", MC + "r2c1.png", 0.25, 0.15, 1, 1, 0, "Comandante dos Skitarii: +25% no ataque e marcha uma província a mais.",
      ["Avançar em formação Delta.", "A vontade da forja guia.", "Execução eficiente."], start=True),
    G("datasmith_kelvar", "mechanicus", "Kelvar-9", "Datasmith Cybernetica", MC + "r2c2.png", 0.15, 0.3, 0, 1, 380, "Mestre dos robôs Kastelan: +30% na defesa.",
      ["Protocolos carregados.", "Os autômatos obedecem.", "PROTOCOLO: FORTALEZA."]),
    G("vahl", "sororitas", "Morvenn Vahl", "Abadessa Sanctorum", SR + "r2c2.png", 0.25, 0.3, 0, 1, 0, "A senhora das Ordens Militantes, num exo-traje Paragon: +25% no ataque, +30% na defesa.",
      ["A fé é a nossa armadura.", "Pelo Imperador e pela Santa!", "Nenhum herege fica de pé."], start=True),
    G("celestine", "sororitas", "Santa Celestine", "A Viva Santa", SR + "r2c0.png", 0.35, 0.25, 1, 1, 0, "A Santa que sempre volta: +35% no ataque, +25% na defesa e marcha uma província a mais.",
      ["Eu fui enviada.", "Levantem-se, irmãs!", "A luz do Imperador está conosco."], start=True),
    G("eruita", "sororitas", "Junith Eruita", "Cônega", SR + "r2c3.png", 0.15, 0.25, 0, 2, 400, "Pregadora no Púlpito de Santa Holine: duas cargas de apoio.",
      ["Ouçam a Palavra!", "Queimem o herege!", "O púlpito avança."]),
    G("trajann", "custodes", "Trajann Valoris", "Capitão-Geral", CU + "r2c2.png", 0.35, 0.3, 0, 1, 0, "O comandante dos Dez Mil: +35% no ataque, +30% na defesa.",
      ["Eu respondo ao Imperador.", "Ninguém toca no Trono.", "Avançar, Companheiros."], start=True),
    G("valerian", "custodes", "Valerian", "Capitão-Escudo", CU + "r2c0.png", 0.25, 0.3, 0, 1, 0, "Veterano de cem guerras: +30% na defesa.",
      ["Escudos dourados.", "Eu guardo.", "Firmes."], start=True),
    G("ixion", "custodes", "Ixion Hale", "Campeão da Lâmina", CU + "r2c1.png", 0.4, 0.1, 0, 0, 440, "Duelista que desafia os campeões inimigos: +40% no ataque.",
      ["Mostre-me o seu melhor.", "Um golpe basta.", "Duelo aceito."]),
    G("malidrach", "drukhari", "Vraesque Malidrach", "Arconte", DK + "r2c0.png", 0.3, 0.15, 1, 1, 0, "Senhor da Cabala da Lâmina Dilacerada: +30% no ataque e marcha uma província a mais.",
      ["Escravos. Muitos escravos.", "A dor deles me rejuvenesce.", "Que gritem."], start=True),
    G("lelith", "drukhari", "Lelith Hesperax", "Rainha das Facas", DK + "r2c1.png", 0.4, 0.05, 1, 0, 0, "A maior gladiadora de Commorragh: +40% no ataque e marcha uma província a mais.",
      ["Vamos dançar?", "Lento demais.", "A plateia me adora."], start=True),
    G("rakarth", "drukhari", "Urien Rakarth", "Mestre Haemonculus", DK + "r2c2.png", 0.15, 0.35, 0, 2, 440, "O escultor da carne: +35% na defesa, duas cargas de apoio.",
      ["Que material interessante.", "A dor é arte.", "Nada morre de verdade comigo."]),
]

# ============================================================ poderes de apoio
SUPPORT = {
    "grey_knights": [
        S("gk_teleport", "drop_pod", "Teleporte de Exterminadores", 8, "", GK + "r1c0.png", "Um esquadrão de Exterminadores se teleporta para o ponto escolhido."),
        S("gk_stormravens", "strategic_bomber", "Ataque de Stormravens", 15, "", GK + "r3c3.png", "Canhoneiras da ordem varrem a linha com mísseis.", airDiscount=6),
        S("gk_hammer", "orbital_laser", "Martelo do Imperador", 18, "", GK + "r1c2.png", "Os Bibliotecários unem as mentes num raio psíquico. Atinge todos."),
        S("gk_bombard", "orbital_saturation", "Bombardeio da Nau Negra", 28, "orbit", GK + "r2c3.png", "A nau negra da ordem satura a área. Atinge todos."),
    ],
    "mechanicus": [
        S("mc_drop", "drop_pod", "Cápsula Skitarii", 8, "orbit", MC + "r0c0.png", "Uma cápsula da forja solta Skitarii no ponto escolhido."),
        S("mc_archaeopter", "strategic_bomber", "Archaeopters", 14, "", MC + "r1c2.png", "Aeronaves da forja passam em linha bombardeando.", airDiscount=6),
        S("mc_lance", "orbital_laser", "Lança de Volkite Orbital", 18, "orbit", MC + "r2c0.png", "A Arca Mechanicus queima o alvo com um feixe antigo."),
    ],
    "sororitas": [
        S("sr_drop", "drop_pod", "Descida das Seraphim", 8, "", SR + "r2c1.png", "Irmãs com mochilas de salto descem no ponto escolhido."),
        S("sr_avenger", "strategic_bomber", "Avengers da Eclesiarquia", 15, "", SR + "r3c3.png", "Caças da Frota passam em linha disparando.", airDiscount=6),
        S("sr_miracle", "orbital_laser", "Ira da Santa", 18, "", SR + "r2c0.png", "Um raio de luz desce sobre os hereges. Atinge todos."),
    ],
    "custodes": [
        S("cu_teleport", "drop_pod", "Teleporte Allarus", 9, "", CU + "r1c0.png", "Exterminadores Allarus se teleportam para o ponto escolhido."),
        S("cu_orion", "strategic_bomber", "Canhoneiras Orion", 16, "", CU + "r3c3.png", "Canhoneiras douradas passam em linha.", airDiscount=6),
        S("cu_lance", "orbital_laser", "Lança da Barca Dourada", 18, "orbit", CU + "r2c2.png", "A barca dos Custódios queima o alvo."),
    ],
    "drukhari": [
        S("dk_portal", "drop_pod", "Portal da Teia", 8, "", DK + "r1c1.png", "Um portal da Teia se abre e solta Íncubos e Wyches."),
        S("dk_razorwing", "strategic_bomber", "Razorwings", 14, "", DK + "r3c3.png", "Caças Razorwing passam em linha soltando mísseis.", airDiscount=6),
        S("dk_voidraven", "orbital_saturation", "Bombas de Escuridão (Voidraven)", 24, "", DK + "r3c2.png", "Bombardeiros soltam minas de vazio sobre a área. Atinge todos."),
    ],
}

# ============================================================ facções
FACTIONS = OrderedDict([
    ("grey_knights", F("grey_knights", "Grey Knights", "Cavaleiros Cinzentos", [175, 185, 200], GK + "r2c3.png", "Requisição", "Req", "Nau Negra da Ordem",
                       ["Justicar", "Irmão", "Capitão"], ["Thawn", "Garran", "Leodegar", "Tiberius", "Mordrak", "Varn", "Orth", "Cador"],
                       ["Aegis", "Martelo de Titã", "Lâmina Pura", "Vigília Silenciosa"],
                       GK + "r2c3.png", GK + "r2c1.png", GK + "r0c0.png",
                       "A Câmara Militante secreta da Inquisição contra os demônios. Poucos, caros e psíquicos: nos solos da disformidade, destroem a mácula.",
                       "Grey Knights: tropas caras e de elite — teleportes que não precisam de frota e +25% de dano na disformidade. Aliados dos outros Astartes e do Imperium.",
                       "Cavaleiros Cinzentos", attackBonus=0.1, incomeMult=1.5, funds=1200, dropFx=[180, 210, 255])),
    ("mechanicus", F("mechanicus", "Adeptus Mechanicus", "Mechanicus", [190, 40, 30], MC + "r2c0.png", "Componentes", "Comp.", "Frota da Forja",
                     ["Alfa", "Manipulus", "Magos"], ["Vex-7", "Kardan Thol", "Omicron-Theta", "Sigma-Varn", "Ixal-12", "Corrin Dahl", "Delta-Rho", "Hexis-4"],
                     ["Arca de Thaurus", "Vontade do Omnissiah", "Engrenagem Sagrada", "Mente-Máquina"],
                     MC + "r2c0.png", MC + "r2c1.png", MC + "r0c0.png",
                     "Os sacerdotes do Deus-Máquina e seus Skitarii. Forjas que produzem sem parar, robôs antigos e armas que nenhum outro exército tem.",
                     "Mechanicus: a melhor economia (+30%) e as máquinas se reparam na batalha. Lutam melhor nas zonas industriais. As forjas (estaleiro ou zona industrial) liberam o Onager.",
                     "Mechanicus", attackBonus=0.03, incomeMult=1.3, regen=0.002, dropFx=[230, 80, 50])),
    ("sororitas", F("sororitas", "Adepta Sororitas", "Irmãs de Batalha", [120, 20, 35], SR + "r2c2.png", "Dízimos", "Díz.", "Frota da Eclesiarquia",
                    ["Irmã Superiora", "Irmã Veterana", "Palatina"], ["Agathe", "Bethesda", "Constantia", "Dorothea", "Elsabet", "Honoria", "Ignatia", "Lucinda", "Mercia", "Sabine"],
                    ["Rosa Sangrenta", "Lágrima da Santa", "Martírio", "Chama Sagrada"],
                    SR + "r2c2.png", SR + "r2c0.png", SR + "r0c0.png",
                    "As Ordens Militantes da Eclesiarquia: fé fervorosa, lança-chamas, penitentes e a Viva Santa Celestine.",
                    "Sororitas: ataque forte (+10%) e tropas baratas de fé; os penitentes (Repentia, Arco-Flagelantes, Motores) atacam sem medo. Lutam melhor nas cidades-colmeia.",
                    "Irmãs de Batalha", attackBonus=0.1, incomeMult=1.15, dropFx=[255, 220, 150])),
    ("custodes", F("custodes", "Adeptus Custodes", "Custódios", [220, 175, 60], CU + "r2c2.png", "Requisição", "Req", "Frota Dourada",
                   ["Companheiro", "Guardião", "Capitão-Escudo"], ["Aquilon", "Tybalt", "Marcellus", "Venatar", "Kyrion", "Heraclius", "Orestes", "Ancelin"],
                   ["Barca Dourada", "Lâmina do Trono", "Vigia Eterno", "Juramento de Terra"],
                   CU + "r2c2.png", CU + "r2c1.png", CU + "r0c0.png",
                   "Os Dez Mil, guarda-costas do Imperador, enviados na Cruzada Indomitus. Poucos guerreiros dourados, cada um quase invencível, e as Irmãs do Silêncio.",
                   "Custódios: o exército mais caro e mais forte por batalhão; cada perda dói. As Irmãs do Silêncio queimam feiticeiros (bônus na disformidade).",
                   "Custódios", attackBonus=0.1, incomeMult=1.3, funds=1100, dropFx=[255, 210, 100])),
    ("drukhari", F("drukhari", "Cabala da Lâmina Dilacerada", "Drukhari", [70, 140, 150], DK + "r2c0.png", "Escravos", "Escr.", "Frota de Rapina",
                   ["Sibarita", "Dracon", "Hekatrix"], ["Vhaelis", "Kraelith", "Sythrae", "Morvhaine", "Ixandrel", "Lhaeryn", "Zaelith", "Veyrith"],
                   ["Lâmina do Crepúsculo", "Grito Eterno", "Teia Negra", "Fome de Commorragh"],
                   DK + "r2c0.png", DK + "r2c1.png", DK + "r0c0.png",
                   "Os eldar sombrios de Commorragh vivem da dor alheia. Atacam como um raio pela Teia, levam escravos e somem antes do contra-ataque.",
                   "Drukhari: os mais rápidos da galáxia e o maior saque ('Rapina'); a infantaria é frágil. Atacam onde o inimigo é fraco e saqueiam tudo o que tomam.",
                   "Drukhari", attackBonus=0.1, incomeMult=1.4, sackName="Rapina", sackMult=1.8, aiSack=0.9, sackXp=1,
                   sackNote="Escravos para Commorragh: o maior saque da galáxia.", dropFx=[160, 80, 220])),
])

# Bônus de terreno das facções.
with_terrain(MECHANICUS, {"industrial": {"dmg": 1.12, "taken": 0.9}})
with_terrain(SORORITAS, {"hive": {"dmg": 1.1}})

# ============================================================ setor de Thaurus
DESC = ("Sistema estelar e corpos celestes (mesmo formato do sector.json). Gerado por tools/data/build_thaurus.py; "
        "mapas por tools/art/gen_planets.py.")

SECTOR = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "015.M42", "monthsPerTurn": 1}),
    ("system", {"id": "thaurus", "name": "Sistema Thaurus", "star": {"name": "Olho do Omnissiah", "color": [255, 210, 170]},
                "desc": "Um mundo-forja guarda um arquivo de Padrões de Construção (STC). A Death Guard quer infectar as forjas, os Thousand Sons querem o arquivo e os Drukhari querem escravos."}),
    ("bodies", [
        B("thaurus", "Thaurus Prime", "planet", "Mundo-Forja", 0.20, 210, 1.0, "forge", "imperial", 171,
          "Um planeta coberto de forjas, refinarias e fumaça. O Arquivo STC está escondido sob a Forja-Mãe. Nas bordas, os invasores já tomaram três cidades.", [
              P("forge_mother", "Forja-Mãe Thaurus", "industrial", 0.46, 0.40, "mechanicus", 2, 3, ["mc_rangers", "mc_kataphron"], True),
              P("ferrum", "Colmeia-Forja Ferrum", "hive", 0.30, 0.24, "mechanicus", 2, 2, ["mc_rangers", "mc_vanguard"]),
              P("omega", "Manufactorum Omega", "industrial", 0.62, 0.22, "mechanicus", 1, 1, ["mc_vanguard"]),
              P("sigma", "Refinaria Sigma", "industrial", 0.30, 0.62, "mechanicus", 1, 1, ["mc_rangers"]),
              P("omnissiah", "Catedral do Omnissiah", "hive", 0.64, 0.58, "sororitas", 2, 2, ["sr_battle_sisters", "sr_novitiates"]),
              P("golden_bastion", "Bastião Dourado", "hive", 0.48, 0.74, "custodes", 2, 2, ["cu_spears"]),
              P("rail", "Linha Ferroviária Magna", "plains", 0.46, 0.57, None, 0, 0, ["guard_platoon"]),
              P("slag", "Ermos de Escória", "ash", 0.78, 0.40, "thousand_sons", 0, 0, ["ts_cultists"]),
              P("iron_peaks", "Montes de Ferro", "mountains", 0.18, 0.42, "death_guard", 0, 1, ["dg_poxwalkers"]),
              P("rust_dunes", "Dunas de Ferrugem", "plains", 0.70, 0.84, None, 0, 0, []),
              P("chem_marsh", "Pântanos Químicos", "mire", 0.24, 0.84, "drukhari", 0, 0, ["dk_kabalites"]),
              P("kappa", "Zona Industrial Kappa", "industrial", 0.84, 0.66, None, 1, 1, ["guard_platoon"]),
              P("cold_plateau", "Planalto Gelado", "ice", 0.50, 0.08, None, 0, 0, []),
              P("putrid_foundry", "Fundição Pútrida (profanada)", "mire", 0.08, 0.18, "death_guard", 2, 2, ["dg_poxwalkers", "dg_poxwalkers", "dg_plague_marines"]),
              P("crystal_archive", "Arquivo Cristalino (profanado)", "warp", 0.92, 0.16, "thousand_sons", 2, 2, ["ts_cultists", "ts_cultists", "ts_rubrics"]),
              P("slave_port", "Porto dos Escravos (tomado)", "hive", 0.08, 0.66, "drukhari", 2, 2, ["dk_kabalites", "dk_wyches", "dk_incubi"]),
              SEA("th_sea", 0.92, 0.92),
          ], big=True),
        B("lucrecia", "Santa Lucrécia", "planet", "Lua-Santuário", 0.085, 30, 0.42, "hive", "sororitas", 173,
          "A lua-convento da Ordem da Rosa Sangrenta, cheia de basílicas e ossários.", [
              P("lc_convent", "Convento da Rosa Sangrenta", "hive", 0.45, 0.45, "sororitas", 2, 2, ["sr_battle_sisters", "sr_celestians"], True),
              P("lc_ossuary", "Ossário dos Mártires", "ash", 0.20, 0.32, "sororitas", 0, 0, []),
              P("lc_pilgrims", "Campos dos Peregrinos", "plains", 0.75, 0.32, "sororitas", 0, 0, ["sr_novitiates"]),
              P("lc_reliquary", "Relicário de Santa Lucrécia", "mountains", 0.50, 0.78, "sororitas", 1, 1, []),
          ], parent="thaurus"),
        station("aurum", "Bastião Áureo", "thaurus", 0.13, 250, "custodes", 175,
                "Fortaleza orbital trazida pelos Custódios da Cruzada Indomitus.", "cu_spears"),
        B("titan_blade", "Nau Negra Égide", "station", "Nau Negra", 0.31, 115, 0.42, "station", "grey_knights", 177,
          "A nau negra dos Cavaleiros Cinzentos, chegada para caçar os demônios dos invasores.", [
              P("tb_bridge", "Ponte da Nau", "station", 0.45, 0.45, "grey_knights", 2, 2, ["gk_strike", "gk_strike"], True),
              P("tb_librarium", "Librarium", "station", 0.22, 0.35, "grey_knights", 0, 0, []),
              P("tb_teleport", "Sala de Teleporte", "station", 0.72, 0.38, "grey_knights", 1, 1, ["gk_purgators"]),
              P("tb_vault", "Cofre dos Nomes", "station", 0.55, 0.72, "grey_knights", 0, 0, []),
          ]),
        B("morbus", "Morbus", "planet", "Mundo da Praga", 0.44, 160, 0.72, "nurgle", "death_guard", 179,
          "Um mundo afogado em pântanos e moscas, dado pela Death Guard ao Avô Nurgle.", [
              P("mb_garden", "Jardim das Moscas", "warp", 0.50, 0.45, "death_guard", 2, 2, ["dg_plague_marines", "dg_poxwalkers"], True),
              P("mb_bog", "Lodaçal Fervente", "mire", 0.20, 0.35, "death_guard", 0, 0, ["dg_poxwalkers"]),
              P("mb_foundry", "Fundição Enferrujada", "industrial", 0.78, 0.30, "death_guard", 1, 0, []),
              P("mb_rot", "Florestas Podres", "jungle", 0.30, 0.76, "death_guard", 0, 0, []),
              P("mb_swamp", "Pântano dos Ossos", "mire", 0.74, 0.76, "death_guard", 0, 0, []),
              SEA("mb_sea", 0.5, 0.97),
          ]),
        B("sekhmet", "Sekhmet Vul", "planet", "Mundo dos Feiticeiros", 0.44, 330, 0.68, "tzeentch", "thousand_sons", 181,
          "Um mundo de torres de cristal que mudam de forma a cada noite.", [
              P("sv_tower", "Torre do Olho", "warp", 0.50, 0.45, "thousand_sons", 2, 2, ["ts_rubrics", "ts_cultists"], True),
              P("sv_library", "Biblioteca Ardente", "warp", 0.20, 0.35, "thousand_sons", 1, 0, ["ts_tzaangors"]),
              P("sv_plains", "Planícies de Vidro", "plains", 0.78, 0.30, "thousand_sons", 0, 0, []),
              P("sv_peaks", "Picos Cambiantes", "mountains", 0.30, 0.76, "thousand_sons", 0, 0, []),
              P("sv_ice", "Gelo Azul", "ice", 0.74, 0.76, "thousand_sons", 0, 0, []),
              SEA("sv_sea", 0.5, 0.97),
          ]),
        B("velsharra", "Âncora de Vel'Sharra", "planet", "Porto da Teia", 0.38, 60, 0.55, "dark", "drukhari", 183,
          "Uma rocha escura presa a um portal da Teia, onde as barcas de rapina se reúnem.", [
              P("vs_gate", "Portal da Teia", "hive", 0.50, 0.45, "drukhari", 2, 2, ["dk_kabalites", "dk_incubi"], True),
              P("vs_spires", "Agulhas Negras", "mountains", 0.20, 0.35, "drukhari", 0, 0, ["dk_kabalites"]),
              P("vs_arena", "Arena Sangrenta", "ash", 0.78, 0.30, "drukhari", 1, 0, []),
              P("vs_pens", "Currais de Escravos", "plains", 0.30, 0.76, "drukhari", 0, 0, []),
              P("vs_labs", "Laboratórios dos Haemonculi", "industrial", 0.74, 0.76, "drukhari", 0, 0, []),
          ]),
    ]),
    ("startingArmies", [
        {"faction": "mechanicus", "general": "dominus_vantor", "body": "thaurus", "province": "forge_mother",
         "battalions": ["mc_rangers", "mc_rangers", "mc_vanguard", "mc_kataphron", "mc_onager"]},
        {"faction": "mechanicus", "general": "manipulus_hexa", "body": "thaurus", "province": "ferrum",
         "battalions": ["mc_rangers", "mc_infiltrators", "mc_corpuscarii", "mc_ironstrider"]},
        {"faction": "sororitas", "general": "vahl", "body": "thaurus", "province": "omnissiah",
         "battalions": ["sr_battle_sisters", "sr_novitiates", "sr_dominions", "sr_repentia"]},
        {"faction": "sororitas", "general": "celestine", "body": "lucrecia", "province": "lc_convent",
         "battalions": ["sr_battle_sisters", "sr_geminae", "sr_novitiates"]},
        {"faction": "custodes", "general": "trajann", "body": "thaurus", "province": "golden_bastion",
         "battalions": ["cu_spears", "cu_witchseekers", "cu_vertus"]},
        {"faction": "custodes", "general": "valerian", "body": "aurum", "province": "aurum_yards",
         "battalions": ["cu_spears", "cu_witchseekers"]},
        {"faction": "grey_knights", "general": "draigo", "body": "titan_blade", "province": "tb_bridge",
         "battalions": ["gk_strike", "gk_strike", "gk_purifiers", "gk_interceptors", "gk_dreadknight"]},
        {"faction": "grey_knights", "general": "voldus", "body": "titan_blade", "province": "tb_teleport",
         "battalions": ["gk_strike", "gk_purgators", "gk_librarian"]},
        {"faction": "death_guard", "general": "typhus", "body": "thaurus", "province": "putrid_foundry",
         "battalions": ["dg_poxwalkers", "dg_poxwalkers", "dg_poxwalkers", "dg_plague_marines", "dg_plague_marines", "dg_plague_marines", "dg_blight_launchers", "dg_blightspawn", "dg_plagueburst", "dg_plague_marines"]},
        {"faction": "death_guard", "general": "felthius", "body": "morbus", "province": "mb_garden",
         "battalions": ["dg_poxwalkers", "dg_plague_marines", "dg_blight_hauler"]},
        {"faction": "thousand_sons", "general": "ahriman", "body": "thaurus", "province": "crystal_archive",
         "battalions": ["ts_cultists", "ts_tzaangors", "ts_tzaangors", "ts_rubrics", "ts_rubrics", "ts_rubrics", "ts_horrors", "ts_enlightened", "ts_defiler", "ts_rubrics"]},
        {"faction": "thousand_sons", "general": "amon", "body": "sekhmet", "province": "sv_tower",
         "battalions": ["ts_cultists", "ts_rubrics", "ts_enlightened"]},
        {"faction": "drukhari", "general": "malidrach", "body": "thaurus", "province": "slave_port",
         "battalions": ["dk_kabalites", "dk_kabalites", "dk_kabalites", "dk_wyches", "dk_wyches", "dk_incubi", "dk_trueborn", "dk_reavers", "dk_ravager", "dk_incubi"]},
        {"faction": "drukhari", "general": "lelith", "body": "velsharra", "province": "vs_gate",
         "battalions": ["dk_wyches", "dk_bloodbrides", "dk_hellions", "dk_raider"]},
    ]),
    ("startingFleets", [
        {"faction": "mechanicus", "body": "thaurus", "ships": 2},
        {"faction": "sororitas", "body": "lucrecia", "ships": 2},
        {"faction": "custodes", "body": "aurum", "ships": 2},
        {"faction": "grey_knights", "body": "titan_blade", "ships": 3},
        {"faction": "death_guard", "body": "morbus", "ships": 3},
        {"faction": "thousand_sons", "body": "sekhmet", "ships": 3},
        {"faction": "drukhari", "body": "velsharra", "ships": 4},
    ]),
])

SCENARIO = OrderedDict([
    ("id", "thaurus"), ("name", "A Profanação de Thaurus"), ("sector", "sector_thaurus.json"),
    ("factions", ["mechanicus", "sororitas", "custodes", "grey_knights", "drukhari", "death_guard", "thousand_sons"]),
    ("playable", ["mechanicus", "sororitas", "custodes", "grey_knights", "drukhari", "death_guard", "thousand_sons"]),
    ("teams", {"imperium": ["mechanicus", "sororitas", "custodes", "grey_knights"]}),
    ("neutralName", "Defesa Planetária"),
    ("objective", {"body": "thaurus", "label": "Forjas de Thaurus", "text": "controlar todas as cidades de Thaurus Prime, inclusive as três tomadas pelos invasores (o Imperium vence junto)"}),
    ("portraits", [MC + "r2c0.png", DK + "r2c0.png"]),
    ("intro", "015.M42. O mundo-forja Thaurus Prime guarda um arquivo STC intacto. A Death Guard quer infectar as forjas, os Thousand Sons querem o arquivo para Magnus e os Drukhari querem milhões de escravos. O Mechanicus resiste, e o Imperium responde: Irmãs de Batalha, Custódios e Cavaleiros Cinzentos."),
    ("summary", "Mechanicus, Sororitas, Custódios e Grey Knights aliados contra os Drukhari, a Death Guard e os Thousand Sons."),
])

# ============================================================ Grey Knights no Grande Jogo
GG_BODY = B("aegis_gg", "Nau Negra Égide", "station", "Nau Negra", 0.36, 40, 0.42, "station", "grey_knights", 191,
            "A nau negra dos Cavaleiros Cinzentos, atraída pela aposta dos Deuses.", [
                P("ag_bridge", "Ponte da Nau", "station", 0.45, 0.45, "grey_knights", 2, 2, ["gk_strike", "gk_strike"], True),
                P("ag_librarium", "Librarium", "station", 0.22, 0.35, "grey_knights", 0, 0, []),
                P("ag_teleport", "Sala de Teleporte", "station", 0.72, 0.38, "grey_knights", 1, 1, ["gk_purgators"]),
                P("ag_vault", "Cofre dos Nomes", "station", 0.55, 0.72, "grey_knights", 0, 0, []),
            ])
GG_ARMY = {"faction": "grey_knights", "general": "draigo", "body": "aegis_gg", "province": "ag_bridge",
           "battalions": ["gk_strike", "gk_strike", "gk_purifiers", "gk_interceptors", "gk_dreadknight"]}


def add_grey_knights_to_great_game():
    sector = load("sector_great_game.json")
    sector["bodies"] = [b for b in sector["bodies"] if b["id"] != GG_BODY["id"]] + [GG_BODY]
    sector["startingArmies"] = [a for a in sector["startingArmies"] if a["faction"] != "grey_knights"] + [GG_ARMY]
    sector["startingFleets"] = [f for f in sector["startingFleets"] if f["faction"] != "grey_knights"] + [{"faction": "grey_knights", "body": "aegis_gg", "ships": 2}]
    save("sector_great_game.json", sector)
    return sector


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

    save("sector_thaurus.json", SECTOR)
    add_grey_knights_to_great_game()

    sc = load("scenarios.json")
    for s in sc["scenarios"]:
        if s["id"] == "great_game":
            for key in ("factions", "playable"):
                if "grey_knights" not in s[key]:
                    s[key].append("grey_knights")
            if "grey_knights" not in s["teams"]["astartes"]:
                s["teams"]["astartes"].append("grey_knights")
            s["summary"] = "As quatro legiões dos Deuses do Caos, umas contra as outras, contra os capítulos Astartes e os Cavaleiros Cinzentos aliados."
    sc["scenarios"] = [s for s in sc["scenarios"] if s["id"] != SCENARIO["id"]] + [SCENARIO]
    save("scenarios.json", sc)
    print("unidades:", {k: len(v) for k, v in FACTION_UNITS.items()})


if __name__ == "__main__":
    main()
