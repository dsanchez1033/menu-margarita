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

En `index.html`, toca o haz clic sobre cualquier día, plato, refresco, precio o número celular. En computadora aparece un lápiz junto al dato al pasar el cursor o enfocarlo con el teclado. También puedes abrir la edición con Enter o la barra espaciadora. Escribe el nuevo valor y pulsa **Guardar**. Los cambios se conservan en el navegador aunque recargues la página. El botón **Restablecer** recupera los valores iniciales incrustados en el HTML. El lápiz es una ayuda de la interfaz y no aparece al imprimir ni al exportar.

El botón **Compartir** permite descargar el menú visible como imagen PNG o PDF. También ofrece **Compartir PDF por WhatsApp**: en dispositivos compatibles abre el menú nativo para elegir WhatsApp y un contacto. Si el navegador no admite compartir archivos, descarga `menu-margarita.pdf` para adjuntarlo manualmente. Todos los archivos incluyen los cambios guardados en el navegador; los controles de edición no aparecen en la exportación.

Los nombres de los días permanecen fijos. El contacto, logotipos y fotografías se conservan del original.

## Generar un menú

Edita `menu-margarita.json` y ejecuta desde esta carpeta:

```bash
python3 scripts/render.py menu-margarita.json index.html
```

El script usa únicamente la biblioteca estándar de Python, verifica que estén presentes las 18 variables y escapa los valores para evitar que se interpreten como HTML. También puedes sustituir las variables con un motor de plantillas que admita esta sintaxis y escape HTML.

Los platos admiten saltos de línea (`\n` en JSON). El ejemplo mantiene los saltos del original. El JavaScript de la plantilla espera a que cargue la fuente y ajusta los textos que excedan sus espacios; debe permanecer habilitado para el ajuste y los saltos de línea. No se necesitan librerías externas.

## Fidelidad y tipografía

El lienzo mantiene las medidas exactas del PDF: 595,5 × 842,25 puntos. Las posiciones, colores y tamaños de los textos se extrajeron del PDF. Las pequeñas diferencias de suavizado entre un navegador y un visor PDF dependen de su motor de renderizado.

Los platos, refrescos, precios y teléfono usan [Barlow SemiBold](https://github.com/google/fonts/tree/main/ofl/barlow), una tipografía de trazos claros con mayúsculas, minúsculas, tildes, ñ, cifras y puntuación. La fuente y su licencia SIL Open Font License están incrustadas en el HTML; funcionan sin conexión y se incluyen también en las exportaciones PNG/PDF. Se sustituyó Ahkio en estos campos porque el PDF solo incluía un subconjunto de letras, lo que mezclaba tipografías al escribir palabras nuevas. Los encabezados fijos y las fechas conservan el estilo original. El teléfono tiene un espacio propio a la derecha del icono de WhatsApp y reduce su tamaño si el número es largo.

En pantallas de hasta 820 px, los controles de edición y compartir aparecen debajo del menú, sin superponerse al diseño y con espacio para el área segura del dispositivo.

## Publicar en GitHub Pages

El proyecto incluye `.github/workflows/pages.yml`. Cada cambio enviado a las ramas `main` o `master` publica únicamente `index.html` como un sitio estático.

1. Sube esta carpeta a un repositorio de GitHub.
2. En **Settings → Pages**, selecciona **GitHub Actions** en **Source**.
3. Envía los cambios a `main` o `master`, o ejecuta manualmente **Deploy GitHub Pages** desde la pestaña **Actions**.

GitHub Pages sirve el sitio con HTTPS, requisito de los navegadores para compartir archivos desde el menú nativo. En equipos o navegadores que no admitan compartir un PDF directamente, el botón de WhatsApp descarga el archivo para adjuntarlo manualmente.

## Imprimir

Abre el menú generado, espera a que se muestre y utiliza Imprimir / Guardar como PDF. Mantén escala 100 %, sin márgenes y sin encabezados ni pies del navegador. La regla `@page` conserva el tamaño original; activa los gráficos de fondo si tu navegador lo solicita.
