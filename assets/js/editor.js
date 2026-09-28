import { formatPeruvianMobile } from './share-readiness.js';

const SAVED_STATUS_DURATION = 1800;

export function createEditorController({
  fields,
  layout,
  menuStorage,
  savedValues,
  onContentChange,
}) {
  const dialog = document.getElementById('editorDialog');
  const shareDialog = document.getElementById('shareDialog');
  const form = document.getElementById('editorForm');
  const input = document.getElementById('editorValue');
  const label = document.getElementById('editorLabel');
  const status = document.getElementById('editStatus');
  const editHint = document.getElementById('editHint');
  const touchInput = window.matchMedia('(pointer: coarse)');

  let activeField = null;
  let selectedField = null;
  let statusTimer = null;

  function updateMenuDescription() {
    const phone = fields.find(field => field.dataset.field === 'telefono')?.dataset.value;
    const description = document.getElementById('descripcion');
    if (description && phone) {
      description.textContent = `Menú de lunes a viernes. Contacto: ${phone}. Medios de pago: Yape y Plin.`;
    }
  }

  const editInstructions = () => touchInput.matches
    ? 'Usa + para configurar un día o toca un dato para editar'
    : 'Usa + para configurar un día o haz clic en un dato para editar';

  function setStatus(message, restoreInstructions = false) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    if (restoreInstructions) {
      statusTimer = window.setTimeout(() => {
        status.textContent = editInstructions();
      }, SAVED_STATUS_DURATION);
    }
  }

  function hideEditHint() {
    editHint.hidden = true;
    selectedField?.classList.remove('edit-selected');
    selectedField = null;
  }

  function showEditHint(element, touch = false) {
    if (dialog.open || shareDialog.open) return;

    hideEditHint();
    selectedField = element;
    element.classList.add('edit-selected');
    editHint.dataset.touch = String(touch);
    editHint.setAttribute('aria-label', `Editar ${element.dataset.label}`);
    editHint.hidden = false;

    const bounds = element.getBoundingClientRect();
    const size = editHint.offsetWidth;
    editHint.style.left = `${Math.max(4, Math.min(bounds.right + 6, window.innerWidth - size - 4))}px`;
    editHint.style.top = `${Math.max(4, Math.min(bounds.top + bounds.height / 2 - size / 2, window.innerHeight - size - 4))}px`;
  }

  function openEditor(element) {
    if (dialog.open) return;

    hideEditHint();
    activeField = element;
    label.textContent = `Nuevo ${element.dataset.label}`;
    input.value = element.dataset.value;
    input.rows = element.classList.contains('plato') ? 3 : 1;
    input.maxLength = element.dataset.field === 'telefono' ? 11 : 120;
    input.inputMode = element.dataset.field === 'telefono'
      ? 'numeric'
      : element.classList.contains('precio') ? 'decimal' : 'text';
    input.setCustomValidity('');
    dialog.showModal();
    input.focus();
    input.select();
  }

  function initializeField(element) {
    element.dataset.default = element.dataset.value;
    if (Object.prototype.hasOwnProperty.call(savedValues, element.dataset.field)) {
      element.dataset.value = String(savedValues[element.dataset.field]);
    }
    if (element.dataset.field === 'telefono') {
      element.dataset.value = formatPeruvianMobile(element.dataset.value) ?? element.dataset.value;
    }

    element.addEventListener('click', event => {
      if (event.pointerType === 'touch' || (touchInput.matches && event.detail !== 0)) {
        showEditHint(element, true);
      } else {
        openEditor(element);
      }
    });
    element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') showEditHint(element);
    });
    element.addEventListener('focus', () => {
      if (!touchInput.matches) showEditHint(element);
    });
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEditor(element);
      }
    });
  }

  status.textContent = editInstructions();
  fields.forEach(initializeField);
  updateMenuDescription();

  // Safari puede omitir el clic sintetizado tras un toque: abre al soltar el dedo.
  editHint.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      event.preventDefault();
      if (selectedField) openEditor(selectedField);
    }
  });
  editHint.addEventListener('click', () => {
    if (selectedField) openEditor(selectedField);
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.editable, #editHint')) hideEditHint();
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.editable, #editHint')) hideEditHint();
  });
  dialog.addEventListener('close', hideEditHint);
  window.addEventListener('scroll', hideEditHint, true);
  window.addEventListener('resize', hideEditHint);
  input.addEventListener('input', () => input.setCustomValidity(''));

  form.addEventListener('submit', event => {
    event.preventDefault();
    let value = input.value.trim();
    if (!activeField || !value) return;

    if (activeField.dataset.field === 'telefono') {
      const formattedPhone = formatPeruvianMobile(value);
      if (!formattedPhone) {
        input.setCustomValidity('Ingresa 9 dígitos que comiencen con 9.');
        input.reportValidity();
        return;
      }
      value = formattedPhone;
      input.value = formattedPhone;
    }

    activeField.dataset.value = value;
    updateMenuDescription();
    layout.layoutField(activeField);
    layout.compactRows();
    onContentChange();

    const result = menuStorage.save(fields);
    setStatus(
      result.ok ? '✓ Cambios guardados' : '⚠ Cambio aplicado, pero no se pudo guardar',
      true,
    );
    dialog.close();
  });

  document.getElementById('cancelEdit').addEventListener('click', () => dialog.close());
  function resetFields() {
    const result = menuStorage.clear();
    fields.forEach(field => { field.dataset.value = field.dataset.default; });
    updateMenuDescription();
    layout.layoutAll();
    onContentChange();
    return result;
  }

  return { hideEditHint, resetFields, setStatus };
}
