# Contributing

Use this as the contribution and review checklist. LLM agents should begin with [AGENTS.md](AGENTS.md), then select references from the [documentation index](docs/README.md). The frontend runs on Vercel and uses an external AWS Lambda backend; local execution and preview deployment do not imply an isolated backend.

## Development setup

### Requirements

- Use the Node.js version required by `engines.node` in [package.json](package.json); see the [verified toolchain](docs/DEVELOPMENT.md#establish-the-workspace-before-editing).
- Yarn Classic 1.22.22, pinned in `package.json`. Use `corepack yarn` if the `yarn` shim is unavailable. The repository tracks a Yarn v1 lockfile and no npm lockfile.
- A modern browser with `fetch` and local-storage support. Clipboard copying additionally requires HTTPS or localhost.

Install and start the application:

```sh
yarn install --frozen-lockfile
yarn start
```

Open [http://localhost:3000](http://localhost:3000). Network access is required for the lineup API, remote screenshots, YouTube, Google Fonts, the feedback IP lookup, and EmailJS.

See [Development](docs/DEVELOPMENT.md) for setup and implementation recipes, and [Testing](docs/TESTING.md) for change-specific verification. Documentation-only changes need source/command/link checks and a diff review; they do not require rebuilding unchanged application code.

There are no required `.env` files. The app currently reads no application-specific environment variables; changing a service endpoint or identifier means changing source code and rebuilding.

## Before making a change

1. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the relevant route and data flow.
2. Read [docs/LINEUP_DATA.md](docs/LINEUP_DATA.md) before changing any map, agent, ability, tag, record, or coordinate.
3. Check the working tree and preserve unrelated changes.
4. Decide whether the change belongs in a shared service or affects both `LineupSite.tsx` and the maintainer selector, `SelectLineupPage.tsx`.
5. Do not use `/send`, `/edit`, or a real API key merely to test layout; those routes POST to the configured remote endpoint.

## Source guide

| Area | Primary files |
| --- | --- |
| Routes and global shell | `src/App.tsx`, `src/component-utils/navbar/` |
| Public viewer state and interactions | `src/pages/LineupSite.tsx` |
| Map rendering | `src/component-utils/map-utils/` |
| Detail panel, media, tags, feedback | `src/component-utils/lineup-site-utils/` |
| Catalog IDs and imported assets | `src/component-utils/constants.ts` |
| Data loading, cache, filtering, clustering | `src/services/lineup-data.ts` |
| Form validation, payloads, API mutations | `src/services/lineup-admin.ts` |
| Shared domain and form types | `src/types/lineup.ts` |
| Create/edit/delete tooling | `src/pages/DesignLineup.tsx`, `EditLineup.tsx`, `SelectLineupPage.tsx`; shared forms under `component-utils/design-utils/` and `edit-utils/` |
| Tests and shared fixtures | Colocated `*.test.ts(x)` files and `src/test-utils/` |
| Editable style sources | `src/scss/` |
| Compiled style loaded by the app | `src/css/main.min.css` and `.map` |
| Map and ability assets | `src/resources/Maps/`, `src/resources/Agents/` |

## Coding expectations

- Keep the project valid under the strict settings in `tsconfig.json`. The codebase mixes typed class components and small functional components.
- Reuse the interfaces in `src/types/lineup.ts`; add a shared domain type there instead of recreating incompatible local record shapes.
- Do not add `any`, `// @ts-nocheck`, JavaScript source files, or runtime PropTypes to bypass a typing problem.
- Keep persisted catalog IDs numeric and stable. Never renumber an existing map, agent, ability, or tag for display-order convenience.
- Treat the 1000 by 1000 map coordinate system and 25 by 25 marker size as an API contract.
- Keep direct browser side effects—local storage, clipboard, window navigation, and external requests—easy to locate and test.
- Put data/cache/filter/cluster changes in `services/lineup-data.ts` so the public viewer and maintainer selector continue to share one implementation.
- Put mutation validation, payload, and request changes in `services/lineup-admin.ts` so create, edit, and delete behavior remains consistent and testable.
- Preserve deep-link behavior at both `/` and `/:lineupId` when changing routes or selection state.
- Do not commit API keys or other credentials. The API-key field is intentionally runtime input.
- Update documentation in the same change whenever behavior, setup, data fields, catalog IDs, or external services change.

TypeScript is configured with `allowJs: false`, `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `isolatedModules: true`, and `noEmit: true`. Run `yarn typecheck` after changing source or test types; a successful Babel/Jest transform alone is not a substitute for the compiler.

## Styling workflow

The app imports the checked-in `src/css/main.min.css`. The `prestart` and `prebuild` hooks compile Sass automatically before starting or building. During a running development session, recompile after editing Sass so the generated CSS triggers a reload.

After editing a Sass file, run:

```sh
yarn css:build
```

Then:

1. Confirm both `src/css/main.min.css` and `src/css/main.min.css.map` reflect the source change.
2. Run the development server and inspect the affected public and maintainer routes.
3. Check the full-viewport layout at several window sizes.
4. For map changes, test pan, zoom, both rotation directions, hover lines, single markers, and multi-lineup clusters.
5. Run a production build so CSS imports and minification are validated.

If your editor compiles Sass automatically, configure the same input and outputs and inspect the diff for unrelated reformatting.

## Catalog and lineup changes

Do not edit `src/resources/Lineups/lineups.json` expecting the viewer to change. It is an unused historical snapshot. `src/resources/sampleLineup.json` is also unused and has obsolete field names.

For a map, agent, ability, or tag change, follow the extension checklists in [docs/LINEUP_DATA.md](docs/LINEUP_DATA.md). In particular:

- Every map image must remain 1000 by 1000.
- Every enabled agent needs an `ABILITY_LIST[agentId]` entry.
- Add only explicitly selected lineup-relevant abilities; ability icons are optional and use the generic marker until supplied.
- Ability IDs only have meaning together with an agent ID.
- Existing numeric values must remain stable because backend records store them.
- New tag styling requires recompiling the Sass output.

Lineup content itself is stored in the external backend. The unlinked `/send`, `/select`, and `/edit` tools are the only authoring UI in this repository. Mutations require an API key, report non-success HTTP responses, and still have intentionally limited field validation, so follow the documented workflow and verify the final record after clearing the ten-day browser cache.

When only testing an authoring-screen UI change, leave the API-key field blank and do not submit. A local mock API is not included.

## Verification

Run the checks appropriate to the change. The complete gate for every code or style change is:

```sh
yarn verify
```

It expands to:

```sh
yarn typecheck
yarn lint
yarn test
yarn build
```

The committed Jest and Testing Library suites cover shared data/cache utilities, filtering and clustering, admin payloads and HTTP failures, direct-link synchronization, maintainer selection, catalog helpers, map and marker rendering, lineup content, tag ordering, and pinch/zoom math. Add focused tests next to changed modules. Use `yarn test:watch` while iterating and `yarn test:coverage` when reviewing coverage.

`yarn lint` checks all `.ts` and `.tsx` files and fails on warnings. There is no standalone format script and no checked-in CI workflow; Create React App also runs its configured ESLint checks during development and production compilation. Do not substitute `yarn check` for the documented gate: Yarn Classic reserves that command for its own dependency verification; this repository's aggregate script is `yarn verify`.

### Manual viewer checklist

- `/` loads remote or cached lineups and defaults to Ascent/Sova.
- Map, agent, ability, and tag controls update the marker set.
- Multiple tags use AND matching.
- Marker hover draws a start-to-target line.
- A one-record cluster opens details; a multi-record cluster shows selectable start markers.
- Pan, zoom, left rotation, and right rotation keep marker positions aligned.
- A copied lineup link has the expected ID, and opening `/:lineupId` directly selects that record.
- Browser back/forward updates the selected lineup appropriately.
- Hiding a lineup removes it, survives reload, and can be cleared.
- Images can be zoomed and the content panel remains usable afterward.
- The feedback popup opens. Do not send a test message unless external delivery is intended.

### Maintainer UI checklist

- `/send` changes maps and places both target and start markers correctly.
- `/select` can disambiguate a clustered marker and opens `/edit` with the correct `editMarker` data.
- `/edit` restores selects, tags, media values, and positions from local storage.
- Never exercise add, edit, or delete against the remote API without authorization to change its data.

### Static-host checklist

If deployment behavior changes, serve the production bundle with a single-page-app fallback and directly request:

- `/`
- `/about`
- a real `/:lineupId`
- one unlinked maintainer route

All routes must return `index.html`; otherwise direct links will work through client navigation but fail on refresh.

## Dependency changes

The dependency graph has a few historical constraints:

- The app uses a modified, TypeScript-converted pinch/zoom implementation under `component-utils/responsive-pinch-zoom-pan/`, not the similarly named published package.
- Its `reselect` and `warning` imports are direct dependencies and should remain so while the local implementation uses them. Zoom controls share the existing `react-icons` dependency with the rest of the app.
- `react-map-interaction` still declares `prop-types` as a peer dependency, even though application components use TypeScript interfaces instead of PropTypes.
- `react-tag-input` is paired with its compatible React DnD 14 packages.
- Create React App 5 constrains the supported TypeScript/tooling upgrade path; validate dependency upgrades with the strict compiler, all tests, and the production build.
- `react-error-overlay` follows Create React App's declared version range; the obsolete 6.0.9 override has been removed.
- Yarn resolutions keep all React declarations on the same React 18 versions. Without these, wildcard dependencies can install incompatible React 19 types alongside the application types.
- `nwsapi` is pinned to the repository's previously working 2.2.2 release for Jest 27/jsdom 16. The 2.2.27 selector engine throws during accessible-name queries in real `react-select` tests. Revisit this pin with a Jest/jsdom upgrade.
- Lodash and Underscore resolutions select patched versions beyond old transitive pins. Keep the form and production-build tests when revisiting these overrides.

Before removing or upgrading one of these packages, run a clean frozen install and production build. If the local pinch/zoom implementation remains, declare every module it imports directly instead of relying on transitive dependencies.

Browser targets come from `package.json`: production supports `>0.2%`, excludes dead browsers and Opera Mini, while development targets the latest Chrome, Firefox, and Safari. If those targets change, refresh Browserslist data intentionally and review the generated bundle.

See [the cleanup review](docs/REVIEW.md) for the verified results and remaining dependency advisories. Passing application tests is not a clean security audit.

## Pull-request checklist

- [ ] The change is scoped and unrelated working-tree changes are untouched.
- [ ] Stable catalog IDs and the coordinate contract are preserved or deliberately migrated.
- [ ] Shared viewer/selector behavior is changed in the common service and both UIs remain consistent.
- [ ] Sass changes are reflected in the checked-in CSS and source map.
- [ ] `yarn typecheck` succeeds with no opt-outs added.
- [ ] `yarn lint` succeeds with no warnings.
- [ ] `yarn test` succeeds and relevant behavior has regression coverage.
- [ ] `yarn build` succeeds.
- [ ] Relevant manual routes and interactions were checked.
- [ ] No API key, credential, or unintended remote mutation is included.
- [ ] README and detailed docs match the changed behavior.
