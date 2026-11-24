"""Gera campaigns/wh40k/lang/en.json e es.json a partir de tools/lang/catalog.tsv
(id, origem, texto em português) e das traduções tools/lang/tr_*.tsv
(id, inglês, espanhol). "static" lista os objetos do XML com legenda ou dica
própria (traduzidos na abertura da página). Mostra quantos textos faltam.
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    cat = {}
    for line in open(os.path.join(ROOT, "tools/lang/catalog.tsv")):
        i, src, pt = line.rstrip("\n").split("\t", 2)
        cat[int(i)] = pt.replace("\\n", "\n")
    tr = {"en": {}, "es": {}}
    for f in sorted(glob.glob(os.path.join(ROOT, "tools/lang/tr_*.tsv"))):
        for n, line in enumerate(open(f), 1):
            line = line.rstrip("\n")
            if not line.strip():
                continue
            parts = line.split("\t")
            if len(parts) != 3:
                raise SystemExit("%s:%d: esperado id<TAB>en<TAB>es" % (f, n))
            i = int(parts[0])
            if i not in cat:
                print("aviso: %s:%d: id %d fora do catálogo (ignorado)" % (os.path.basename(f), n, i))
                continue
            tr["en"][cat[i]] = parts[1].replace("\\n", "\n")
            tr["es"][cat[i]] = parts[2].replace("\\n", "\n")
    extras = os.path.join(ROOT, "tools/lang/extras.tsv")
    for n, line in enumerate(open(extras) if os.path.exists(extras) else [], 1):
        line = line.rstrip("\n")
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 3:
            raise SystemExit("extras.tsv:%d: esperado pt<TAB>en<TAB>es" % n)
        tr["en"][parts[0]] = parts[1]
        tr["es"][parts[0]] = parts[2]
    static = []
    for f in glob.glob(os.path.join(ROOT, "gui/campaigns/wh40k/*.xml")):
        src = open(f).read()
        static += re.findall(r'<object [^>]*name="([^"\[]+)"[^>]*>[^<]*[A-Za-zÀ-ÿ][^<]*</object>', src)
        static += re.findall(r'<object [^>]*name="([^"\[]+)"[^>]*tooltip="[^"]*[A-Za-zÀ-ÿ]', src)
        static += re.findall(r'<object [^>]*tooltip="[^"]*"[^>]*name="([^"\[]+)"', src)
    out = os.path.join(ROOT, "campaigns/wh40k/lang")
    os.makedirs(out, exist_ok=True)
    for lang in ("en", "es"):
        with open(os.path.join(out, lang + ".json"), "w") as f:
            json.dump({"language": lang, "static": sorted(set(static)), "strings": tr[lang]}, f, ensure_ascii=False, indent="\t", sort_keys=True)
    missing = [i for i, pt in cat.items() if pt not in tr["en"]]
    print("traduzidos:", len(cat) - len(missing), "de", len(cat), "· faltam", len(missing), "(primeiro id faltando: %s)" % (missing[0] if missing else "-"))


if __name__ == "__main__":
    main()
