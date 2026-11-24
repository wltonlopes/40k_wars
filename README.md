# 40k Wars (0 A.D. 0.29)

Grande estratégia gótica no universo Warhammer 40.000. Pasta `40k_wars`,
nome interno `40k_wars`. **Não depende de outros mods**; ative só ele:

```
mod public 40k_wars
```

O mod troca o **menu principal** por um menu próprio no estilo gótico do
warhr, com um fundo sorteado a cada abertura — a batalha de Armageddon, a
batalha gótica sob o céu infernal ou a vidente eldar (zoom e pan lentos;
imagens em `tools/source/menu_background.png` e `tools/source/menu/`) — e só os
botões essenciais: **Iniciar Cruzada** (campanha, lado e dificuldade),
Continuar Cruzada, Carregar Cruzada, **Códex** (todas as facções, unidades,
generais e rituais, com as fichas), Opções, Mods e Sair. Para
voltar ao menu normal do 0 A.D., desative o mod em "Mods".

## Campanhas

| Campanha | Sistema | Facções (todas jogáveis, as outras pela IA) | Vitória |
|---|---|---|---|
| Cruzada de Armageddon | Sistema Armageddon | Guarda Imperial, Orks | Colmeias de Armageddon |
| Invasão Tirânida | Golfo de Damocles (Agrellan, Prefectia, Dal'yth, Kel-Morai e estações) | Imperium, Império Tau, Frota-Colmeia Gorgon | Colmeias de Agrellan |
| 13ª Cruzada Negra | Portão de Cadia (Cadia, Bastião Ultima, Agripinaa, Vor'kaas, Mundo-Nave Ulthwé, Thyrr) | Imperium, Legião Negra, Eldar de Ulthwé, Necrons | Kasrs de Cadia |
| O Grande Jogo dos Deuses | Vigil Aeterna (Aeternum Sanctus, Fortaleza-Estelar Vigil, Barca Sangue Eterno, Prometeu Menor, Nau Negra Égide e os mundos-demônio Skarvos, Mortis Vel, Ixathar e Lysandrae) | World Eaters, Death Guard, Thousand Sons, Emperor's Children; Ultramarines, Blood Angels, Salamandras e Grey Knights aliados | Relicários de Aeternum |
| A Profanação de Thaurus | Thaurus (Thaurus Prime, Santa Lucrécia, Bastião Áureo, Nau Negra Égide, Morbus, Sekhmet Vul, Âncora de Vel'Sharra) | Mechanicus, Sororitas, Custódios e Grey Knights aliados; Drukhari, Death Guard, Thousand Sons | Forjas de Thaurus |
| A Guerra de Badab | Badab (Badab Primaris, Fortaleza Garra Astral, Carcharias, Frota Nocturne, Ancoradouro de Macragge, Doca do Segmentum, Rocha do Maelstrom) | Secessionistas de Badab (Astral Claws, Legião do Tirano, Lamenters, Mantis Warriors, Executioners); Salamandras, Ultramarines e Guarda Imperial aliados | Colmeias de Badab |
| O Cerco de Vraks | Vraks (Vraks Prime, Vraks Menor, Doca de Krieg, Nau Negra Silêncio, Fenda de Sangue) | Death Korps of Krieg e Grey Knights aliados; Rebeldes de Vraks e World Eaters aliados | Cidadelas de Vraks |
| O Cerco de Baal | Baal (Baal, Baal Primus, Baal Secundus, Navio-Colmeia Leviatã, Ancoradouro do Anjo) | Blood Angels; Frota-Colmeia Leviatã | Fortalezas de Baal |
| A Guerra da Praga | Iax (Iax, Espandor, Frota de Macragge, Nau da Praga) | Ultramarines e Guarda Imperial aliados; Death Guard | Cidades de Iax |
| O Despertar de Sautekh | Dal'ryn (Dal'ryn, Kheperah, Estação Kor'vattra, Rok Gorkamorka) | Império Tau, Necrons, Orks | Cidades de Dal'ryn |

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

## Novidades da versão 0.8

- **Três idiomas: inglês (padrão), português e espanhol.** O botão
  *Language* no menu principal alterna entre eles (opção
  `wh40k.language`; sem ela, segue o idioma do jogo). Os textos do código
  e dos dados continuam escritos em português, que serve de chave; as
  traduções ficam em `campaigns/wh40k/lang/en.json` e `es.json` (4.387
  textos, inclusive nomes de unidades, generais, frases, eventos e nomes de
  naves). A tradução é feita na hora de mostrar (`core/0_Lang.js`): troca
  as frases conhecidas, da mais longa para a mais curta, também dentro de
  frases montadas com nomes e números, sem mexer nas marcações de cor.
  Até o registro de saves antigos aparece no idioma escolhido.
- **Poderes especiais dos generais** na batalha 2D (botão no painel, alvo
  no mapa, recarga): golpe (dano em área), grito de guerra (ataque),
  escudo (defesa), cura, inspiração (sem pânico, velocidade e dano),
  invocação (traz um batalhão) e teleporte. Cada general tem o seu
  (nome, descrição, raio, duração, recarga em `generals.json`); a IA
  também usa os poderes dela.
- **Cinemática de introdução:** ao começar uma campanha, seis quadros
  (`tools/source/cinematic/`, gerados por `tools/art/gen_cinematic.py`;
  Badab e Vraks têm quadros, câmera e narração próprios em
  `tools/source/cinematic/<campanha>/` e `WH40K_CINEMAS` no Cinematic.js)
  com zoom e deslocamento lentos, passagem pelo preto, faixas de cinema e
  narração escrita letra a letra, montada com a campanha (ano, abertura,
  objetivo), a sua facção, os aliados, os inimigos e o seu general.
  Clique completa o texto ou avança; "Pular"/Esc encerra. Para rever:
  Ajuda → "Rever introdução". Capturas: `guishot.sh <pasta> cinema:<1-6>`.
- **Alianças por grupo:** nas campanhas, as facções do mesmo grupo são
  aliadas (todo o Imperium: Guarda, Astartes, Mechanicus, Sororitas,
  Custódios, Grey Knights, Krieg) — não se atacam, passam pelas terras
  umas das outras, vencem juntas e **se ajudam nas batalhas**: os
  exércitos aliados na província defendem junto, e um exército aliado
  numa província vizinha chega como reforço (aos 40 s na batalha 2D, com
  o aviso "Mechanicus chega para ajudar!"). Os times de `scenarios.json`
  continuam valendo por cima do grupo.
- **Alianças de conveniência do Caos:** as legiões não são aliadas de
  saída. Quando um inimigo comum (contando o bloco inteiro dele) fica mais
  forte que cada uma, a IA propõe uma aliança — entre si ou ao jogador
  (janela de proposta; também há o botão "Aliança" na Diplomacia). Ela
  rompe quando o inimigo comum enfraquece, e o mais forte pode trair
  (+20% no ataque naquele turno, rancor). World Eaters não se aliam a
  ninguém (Khorne). A vitória ainda exige derrotar o antigo aliado.
- **Krieg se entrincheira:** a infantaria de Krieg (e o Earthshaker, e
  os Granadeiros de Krieg da Guarda) cava trincheiras na batalha 2D. Com
  a ordem *Segurar* já começa entrincheirada; parada por 6 s, cava uma
  trincheira onde está (dano recebido -45%, só para o lado que cavou: o
  inimigo que chega ao corpo a corpo não ganha a cobertura). Na resolução
  automática e nas guarnições, esses batalhões valem 25% a mais na defesa.
- **IA mais esperta:** junta exércitos pequenos, volta para defender
  províncias ameaçadas, reúne forças antes de atacar, corre atrás do
  objetivo quando o jogador está perto de vencer, ergue baterias onde há
  frotas inimigas na órbita e guarda dinheiro para construir.
- **Equilíbrio:** os desembarques do Grande Jogo, os invasores de
  Thaurus, os ninhos tiranídeos de Baal, a colmeia da praga de Ultramar,
  as cidades Tau de Sautekh e Krieg em Vraks ficaram mais fortes ou mais
  justos (fortes, guarnições de elite, exércitos extras, rendimento). Nas
  simulações as campanhas duram de 20 a 60 turnos, com vencedores
  variados.
- **Nomes sem sobreposição** nos mapas pequenos (estações, luas): os
  rótulos se afastam uns dos outros e ficam sempre dentro do mapa, com a
  largura medida no idioma escolhido.

## Novidades da versão 0.7

- **Seletores em grade** (no estilo do mod civ_grid): a escolha da
  campanha, do lado e das facções da escaramuça é uma grade de cartões
  (globos dos planetas, emblemas das facções) com paginação, zoom (+/−) e
  roda do mouse; à direita, busca, filtros (era e número de lados; grupo da
  facção), a prévia grande com descrição, a dificuldade, "Aleatório",
  "Códex", "Voltar" e "Escolher" (duplo clique também escolhe).

- **Vitória**: controlar as cidades do objetivo por **3 turnos seguidos**
  (o inimigo tem chance de contra-atacar). Quem já começa com todas as
  cidades precisa **resistir até o turno 30**.
- **Clima** em cada batalha, sorteado pelo terreno: noite (menos alcance),
  tempestade de cinzas, chuva ácida (fere a infantaria sem cobertura),
  nevasca, tempestade da disformidade. Aparece no título e tinge o campo.
- **Cerco**: o defensor com fortificações luta atrás de **muralhas**
  (cobertura forte); os tiros contra quem está nelas as derrubam, e viram
  ruínas na tela.
- **Reforços**: um exército da mesma facção numa província vizinha entra
  pela borda no meio da batalha (uma vez por turno). A IA leva isso em conta.
- **Batalha espacial jogável**: antes de cada batalha de frotas você escolhe
  a tática — linha de batalha, fogo concentrado, abordagem (com exército a
  bordo), manobras evasivas ou recuar.
- **Construções** nas províncias (vagas: 1 + nível da cidade): santuário
  (ordem e recurso especial), quartel (recrutar 20% mais barato, +1
  guarnição), bateria antiorbital (meio dano de bombardeio, derruba naves),
  manufactorum (+30% de rendimento), estaleiro.
- **Ordem pública** (0–100): sobe com guarnição, exército e santuário; cai
  com devastação, saque e conquista recente. Abaixo de 40 o rendimento cai;
  abaixo de 15, sem exército, a província pode se **rebelar**. Tiranídeos e
  Necrons não têm ordem.
- **Melhorias permanentes** com o recurso especial (no painel de rituais):
  armas, armaduras, logística, recrutamento e veteranos, com nomes de cada
  facção.
- **Inimigos lendários**: entre os turnos 10 e 25, uma facção recebe um
  exército de elite (a Grande Waaagh!, um Navio-Colmeia, o Planeta
  Assassino, a Fenda de Sangue...).
- **Eventos encadeados**: o culto oculto (sussurros → o culto cresce →
  levante) e o sinal de socorro (ajuda → a província se junta a você, ou
  era uma armadilha).
- **Mecânicas únicas**: os Necrons se reerguem depois da batalha, os Orks
  crescem com as vitórias, a Devoração tiranídea devasta por mais tempo.
- **Traços negativos**: Hesitante (três derrotas), Imprudente (ataques
  fracassados), Tocado pela Disformidade (aceitou o presente dos deuses).
- **Conselheiro de guerra**, **desfazer movimento** (no mapa do planeta),
  **mapa de ameaça**, **salvamento automático** a cada turno e cópias
  manuais ("Salvar cópia"; aparecem em "Carregar Cruzada").
- **Escaramuça** no menu principal: só a batalha 2D, com as facções, o
  terreno, o tamanho e as muralhas à sua escolha.
- **Cruzada em sequência**: ao vencer, "Seguir pela disformidade" leva a
  sua facção a outro sistema com os generais (níveis, traços, relíquias), as
  melhorias e o recurso especial.
- **Tela de vitória** com o retrato grande, o resumo da guerra e o herói.
- **Miniaturas** no campo de batalha: as figuras recortadas dos retratos
  (`tools/art/gen_minis.py`) sobre uma peanha na cor da facção; o lado
  inimigo espelhado. Retratos que não recortam bem continuam redondos.
- **Mapas animados**: chaminés nas zonas industriais, lava nos ermos
  vulcânicos, clarões na disformidade.
- **Temas musicais por facção** (Kevin MacLeod, CC-BY): Imperium, Caos,
  Orks, Mechanicus, Necrons, Tiranídeos e xenos, tocados com as faixas da
  campanha.

## Mecânicas da versão 0.6

- **Recurso especial** de cada facção (no topo, ao lado dos recursos; o
  tooltip diz como se ganha): Biomassa dos Tiranídeos (inimigos abatidos e
  províncias devoradas), Favor de Khorne/Nurgle/Tzeentch/Slaanesh e dos
  Deuses, Waaagh!, Fé, Glória do Capítulo, Pureza, Juramento, Dor,
  Conhecimento Arcano, Bem Maior, Destino, Energia Ancestral, Dízimo Retido,
  Expiação (Krieg ganha com as próprias perdas), Heresia. Gaste em
  **rituais** (clique no recurso ou em "Rituais" no exército): reforços
  grátis, cura, bônus de ataque/defesa por alguns turnos, marcha extra,
  fortificar, barragem/praga nas províncias vizinhas, converter uma
  província neutra (Tau, Vraks) e recursos. Alguns recursos se esvaem nos
  turnos sem batalha (Khorne, Slaanesh, Orks, Drukhari).
- **Príncipe-Demônio**: as legiões do Caos podem pedir a ascensão do general
  (+20% no ataque, +15% na defesa, +1 carga). Em 30% das vezes os deuses
  recusam e ele vira uma **Cria do Caos** (um monstro no exército).
- **Generais com progressão**: experiência por batalha, 5 níveis (+3% no
  ataque e na defesa cada), traços conquistados (Matador de Tanques,
  Muralha, Conquistador, Matador de Generais, Veterano de <mundo>, Marca de
  <deus>...) e **relíquias** em províncias especiais de cada campanha (um
  general seu na província a reclama: Gorechild, Espada do Imperador, Coroa
  do Tirano...). Tudo aparece na ficha do general.
- **Diplomacia** (painel geral): tréguas de 10 turnos entre facções com
  pactos compatíveis — as legiões do Caos entre si e com os Drukhari, Badab
  com os lealistas, Eldar e Imperium... Khorne, Orks, Tiranídeos, Necrons e
  os capítulos leais não negociam. Uma trégua pode ser **traída** (+20% no
  ataque naquele turno; ninguém confia no traidor por um tempo). A IA também
  propõe e trai.
- **Eventos** no começo do turno, com escolhas: tempestade da disformidade
  (frotas presas), dízimo da Inquisição, Exterminatus, revolta de
  cultistas, praga, achado arqueológico/STC, mercenários, reforços, Waaagh!,
  sussurro dos deuses.
- **Moral na batalha 2D**: um batalhão muito ferido sob fogo recua em pânico
  por 8 s e se reagrupa; Krieg, Tiranídeos, Necrons, Death Guard, World
  Eaters, Custódios e Grey Knights nunca entram em pânico.
- **Dificuldade** (Fácil, Normal, Difícil) na campanha nova; **estatísticas**
  (territórios por turno, batalhas, baixas, rituais) no painel geral e no
  fim da guerra; **Códex** no menu e no painel geral.
- **Cidades-colmeia e frotas com arte própria** (`tools/source/space/`,
  recortadas por `tools/art/slice_space.py`): as 12 cidades vistas de cima
  aparecem nos mapas dos planetas (desenhadas por `gen_planets.py`) e no
  **campo de batalha** das províncias com cidade; as naves (8 estilos ×
  4 tamanhos, pelo número de naves da frota) aparecem na vista do sistema.
- **Batalha espacial (mapa de frotas)**: quando as frotas se enfrentam numa
  órbita com você envolvido, as duas frotas lutam na tela diante do planeta
  (proa contra proa, tiros, explosões, naves perdidas) antes do relatório.
  "Pular" vai direto ao resultado.
- **Atacar frotas inimigas**: com uma frota sua selecionada, botão direito
  numa frota inimiga na vista do sistema (ou "Atacar" no painel da frota,
  para as inimigas na mesma órbita). Na mesma órbita a batalha é na hora,
  com iniciativa (+15% de força); em outro corpo a frota viaja e luta ao
  chegar. Uma vez por turno por frota.
- **Som**: gritos de guerra por facção no início da batalha e som ambiente
  em cada tipo de planeta (sintetizados por `tools/audio/gen_sfx.py`).

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
| Ultramarines, Blood Angels, Salamanders | jogáveis (O Grande Jogo dos Deuses; Salamandras e Ultramarines também em Badab) |
| Grey Knights | jogáveis (Grande Jogo, Thaurus, Vraks) |
| Adeptus Mechanicus, Adepta Sororitas, Adeptus Custodes, Drukhari | jogáveis (A Profanação de Thaurus) |
| Secessionistas de Badab | jogáveis (A Guerra de Badab), com cinco forças de recrutamento |
| Death Korps of Krieg, Rebeldes de Vraks | jogáveis (O Cerco de Vraks) |

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
| `tools/data/build_thaurus.py` | Grey Knights, Mechanicus, Sororitas, Custódios, Drukhari e A Profanação de Thaurus (e os Grey Knights no Grande Jogo). |
| `tools/data/build_badab_vraks.py` | Secessionistas de Badab, Krieg, Rebeldes de Vraks e as duas campanhas. |
| `tools/data/build_mechanics.py` | Recursos especiais e rituais, pactos, moral, gritos de guerra, Crias do Caos e `progression.json` (níveis, traços, relíquias). Rodar por último. Ordem: build_factions, build_sectors, build_great_game, build_thaurus, build_badab_vraks, build_mechanics. |
| `gui/campaigns/wh40k/core/Mechanics.js`, `Events.js` | Recurso especial, rituais, ascensão, progressão dos generais, relíquias, diplomacia, eventos, estatísticas. |
| `gui/campaigns/wh40k/ui/Codex.js`, `Stats.js` | Códex e estatísticas. |
| `gui/campaigns/wh40k/core/Realm.js` | Construções, ordem pública e revoltas, melhorias permanentes, inimigos lendários, mecânicas únicas. |
| `gui/campaigns/wh40k/ui/Selector.js` | Seletor em grade (campanha, lado, escaramuça), inspirado no civ_grid. |
| `gui/campaigns/wh40k/ui/Skirmish.js` | Escaramuça (batalha avulsa do menu principal). |
| `tools/data/build_more.py` | O Cerco de Baal, A Guerra da Praga e O Despertar de Sautekh (rodar antes de build_mechanics). |
| `tools/art/gen_minis.py` | Miniaturas recortadas dos retratos para o campo de batalha (OpenCV). |
| `tools/audio/gen_sfx.py` | Efeitos sonoros da batalha, sintetizados (`audio/interface/wh40k/`). |
| `audio/music/` | Músicas (Kevin MacLeod, CC-BY 4.0; créditos em `audio/music/CREDITS.txt`). `gui/common/music.js` troca as músicas do menu. |
| `tools/data/build_factions.py` | Unidades, generais, apoios e dados das facções novas (e retratos novos da Guarda e dos Orks). |
| `tools/art/slice_sheets.py` | Recorta as pranchas 4×4 de `tools/source/sheets/` em retratos 256×256 (`portraits/<prancha>/r<l>c<c>.png`). |
| `tools/art/gen_menu.py` | Arte do menu: fundo (`tools/source/menu_background.png`), logotipo e as texturas góticas do warhr copiadas para cá. |
| `tools/art/terrain_tex.py` | Texturas procedurais de terreno (colmeia, indústria, cinzas, selva, pântano, montanhas, planícies, gelo, rocha, estação, mar) usadas pelos mapas e pelo fundo do campo de batalha. |
| `tools/art/gen_fx.py` | Quadros dos efeitos animados (`art/textures/ui/campaigns/wh40k/fx/`): explosão, impacto, sangue, feixe orbital, cápsula, fogo, fumaça, anel, choque, lança. |
| `tools/art/slice_imperium.py` | Recorta `tools/source/imperium_forces.png` (5 × 11 cartas) nos ícones das forças aliadas (`portraits/imperium/<id>.png`). |
| `tools/art/slice_portraits.py` | Recorta as colagens de `tools/source/` em retratos 256×256 (`art/textures/ui/wh40k/portraits/<facção>/r<linha>c<coluna>.png`). |
| `tools/art/slice_space.py` | Recorta `tools/source/space/` (cidades-colmeia e naves) em `art/textures/ui/campaigns/wh40k/cities/` e `ships/`. Rodar antes de `gen_planets.py`. |
| `gui/campaigns/wh40k/ui/SpaceView.js` | Batalha espacial encenada (mapa de frotas). |
| `tools/art/gen_planets.py` | Gera mapas dos corpos, máscaras das províncias, vizinhança, globos, fundo do sistema, ícones, fundos do desdobramento, emblemas e banner. Rode de novo depois de mudar `sector.json`. |
| `gui/campaigns/wh40k/core/0_Lang.js`, `gui/pregame/Lang.js` | Idiomas (tradução na hora de mostrar; botão de idioma do menu). |
| `gui/campaigns/wh40k/ui/Cinematic.js`, `tools/art/gen_cinematic.py` | Cinemática de introdução (quadros em `art/textures/ui/campaigns/wh40k/cinematic/`). |
| `tools/lang/` | `extract.py` (textos em português → `catalog.tsv`, mantendo os ids), `tr_*.tsv` (id, inglês, espanhol), `extras.tsv` (pedaços montados em tempo de execução) e `build.py` (gera `campaigns/wh40k/lang/*.json` e diz quantos faltam). Depois de mudar textos: `python3 tools/lang/extract.py && python3 tools/lang/build.py`, traduza os ids novos num `tr_<id>.tsv` e rode `build.py` de novo. |
| `legacy_3d/` | A batalha 3D guardada (não carregada). |

## Testes

- `sh tools/test/campaign_sim.sh [turnos] [facção] [campanha]`: campanha inteira no `gjs`, as duas facções pela IA (economia, IA, frotas, batalhas, saque).
- `SCENARIO=<campanha> sh tools/test/gui_sim.sh [facção]`: a interface com objetos de GUI falsos (escolha da facção, vistas, frases, recrutamento por força aliada, ataque, desdobramento, batalha 2D com ordens e apoio até o fim, relatório, saque e efeitos, 15 turnos).
- `LANG_TEST=en` (ou `es`) no `gui_sim.sh`: a mesma interface em outro idioma; no fim lista os textos que ainda parecem português.
- `sh tools/test/combat_sim.sh [batalhas]`: batalhas 2D aleatórias sem interface (duração, debandadas, se o mais forte vence).
- `sh tools/test/guishot.sh <pasta> [menu new planet system army deploy battle sack]`: abre o jogo numa janela direto na campanha e tira capturas (`BURST=n` para uma sequência; `LANG_SHOT=en|pt|es` para o idioma). Com a tela bloqueada, use um X aninhado: `Xephyr :5 -screen 1366x768 -ac -noreset &` e `DISPLAY=:5 IMPORT_ARGS="-display :5"`.

## Próximos passos

- Eldar, Tau, Necrons e Tiranídeos também em Armageddon; capítulos Astartes aliados da Guarda nas outras campanhas.
- Diplomacia com tributos e alianças completas.
- Revisão das traduções por falantes nativos; mais idiomas (basta um `tr_*.tsv` com a coluna nova e o código em `0_Lang.js`).
- Volta da batalha 3D (com modelos próprios dos Orks), mantendo a 2D como opção.
- Mais sistemas estelares ligados por rotas de disformidade.
- Batalhas espaciais jogáveis em tempo real (hoje: táticas escolhidas antes da batalha encenada).

## Licença e direitos

Código em GPL 3 (`LICENSE`). Warhammer 40.000 e os nomes dos personagens
pertencem à Games Workshop; este é um mod de fã, sem fins comerciais. Os
retratos e ícones vêm das imagens em `tools/source/`; as músicas são de
Kevin MacLeod (incompetech.com), CC-BY 4.0 (`audio/music/CREDITS.txt`); os
efeitos sonoros são sintetizados pelo próprio mod; os modelos 3D da
pasta `legacy_3d/` vêm do warhr (confira a licença antes de distribuir).
