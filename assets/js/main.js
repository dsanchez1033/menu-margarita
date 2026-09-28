import { createCatalogRepository, loadBaseCatalogs } from './catalogs.js';
import { createDayEditorController } from './day-editor.js';
import { createEditorController } from './editor.js';
import { createExportController } from './exporter.js';
import { createLayoutManager } from './layout.js';
import { createMenuStorage } from './storage.js';
import {
  createShareAvailabilityController,
  evaluateShareReadiness,
} from './share-readiness.js';
import { createNextWeek } from './week.js';
import { createWeekStorage } from './week-storage.js';

async function loadMenuFonts() {
  await Promise.all([
    document.fonts.load('400 16px "AhkioPDF"'),
    document.fonts.load('600 16px "MenuText"'),
  ]);
  await document.fonts.ready;
}

async function initializeMenu() {
  const [, loadedCatalogs] = await Promise.all([
    loadMenuFonts(),
    loadBaseCatalogs(),
  ]);

  const fields = [...document.querySelectorAll('.ajustable')];
  const globalFields = [...document.querySelectorAll('.global-editable')];
  const layout = createLayoutManager(fields);
  const menuStorage = createMenuStorage();
  const saved = menuStorage.load();
  const week = createNextWeek();
  const weekStorage = createWeekStorage();
  const savedWeek = weekStorage.load(week.key);
  const catalogRepository = createCatalogRepository(loadedCatalogs.catalogs);
  let exportController = null;
  let shareAvailability = null;

  const getGlobalValues = () => Object.fromEntries(
    globalFields.map(field => [field.dataset.field, field.dataset.value]),
  );
  const getShareReadiness = () => evaluateShareReadiness(savedWeek.state, getGlobalValues());
  const handleContentChange = () => {
    exportController?.invalidate();
    shareAvailability?.update();
  };

  const editor = createEditorController({
    fields: globalFields,
    layout,
    menuStorage,
    savedValues: saved.values,
    onContentChange: handleContentChange,
  });

  const dayEditor = createDayEditorController({
    week,
    weekState: savedWeek.state,
    weekStorage,
    catalogRepository,
    layout,
    hideGlobalEditHint: editor.hideEditHint,
    onContentChange: handleContentChange,
    setStatus: editor.setStatus,
  });

  exportController = createExportController({
    getShareReadiness,
    layout,
    hideEditHint: editor.hideEditHint,
    setStatus: editor.setStatus,
  });
  shareAvailability = createShareAvailabilityController({
    button: document.getElementById('openShare'),
    description: document.getElementById('shareRequirements'),
    getReadiness: getShareReadiness,
  });
  shareAvailability.update();

  layout.layoutAll();
  window.addEventListener('beforeprint', layout.layoutAll);
  document.getElementById('resetAll').addEventListener('click', () => {
    if (!window.confirm('¿Restablecer la semana, los precios y el teléfono?')) return;

    const globalResult = editor.resetFields();
    const weekResult = dayEditor.resetWeek();
    editor.setStatus(
      globalResult.ok && weekResult.ok
        ? '✓ Menú restablecido'
        : '⚠ Menú restablecido, pero algún cambio no pudo guardarse',
      true,
    );
  });
  document.documentElement.dataset.menuReady = 'true';

  if (
    saved.error
    || savedWeek.error
    || catalogRepository.loadError
    || loadedCatalogs.errors.length
  ) {
    editor.setStatus('⚠ Algunos datos guardados o catálogos no pudieron cargarse', true);
  }
}

initializeMenu().catch(error => {
  console.error('No se pudo iniciar Menú Margarita.', error);
  const status = document.getElementById('editStatus');
  if (status) status.textContent = '⚠ No se pudo iniciar el editor';
});
