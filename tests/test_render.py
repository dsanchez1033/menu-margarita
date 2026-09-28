import json
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
        self.assertEqual(len(EXPECTED_VARIABLES), 18)

    def test_render_escapes_html_and_preserves_line_breaks(self):
        values = {**VALUES, 'lunes_plato': '<Ají & arroz>\n"especial"'}
        result = render(TEMPLATE, values)
        self.assertIn('&lt;Ají &amp; arroz&gt;\n&quot;especial&quot;', result)

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

    def test_assets_are_copied_next_to_an_external_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'site' / 'index.html'
            output.parent.mkdir()
            copy_assets(output)
            self.assertTrue((output.parent / 'assets/js/main.js').is_file())
            self.assertTrue((output.parent / 'assets/fonts/Barlow-SemiBold.ttf').is_file())
            self.assertTrue((output.parent / 'assets/images/menu-background.png').is_file())


if __name__ == '__main__':
    unittest.main()
