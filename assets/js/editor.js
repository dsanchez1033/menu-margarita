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

  const editInstructions = () => touchInput.matches
    ? '✎ Toca un dato y luego el lápiz para editar'
    : '✎ Haz clic en un dato para editar';

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
    dialog.showModal();
    input.focus();
    input.select();
  }

  function initializeField(element) {
    element.dataset.default = element.dataset.value;
    if (Object.prototype.hasOwnProperty.call(savedValues, element.dataset.field)) {
      element.dataset.value = String(savedValues[element.dataset.field]);
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

  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!activeField || !value) return;

    activeField.dataset.value = value;
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
  document.getElementById('resetAll').addEventListener('click', () => {
    if (!window.confirm('¿Restablecer todos los datos del menú?')) return;

    const result = menuStorage.clear();
    fields.forEach(field => { field.dataset.value = field.dataset.default; });
    layout.layoutAll();
    onContentChange();
    setStatus(
      result.ok ? '✓ Menú restablecido' : '⚠ Menú restablecido, pero no se pudo borrar el guardado',
      true,
    );
  });

  return { hideEditHint, setStatus };
}
