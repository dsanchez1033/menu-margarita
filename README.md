# Menú Margarita

Sitio estático para editar, imprimir y compartir el menú semanal de Margarita. El diseño conserva las medidas del PDF original y funciona en cualquier servidor web estático, incluido GitHub Pages.

## Estructura

```text
.
├── index.html                 # Menú generado y listo para publicar
├── menu-template.html         # Plantilla con precios y contacto editables
├── menu-margarita.json        # Precios y teléfono iniciales
├── assets/
│   ├── css/                   # Fuentes, diseño del menú y controles
│   ├── data/                  # Catálogos compartidos de platos y refrescos
│   ├── fonts/                 # Tipografías y licencia de Barlow
│   ├── images/                # Fondo e icono de WhatsApp
│   ├── js/                    # Edición, diseño, almacenamiento y exportación
│   └── vendor/                # pdf-lib, conservada en su versión original
└── scripts/render.py          # Generador sin dependencias externas
```

`menu-template.html` es la fuente del HTML. `index.html` se vuelve a generar desde la plantilla y no debe mantenerse manualmente.

## Ejecutar localmente

Los módulos JavaScript y los recursos deben servirse mediante HTTP. Desde la raíz del proyecto ejecuta:

```bash
python3 -m http.server 8000
```

Después abre [http://localhost:8000](http://localhost:8000). Abrir `index.html` mediante doble clic no es un modo soportado.

## Editar y generar el menú

Actualiza `menu-margarita.json` y ejecuta:

```bash
python3 scripts/render.py menu-margarita.json index.html
```

El generador usa únicamente la biblioteca estándar de Python. Comprueba que la plantilla contenga `{{precio_menu}}`, `{{precio_carta}}` y `{{telefono}}`, exige sus valores y los escapa antes de insertarlos en el HTML.

Para generar un sitio en otra carpeta:

```bash
python3 scripts/render.py menu-margarita.json public/index.html
```

En ese caso también se copia `assets` a `public/assets`, por lo que la carpeta resultante queda lista para publicar.

En los precios se introduce solo el importe; el diseño agrega `S/`. Las fechas y la configuración diaria se calculan y guardan en el navegador.

## Catálogos de platos y refrescos

Los archivos `assets/data/platos.json` y `assets/data/refrescos.json` son arrays de textos:

```json
[
  "Pollo a la olla",
  "Milanesa con papas fritas y cremas"
]
```

Edita estos archivos y vuelve a publicar el proyecto para cambiar las opciones compartidas. La interfaz también permite elegir **Agregar nuevo…**. Esas opciones se guardan únicamente en el navegador y pueden eliminarse desde **Gestionar opciones personalizadas**. Platos y refrescos se muestran alfabéticamente; un selector con fondo dorado indica que el valor elegido es personalizado.

## Edición y exportación

Al cargar la página se muestran las fechas de lunes a viernes de la siguiente semana calendario. Pulsa el signo `+` de un día para seleccionar plato y refresco o marcar **No hay clases**. Una caja configurada puede abrirse nuevamente con clic, toque, Enter o la barra espaciadora; **Vaciar día** recupera su estado inicial.

Los días se guardan bajo `menu-margarita-semana-v1` y se descartan automáticamente cuando cambia la semana objetivo. Las opciones locales usan `menu-margarita-catalogos-v1`. Los precios y el teléfono continúan bajo `menu-margarita-edicion-v1`.

En móvil, toca un precio o teléfono y después el lápiz para editarlos. En computadora, haz clic en el dato o utiliza Enter o la barra espaciadora.

El celular debe contener nueve dígitos, comenzar con `9` y se guarda con el formato `XXX XXX XXX`. **Compartir** se habilita cuando los cinco días están resueltos —con menú o como **No hay clases**—, ambos precios son positivos y el celular es válido.

El botón **Restablecer** recupera los valores generados originalmente. El botón **Compartir** permite:

- descargar una imagen PNG;
- descargar un PDF;
- compartir una imagen PNG mediante el menú nativo del dispositivo o descargarla para adjuntarla en WhatsApp.

La exportación incorpora las imágenes y fuentes en una copia del SVG, por lo que los archivos descargados no dependen del servidor. Los signos `+` y los demás controles tampoco aparecen en la imagen, el PDF ni la impresión.

## Pruebas

```bash
npm run test:js
python3 -m unittest discover -s tests -v
```

Las pruebas de JavaScript usan únicamente el ejecutor incluido en Node.js; no hay dependencias que instalar.

## Publicar en GitHub Pages

El proyecto usa rutas relativas y puede publicarse en la raíz de un sitio o bajo una ruta como `usuario.github.io/nombre-del-repositorio/`.

1. Sube `index.html`, `assets` y los demás archivos del proyecto al repositorio.
2. Abre **Settings → Pages**.
3. En **Source**, selecciona **Deploy from a branch**.
4. Selecciona la rama `main` o `master` y la carpeta `/(root)`.
5. Guarda la configuración y espera a que GitHub Pages publique el sitio.

No se necesita un workflow ni un proceso de compilación para publicar. Cada vez que cambie el JSON, regenera `index.html` antes de enviar los cambios al repositorio.

## Fidelidad, tipografía e impresión

El lienzo mantiene las medidas exactas del PDF: 595,5 × 842,25 puntos. Los encabezados y fechas usan el subconjunto tipográfico del original; platos, refrescos, precios y teléfono usan Barlow SemiBold. Su licencia SIL Open Font License se encuentra en `assets/fonts/OFL-Barlow.txt`.

Para imprimir, usa escala 100 %, sin márgenes y sin encabezados ni pies del navegador. Activa los gráficos de fondo si el navegador lo solicita.
