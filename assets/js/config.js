export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const STORAGE_KEY = 'menu-margarita-edicion-v1';

export const MENU_SIZE = Object.freeze({
  width: 595.5,
  height: 842.25,
  exportWidth: 2382,
  exportHeight: 3369,
});

export const FILE_NAMES = Object.freeze({
  image: 'menu-margarita.png',
  pdf: 'menu-margarita.pdf',
});

export const FONT_ASSETS = Object.freeze([
  {
    family: 'AhkioPDF',
    weight: 400,
    url: new URL('../fonts/AhkioPDF.ttf', import.meta.url).href,
  },
  {
    family: 'MenuText',
    weight: 600,
    url: new URL('../fonts/Barlow-SemiBold.ttf', import.meta.url).href,
  },
]);
