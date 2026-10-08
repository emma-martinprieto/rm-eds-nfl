# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

## Avoid
- Code lives in `nfl/` (blocks, scripts, styles, fonts, icons, images, calendar); pages live under `/nfl/` (es) and `/nfl/en/` (en). `SITE_ROOT` in `nfl/scripts/placeholders.js`; `head.html` and `404.html` stay at the root with `/nfl/` hardcoded.
- `nfl/scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/nfl/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/nfl/scripts/`.

## Outdated
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.

## Remember
- `npx -y @adobe/aem-cli up`: local code, previewed content.
- Merging `main` ships code; content publishes separately.
- A PR without a `{branch}--nfl-hub--eds-realmadrid.aem.page/nfl/{path}` link is rejected.
- All committed files are served. Use `.hlxignore`.
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).
