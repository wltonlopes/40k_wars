#!/usr/bin/env python3
"""
Os scripts da simulação (maps/scripts, simulation/) não são lidos como
UTF-8 pelo motor: acentos dentro de strings saem corrompidos nas mensagens.
Este script troca, só dentro das strings, os caracteres não-ASCII por
escapes \\uXXXX (os comentários continuam legíveis).

Uso (na pasta do mod): python3 tools/escape_sim_strings.py
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = glob.glob(os.path.join(ROOT, "maps", "scripts", "*.js")) + glob.glob(os.path.join(ROOT, "simulation", "**", "*.js"), recursive=True)
STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"')


def escape(m):
    return "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in m.group(0))


for path in FILES:
    with open(path, encoding="utf-8") as f:
        src = f.read()
    out = []
    for line in src.split("\n"):
        stripped = line.lstrip()
        if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
            out.append(line)
        else:
            out.append(STRING.sub(escape, line))
    new = "\n".join(out)
    if new != src:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
        print("escapado:", os.path.relpath(path, ROOT))
