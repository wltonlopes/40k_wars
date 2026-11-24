"""Mecânicas das facções (v0.6), gravadas em factions.json, units.json e
progression.json:

  special   recurso especial da facção (biomassa, favor dos deuses, fé...):
            como se ganha (gain) e os rituais em que se gasta (rituals).
  pact      diplomacia: grupo da facção e com quem aceita tréguas.
  morale    moral dos batalhões na batalha 2D (0 = nunca debandam).
  warcry    grito de guerra (audio/interface/wh40k/warcry_<nome>.ogg).

Também cria as Crias do Caos (unidades que não se recrutam) e o arquivo
progression.json: níveis e traços dos generais e relíquias de cada campanha.
Rodar por último (depois de build_factions, build_sectors, build_great_game
e build_thaurus).

Ganhos (gain):
  kill        por homem/veículo inimigo abatido
  battle      por batalha travada          win        por vitória
  lopsided    vitória esmagadora (2x a força do inimigo)
  generalKill general inimigo ferido ou morto
  sack        por saque                    capture    por província tomada
  hive        extra por cidade-colmeia tomada
  power       por poder de apoio usado na batalha jogada
  infected    por turno, por província própria devastada (a praga)
  hold        por turno, por província própria dos terrenos dados
  turn        por turno
  sacrifice   por homem/veículo próprio perdido (Krieg)
  decay       fração perdida nos turnos sem batalha (os deuses se entediam)

Efeitos dos rituais (effect.type), alvo: exército próprio (target "army")
ou a facção ("faction"):
  spawn   batalhões grátis (unit, count)       heal    repõe a força
  xp      experiência                          buff    ataque/defesa por N turnos
  moves   marcha extra neste turno             funds   recursos
  fort    +1 fortificação na província          restore acaba a devastação
  plague  fere os inimigos das províncias vizinhas
  convert toma uma província neutra vizinha sem luta
  ascend  o general vira Príncipe-Demônio (ou Cria do Caos, se falhar)
"""
import json
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_factions import U, load, save  # noqa: E402


def R(id, name, cost, effect, desc, target="army", ai=1.0):
    return OrderedDict([("id", id), ("name", name), ("cost", cost), ("target", target), ("effect", effect), ("desc", desc), ("ai", ai)])


def SP(name, short, icon, desc, gain, rituals, start=0, cap=300):
    return OrderedDict([("name", name), ("short", short), ("icon", icon), ("desc", desc), ("start", start), ("max", cap),
                        ("gain", gain), ("rituals", rituals)])


def spawn(unit, count=1):
    return {"type": "spawn", "unit": unit, "count": count}


def buff(name, attack=0.0, defense=0.0, turns=2):
    return {"type": "buff", "name": name, "attack": attack, "defense": defense, "turns": turns}


HEAL = {"type": "heal", "amount": 1.0}


def ascend(god):
    return R("ascend", "Ascensão a Príncipe-Demônio", 110, {"type": "ascend", "god": god},
             "O general do exército pede a recompensa final de " + god + ": vira Príncipe-Demônio (+20% no ataque, +15% na defesa, +1 carga de apoio). "
             "Se os deuses não estiverem satisfeitos (30%), ele vira uma Cria do Caos.", ai=0.8)


def chapter(name, intercessor, extra):
    return SP("Glória do Capítulo", "Glória", None,
              "Glória das vitórias do " + name + ": vencer batalhas, derrubar generais inimigos e tomar cidades.",
              {"win": 8, "generalKill": 25, "capture": 3, "hive": 10, "kill": 0.1},
              [R("reinforce", "Reforços do Capítulo", 45, spawn(intercessor), "Uma cápsula traz uma esquadra nova para o exército."),
               R("apothecary", "Apotecários", 35, HEAL, "Os apotecários repõem as perdas do exército."),
               R("oath", "Juramento de Momento", 30, buff("Juramento de Momento", attack=0.25, turns=2), "+25% no ataque por 2 turnos.")] + extra)


SPECIALS = {
    "imperial": SP("Glória Regimental", "Glória", None,
                   "Os regimentos ganham glória vencendo batalhas e tomando cidades; o Alto Comando a recompensa.",
                   {"win": 8, "capture": 4, "hive": 10, "kill": 0.1},
                   [R("barrage", "Barragem de Artilharia", 40, {"type": "plague", "damage": 0.2, "name": "barragem"}, "As baterias castigam os inimigos das províncias vizinhas ao exército."),
                    R("segmentum", "Reforços do Segmentum", 45, spawn("guard_platoon", 2), "Dois pelotões novos chegam ao exército."),
                    R("commissar", "Discurso do Comissário", 25, buff("Discurso do Comissário", attack=0.2, defense=0.1, turns=1), "+20% no ataque e +10% na defesa por 1 turno."),
                    R("medicae", "Medicae", 35, HEAL, "Os hospitais de campanha repõem as perdas do exército.")]),
    "orks": SP("Waaagh!", "Waaagh!", "orks/r0c5.png",
               "A Waaagh! cresce com cada briga — e murcha se os rapazes ficam parados.",
               {"battle": 7, "win": 6, "kill": 0.25, "sack": 10, "decay": 0.12},
               [R("waaagh", "WAAAGH!", 50, buff("WAAAGH!", attack=0.35, turns=2), "+35% no ataque por 2 turnos — e o exército marcha mais uma vez neste turno.", ai=1.4),
                R("more_boyz", "Mais Rapazes!", 35, spawn("boyz", 2), "Dois bandos de rapazes aparecem do nada (como sempre)."),
                R("mek", "Mek Conserta", 30, HEAL, "Os Meks e os Doutores remendam tudo.")]),
    "tyranids": SP("Biomassa", "Bio", "tyranids/r2c3.png",
                   "A Mente da Colmeia recolhe a biomassa dos inimigos abatidos e das províncias devoradas, e a transforma em novos organismos.",
                   {"kill": 0.8, "win": 4, "sack": 45, "capture": 4, "hive": 8},
                   [R("brood", "Nova Ninhada", 30, spawn("termagants", 2), "Duas ninhadas de termagantes brotam junto ao exército."),
                    R("carnifex", "Gerar Carnifex", 60, spawn("carnifex"), "Um Carnifex cresce da biomassa acumulada.", ai=1.3),
                    R("tervigon", "Gerar Tervigon", 90, spawn("tervigon"), "Uma Tervigon, mãe de ninhadas, se junta ao enxame."),
                    R("regen", "Regeneração", 35, HEAL, "O enxame se regenera: perdas repostas."),
                    R("adapt", "Evolução Adaptativa", 45, buff("Evolução Adaptativa", attack=0.2, defense=0.2, turns=3), "+20% no ataque e na defesa por 3 turnos.")],
                   start=20, cap=400),
    "chaos": SP("Favor dos Deuses", "Favor", "chaos/r2c0.png",
                "Os Quatro Deuses recompensam a matança, a profanação e a queda de generais inimigos. Parados, eles se entediam.",
                {"kill": 0.3, "win": 8, "generalKill": 25, "sack": 15, "decay": 0.08},
                [ascend("Caos Indiviso"),
                 R("gift", "Dádiva do Caos", 40, buff("Dádiva do Caos", attack=0.25, defense=0.1, turns=2), "+25% no ataque e +10% na defesa por 2 turnos."),
                 R("summon", "Invocar Possuídos", 50, spawn("possessed"), "Demônios tomam a carne de um esquadrão: Possuídos para o exército."),
                 R("mark", "Marca do Caos", 30, {"type": "xp", "amount": 2}, "Os batalhões do exército ganham experiência.")]),
    "world_eaters": SP("Favor de Khorne", "Crânios", "khorne/r1c0.png",
                       "Khorne não se importa de onde vem o sangue — só que corra. Batalhas, matança e crânios de generais enchem o favor; a paz o esvazia.",
                       {"kill": 0.5, "battle": 8, "win": 6, "generalKill": 40, "sack": 10, "decay": 0.15},
                       [ascend("Khorne"),
                        R("frenzy", "Fúria Sanguinária", 35, buff("Fúria Sanguinária", attack=0.35, defense=-0.1, turns=2), "+35% no ataque, -10% na defesa por 2 turnos.", ai=1.3),
                        R("bloodletters", "Invocar Sanguinários", 50, spawn("we_bloodletters", 2), "Dois bandos de Sanguinários saem da disformidade."),
                        R("skulls", "Crânios para o Trono", 30, {"type": "xp", "amount": 2}, "Os batalhões do exército ganham experiência.")]),
    "death_guard": SP("Favor de Nurgle", "Bênçãos", "nurgle/r1c2.png",
                      "O Avô Nurgle se alegra com cada província infectada: semeie a praga e mantenha as terras devastadas.",
                      {"sack": 30, "infected": 3, "capture": 5, "win": 4, "hold": {"mire": 1}},
                      [ascend("Nurgle"),
                       R("spread", "Espalhar a Praga", 45, {"type": "plague", "damage": 0.25, "name": "praga", "devastate": True}, "A praga salta para as províncias vizinhas: os inimigos lá perdem força e a terra fica devastada.", ai=1.2),
                       R("blessing", "Bênção da Podridão", 40, {"type": "heal", "amount": 1.0, "defense": 0.2, "turns": 2}, "Perdas repostas e +20% na defesa por 2 turnos."),
                       R("poxwalkers", "Erguer Ambulantes", 25, spawn("dg_poxwalkers", 2), "Os mortos da praga se levantam: dois bandos de Ambulantes da Praga.")]),
    "thousand_sons": SP("Favor de Tzeentch", "Segredos", "tzeentch/r1c2.png",
                        "O Arquiteto do Destino ama as tramas: poderes usados, conhecimento pilhado, cidades tomadas e o simples passar do tempo.",
                        {"power": 8, "sack": 20, "hive": 12, "capture": 3, "turn": 3, "win": 3},
                        [ascend("Tzeentch"),
                         R("weave", "Teia do Destino", 40, buff("Teia do Destino", defense=0.3, attack=0.1, turns=3), "+30% na defesa e +10% no ataque por 3 turnos."),
                         R("horrors", "Invocar Horrores", 45, spawn("ts_horrors"), "Horrores de Tzeentch surgem junto ao exército."),
                         R("portal", "Portal da Disformidade", 30, {"type": "moves", "amount": 1}, "O exército marcha mais uma vez neste turno.")]),
    "emperors_children": SP("Favor de Slaanesh", "Excessos", "slaanesh/r1c1.png",
                            "O Príncipe Sombrio quer excesso: saques, vitórias esmagadoras e sensações sem fim. A rotina o entedia.",
                            {"sack": 30, "lopsided": 20, "win": 6, "kill": 0.3, "decay": 0.12},
                            [ascend("Slaanesh"),
                             R("ecstasy", "Êxtase da Batalha", 40, buff("Êxtase da Batalha", attack=0.25, turns=2), "+25% no ataque por 2 turnos e o exército marcha mais uma vez neste turno.", ai=1.2),
                             R("daemonettes", "Invocar Demonetes", 45, spawn("ec_daemonettes", 2), "Duas hostes de Demonetes atendem ao chamado."),
                             R("feast", "Banquete de Excessos", 40, {"type": "funds", "amount": 300}, "+300 Excessos.", target="faction")]),
    "ultramarines": chapter("Ultramarines", "um_intercessors",
                            [R("codex", "Táticas do Codex", 40, buff("Táticas do Codex", attack=0.15, defense=0.2, turns=3), "+15% no ataque e +20% na defesa por 3 turnos.")]),
    "blood_angels": chapter("Blood Angels", "ba_intercessors",
                            [R("thirst", "A Sede Vermelha", 35, buff("A Sede Vermelha", attack=0.4, defense=-0.1, turns=2), "+40% no ataque, -10% na defesa por 2 turnos.", ai=1.2)]),
    "salamanders": chapter("Salamanders", "sal_intercessors",
                           [R("anvil", "Forja de Vulkan", 35, {"type": "fort"}, "Os Salamandras fortificam a província do exército (+1 fortificação).")]),
    "grey_knights": SP("Pureza", "Pureza", "grey_knights/r2c3.png",
                       "A pureza da ordem cresce a cada demônio e herege destruído.",
                       {"win": 8, "kill": 0.3, "generalKill": 30, "power": 4},
                       [R("purge", "Rito de Purificação", 45, {"type": "plague", "damage": 0.25, "name": "purificação"}, "Os Bibliotecários purgam as províncias vizinhas: os inimigos lá perdem força."),
                        R("teleport", "Teleporte Estratégico", 30, {"type": "moves", "amount": 1}, "O exército marcha mais uma vez neste turno."),
                        R("terminators", "Irmandade de Exterminadores", 70, spawn("gk_terminators"), "Um esquadrão de Exterminadores se teleporta para o exército."),
                        R("aegis", "Égide", 35, buff("Égide", defense=0.3, turns=2), "+30% na defesa por 2 turnos.")]),
    "eldar": SP("Destino", "Destino", "eldar/r2c2.png",
                "Os videntes leem os fios do destino; cada vitória e cada turno de paciência revelam mais.",
                {"win": 6, "turn": 3, "kill": 0.15},
                [R("vision", "Visão do Vidente", 35, buff("Visão do Vidente", defense=0.35, turns=2), "+35% na defesa por 2 turnos."),
                 R("webway", "Atalho da Teia", 30, {"type": "moves", "amount": 2}, "O exército marcha mais duas vezes neste turno."),
                 R("wraith", "Despertar os Espíritos", 70, spawn("wraithguard"), "Uma esquadra de Guardas Espectrais se junta ao exército.")]),
    "necrons": SP("Energia Ancestral", "Energia", "necrons/r1c3.png",
                  "Os complexos tumulares despertam com a guerra; cada tumba controlada alimenta os protocolos.",
                  {"kill": 0.3, "win": 5, "capture": 4, "hold": {"tomb": 2}},
                  [R("reanimate", "Protocolos de Reanimação", 35, HEAL, "O exército se reconstrói: perdas repostas."),
                   R("awaken", "Despertar uma Falange", 45, spawn("necron_warriors", 2), "Duas falanges de guerreiros despertam."),
                   R("storm", "Tempestade de Imotekh", 40, buff("Tempestade", attack=0.25, turns=2), "+25% no ataque por 2 turnos.")]),
    "tau": SP("Bem Maior", "Bem Maior", "tau/r1c1.png",
              "Cada província que entra no Império Tau aproxima o Bem Maior — de preferência sem disparar um tiro.",
              {"capture": 7, "hive": 10, "win": 5, "turn": 2},
              [R("envoy", "Emissário do Bem Maior", 50, {"type": "convert"}, "Uma província neutra vizinha ao exército se junta ao Império Tau sem luta (se a guarnição for pequena).", ai=1.4),
               R("markers", "Marcadores de Alvo", 30, buff("Marcadores de Alvo", attack=0.2, turns=2), "+20% no ataque por 2 turnos."),
               R("kroot", "Contratar Kroot", 30, spawn("kroot", 2), "Dois bandos de Kroot se juntam ao exército.")]),
    "mechanicus": SP("Conhecimento Arcano", "Conhec.", "mechanicus/r2c0.png",
                     "Fragmentos de STC e tecno-relíquias: as zonas industriais e os estaleiros rendem conhecimento todo turno.",
                     {"win": 5, "kill": 0.15, "capture": 3, "hold": {"industrial": 2}},
                     [R("kastelan", "Ativar Robô Kastelan", 60, spawn("mc_kastelan"), "Um par de robôs Kastelan desperta nos cofres da forja.", ai=1.2),
                      R("canticle", "Cânticos do Omnissiah", 30, buff("Cânticos do Omnissiah", attack=0.15, defense=0.15, turns=2), "+15% no ataque e na defesa por 2 turnos."),
                      R("repair", "Ritos de Reparo", 35, HEAL, "Os tecno-sacerdotes reparam o exército: perdas repostas."),
                      R("fortify", "Fortificar", 35, {"type": "fort"}, "+1 fortificação na província do exército.")]),
    "sororitas": SP("Fé", "Fé", "sororitas/r2c2.png",
                    "A fé das Irmãs cresce a cada batalha e a cada catedral sob o seu cuidado. Gaste-a em Atos de Fé.",
                    {"battle": 5, "win": 5, "kill": 0.15, "hold": {"hive": 1}},
                    [R("miracle", "Ato de Fé: Milagre", 40, HEAL, "As feridas se fecham: perdas repostas."),
                     R("fury", "Ato de Fé: Fúria Divina", 35, buff("Fúria Divina", attack=0.3, turns=2), "+30% no ataque por 2 turnos.", ai=1.2),
                     R("penitents", "Convocar Penitentes", 30, spawn("sr_repentia"), "Uma esquadra de Repentia busca o perdão no exército."),
                     R("sanctify", "Santificar", 30, {"type": "restore", "fort": True}, "A província do exército é santificada: acaba a devastação e ganha +1 fortificação.")]),
    "custodes": SP("Juramento", "Juramento", "custodes/r2c2.png",
                   "Os Custódios honram os juramentos com vitórias e com a cabeça dos comandantes inimigos.",
                   {"win": 10, "generalKill": 30, "kill": 0.2},
                   [R("shield", "Escudo do Trono", 40, buff("Escudo do Trono", defense=0.4, turns=2), "+40% na defesa por 2 turnos."),
                    R("deathoath", "Juramento de Morte", 40, buff("Juramento de Morte", attack=0.35, turns=2), "+35% no ataque por 2 turnos."),
                    R("terra", "Reforços de Terra", 70, spawn("cu_spears"), "Uma esquadra de Guardas Custódios chega de Terra.")]),
    "drukhari": SP("Dor", "Dor", "drukhari/r2c0.png",
                   "Os Drukhari se alimentam da dor alheia: matança e rapina enchem os corpos de energia, que se esvai depressa.",
                   {"kill": 0.6, "sack": 35, "win": 5, "decay": 0.15},
                   [R("elixir", "Elixires de Combate", 35, buff("Elixires de Combate", attack=0.25, turns=2), "+25% no ataque por 2 turnos e o exército marcha mais uma vez neste turno.", ai=1.2),
                    R("rebirth", "Renascer na Cuba", 35, HEAL, "Os Haemonculi remontam os mortos: perdas repostas."),
                    R("incubi", "Contratar Íncubos", 50, spawn("dk_incubi"), "Uma esquadra de Íncubos aceita o contrato."),
                    R("slaves", "Leilão de Escravos", 40, {"type": "funds", "amount": 320}, "+320 Escravos.", target="faction")]),
    "astral_claws": SP("Dízimo Retido", "Dízimo", "badab_claws/r1c0.png",
                       "A semente genética que Huron negou a Terra: cada vitória, cada cidade mantida e cada lealista abatido aumentam o tesouro do Tirano.",
                       {"win": 7, "kill": 0.2, "capture": 4, "hive": 10, "hold": {"hive": 1}},
                       [R("recruits", "Novos Iniciados", 50, spawn("ac_tactical"), "A semente retida vira uma esquadra tática nova."),
                        R("legion", "Levas da Legião do Tirano", 30, spawn("tl_rifles", 3), "Três bandos de fuzileiros mercenários se juntam ao exército."),
                        R("ambush", "Emboscada dos Mantis Warriors", 40, {"type": "plague", "damage": 0.22, "name": "a emboscada"}, "Atiradores e batedores castigam os inimigos das províncias vizinhas."),
                        R("tyrant", "Juramento ao Tirano", 35, buff("Juramento ao Tirano", attack=0.2, defense=0.15, turns=2), "+20% no ataque e +15% na defesa por 2 turnos.")]),
    "krieg": SP("Expiação", "Expiação", "krieg/r2c0.png",
                "Krieg expia o pecado do seu mundo morrendo pelo Imperador: cada soldado perdido em batalha aproxima a redenção.",
                {"sacrifice": 0.5, "win": 5, "capture": 4},
                [R("waves", "Ondas de Infantaria", 30, spawn("kr_rifles", 3), "Três pelotões novos chegam das docas de Krieg."),
                 R("barrage", "Barragem Contínua", 40, {"type": "plague", "damage": 0.25, "name": "a barragem", "devastate": True}, "Semanas de artilharia sobre as províncias vizinhas: os inimigos perdem força e a terra fica devastada.", ai=1.3),
                 R("dig", "Cavar Trincheiras", 25, {"type": "fort"}, "+1 fortificação na província do exército."),
                 R("charge", "Carga dos Death Riders", 35, buff("Carga dos Death Riders", attack=0.25, turns=1), "+25% no ataque por 1 turno e o exército marcha mais uma vez neste turno.")]),
    "vraks": SP("Heresia", "Heresia", "vraks/r2c0.png",
                "A heresia de Xaphan se alimenta de cada mundo profanado e de cada soldado de Krieg abatido.",
                {"kill": 0.3, "sack": 25, "capture": 5, "win": 5},
                [R("sermon", "Sermão de Xaphan", 30, buff("Sermão de Xaphan", attack=0.2, defense=0.1, turns=2), "+20% no ataque e +10% na defesa por 2 turnos."),
                 R("arm", "Armar os Escravos", 25, spawn("vr_cultists", 3), "Três bandos de cultistas recebem armas do arsenal."),
                 R("alpha", "Células da Alpha Legion", 45, {"type": "convert"}, "Uma província neutra vizinha se rebela e se junta a Vraks sem luta (se a guarnição for pequena).", ai=1.3),
                 R("arsenal", "Abrir o Arsenal", 40, {"type": "funds", "amount": 300}, "+300 Arsenal.", target="faction")]),
}

# Rituais que também dão marcha extra neste turno (além do bônus).
EXTRA_MOVE = {"waaagh", "ecstasy", "elixir", "charge"}
for f, sp in SPECIALS.items():
    for r in sp["rituals"]:
        if r["id"] in EXTRA_MOVE:
            r["effect"]["moves"] = 1

# Diplomacia: grupo da facção e grupos com quem aceita trégua.
PACTS = {
    "chaos": {"group": "chaos", "with": ["chaos", "drukhari"]},
    "death_guard": {"group": "chaos", "with": ["chaos", "drukhari"]},
    "thousand_sons": {"group": "chaos", "with": ["chaos", "drukhari"]},
    "emperors_children": {"group": "chaos", "with": ["chaos", "drukhari"]},
    "world_eaters": {"group": "chaos", "with": [], "never": "Khorne não negocia: só aceita crânios."},
    "drukhari": {"group": "drukhari", "with": ["chaos", "imperium", "eldar"]},
    "eldar": {"group": "eldar", "with": ["imperium", "drukhari"]},
    "imperial": {"group": "imperium", "with": ["eldar"]},
    "mechanicus": {"group": "imperium", "with": ["drukhari"]},
    "tau": {"group": "tau", "with": ["imperium", "eldar"]},
}
for f in ("ultramarines", "blood_angels", "salamanders", "grey_knights", "sororitas", "custodes"):
    PACTS[f] = {"group": "imperium", "with": [], "never": "O Imperador não negocia com hereges e xenos."}
PACTS["orks"] = {"group": "orks", "with": [], "never": "Orks só negociam no soco."}
PACTS["tyranids"] = {"group": "tyranids", "with": [], "never": "A Mente da Colmeia não negocia: só devora."}
PACTS["necrons"] = {"group": "necrons", "with": [], "never": "Os Necrons não tratam com os vivos."}
PACTS["imperial"]["with"].append("tau")
PACTS["astral_claws"] = {"group": "secessionists", "with": ["imperium", "chaos"]}
PACTS["salamanders"] = {"group": "imperium", "with": ["secessionists"]}
PACTS["ultramarines"] = {"group": "imperium", "with": ["secessionists"]}
PACTS["imperial"]["with"].append("secessionists")
PACTS["krieg"] = {"group": "imperium", "with": [], "never": "Krieg não negocia: só expia."}
PACTS["vraks"] = {"group": "chaos", "with": ["chaos", "drukhari"]}

# Moral na batalha 2D: 0 = nunca debandam; 1 = normal; > 1 = debandam mais fácil.
MORALE = {"imperial": 1.1, "orks": 0.8, "tyranids": 0, "necrons": 0, "death_guard": 0, "world_eaters": 0, "custodes": 0,
          "grey_knights": 0, "sororitas": 0.6, "tau": 1.1, "eldar": 0.9, "drukhari": 1.2, "mechanicus": 0.7, "chaos": 0.7,
          "thousand_sons": 0.4, "emperors_children": 0.8, "ultramarines": 0.5, "blood_angels": 0.4, "salamanders": 0.4,
          "astral_claws": 0.6, "krieg": 0, "vraks": 1.2}
WARCRY = {"imperial": "imperial", "orks": "ork", "tyranids": "tyranid", "necrons": "necron", "tau": "tau", "eldar": "eldar",
          "drukhari": "eldar", "mechanicus": "mechanicus", "sororitas": "imperial", "custodes": "astartes",
          "grey_knights": "astartes", "ultramarines": "astartes", "blood_angels": "astartes", "salamanders": "astartes",
          "chaos": "chaos", "world_eaters": "khorne", "death_guard": "chaos", "thousand_sons": "chaos", "emperors_children": "chaos",
          "astral_claws": "astartes", "krieg": "imperial", "vraks": "chaos"}

# Estilo das naves (tools/art/slice_space.py: art/textures/ui/campaigns/wh40k/ships/<estilo>_<0..3>.png).
SHIPS = {"imperial": "imperial", "krieg": "imperial", "mechanicus": "imperial", "sororitas": "imperial", "tau": "astartes",
         "ultramarines": "astartes", "blood_angels": "astartes", "salamanders": "astartes", "grey_knights": "astartes",
         "custodes": "astartes", "astral_claws": "astartes", "chaos": "chaos", "world_eaters": "chaos", "emperors_children": "chaos",
         "death_guard": "chaos2", "thousand_sons": "chaos2", "vraks": "chaos2", "orks": "orks", "necrons": "necrons",
         "eldar": "eldar", "drukhari": "eldar", "tyranids": "tyranids"}

# Crias do Caos: o que sobra de um general que falha na ascensão.
SPAWNS = {
    "chaos": ("chaos_spawn", "chaos/r1c3.png"),
    "world_eaters": ("we_spawn", "khorne/r2c2.png"),
    "death_guard": ("dg_spawn", "nurgle/r2c1.png"),
    "thousand_sons": ("ts_spawn", "tzeentch/r3c2.png"),
    "emperors_children": ("ec_spawn", "slaanesh/r2c2.png"),
}


def spawn_unit(id, portrait):
    return U(id, "Cria do Caos", "vehicle", 0, 0, 34, 1, portrait,
             "O que restou de um campeão rejeitado pelos deuses: uma massa de carne, garras e bocas. Não se recruta.",
             ["(gorgolejos)", "(gritos de mil bocas)", "...eu... era... alguém..."],
             range=0.03, speed=0.03, armor=1.2, noRecruit=True)


# ------------------------------------------------------------ poderes dos generais (batalha 2D)
# type: smite (dano numa área escolhida), warcry (dano dos aliados perto), shield
# (menos dano recebido perto), heal (cura perto), inspire (todo o lado: sem pânico,
# mais rápido e mais dano), summon (tropas temporárias), teleport (o general e
# os vizinhos saltam para o ponto). power, radius (campo), duration e cooldown (s).
ABILITY_TYPES = {
    "smite": {"name": "Tempestade Psíquica", "desc": "Fere todos os inimigos numa área escolhida.", "power": 0.25, "radius": 0.08, "cooldown": 45},
    "warcry": {"name": "Grito de Guerra", "desc": "Os aliados perto do general causam +40% de dano por 15 s.", "power": 0.4, "radius": 0.18, "duration": 15, "cooldown": 50},
    "shield": {"name": "Escudo de Campo", "desc": "Os aliados perto do general recebem 40% menos dano por 15 s.", "power": 0.4, "radius": 0.18, "duration": 15, "cooldown": 50},
    "heal": {"name": "Cura de Campo", "desc": "Os aliados perto do general recuperam 25% da força.", "power": 0.25, "radius": 0.18, "cooldown": 55},
    "inspire": {"name": "Sermão Inflamado", "desc": "Todo o exército: sem pânico, +15% de velocidade e +15% de dano por 20 s.", "power": 0.15, "duration": 20, "cooldown": 70},
    "summon": {"name": "Invocação", "desc": "Tropas temporárias surgem junto ao general.", "power": 2, "cooldown": 60},
    "teleport": {"name": "Ataque Relâmpago", "desc": "O general e os dois batalhões mais próximos saltam para o ponto escolhido.", "radius": 0.35, "cooldown": 55},
}
ABILITY_BY_TITLE = [
    ("smite", ["Bibliotec", "Feiticeiro", "Vidente", "Criptek", "Neurotropo", "Psíquico", "Grão-Mestre"]),
    ("inspire", ["Capelão", "Comissário", "Apóstolo", "Cônega", "Pregador", "Etéreo", "Abadessa", "Profeta", "Arauto", "Santa", "Cardeal", "Senhor de Vraks"]),
    ("heal", ["Apotecário", "Sacerdote Sanguinário", "Haemonculus", "Doutor", "Medicae"]),
    ("shield", ["Mek", "Ferreiro", "Datasmith", "Dominus", "Manipulus", "Capitão-Escudo", "Ancião", "Castelão", "Vidente-Mor"]),
    ("summon", ["Mestre Infernal", "Patriarca", "Tirano da Colmeia"]),
    ("teleport", ["Lictor", "Mestre Supremo", "Rainha das Facas"]),
]
ABILITY_OVERRIDES = {
    "kharn": ("warcry", "Sangue para o Deus do Sangue!", {"power": 0.6}),
    "typhus": ("smite", "Enxame Destruidor", {"radius": 0.11}),
    "ahriman": ("smite", "Fogo de Tzeentch", {"power": 0.3}),
    "eldrad": ("shield", "Destino Selado", {"power": 0.5}),
    "imotekh": ("smite", "Tempestade de Relâmpagos", {"radius": 0.1}),
    "ghazghkull": ("inspire", "WAAAGH!", {"power": 0.25}),
    "yarrick": ("smite", "Olhar Malvado", {"power": 0.35, "radius": 0.05}),
    "calgar": ("shield", "Escudo de Macragge", {}),
    "mephiston": ("smite", "Tempestade de Sangue", {"power": 0.3}),
    "dante": ("warcry", "A Lança de Sanguinius", {"power": 0.5}),
    "celestine": ("heal", "Milagre da Viva Santa", {"power": 0.35, "radius": 0.24}),
    "draigo": ("teleport", "Caminhante da Disformidade", {}),
    "trajann": ("warcry", "Juramento dos Dez Mil", {}),
    "hive_tyrant": ("summon", "Ninhada Sináptica", {"unit": "termagants"}),
    "huron": ("warcry", "Fúria do Tirano", {}),
    "zuehlke": ("smite", "Barragem de Krieg", {"radius": 0.12, "power": 0.2}),
    "xaphan": ("inspire", "Sermão Apóstata", {}),
    "lelith": ("warcry", "Dança das Lâminas", {"power": 0.5}),
    "abaddon": ("warcry", "A Garra de Horus", {"power": 0.5}),
    "farsight": ("teleport", "Mont'ka", {}),
    "malidrach": ("summon", "Portal da Teia", {"unit": "dk_incubi", "power": 1}),
    "ankhu": ("summon", "Invocar Horrores", {"unit": "ts_horrors", "power": 1}),
    "tushan": ("shield", "Bigorna de Nocturne", {}),
    "voldus": ("smite", "Martelo do Imperador", {"power": 0.3}),
}


def general_ability(g):
    if g["id"] in ABILITY_OVERRIDES:
        t, name, extra = ABILITY_OVERRIDES[g["id"]]
    else:
        t = next((k for k, keys in ABILITY_BY_TITLE if any(w in g["title"] for w in keys)), "warcry")
        name, extra = None, {}
    a = OrderedDict([("type", t)])
    base = dict(ABILITY_TYPES[t])
    a["name"] = name or base.pop("name")
    base.pop("name", None)
    a["desc"] = base.pop("desc")
    a.update(base)
    a.update(extra)
    return a


# ------------------------------------------------------------ progressão dos generais
PROGRESSION = OrderedDict([
    ("Description", "Progressão dos generais e relíquias (tools/data/build_mechanics.py). levels: experiência de cada nível "
                    "(batalha +1, vitória +1, general inimigo derrubado +2); cada nível dá +3% no ataque e na defesa. "
                    "traits: traços ganhos pelo que o general fez (when). relics: por campanha, província -> relíquia; "
                    "um general próprio que esteja na província a reclama."),
    ("levels", [0, 3, 7, 12, 18, 26]),
    ("traits", [
        OrderedDict([("id", "tank_killer"), ("name", "Matador de Tanques"), ("when", "vehicles"), ("count", 3), ("attack", 0.08),
                     ("desc", "Venceu batalhas contra muitos blindados e monstros: +8% no ataque.")]),
        OrderedDict([("id", "wall"), ("name", "Muralha"), ("when", "defenseWins"), ("count", 2), ("defense", 0.12),
                     ("desc", "Segurou a linha duas vezes: +12% na defesa.")]),
        OrderedDict([("id", "conqueror"), ("name", "Conquistador"), ("when", "hives"), ("count", 2), ("attack", 0.06), ("move", 1),
                     ("desc", "Tomou duas cidades-colmeia: +6% no ataque e marcha uma província a mais.")]),
        OrderedDict([("id", "slayer"), ("name", "Matador de Generais"), ("when", "generalKills"), ("count", 1), ("attack", 0.1),
                     ("desc", "Derrubou um general inimigo: +10% no ataque.")]),
        OrderedDict([("id", "scarred"), ("name", "Cicatrizes de Guerra"), ("when", "wounds"), ("count", 1), ("defense", 0.08),
                     ("desc", "Voltou de um ferimento grave: +8% na defesa.")]),
        OrderedDict([("id", "dropmaster"), ("name", "Mestre do Desembarque"), ("when", "landingWins"), ("count", 1), ("support", 1),
                     ("desc", "Venceu um assalto vindo da órbita: +1 carga de apoio.")]),
        OrderedDict([("id", "veteran"), ("name", "Veterano de {body}"), ("when", "bodyBattles"), ("count", 3), ("attack", 0.05), ("defense", 0.05),
                     ("desc", "Três batalhas no mesmo mundo: +5% no ataque e na defesa.")]),
        OrderedDict([("id", "hunter"), ("name", "Caçador de Hereges"), ("when", "chaosWins"), ("count", 2), ("attack", 0.08),
                     ("desc", "Venceu os servos do Caos duas vezes: +8% no ataque.")]),
        OrderedDict([("id", "marked"), ("name", "Marca de {god}"), ("when", "chaosGeneralWins"), ("count", 3), ("attack", 0.1),
                     ("desc", "Os deuses notaram as suas vitórias: +10% no ataque.")]),
        # Traços negativos.
        OrderedDict([("id", "coward"), ("name", "Hesitante"), ("when", "defeats"), ("count", 3), ("attack", -0.08), ("defense", -0.04), ("negative", True),
                     ("desc", "Três derrotas abalaram a confiança: -8% no ataque, -4% na defesa.")]),
        OrderedDict([("id", "reckless"), ("name", "Imprudente"), ("when", "attackLosses"), ("count", 2), ("defense", -0.08), ("attack", 0.03), ("negative", True),
                     ("desc", "Ataca sem medir as forças: +3% no ataque, -8% na defesa.")]),
        OrderedDict([("id", "corrupted"), ("name", "Tocado pela Disformidade"), ("when", "corrupted"), ("count", 1), ("attack", 0.08), ("defense", -0.06), ("negative", True),
                     ("desc", "Aceitou um presente que não devia: +8% no ataque, -6% na defesa.")]),
    ]),
    ("relics", OrderedDict([
        ("armageddon", OrderedDict([
            ("hades", {"id": "yarrick_claw", "name": "Garra de Ferro de Yarrick", "attack": 0.15, "desc": "A garra de força do velho comissário: +15% no ataque."}),
            ("rok_fort", {"id": "ghazghkull_banner", "name": "Estandarte da Grande Waaagh!", "attack": 0.1, "support": 1, "desc": "O estandarte de Ghazghkull: +10% no ataque e +1 carga de apoio."}),
            ("vesperia_capital", {"id": "vesper_aquila", "name": "Águia de Vesper", "defense": 0.15, "desc": "Relíquia da cidadela: +15% na defesa."}),
        ])),
        ("damocles", OrderedDict([
            ("katuo", {"id": "dawn_blade", "name": "Lâmina do Alvorecer", "attack": 0.15, "desc": "Lâmina forjada de um metal desconhecido: +15% no ataque."}),
            ("kel_nest", {"id": "norn_crown", "name": "Coroa Norn", "support": 1, "defense": 0.1, "desc": "Um nódulo sináptico ancestral: +10% na defesa e +1 carga de apoio."}),
            ("pathos", {"id": "pathos_icon", "name": "Ícone de Pathos", "defense": 0.15, "desc": "O ícone sagrado da colmeia: +15% na defesa."}),
        ])),
        ("cadia", OrderedDict([
            ("kasr_kraf", {"id": "creed_cap", "name": "Quepe de Creed", "attack": 0.1, "defense": 0.1, "desc": "O quepe do Lorde Castelão: +10% no ataque e na defesa."}),
            ("vork_citadel", {"id": "talon_horus", "name": "Garra de Horus", "attack": 0.2, "desc": "A garra do Mestre de Guerra traidor: +20% no ataque."}),
            ("thyrr_pyramid", {"id": "staff_light", "name": "Cajado da Luz Eterna", "support": 2, "desc": "Um cetro de Faraó: +2 cargas de apoio."}),
            ("ulthwe_dome", {"id": "spear_twilight", "name": "Lança do Crepúsculo", "attack": 0.12, "move": 1, "desc": "Arma de um herói eldar: +12% no ataque e marcha extra."}),
        ])),
        ("great_game", OrderedDict([
            ("relicary", {"id": "emperor_sword", "name": "Espada do Imperador", "attack": 0.2, "defense": 0.05, "desc": "Uma lâmina da Cruzada Indomitus: +20% no ataque, +5% na defesa."}),
            ("lumen", {"id": "helm_ultramar", "name": "Capacete de Ultramar", "defense": 0.15, "support": 1, "desc": "Um elmo dos Senhores de Macragge: +15% na defesa e +1 carga de apoio."}),
            ("sk_throne", {"id": "gorechild", "name": "Gorechild", "attack": 0.25, "desc": "O machado-serra de Angron: +25% no ataque."}),
            ("ix_tower", {"id": "book_magnus", "name": "Livro de Magnus", "support": 2, "desc": "Páginas do grimório do Rei Carmesim: +2 cargas de apoio."}),
            ("mv_garden", {"id": "silence", "name": "Silêncio", "defense": 0.2, "desc": "A foice de Mortarion: +20% na defesa."}),
            ("ly_palace", {"id": "laer_blade", "name": "Lâmina de Laer", "attack": 0.15, "move": 1, "desc": "A espada de Fulgrim: +15% no ataque e marcha extra."}),
        ])),
        ("badab", OrderedDict([
            ("tyrant_palace", {"id": "tyrant_crown", "name": "Coroa do Tirano", "attack": 0.1, "defense": 0.15, "desc": "A coroa de Huron: +10% no ataque e +15% na defesa."}),
            ("cr_hall", {"id": "trophy_axe", "name": "Machado dos Troféus", "attack": 0.2, "desc": "O machado ancestral dos Executioners: +20% no ataque."}),
            ("ma_keep", {"id": "codex_page", "name": "Página do Codex Astartes", "defense": 0.1, "support": 1, "desc": "Uma página escrita por Guilliman: +10% na defesa e +1 carga de apoio."}),
        ])),
        ("vraks", OrderedDict([
            ("cathedral", {"id": "black_chalice", "name": "Cálice Negro de Xaphan", "support": 2, "desc": "O cálice profanado do cardeal: +2 cargas de apoio."}),
            ("citadel", {"id": "vraks_keys", "name": "Chaves do Arsenal", "attack": 0.1, "defense": 0.1, "desc": "As chaves dos depósitos de Vraks: +10% no ataque e na defesa."}),
            ("wr_throne", {"id": "brass_collar", "name": "Colar de Bronze", "defense": 0.2, "attack": 0.05, "desc": "Um colar de Khorne que repele a feitiçaria: +20% na defesa, +5% no ataque."}),
        ])),
        ("baal", OrderedDict([
            ("arx", {"id": "blood_chalice", "name": "Cálice Vermelho", "defense": 0.15, "support": 1, "desc": "O cálice sagrado dos Sacerdotes Sanguinários: +15% na defesa e +1 carga de apoio."}),
            ("lv_heart", {"id": "norn_queen", "name": "Glândula da Rainha Norn", "attack": 0.2, "desc": "Um órgão da Mente da Colmeia: +20% no ataque."}),
        ])),
        ("ultramar", OrderedDict([
            ("archive", {"id": "guilliman_scroll", "name": "Pergaminho de Guilliman", "defense": 0.12, "attack": 0.08, "desc": "Notas do Primarca: +12% na defesa, +8% no ataque."}),
            ("tm_garden", {"id": "plague_bell", "name": "Sino da Praga", "attack": 0.12, "support": 1, "desc": "O sino que anuncia a Death Guard: +12% no ataque e +1 carga."}),
        ])),
        ("sautekh", OrderedDict([
            ("km_pyramid", {"id": "sautekh_staff", "name": "Cetro de Sautekh", "support": 2, "desc": "O cetro da dinastia: +2 cargas de apoio."}),
            ("sept_city", {"id": "ethereal_honor", "name": "Lâmina de Honra Etérea", "defense": 0.15, "desc": "A lâmina cerimonial da seita: +15% na defesa."}),
            ("or_fort", {"id": "big_choppa", "name": "Machadão do Kaudilho", "attack": 0.2, "desc": "O maior machado da Waaagh!: +20% no ataque."}),
        ])),
        ("thaurus", OrderedDict([
            ("forge_mother", {"id": "stc_core", "name": "Núcleo do Arquivo STC", "defense": 0.15, "support": 1, "desc": "O coração do arquivo: +15% na defesa e +1 carga de apoio."}),
            ("lc_convent", {"id": "lucrecia_mantle", "name": "Manto de Santa Lucrécia", "defense": 0.15, "attack": 0.05, "desc": "O manto da santa padroeira: +15% na defesa, +5% no ataque."}),
            ("crystal_archive", {"id": "crystal_eye", "name": "Olho de Cristal", "support": 2, "desc": "Um fragmento do olho de Magnus: +2 cargas de apoio."}),
            ("vs_gate", {"id": "vect_crown", "name": "Diadema Sombrio", "attack": 0.15, "move": 1, "desc": "Um diadema de Commorragh: +15% no ataque e marcha extra."}),
            ("tb_vault", {"id": "liber_daemonica", "name": "Liber Daemonica", "attack": 0.1, "defense": 0.1, "desc": "O livro sagrado dos Cavaleiros Cinzentos: +10% no ataque e na defesa."}),
        ])),
    ])),
])


def main():
    fac = load("factions.json")
    for f, data in fac["factions"].items():
        if f in SPECIALS:
            sp = json.loads(json.dumps(SPECIALS[f]), object_pairs_hook=OrderedDict)
            if not sp["icon"]:
                sp["icon"] = data.get("portrait")
            data["special"] = sp
        if f in PACTS:
            data["pact"] = PACTS[f]
        data["morale"] = MORALE.get(f, 1)
        data["warcry"] = WARCRY.get(f, "imperial")
        data["ships"] = SHIPS.get(f, "imperial")
    for data in fac["factions"].values():
        if data.get("currencyShort", "").endswith("."):
            data["currencyShort"] = data["currencyShort"].rstrip(".")
    t = fac["factions"]["tyranids"]
    t["currency"] = "Essência"
    t["currencyShort"] = "Ess"
    fac["Description"] = fac["Description"].split(" Mecânicas (v0.6):")[0] + (
        " Mecânicas (v0.6): special (recurso especial e rituais), pact (diplomacia), morale (moral na batalha 2D, 0 = sem debandada),"
        " warcry (grito de guerra) — ver tools/data/build_mechanics.py.")
    save("factions.json", fac)

    units = load("units.json")
    for f, (uid, portrait) in SPAWNS.items():
        units[f] = [u for u in units[f] if u["id"] != uid] + [spawn_unit(uid, portrait)]
    # Krieg: a infantaria (e a artilharia de campanha) sabe se entrincheirar.
    for f, lst in units.items():
        if f == "Description":
            continue
        for u in lst:
            u.pop("entrench", None)
            if (f == "krieg" and (u["category"] == "infantry" or u["id"] == "kr_earthshaker")) or "Krieg" in u["name"]:
                u["entrench"] = True
    for f, sp in SPECIALS.items():
        for r in sp["rituals"]:
            if r["effect"]["type"] == "spawn":
                assert any(u["id"] == r["effect"]["unit"] for u in units[f]), (f, r["effect"]["unit"])
    save("units.json", units)
    save("progression.json", PROGRESSION)
    gens = load("generals.json")
    for g in gens["generals"]:
        g["ability"] = general_ability(g)
    save("generals.json", gens)

    sectors = {sc["id"]: load(sc["sector"]) for sc in load("scenarios.json")["scenarios"]}
    for sc, relics in PROGRESSION["relics"].items():
        pids = {p["id"] for b in sectors[sc]["bodies"] for p in b.get("provinces", [])}
        for pid in relics:
            assert pid in pids, (sc, pid)
    print("especiais:", len(SPECIALS), "facções; relíquias:", sum(len(v) for v in PROGRESSION["relics"].values()))


if __name__ == "__main__":
    main()
