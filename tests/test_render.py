import json
import re
import tempfile
import unittest
from pathlib import Path

from scripts.render import EXPECTED_VARIABLES, copy_assets, render


ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = (ROOT / 'menu-template.html').read_text(encoding='utf-8')
VALUES = json.loads((ROOT / 'menu-margarita.json').read_text(encoding='utf-8'))


class RenderMenuTests(unittest.TestCase):
    def test_generated_index_is_current(self):
        expected = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertEqual(render(TEMPLATE, VALUES), expected)

    def test_template_contains_the_expected_variables(self):
        for variable in EXPECTED_VARIABLES:
            self.assertIn('{{' + variable + '}}', TEMPLATE)
        self.assertEqual(len(EXPECTED_VARIABLES), 3)

    def test_render_escapes_html_and_preserves_line_breaks(self):
        values = {**VALUES, 'telefono': '<923 & 456>\n"especial"'}
        result = render(TEMPLATE, values)
        self.assertIn('&lt;923 &amp; 456&gt;\n&quot;especial&quot;', result)

    def test_render_rejects_a_missing_value(self):
        values = {**VALUES}
        del values['telefono']
        with self.assertRaisesRegex(ValueError, 'Faltan variables: telefono'):
            render(TEMPLATE, values)

    def test_render_rejects_boolean_values(self):
        values = {**VALUES, 'precio_menu': True}
        with self.assertRaisesRegex(ValueError, 'precio_menu debe ser texto o número'):
            render(TEMPLATE, values)

    def test_template_uses_only_external_code_and_assets(self):
        self.assertNotIn('<style', TEMPLATE)
        self.assertNotIn('data:image', TEMPLATE)
        self.assertNotIn('data:font', TEMPLATE)
        self.assertNotIn('<script>', TEMPLATE)

    def test_export_omits_transparent_day_hitboxes(self):
        hitboxes = re.findall(
            r'<rect class="([^"]*day-card-hitbox[^"]*)"[^>]*fill="transparent"',
            TEMPLATE,
        )
        self.assertEqual(len(hitboxes), 5)
        self.assertTrue(all('non-exportable' in classes.split() for classes in hitboxes))

    def test_assets_are_copied_next_to_an_external_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'site' / 'index.html'
            output.parent.mkdir()
            copy_assets(output)
            self.assertTrue((output.parent / 'assets/js/main.js').is_file())
            self.assertTrue((output.parent / 'assets/fonts/Barlow-SemiBold.ttf').is_file())
            self.assertTrue((output.parent / 'assets/images/menu-background.png').is_file())
            self.assertTrue((output.parent / 'assets/data/platos.json').is_file())

    def test_catalogs_are_non_empty_lists_of_unique_strings(self):
        for filename in ('platos.json', 'refrescos.json'):
            values = json.loads((ROOT / 'assets/data' / filename).read_text(encoding='utf-8'))
            self.assertIsInstance(values, list)
            self.assertTrue(values)
            self.assertTrue(all(isinstance(value, str) and value.strip() for value in values))
            self.assertEqual(len(values), len({value.casefold() for value in values}))


if __name__ == '__main__':
    unittest.main()
