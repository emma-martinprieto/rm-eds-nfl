# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--nfl-hub--eds-realmadrid.aem.page/ (una rama: `https://{rama}--nfl-hub--eds-realmadrid.aem.page/`)
- Live: https://main--nfl-hub--eds-realmadrid.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Evento del calendario (.ics)

El botón «Recuérdamelo» del bloque `event-countdown` usa dos fuentes con los datos del evento:

- **Campos `ics-*` del bloque en DA** (`ics-title`, `ics-start`, `ics-end`, `ics-location`, `ics-description`), en la página española y en la inglesa (`/en/`). Con ellos se generan en el navegador Google Calendar, Outlook y la opción «Apple Calendar u otro (.ics)» del escritorio.
- **Archivos fijos de `/calendar/`**, que se usan en iPhone/iPad (Safari solo ofrece «Añadir al calendario» con un archivo publicado):
  - `calendar/nfl-madrid-game.ics` (español)
  - `calendar/nfl-madrid-game-en.ics` (inglés, por defecto en las páginas bajo `/en/`)

**Si cambia la hora o los textos del evento, hay que actualizar las dos cosas:** los `ics-*` en DA (español e inglés) y los dos archivos de `/calendar/`, porque son fijos y no leen DA. En los `.ics`, las horas van en UTC (`DTSTART`/`DTEND`) y las comas del texto se escriben `\,`.

## Valores propuestos (pendientes de validar por diseño)

Valores que no vienen del Figma ni de los tokens y que ha hecho falta proponer. Están en `styles/styles.css` (bloque `:root` de valores propios) marcados como «PROPUESTO»; si diseño los cambia, basta con tocar la variable.

| Variable | Valor propuesto | Dónde se usa |
|---|---|---|
| `--shadow-dialog` | `0 24px 64px` en `--color-bg-dark` al 40 % (`0 var(--spacing-md) var(--spacing-2xl) …`) | Sombra del panel del lightbox de noticias (web y tablet) |
| `--table-first-col` (en `blocks/table/table.css`) | `30%` | Ancho de la primera columna del bloque Table |

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
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `nfl-hub` directory in your favorite IDE and start coding :)
