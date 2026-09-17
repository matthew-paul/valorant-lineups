# Agent guide

This is the primary entry point for LLM agents working in this repository. Read this file first, then open only the task-relevant references in [docs/README.md](docs/README.md). The user's current instructions take precedence over these repository guidelines.

## Repository identity and boundaries

- React 18 frontend, strict TypeScript, Create React App 5, Yarn Classic 1.22.22.
- The maintainer confirms that **Vercel hosts the frontend** and **AWS Lambda hosts the backend**. This repository contains the frontend only: no Lambda implementation, database schema/provisioning, Vercel project configuration, or release automation is checked in.
- The client calls the API Gateway URL in [constants.ts](src/component-utils/constants.ts). Its `/development` suffix does not establish a safe test environment. Local development and preview builds use the same endpoint unless source code is deliberately changed.
- `/` and `/:lineupId` are public viewers; `/about` is information/reset; `/send`, `/select`, and `/edit` are maintainer tools. Hidden navigation links are not access control.
- [REVIEW.md](docs/REVIEW.md) is a historical verification/audit record, not a guarantee about the current working tree or today's dependency advisories.

## Start a task

1. Inspect `git status --short`. Preserve pre-existing changes and untracked files; the working tree may include an unfinished migration or catalog work.
2. Read [package.json](package.json), the relevant source, and colocated tests before editing. Current source and tests are stronger evidence than prose; investigate disagreements and update affected documentation.
3. Use the task map below. Do not read the entire documentation set for a small change.
4. Implement the requested scope, run the appropriate checks, and report exact results and limits. Distinguish checks you ran from prior review results.

## Task-to-file map

| Task | Start in source | Read next |
| --- | --- | --- |
| Viewer selection, filters, history, hidden markers | [LineupSite.tsx](src/pages/LineupSite.tsx), [lineup-data.ts](src/services/lineup-data.ts) | [Architecture](docs/ARCHITECTURE.md), [viewer behavior](docs/USER_GUIDE.md) |
| Loading, cache, runtime validation, clustering | [lineup-data.ts](src/services/lineup-data.ts), [lineup.ts](src/types/lineup.ts) | [API contract](docs/API_REFERENCE.md), [data model](docs/LINEUP_DATA.md) |
| Create/edit/delete or form fields | [lineup-admin.ts](src/services/lineup-admin.ts), [DesignLineup.tsx](src/pages/DesignLineup.tsx), [EditLineup.tsx](src/pages/EditLineup.tsx), [BaseForm.tsx](src/component-utils/design-utils/BaseForm.tsx) | [Maintainer workflows](docs/MAINTAINER_GUIDE.md), [API contract](docs/API_REFERENCE.md) |
| Maintainer map selection | [SelectLineupPage.tsx](src/pages/SelectLineupPage.tsx) | [Maintainer workflows](docs/MAINTAINER_GUIDE.md) |
| Maps, agents, abilities, tags, assets | [constants.ts](src/component-utils/constants.ts), [resources](src/resources) | [Stable IDs and coordinates](docs/LINEUP_DATA.md) |
| Map rotation/pan/zoom or markers | [map-utils](src/component-utils/map-utils), viewer/selector pages | [Coordinate and transform architecture](docs/ARCHITECTURE.md) |
| Screenshot pinch/zoom | [PinchZoomPan.tsx](src/component-utils/responsive-pinch-zoom-pan/PinchZoomPan.tsx), [Utils.ts](src/component-utils/responsive-pinch-zoom-pan/Utils.ts), [ImageFrame.tsx](src/component-utils/lineup-site-utils/ImageFrame.tsx) | [Architecture](docs/ARCHITECTURE.md), [testing](docs/TESTING.md) |
| Media, clipboard, credits, feedback | [lineup-site-utils](src/component-utils/lineup-site-utils) | [Viewer behavior](docs/USER_GUIDE.md), [security/data handling](docs/SECURITY.md) |
| Routes/navigation | [App.tsx](src/App.tsx), [withRouter.tsx](src/component-utils/withRouter.tsx), [navbar](src/component-utils/navbar) | [Architecture](docs/ARCHITECTURE.md), [deployment](docs/DEPLOYMENT.md) |
| Styling/build/tooling | [scss](src/scss), [index.tsx](src/index.tsx), [package.json](package.json), [tsconfig.json](tsconfig.json) | [Development](docs/DEVELOPMENT.md), [troubleshooting](docs/TROUBLESHOOTING.md) |
| Release, hosting, backend configuration | Frontend build and client contract only | [Deployment and unknown external settings](docs/DEPLOYMENT.md) |

## Invariants to preserve

- **Stable IDs:** never renumber persisted map, agent, ability, or tag IDs for display order. Ability IDs are scoped to their agent. Catalog assets and records are separate; editing historical JSON does not update the API.
- **Coordinates:** all maps and overlays use a 1000 × 1000 coordinate space. Stored positions describe the top-left of 25 × 25 markers. Authoring clicks subtract 12.5; arrow helpers add 13. Asset replacement must preserve alignment with existing records.
- **Filtering:** tags use AND semantics. `null` ability means all abilities. Viewer and maintainer selector share service logic; check both when changing it.
- **Typing:** keep `allowJs: false`, strict mode, and unused-symbol checks. Use shared domain types, typed component props, and `unknown` at external boundaries. Do not hide failures with `any`, TypeScript suppression directives, or broad lint disables.
- **Runtime data:** TypeScript does not validate API/local-storage data. Keep boundary validation; cached buckets must match their records' `mapId`. Do not confuse permissive read validation with stricter authoring validation.
- **Mutations:** keep request-type/payload correlation, HTTP-status failure handling, pending-request guards, draft preservation on failure, and cache invalidation after success. A successful edit updates the saved record's map ID so a subsequent delete targets its current map.
- **Storage:** it is optional for browsing but required for the current selector-to-editor handoff. Use shared safe helpers. Do not replace targeted application-key removal with origin-wide `localStorage.clear()` in runtime code.
- **Lifecycle:** preserve deep-link/history synchronization, stale-load guards, listener/timer cleanup, and React StrictMode behavior. Map zoom and screenshot zoom are different implementations.
- **Styles:** edit Sass sources, then regenerate both checked-in CSS files. `prestart`/`prebuild` compile Sass; a running dev server does not watch Sass itself.

## Commands and verification

Run from the repository root. The reference environment is Node.js 22.13.1; `packageManager` pins Yarn 1.22.22. If `yarn` is absent but Corepack exists, replace `yarn` with `corepack yarn`. On PowerShell, `npm.cmd` avoids the `npm.ps1` wrapper when it causes policy/path errors.

```sh
yarn install --frozen-lockfile
yarn typecheck
yarn lint
yarn test
yarn build
```

`yarn verify` or `npm run verify` runs the compiler, lint, tests, and build in that order. Use Yarn for dependency changes; preserve `yarn.lock` and do not introduce `package-lock.json`. See [TESTING.md](docs/TESTING.md) for focused commands and a change-to-check matrix.

- Runtime or dependency changes: run the full verification gate, with meaningful regression coverage for changed behavior.
- Sass/assets: regenerate CSS where relevant, build, and inspect affected UI when browser access exists.
- Documentation-only: validate source claims, commands, local links, and diffs; do not change dependencies or rerun builds merely to edit prose.
- Report unavailable browser/backend checks explicitly. Passing jsdom tests does not establish real touch behavior, pixel layout, Vercel rewrites, or AWS authorization.

## External effects and unknowns

Routine local edits, read-only inspection, and local tests are part of implementation. A general code task does not request production lineup changes, feedback emails, deployment, or cloud configuration changes. Use mocks for regression tests; perform external writes only when they are part of the user's authorized task. Do not put API keys in source, documentation, fixtures, URLs, or logs.

Do not invent a Vercel project ID/production branch, Lambda function/repository, database, IAM policy, API-key lifecycle, or deployment command. [DEPLOYMENT.md](docs/DEPLOYMENT.md) distinguishes confirmed hosting facts from settings that must be supplied or inspected. Ask for missing external details only when the task depends on them; continue independent local work.

## Completion report

State what changed, the relevant behavior preserved/fixed, commands actually run and their outcomes, and remaining limitations. Update the canonical reference for any changed contract; use links instead of copying the same rules into several documents. Do not claim that a passing build resolves the open security findings recorded in [REVIEW.md](docs/REVIEW.md).
