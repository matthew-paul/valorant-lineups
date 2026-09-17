# TypeScript cleanup review

Verification snapshot: **2026-09-17**, from the TypeScript cleanup. Later documentation-only edits do not rerun or refresh these test, bundle, API, or audit results.

The review started from an existing uncommitted TypeScript migration. That work, the map/agent catalogs, permanent IDs, and image assets were preserved. Three parallel reviewers covered data/services, pages/forms/routing, and map/media/navigation components. A second independent pass checked their integration and identified an additional StrictMode touch-listener bug, which was fixed.

## Completed changes

- All application source and tests use `.ts`/`.tsx`. JavaScript source is disabled, strict checking is enabled, and unused locals/parameters fail compilation. Shared domain types and correlated mutation arguments prevent invalid request/payload combinations. No `any` or TypeScript suppression directives were added.
- Cache validation now rejects mismatched map buckets and invalid timestamps. Blocked storage and quota failures no longer prevent loading valid network data. Clustering handles unsorted inputs and never merges different agents' abilities.
- Viewer routes respond to direct links and browser history. Map changes refresh markers immediately, and selecting a clustered lineup retains its start-marker choices. Obsolete async loads cannot overwrite a newer mounted view.
- Create/edit forms validate both positions, title, video, images, and API key. Both screens accept and normalize YouTube IDs and supported URLs. Image entries are trimmed and deduplicated. Pending mutations block repeated submissions and form changes; failures preserve drafts for retry.
- Successful mutations invalidate the cache. Edits update the saved record, and deletes remove the selection. A delete following a map reassignment uses the updated map ID. Editor persistence avoids overwriting another tab's different selection.
- Image zoom uses container-relative pinch coordinates, correct overflow calculations, measurable dimensions, and updated scale settings. Screenshot changes reset zoom, and native touch listeners survive StrictMode remounts. Scoped wheel handling replaces global scroll locking.
- Clipboard success waits for the write to succeed, and failures are visible. Credit hyperlinks allow only HTTP(S); other values remain text. Feedback supports newlines, rejects blank submissions, blocks duplicate sends, and cleans up requests/timers. Feedback delivery was mocked in tests.
- Navigation uses accessible buttons, keyboard focus, and Escape behavior. Form controls are labeled, API keys are masked, and the Info page clears only application storage keys.
- Removed unused packages, duplicate icon dependencies, the no-op web-vitals template, and obsolete GraphQL configuration. Updated app metadata and fixed Info styles. Startup/build hooks compile Sass automatically; the aggregate verification command works with npm or Yarn.

## Verification

Verified with Node.js 22.13.1 and Yarn Classic 1.22.22:

| Check | Result |
| --- | --- |
| Frozen lockfile install | Passed |
| `npm run verify` | Passed: strict compiler, ESLint with zero warnings allowed, tests, Sass compilation, production build |
| Jest / React Testing Library | 159 tests across 15 suites passed; baseline was 84 tests across 9 suites |
| Actual page integrations | Public viewer, direct links/history, `/about`, `/send`, `/select`, `/edit`, create/edit/delete success and failure paths |
| Production HTTP smoke | Six routes served with a local SPA fallback; all 26 referenced/public assets returned successfully |
| Live read-only API schema check | All 273 returned records across 11 map buckets passed runtime validation |
| Map assets | All 12 PNGs remain 1000 × 1000 |
| Source/diff checks | No `.js`/`.jsx` under `src`, no TypeScript bypass directives, no whitespace errors |

The production JavaScript bundle is approximately 192.3 kB gzip, down from 204.06 kB at the start of this review; the unused web-vitals chunk was also removed.

No connected browser was available, so visual layout, real pointer/touch behavior, clipboard permissions, and live media/feedback delivery were not manually verified. Component tests exercise the interactions in jsdom; they do not replace a real-browser check. The HTTP smoke check verifies a local SPA server, not the external production host. No production lineup or feedback mutations were performed.

## Dependencies and remaining findings

The lockfile was refreshed within the declared package ranges, keeping React 18.2, TypeScript 4.9.5, and Create React App 5.0.1. React declaration overrides prevent mixed React 18/19 types. The existing working `nwsapi` release is pinned because the refreshed version broke jsdom selector queries; this regression was caught by the route/form tests. Patched Lodash and Underscore versions replace vulnerable transitive pins.

Yarn audit reported **454 findings before the refresh** (19 critical, 246 high, 152 moderate, 37 low) and **24 afterward** (0 critical, 7 high, 14 moderate, 3 low). These are registry advisory/dependency-path counts, not confirmed exploitable application defects; repeated dependency paths can count more than once.

The remaining packages are:

| Area | Packages flagged by the audit | Follow-up boundary |
| --- | --- | --- |
| CRA asset/build tooling | `nth-check`, `svgo`, `postcss` under `resolve-url-loader`, `serialize-javascript` | Patched ranges require updating/replacing the parent tooling; major overrides were not forced into incompatible consumers. |
| Development server | `webpack-dev-server`, `uuid` under SockJS | Requires a coordinated server/toolchain upgrade. |
| Test environment | `@tootallnate/once` under jsdom's proxy agent | Requires upgrading the Jest/jsdom dependency chain. |
| Router | `react-router` | Registry reports two moderate advisories against the installed v6 line; assess and migrate the router separately. |

These findings remain open. There is no claim of a clean security audit. A future toolchain/router migration should retain this regression suite and repeat the full verification and dependency audit. CRA and React Router also emit deprecation/future-migration notices; those are separate from ESLint warnings and do not fail the verified build.

Backend authorization, deployment rewrites/CORS, external media availability, and EmailJS configuration remain outside this repository. The application still uses its existing service endpoints and desktop-oriented layout.
