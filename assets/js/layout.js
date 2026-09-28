import { SVG_NAMESPACE } from './config.js';

const MAX_LAYOUT_ATTEMPTS = 100;
const FONT_REDUCTION_FACTOR = 0.97;
const PLATE_BASELINE_ADJUSTMENT = 3;

function splitIntoLines(source, maximumWidth, maximumLines, measure) {
  const paragraphs = source.split(/\r?\n/);
  const normalizedParagraphs = paragraphs.length > maximumLines
    ? [paragraphs.join(' ')]
    : paragraphs;
  const lines = [];

  for (const paragraph of normalizedParagraphs) {
    if (maximumLines === 1) {
      lines.push(paragraph);
      continue;
    }

    let currentLine = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (currentLine && measure(candidate) > maximumWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    lines.push(currentLine);
  }

  return lines;
}

export function createLayoutManager(fields) {
  function layoutField(element) {
    const value = element.dataset.value || '';
    const source = value ? `${element.dataset.prefix || ''}${value}` : '';
    const initialFontSize = Number(element.dataset.initial || element.getAttribute('font-size'));
    const maximumWidth = Number(element.dataset.width);
    const maximumLines = Number(element.dataset.lines || 1);
    const lineHeight = Number(element.dataset.leading || initialFontSize);
    const centers = (element.dataset.centers || element.getAttribute('x')).split(',').map(Number);
    const measure = value => {
      element.textContent = value;
      return element.getComputedTextLength();
    };

    element.dataset.initial = String(initialFontSize);
    let fontSize = initialFontSize;
    let lines = [];

    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      element.setAttribute('font-size', String(fontSize));
      lines = splitIntoLines(source, maximumWidth, maximumLines, measure);

      const fits = lines.length <= maximumLines
        && lines.every(line => measure(line) <= maximumWidth);
      if (fits || attempt === MAX_LAYOUT_ATTEMPTS - 1) break;
      fontSize *= FONT_REDUCTION_FACTOR;
    }

    element.replaceChildren();
    lines.forEach((line, index) => {
      const span = document.createElementNS(SVG_NAMESPACE, 'tspan');
      span.setAttribute('x', String(centers[Math.min(index, centers.length - 1)]));
      span.setAttribute('y', String(Number(element.getAttribute('y')) + index * lineHeight));
      span.textContent = line;
      element.append(span);
    });

    if (element.classList.contains('editable')) {
      element.setAttribute(
        'aria-label',
        `Editar ${element.dataset.label}: ${element.dataset.value}`,
      );
    } else {
      element.removeAttribute('aria-label');
    }
  }

  function compactRows() {
    for (const group of document.querySelectorAll('.day-card')) {
      const plate = group.querySelector('.plato');
      const drink = group.querySelector('.refresco');
      if (!plate || !drink) continue;

      const maximumLines = Number(plate.dataset.lines || 1);
      const lineCount = Math.max(1, plate.querySelectorAll('tspan').length);
      const lineHeight = Number(plate.dataset.leading || plate.dataset.initial);
      const baseY = Number(plate.getAttribute('y'));
      const compactOffset = Math.max(0, maximumLines - lineCount) * lineHeight / 2;
      const plateY = baseY + compactOffset - PLATE_BASELINE_ADJUSTMENT;

      plate.querySelectorAll('tspan').forEach((span, index) => {
        span.setAttribute('y', String(plateY + index * lineHeight));
      });

      const drinkLine = drink.querySelector('tspan');
      if (drinkLine) drinkLine.setAttribute('y', String(plateY + lineCount * lineHeight));
    }
  }

  function layoutAll() {
    fields.forEach(layoutField);
    compactRows();
  }

  return { compactRows, layoutAll, layoutField };
}
