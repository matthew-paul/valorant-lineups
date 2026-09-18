# Valorant Lineups

[valorant-lineups.com](https://valorant-lineups.com) is an interactive VALORANT lineup browser built with React and strict TypeScript. It plots ability landing positions on each map, connects them to the player's starting position, and presents the images, video, tags, description, and attribution for the selected lineup.

**LLM agents: start with [AGENTS.md](AGENTS.md), then use the [documentation index](docs/README.md) to load the references for your task.** The documentation prioritizes exact file/symbol maps, observable behavior, data contracts, invariants, and verification over generic framework tutorials.

The frontend is hosted on **Vercel** and the backend runs on **AWS Lambda**, as confirmed by the maintainer. This repository contains the frontend only; [deployment documentation](docs/DEPLOYMENT.md) distinguishes confirmed facts from external settings that are not recorded here.

![Valorant Lineups website](images/website-screenshot.gif)

## What the app does

- Filters lineups by map, agent, ability, and any combination of tags.
- Clusters nearby landing markers so overlapping lineups remain usable.
- Draws the path from a lineup's start position to its landing position.
- Supports map pan, zoom, and 90-degree rotation while keeping markers readable.
- Opens individual lineups at shareable `/:lineupId` URLs.
- Lets users hide individual lineups in their browser and restore them later.
- Shows image walkthroughs, YouTube videos, credits, and an EmailJS feedback form.
- Includes unlinked maintainer screens for creating, selecting, editing, and deleting lineup records.

## Quick start

### Prerequisites

- Use the Node.js version required by `engines.node` in [package.json](package.json); see the [verified toolchain](docs/DEVELOPMENT.md#establish-the-workspace-before-editing).
- [Yarn Classic](https://classic.yarnpkg.com/) 1.22.22

The repository pins Yarn 1.22.22 through `packageManager` and tracks `yarn.lock`, so use Yarn when changing dependencies. If no `yarn` command is installed, use `corepack yarn` in its place. After installing dependencies, all checks also work through `npm run <script>` without creating another lockfile.

```sh
git clone https://github.com/matthew-paul/valorant-lineups.git
cd valorant-lineups
yarn install --frozen-lockfile
yarn start
```

Open [http://localhost:3000](http://localhost:3000). The development server reloads when bundled source files change. After editing Sass during a running session, run `yarn css:build` to update the CSS the app imports.

The frontend is not fully self-contained: lineup records come from a hard-coded AWS API, while images, videos, fonts, IP lookup, and feedback use external services. You need network access, and request-based services such as the API must allow your local origin.

## Using the lineup viewer

1. Choose a map and agent. Ascent and Sova are selected by default.
2. Optionally choose one ability and one or more tags. Multiple tags use **AND** matching: a result must contain every selected tag.
3. Hover over an ability marker to see a red line to its start position.
4. Click a marker. A single-lineup marker opens its instructions immediately; a cluster shows start markers so you can choose a lineup.
5. Pan or zoom the map as needed. The rotation buttons turn the map without rotating the ability icons.
6. Use the copy icon beside a lineup title to copy its production URL.

The **Hide this lineup** checkbox is stored locally in the browser. Use **Clear hidden lineups** to restore all hidden entries. Lineup data is cached for ten days; successful maintainer mutations invalidate that cache for the next load. Browsing still works when local storage is unavailable, although preferences cannot persist.

## Commands

| Command | Purpose |
| --- | --- |
| `yarn start` | Compile Sass and run the Create React App development server on port 3000. |
| `yarn typecheck` | Run the strict TypeScript compiler without emitting files. |
| `yarn lint` | Lint all TypeScript source and tests, failing on warnings. |
| `yarn test` | Run all Jest and Testing Library tests once, serially. |
| `yarn test:watch` | Run the test suite in interactive watch mode. |
| `yarn test:coverage` | Run the suite once and write a coverage report. |
| `yarn css:build` | Compile `src/scss/main.scss` to the checked-in minified CSS and source map. |
| `yarn build` | Compile Sass and create an optimized, source-map-free production bundle in `build/`. |
| `yarn verify` | Run the full typecheck, lint, test, and production-build gate. |
| `yarn eject` | Eject Create React App. This is irreversible and is not part of the normal workflow. |

## Routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Public | Interactive lineup viewer. |
| `/:lineupId` | Public | Viewer with one lineup selected by its API record ID. |
| `/about` | Public | Project background, attribution, and a local-storage reset control. |
| `/send` | Maintainer | Create a lineup and POST it to the remote API. Requires an API key. |
| `/select` | Maintainer | Map-based selector that stores a lineup in local storage and opens `/edit`. |
| `/edit` | Maintainer | Edit or delete the lineup placed in `localStorage.editMarker`. Requires an API key. |

Only `/` and `/about` appear in the navigation. The maintainer routes mutate the configured remote backend; do not use them with an API key unless you intend to change that data.

## Repository map

```text
public/                         Create React App HTML and PWA assets
images/                         README media
src/
  App.tsx                       BrowserRouter route table
  pages/                        Typed viewer, info, and maintainer screens
  component-utils/
    constants.ts                API URL and typed map/agent/ability/tag catalogs
    lineup-site-utils/          Lineup details, media, tags, and feedback
    map-utils/                   Map, marker, and pan/zoom wrappers
    design-utils/, edit-utils/  Maintainer forms
    responsive-pinch-zoom-pan/  Locally modified image zoom implementation
  services/
    lineup-data.ts              Validated loading, caching, filtering, clustering
    lineup-admin.ts             Validation, payloads, and maintainer mutations
  types/lineup.ts               Shared domain and form interfaces
  test-utils/                   Reusable typed test fixtures
  resources/
    Agents/                     Ability marker images
    Maps/                       1000 x 1000 map images
    Lineups/lineups.json        Historical local snapshot; not loaded at runtime
    sampleLineup.json           Legacy sample; see the data-model warning
  scss/                         Sass source files
  css/main.min.css              Checked-in CSS actually imported by the app
```

Tests live beside the source they cover as `*.test.ts` and `*.test.tsx`. They cover cache and API validation, filters and clustering, admin payloads and failures, deep-link behavior, maintainer selection, catalog helpers, map markers, content behavior, tag ordering, and pinch/zoom utilities.

## Documentation

Use the [task-oriented documentation index](docs/README.md) to select the smallest useful set of references. These guides primarily serve LLM agents; behavior and operations references also support human maintainers.

| Reference | Covers |
| --- | --- |
| [Agent instructions](AGENTS.md) | Working rules, source map, invariants, and completion evidence. |
| [Development](docs/DEVELOPMENT.md) | Setup, commands, TypeScript patterns, styles, assets, dependencies, and change recipes. |
| [Architecture](docs/ARCHITECTURE.md) | Components, state, routing, request lifecycle, caching, map math, and integrations. |
| [User behavior](docs/USER_GUIDE.md) | Observable public-route behavior and current UI limits. |
| [Maintainer workflows](docs/MAINTAINER_GUIDE.md) | Create/select/edit/delete flows, validation, pending requests, and recovery. |
| [Lineup data](docs/LINEUP_DATA.md) | Field schemas, stable IDs, catalogs, coordinates, storage, and extension checklists. |
| [API reference](docs/API_REFERENCE.md) | Request/response contracts, validation boundaries, errors, and mutation payloads. |
| [Testing](docs/TESTING.md) | Test suites, fixtures, mocks, appropriate checks, and browser verification. |
| [Deployment](docs/DEPLOYMENT.md) | Vercel build/routing, Lambda boundary, CORS, releases, rollback, and unknown configuration. |
| [Security and privacy](docs/SECURITY.md) | Credentials, trust boundaries, browser storage, external services, and dependency risks. |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Symptom-driven diagnosis for development, viewer, maintainer, and hosting problems. |
| [Contributing](CONTRIBUTING.md) | Contribution and review checklist. |
| [Cleanup review](docs/REVIEW.md) | Findings, fixes, historical verification, and remaining limitations. |

## Project boundaries

This repository contains the React frontend only. The Vercel project settings, Lambda source and deployment, API Gateway configuration, database, API-key management, EmailJS setup, DNS, and media hosting are external. Historical references to AWS services do not establish the current infrastructure topology. There are no application-specific environment-variable reads: service identifiers and the API endpoint are embedded in the client source. See the [deployment guide](docs/DEPLOYMENT.md) before changing an integration.

The project began as a more interactive alternative to [this community Google Slides deck](https://docs.google.com/presentation/d/1lC66dZQBioIc2E_sOvXS3ZoNykfSPl0Xj5qaDqknwwA/present?slide=id.g8d7eda0435_9_159). Current work is primarily UI maintenance and lineup catalog updates.

## Legal

VALORANT and its assets are owned by Riot Games. This project was created under Riot Games' “Legal Jibber Jabber” policy and is not endorsed or sponsored by Riot Games.

No open-source license file is included in this repository. Copyright remains with the respective owners unless a license is added.
