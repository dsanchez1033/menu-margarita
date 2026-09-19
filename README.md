# Plantilla del menú semanal

`menu-template.html` es el archivo listo para integrar. Incluye el fondo original a 288 ppp, fotografías y fuente dentro del propio HTML; se puede copiar como un único archivo y funciona sin conexión. Los textos variables son texto real en SVG dentro del HTML. El resto del diseño conserva los elementos del PDF.

`index.html` es la versión final de Menú Margarita, lista para abrir, imprimir o publicar. `menu-template.html` conserva las variables y `menu-margarita.json` contiene los datos editables del menú actual.

## Variables

| Día | Número de día | Plato | Refresco |
| --- | --- | --- | --- |
| Lunes | `{{lunes_dia}}` | `{{lunes_plato}}` | `{{lunes_refresco}}` |
| Martes | `{{martes_dia}}` | `{{martes_plato}}` | `{{martes_refresco}}` |
| Miércoles | `{{miercoles_dia}}` | `{{miercoles_plato}}` | `{{miercoles_refresco}}` |
| Jueves | `{{jueves_dia}}` | `{{jueves_plato}}` | `{{jueves_refresco}}` |
| Viernes | `{{viernes_dia}}` | `{{viernes_plato}}` | `{{viernes_refresco}}` |

Precios: `{{precio_menu}}` y `{{precio_carta}}`. El celular usa `{{telefono}}`. Introduce solo el importe; `S/` está en la plantilla. Introduce solo el nombre de la bebida; `Refresco:` ya está en el diseño.

## Edición directa

En `index.html`, haz doble clic sobre cualquier día, plato, refresco, precio o número celular. Escribe el nuevo valor y pulsa **Guardar**. Los cambios se conservan en el navegador aunque recargues la página. El botón **Restablecer** recupera los valores de `menu-margarita.json`.

El botón **Compartir** permite descargar el menú visible como imagen PNG o PDF. También ofrece **Compartir PDF por WhatsApp**: en dispositivos compatibles abre el menú nativo para elegir WhatsApp y un contacto. Si el navegador no admite compartir archivos, descarga `menu-margarita.pdf` para adjuntarlo manualmente. Todos los archivos incluyen los cambios guardados en el navegador; los controles de edición no aparecen en la exportación.

Los nombres de los días permanecen fijos. El contacto, logotipos y fotografías se conservan del original.

## Generar un menú

Edita `menu-margarita.json` y ejecuta desde esta carpeta:

```bash
python3 scripts/render.py menu-margarita.json index.html
```

El script usa únicamente la biblioteca estándar de Python, verifica que estén presentes las 17 variables y escapa los valores para evitar que se interpreten como HTML. También puedes sustituir las variables con un motor de plantillas que admita esta sintaxis y escape HTML.

Los platos admiten saltos de línea (`\n` en JSON). El ejemplo mantiene los saltos del original. El JavaScript de la plantilla espera a que cargue la fuente y ajusta los textos que excedan sus espacios; debe permanecer habilitado para el ajuste y los saltos de línea. No se necesitan librerías externas.

## Fidelidad y tipografía

El lienzo mantiene las medidas exactas del PDF: 595,5 × 842,25 puntos. Las posiciones, colores y tamaños de los textos se extrajeron del PDF. Las pequeñas diferencias de suavizado entre un navegador y un visor PDF dependen de su motor de renderizado.

La fuente Ahkio incrustada en el PDF es un subconjunto: incluye los caracteres usados en el original y todos los dígitos, pero no el alfabeto completo. Por ejemplo, faltan `k`, `q`, `x`, `í`, varias mayúsculas y el punto decimal. Los caracteres ausentes se muestran con una fuente de respaldo. Para conservar exactamente la tipografía con cualquier nuevo plato o precio, es necesario sustituir el `src` de `@font-face` por una copia completa de Ahkio que tengas autorizada. El ejemplo proporcionado usa solo caracteres originales y conserva la tipografía.

## Publicar en GitHub Pages

El proyecto incluye `.github/workflows/pages.yml`. Cada cambio enviado a las ramas `main` o `master` publica únicamente `index.html` como un sitio estático.

1. Sube esta carpeta a un repositorio de GitHub.
2. En **Settings → Pages**, selecciona **GitHub Actions** en **Source**.
3. Envía los cambios a `main` o `master`, o ejecuta manualmente **Deploy GitHub Pages** desde la pestaña **Actions**.

GitHub Pages sirve el sitio con HTTPS, requisito de los navegadores para compartir archivos desde el menú nativo. En equipos o navegadores que no admitan compartir un PDF directamente, el botón de WhatsApp descarga el archivo para adjuntarlo manualmente.

## Imprimir

Abre el menú generado, espera a que se muestre y utiliza Imprimir / Guardar como PDF. Mantén escala 100 %, sin márgenes y sin encabezados ni pies del navegador. La regla `@page` conserva el tamaño original; activa los gráficos de fondo si tu navegador lo solicita.
