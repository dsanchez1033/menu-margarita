# Menú Margarita

Sitio estático para editar, imprimir y compartir el menú semanal de Margarita. El diseño conserva las medidas del PDF original y funciona en cualquier servidor web estático, incluido GitHub Pages.

## Estructura

```text
.
├── index.html                 # Menú generado y listo para publicar
├── menu-template.html         # Plantilla con las 18 variables editables
├── menu-margarita.json        # Contenido del menú actual
├── assets/
│   ├── css/                   # Fuentes, diseño del menú y controles
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

El generador usa únicamente la biblioteca estándar de Python. Comprueba que la plantilla contenga las 18 variables esperadas, exige todos los valores y los escapa antes de insertarlos en el HTML. Los platos admiten saltos de línea mediante `\n` en JSON.

Para generar un sitio en otra carpeta:

```bash
python3 scripts/render.py menu-margarita.json public/index.html
```

En ese caso también se copia `assets` a `public/assets`, por lo que la carpeta resultante queda lista para publicar.

| Día | Número de día | Plato | Refresco |
| --- | --- | --- | --- |
| Lunes | `{{lunes_dia}}` | `{{lunes_plato}}` | `{{lunes_refresco}}` |
| Martes | `{{martes_dia}}` | `{{martes_plato}}` | `{{martes_refresco}}` |
| Miércoles | `{{miercoles_dia}}` | `{{miercoles_plato}}` | `{{miercoles_refresco}}` |
| Jueves | `{{jueves_dia}}` | `{{jueves_plato}}` | `{{jueves_refresco}}` |
| Viernes | `{{viernes_dia}}` | `{{viernes_plato}}` | `{{viernes_refresco}}` |

Las variables restantes son `{{precio_menu}}`, `{{precio_carta}}` y `{{telefono}}`. En los precios se introduce solo el importe; el diseño agrega `S/`. En los refrescos se introduce solo el nombre; el diseño agrega `Refresco:`.

## Edición y exportación

En móvil, toca un dato y después el lápiz. En computadora, haz clic en el dato o utiliza Enter o la barra espaciadora. Los cambios se guardan bajo la clave `menu-margarita-edicion-v1` de `localStorage` y se conservan mientras se use el mismo origen web.

El botón **Restablecer** recupera los valores generados originalmente. El botón **Compartir** permite:

- descargar una imagen PNG;
- descargar un PDF;
- compartir el PDF mediante el menú nativo del dispositivo o descargarlo para adjuntarlo en WhatsApp.

La exportación incorpora las imágenes y fuentes en una copia del SVG, por lo que los archivos descargados no dependen del servidor. Los controles de edición tampoco aparecen en la imagen, el PDF ni la impresión.

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
