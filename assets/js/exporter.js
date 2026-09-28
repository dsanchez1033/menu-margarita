import { FILE_NAMES, FONT_ASSETS, MENU_SIZE, SVG_NAMESPACE } from './config.js';

const TEXT_STYLE_PROPERTIES = [
  'fill',
  'font-family',
  'font-kerning',
  'font-size',
  'font-variant-ligatures',
  'font-weight',
  'text-anchor',
  'white-space',
];

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer un recurso del menú.'));
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el recurso ${new URL(url).pathname}.`);
  }
  return blobToDataUrl(await response.blob());
}

async function embedImages(original, clone) {
  const originalImages = [...original.querySelectorAll('image[href]')];
  const clonedImages = [...clone.querySelectorAll('image[href]')];

  await Promise.all(originalImages.map(async (image, index) => {
    const source = new URL(image.getAttribute('href'), document.baseURI).href;
    clonedImages[index].setAttribute('href', await fetchAsDataUrl(source));
  }));
}

async function createEmbeddedFontRules() {
  const fonts = await Promise.all(FONT_ASSETS.map(async font => ({
    ...font,
    dataUrl: await fetchAsDataUrl(font.url),
  })));

  return fonts.map(font => `
    @font-face {
      font-family: "${font.family}";
      src: url("${font.dataUrl}") format("truetype");
      font-style: normal;
      font-weight: ${font.weight};
    }
  `).join('\n');
}

function inlineComputedTextStyles(original, clone) {
  const originalTexts = [...original.querySelectorAll('text')];
  const clonedTexts = [...clone.querySelectorAll('text')];

  originalTexts.forEach((text, index) => {
    const computedStyle = window.getComputedStyle(text);
    TEXT_STYLE_PROPERTIES.forEach(property => {
      clonedTexts[index].style.setProperty(property, computedStyle.getPropertyValue(property));
    });
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
    image.src = source;
  });
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo crear el archivo PNG.'));
    }, 'image/png');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createExportController({ layout, hideEditHint, setStatus }) {
  const shareDialog = document.getElementById('shareDialog');
  const whatsappButton = document.getElementById('shareWhatsapp');
  let preparedPdfBlob = null;
  let pdfBuildPromise = null;

  function invalidate() {
    preparedPdfBlob = null;
    pdfBuildPromise = null;
  }

  async function createPngBlob() {
    layout.layoutAll();
    const original = document.querySelector('.menu');
    const clone = original.cloneNode(true);
    clone.querySelectorAll('.edit-selected').forEach(element => {
      element.classList.remove('edit-selected');
    });
    clone.setAttribute('xmlns', SVG_NAMESPACE);
    clone.setAttribute('width', String(MENU_SIZE.width));
    clone.setAttribute('height', String(MENU_SIZE.height));

    inlineComputedTextStyles(original, clone);
    await Promise.all([
      embedImages(original, clone),
      createEmbeddedFontRules().then(fontRules => {
        const style = document.createElementNS(SVG_NAMESPACE, 'style');
        style.textContent = fontRules;
        clone.insertBefore(style, clone.firstChild);
      }),
    ]);

    const serializedSvg = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = MENU_SIZE.exportWidth;
      canvas.height = MENU_SIZE.exportHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('El navegador no pudo crear el lienzo de exportación.');

      context.fillStyle = '#442314';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await canvasToPngBlob(canvas);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function createPdfBlob() {
    if (!window.PDFLib?.PDFDocument) {
      throw new Error('No se pudo cargar la biblioteca para crear el PDF.');
    }

    const pngBlob = await createPngBlob();
    const pdf = await window.PDFLib.PDFDocument.create();
    const image = await pdf.embedPng(await pngBlob.arrayBuffer());
    const page = pdf.addPage([MENU_SIZE.width, MENU_SIZE.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: MENU_SIZE.width,
      height: MENU_SIZE.height,
    });
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  function preparePdf() {
    if (preparedPdfBlob) return Promise.resolve(preparedPdfBlob);
    if (!pdfBuildPromise) {
      pdfBuildPromise = createPdfBlob()
        .then(blob => {
          preparedPdfBlob = blob;
          return blob;
        })
        .finally(() => { pdfBuildPromise = null; });
    }
    return pdfBuildPromise;
  }

  function showError(error) {
    console.error(error);
    window.alert(error.message || 'No se pudo completar la exportación.');
  }

  document.getElementById('openShare').addEventListener('click', () => {
    hideEditHint();
    shareDialog.showModal();
    whatsappButton.disabled = true;
    whatsappButton.textContent = 'Preparando PDF…';

    preparePdf().then(blob => {
      const file = new File([blob], FILE_NAMES.pdf, { type: 'application/pdf' });
      const canShareFile = Boolean(
        navigator.share
        && navigator.canShare
        && navigator.canShare({ files: [file] }),
      );
      whatsappButton.dataset.canShare = String(canShareFile);
      whatsappButton.textContent = canShareFile
        ? 'Compartir PDF por WhatsApp'
        : 'Descargar PDF para WhatsApp';
      whatsappButton.disabled = false;
    }).catch(error => {
      whatsappButton.textContent = 'No se pudo preparar el PDF';
      whatsappButton.disabled = true;
      showError(error);
    });
  });

  document.getElementById('closeShare').addEventListener('click', () => shareDialog.close());

  whatsappButton.addEventListener('click', async () => {
    try {
      const blob = preparedPdfBlob || await preparePdf();
      const file = new File([blob], FILE_NAMES.pdf, { type: 'application/pdf' });
      if (whatsappButton.dataset.canShare === 'true') {
        try {
          await navigator.share({
            title: 'Menú Margarita',
            text: 'Menú semanal de Margarita',
            files: [file],
          });
          shareDialog.close();
          setStatus('✓ PDF compartido', true);
        } catch (error) {
          if (error.name !== 'AbortError') throw error;
        }
        return;
      }

      downloadBlob(blob, FILE_NAMES.pdf);
      shareDialog.close();
      setStatus('✓ PDF descargado; adjúntalo en WhatsApp', true);
    } catch (error) {
      showError(error);
    }
  });

  document.getElementById('exportImage').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      downloadBlob(await createPngBlob(), FILE_NAMES.image);
      shareDialog.close();
      setStatus('✓ Imagen exportada', true);
    } catch (error) {
      showError(error);
    } finally {
      button.disabled = false;
      button.textContent = 'Imagen PNG';
    }
  });

  document.getElementById('exportPdf').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      downloadBlob(await preparePdf(), FILE_NAMES.pdf);
      shareDialog.close();
      setStatus('✓ PDF exportado', true);
    } catch (error) {
      showError(error);
    } finally {
      button.disabled = false;
      button.textContent = 'Descargar PDF';
    }
  });

  return { createPdfBlob, createPngBlob, invalidate };
}
