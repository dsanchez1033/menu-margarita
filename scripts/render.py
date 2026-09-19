#!/usr/bin/env python3
"""Sustituye {{variables}} de forma segura, sin dependencias externas."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VARIABLE = re.compile(r'\{\{\s*([a-z_]+)\s*\}\}')

def render(template, values):
    required = set(VARIABLE.findall(template))
    missing = sorted(required - values.keys())
    if missing:
        raise ValueError('Faltan variables: ' + ', '.join(missing))
    def replace(match):
        key = match.group(1)
        if not isinstance(values[key], (str, int, float)) or isinstance(values[key], bool):
            raise ValueError('La variable ' + key + ' debe ser texto o número.')
        return html.escape(str(values[key]), quote=True)
    return VARIABLE.sub(replace, template)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('datos', type=Path)
    parser.add_argument('salida', type=Path, nargs='?', default=ROOT/'index.html')
    args = parser.parse_args()
    result = render((ROOT/'menu-template.html').read_text(), json.loads(args.datos.read_text()))
    args.salida.write_text(result)
    print(args.salida.resolve())
