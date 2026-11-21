"""Campanha "O Grande Jogo dos Deuses": as quatro legiões dos Deuses do Caos
(World Eaters, Death Guard, Thousand Sons, Emperor's Children) disputam um
mundo-santuário defendido por três capítulos Astartes aliados entre si
(Ultramarines, Blood Angels, Salamanders).

Escreve as facções em units.json, factions.json, generals.json e support.json,
o setor sector_great_game.json e o cenário em scenarios.json.
Rodar depois de build_factions.py e build_sectors.py; depois
tools/art/gen_planets.py para os mapas e emblemas.

Retratos: tools/source/sheets/{khorne,nurgle,tzeentch,slaanesh,ultramarines,
blood_angels,salamanders}.png, recortadas por tools/art/slice_sheets.py.
"""
import json
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_factions import U, G, S, HOVER, load, save  # noqa: E402
from build_sectors import P, SEA, B, station  # noqa: E402

WARP = {"warp": {"dmg": 1.15, "taken": 0.85}}


def with_terrain(units, extra, only=None):
    for u in units:
        if only and u["id"] not in only:
            continue
        t = u.setdefault("terrain", OrderedDict())
        for k, v in extra.items():
            t[k] = dict(t.get(k, {}), **v)
    return units


# ============================================================ World Eaters (Khorne)
K = "khorne/"
WORLD_EATERS = [
    U("we_jakhals", "Jakhals", "infantry", 50, 3, 7, 10, K + "r0c0.png",
      "Escravos e cultistas que correm à frente dos Berzerkers, com cutelos e serras.", ["Sangue! Sangue!", "Crânios para o Trono!", "Corram, matem, morram!"],
      range=0.03, speed=0.032, armor=0.8),
    U("we_berzerkers", "Berzerkers de Khorne", "infantry", 280, 20, 28, 5, K + "r0c1.png",
      "Os Pregos do Açougueiro queimam o que restou da mente: só existe a matança.", ["SANGUE PARA O DEUS DO SANGUE!", "Crânios! Mais crânios!", "Matar... matar... MATAR!"],
      range=0.03, speed=0.034, armor=1.25, vsInfantry=1.2),
    U("we_eightbound", "Oito-Vinculados", "infantry", 380, 26, 34, 3, K + "r0c2.png",
      "Marines que aceitaram demônios de Khorne na carne. Garras-serra e fúria sem fim.", ["(rugido de demônio)", "A fome não acaba.", "Rasgar!"],
      range=0.03, speed=0.038, armor=1.4),
    U("we_exalted", "Oito-Vinculados Exaltados", "infantry", 460, 30, 40, 3, K + "r0c3.png",
      "Os mais antigos possuídos, quase demônios por inteiro.", ["Khorne nos olha.", "(risos borbulhantes)", "Tudo será sangue."],
      range=0.03, speed=0.036, armor=1.5, needsHive=True),
    U("we_terminators", "Exterminadores de Khorne", "infantry", 540, 36, 42, 5, K + "r1c3.png",
      "Armadura Tática Dreadnought coberta de crânios e correntes.", ["Teleporte! Ao massacre!", "Nada nos para.", "O Trono de Crânios espera."],
      range=0.04, speed=0.016, armor=1.7, needsHive=True),
    U("we_bloodletters", "Sanguinários (Bloodletters)", "infantry", 260, 18, 26, 6, K + "r2c0.png",
      "Demônios menores de Khorne, com lâminas infernais.", ["(sibilo de lâmina)", "Sangue...", "Pelo Deus do Sangue!"],
      range=0.03, speed=0.036, vsInfantry=1.2, terrain=dict(WARP)),
    U("we_bloodcrushers", "Esmagadores de Sangue", "vehicle", 420, 28, 40, 3, K + "r2c1.png",
      "Sanguinários montados em Juggernauts de bronze e carne.", ["(trovão de cascos)", "Atropelar!", "Esmagar os fracos!"],
      range=0.03, speed=0.04, armor=1.1, terrain=dict(WARP)),
    U("we_flesh_hounds", "Cães de Carne", "infantry", 200, 14, 18, 5, K + "r2c2.png",
      "Matilha demoníaca que caça psíquicos e covardes.", ["(uivos)", "...o cheiro do medo...", "(rosnado)"],
      range=0.03, speed=0.055, allTerrain=True, terrain=dict(WARP)),
    U("we_skull_cannon", "Canhão de Crânios", "vehicle", 320, 22, 30, 1, K + "r2c3.png",
      "Carro de guerra demoníaco que dispara crânios em chamas.", ["Fogo de crânios!", "Mais munição... das cabeças deles.", "Khorne aprova."],
      range=0.18, speed=0.022, terrain=dict(WARP)),
    U("we_rhino", "Rhino dos Devoradores", "vehicle", 200, 14, 20, 1, K + "r3c0.png",
      "Transporte cheio de espinhos que leva os Berzerkers à matança.", ["Motores rugindo!", "Abram as portas: hora de matar!", "Mais rápido!"]),
    U("we_helbrute", "Helbrute", "vehicle", 380, 26, 36, 1, K + "r3c1.png",
      "Um marine enlouquecido preso num sarcófago de guerra.", ["(gritos de dentro do metal)", "SOLTEM-ME!", "Esmagar... tudo..."],
      range=0.05, armor=1.2, needsHive=True),
    U("we_forgefiend", "Demônio-Forja", "vehicle", 460, 30, 44, 1, K + "r3c2.png",
      "Máquina-demônio com canhões ectoplásmicos e autocanhões.", ["(metal rangendo)", "Fogo... fome...", "Disparar!"],
      range=0.16, speed=0.02, vsVehicle=1.25, needsHive=True),
    U("we_maulerfiend", "Demônio-Triturador", "vehicle", 440, 30, 42, 1, K + "r3c3.png",
      "Máquina-demônio de assalto com garras-cortadoras.", ["(rugido metálico)", "Rasgar a blindagem!", "Caçar!"],
      range=0.03, speed=0.034, vsVehicle=1.4, armor=1.2, needsHive=True),
]

# ============================================================ Death Guard (Nurgle)
N = "nurgle/"
DEATH_GUARD = [
    U("dg_poxwalkers", "Andarilhos da Peste", "infantry", 40, 2, 6, 12, N + "r0c0.png",
      "Vítimas da Praga Andarilha. Lentos e incansáveis.", ["(gemido)", "...vovô... ama...", "(arrastar de pés)"],
      range=0.03, speed=0.015, armor=1.0),
    U("dg_plague_marines", "Marines da Peste", "infantry", 320, 22, 26, 5, N + "r0c1.png",
      "Inchados de doença, quase impossíveis de derrubar.", ["Pelos presentes do Avô!", "Não sentimos dor.", "A podridão é eterna."],
      range=0.06, speed=0.017, armor=1.55),
    U("dg_blight_launchers", "Marines da Peste com Lança-Pragas", "infantry", 340, 24, 26, 5, N + "r0c2.png",
      "Disparam granadas de praga que corroem carne e blindagem.", ["Cartuchos de praga!", "Deixem apodrecer.", "Abençoem-nos com a ferrugem."],
      range=0.12, speed=0.016, armor=1.5, vsInfantry=1.15),
    U("dg_blightlords", "Exterminadores Blightlord", "infantry", 560, 38, 40, 5, N + "r1c0.png",
      "Os primeiros da legião, fundidos à armadura Tática Dreadnought.", ["O Avô nos guarda.", "Avancem devagar. Sempre.", "Nada nos derruba."],
      range=0.06, speed=0.014, armor=1.85, needsHive=True),
    U("dg_deathshroud", "Exterminadores Mortalha", "infantry", 600, 40, 44, 3, N + "r1c1.png",
      "Guarda silenciosa de Mortarion, com foices-de-manifestação.", ["...", "(respiração úmida)", "A colheita chegou."],
      range=0.035, speed=0.015, armor=1.85, vsInfantry=1.2, requires=["hive"]),
    U("dg_tallyman", "Contador", "infantry", 160, 10, 12, 1, N + "r2c0.png",
      "Conta as bênçãos de Nurgle e dá ritmo à marcha da legião.", ["Sete... sete... sete.", "A conta está certa.", "Mais uma bênção registrada."],
      range=0.08, speed=0.016, armor=1.4),
    U("dg_blightspawn", "Prole Fétida", "infantry", 200, 14, 16, 1, N + "r2c1.png",
      "Lança-pragas que borrifa ácido por trincheiras e ruínas.", ["Respirem fundo!", "O hálito do Avô.", "(borbulhar)"],
      range=0.04, speed=0.016, armor=1.4, vsInfantry=1.4),
    U("dg_putrifier", "Biologus Putrificador", "infantry", 200, 14, 16, 1, N + "r2c2.png",
      "Mestre das granadas de doença. Pequenas, mas que presentes!", ["Novas cepas, novos presentes.", "Uma pitada de praga.", "Estudem o resultado."],
      range=0.09, speed=0.016, armor=1.4, vsInfantry=1.25),
    U("dg_blightbringer", "Portador da Peste", "infantry", 180, 12, 14, 1, N + "r2c3.png",
      "O sino de Nurgle derruba o moral dos inimigos.", ["(o sino toca)", "Ouçam o chamado!", "Todos virão ao jardim."],
      range=0.05, speed=0.018, armor=1.5),
    U("dg_rhino", "Rhino da Guarda da Morte", "vehicle", 210, 14, 20, 1, N + "r3c0.png",
      "Transporte enferrujado e coberto de moscas.", ["Motor engasgando... mas vai.", "Todos a bordo.", "Avançar."], armor=1.1),
    U("dg_blight_hauler", "Blight-hauler Mifítico", "vehicle", 360, 24, 32, 1, N + "r3c1.png",
      "Motor-demônio aracnídeo com canhão de fusão e lança-bílis.", ["(zumbido)", "Derreter a blindagem.", "Fome de metal."],
      range=0.11, speed=0.022, vsVehicle=1.3, armor=1.2, needsHive=True),
    U("dg_bloat_drone", "Drone Fétido", "air", 300, 20, 26, 1, N + "r3c2.png",
      "Motor-demônio voador que espalha gás pestilento.", ["(zumbido de moscas)", "Do céu, a peste.", "Respirem!"],
      vsInfantry=1.25),
    U("dg_plagueburst", "Rastejador Plagueburst", "vehicle", 480, 32, 46, 1, N + "r3c3.png",
      "Morteiro de praga sobre lagartas. Artilharia lenta e inabalável.", ["Morteiro pronto.", "Que chovam bênçãos.", "Mais longe... mais podre."],
      range=0.24, speed=0.014, armor=1.4, needsHive=True),
]
with_terrain(DEATH_GUARD, {"mire": {"taken": 0.8, "speed": 1.3}})

# ============================================================ Thousand Sons (Tzeentch)
T = "tzeentch/"
THOUSAND_SONS = [
    U("ts_cultists", "Cultistas de Tzeentch", "infantry", 45, 3, 6, 12, T + "r0c0.png",
      "Adoradores do Mudador de Caminhos, armados com fuzis velhos.", ["Tudo muda!", "O plano é perfeito.", "Pelo Deus de Muitas Faces!"],
      range=0.07, armor=0.8),
    U("ts_tzaangors", "Tzaangors", "infantry", 140, 9, 14, 8, T + "r0c1.png",
      "Homens-fera de Tzeentch, ágeis e cruéis.", ["(balido estridente)", "Pelos feiticeiros!", "Lâminas prontas."],
      range=0.03, speed=0.034),
    U("ts_rubrics", "Marines Rubricae", "infantry", 340, 24, 26, 5, T + "r0c2.png",
      "Pó animado em armaduras seladas. Disparam bolters de fogo-infernal.", ["...", "(eco metálico)", "Obedecemos."],
      range=0.11, speed=0.016, armor=1.55, vsInfantry=1.1),
    U("ts_warpflamers", "Rubricae com Chama Disforme", "infantry", 340, 24, 26, 5, T + "r0c3.png",
      "Chamas que queimam a alma, não só o corpo.", ["...", "(fogo azul)", "Arder."],
      range=0.045, speed=0.016, armor=1.55, vsInfantry=1.35),
    U("ts_scarab_occult", "Exterminadores Escaravelho Oculto", "infantry", 580, 38, 42, 5, T + "r1c1.png",
      "A elite dos Rubricae em armadura Tática Dreadnought.", ["...", "(o feitiço ressoa)", "Guardamos o Rei Carmesim."],
      range=0.11, speed=0.015, armor=1.8, needsHive=True),
    U("ts_shaman", "Xamã Tzaangor", "infantry", 220, 14, 18, 1, T + "r2c0.png",
      "Psíquico homem-fera sobre um disco de Tzeentch.", ["Vejo os fios do destino.", "(cântico)", "Mudem!"],
      range=0.14, speed=0.04, allTerrain=True),
    U("ts_enlightened", "Tzaangors Iluminados", "infantry", 240, 16, 20, 3, T + "r2c1.png",
      "Tzaangors sobre discos, com arcos de destino.", ["O destino guia a flecha.", "Do céu!", "(guinchos)"],
      range=0.12, speed=0.05, allTerrain=True),
    U("ts_horrors", "Horrores Rosados", "infantry", 220, 14, 20, 8, T + "r2c2.png",
      "Demônios que riem e disparam fogo mutante.", ["Hihihihi!", "Muda, muda, muda!", "(gargalhadas)"],
      range=0.1, speed=0.022, terrain=dict(WARP)),
    U("ts_screamers", "Gritadores", "air", 220, 14, 18, 3, T + "r2c3.png",
      "Arraias demoníacas que cortam blindados em voo rasante.", ["(guincho)", "...cortar...", "(zumbido)"],
      vsVehicle=1.3, terrain=dict(WARP)),
    U("ts_rhino", "Rhino dos Mil Filhos", "vehicle", 210, 14, 20, 1, T + "r3c0.png",
      "Transporte azul e ouro coberto de runas de Prospero.", ["Para Prospero!", "Embarquem, irmãos.", "Avançar."]),
    U("ts_helbrute", "Helbrute de Tzeentch", "vehicle", 380, 26, 36, 1, T + "r3c1.png",
      "Sarcófago de guerra de um feiticeiro louco.", ["(sussurros)", "O que eu era...", "MUDEM!"],
      range=0.08, armor=1.2, needsHive=True),
    U("ts_mutalith", "Besta-Vórtice Mutalith", "vehicle", 480, 32, 44, 1, T + "r3c2.png",
      "Monstro de carne mutante com um vórtice de disformidade nas costas.", ["(rugido de muitas bocas)", "...mudar...", "(o vórtice gira)"],
      range=0.1, speed=0.022, armor=1.2, needsHive=True, terrain=dict(WARP)),
    U("ts_defiler", "Profanador de Tzeentch", "vehicle", 480, 32, 46, 1, T + "r3c3.png",
      "Máquina-demônio aracnídea com canhão de batalha.", ["(o demônio ri)", "Profanar.", "O destino ordena."],
      range=0.2, needsHive=True),
]
with_terrain(THOUSAND_SONS, {"warp": {"range": 1.1}})

# ============================================================ Emperor's Children (Slaanesh)
L = "slaanesh/"
EMPERORS_CHILDREN = [
    U("ec_tormentors", "Atormentadores", "infantry", 300, 20, 26, 5, L + "r0c0.png",
      "Duelistas com bolters, sempre em busca do tiro perfeito.", ["Perfeição!", "Mais rápido. Mais belo.", "Sintam!"],
      range=0.08, speed=0.032, armor=1.3),
    U("ec_infractors", "Infratores", "infantry", 300, 20, 26, 5, L + "r0c1.png",
      "Espadachins vaidosos, rápidos como o desejo.", ["Uma dança!", "Dor e prazer são um só.", "Pela perfeição!"],
      range=0.03, speed=0.038, armor=1.25, vsInfantry=1.15),
    U("ec_noise_marines", "Marines do Ruído", "infantry", 330, 22, 26, 5, L + "r0c2.png",
      "Armas sônicas que despedaçam corpos com notas impossíveis.", ["(acorde estridente)", "Ouçam a sinfonia!", "Mais alto!"],
      range=0.12, speed=0.026, armor=1.3, vsInfantry=1.2),
    U("ec_blastmaster", "Marines do Ruído com Blastmaster", "infantry", 360, 24, 28, 5, L + "r0c3.png",
      "Ondas de choque sônico que racham blindados.", ["(nota grave)", "O crescendo final!", "Que tudo vibre!"],
      range=0.16, speed=0.022, armor=1.3, vsVehicle=1.25),
    U("ec_terminators", "Exterminadores de Slaanesh", "infantry", 540, 36, 42, 5, L + "r1c3.png",
      "Veteranos excessivos em armadura Tática Dreadnought.", ["Excesso!", "Ninguém nos toca.", "Gloriosos!"],
      range=0.06, speed=0.017, armor=1.7, needsHive=True),
    U("ec_daemonettes", "Demonetes", "infantry", 220, 14, 20, 6, L + "r2c0.png",
      "Demônios graciosos de garras afiadas.", ["(risos)", "Venha brincar.", "Que doce sofrimento."],
      range=0.03, speed=0.048, vsInfantry=1.2, terrain=dict(WARP)),
    U("ec_seekers", "Buscadoras", "infantry", 260, 18, 22, 5, L + "r2c1.png",
      "Demonetes montadas em corcéis de Slaanesh, as mais rápidas do Caos.", ["(galope)", "Mais rápido!", "Alcançamos todos."],
      range=0.03, speed=0.065, allTerrain=True, terrain=dict(WARP)),
    U("ec_fiends", "Demônios de Slaanesh", "vehicle", 360, 24, 32, 3, L + "r2c2.png",
      "Bestas-escorpião que entorpecem as vítimas.", ["(silvo hipnótico)", "...doce...", "(garras)"],
      range=0.03, speed=0.045, armor=1.1, terrain=dict(WARP)),
    U("ec_keeper", "Guardiã dos Segredos", "vehicle", 900, 60, 70, 1, L + "r2c3.png",
      "Demônio Maior de Slaanesh: beleza que mata. Uma só por cruzada.", ["Ajoelhem-se diante da perfeição.", "Seus desejos são meus.", "Que delícia de guerra."],
      range=0.05, speed=0.03, armor=1.4, requires=["hive", "unique"], terrain=dict(WARP)),
    U("ec_rhino", "Rhino dos Filhos do Imperador", "vehicle", 200, 14, 20, 1, L + "r3c0.png",
      "Transporte púrpura e ouro, decorado em excesso.", ["Mais rápido!", "Que entrada gloriosa.", "Embarquem."]),
    U("ec_predator", "Predator de Slaanesh", "vehicle", 340, 24, 34, 1, L + "r3c1.png",
      "Tanque de apoio com canhões gêmeos.", ["Mira perfeita.", "Fogo!", "Um tiro elegante."],
      range=0.14, vsVehicle=1.2, needsHive=True),
    U("ec_land_raider", "Land Raider de Slaanesh", "vehicle", 600, 40, 52, 1, L + "r3c2.png",
      "Tanque pesado e transporte de assalto. Quase indestrutível.", ["Avançar com estilo.", "Nada nos arranha.", "Abram caminho!"],
      range=0.14, speed=0.018, armor=1.5, needsHive=True, vsVehicle=1.2),
    U("ec_maulerfiend", "Demônio-Triturador de Slaanesh", "vehicle", 440, 30, 42, 1, L + "r3c3.png",
      "Máquina-demônio veloz que dilacera blindados.", ["(rugido)", "Rasgar!", "Que gritos lindos."],
      range=0.03, speed=0.036, vsVehicle=1.4, armor=1.2, needsHive=True),
]

# ============================================================ Ultramarines
M = "ultramarines/"
ULTRAMARINES = [
    U("um_intercessors", "Intercessores", "infantry", 260, 18, 24, 5, M + "r0c0.png",
      "A linha de frente dos Primaris, com fuzis bolt.", ["Por Macragge!", "Coragem e honra!", "Conforme o Codex."],
      range=0.1, armor=1.35),
    U("um_assault_intercessors", "Intercessores de Assalto", "infantry", 260, 18, 24, 5, M + "r0c1.png",
      "Pistolas e espadas-serra para o corpo a corpo.", ["Ao combate!", "Por Guilliman!", "Sem recuar!"],
      range=0.03, speed=0.03, armor=1.35, vsInfantry=1.15),
    U("um_sternguard", "Veteranos Sternguard", "infantry", 380, 26, 30, 5, M + "r0c2.png",
      "Veteranos com munição especial: cada tiro conta.", ["Munição especial carregada.", "Um tiro, um traidor.", "Já vimos coisa pior."],
      range=0.13, armor=1.4, needsHive=True),
    U("um_scouts", "Batedores", "infantry", 140, 9, 12, 5, M + "r0c3.png",
      "Neófitos que se infiltram à frente da linha.", ["Posição tomada.", "Ninguém nos viu.", "Inimigo à vista."],
      range=0.09, speed=0.03, terrain={"forest": {"taken": 0.7}, "jungle": {"taken": 0.7}, "ruins": {"taken": 0.75}}),
    U("um_hellblasters", "Hellblasters", "infantry", 340, 24, 28, 5, M + "r1c0.png",
      "Fuzis de plasma: derretem blindagem e armaduras pesadas.", ["Plasma carregado!", "Purguem o inimigo.", "Cuidado com o superaquecimento."],
      range=0.12, speed=0.02, armor=1.35, vsVehicle=1.3),
    U("um_aggressors", "Agressores", "infantry", 360, 24, 30, 3, M + "r1c1.png",
      "Armadura Gravis com punhos de força e lança-chamas.", ["Avancem sob fogo.", "Esmagar a linha!", "Nada nos para."],
      range=0.05, speed=0.016, armor=1.65, vsInfantry=1.3),
    U("um_inceptors", "Inceptores", "infantry", 340, 24, 26, 3, M + "r1c2.png",
      "Mochilas de salto e bolters pesados: caem como meteoros.", ["Descendo!", "Do céu, a ira do Imperador!", "Impacto!"],
      range=0.08, speed=0.045, armor=1.35, allTerrain=True),
    U("um_snipers", "Batedores Atiradores", "infantry", 180, 12, 14, 5, M + "r1c3.png",
      "Capas camufladas e fuzis de precisão.", ["Alvo na mira.", "Respire... dispare.", "Um oficial a menos."],
      range=0.22, speed=0.018, terrain={"forest": {"taken": 0.7}, "ruins": {"taken": 0.7}, "mountains": {"range": 1.15}}),
    U("um_apothecary", "Apotecário", "infantry", 180, 12, 12, 1, M + "r2c3.png",
      "Salva os feridos e recolhe a semente genética dos caídos.", ["Aguente, irmão.", "A semente genética está segura.", "Ainda não é sua hora."],
      range=0.06, armor=1.45),
    U("um_eradicators", "Erradicadores", "infantry", 380, 26, 30, 3, M + "r3c0.png",
      "Armadura Gravis com fuzis de fusão: caçadores de tanques.", ["Alvo blindado à frente.", "Derreter.", "Nada sobrevive à fusão."],
      range=0.07, speed=0.017, armor=1.6, vsVehicle=1.6),
    U("um_redemptor", "Dreadnought Redemptor", "vehicle", 520, 34, 48, 1, M + "r3c1.png",
      "Herói caído que luta além da morte num sarcófago de guerra.", ["Na morte, ainda sirvo.", "Por Macragge!", "Minha guerra não acabou."],
      range=0.12, armor=1.35, needsHive=True),
    U("um_repulsor", "Repulsor", "vehicle", 560, 38, 50, 1, M + "r3c2.png",
      "Tanque antigravitacional de transporte, coberto de armas.", ["Repulsor em movimento.", "Escudos no máximo.", "Atravessamos tudo."],
      range=0.14, speed=0.024, armor=1.4, needsHive=True, terrain=dict(HOVER)),
    U("um_predator", "Predator", "vehicle", 360, 24, 36, 1, M + "r3c3.png",
      "Tanque de apoio com canhão e lasers laterais.", ["Canhão pronto.", "Caçando blindados.", "Fogo à vontade."],
      range=0.15, vsVehicle=1.2, needsHive=True),
]

# ============================================================ Blood Angels
A = "blood_angels/"
BLOOD_ANGELS = [
    U("ba_intercessors", "Intercessores Anjos Sangrentos", "infantry", 260, 18, 24, 5, A + "r0c0.png",
      "Primaris de Baal, com a Sede Vermelha sob controle.", ["Por Sanguinius!", "O Anjo nos guia.", "Ao ataque!"],
      range=0.1, armor=1.35),
    U("ba_assault", "Veteranos de Assalto", "infantry", 300, 20, 28, 5, A + "r0c1.png",
      "Espadas-serra e furor: a especialidade dos Anjos.", ["Pelo sangue de Sanguinius!", "Ao corpo a corpo!", "Sintam a fúria!"],
      range=0.03, speed=0.034, armor=1.35, vsInfantry=1.2),
    U("ba_scouts", "Batedores de Baal", "infantry", 140, 9, 12, 5, A + "r0c2.png",
      "Neófitos dos desertos radioativos de Baal.", ["Posição.", "Silêncio.", "Vamos."],
      range=0.09, speed=0.03, terrain={"ash": {"taken": 0.75}, "ruins": {"taken": 0.75}}),
    U("ba_bladeguard", "Veteranos Lâmina-Guarda", "infantry", 380, 26, 32, 5, A + "r0c3.png",
      "Escudos de tempestade e espadas de força.", ["Escudos à frente!", "Nenhum passa.", "Pela honra do capítulo."],
      range=0.03, speed=0.022, armor=1.6, needsHive=True),
    U("ba_inceptors", "Inceptores Anjos Sangrentos", "infantry", 340, 24, 26, 3, A + "r1c0.png",
      "Mochilas de salto e plasma: anjos que caem do céu.", ["Asas de Sanguinius!", "Descendo!", "Impacto!"],
      range=0.08, speed=0.048, armor=1.35, allTerrain=True),
    U("ba_death_company", "Companhia da Morte", "infantry", 320, 22, 32, 5, A + "r1c1.png",
      "Irmãos perdidos para a Fúria Negra: lutam até a morte, sem medo.", ["(gritos de Horus! HORUS!)", "Pelo Pai!", "MORRAM, TRAIDORES!"],
      range=0.03, speed=0.038, armor=1.2, vsInfantry=1.3),
    U("ba_sanguinary_guard", "Guarda Sanguinária", "infantry", 480, 32, 38, 5, A + "r1c2.png",
      "Guerreiros de armadura dourada e asas, guarda de Dante.", ["Pela glória de Baal!", "Asas abertas, lâminas prontas.", "O Anjo vive em nós."],
      range=0.03, speed=0.045, armor=1.5, allTerrain=True, requires=["hive"]),
    U("ba_assault_terminators", "Exterminadores de Assalto", "infantry", 560, 38, 44, 5, A + "r1c3.png",
      "Martelos-trovão e escudos de tempestade.", ["Teleporte concluído.", "Martelos ao alto!", "Pela Arca do Sangue!"],
      range=0.03, speed=0.016, armor=1.85, needsHive=True),
    U("ba_baal_predator", "Baal Predator", "vehicle", 360, 24, 34, 1, A + "r3c0.png",
      "Predator veloz com canhão de assalto rotativo.", ["Motores no máximo!", "Canhão rotativo girando.", "Pela velocidade!"],
      range=0.1, speed=0.034, vsInfantry=1.2, needsHive=True),
    U("ba_furioso", "Dreadnought Furioso", "vehicle", 480, 32, 44, 1, A + "r3c1.png",
      "Dreadnought de assalto com punhos de força.", ["A guerra me chama.", "Ainda luto pelo Anjo!", "Esmagar!"],
      range=0.04, speed=0.024, armor=1.35, needsHive=True),
    U("ba_dc_dreadnought", "Dreadnought da Companhia da Morte", "vehicle", 520, 34, 48, 1, A + "r3c2.png",
      "Um irmão da Fúria Negra preso para sempre num sarcófago.", ["(rugido)", "HORUS!", "Sangue... sangue..."],
      range=0.03, speed=0.03, armor=1.3, vsVehicle=1.3, needsHive=True),
    U("ba_stormraven", "Stormraven", "air", 420, 28, 36, 1, A + "r3c3.png",
      "Canhoneira de assalto com mísseis e canhões.", ["Stormraven no ar.", "Soltando os irmãos.", "Fogo de cobertura!"],
      needsHive=True, vsVehicle=1.2),
]

# ============================================================ Salamanders
R = "salamanders/"
SALAMANDERS = [
    U("sal_intercessors", "Intercessores Salamandras", "infantry", 260, 18, 24, 5, R + "r0c0.png",
      "Os filhos de Vulkan: firmes como a rocha de Nocturne.", ["Para o fogo da batalha!", "Vulkan vive!", "Firmes!"],
      range=0.1, armor=1.4),
    U("sal_assault", "Intercessores de Assalto Salamandras", "infantry", 260, 18, 24, 5, R + "r0c1.png",
      "Espadas-serra marcadas a fogo.", ["Ao combate!", "Pelo Pai das Forjas!", "Queimem!"],
      range=0.03, speed=0.03, armor=1.4, vsInfantry=1.15),
    U("sal_scouts", "Batedores de Nocturne", "infantry", 140, 9, 12, 5, R + "r0c2.png",
      "Neófitos acostumados ao calor das montanhas de fogo.", ["Posição.", "O calor não me incomoda.", "Inimigo à vista."],
      range=0.09, speed=0.03, terrain={"ash": {"taken": 0.75}, "mountains": {"taken": 0.8}}),
    U("sal_bladeguard", "Veteranos Lâmina-Guarda Salamandras", "infantry", 380, 26, 32, 5, R + "r0c3.png",
      "Escudos de tempestade forjados em Nocturne.", ["Escudos!", "Ninguém passa por nós.", "Forjados no fogo."],
      range=0.03, speed=0.022, armor=1.65, needsHive=True),
    U("sal_infernus", "Marines Infernus", "infantry", 300, 20, 26, 5, R + "r1c0.png",
      "Lança-chamas pirolíticos: a arma preferida de Vulkan.", ["Que o fogo purifique!", "Queimar!", "Nada resiste à chama."],
      range=0.045, armor=1.4, vsInfantry=1.4, terrain={"ruins": {"dmg": 1.2}, "forest": {"dmg": 1.2}, "jungle": {"dmg": 1.2}}),
    U("sal_eradicators", "Erradicadores Salamandras", "infantry", 380, 26, 30, 3, R + "r1c1.png",
      "Multi-fusões: blindados viram escória.", ["Alvo blindado.", "Derreter!", "Fusão pronta."],
      range=0.07, speed=0.017, armor=1.6, vsVehicle=1.65),
    U("sal_vanguard", "Vanguarda de Salto", "infantry", 320, 22, 26, 5, R + "r1c2.png",
      "Mochilas de salto e lança-chamas de mão: fogo que cai do céu.", ["Descendo em chamas!", "Por Nocturne!", "Impacto!"],
      range=0.04, speed=0.045, armor=1.35, allTerrain=True, vsInfantry=1.25),
    U("sal_terminators", "Exterminadores de Prometeu", "infantry", 560, 38, 42, 5, R + "r1c3.png",
      "Armadura Tática Dreadnought com lança-chamas pesados.", ["Teleporte concluído.", "Fogo pesado!", "O credo de Prometeu nos guia."],
      range=0.05, speed=0.016, armor=1.85, vsInfantry=1.3, needsHive=True),
    U("sal_techmarine", "Tecnomarine", "infantry", 220, 14, 16, 1, R + "r2c2.png",
      "Servo do Deus-Máquina e da forja: braços servo e fogo.", ["O espírito da máquina está calmo.", "Reparos em andamento.", "Forjado e abençoado."],
      range=0.08, armor=1.5, vsVehicle=1.2),
    U("sal_apothecary", "Apotecário Salamandra", "infantry", 180, 12, 12, 1, R + "r2c3.png",
      "Cura os irmãos e protege os civis — o orgulho dos Salamandras.", ["Aguente, irmão.", "Ninguém fica para trás.", "Os inocentes primeiro."],
      range=0.06, armor=1.45),
    U("sal_invictor", "Traje de Guerra Invictor", "vehicle", 360, 24, 34, 1, R + "r3c0.png",
      "Traje de batalha leve, rápido para um dreadnought.", ["Invictor pronto.", "Avançando.", "Fogo pesado na linha!"],
      range=0.1, speed=0.03, armor=1.2),
    U("sal_redemptor", "Dreadnought Redemptor Salamandra", "vehicle", 520, 34, 48, 1, R + "r3c1.png",
      "Herói de Nocturne num sarcófago de ceramite.", ["Ainda sirvo a Vulkan.", "Meu fogo não se apaga.", "Avançar!"],
      range=0.12, armor=1.4, needsHive=True),
    U("sal_redeemer", "Land Raider Redeemer", "vehicle", 600, 40, 52, 1, R + "r3c2.png",
      "Tanque pesado com lança-chamas-furacão: limpa trincheiras.", ["Os lança-chamas estão quentes.", "Abram as rampas!", "Purificação pelo fogo."],
      range=0.06, speed=0.018, armor=1.55, vsInfantry=1.35, needsHive=True),
    U("sal_gladiator", "Gladiator Lancer", "vehicle", 480, 32, 42, 1, R + "r3c3.png",
      "Tanque antigravitacional com canhão laser pesado.", ["Lancer pronto.", "Alvo blindado travado.", "Fogo!"],
      range=0.16, speed=0.026, vsVehicle=1.35, needsHive=True, terrain=dict(HOVER)),
]
with_terrain(SALAMANDERS, {"ash": {"taken": 0.85}})

FACTION_UNITS = OrderedDict([
    ("world_eaters", WORLD_EATERS), ("death_guard", DEATH_GUARD), ("thousand_sons", THOUSAND_SONS),
    ("emperors_children", EMPERORS_CHILDREN), ("ultramarines", ULTRAMARINES), ("blood_angels", BLOOD_ANGELS),
    ("salamanders", SALAMANDERS),
])

# ============================================================ generais
GENERALS = [
    # World Eaters
    G("kharn", "world_eaters", "Khârn, o Traidor", "Campeão de Khorne", K + "r1c0.png", 0.4, 0.0, 0, 0, 0, "O campeão mais sanguinário de Khorne: +40% no ataque, nenhum interesse em defesa.",
      ["SANGUE PARA O DEUS DO SANGUE! CRÂNIOS PARA O TRONO DE CRÂNIOS!", "Mate! Mutile! Queime!", "Não importa de quem é o sangue."], start=True),
    G("invocatus", "world_eaters", "Invocatus", "Lorde dos Devoradores", K + "r1c2.png", 0.3, 0.1, 1, 0, 0, "Montado num Juggernaut: +30% no ataque e marcha uma província a mais.",
      ["Angron quer crânios. Vamos buscá-los.", "Avante, Devoradores!", "A estratégia é matar mais rápido."], start=True),
    G("executioner", "world_eaters", "Vorrak", "Mestre das Execuções", K + "r1c1.png", 0.3, 0.05, 0, 1, 380, "Colhe os crânios dos comandantes inimigos: +30% no ataque.",
      ["Seu crânio é meu.", "A corrente pesa. Tem espaço para mais.", "Ajoelhe-se."]),
    # Death Guard
    G("typhus", "death_guard", "Typhus", "Arauto de Nurgle", N + "r1c2.png", 0.2, 0.3, 0, 1, 0, "Hospedeiro do Enxame Destruidor: +20% no ataque, +30% na defesa.",
      ["Abracem a podridão.", "O Avô é generoso.", "Não há fim, só mudança de estação."], start=True),
    G("felthius", "death_guard", "Felthius", "Lorde da Virulência", N + "r0c3.png", 0.15, 0.35, 0, 1, 0, "Guerreiro da praga incansável: +35% na defesa.",
      ["Avancem. Devagar. Sempre.", "Somos a doença do universo.", "Nada morre de verdade."], start=True),
    G("plaguecaster", "death_guard", "Crullis Brax", "Feiticeiro Pestilento", N + "r1c3.png", 0.1, 0.25, 0, 2, 420, "Psíquico da praga: começa as batalhas com duas cargas de apoio.",
      ["Uma névoa amarela... que linda.", "O jardim cresce.", "Sintam os presentes."]),
    # Thousand Sons
    G("ahriman", "thousand_sons", "Ahzek Ahriman", "Feiticeiro Exaltado", T + "r1c2.png", 0.25, 0.2, 0, 2, 0, "O maior feiticeiro da legião: duas cargas de apoio e +25% no ataque.",
      ["O conhecimento é poder. Escondam-no bem.", "Tudo segue o meu plano.", "O Rubricae obedece."], start=True),
    G("amon", "thousand_sons", "Amon", "Feiticeiro Aspirante", T + "r1c0.png", 0.15, 0.25, 0, 1, 0, "Leal a Magnus: +25% na defesa.",
      ["Pelo Rei Carmesim.", "A Rubrica nos protege.", "Prospero lembra."], start=True),
    G("ankhu", "thousand_sons", "Ankhu Anen", "Mestre Infernal", T + "r1c3.png", 0.3, 0.1, 0, 1, 420, "Invocador de demônios: +30% no ataque.",
      ["Venham, filhos da disformidade.", "Os nomes verdadeiros obedecem.", "Mudança!"]),
    # Emperor's Children
    G("lucius", "emperors_children", "Lucius, o Eterno", "Espadachim", L + "r1c0.png", 0.35, 0.05, 0, 0, 0, "O espadachim que nunca morre: +35% no ataque.",
      ["Finalmente, um adversário digno?", "Que decepção.", "Perfeição em cada golpe."], start=True),
    G("xantine", "emperors_children", "Xantine", "Lorde Exultante", L + "r1c1.png", 0.25, 0.15, 1, 1, 0, "Senhor dos Salvadores: +25% no ataque e marcha uma província a mais.",
      ["Eu os salvo... da mediocridade.", "Que espetáculo!", "O mundo será nosso palco."], start=True),
    G("kakophonist", "emperors_children", "Vhorasse", "Lorde Kakofonista", L + "r1c2.png", 0.2, 0.15, 0, 2, 420, "Maestro da guerra sônica: duas cargas de apoio.",
      ["Ouçam a sinfonia!", "Mais alto!", "(acorde ensurdecedor)"]),
    # Ultramarines
    G("calgar", "ultramarines", "Marneus Calgar", "Mestre de Capítulo", M + "r2c0.png", 0.25, 0.25, 0, 1, 0, "Senhor de Macragge: +25% no ataque e na defesa.",
      ["Coragem e honra!", "Conforme o Codex.", "Ultramar resistirá."], start=True),
    G("tigurius", "ultramarines", "Varro Tigurius", "Bibliotecário-Chefe", M + "r2c2.png", 0.15, 0.2, 0, 2, 0, "Vidente do capítulo: duas cargas de apoio.",
      ["Eu vi este dia.", "A disformidade se curva.", "O futuro está turvo, mas não perdido."], start=True),
    G("sicarius", "ultramarines", "Cato Sicarius", "Capitão da 2ª Companhia", M + "r2c1.png", 0.3, 0.1, 1, 0, 400, "Audacioso: +30% no ataque e marcha uma província a mais.",
      ["Pela glória da 2ª!", "Avançar! Agora!", "Nenhum traidor sobrevive."]),
    G("ventris", "ultramarines", "Uriel Ventris", "Capitão da 4ª Companhia", M + "r0c2.png", 0.2, 0.2, 0, 1, 380, "Veterano do Olho do Terror: +20% no ataque e na defesa.",
      ["Já atravessei o Olho. Isso não me assusta.", "Pela 4ª!", "Avante."]),
    # Blood Angels
    G("dante", "blood_angels", "Dante", "Comandante", A + "r2c0.png", 0.3, 0.2, 0, 1, 0, "O mais antigo Mestre de Capítulo: +30% no ataque, +20% na defesa.",
      ["Pelo Anjo!", "Já vi mil guerras. Esta será vencida.", "Baal resiste."], start=True),
    G("mephiston", "blood_angels", "Mephiston", "Senhor da Morte", A + "r2c3.png", 0.3, 0.15, 0, 2, 0, "Bibliotecário que venceu a Fúria Negra: duas cargas de apoio.",
      ["Eu venci a escuridão. Vocês não vencerão.", "Morra.", "A disformidade é minha."], start=True),
    G("lemartes", "blood_angels", "Lemartes", "Guardião dos Perdidos", A + "r2c2.png", 0.4, 0.0, 0, 0, 380, "Capelão da Companhia da Morte: +40% no ataque.",
      ["Pela memória de Sanguinius!", "Irmãos perdidos, comigo!", "Morte aos traidores!"]),
    G("corbulo", "blood_angels", "Irmão Corbulo", "Sacerdote Sanguinário", A + "r2c1.png", 0.1, 0.3, 0, 1, 360, "Guardião do Cálice Vermelho: +30% na defesa.",
      ["Bebam e lembrem do Anjo.", "Nenhum irmão cai sem bênção.", "A sede está controlada."]),
    # Salamanders
    G("tushan", "salamanders", "Tu'Shan", "Senhor do Capítulo", R + "r2c0.png", 0.25, 0.25, 0, 1, 0, "Regente de Prometeu: +25% no ataque e na defesa.",
      ["Para o fogo da batalha!", "Na bigorna da guerra somos forjados.", "Protejam os inocentes."], start=True),
    G("hestan", "salamanders", "Vulkan He'stan", "Pai das Forjas", R + "r0c3.png", 0.25, 0.2, 1, 0, 0, "Busca os artefatos de Vulkan: +25% no ataque e marcha uma província a mais.",
      ["Vulkan vive!", "A busca continua.", "O fogo nos guia."], start=True),
    G("elysius", "salamanders", "Elysius", "Capelão", R + "r2c1.png", 0.3, 0.15, 0, 1, 380, "Capelão de fé ardente: +30% no ataque.",
      ["A fé é nossa armadura.", "Queimem os hereges!", "O Imperador protege."]),
    G("ashmantle", "salamanders", "Bray'arth Ashmantle", "Dreadnought Ancião", R + "r3c1.png", 0.2, 0.35, 0, 0, 420, "Ancião em sarcófago de guerra: +35% na defesa.",
      ["Lutei na fundação deste capítulo.", "Ainda queimo.", "Avançar, filhos de Vulkan."]),
]

# ============================================================ poderes de apoio
SUPPORT = {
    "world_eaters": [
        S("we_dreadclaw", "drop_pod", "Assalto de Dreadclaw", 8, "orbit", K + "r0c1.png", "Uma cápsula de assalto despeja Berzerkers no ponto escolhido."),
        S("we_heldrakes", "strategic_bomber", "Garras Celestes de Khorne", 15, "", K + "r3c2.png", "Máquinas-demônio voadoras varrem a linha com fogo.", airDiscount=6),
        S("we_angron", "orbital_laser", "Fúria de Angron", 20, "orbit", K + "r1c2.png", "As lanças da frota dos Devoradores queimam o alvo."),
    ],
    "death_guard": [
        S("dg_pod", "drop_pod", "Cápsula da Praga", 8, "orbit", N + "r0c1.png", "Uma cápsula cheia de moscas cai e solta Marines da Peste."),
        S("dg_drones", "strategic_bomber", "Enxame de Drones Fétidos", 14, "", N + "r3c2.png", "Drones da praga passam em linha soltando gás.", airDiscount=6),
        S("dg_terminus", "orbital_saturation", "Chuva Pestilenta", 26, "orbit", N + "r3c3.png", "A frota de Mortarion satura a área com bombas de praga. Atinge todos."),
    ],
    "thousand_sons": [
        S("ts_portal", "drop_pod", "Portal de Tzeentch", 8, "", T + "r2c2.png", "Horrores surgem de um portal da disformidade no ponto escolhido."),
        S("ts_screamers", "strategic_bomber", "Revoada de Gritadores", 15, "", T + "r2c3.png", "Gritadores mergulham em linha cortando tudo.", airDiscount=6),
        S("ts_firestorm", "orbital_laser", "Tempestade de Fogo Disforme", 20, "", T + "r1c2.png", "Ahriman invoca chamas de Tzeentch sobre o alvo. Atinge todos."),
    ],
    "emperors_children": [
        S("ec_dreadclaw", "drop_pod", "Assalto de Dreadclaw", 8, "orbit", L + "r0c1.png", "Uma cápsula de assalto cai no ponto escolhido."),
        S("ec_heldrakes", "strategic_bomber", "Garras Celestes de Slaanesh", 15, "", L + "r3c3.png", "Máquinas-demônio voadoras passam em linha.", airDiscount=6),
        S("ec_scream", "orbital_laser", "Grito Sônico", 18, "", L + "r1c2.png", "O Kakofonista solta uma nota que estilhaça o alvo. Atinge todos."),
    ],
    "ultramarines": [
        S("um_pod", "drop_pod", "Cápsula de Desembarque", 8, "orbit", M + "r0c0.png", "Uma cápsula cai da barca de batalha com Intercessores."),
        S("um_stormtalon", "strategic_bomber", "Ataque de Stormhawks", 15, "", M + "r3c2.png", "Interceptadores Astartes passam em linha disparando.", airDiscount=6),
        S("um_lance", "orbital_laser", "Lança da Barca de Batalha", 18, "orbit", M + "r2c0.png", "Calgar ordena um disparo de lança orbital."),
        S("um_bombard", "orbital_saturation", "Bombardeio Orbital", 28, "orbit", M + "r3c3.png", "A frota do capítulo satura a área. Atinge todos."),
    ],
    "blood_angels": [
        S("ba_pod", "drop_pod", "Cápsula de Desembarque", 8, "orbit", A + "r0c1.png", "Uma cápsula cai com Veteranos de Assalto."),
        S("ba_stormraven", "strategic_bomber", "Revoada de Stormravens", 15, "", A + "r3c3.png", "Canhoneiras varrem a linha com mísseis.", airDiscount=6),
        S("ba_lance", "orbital_laser", "Lança de Baal", 18, "orbit", A + "r2c0.png", "A barca de batalha de Dante queima o alvo."),
    ],
    "salamanders": [
        S("sal_pod", "drop_pod", "Cápsula de Desembarque", 8, "orbit", R + "r0c0.png", "Uma cápsula cai com Intercessores Salamandras."),
        S("sal_fireraptor", "strategic_bomber", "Ataque de Fire Raptors", 15, "", R + "r3c3.png", "Canhoneiras passam em linha disparando.", airDiscount=6),
        S("sal_promethium", "orbital_saturation", "Fogo de Prometeu", 26, "orbit", R + "r1c3.png", "A frota de Nocturne satura a área com bombas incendiárias. Atinge todos."),
    ],
}


def F(id, name, short, color, emblem_src, currency, cur_short, fleet, titles, names, ships, portrait, win, lose, desc, tips, group, **kw):
    d = OrderedDict([("name", name), ("short", short), ("civ", id), ("enabled", True), ("playable", True), ("color", color),
                     ("emblem", "wh40k/emblems/" + id + ".png"), ("emblemSource", emblem_src), ("currency", currency),
                     ("currencyShort", cur_short), ("startingFunds", kw.pop("funds", 900)), ("fleetName", fleet),
                     ("leaderTitles", titles), ("leaderNames", names), ("shipNames", ships)])
    d.update(kw)
    d.update([("portrait", portrait), ("winPortrait", win), ("losePortrait", lose), ("description", desc), ("tips", tips),
              ("allies", OrderedDict([("guard", {"name": group, "desc": desc.split(".")[0] + ".", "icon": portrait})]))])
    return d


FACTIONS = OrderedDict([
    ("world_eaters", F("world_eaters", "World Eaters", "Devoradores", [225, 100, 30], K + "r1c2.png", "Crânios", "Crânios", "Frota dos Devoradores",
                       ["Campeão", "Senhor", "Carniceiro"], ["Skarr", "Gorrax", "Vhorkul", "Drakkan", "Ulrakh", "Brakka", "Kordash", "Zhorn"],
                       ["Conquistador", "Trono de Sangue", "Fúria Rubra", "Uivo de Angron"],
                       K + "r1c2.png", K + "r1c0.png", K + "r0c0.png",
                       "A legião de Angron só conhece a matança. Berzerkers com os Pregos do Açougueiro, Oito-Vinculados possuídos, demônios de Khorne e máquinas-demônio.",
                       "World Eaters: avance sempre — os Berzerkers e os Oito-Vinculados vencem no corpo a corpo; 'Colher Crânios' rende muito e dá experiência. Khorne despreza a defesa.",
                       "Devoradores", attackBonus=0.15, incomeMult=1.7, sackName="Colher Crânios", sackMult=1.5, aiSack=0.8, sackXp=1,
                       sackNote="Crânios para o Trono: saque generoso e experiência.", dropFx=[230, 60, 30])),
    ("death_guard", F("death_guard", "Death Guard", "Guarda da Morte", [150, 165, 60], N + "r1c2.png", "Bênçãos", "Bênçãos", "Frota da Praga",
                      ["Campeão da Peste", "Lorde", "Arauto"], ["Gulgus", "Morbax", "Fester", "Rotigus", "Slorvex", "Putrax", "Grulk", "Vomitrax"],
                      ["Terminus Est", "Jardim Flutuante", "Cálice Podre", "Mosca de Ferro"],
                      N + "r1c2.png", N + "r1c0.png", N + "r0c0.png",
                      "A legião de Mortarion avança devagar e nunca para. Marines da Peste quase indestrutíveis, especialistas da praga e motores-demônio. Os batalhões se recuperam durante a batalha.",
                      "Death Guard: lentos e duríssimos; os batalhões se regeneram na batalha e lutam melhor nos pântanos. 'Semear a Praga' rende bênçãos e devasta a província.",
                      "Guarda da Morte", attackBonus=0.0, incomeMult=1.7, regen=0.003, sackName="Semear a Praga", sackMult=1.3, aiSack=0.7, sackXp=0,
                      sackNote="A praga se espalha: bênçãos agora, província devastada.", dropFx=[170, 200, 60])),
    ("thousand_sons", F("thousand_sons", "Thousand Sons", "Mil Filhos", [50, 170, 200], T + "r1c2.png", "Segredos", "Segr.", "Frota de Prospero",
                        ["Feiticeiro", "Aspirante", "Mestre"], ["Hathor", "Sekhmet", "Imhotekh", "Apophis", "Khayon", "Neferu", "Tolbek", "Ramessu"],
                        ["Pirâmide Errante", "Olho de Magnus", "Lâmina de Prospero", "Biblioteca Ardente"],
                        T + "r1c2.png", T + "r1c3.png", T + "r0c0.png",
                        "Os feiticeiros de Magnus e seus Rubricae — marines reduzidos a pó em armaduras seladas. Fogo psíquico, homens-fera Tzaangor e demônios de Tzeentch.",
                        "Thousand Sons: os Rubricae são lentos mas duros e atiram longe; os feiticeiros dão cargas de apoio. No solo da disformidade, atiram ainda mais longe.",
                        "Mil Filhos", attackBonus=0.05, incomeMult=1.7, sackName="Pilhar Conhecimento", sackMult=1.3, aiSack=0.6, sackXp=1,
                        sackNote="Bibliotecas e arquivos saqueados: segredos e experiência.", dropFx=[90, 150, 255])),
    ("emperors_children", F("emperors_children", "Emperor's Children", "Filhos do Imperador", [210, 90, 210], L + "r1c1.png", "Excessos", "Exc.", "Frota do Excesso",
                            ["Campeão", "Lorde", "Duelista"], ["Vhalen", "Sorrow", "Ilythea", "Castellan", "Exaltus", "Narcisse", "Velith", "Aurex"],
                            ["Canção Perfeita", "Êxtase Eterno", "Orgulho de Chemos", "Grito Sublime"],
                            L + "r1c1.png", L + "r1c0.png", L + "r0c1.png",
                            "A legião de Fulgrim busca a perfeição em cada excesso. Duelistas rápidos, Marines do Ruído com armas sônicas e demônios de Slaanesh.",
                            "Emperor's Children: os mais rápidos do Caos — Demonetes e Buscadoras chegam primeiro, Marines do Ruído atiram de longe. 'Banquete de Excessos' rende muito.",
                            "Filhos do Imperador", attackBonus=0.08, incomeMult=1.75, sackName="Banquete de Excessos", sackMult=1.6, aiSack=0.8, sackXp=1,
                            sackNote="Excesso em tudo: o maior saque do Caos.", dropFx=[230, 110, 230])),
    ("ultramarines", F("ultramarines", "Ultramarines", "Ultramar", [40, 70, 200], M + "r2c0.png", "Requisição", "Req", "Frota do Capítulo",
                       ["Sargento", "Tenente", "Capitão"], ["Agemman", "Galenus", "Fennias", "Atheus", "Gaius", "Antaro", "Numitor", "Severus"],
                       ["Honra de Macragge", "Glória de Guilliman", "Valor Eterno", "Vingança de Calth"],
                       M + "r2c0.png", M + "r2c1.png", M + "r0c3.png",
                       "Os filhos de Guilliman seguem o Codex Astartes: tropas equilibradas, logística impecável e apoio orbital da frota.",
                       "Ultramarines: tropas equilibradas e a melhor logística (mais Requisição). Lutam ao lado dos Blood Angels e dos Salamandras: não atacam os aliados e podem passar pelas províncias deles.",
                       "Ultramarines", attackBonus=0.05, incomeMult=1.15)),
    ("blood_angels", F("blood_angels", "Blood Angels", "Anjos Sangrentos", [190, 20, 45], A + "r2c0.png", "Requisição", "Req", "Frota de Baal",
                       ["Sargento", "Veterano", "Capitão"], ["Tycho", "Erasmus", "Raphael", "Gabriel", "Michael", "Leonid", "Castiel", "Sariel"],
                       ["Lâmina Vermelha", "Asas de Sanguinius", "Cálice de Baal", "Sangue Eterno"],
                       A + "r2c0.png", A + "r1c2.png", A + "r1c1.png",
                       "Os filhos de Sanguinius: nobres, belos e assombrados pela Sede Vermelha. Assaltos com mochilas de salto e a Companhia da Morte.",
                       "Blood Angels: o melhor ataque dos Astartes (+12%) — mochilas de salto, Companhia da Morte e Guarda Sanguinária. Aliados dos Ultramarines e dos Salamandras.",
                       "Anjos Sangrentos", attackBonus=0.12, incomeMult=1.05)),
    ("salamanders", F("salamanders", "Salamanders", "Salamandras", [30, 140, 60], R + "r2c0.png", "Requisição", "Req", "Frota de Nocturne",
                      ["Sargento", "Veterano", "Capitão"], ["Dak'ir", "Tsu'gan", "Pyriel", "Ba'ken", "Agatone", "Vargo", "Zen'de", "N'keln"],
                      ["Fogo de Vulkan", "Bigorna de Nocturne", "Chama Eterna", "Martelo de Prometeu"],
                      R + "r2c0.png", R + "r2c1.png", R + "r0c2.png",
                      "Os filhos de Vulkan, forjados no fogo de Nocturne. Lança-chamas, fusões, armaduras pesadas e uma teimosia sem igual na defesa.",
                      "Salamanders: mestres do fogo — Infernus e Redeemers limpam a infantaria, Erradicadores derretem blindados; aguentam mais nos ermos de cinzas. Aliados dos Ultramarines e dos Blood Angels.",
                      "Salamandras", attackBonus=0.03, incomeMult=1.1)),
])

# ============================================================ setor
DESC = ("Sistema estelar e corpos celestes (mesmo formato do sector.json). Gerado por tools/data/build_great_game.py; "
        "mapas por tools/art/gen_planets.py.")


def daemon_world(id, name, cls, orbit, angle, palette, owner, seed, desc, provs, size=0.75):
    return B(id, name, "planet", cls, orbit, angle, size, palette, owner, seed, desc, provs)


SECTOR = OrderedDict([
    ("Description", DESC),
    ("start", {"turn": 1, "year": "012.M42", "monthsPerTurn": 1}),
    ("system", {"id": "vigil", "name": "Sistema Vigil Aeterna", "star": {"name": "Lágrima do Imperador", "color": [255, 238, 210]},
                "desc": "Um mundo-santuário guarda as relíquias da Cruzada Indomitus. Do outro lado da Grande Fenda, os quatro Deuses do Caos fizeram uma aposta: quem o tomar primeiro."}),
    ("bodies", [
        B("aeternum", "Aeternum Sanctus", "planet", "Mundo-Santuário", 0.20, 200, 1.0, "fortress", "imperial", 131,
          "Mundo-santuário de catedrais e relicários, defendido por três capítulos Astartes. Nas bordas, as legiões dos Deuses já abriram brechas.", [
              P("lumen", "Cidade-Catedral Lumen", "hive", 0.40, 0.22, "ultramarines", 2, 3, ["um_intercessors", "um_intercessors"], True),
              P("relicary", "Grande Relicário", "hive", 0.58, 0.40, "ultramarines", 2, 2, ["um_intercessors"]),
              P("sanguis", "Cidadela Sanguínea", "hive", 0.66, 0.18, "blood_angels", 2, 2, ["ba_intercessors", "ba_intercessors"]),
              P("crimson_spire", "Torre Carmesim", "hive", 0.76, 0.42, "blood_angels", 2, 1, ["ba_intercessors"]),
              P("forge_prometheia", "Forja-Colmeia Prometeia", "hive", 0.34, 0.56, "salamanders", 2, 2, ["sal_intercessors", "sal_intercessors"]),
              P("nocturna", "Colmeia Nocturna", "hive", 0.52, 0.68, "salamanders", 2, 1, ["sal_intercessors"]),
              P("pilgrim_road", "Estrada dos Peregrinos", "plains", 0.48, 0.47, "ultramarines", 0, 0, []),
              P("saints_peaks", "Picos dos Santos", "mountains", 0.22, 0.34, None, 0, 1, ["guard_platoon"]),
              P("cloister_fields", "Campos do Claustro", "plains", 0.86, 0.62, None, 0, 0, ["guard_platoon"]),
              P("manufactorum", "Manufactorum Votivo", "industrial", 0.24, 0.78, None, 1, 1, ["guard_platoon"]),
              P("glacier", "Glaciar do Silêncio", "ice", 0.52, 0.06, None, 0, 0, []),
              P("ossuary", "Ermos do Ossário", "ash", 0.68, 0.84, None, 0, 0, ["guard_platoon"]),
              P("skull_field", "Basílica dos Crânios (profanada)", "warp", 0.09, 0.22, "world_eaters", 2, 1, ["we_jakhals", "we_jakhals"]),
              P("plague_marsh", "Colmeia Pestilenta (profanada)", "mire", 0.08, 0.86, "death_guard", 2, 1, ["dg_poxwalkers", "dg_poxwalkers"]),
              P("crystal_tower", "Scriptorium Cristalino (profanado)", "warp", 0.92, 0.22, "thousand_sons", 2, 1, ["ts_cultists", "ts_cultists"]),
              P("rapture_gardens", "Claustro do Êxtase (profanado)", "jungle", 0.92, 0.88, "emperors_children", 2, 1, ["ec_daemonettes", "ec_daemonettes"]),
              SEA("ae_sea_w", 0.03, 0.5), SEA("ae_sea_s", 0.40, 0.97), SEA("ae_sea_e", 0.995, 0.4),
          ], big=True),
        station("vigil", "Fortaleza-Estelar Vigil", "aeternum", 0.075, 20, "ultramarines", 37,
                "Fortaleza orbital dos Ultramarines sobre o mundo-santuário.", "um_intercessors"),
        B("sangue_eterno", "Barca Sangue Eterno", "station", "Barca de Batalha", 0.30, 120, 0.42, "station", "blood_angels", 139,
          "A barca de batalha da força-tarefa dos Blood Angels, ancorada como uma fortaleza no espaço.", [
              P("se_bridge", "Ponte de Comando", "station", 0.45, 0.45, "blood_angels", 2, 2, ["ba_intercessors", "ba_assault"], True),
              P("se_chapel", "Capela do Anjo", "station", 0.22, 0.35, "blood_angels", 0, 0, []),
              P("se_hangars", "Hangares", "station", 0.72, 0.38, "blood_angels", 1, 1, ["ba_scouts"]),
              P("se_reclusiam", "Reclusiam", "station", 0.55, 0.72, "blood_angels", 0, 0, []),
          ]),
        B("prometheus", "Prometeu Menor", "planet", "Mundo-Forja Vulcânico", 0.30, 290, 0.65, "volcanic", "salamanders", 141,
          "Lua vulcânica onde os Salamandras forjaram um posto avançado.", [
              P("pm_forge", "Forja do Pai", "industrial", 0.50, 0.45, "salamanders", 2, 2, ["sal_intercessors", "sal_scouts"], True),
              P("pm_peaks", "Montes de Fogo", "mountains", 0.20, 0.30, "salamanders", 0, 0, []),
              P("pm_ash", "Planícies de Cinza", "ash", 0.76, 0.30, "salamanders", 0, 0, ["sal_scouts"]),
              P("pm_vents", "Respiros de Lava", "industrial", 0.30, 0.76, "salamanders", 1, 0, []),
              P("pm_wastes", "Ermos Calcinados", "ash", 0.75, 0.76, None, 0, 0, ["guard_platoon"]),
              SEA("pm_sea", 0.5, 0.97),
          ]),
        daemon_world("skarvos", "Skarvos", "Mundo-Demônio de Khorne", 0.46, 155, "khorne", "world_eaters", 151,
                     "Um mar de sangue sob um céu de bronze. Torres de crânios marcam cada vitória dos Devoradores.", [
                         P("sk_throne", "Torre de Crânios", "warp", 0.50, 0.45, "world_eaters", 2, 2, ["we_berzerkers", "we_jakhals"], True),
                         P("sk_brass", "Fortaleza de Bronze", "industrial", 0.20, 0.35, "world_eaters", 1, 0, ["we_jakhals"]),
                         P("sk_pits", "Arenas de Sangue", "warp", 0.78, 0.30, "world_eaters", 0, 0, []),
                         P("sk_ash", "Ermos Rubros", "ash", 0.30, 0.76, "world_eaters", 0, 0, []),
                         P("sk_peaks", "Montes de Ossos", "mountains", 0.74, 0.76, "world_eaters", 0, 0, []),
                         SEA("sk_sea", 0.5, 0.03),
                     ]),
        daemon_world("mortis", "Mortis Vel", "Mundo-Pestilento de Nurgle", 0.46, 245, "nurgle", "death_guard", 157,
                     "Pântanos fervilhando de moscas e jardins de podridão. A Death Guard trata o planeta como um presente.", [
                         P("mv_garden", "Jardim do Avô", "warp", 0.50, 0.45, "death_guard", 2, 2, ["dg_plague_marines", "dg_poxwalkers"], True),
                         P("mv_bog", "Lodaçal Fervente", "mire", 0.20, 0.35, "death_guard", 0, 0, ["dg_poxwalkers"]),
                         P("mv_foundry", "Fundição Enferrujada", "industrial", 0.78, 0.30, "death_guard", 1, 0, []),
                         P("mv_swamp", "Pântano das Moscas", "mire", 0.30, 0.76, "death_guard", 0, 0, []),
                         P("mv_rot", "Florestas Podres", "jungle", 0.74, 0.76, "death_guard", 0, 0, []),
                         SEA("mv_sea", 0.5, 0.97),
                     ]),
        daemon_world("ixathar", "Ixathar", "Mundo-Demônio de Tzeentch", 0.46, 335, "tzeentch", "thousand_sons", 163,
                     "Torres de cristal que mudam de forma a cada hora. Os Mil Filhos guardam aqui bibliotecas roubadas de mil mundos.", [
                         P("ix_tower", "Torre do Destino", "warp", 0.50, 0.45, "thousand_sons", 2, 2, ["ts_rubrics", "ts_cultists"], True),
                         P("ix_library", "Biblioteca Infinita", "warp", 0.20, 0.35, "thousand_sons", 1, 0, ["ts_tzaangors"]),
                         P("ix_crystal", "Planícies de Cristal", "plains", 0.78, 0.30, "thousand_sons", 0, 0, []),
                         P("ix_peaks", "Picos Mutantes", "mountains", 0.30, 0.76, "thousand_sons", 0, 0, []),
                         P("ix_ice", "Gelo Azul", "ice", 0.74, 0.76, "thousand_sons", 0, 0, []),
                         SEA("ix_sea", 0.5, 0.03),
                     ]),
        daemon_world("lysandrae", "Lysandrae", "Mundo-Prazer de Slaanesh", 0.46, 65, "slaanesh", "emperors_children", 167,
                     "Palácios de excesso entre selvas perfumadas. Cada prazer custa uma alma.", [
                         P("ly_palace", "Palácio do Êxtase", "warp", 0.50, 0.45, "emperors_children", 2, 2, ["ec_tormentors", "ec_daemonettes"], True),
                         P("ly_gardens", "Jardins Perfumados", "jungle", 0.20, 0.35, "emperors_children", 0, 0, ["ec_daemonettes"]),
                         P("ly_arena", "Arena das Mil Dores", "warp", 0.78, 0.30, "emperors_children", 1, 0, []),
                         P("ly_plains", "Campos Dourados", "plains", 0.30, 0.76, "emperors_children", 0, 0, []),
                         P("ly_marsh", "Lagos de Almíscar", "mire", 0.74, 0.76, "emperors_children", 0, 0, []),
                         SEA("ly_sea", 0.5, 0.97),
                     ]),
    ]),
    ("startingArmies", [
        {"faction": "ultramarines", "general": "calgar", "body": "aeternum", "province": "lumen",
         "battalions": ["um_intercessors", "um_intercessors", "um_hellblasters", "um_aggressors", "um_redemptor"]},
        {"faction": "ultramarines", "general": "tigurius", "body": "vigil", "province": "vigil_yards",
         "battalions": ["um_intercessors", "um_inceptors", "um_scouts"]},
        {"faction": "blood_angels", "general": "dante", "body": "aeternum", "province": "sanguis",
         "battalions": ["ba_intercessors", "ba_assault", "ba_death_company", "ba_inceptors", "ba_baal_predator"]},
        {"faction": "blood_angels", "general": "mephiston", "body": "sangue_eterno", "province": "se_bridge",
         "battalions": ["ba_intercessors", "ba_assault", "ba_scouts"]},
        {"faction": "salamanders", "general": "tushan", "body": "aeternum", "province": "forge_prometheia",
         "battalions": ["sal_intercessors", "sal_intercessors", "sal_infernus", "sal_eradicators", "sal_invictor"]},
        {"faction": "salamanders", "general": "hestan", "body": "prometheus", "province": "pm_forge",
         "battalions": ["sal_intercessors", "sal_assault", "sal_scouts"]},
        {"faction": "world_eaters", "general": "kharn", "body": "aeternum", "province": "skull_field",
         "battalions": ["we_jakhals", "we_jakhals", "we_berzerkers", "we_berzerkers", "we_berzerkers", "we_eightbound", "we_bloodletters", "we_maulerfiend", "we_rhino"]},
        {"faction": "world_eaters", "general": "invocatus", "body": "skarvos", "province": "sk_throne",
         "battalions": ["we_jakhals", "we_berzerkers", "we_bloodletters", "we_maulerfiend"]},
        {"faction": "death_guard", "general": "typhus", "body": "aeternum", "province": "plague_marsh",
         "battalions": ["dg_poxwalkers", "dg_poxwalkers", "dg_poxwalkers", "dg_plague_marines", "dg_plague_marines", "dg_plague_marines", "dg_blight_launchers", "dg_blightspawn", "dg_plagueburst"]},
        {"faction": "death_guard", "general": "felthius", "body": "mortis", "province": "mv_garden",
         "battalions": ["dg_poxwalkers", "dg_plague_marines", "dg_blight_hauler"]},
        {"faction": "thousand_sons", "general": "ahriman", "body": "aeternum", "province": "crystal_tower",
         "battalions": ["ts_cultists", "ts_tzaangors", "ts_tzaangors", "ts_rubrics", "ts_rubrics", "ts_rubrics", "ts_horrors", "ts_enlightened", "ts_defiler"]},
        {"faction": "thousand_sons", "general": "amon", "body": "ixathar", "province": "ix_tower",
         "battalions": ["ts_cultists", "ts_rubrics", "ts_enlightened"]},
        {"faction": "emperors_children", "general": "lucius", "body": "aeternum", "province": "rapture_gardens",
         "battalions": ["ec_daemonettes", "ec_daemonettes", "ec_infractors", "ec_infractors", "ec_tormentors", "ec_noise_marines", "ec_blastmaster", "ec_seekers", "ec_maulerfiend"]},
        {"faction": "emperors_children", "general": "xantine", "body": "lysandrae", "province": "ly_palace",
         "battalions": ["ec_daemonettes", "ec_noise_marines", "ec_seekers"]},
    ]),
    ("startingFleets", [
        {"faction": "ultramarines", "body": "aeternum", "ships": 3},
        {"faction": "blood_angels", "body": "sangue_eterno", "ships": 2},
        {"faction": "salamanders", "body": "prometheus", "ships": 2},
        {"faction": "world_eaters", "body": "skarvos", "ships": 3},
        {"faction": "death_guard", "body": "mortis", "ships": 3},
        {"faction": "thousand_sons", "body": "ixathar", "ships": 3},
        {"faction": "emperors_children", "body": "lysandrae", "ships": 3},
    ]),
])

SCENARIO = OrderedDict([
    ("id", "great_game"), ("name", "O Grande Jogo dos Deuses"), ("sector", "sector_great_game.json"),
    ("factions", ["world_eaters", "death_guard", "thousand_sons", "emperors_children", "ultramarines", "blood_angels", "salamanders"]),
    ("playable", ["world_eaters", "death_guard", "thousand_sons", "emperors_children", "ultramarines", "blood_angels", "salamanders"]),
    ("teams", {"astartes": ["ultramarines", "blood_angels", "salamanders"]}),
    ("neutralName", "Defesa Planetária"),
    ("objective", {"body": "aeternum", "label": "Relicários de Aeternum", "text": "controlar todas as cidades de Aeternum Sanctus, inclusive as quatro profanadas pelas legiões (os Astartes vencem juntos)"}),
    ("portraits", [K + "r1c2.png", M + "r2c0.png"]),
    ("intro", "012.M42. Khorne, Nurgle, Tzeentch e Slaanesh apostaram um mundo-santuário no Grande Jogo. Quatro legiões traidoras abrem brechas em Aeternum Sanctus — e cada uma quer o prêmio só para o seu deus. Ultramarines, Blood Angels e Salamandras juram defendê-lo juntos."),
    ("summary", "As quatro legiões dos Deuses do Caos, umas contra as outras, contra três capítulos Astartes aliados."),
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

    save("sector_great_game.json", SECTOR)
    sc = load("scenarios.json")
    sc["scenarios"] = [s for s in sc["scenarios"] if s["id"] != SCENARIO["id"]] + [SCENARIO]
    if "teams" not in sc["Description"]:
        sc["Description"] += " teams: alianças {nome: [facções]} — aliados não se atacam e vencem juntos."
    save("scenarios.json", sc)
    print("unidades:", {k: len(v) for k, v in FACTION_UNITS.items()})


if __name__ == "__main__":
    main()
