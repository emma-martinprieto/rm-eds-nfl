# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--nfl-hub--eds-realmadrid.aem.page/nfl/ (una rama: `https://{rama}--nfl-hub--eds-realmadrid.aem.page/nfl/`; inglés: `/nfl/en/`)
- Live: https://main--nfl-hub--eds-realmadrid.aem.live/nfl/

## Estructura

La landing vive en la carpeta `/nfl`:

- **Código:** `nfl/` (`blocks`, `scripts`, `styles`, `fonts`, `icons`, `images`, `calendar`). En la raíz quedan `head.html`, `404.html`, la configuración, los workflows y los archivos de verificación de dominio (`well-known/`).
- **Páginas en DA:** `/nfl/` (español) y `/nfl/en/` (inglés), con `nav`, `footer` y `placeholders` en cada una (`/nfl/nav`, `/nfl/en/nav`…).
- La carpeta está en `SITE_ROOT` (`nfl/scripts/placeholders.js`). `head.html` y `404.html` no pueden importarla y llevan `/nfl/` escrito; si cambia, hay que tocar los tres.

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Evento del calendario (.ics)

El botón «Recuérdamelo» del bloque `event-countdown` usa dos fuentes con los datos del evento:

- **Campos `ics-*` del bloque en DA** (`ics-title`, `ics-start`, `ics-end`, `ics-location`, `ics-description`), en la página española y en la inglesa (`/nfl/en/`). Con ellos se generan en el navegador Google Calendar, Outlook y la opción «Apple Calendar u otro (.ics)» del escritorio.
- **Archivos fijos de `nfl/calendar/`** (publicados en `/nfl/calendar/`), que se usan en iPhone/iPad (Safari solo ofrece «Añadir al calendario» con un archivo publicado):
  - `nfl/calendar/nfl-madrid-game.ics` (español)
  - `nfl/calendar/nfl-madrid-game-en.ics` (inglés, por defecto en las páginas bajo `/nfl/en/`)

**Si cambia la hora o los textos del evento, hay que actualizar las dos cosas:** los `ics-*` en DA (español e inglés) y los dos archivos de `nfl/calendar/`, porque son fijos y no leen DA. En los `.ics`, las horas van en UTC (`DTSTART`/`DTEND`) y las comas del texto se escriben `\,`.

## Valores propuestos (pendientes de validar por diseño)

Valores que no vienen del Figma ni de los tokens y que ha hecho falta proponer. Están en `nfl/styles/styles.css` (bloque `:root` de valores propios) marcados como «PROPUESTO»; si diseño los cambia, basta con tocar la variable.

| Variable | Valor propuesto | Dónde se usa |
|---|---|---|
| `--shadow-dialog` | `0 24px 64px` en `--color-bg-dark` al 40 % (`0 var(--spacing-md) var(--spacing-2xl) …`) | Sombra del panel del lightbox de noticias (web y tablet) |
| `--table-first-col` (en `nfl/blocks/table/table.css`) | `30%` | Ancho de la primera columna del bloque Table |

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`; the landing is at `http://localhost:3000/nfl/`)
1. Open the `nfl-hub` directory in your favorite IDE and start coding :)
