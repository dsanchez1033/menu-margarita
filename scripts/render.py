#!/usr/bin/env python3
"""Sustituye {{variables}} de forma segura, sin dependencias externas."""
import argparse
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VARIABLE = re.compile(r'\{\{\s*([a-z_]+)\s*\}\}')
EXPECTED_VARIABLES = frozenset({
    'precio_menu', 'precio_carta', 'telefono',
})


def render(template, values):
    required = set(VARIABLE.findall(template))
    missing_in_template = sorted(EXPECTED_VARIABLES - required)
    unexpected = sorted(required - EXPECTED_VARIABLES)
    if missing_in_template or unexpected:
        details = []
        if missing_in_template:
            details.append('faltan en la plantilla: ' + ', '.join(missing_in_template))
        if unexpected:
            details.append('variables desconocidas: ' + ', '.join(unexpected))
        raise ValueError('La plantilla no contiene las variables esperadas; ' + '; '.join(details))

    missing = sorted(required - values.keys())
    if missing:
        raise ValueError('Faltan variables: ' + ', '.join(missing))

    def replace(match):
        key = match.group(1)
        if not isinstance(values[key], (str, int, float)) or isinstance(values[key], bool):
            raise ValueError('La variable ' + key + ' debe ser texto o número.')
        return html.escape(str(values[key]), quote=True)

    return VARIABLE.sub(replace, template)


def copy_assets(output_path):
    source = (ROOT / 'assets').resolve()
    destination = (output_path.parent / 'assets').resolve()
    if source == destination:
        return
    if source in destination.parents:
        raise ValueError('La salida no puede ubicarse dentro de la carpeta assets.')
    shutil.copytree(source, destination, dirs_exist_ok=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('datos', type=Path)
    parser.add_argument('salida', type=Path, nargs='?', default=ROOT/'index.html')
    args = parser.parse_args()
    template = (ROOT / 'menu-template.html').read_text(encoding='utf-8')
    values = json.loads(args.datos.read_text(encoding='utf-8'))
    result = render(template, values)
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(result, encoding='utf-8')
    copy_assets(args.salida)
    print(args.salida.resolve())
