"""Extrai os textos do jogo (português, as chaves) para tools/lang/catalog.tsv:
  id <TAB> origem <TAB> texto
Fontes: os campos de texto dos JSON de campaigns/wh40k/data, os literais de
texto do código (gui/campaigns/wh40k, gui/pregame) e as legendas do XML.
As traduções ficam em tools/lang/tr_*.tsv (id <TAB> inglês <TAB> espanhol) e
tools/lang/build.py gera campaigns/wh40k/lang/en.json e es.json.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "campaigns/wh40k/data")
KEYS = {"name", "title", "desc", "quotes", "trait", "description", "tips", "sackName", "sackNote", "currency", "currencyShort",
        "fleetName", "short", "label", "text", "intro", "summary", "class", "leaderTitles", "neutralName", "never", "shipNames"}
SKIP_FILES = {"minis.json"}


def norm(s):
    """Sem espaços e sem a pontuação das pontas (a tradução troca o miolo; a pontuação fica)."""
    return s.strip().strip(" .,:;()·—–-+/|\u2022").strip()


def has_text(s):
    return bool(re.search(r"[A-Za-zÀ-ÿ]{2,}", s))


def data_strings():
    out = []

    def walk(o, src):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in KEYS:
                    if isinstance(v, str):
                        out.append((src, v))
                    elif isinstance(v, list):
                        for x in v:
                            if isinstance(x, str):
                                out.append((src, x))
                            else:
                                walk(x, src)
                    else:
                        walk(v, src)
                elif k not in ("Description",):
                    walk(v, src)
        elif isinstance(o, list):
            for x in o:
                walk(x, src)
    for f in sorted(os.listdir(DATA)):
        if f.endswith(".json") and f not in SKIP_FILES:
            walk(json.load(open(os.path.join(DATA, f))), f)
    return out


LIT = re.compile(r'([{,(]\s*)?"((?:[^"\\\n]|\\.)*)"(\s*:)?')
BAD = re.compile(r"\.(png|ogg|json|xml|js)\b|campaigns/|color:|stretched:|textureAsMask|grayscale:|sans-|^#|^[a-z0-9_.:-]+$|^[A-Z_]+$|^\w+\[")


def code_strings():
    out = []
    for base in ("gui/campaigns/wh40k", "gui/pregame"):
        for dp, _, fs in os.walk(os.path.join(ROOT, base)):
            for f in sorted(fs):
                if not f.endswith(".js"):
                    continue
                src = open(os.path.join(dp, f)).read()
                # sem comentários
                src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
                src = re.sub(r"(?m)^\s*//.*$", "", src)
                for m in LIT.finditer(src):
                    if m.group(1) is not None and m.group(3):  # chave de objeto ({"a": ...})
                        continue
                    s = m.group(2).encode().decode("unicode_escape").encode("latin1").decode("utf8") if "\\u" in m.group(2) else m.group(2)
                    s = s.replace('\\"', '"')
                    for piece in s.split("\\n"):
                        p = norm(piece)
                        ws = piece != piece.strip() and bool(re.match(r"^[a-zà-ÿ]+$", p))
                        if not has_text(p) or (BAD.search(p) and not ws) or re.match(r"^[a-z0-9_-]+/[a-z0-9_/-]+$", p):
                            continue
                        # Pedaços de frases montadas (" em ", " turno(s).") também
                        # entram; palavras soltas sem espaço são nomes de código.
                        frag = piece != piece.strip() or bool(re.match(r"^[\s.,:;()·—–+/|•-]|.*[\s.,:;()·—–+/|•-]$", piece))
                        if not (re.search(r"[À-ÿ]", p) or " " in p or p[0].isupper() or frag):
                            continue
                        out.append((f, p))
    return out


def xml_strings():
    out = []
    for base in ("gui/campaigns/wh40k", "gui/pregame"):
        for dp, _, fs in os.walk(os.path.join(ROOT, base)):
            for f in fs:
                if f.endswith(".xml"):
                    src = open(os.path.join(dp, f)).read()
                    for m in re.finditer(r'<object [^>]*name="([^"]+)"[^>]*>([^<]+)</object>', src):
                        if has_text(m.group(2)):
                            out.append((f, norm(m.group(2))))
                    for m in re.finditer(r'tooltip="([^"]+)"', src):
                        if has_text(m.group(1)):
                            out.append((f, norm(m.group(1))))
    return out


def main():
    seen = {}
    for src, s in data_strings() + code_strings() + xml_strings():
        s = norm(s)
        if s and has_text(s) and s not in seen:
            seen[s] = src
    # Os ids antigos ficam (as traduções tr_*.tsv apontam para eles); textos
    # novos ganham ids depois do último; textos que sumiram saem do catálogo.
    path = os.path.join(ROOT, "tools/lang/catalog.tsv")
    old = {}
    if os.path.exists(path):
        for line in open(path):
            i, _, pt = line.rstrip("\n").split("\t", 2)
            old[pt.replace("\\n", "\n")] = int(i)
    nxt = max(old.values(), default=0) + 1
    rows = []
    for s, src in sorted(seen.items(), key=lambda kv: (kv[1], kv[0])):
        if s in old:
            rows.append((old[s], src, s))
        else:
            rows.append((nxt, src, s))
            nxt += 1
    rows.sort()
    with open(path, "w") as f:
        for i, src, s in rows:
            f.write("%d\t%s\t%s\n" % (i, src, s.replace("\t", " ").replace("\n", "\\n")))
    new = sum(1 for s in seen if s not in old)
    print(len(rows), "textos (%d novos, %d removidos);" % (new, sum(1 for s in old if s not in seen)), sum(len(s.split()) for s in seen), "palavras")


if __name__ == "__main__":
    main()
