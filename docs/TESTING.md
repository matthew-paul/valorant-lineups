# Testing and verification

Use this document to choose evidence for a change. The automated suite runs through Create React App's Jest 27/jsdom environment with React Testing Library. It does not launch a browser or deploy the app. [AGENTS.md](../AGENTS.md) defines the repository invariants; [REVIEW.md](REVIEW.md) records an earlier completed verification run.

## Commands

Run from the repository root after the frozen Yarn install described in [DEVELOPMENT.md](DEVELOPMENT.md).

| Purpose | Command |
| --- | --- |
| Complete gate | `npm run verify` |
| TypeScript only | `npm run typecheck` |
| ESLint, warnings fail | `npm run lint` |
| All tests once, one worker | `npm test` |
| Interactive watch | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| One exact suite | `npm test -- --runTestsByPath src/services/lineup-data.test.ts` |
| Related suites | `npm test -- --runTestsByPath src/pages/LineupSite.test.tsx src/pages/SelectLineupPage.test.tsx` |
| Match a test description | `npm test -- --testNamePattern="clipboard"` |
| Sass and production bundle | `npm run build` |

All named scripts also work through Yarn. When using `corepack yarn test`, pass Jest arguments directly; the explicit `--` above is npm's argument separator. In PowerShell, substitute `npm.cmd` if the PowerShell shim errors. Use Yarn for installation/dependency changes, not `npm install`.

`verify` stops at the first failed phase. Jest's Babel transform can pass despite TypeScript errors, so tests alone do not replace `typecheck`. `lint` uses the React App and Jest rules from [package.json](../package.json). `build` runs `prebuild`, which regenerates the tracked CSS and source map before webpack compilation.

## Suite map

| Suite | Contract exercised |
| --- | --- |
| [App.test.tsx](../src/App.test.tsx) | Real routes, direct lineup links, one mounted viewer, browser back/forward, maintainer/info page rendering |
| [lineup-data.test.ts](../src/services/lineup-data.test.ts) | Record/cache parsing, expiry and map buckets, storage failures, fetching, filters, clusters and arrow geometry |
| [lineup-admin.test.ts](../src/services/lineup-admin.test.ts) | Form validation, timestamped payloads, request headers, success and failure responses |
| [youtube-video.test.ts](../src/services/youtube-video.test.ts) | Supported video IDs/URLs, timestamp normalization, repeated saves, malformed timestamps and unsupported inputs |
| [YoutubeEmbed.test.tsx](../src/component-utils/lineup-site-utils/YoutubeEmbed.test.tsx) | Timestamped iframe URLs, legacy bare IDs, start-time changes, invalid video values |
| [LineupSite.test.tsx](../src/pages/LineupSite.test.tsx) | Deep-link/parameter selection, unknown IDs, request/storage failures, retained cluster choices, image-load versus request state |
| [SelectLineupPage.test.tsx](../src/pages/SelectLineupPage.test.tsx) | Single-marker edit selection, tab opening, map-change refresh, storage failure |
| [LineupAdministration.test.tsx](../src/pages/LineupAdministration.test.tsx) | Actual create/edit forms, normalized request data, duplicate-submit guards, retries, map resets, updated-map deletion, corrupt stored selections |
| [constants.test.ts](../src/component-utils/constants.test.ts) | Catalog lookup, stable supported selections, uniqueness and map ordering, optional icon handling |
| [Map.test.tsx](../src/component-utils/map-utils/Map.test.tsx) | Map transforms/events, ability fallback images, marker scale/rotation, start-marker callbacks |
| [ContentFrame.test.tsx](../src/component-utils/lineup-site-utils/ContentFrame.test.tsx) | Content, immutable hidden-ID updates, persistence failure, clipboard completion/error, safe credit links |
| [EmailForm.test.tsx](../src/component-utils/lineup-site-utils/EmailForm.test.tsx) | Blank input, newlines, one request in flight, normalized feedback fields, retry and unmount cleanup |
| [ImageFrame.test.tsx](../src/component-utils/lineup-site-utils/ImageFrame.test.tsx) | Screenshot changes reset zoom; wheel listener is scoped and removed |
| [TagList.test.tsx](../src/component-utils/lineup-site-utils/TagList.test.tsx) | Difficulty/side ordering without mutating input |
| [Navbar.test.tsx](../src/component-utils/navbar/Navbar.test.tsx) | Open/close without unintended navigation, focus, Escape, link navigation |
| [PinchZoomPan.test.tsx](../src/component-utils/responsive-pinch-zoom-pan/PinchZoomPan.test.tsx) | Container-relative pinch anchoring in StrictMode, child style preservation, changed scale settings, measurable initialization |
| [Utils.test.ts](../src/component-utils/responsive-pinch-zoom-pan/Utils.test.ts) | Geometry, dimensions, scale constraints, overflow, refs, event cancellation |

The cleanup review ran 159 tests in 15 suites. Counts are historical: rerun after source/dependency changes and report the actual result.

## Change-to-check matrix

| Changed area | Focused checks | Additional evidence |
| --- | --- | --- |
| Record/cache/filter/cluster service | Service suite plus viewer and selector suites | Full gate; inspect clustered markers and filter combinations if browser available |
| Add/edit/delete contract | Admin service and administration suites | Full gate; no real API key is needed |
| Routing/navigation | App, viewer, navbar suites | Full gate; direct refresh and history on a served production build |
| Catalog/asset | Constants and map suites | Full gate; image dimensions, stable IDs, coordinate alignment on affected maps |
| Screenshot zoom | Utils, PinchZoomPan, ImageFrame suites | Full gate; real mouse/touch and image replacement |
| Feedback/clipboard/credits | EmailForm and ContentFrame suites | Full gate; browser permissions and failure states when available |
| Sass/layout | Relevant component tests if behavior changed | CSS regeneration, build, desktop/small viewport inspection |
| Dependencies/compiler | Full gate and frozen install | Fresh audit, startup, browser smoke checks; recheck resolutions |
| Documentation only | Source/command/link review; `git diff --check` | Confirm no runtime files changed; full app checks are unnecessary unless examples alter code |

## Fixtures, mocks, and regression style

Use [makeLineup](../src/test-utils/lineup-fixtures.ts) to create a complete typed record and override only the fields relevant to a test:

```ts
const lineup = makeLineup({
  id: "cluster-choice",
  mapId: 1,
  agent: 13,
  ability: 1,
  x: 100,
  y: 200,
});
```

This fixture's `example.com` media and synthetic video ID are test data, not guaranteed playable content. The historical JSON under `resources` is not the fixture source.

- Service loaders accept injected `fetcher`, storage, URL, and time values. Use those seams for deterministic expiry and failure tests.
- Page tests replace `globalThis.fetch` and reset local storage. Selectors mock `window.open`; clipboard tests mock `navigator.clipboard.writeText`; feedback tests mock `emailjs-com` and IP lookup.
- Deferred promises verify that a second click cannot submit a second mutation. Test rejection and retry, not only successful completion.
- Prefer accessible roles/labels and observable user outcomes. Existing real form tests exercise React Select and React Tags rather than replacing the whole form with a stub.
- jsdom has no real layout. Pinch tests explicitly define dimensions/bounds; narrow `testing-library/no-node-access` exceptions explain those geometry/cleanup needs. Do not copy them into unrelated tests.
- Exercise mount/unmount and StrictMode when changing native listeners, timers, or async state. Restore mocks and fake timers after each test.
- Add tests for a bug or changed contract, not a copy of implementation details. Avoid snapshots of large generated React Select markup.

No global network-interception layer is configured: [setupTests.ts](../src/setupTests.ts) only loads jest-dom matchers. A new test must mock any fetch/email/popup side effect it introduces. The current suite is designed to run without live lineup mutations or feedback sends.

## Coverage and its limits

Coverage writes to ignored `coverage/`; open `coverage/lcov-report/index.html` after a successful run. There is no configured coverage threshold or checked-in browser/visual test runner. A high percentage does not establish Vercel routing, CORS, AWS authorization, media availability, keyboard completeness, or real touch behavior. Inspect meaningful branches rather than adding tests solely to raise a metric.

## Browser verification checklist

Use local or preview frontend URLs with known synthetic/test data when authoring behavior is involved. The URL alone does not isolate the backend; follow [SECURITY.md](SECURITY.md) and the task's authorized scope.

1. Load `/`, a known `/:lineupId`, an unknown ID, and `/about`. Refresh the deep link. Verify back/forward changes selection without duplicate viewers.
2. Change map, agent, ability, and multiple tags. Confirm AND matching, empty results, hidden-lineup exclusion, and restore behavior.
3. Check single and clustered markers, hover arrows, alternate start positions, both rotation directions, pan, and min/max zoom.
4. Open different screenshots after zooming; test wheel, drag, pinch, and double tap on relevant devices. Leaving/removing an image must not lock page scrolling.
5. Test copy success/rejection and safe credit links. Verify feedback layout/validation with sends mocked or a separately authorized test service.
6. Render `/send`, `/select`, and `/edit` without a production key. Exercise field input and marker placement; test real mutation requests only against an explicitly identified test backend or as part of an authorized data operation.
7. Inspect menu keyboard focus, Escape, form labels, desktop layout, narrow viewports, slow/error media, and blocked storage.
8. Check console/network output for actual errors; distinguish known toolchain migration notices from failures.

Record browser/version, viewport/device, routes and interactions checked, data source, and limitations. If no browser is available, report that directly rather than converting jsdom results into a claim of visual verification.

## Interpreting failures

React Router future-flag notices and Node/toolchain deprecations can appear during passing tests. TypeScript errors, ESLint warnings/errors, failed assertions, build failures, and unhandled requests require investigation. Do not silence console output globally to hide a failure. Known dependency-resolution failures and cache symptoms are mapped in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
