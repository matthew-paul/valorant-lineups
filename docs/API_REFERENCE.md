# API and service reference

This reference is for agents modifying requests, service helpers, storage, or integrations. It specifies frontend behavior from [lineup-data.ts](../src/services/lineup-data.ts), [lineup-admin.ts](../src/services/lineup-admin.ts), callers, and tests. The owner confirmed that the frontend is hosted on Vercel and the backend runs on AWS Lambda. Lambda source, storage implementation, provisioning, and authorization rules are not contained in this repository.

Read the [data model](LINEUP_DATA.md) for fields/catalog IDs, [maintainer guide](MAINTAINER_GUIDE.md) for record operations, [architecture](ARCHITECTURE.md) for component flow, [deployment](DEPLOYMENT.md) for hosting facts, and [security](SECURITY.md) for trust boundaries. Do not infer backend guarantees from client types or from the endpoint's stage name.

## Agent task map

| Task | Start here | Preserve/check |
| --- | --- | --- |
| Change endpoint | `API_URL` in `constants.ts`; both services | Both read/write callers; deployment origin/CORS; endpoint is compiled into client. |
| Change GET schema | `fetchLineups`, `isLineupRecord`, `isLineupArray`, `LineupRecord` | Whole-array validation, map grouping, caches, editor loading, payload conversion. |
| Change mutation | `build*Payload`, `createMutationRequest`, `sendLineupMutation`, page callers | Exact header/body contracts, request/payload type correlation, response status handling, post-success cache behavior. |
| Change persistence | `parseLineupCache`, `loadLineups`, storage helpers | Failed-storage behavior, bucket/key checks, no false timestamp refresh, selected-record ownership. |
| Diagnose browser-only failure | Network panel plus request shapes below | CORS preflight, status/body, storage denial, external media; CLI success alone is insufficient. |
| Verify safely | Inject `fetcher`, `url`, `storage`, `now`; use linked tests | Unit/integration tests mock writes. Do not use live mutations as automated validation. |

## Endpoint and configuration

`API_URL` in [constants.ts](../src/component-utils/constants.ts) is:

```text
https://uh5it8zn19.execute-api.us-east-1.amazonaws.com/development
```

This is the complete request URL. The frontend appends no resource path, record ID, or query parameters. The hostname identifies an API Gateway endpoint in `us-east-1`; the owner confirms Lambda as the backend runtime. The `/development` segment does not prove this is disposable test data or that localhost uses a separate backend.

There is no application environment-variable override. Changing the shared default requires a source edit/rebuild. Services accept explicit injected URLs/fetchers for tests or other callers; shipped pages use the default. The production copy-link domain is configured separately in [ContentFrame.tsx](../src/component-utils/lineup-site-utils/ContentFrame.tsx).

| Operation | Method | Endpoint | Discriminator | Client authentication |
| --- | --- | --- | --- | --- |
| Read all lineups | `GET` | `API_URL` | None | No API-key header |
| Add | `POST` | `API_URL` | `request-type: add` | `x-api-key` from form |
| Edit | `POST` | `API_URL` | `request-type: edit` | `x-api-key` from form |
| Delete | `POST` | `API_URL` | `request-type: delete` | `x-api-key` from form |

## GET: lineup records

`fetchLineups()` builds this request, including content type despite having no body:

```http
GET /development
Host: uh5it8zn19.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
```

It sends no `Authorization`, API key, pagination, filters, or conditional-cache headers. It loads the complete list and filters by map, agent, ability, hidden IDs, and tags in the browser.

### Expected success body

The response must have `response.ok === true` and a JSON flat array. Empty arrays are valid. This synthetic example uses placeholder media and an illustrative ID:

```json
[
  {
    "id": "example-lineup-001",
    "name": "Example Ascent A recon",
    "description": "Stand at the marked start point and aim at the indicated corner.",
    "agent": 13,
    "ability": 1,
    "mapId": 1,
    "tags": [1, 5, 9, 12],
    "images": ["https://example.com/lineups/aim.jpg"],
    "video": "abcdefghijk",
    "credits": "Example contributor",
    "x": 273.5,
    "y": 179.5,
    "startX": 604.5,
    "startY": 230.5
  }
]
```

The frontend calls `response.json()` without separately validating the response content-type header. It validates every array item using `isLineupRecord`. Grouped objects, envelopes such as `{ "items": [...] }`, missing fields, numeric strings, `null` required fields, malformed array entries, and nonfinite numbers fail the expected shape. One invalid record rejects the complete response; invalid entries are not silently omitted.

The guard checks field types/finite numbers, not catalog membership, integer/positive IDs, nonempty strings, unique record IDs, coordinate bounds, URL syntax, or YouTube-ID syntax. Extra properties are accepted. See [canonical record rules](LINEUP_DATA.md#canonical-record) for the difference between runtime shape and authoring requirements.

### Read errors

| Condition | Service behavior |
| --- | --- |
| Non-success HTTP status | Throws `Lineup request failed with status <status>` before parsing. Does not include GET response body. |
| Success with invalid JSON/empty body | Propagates the `response.json()` rejection. A 204 is unusable because an array body is required. |
| JSON with wrong record shape | Throws `Lineup response did not match the expected schema`. |
| Fetch rejection, including network/CORS failure | Propagates the original rejection; browser JavaScript may not receive a status. |

Viewer/selector display the error and stop their loading indicator. There is no automatic retry, background revalidation, local JSON fallback, or stale-cache offline fallback after an expired cache fails to refresh.

## POST: mutations

All mutations JSON-serialize the body and use these headers:

```http
POST /development
Host: uh5it8zn19.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
x-api-key: <maintainer-entered-api-key>
request-type: add
```

Use `request-type: edit` or `request-type: delete` for those operations. There is no `PUT`, `PATCH`, or HTTP `DELETE` implementation. The following synthetic bodies document shape; they are not instructions to submit examples to the configured backend.

### Add body

`buildAddPayload(state, video)` emits all record fields except `id`:

```json
{
  "name": "Example Ascent A recon",
  "description": "Stand at the marked start point and aim at the indicated corner.",
  "agent": 13,
  "ability": 1,
  "mapId": 1,
  "tags": [1, 5, 9, 12],
  "images": ["https://example.com/lineups/aim.jpg"],
  "video": "abcdefghijk",
  "credits": "Example contributor",
  "x": 273.5,
  "y": 179.5,
  "startX": 604.5,
  "startY": 230.5
}
```

The frontend does not generate IDs. Subsequent GET records must expose an ID so the new lineup can be addressed. The create flow does not parse an assigned ID from POST response text or automatically navigate to the new record. ID generation details are a backend responsibility, not established here.

### Edit body

`buildEditPayload(state, id)` emits a complete object, not a partial patch:

```json
{
  "id": "example-lineup-001",
  "name": "Example Ascent A recon, revised",
  "description": "Updated synthetic instructions.",
  "agent": 13,
  "ability": 1,
  "mapId": 1,
  "tags": [1, 5, 9, 12],
  "images": ["https://example.com/lineups/revised-aim.jpg"],
  "video": "abcdefghijk",
  "credits": "Example contributor",
  "x": 275.5,
  "y": 180.5,
  "startX": 604.5,
  "startY": 230.5
}
```

The editor permits map changes. Payloads contain the newly selected map ID and coordinates with no separate previous-map field. Backend move/replacement semantics are not defined here. The builder emits only declared fields: extra properties accepted by GET are not automatically preserved in edits.

### Delete body

`buildDeletePayload(id, originalMapId)` emits two fields:

```json
{
  "id": "example-lineup-001",
  "mapId": 1
}
```

The caller uses the last successfully saved record's map ID, not an unsaved selection in the map control. A successful edit updates that saved record, so later deletion uses the new map ID. Delete requires a selected record/nonblank API key and bypasses content/position validation.

### Validation layers

UI create/edit calls `validateLineupForm`: nonblank title/API key; selected agent/ability; nonblank text for any supplied image tags; supported YouTube input; and all four coordinates finite and within 0 through 1000 inclusive. Images/description/tags/credits may be empty. When no images are supplied, add/edit payloads retain `images: []`; the field is not omitted or set to `null`. The external backend's acceptance of this payload requires separate integration verification.

Builders trim titles/image URLs, convert selects to numeric IDs, and exclude API keys/UI state. Create normalizes its video before building; edit normalizes it inside `buildEditPayload`. Both retain supported start times in the existing `video` string. Exact accepted inputs are in [form normalization](LINEUP_DATA.md#form-normalization).

Do not conflate these layers:

- `buildAddPayload` checks agent/ability presence but does not repeat all validation or validate its supplied normalized `video`.
- `buildEditPayload` additionally normalizes/rejects video input.
- `createMutationRequest`/`sendLineupMutation` do not validate form content or key authorization.
- TypeScript associates request type with payload shape; these types are erased at runtime.

Callers outside shipped pages must perform appropriate validation themselves. Backend checks remain necessary regardless of client checks.

### Mutation responses/errors

`sendLineupMutation` calls `response.text()`. Any `response.ok` status counts as success; returned text may be empty. There is no required response JSON schema or inspection of a JSON `success` flag. An HTTP 200 body containing an application error is still treated as success by this client; backend failures must use meaningful HTTP statuses.

On non-success it throws:

```text
Lineup <add|edit|delete> request failed with status <status>: <trimmed response text>
```

The suffix is omitted when the trimmed body is empty. A synthetic 403 body of `invalid api key` becomes `Lineup delete request failed with status 403: invalid api key`; this illustrates formatting, not guaranteed backend wording. Fetch failures and body-read rejections propagate.

| Page flow | Success | Failure |
| --- | --- | --- |
| Create | Shows `Sent lineup to database`, ignores body, clears content/coordinates, retains map/agent/ability/API key. | Displays error, preserves draft. |
| Edit | Shows nonempty response text or `Lineup edit request completed`; updates saved record/normalized video. | Displays error, preserves draft and last saved record. |
| Delete | Shows nonempty response text or `Lineup delete request completed`; clears selection/disables editing. | Displays error, retains selection. |

Pages invalidate cached lineups after successful responses. Calling `sendLineupMutation` directly does not invalidate storage.

## Browser cache and storage

`loadLineups` is the shared viewer/selector loader. It returns `{ all, byMap, source }` with `source: "cache" | "network"`. Options require `expirationMs` and permit injected storage, clock (`now`), fetcher, and URL.

Default lifetime: `localStorageExpirationTime = 1000 * 60 * 60 * 24 * 10`, or 864,000,000 milliseconds (ten days). The timestamp is the string form of client epoch milliseconds captured when the load begins, not a server timestamp or HTTP cache validator.

| Key | Representation | Lifetime/owner |
| --- | --- | --- |
| `savedLineups` | JSON grouped object, e.g. `{ "1": [record] }` | `loadLineups`; valid only with fresh valid timestamp. |
| `lastRetrievedTime` | Client epoch milliseconds as string | `loadLineups`; written only after dataset write succeeds. |
| `hiddenMarkers` | JSON string-ID array | Viewer checkbox writes; viewer/selector read; clear controls remove. No expiry. |
| `editMarker` | JSON complete record | Selector writes before opening editor; editor reads/conditionally updates or removes. No expiry. |

### Cache acceptance

`parseLineupCache` requires:

1. Both serialized records and timestamp present.
2. Nonblank timestamp text that converts to a finite nonnegative number no later than `now`.
3. Finite positive expiry and `now - timestamp < expirationMs`; the exact boundary is stale.
4. Parsed non-null object, not an array.
5. Every map key a canonical positive safe-integer string: `"1"` valid; `"01"`, `"1.0"`, empty, or negative keys invalid.
6. Every bucket a valid record array, and each record's numeric `mapId` equal to that key.

An empty grouped object is valid. Current catalog membership is not required. Valid caches skip fetching. Missing/invalid/stale caches trigger GET, grouping, and attempted replacement writes.

### Failure and invalidation behavior

`getBrowserStorage` catches denied access. Reads return `null` on failure; writes/removals return `false`. Network data still displays if storage is denied or full. The timestamp is written only when the dataset write succeeds, avoiding false freshness for an old dataset. A failed timestamp write can cause a later refetch even when new records were stored.

`invalidateLineupCache` independently removes timestamp/dataset keys, preserving hidden markers and editor selection. Storage failures can prevent persistent invalidation. Page flows manage `editMarker` separately. About's reset removes the four application keys, not all origin storage.

`parseHiddenMarkerIds` retains string entries from arrays; malformed JSON/other top-level values yield an empty list. Hiding still changes the current viewer when persistence fails. Editor selection requires a successful `editMarker` write; otherwise the selector reports an error and does not open an empty editor. Before saving/removing `editMarker`, the editor compares its stored ID to avoid overwriting a different record selected in another tab.

Invalidation affects the next load. Already-mounted viewers/selectors retain their in-memory records and need reloading to show changes. There is no storage-event synchronization, cache version, ETag support, or background polling. External changes can stay hidden by a fresh cache until expiry/clearing. Storage is origin/profile scoped; localhost and deployed sites do not share it.

## Frontend and backend boundary

Maintainer routes are unlinked, not protected by frontend login. Nonblank keys pass form validation; only the external backend determines authorization. Keys are sent in `x-api-key`, not query strings/record bodies. This code does not provision/rotate keys, manage accounts, or define permissions. See [security](SECURITY.md).

Lineup fetches use browser defaults except supplied method/headers/body. They set no `credentials`, `mode`, or abort signal. There is no bearer-token implementation or requested cross-origin cookie session.

Cross-origin browser requests require compatible backend CORS. `application/json` is not a CORS-safelisted content type; POST also includes `x-api-key`/`request-type`. Therefore integration must support preflight for the actual methods/headers, including current GET because it sets JSON content type. This repository does not implement `OPTIONS` or define allowed origins. A command-line request succeeding does not establish browser CORS compatibility. Vercel project settings, Lambda function identity, API deployment mappings, and backend repository are external configuration; use [deployment documentation](DEPLOYMENT.md), not guesses.

### Lifecycle limits and unknown guarantees

- Lineup GET/POST helpers have no application timeout, automatic retry/backoff, request cancellation, or shared request deduplication.
- Viewer/selector guards ignore results after unmount/superseded mount; they do not abort requests. Strict Mode can cause duplicate development reads.
- Maintainer pages disable editing and block repeated submissions while pending. This guard only covers that page instance.
- No idempotency token, revision, conditional update header, conflict-resolution protocol, or cross-tab mutation lock is sent. Server support is unknown.
- A lost mutation response does not prove the server rejected the change. Inspect records before manually repeating operations that could duplicate/overwrite data.
- Server pagination, payload limits, rate limits, atomicity, consistency, deletion semantics, ID generation, and storage schema are not established by frontend code.

## Service and type inventory

### Read/cache/geometry exports

From [lineup-data.ts](../src/services/lineup-data.ts):

| Export | Contract |
| --- | --- |
| `fetchLineups(url?, fetcher?)` | Fetch/validate flat array; `Promise<LineupRecord[]>`; no storage access. |
| `loadLineups(options)` | Cache-first loader; `Promise<LoadedLineups>`. |
| `isLineupRecord(value)`, `isLineupArray(value)` | Runtime record/array type guards. |
| `groupLineupsByMap(lineups)` | Build map buckets, preserving order within each bucket. |
| `flattenLineups(grouped)` | Flatten present buckets, skip undefined; numeric-key enumeration can reorder an originally interleaved flat list. |
| `findLineupById(lineups, lineupId)` | First matching ID or `undefined`; undefined search ID returns undefined. |
| `parseLineupCache(records, timestamp, expirationMs, now?)` | Pure parse/validation; `{ lineups, shouldRefresh }`. |
| `parseHiddenMarkerIds(serialized)` | String-ID list or empty array. |
| `getBrowserStorage()` | Browser storage or undefined when inaccessible. |
| `readStorageItem(key, storage?)` | Text or null on missing/failed read. |
| `writeStorageItem(key, value, storage?)` | Boolean write result. |
| `removeStorageItem(key, storage?)` | Boolean removal result. |
| `invalidateLineupCache(storage?)` | Attempt dataset/timestamp removal; `void`. |
| `filterLineups(lineups, filters)` | Exact agent/optional ability, AND tags, hidden exclusion, X sort; no input-array mutation. |
| `clusterLineups(lineups, radius?)` | Sort copy, cluster same-agent/ability with strict radius and pairwise midpoint centers. |
| `arrowsForCluster(cluster, offset?)` | One arrow per start point with offset on both endpoints. |
| `CLUSTER_RADIUS`, `MARKER_CENTER_OFFSET` | 15 and 13 map pixels. |

Exported interfaces: `LineupFilters` (`agentId`, nullable `abilityId`, `tagIds`, `hiddenMarkerIds`), `ParsedLineupCache`, `LineupStorage` (`getItem`, `setItem`, `removeItem`), `LoadLineupsOptions`, and `LoadedLineups` (`all`, `byMap`, `source`).

### Mutation exports

From [lineup-admin.ts](../src/services/lineup-admin.ts):

| Export | Contract |
| --- | --- |
| `validateLineupForm(state)` | `{ valid, message }`, first failed validation supplies message. |
| [`normalizeYouTubeVideo(input)`](../src/services/youtube-video.ts) | Supported ID with optional `?start=<seconds>`, or null. Shared by authoring and playback. |
| `imageTagsToUrls(images)` | Trimmed image-tag text in order. |
| `buildAddPayload(state, video)` | ID-less record from form values and normalized video. |
| `buildEditPayload(state, id)` | Normalized video/full record with ID. |
| `buildDeletePayload(id, originalMapId)` | Two-field delete body. |
| `createMutationRequest(requestType, apiKey, payload)` | `RequestInit` only; no network call. |
| `sendLineupMutation(requestType, apiKey, payload, options?)` | Response text or thrown failure; optional injected `fetcher`/`url`. |

Exported types: `AddLineupPayload = Omit<LineupRecord, "id">`, `EditLineupPayload = LineupRecord`, `DeleteLineupPayload = Pick<LineupRecord, "id" | "mapId">`, their `MutationPayload` union, `MutationRequestArguments` (correlated request/key/payload tuples), `ValidationResult`, and `SendLineupMutationOptions`.

### Shared types and catalog helpers

From [types/lineup.ts](../src/types/lineup.ts):

| Types | Purpose |
| --- | --- |
| `LineupRecord`, `LineupsByMap` | Records and optional map buckets. |
| `SelectOption`, `AgentOption`, `TagOption`, `AbilityOption`, `MapOption` | Catalog/control values; ability icon optional, map icon required. |
| `Point`, `MapTransform` | Coordinates and scale/translation. |
| `ClusterPoint`, `LineupCluster`, `MapArrow` | Derived marker grouping/start-to-target geometry. |
| `ImageTag`, `LineupFormValues` | Authoring representation. |
| `InfoMessageType`, `InfoMessage` | `info`, `success`, `error` feedback. |
| `MutationRequestType` | `"add"`, `"edit"`, `"delete"`. |

[constants.ts](../src/component-utils/constants.ts) also exports `getAgentFromId`, `getAbilityFromId`, `getMapFromId`, `getTagsFromIds`, `getImagesFromIds`, the catalogs, endpoint, and cache lifetime. See [data rules](LINEUP_DATA.md) for unknown-ID and ordering behavior.

## Other integrations

These do not use the lineup endpoint:

| Integration | Behavior | Source |
| --- | --- | --- |
| Tutorial images | Browser requests to per-record image URLs; no upload API. | [ImageFrame.tsx](../src/component-utils/lineup-site-utils/ImageFrame.tsx) |
| YouTube | `https://www.youtube.com/embed/<ID>?rel=0`, with `start=<seconds>` when present; see [video normalization](LINEUP_DATA.md#form-normalization). No YouTube Data API or availability validation. | [YoutubeEmbed.tsx](../src/component-utils/lineup-site-utils/YoutubeEmbed.tsx) |
| Feedback IP lookup | GET `https://geolocation-db.com/json/` on feedback mount; string `IPv4` accepted, failures leave empty. Uses unmount abort signal, unlike lineup fetches. | [EmailForm.tsx](../src/component-utils/lineup-site-utils/EmailForm.tsx) |
| EmailJS | User-initiated SDK `send` with configured service/template/public-key identifiers and `from_name`, `ip_address`, `lineup_id`, `message`, `reply_to`. | [EmailForm.tsx](../src/component-utils/lineup-site-utils/EmailForm.tsx) |
| Shared links | Clipboard uses `https://valorant-lineups.com/<encoded-id>` independent of current host; not a network API call. | [ContentFrame.tsx](../src/component-utils/lineup-site-utils/ContentFrame.tsx) |

Email provider/template rules, media retention, and account settings cannot be reconstructed from call sites. Font imports and hosting policy are covered by [architecture](ARCHITECTURE.md) and [deployment](DEPLOYMENT.md).

## Verification sources

These tests use injected/mocked storage/fetch. They establish frontend contracts, not live backend write guarantees:

- [lineup-data.test.ts](../src/services/lineup-data.test.ts): cache/record validation, expiry/bucket matching, storage denial/quota, grouping/filtering/clustering, GET failures.
- [lineup-admin.test.ts](../src/services/lineup-admin.test.ts): required fields, timestamped payloads, headers, response text, mutation failures. [youtube-video.test.ts](../src/services/youtube-video.test.ts) covers video parsing.
- [LineupAdministration.test.tsx](../src/pages/LineupAdministration.test.tsx): real forms, duplicate-submit guard, failure preservation, map changes, saved selections/delete/cache invalidation.
- [SelectLineupPage.test.tsx](../src/pages/SelectLineupPage.test.tsx), [LineupSite.test.tsx](../src/pages/LineupSite.test.tsx): storage/selection, loading/errors, deep links, clustered choices.
- [EmailForm.test.tsx](../src/component-utils/lineup-site-utils/EmailForm.test.tsx): feedback validation, pending/failing requests, cleanup.

Run checks through the [testing guide](TESTING.md) and [contribution workflow](../CONTRIBUTING.md). Live writes belong to intentional maintainer operations, not verification scripts.
