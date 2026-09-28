import { createEditorController } from './editor.js';
import { createExportController } from './exporter.js';
import { createLayoutManager } from './layout.js';
import { createMenuStorage } from './storage.js';

async function loadMenuFonts() {
  await Promise.all([
    document.fonts.load('400 16px "AhkioPDF"'),
    document.fonts.load('600 16px "MenuText"'),
  ]);
  await document.fonts.ready;
}

async function initializeMenu() {
  await loadMenuFonts();

  const fields = [...document.querySelectorAll('.ajustable')];
  const layout = createLayoutManager(fields);
  const menuStorage = createMenuStorage();
  const saved = menuStorage.load();
  let exportController = null;

  const editor = createEditorController({
    fields,
    layout,
    menuStorage,
    savedValues: saved.values,
    onContentChange: () => exportController?.invalidate(),
  });

  exportController = createExportController({
    layout,
    hideEditHint: editor.hideEditHint,
    setStatus: editor.setStatus,
  });

  layout.layoutAll();
  window.addEventListener('beforeprint', layout.layoutAll);
  document.documentElement.dataset.menuReady = 'true';

  if (saved.error) {
    editor.setStatus('⚠ No se pudieron recuperar los cambios guardados', true);
  }
}

initializeMenu().catch(error => {
  console.error('No se pudo iniciar Menú Margarita.', error);
  const status = document.getElementById('editStatus');
  if (status) status.textContent = '⚠ No se pudo iniciar el editor';
});
