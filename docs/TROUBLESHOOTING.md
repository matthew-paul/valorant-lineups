# Troubleshooting reference

Use the symptom table to select a narrow investigation. Capture the exact command/route, source commit, browser origin, and first error before changing code. Source and current logs take precedence over a historical successful run in [REVIEW.md](REVIEW.md).

## Setup, compiler and build

| Symptom | Inspect first | Likely cause and next action |
| --- | --- | --- |
| `yarn` is not recognized | `node --version`, `corepack --version`, `packageManager` in [package.json](../package.json) | A missing shim does not mean dependencies are invalid. Use `corepack yarn` when available; otherwise install the pinned Yarn Classic version through the approved local tooling. |
| PowerShell reports an `npm.ps1` access/policy error | Exact shim/path in the error | Use `npm.cmd run <script>` without changing machine-wide execution policy. |
| `react-scripts`, `tsc` or `sass` is missing | Working directory and completion of dependency installation | Run the frozen Yarn install from the repository root. Build dependencies must be installed; do not install arbitrary global copies to mask missing local packages. |
| Frozen install rejects the manifest/lockfile | Diff of `package.json` and `yarn.lock` | Resolve an intentional dependency change with Yarn and commit both files together. Do not silently discard the lockfile. |
| Vercel rejects an invalid or discontinued Node.js `18.x` version | Deployment commit's `package.json` and Vercel Node.js Version setting | Deploy the commit with the current `engines.node` requirement. See [the runtime override and build contract](DEPLOYMENT.md#build-contract); this failure happens before application compilation. |
| Registry/cache access fails | URL, filesystem path, proxy/network permissions in the error | This is environmental unless evidence says otherwise. Preserve the lockfile; use the allowed network/cache location. Do not bypass TLS validation. |
| `ReactTags` cannot be used as JSX, incompatible `ReactNode`, or missing `refs` | Installed React declaration versions and Yarn resolutions | Wildcard transitive types can pull React 19 into the React 18 project. Retain the aligned `@types/react`/`@types/react-dom` resolutions and reinstall from lockfile. |
| Tests throw `contains` parameter is not a `Node` inside nwsapi/getComputedStyle | `nwsapi` resolution and installed version | During the cleanup, 2.2.27 broke Jest 27/jsdom 16 accessible queries. The checked-in working pin is 2.2.2. Reassess with a coordinated test-environment upgrade, not by weakening accessible queries. |
| JSX compiles in tests but `typecheck` fails | Compiler output and [tsconfig.json](../tsconfig.json) | Jest's transform is not the TypeScript checker. Fix the type contract; do not add `any` or `@ts-ignore`. |
| Styles did not change after editing Sass | Imported CSS in [index.tsx](../src/index.tsx), generated CSS diff | Run `npm run css:build`. `prestart` and `prebuild` run once; a live dev server is not a Sass watcher. |
| Development works but production build fails | Earliest error from `npm run build` | Check asset filename case, undeclared dependencies, type/lint errors, and build environment. Bundle output belongs in `build/`. |
| Warnings mention React Router v7, deprecated middleware, or Node APIs | Exit code and actual assertion/compiler output | Distinguish notices from failures. Do not globally suppress logs or migrate major packages as an incidental fix. |
| Changes are absent from a served site | Commit/build identity, asset URLs, Vercel deployment | Establish which artifact is served before modifying source. A successful local build is not a deployment. |

## Viewer, cache and media

| Symptom | Evidence | Next action |
| --- | --- | --- |
| Viewer stays on loading | Network request/promise, console | There is no client timeout. Determine whether GET is pending, preflight is blocked, or the service is unreachable. Reload after resolving the cause. |
| `Lineup request failed with status ...` | Actual GET status | Investigate API Gateway/backend availability; this is distinct from a schema error. |
| `Lineup response did not match the expected schema` | Redacted response compared with `isLineupRecord` | One invalid record rejects the full response. Check missing fields/string-vs-number values before loosening validation. [API reference](API_REFERENCE.md) |
| No markers but no request error | Map/agent/ability/tags, hidden IDs, loaded records | Tags are ANDed; registered assets do not imply data exists. Unsupported agent/ability records are skipped when rendering markers. |
| Old lineups after a backend change | `savedLineups` and `lastRetrievedTime` | Valid cached records last ten days. Invalidate only cache keys and reload; deployed JS and record data have separate caches. |
| A just-edited lineup still appears old in another open tab | In-memory page state and browser origin | Success invalidates storage for future loads, not already-mounted state; reload. Other origins/devices retain their own cache. |
| Hide/restore works until reload | Storage errors or private-mode restrictions | The viewer can update memory even when persistence fails. Do not make browsing depend on writable storage. |
| Unknown link shows the empty detail prompt | ID vs loaded records | An unknown ID does not trigger a second lookup request. Check cache/ID; unsupported map/agent references have a different error. |
| Copy fails | Clipboard support, secure origin, permission rejection | Use HTTPS/localhost and inspect the rejection. The UI should show failure, never success before the write finishes. |
| Copy points to production from a preview | [ContentFrame.tsx](../src/component-utils/lineup-site-utils/ContentFrame.tsx) | This is implemented behavior: copied URLs use `https://valorant-lineups.com`. Changing it is a product/configuration change. |
| Map markers/arrows drift after an asset change | PNG dimensions, orientation, stored positions, CSS transforms | Preserve 1000 × 1000 geometry, 25-pixel marker sizing, rotation centers and offset conventions. A new image can invalidate old coordinates even at the same size. |
| Screenshot zoom anchors incorrectly or works only outside StrictMode | [PinchZoomPan.tsx](../src/component-utils/responsive-pinch-zoom-pan/PinchZoomPan.tsx) lifecycle/geometry tests | Check container-relative coordinates and native-listener remount cleanup. Do not disable StrictMode to hide lifecycle bugs. |
| Image/video does not display | Media URL, HTTP status, browser console/CSP, embed restrictions | The frontend does not host uploads or guarantee external media. Validate the record and host before changing the renderer. |
| Fonts/layout differ locally | Font requests, generated CSS, viewport | Google Fonts may be blocked; layout is desktop-oriented. Check the same CSS artifact and viewport before inferring a TypeScript regression. |

## Maintainer screens and feedback

| Symptom | Evidence | Next action |
| --- | --- | --- |
| `/select` cannot open the editor | Stored `editMarker`, visible error, popup blocking | Storage must accept the handoff. Allow the intended tab or open `/edit` on the same origin after verifying the saved selection. |
| `/edit` is empty/disabled | Whether `editMarker` exists | Choose a lineup on `/select` first. Direct navigation does not fetch a record for editing. |
| Saved-selection error | JSON/type validation and catalog lookup | Re-select a valid supported record. Do not invent defaults that could overwrite the wrong lineup. |
| Positions disappear after map change | Selected map value | This is intentional: both start and landing coordinates must be placed again for the new image. |
| Form refuses submission | First visible validation message | Check the [required fields and validation rules](MAINTAINER_GUIDE.md#fields-defaults-and-validation). Images are optional. |
| POST returns 401/403 or a CORS error | OPTIONS vs POST, header names, key scope, origin | Backend authorization/CORS is external. Do not expose the key in a troubleshooting log or assume the `/development` stage permits test writes. |
| Submit controls remain disabled | Pending fetch vs settled response | A request guard prevents duplicates; no request timeout is implemented. Check the remote outcome before retrying a possibly completed create/delete. |
| Delete uses an unexpected map | Last saved marker vs unsaved map selection | Delete deliberately uses the last successfully saved record's map ID. A successful map edit updates that identity. |
| Multiple editor tabs disagree | Which record each tab loaded, current `editMarker` | The saved selection is one origin-wide slot; mounted editors retain their state. This client sends no version/conflict metadata and has no automatic cross-tab refresh; backend conflict handling is unknown. |
| Feedback lookup fails | geolocation-db request | Lookup failure leaves IP empty and must not prevent sending. The lookup is separate from EmailJS delivery. |
| Feedback send fails or duplicates | Mock/service response, pending guard, EmailJS account limits | Preserve draft/retry behavior and inspect the configured service externally if authorized. Do not send real feedback as a regression test. |

## Targeted cache reset

For an intended local cache refresh, run in the browser console on the affected origin, then reload:

```js
localStorage.removeItem("savedLineups");
localStorage.removeItem("lastRetrievedTime");
```

This keeps hidden-lineup preferences and the editor selection. The `/about` reset also removes `hiddenMarkers` and `editMarker`, so it has a broader local effect. Do not replace targeted runtime cleanup with `localStorage.clear()`. Storage may throw in restricted browser contexts; shared helpers in [lineup-data.ts](../src/services/lineup-data.ts) handle those failures in application code.

## Production routing and cloud failures

- **`/` works, deep-link refresh is 404:** inspect Vercel's SPA fallback/framework settings. React cannot handle a route if the host never serves the HTML entry point.
- **JavaScript URL returns HTML:** a rewrite or wrong artifact/base path is catching static assets. Compare `build/asset-manifest.json` and actual response content types.
- **Preview works visually but API fails:** inspect that preview origin's CORS behavior; frontend previews do not create a new Lambda/API environment.
- **Backend schema/authorization failure:** obtain the actual Lambda source/configuration or owner. No backend implementation exists in this repository to patch.
- **Frontend rollback did not restore deleted data:** static deployment rollback and API data recovery are separate operations; there is no client undo endpoint.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the confirmed Vercel/Lambda boundary and the exact external configuration still needed.

## Useful handoff evidence

Report the affected file/symbol or route, reproducible steps, expected/actual result, source/deployment identity, Node/Yarn or browser version, whether cache was present, redacted status/error details, checks run, and the narrow external fact needed next. Exclude API keys, full personal feedback messages, and unrelated browser/account data.
