# 40k Wars (0 A.D. 0.29)

Grande estratégia gótica no universo Warhammer 40.000. Pasta `40k_wars`,
nome interno `40k_wars`. **Não depende de outros mods**; ative só ele:

```
mod public 40k_wars
```

O mod troca o **menu principal** por um menu próprio no estilo gótico do
warhr, com a batalha de Armageddon de fundo (zoom e pan lentos) e só os
botões essenciais: **Iniciar Cruzada** (vai direto para a escolha da
facção), Continuar Cruzada, Carregar Cruzada, Opções, Mods e Sair. Para
voltar ao menu normal do 0 A.D., desative o mod em "Mods".

## Campanhas

| Campanha | Sistema | Facções (todas jogáveis, as outras pela IA) | Vitória |
|---|---|---|---|
| Cruzada de Armageddon | Sistema Armageddon | Guarda Imperial, Orks | Colmeias de Armageddon |
| Invasão Tirânida | Golfo de Damocles (Agrellan, Prefectia, Dal'yth, Kel-Morai e estações) | Imperium, Império Tau, Frota-Colmeia Gorgon | Colmeias de Agrellan |
| 13ª Cruzada Negra | Portão de Cadia (Cadia, Bastião Ultima, Agripinaa, Vor'kaas, Mundo-Nave Ulthwé, Thyrr) | Imperium, Legião Negra, Eldar de Ulthwé, Necrons | Kasrs de Cadia |
| O Grande Jogo dos Deuses | Vigil Aeterna (Aeternum Sanctus, Fortaleza-Estelar Vigil, Barca Sangue Eterno, Prometeu Menor e os mundos-demônio Skarvos, Mortis Vel, Ixathar e Lysandrae) | World Eaters, Death Guard, Thousand Sons, Emperor's Children; Ultramarines, Blood Angels e Salamandras aliados | Relicários de Aeternum |

"Iniciar Cruzada" abre a escolha da campanha e depois a do lado. Em todas,
vence quem controlar as cidades-colmeia do planeta principal ou expulsar os
inimigos. Com três ou quatro facções, todas lutam entre si. No Grande Jogo,
as quatro legiões lutam umas contra as outras, e os três capítulos são
**aliados** (`teams` em `scenarios.json`): não se atacam, passam pelas
províncias uns dos outros e vencem juntos.

**Facções** (retratos das pranchas em `tools/source/sheets/`):
- **Guarda Imperial**: além das unidades de antes, Armas Especiais,
  Lança-Chamas, Ogryns, Bullgryns, Atiradores Ratling, Hellhound, Manticore,
  Hydra, Vendetta e o super-pesado Baneblade; aliados Astartes, Sororitas,
  Mechanicus e agentes.
- **Orks**: Grots, Kommandos, Rapazes Foguete, Lança-Chamas, Lootas,
  Caça-Tanques, Meganobz, motos, Vagão de Batalha, Deffkoptas, Burna-Bommer,
  Grandes Kanhões, Killa Kans, Deff Dread, Gorkanaut e Stompa; generais novos
  Buzzgob e Grotsnik.
- **Tiranídeos** (Frota-Colmeia Gorgon): enxames baratos (Termagantes,
  Hormagantes, Gárgulas), Genestealers, Guerreiros, Lictor, Zoantropos,
  Carnifex, Mawloc, Tervigon... "Devorar" no lugar de saquear (muito mais
  biomassa, até nas colmeias); na biomassa andam e aguentam mais. Generais:
  Tirano da Colmeia, Velho Olho Vermelho, Saltador da Morte, Patriarca,
  Neurotropo.
- **Caos** (Legião Negra): Cultistas, Marines do Caos, Havocs, Raptores,
  Garras da Disformidade, Escolhidos, Exterminadores, Possuídos, Rhino,
  Predator, Obliteradores, Profanador. "Profanar"; mais fortes no solo da
  disformidade. Generais: Abaddon, Haarken, Zaraphiston, Jarulek, Vorkh.
- **Eldar** (Ulthwé): Guardiões, Vingadores, Patrulheiros, Banshees,
  Escorpiões, Dragões de Fogo, Ceifadores, Falcões, Aranhas da Disformidade,
  Guarda Espectral, Jetbikes, Falcão. Portal da Teia e Tempestade Eldritch sem
  frota. Generais: Eldrad Ulthran, Taldeer, Jain Zar, Karandras, Fuegan.
- **Necrons** (Dinastia Sautekh): Guerreiros, Imortais, Marcadores da Morte,
  Esfolados, Guarda-Lych, Pretorianos, Escaravelhos, Espectros, Skorpekh,
  Aranha, Destruidores, Arca do Juízo Final, Monólito. Protocolos de
  reanimação: na batalha, os batalhões se reparam quando param de levar dano.
  Generais: Imotekh, Trazyn, Orikan, Anrakyr.
- **Tau**: Guerreiros de Fogo, Rompedores, Batedores, Kroot, Vespídeos,
  Drones, Trajes Furtivos, Crisis, Broadsides, Riptide, Piranha, Devilfish,
  Hammerhead, Sky Ray (os skimmers atravessam água e pântano). Generais:
  Farsight, Sombra do Sol, Aun'Va, Anghkor Prok.

- **World Eaters** (Khorne): Jakhals, Berzerkers, Oito-Vinculados (e
  Exaltados), Exterminadores, Sanguinários, Esmagadores de Sangue, Cães de
  Carne, Canhão de Crânios, Rhino, Helbrute, Demônio-Forja,
  Demônio-Triturador. +15% de ataque; "Colher Crânios". Generais: Khârn,
  Invocatus, Vorrak.
- **Death Guard** (Nurgle): Andarilhos da Peste, Marines da Peste (e com
  Lança-Pragas), Blightlords, Mortalha, os especialistas (Contador, Prole
  Fétida, Biologus, Portador da Peste), Rhino, Blight-hauler, Drone Fétido,
  Plagueburst. Regeneram na batalha e lutam melhor no pântano; "Semear a
  Praga". Generais: Typhus, Felthius, Crullis Brax.
- **Thousand Sons** (Tzeentch): Cultistas, Tzaangors, Rubricae (bolter e
  chama disforme), Escaravelho Oculto, Xamã, Iluminados, Horrores Rosados,
  Gritadores, Rhino, Helbrute, Mutalith, Profanador. Mais alcance na
  disformidade; "Pilhar Conhecimento". Generais: Ahriman, Amon, Ankhu Anen.
- **Emperor's Children** (Slaanesh): Atormentadores, Infratores, Marines
  do Ruído (e com Blastmaster), Exterminadores, Demonetes, Buscadoras,
  Demônios de Slaanesh, Guardiã dos Segredos (única), Rhino, Predator, Land
  Raider, Demônio-Triturador. Os mais rápidos; "Banquete de Excessos".
  Generais: Lucius, Xantine, Vhorasse.
- **Ultramarines**: Intercessores, Assalto, Sternguard, Batedores,
  Hellblasters, Agressores, Inceptores, Atiradores, Apotecário,
  Erradicadores, Redemptor, Repulsor, Predator. Mais Requisição. Generais:
  Calgar, Tigurius, Sicarius, Uriel Ventris.
- **Blood Angels**: Intercessores, Veteranos de Assalto, Batedores,
  Lâmina-Guarda, Inceptores, Companhia da Morte, Guarda Sanguinária,
  Exterminadores de Assalto, Baal Predator, Furioso, Dreadnought da
  Companhia da Morte, Stormraven. +12% de ataque. Generais: Dante,
  Mephiston, Lemartes, Corbulo.
- **Salamanders**: Intercessores, Assalto, Batedores, Lâmina-Guarda,
  Infernus, Erradicadores, Vanguarda de Salto, Exterminadores de Prometeu,
  Tecnomarine, Apotecário, Invictor, Redemptor, Land Raider Redeemer,
  Gladiator Lancer. Mestres do fogo. Generais: Tu'Shan, Vulkan He'stan,
  Elysius, Bray'arth Ashmantle.

Unidades especialistas causam mais dano a veículos, infantaria ou aeronaves
(`vsVehicle`, `vsInfantry`, `vsAir` em `units.json`). Terrenos novos:
biomassa tiranídea, solo da disformidade e complexo tumular.

## Como se joga

- **Ficha da unidade**: clique num batalhão (ou no retrato do painel, também
  no desdobramento e na batalha) para abrir a ficha grande: retrato em
  destaque, custo, poder, alcance, velocidade, blindagem, especialidades,
  afinidades de terreno, descrição e uma fala. Nas listas de recrutar e de
  generais, use o botão direito. Esc ou clique fecha.
- **Som**: música própria no menu, no mapa da campanha e na batalha; na
  batalha 2D, tiros (laser, bolter, autocanhão, canhão, artilharia),
  lança-chamas, espadas-serra, explosões, bombardeiros, cápsulas e lança
  orbital. Volume em Opções (música e interface).

**Sistema estelar** (999.M41, Sistema Armageddon): a estrela, as órbitas, os
planetas com as suas luas e satélites, e as frotas.
- Planetas e luas: Armageddon (mundo-colmeia) com a Doca de São Jowen (estação
  orbital), Caldera Tertius (mineiro) com Caldera Minoris (lua gelada),
  Vesperia (agrícola) e o Rok de Gorkamorka (asteroide Ork).
- Clique num corpo para selecioná-lo; clique de novo para abrir o mapa dele.
- **Frotas**: selecione e clique com o botão direito num corpo para viajar
  (lua ↔ planeta: 1 turno; entre planetas, pela distância). Frotas inimigas no
  mesmo corpo travam batalha espacial no fim do turno (a perdedora recua ou é
  destruída, com os exércitos a bordo). Estaleiros lançam naves.

**Mapa do planeta**: províncias com a cor do dono, cidades-colmeia, fortes,
estaleiros, guarnições e exércitos (retrato do general num anel da cor da
facção).
- Selecione um exército e clique com o botão direito numa província vizinha:
  seta verde = marchar, espadas vermelhas = atacar.
- **Guarnição**: batalhões que ficam na província e a defendem (metade da
  manutenção). Botões "→ Guarnição" / "→ Exército" trocam batalhões.
- **Recrutar** em província própria (Leman Russ, Valkyrie, Vagão Saqueado e
  Dakkajet exigem cidade ou fortaleza). **Contratar general** cria um exército.
- **Embarcar**: o exército sobe na frota em órbita (1 exército por nave).
  Com a órbita livre de inimigos, desembarca em qualquer província do corpo
  (vazia: ocupa; inimiga: assalto do espaço com -15% de força).
- **Bombardeio orbital**: uma frota com a órbita sob controle bombardeia uma
  província inimiga por turno (guarnição e fortes sofrem; a província fica
  devastada por 1 turno).
- **Saque**: um exército numa província tomada neste turno ou no anterior
  pode saqueá-la — bastante dinheiro na hora (Orks +50%), mas ela fica
  **devastada** por 4 turnos (rendimento a 25%, sem fortes). A IA dos Orks
  saqueia boa parte do que conquista (menos as colmeias).
- **Efeitos animados** nas províncias (`ui/Fx.js`): feixes orbitais e
  explosões no bombardeio, explosão e incêndio no saque, choque de armas nas
  batalhas, cápsulas no desembarque, anel da cor da facção na conquista;
  províncias devastadas ficam queimando com a cor escurecida. No sistema,
  batalhas espaciais explodem em volta do corpo. Os efeitos das ações da IA
  tocam quando você abre o mapa do corpo.
- Fim de turno: a IA joga, as frotas viajam, a economia rende (Requisição /
  Dentes), batalhões em território próprio repõem 15% de força, generais
  feridos se recuperam.
- Vitória: todas as cidades-colmeia de Armageddon, ou expulsar o inimigo.

**Batalha**: ao atacar (ou ser atacado) aparece a janela com as forças, a
chance estimada e o apoio disponível.
- *Resolver Automaticamente*: decide pela força (batalhões, experiência,
  general, fortes, colmeia, montanhas, desembarque).
- *Desdobrar e Comandar*: abre o **desdobramento tático** — o campo com o
  terreno da província e as feições (ruínas, crateras, colinas, florestas,
  água) que o mapa da batalha vai ter, nas mesmas posições. Clique num
  batalhão (o líder aparece e diz uma frase) e clique no campo para
  posicioná-lo na sua zona. Ordens por batalhão: Avançar, Manter posição,
  Flanquear (esq./dir.), Reserva. Planos prontos: Ataque Total, Linha
  Defensiva, Martelo e Bigorna, Pinça. O inimigo mostra o desdobramento dele.
- **Batalha 2D em tempo real** (a batalha 3D está desligada por enquanto,
  ver `legacy_3d/`): no mesmo campo do desdobramento, os batalhões (retrato
  do líder com barra de força) marcham, atiram (clarões nos alvos), lutam
  corpo a corpo (faíscas) e morrem (explosão ou sangue). Terreno conta:
  ruínas, florestas, crateras e rochedos dão cobertura; colinas, alcance;
  água atrasa. Fortes e colmeias protegem o defensor; generais dão +15% de
  dano a quem estiver perto.
  - Clique num batalhão seu: o líder aparece no painel e diz uma frase.
  - Botão direito no campo: o selecionado vai até lá e segura; botão
    direito num inimigo: ataca aquele batalhão.
  - Painel: ordem do selecionado (Avançar, Manter, Flanquear, Reserva,
    Recuar), ordens gerais (Ataque Geral, Segurar Linha, RETIRADA!),
    velocidade x1/x2/x4, pausa (com ordens) e "Resolver o resto".
- **Apoio estilo killstreak**: cada poder tem uma barra que enche com as
  baixas que você causa; cheia, clique no poder e depois no alvo (botão
  direito cancela). Guarda: Cápsula de Desembarque (reforço cai do céu),
  Bombardeio de Marauders (passagem em linha), Lança Orbital, Bombardeio
  Orbital (atinge também os seus). Orks: Teleporta de Rapazes, Bombardeio
  de Dakkajets, Chuva de Rokks. Cápsulas e ataques orbitais exigem **frota
  própria na órbita** do planeta; com aeronave no exército os bombardeiros
  enchem mais rápido; generais começam com cargas prontas. O inimigo usa os
  dele onde você estiver mais junto.
- **Terreno**: o terreno da província e as feições do campo dão bônus e
  penalidades conforme a categoria — ruínas e florestas protegem a
  infantaria e atrasam veículos; colinas dão alcance e dano; água atrasa
  todos; planícies e ermos favorecem blindados; colmeias e estações cortam o
  alcance dos veículos; aeronaves ignoram as feições. Cada unidade pode ter
  afinidades próprias (`units.json: terrain`): a Sentinela anda bem na
  selva, a Chimera é anfíbia, os Rapazes lutam melhor na selva, os Skitarii
  nos ermos, o Eversor nas ruínas; Marines de Assalto e Serafins
  (mochilas de salto) ignoram as penalidades de movimento. As dicas das
  feições, o painel do desdobramento, o da batalha e o recrutamento mostram
  os efeitos.
- Um lado reduzido a 25%, diante do dobro, **debanda** e foge para a sua
  borda (quem sai escapa; quem fica 30 s depois é pego). Em 5 minutos sem
  decisão, o defensor segura a província. "Sair" no meio da batalha é uma
  retirada geral. O resultado (força de cada batalhão, general vivo ou
  ferido, conquista) volta para a campanha.

**Generais** (com retrato, traço e frases): Guarda — Sebastian Yarrick,
Ursarkar E. Creed, "Ferro" Straken, Ciaphas Cain, Ibram Gaunt, Lorde General
Sturnn. Orks — Ghazghkull Mag Uruk Thraka, Gorgutz 'Ead'unter, Nazdreg,
Wazdakka Gutsmek, Zagstruk, Velho Zogwort. Um general cujo exército é
destruído (ou que cai na batalha) fica ferido por 4 turnos e depois pode ser
recontratado. Heróis aliados do Império também podem ser contratados:
Capitão Erasmus Tycho (Anjos Sangrentos), Capelão Grimaldus (Templários
Negros), Canonisa Veridyan e o Magos Dominus Kord-Ixion.

**Forças aliadas do Império** (abas em "Recrutar"; ícones de
`tools/source/imperium_forces.png`, recortados por `tools/art/slice_imperium.py`):
| Força | Unidades | Exige |
|---|---|---|
| Astra Militarum | as da Guarda + Armas Pesadas, Artilharia, Comissário | — |
| Adeptus Astartes | Intercessores, Marines de Assalto, Devastadores, Exterminadores, Dreadnought | frota própria na órbita |
| Adepta Sororitas | Irmãs de Batalha, Retribuidoras, Serafins, Exorcista | cidade-colmeia |
| Adeptus Mechanicus | Patrulheiros Skitarii, Sicários, Kataphron, Onager, Skorpius | estaleiro ou zona industrial |
| Agentes do Imperium | Inquisidor, Custódios, Cavaleiros Cinzentos, Eversor, Deathwatch | únicos na cruzada | Cada batalhão tem um líder com nome (Sargento Kell, Nob
Grimgob...) e ganha experiência (níveis •, +10% de força cada).

## Facções

| Facção | Estado |
|---|---|
| Guarda Imperial | jogável, com as forças aliadas acima |
| Orks da Waaagh! | jogável |
| Eldar de Ulthwé | jogável (13ª Cruzada Negra) |
| Tiranídeos, Tau | jogáveis (Invasão Tirânida) |
| Caos, Necrons | jogáveis (13ª Cruzada Negra) |
| World Eaters, Death Guard, Thousand Sons, Emperor's Children | jogáveis (O Grande Jogo dos Deuses) |
| Ultramarines, Blood Angels, Salamanders | jogáveis e aliados entre si (O Grande Jogo dos Deuses) |

Para ativar uma facção nova: as unidades em `units.json` (com retratos),
os poderes em `support.json`, os generais em `generals.json` e `enabled: true`.

## Batalha 3D guardada (`legacy_3d/`)

A batalha 3D (mapa aleatório, gatilhos, Orks recoloridos, painéis da
partida) dependia do mod warhr e foi tirada do caminho: tudo está em
`legacy_3d/`, que o jogo não carrega. Para voltar: mover as pastas de volta
para a raiz do mod, pôr `"warhr"` nas dependências do `mod.json`, trocar
`startBattle` por um lançamento de partida (ver a versão 0.1 em
`legacy_3d/`) e reincluir `gamesettings/` no `WH40K.xml`.

## Estrutura

| Pasta / arquivo | O quê |
|---|---|
| `campaigns/wh40k.json` | Entrada da campanha (interface `wh40k`). |
| `campaigns/wh40k/data/` | `sector.json` (sistema, corpos, províncias, exércitos e frotas iniciais), `factions.json`, `units.json`, `generals.json`, `support.json`; `planets/<corpo>.json` é gerado. |
| `gui/campaigns/wh40k/core/` | Regras sem interface: `Data.js`, `Game.js` (estado, economia, movimento, frotas, saque, eventos, batalhas automáticas), `AI.js`, `Battle.js` (feições, desdobramento, planos, apoio, ponte com a batalha 2D), `Combat.js` (simulação da batalha 2D). |
| `gui/campaigns/wh40k/ui/` | `Page.js` (fluxo, turnos, diálogos, tique), `SystemView.js`, `PlanetView.js`, `SidePanel.js`, `DeployView.js`, `BattleView.js` (batalha 2D), `Fx.js` (efeitos animados). |
| `gui/pregame/` | Menu principal do mod (painel, botões, fundo, logotipo). |
| `campaigns/wh40k/data/scenarios.json` | As campanhas: setor, facções, lados jogáveis, objetivo, textos. |
| `campaigns/wh40k/data/sector_damocles.json`, `sector_cadia.json` | Setores das campanhas novas (gerados por `tools/data/build_sectors.py`). |
| `tools/data/build_great_game.py` | O Grande Jogo dos Deuses: as quatro legiões, os três capítulos, generais, apoios, setor e cenário. |
| `tools/audio/gen_sfx.py` | Efeitos sonoros da batalha, sintetizados (`audio/interface/wh40k/`). |
| `audio/music/` | Músicas (Kevin MacLeod, CC-BY 4.0; créditos em `audio/music/CREDITS.txt`). `gui/common/music.js` troca as músicas do menu. |
| `tools/data/build_factions.py` | Unidades, generais, apoios e dados das facções novas (e retratos novos da Guarda e dos Orks). |
| `tools/art/slice_sheets.py` | Recorta as pranchas 4×4 de `tools/source/sheets/` em retratos 256×256 (`portraits/<prancha>/r<l>c<c>.png`). |
| `tools/art/gen_menu.py` | Arte do menu: fundo (`tools/source/menu_background.png`), logotipo e as texturas góticas do warhr copiadas para cá. |
| `tools/art/terrain_tex.py` | Texturas procedurais de terreno (colmeia, indústria, cinzas, selva, pântano, montanhas, planícies, gelo, rocha, estação, mar) usadas pelos mapas e pelo fundo do campo de batalha. |
| `tools/art/gen_fx.py` | Quadros dos efeitos animados (`art/textures/ui/campaigns/wh40k/fx/`): explosão, impacto, sangue, feixe orbital, cápsula, fogo, fumaça, anel, choque, lança. |
| `tools/art/slice_imperium.py` | Recorta `tools/source/imperium_forces.png` (5 × 11 cartas) nos ícones das forças aliadas (`portraits/imperium/<id>.png`). |
| `tools/art/slice_portraits.py` | Recorta as colagens de `tools/source/` em retratos 256×256 (`art/textures/ui/wh40k/portraits/<facção>/r<linha>c<coluna>.png`). |
| `tools/art/gen_planets.py` | Gera mapas dos corpos, máscaras das províncias, vizinhança, globos, fundo do sistema, ícones, fundos do desdobramento, emblemas e banner. Rode de novo depois de mudar `sector.json`. |
| `legacy_3d/` | A batalha 3D guardada (não carregada). |

## Testes

- `sh tools/test/campaign_sim.sh [turnos] [facção] [campanha]`: campanha inteira no `gjs`, as duas facções pela IA (economia, IA, frotas, batalhas, saque).
- `SCENARIO=<campanha> sh tools/test/gui_sim.sh [facção]`: a interface com objetos de GUI falsos (escolha da facção, vistas, frases, recrutamento por força aliada, ataque, desdobramento, batalha 2D com ordens e apoio até o fim, relatório, saque e efeitos, 15 turnos).
- `sh tools/test/combat_sim.sh [batalhas]`: batalhas 2D aleatórias sem interface (duração, debandadas, se o mais forte vence).
- `sh tools/test/guishot.sh <pasta> [new planet system army deploy battle sack]`: abre o jogo numa janela direto na campanha e tira capturas (`BURST=n` para uma sequência). Com a tela bloqueada, use um X aninhado: `Xephyr :5 -screen 1366x768 -ac -noreset &` e `DISPLAY=:5 IMPORT_ARGS="-display :5"`.

## Próximos passos

- Eldar, Tau, Necrons e Tiranídeos também em Armageddon; capítulos Astartes aliados da Guarda nas outras campanhas.
- Volta da batalha 3D (com modelos próprios dos Orks), mantendo a 2D como opção.
- Mais sistemas estelares ligados por rotas de disformidade.
- Reforços chegando de províncias vizinhas durante a batalha; batalhas
  espaciais jogáveis; torres e fortificações no campo para o defensor.

## Licença e direitos

Código em GPL 3 (`LICENSE`). Warhammer 40.000 e os nomes dos personagens
pertencem à Games Workshop; este é um mod de fã, sem fins comerciais. Os
retratos e ícones vêm das imagens em `tools/source/`; as músicas são de
Kevin MacLeod (incompetech.com), CC-BY 4.0 (`audio/music/CREDITS.txt`); os
efeitos sonoros são sintetizados pelo próprio mod; os modelos 3D da
pasta `legacy_3d/` vêm do warhr (confira a licença antes de distribuir).
