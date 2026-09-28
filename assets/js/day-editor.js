import { CATALOG_TYPES, normalizeCatalogValue } from './catalogs.js';

const CUSTOM_VALUE = '__custom__';
const NO_CLASSES_TEXT = 'No hay clases';

function setHidden(element, hidden) {
  element.toggleAttribute('hidden', hidden);
}

export function createDayEditorController({
  week,
  weekState,
  weekStorage,
  catalogRepository,
  layout,
  hideGlobalEditHint,
  onContentChange,
  setStatus,
}) {
  const cards = [...document.querySelectorAll('.day-card')];
  const dialog = document.getElementById('dayDialog');
  const form = document.getElementById('dayForm');
  const dayLabel = document.getElementById('dayDialogLabel');
  const noClasses = document.getElementById('noClasses');
  const menuFields = document.getElementById('dayMenuFields');
  const plateSelect = document.getElementById('plateSelect');
  const drinkSelect = document.getElementById('drinkSelect');
  const customPlateField = document.getElementById('customPlateField');
  const customDrinkField = document.getElementById('customDrinkField');
  const customPlate = document.getElementById('customPlate');
  const customDrink = document.getElementById('customDrink');
  const validationMessage = document.getElementById('dayValidation');
  const clearDayButton = document.getElementById('clearDay');
  const catalogManager = document.getElementById('catalogManager');
  const toggleCatalogManager = document.getElementById('toggleCatalogManager');

  let activeDayKey = null;

  const daysByKey = new Map(week.days.map(day => [day.key, day]));
  const cardsByKey = new Map(cards.map(card => [card.dataset.dayKey, card]));

  function showValidation(message = '') {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
  }

  function optionExists(type, value) {
    const normalized = normalizeCatalogValue(value).toLocaleLowerCase('es-PE');
    return catalogRepository.list(type).some(option => (
      option.toLocaleLowerCase('es-PE') === normalized
    ));
  }

  function populateSelect(select, type, selectedValue = '', customInput) {
    select.replaceChildren(new Option('Selecciona una opción', ''));
    catalogRepository.list(type).forEach(value => {
      select.append(new Option(value, value));
    });
    select.append(new Option('＋ Agregar nuevo…', CUSTOM_VALUE));

    if (selectedValue && optionExists(type, selectedValue)) {
      const matchingValue = catalogRepository.list(type).find(value => (
        value.toLocaleLowerCase('es-PE') === normalizeCatalogValue(selectedValue).toLocaleLowerCase('es-PE')
      ));
      select.value = matchingValue;
      customInput.value = '';
    } else if (selectedValue) {
      select.value = CUSTOM_VALUE;
      customInput.value = selectedValue;
    } else {
      select.value = '';
      customInput.value = '';
    }
    updatePersonalizedIndicator(select, type);
  }

  function updatePersonalizedIndicator(select, type) {
    const selectedKey = normalizeCatalogValue(select.value).toLocaleLowerCase('es-PE');
    const isPersonalized = catalogRepository.listLocal(type).some(value => (
      value.toLocaleLowerCase('es-PE') === selectedKey
    ));
    select.classList.toggle('catalog-select--personalized', isPersonalized);
  }

  function updateCustomField(select, field, input) {
    const visible = !noClasses.checked && select.value === CUSTOM_VALUE;
    field.hidden = !visible;
    input.disabled = !visible;
    input.required = visible;
  }

  function updateFormMode() {
    menuFields.hidden = noClasses.checked;
    plateSelect.disabled = noClasses.checked;
    drinkSelect.disabled = noClasses.checked;
    plateSelect.required = !noClasses.checked;
    drinkSelect.required = !noClasses.checked;
    updateCustomField(plateSelect, customPlateField, customPlate);
    updateCustomField(drinkSelect, customDrinkField, customDrink);
    showValidation();
  }

  function setDayView(card, day, dayState) {
    const dateField = card.querySelector('.fecha');
    const plateField = card.querySelector('.plato');
    const drinkField = card.querySelector('.refresco');
    const addControl = card.querySelector('.day-add-control');
    const configured = dayState.status !== 'empty';

    dateField.setAttribute('aria-hidden', 'true');
    plateField.setAttribute('aria-hidden', 'true');
    drinkField.setAttribute('aria-hidden', 'true');
    dateField.dataset.value = String(day.date.getDate());
    plateField.dataset.value = dayState.status === 'no_classes'
      ? NO_CLASSES_TEXT
      : dayState.plato;
    drinkField.dataset.value = dayState.status === 'menu' ? dayState.refresco : '';
    setHidden(addControl, configured);
    card.classList.toggle('day-card--configured', configured);
    card.classList.toggle('day-card--no-classes', dayState.status === 'no_classes');
    card.dataset.state = dayState.status;

    const action = configured ? 'Editar' : 'Configurar';
    const summary = dayState.status === 'menu'
      ? `${dayState.plato}; refresco ${dayState.refresco}`
      : dayState.status === 'no_classes' ? NO_CLASSES_TEXT : 'sin menú';
    card.setAttribute(
      'aria-label',
      `${action} ${day.label} ${day.date.getDate()}: ${summary}`,
    );

    layout.layoutField(dateField);
    layout.layoutField(plateField);
    layout.layoutField(drinkField);
  }

  function renderAllDays() {
    week.days.forEach(day => {
      setDayView(cardsByKey.get(day.key), day, weekState.days[day.key]);
    });
    layout.compactRows();
  }

  function saveWeek(successMessage) {
    const result = weekStorage.save(weekState);
    onContentChange();
    setStatus(
      result.ok ? successMessage : '⚠ Cambio aplicado, pero no se pudo guardar',
      true,
    );
    return result;
  }

  function openDayEditor(dayKey) {
    const day = daysByKey.get(dayKey);
    const dayState = weekState.days[dayKey];
    activeDayKey = dayKey;
    hideGlobalEditHint();
    dayLabel.textContent = `${day.label} ${day.date.getDate()}`;
    noClasses.checked = dayState.status === 'no_classes';
    populateSelect(plateSelect, CATALOG_TYPES.platos, dayState.plato, customPlate);
    populateSelect(drinkSelect, CATALOG_TYPES.refrescos, dayState.refresco, customDrink);
    clearDayButton.hidden = dayState.status === 'empty';
    catalogManager.hidden = true;
    toggleCatalogManager.textContent = 'Gestionar opciones personalizadas';
    updateFormMode();
    dialog.showModal();
  }

  function readSelection(select, customInput, label) {
    if (!select.value) return { error: `Selecciona ${label}.` };
    if (select.value !== CUSTOM_VALUE) return { value: select.value, custom: false };

    const value = normalizeCatalogValue(customInput.value);
    if (!value) return { error: `Escribe ${label}.` };
    return { value, custom: true };
  }

  function createLocalOptionRow(type, value) {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const button = document.createElement('button');
    label.textContent = value;
    button.type = 'button';
    button.className = 'remove-local-option';
    button.dataset.catalogType = type;
    button.dataset.catalogValue = value;
    button.setAttribute('aria-label', `Eliminar ${value}`);
    button.textContent = 'Eliminar';
    item.append(label, button);
    return item;
  }

  function renderLocalCatalogList(type, listId, emptyId) {
    const list = document.getElementById(listId);
    const empty = document.getElementById(emptyId);
    const values = catalogRepository.listLocal(type);
    list.replaceChildren(...values.map(value => createLocalOptionRow(type, value)));
    empty.hidden = values.length > 0;
  }

  function renderCatalogManager() {
    renderLocalCatalogList(CATALOG_TYPES.platos, 'localPlateList', 'noLocalPlates');
    renderLocalCatalogList(CATALOG_TYPES.refrescos, 'localDrinkList', 'noLocalDrinks');
  }

  cards.forEach(card => {
    card.addEventListener('click', () => openDayEditor(card.dataset.dayKey));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDayEditor(card.dataset.dayKey);
      }
    });
  });

  noClasses.addEventListener('change', updateFormMode);
  plateSelect.addEventListener('change', () => {
    updatePersonalizedIndicator(plateSelect, CATALOG_TYPES.platos);
    updateCustomField(plateSelect, customPlateField, customPlate);
    if (!customPlateField.hidden) customPlate.focus();
    showValidation();
  });
  drinkSelect.addEventListener('change', () => {
    updatePersonalizedIndicator(drinkSelect, CATALOG_TYPES.refrescos);
    updateCustomField(drinkSelect, customDrinkField, customDrink);
    if (!customDrinkField.hidden) customDrink.focus();
    showValidation();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!activeDayKey) return;

    if (noClasses.checked) {
      weekState.days[activeDayKey] = { status: 'no_classes', plato: '', refresco: '' };
      renderAllDays();
      saveWeek('✓ Día marcado sin clases');
      dialog.close();
      return;
    }

    const plate = readSelection(
      plateSelect,
      customPlate,
      'un plato',
    );
    if (plate.error) {
      showValidation(plate.error);
      return;
    }
    const drink = readSelection(
      drinkSelect,
      customDrink,
      'un refresco',
    );
    if (drink.error) {
      showValidation(drink.error);
      return;
    }

    const storedPlate = plate.custom
      ? catalogRepository.add(CATALOG_TYPES.platos, plate.value)
      : { ok: true, value: plate.value };
    const storedDrink = drink.custom
      ? catalogRepository.add(CATALOG_TYPES.refrescos, drink.value)
      : { ok: true, value: drink.value };

    weekState.days[activeDayKey] = {
      status: 'menu',
      plato: storedPlate.value,
      refresco: storedDrink.value,
    };
    renderAllDays();
    saveWeek(
      storedPlate.ok && storedDrink.ok
        ? '✓ Menú del día guardado'
        : '⚠ Menú guardado; una opción local no pudo persistirse',
    );
    dialog.close();
  });

  document.getElementById('cancelDayEdit').addEventListener('click', () => dialog.close());
  clearDayButton.addEventListener('click', () => {
    if (!activeDayKey) return;
    weekState.days[activeDayKey] = { status: 'empty', plato: '', refresco: '' };
    renderAllDays();
    saveWeek('✓ Día vaciado');
    dialog.close();
  });

  toggleCatalogManager.addEventListener('click', () => {
    catalogManager.hidden = !catalogManager.hidden;
    toggleCatalogManager.textContent = catalogManager.hidden
      ? 'Gestionar opciones personalizadas'
      : 'Ocultar opciones personalizadas';
    if (!catalogManager.hidden) renderCatalogManager();
  });

  catalogManager.addEventListener('click', event => {
    const button = event.target.closest('.remove-local-option');
    if (!button) return;

    const currentPlate = plateSelect.value === CUSTOM_VALUE ? customPlate.value : plateSelect.value;
    const currentDrink = drinkSelect.value === CUSTOM_VALUE ? customDrink.value : drinkSelect.value;
    const result = catalogRepository.removeLocal(
      button.dataset.catalogType,
      button.dataset.catalogValue,
    );
    populateSelect(plateSelect, CATALOG_TYPES.platos, currentPlate, customPlate);
    populateSelect(drinkSelect, CATALOG_TYPES.refrescos, currentDrink, customDrink);
    updateFormMode();
    renderCatalogManager();
    if (!result.ok) setStatus('⚠ La opción se quitó, pero el cambio no pudo guardarse', true);
  });

  function resetWeek() {
    Object.keys(weekState.days).forEach(dayKey => {
      weekState.days[dayKey] = { status: 'empty', plato: '', refresco: '' };
    });
    const result = weekStorage.clear();
    renderAllDays();
    onContentChange();
    return result;
  }

  renderAllDays();
  return { resetWeek };
}
