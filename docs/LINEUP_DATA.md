# Lineup data model and catalogs

This reference is for agents changing records, catalogs, assets, or data-related code. Source of truth: [types/lineup.ts](../src/types/lineup.ts), runtime guards in [lineup-data.ts](../src/services/lineup-data.ts), and catalogs in [constants.ts](../src/component-utils/constants.ts). Types are maintained by hand; there is no generated schema or JSON Schema file.

Read the [API reference](API_REFERENCE.md) for transport, storage rules, and service exports; the [maintainer guide](MAINTAINER_GUIDE.md) for record operations; and [Contributing](../CONTRIBUTING.md) for verification. The owner confirmed a Vercel frontend and AWS Lambda backend. Backend storage schema and validation implementation are not present here; see [deployment](DEPLOYMENT.md) for known configuration boundaries.

## Agent task map and invariants

| Task | Primary symbols/files | Required consistency checks |
| --- | --- | --- |
| Change a record field | `LineupRecord`, `LineupFormValues`, `isLineupRecord`, add/edit builders, page callers | Update runtime guards, form conversion, tests, cache expectations, and API compatibility together. |
| Add/refresh a map | `MAP_LIST`, `resources/Maps`, map table below | Preserve permanent IDs, 1000 × 1000 geometry, alignment, and intended default map. |
| Add selected agent abilities | `AGENT_LIST`, `ABILITY_LIST`, `resources/Agents` | Reuse reserved IDs; ability IDs are scoped to an agent; iconless entries are valid. |
| Add/change a tag | `TAG_LIST`, `getTagsFromIds`, `TagList`, tag Sass | Preserve IDs; review label-based classes, order, unknown-ID behavior, and AND filtering. |
| Diagnose invalid data | `isLineupRecord`, `parseLineupCache`, editor catalog lookups | Shape validation, cache validation, catalog support, and form validation are different layers. |

Permanent IDs are persisted in remote records. Reordering labels must not renumber them. The local JSON resources are historical artifacts, not live datasets or offline fallback data. Adding an asset alone does not register a map or ability, and changing a catalog does not migrate backend records.

## Canonical record

GET returns a flat array of `LineupRecord` objects. This synthetic example uses placeholder media, not verified playable instructions:

```json
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
```

All fields below are required by `isLineupRecord`. Additional fields are accepted without being stripped.

| Field | Runtime shape | Application meaning and authoring rules |
| --- | --- | --- |
| `id` | `string` | Stable identifier for links, hidden markers, selection, edit, and delete. Add omits it; edit preserves it. The frontend does not generate IDs or require UUID syntax. |
| `name` | `string` | Display title. Authoring requires a nonblank value and trims it before submission. |
| `description` | `string` | Instructions; may be empty. Submitted without trimming. |
| `agent` | finite `number` | Permanent `AGENT_LIST` value. |
| `ability` | finite `number` | Permanent ability value in `ABILITY_LIST[agent]`. |
| `mapId` | finite `number` | Permanent `MAP_LIST` value. |
| `tags` | array of finite numbers | `TAG_LIST` values; an empty list is allowed. |
| `images` | array of strings | Ordered tutorial-image URLs; `[]` represents no images. Image tags are optional in forms, but any supplied tag must have nonblank text; payload URLs are trimmed. |
| `video` | `string` | YouTube video ID, optionally followed by `?start=<seconds>`. Forms validate and normalize IDs/supported URLs; see [form normalization](#form-normalization). |
| `credits` | `string` | Attribution; may be empty. HTTP(S) URLs render as links, other values as text. Submitted without trimming. |
| `x`, `y` | finite numbers | Landing marker's top-left coordinates in unscaled 1000 × 1000 map space. |
| `startX`, `startY` | finite numbers | Starting marker's top-left coordinates in the same space. |

The runtime guard checks shape rather than all domain rules. It accepts empty strings/arrays, fractional numeric IDs, out-of-range finite coordinates, unknown catalog IDs, and any string in media fields. It does not check ID uniqueness or media availability. Numeric strings and `null` for required fields fail validation. Passing this guard does not establish valid authoring input.

Authoring additionally requires selected agent/ability, a nonblank title/API key, nonblank text for any supplied image tags, supported YouTube input, and all four coordinates finite and within 0 through 1000 inclusive. The API key is form state, not a `LineupRecord` field. Backend validation and authorization remain separate.

## Representations and defaults

| Location | Representation |
| --- | --- |
| API GET | Flat `LineupRecord[]`, validated before use. |
| Add | Complete record without `id`. |
| Edit | Complete record with unchanged `id`. |
| Delete | `{ "id": string, "mapId": number }`. |
| `localStorage.savedLineups` | JSON object grouped by map ID; JSON keys are strings. |
| `localStorage.editMarker` | One complete record, revalidated by the editor. |
| `localStorage.hiddenMarkers` | JSON string-ID array. |
| Form state | Select objects, image tags, draft strings, coordinates, API key, and an informational message. |

`LineupsByMap` is `Partial<Record<number, LineupRecord[]>>`: maps with no records may have no bucket. Callers use an empty array for missing buckets. A registered map is not guaranteed to have backend data. Cache expiry and key validation are specified in the [API reference](API_REFERENCE.md#browser-cache-and-storage).

Select objects use `{ value: number, label: string }`. `MapOption` also requires `icon`; `AbilityOption.icon` is optional. `ImageTag` uses `{ id: string, text: string }`; `getImagesFromIds` copies the URL into both fields. Builders extract select `.value` and image-tag `.text`.

| Screen | Initial map | Initial agent/ability | Other defaults |
| --- | --- | --- | --- |
| Viewer `/` | Ascent, ID 1 | Sova, ID 13; all abilities (`null`) | No tag filters; hidden IDs from storage. Valid deep links select their record's map/agent. |
| Selector `/select` | First `MAP_LIST` entry: Abyss, ID 11 | Sova, ID 13; all abilities (`null`) | No tag filters; shares hidden preferences with viewer. |
| Create `/send` | First `MAP_LIST` entry: Abyss, ID 11 | Agent/ability `null` | Coordinates `-1`, empty strings/lists, empty API key. |
| Edit `/edit` | First `MAP_LIST` entry until record loads | Agent/ability `null` until record loads | Form disabled without valid selection; API key starts empty. |

Viewer/selector find Sova by ID and fall back to the first agent if absent. Viewer similarly finds Ascent by ID before falling back to the first map. Keep catalogs nonempty. Reordering `MAP_LIST` changes the other screens' default map even if IDs remain stable.

## Stable catalog IDs

These tables describe this repository's supported subset, not the complete current VALORANT roster or map rotation.

### Maps

Paths are under [src/resources/Maps](../src/resources/Maps). Every listed PNG is 1000 × 1000.

| ID | Map | Asset |
| ---: | --- | --- |
| 11 | Abyss | `abyss_map.png` |
| 1 | Ascent | `ascent_map.png` |
| 2 | Bind | `bind_map.png` |
| 3 | Breeze | `breeze_map.png` |
| 7 | Fracture | `fracture_map.png` |
| 4 | Haven | `haven_map.png` |
| 5 | Icebox | `icebox_map.png` |
| 9 | Lotus | `lotus_map.png` |
| 8 | Pearl | `pearl_map.png` |
| 6 | Split | `split_map.png` |
| 12 | Summit | `summit_map.png` |
| 10 | Sunset | `sunset_map.png` |

The displayed list is alphabetical; numeric IDs retain their historical assignments.

### Enabled agents and abilities

Paths are relative to [src/resources/Agents](../src/resources/Agents). Use `(agent, ability)` for lookup or clustering because ability IDs repeat across agents.

| Agent ID | Agent | Ability ID | Ability label | Icon |
| ---: | --- | ---: | --- | --- |
| 2 | Breach | 1 | Aftershock | `Breach/Aftershock.png` |
| 3 | Brimstone | 1 | Incendiary | `Brimstone/Incendiary.png` |
| 4 | Cypher | 1 | Trapwire | `Cypher/Trapwire.png` |
| 4 | Cypher | 2 | Cyber Cage | `Cypher/Cyber_Cage.png` |
| 4 | Cypher | 3 | Spycam | `Cypher/Spycam.png` |
| 18 | Fade | 1 | Haunt | `Fade/Haunt.png` |
| 18 | Fade | 2 | Seize | `Fade/Seize.png` |
| 20 | Gekko | 1 | Mosh Pit | `Gekko/Mosh_Pit.png` |
| 20 | Gekko | 2 | Wingman | `Gekko/Wingman.png` |
| 20 | Gekko | 3 | Dizzy | `Gekko/Dizzy.png` |
| 6 | Killjoy | 1 | Nanoswarm | `Killjoy/Nanoswarm.png` |
| 16 | Kay/O | 1 | FRAG-ment | `KayO/FRAG-ment.png` |
| 16 | Kay/O | 2 | ZERO-point | `KayO/ZERO-point.png` |
| 16 | Kay/O | 3 | FLASH-drive | `KayO/FLASH-drive.png` |
| 11 | Sage | 1 | Barrier Orb | `Sage/Barrier_Orb.png` |
| 11 | Sage | 2 | Slow Orb | `Sage/Slow_Orb.png` |
| 13 | Sova | 1 | Recon Bolt | `Sova/Recon_Bolt.png` |
| 13 | Sova | 2 | Shock Dart | `Sova/Shock_Bolt.png` |
| 14 | Viper | 1 | Snake Bite | `Viper/Snake_Bite.png` |
| 14 | Viper | 2 | Poison Cloud | `Viper/Poison_Cloud.png` |

The display label is `Shock Dart`, while its existing filename is `Shock_Bolt.png`. `Gekko/Thrash.png` exists but is not imported or registered. An asset file alone does not enable an ability.

### Reserved agent IDs

These entries are commented out in `AGENT_LIST`. They reserve project IDs but do not appear in controls or register supported abilities:

| ID | Agent | ID | Agent |
| ---: | --- | ---: | --- |
| 1 | Astra | 12 | Skye |
| 5 | Jett | 15 | Yoru |
| 7 | Omen | 17 | Neon |
| 8 | Phoenix | 19 | Chamber |
| 9 | Raze | 21 | Harbor |
| 10 | Reyna | 22 | Deadlock |
| 23 | Iso | | |

Do not assign a reserved ID to another agent or infer IDs from release order.

### Tags

| ID | Tag | ID | Tag |
| ---: | --- | ---: | --- |
| 1 | Attacking | 9 | Easy |
| 2 | Defending | 10 | Medium |
| 3 | Post Plant | 11 | Hard |
| 4 | Retake | 12 | Crosshair Lineup |
| 16 | Fake | 13 | UI Lineup |
| 5 | A Site | 14 | Double Shock Dart |
| 6 | B Site | 15 | Single Shock Dart |
| 7 | C Site | | |
| 8 | Mid | | |

Filters require every selected tag (AND matching) using numeric `includes`. `getTagsFromIds` returns known tags in catalog order and omits unknown IDs. Consequently, opening a record in the editor does not preserve unknown IDs in its form tags. [TagList.tsx](../src/component-utils/lineup-site-utils/TagList.tsx) moves the first difficulty tag to the front, followed by the first Attacking/Defending tag; remaining tags retain their order. CSS classes derive from labels with whitespace removed, so label changes can require Sass changes.

## Coordinates, clustering, and assets

Map, marker, and SVG arrow layers share a 1000 × 1000 coordinate space. Coordinates are marker top-left positions, not percentages or post-zoom screen pixels. [DesignLineup.tsx](../src/pages/DesignLineup.tsx) and [EditLineup.tsx](../src/pages/EditLineup.tsx) convert map-image clicks as follows:

```ts
x = event.nativeEvent.offsetX - 12.5;
y = event.nativeEvent.offsetY - 12.5;
```

Markers render at 25 × 25 before map scaling. Subtracting 12.5 centers the icon and commonly produces `.5` coordinates. Clicks producing coordinates outside 0 through 1000 are ignored, and forms validate that range. A top-left coordinate near 1000 can leave part of an icon outside the map. `-1` is an unset form sentinel and must not be submitted. Changing a creation/editing map resets both positions.

`CLUSTER_RADIUS` is 15 map pixels. The helper sorts by X without mutating input, then merges only the same agent/ability within a strict distance of less than 15. Every merge uses a pairwise midpoint; multi-point centers are order-dependent rather than true centroids. Call it with one map's records, as the pages do: the helper itself does not separate map IDs. Points retain lineup IDs/start coordinates. Arrows add `MARKER_CENTER_OFFSET` (13) to both endpoints to approximate icon centers. Clusters are derived state, not API records.

Icons are optional. Registered iconless abilities use [x-icon.png](../src/resources/x-icon.png); starting markers use [start-icon.png](../src/resources/start-icon.png). Source icon dimensions vary; CSS determines display size. Replacing a minimap with different orientation/alignment requires checking existing coordinates even if dimensions remain 1000 × 1000.

Lookup helpers return `undefined` for unknown map/agent/ability IDs. Viewer/selector cluster rendering skips unsupported agents/abilities. A deep link with unsupported map or agent produces a viewer error; editor loading rejects unsupported map, agent, or ability. An unsupported ability on an otherwise supported deep link does not receive an ability marker. A fallback icon supports a registered iconless entry; it does not register unknown entries.

Tutorial images are external URLs; this frontend neither uploads nor hosts them. Use reachable direct image URLs suitable for embedding. HTTPS avoids mixed-content problems when served over HTTPS. The client does not validate URL syntax, content type, dimensions, accessibility, or availability.

## Form normalization

Create/edit use [lineup-admin.ts](../src/services/lineup-admin.ts); image-tag input is handled by [BaseForm.tsx](../src/component-utils/design-utils/BaseForm.tsx).

| Input | Result |
| --- | --- |
| Title | Trimmed in payload; whitespace-only rejected. |
| Agent, ability, map, tags | Select objects converted to numeric IDs. Changing agent clears ability. |
| Image entry | Comma-separated input trimmed; empty entries/exact duplicate URLs discarded when adding tags. Existing order retained. |
| Image payload | Each tag's text trimmed. `imageTagsToUrls` alone does not deduplicate or validate URLs. |
| Description, credits | Preserved as entered. |
| API key | Nonblank required; sent in `x-api-key`, excluded from payload/saved records. Request helper does not trim it. |
| Video | Surrounding whitespace trimmed; supported URLs reduced to an 11-character ID with an optional `?start=<seconds>` suffix. |

Video IDs must match `[a-zA-Z0-9_-]{11}`. HTTP and HTTPS URLs are accepted for these exact hosts/paths:

| Host | Accepted path |
| --- | --- |
| `youtu.be` | `/<ID>` with optional trailing slash |
| `youtube.com`, `www.youtube.com`, `m.youtube.com` | `/watch?v=<ID>` |
| The same three YouTube hosts | `/embed/<ID>`, `/shorts/<ID>`, `/live/<ID>`, each with optional trailing slash |

[youtube-video.ts](../src/services/youtube-video.ts) preserves a start time from the `start` query parameter, the `t` query parameter, or a `#t=` fragment, in that precedence order. Values may be whole seconds (`70`, `70s`) or hours/minutes/seconds (`1m10s`, `1h2m3s`). A positive safe integer is stored as `ID?start=<seconds>` in the existing string field; zero, missing, malformed, negative, fractional, or overflowing times leave a bare ID. Other query/fragment settings are discarded. Stored `ID?start=<seconds>` values are accepted on subsequent edits.

Both authoring screens and the viewer use this normalization. The viewer sets YouTube's [`start` player parameter](https://developers.google.com/youtube/player_parameters#start), preserving `rel=0`, and skips invalid video inputs. It does not rewrite fetched records or verify video availability. Existing bare IDs still start at the beginning; timestamps discarded by earlier saves cannot be recovered and must be pasted again.

Lookalike domains, `youtube-nocookie.com`, playlist-only URLs, extra path segments, and scheme-less URLs are unsupported. `/watch` must match exactly. Backend handling of timestamped strings requires a live round-trip check; the frontend does not supply or change backend validation.

## Historical data and fixtures

[resources/Lineups/lineups.json](../src/resources/Lineups/lineups.json) is an unused grouped snapshot: 234 records under map IDs 1 through 8. It is not a seed, runtime fallback, or synchronized current API export.

[resources/sampleLineup.json](../src/resources/sampleLineup.json) is an obsolete flat-array example with `start-x`/`start-y`. Those keys fail the current guard, which requires `startX`/`startY`. Its small coordinate values do not establish a percentage-based model.

Neither file is imported by the app; editing them changes no local viewer or remote record. Tests use synthetic typed records from [test-utils/lineup-fixtures.ts](../src/test-utils/lineup-fixtures.ts). Fixtures/examples are not operational lineup recommendations.

## Catalog change checklists

### Add or refresh a map

1. Establish the requested map and permanent ID; preserve existing/reserved meanings.
2. Add its genuine image under `src/resources/Maps` with established naming, 1000 × 1000 PNG geometry, and expected orientation/alignment.
3. Import and register it in `MAP_LIST`, keeping labels alphabetical. Check whether first-entry defaults change.
4. Update this table and [catalog tests](../src/component-utils/constants.test.ts).
5. Verify `/`, `/send`, `/select`, `/edit`: alignment, pan/zoom/rotation, and changing maps after position entry. Run [contribution checks](../CONTRIBUTING.md).
6. Coordinate remote record creation/coordinate migration separately through the [maintainer workflow](MAINTAINER_GUIDE.md); an asset edit does not migrate records.

### Add an agent or selected abilities

1. Establish the requested agent and lineup-relevant subset; do not automatically register its whole kit or the full roster.
2. Reuse its reserved/existing agent ID. For a new agent, establish a permanent unused ID after checking active/commented entries.
3. Enable `AGENT_LIST` and register selected `ABILITY_LIST[agentId]` entries with permanent agent-scoped IDs. Each enabled agent should have a nonempty ability list.
4. Optionally add/import PNG icons in its established folder. Omit `icon` for an iconless entry.
5. Update tables/tests; verify known/unknown lookup behavior, marker fallback, and authoring selection.
6. Deploy client support before publishing dependent records; older clients can skip/reject unknown entries.

### Add or change a tag

1. Preserve existing IDs and add/update the `TAG_LIST` label/value.
2. Review order and label-derived CSS in `TagList.tsx` and [tag Sass](../src/scss/lineupSite/_tags.scss).
3. Update this table and relevant catalog/tag tests. Run `yarn css:build` for Sass edits and normal [verification](../CONTRIBUTING.md).
4. Check display and AND filtering; coordinate record changes separately because a catalog edit does not label records.

For field/schema changes, update shared types, guards, builders, both authoring flows, cache behavior, tests, and docs together; coordinate compatible API changes. See [frontend/backend boundaries](API_REFERENCE.md#frontend-and-backend-boundary) before assuming server migration behavior.
