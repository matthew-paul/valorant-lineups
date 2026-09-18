# Lineup maintainer guide

This is the maintainer-operation reference for agents changing or verifying the frontend's create, select, edit, and delete flows. It specifies form states, request triggers, data invariants, and recovery limits. The frontend is hosted on Vercel and the backend uses AWS Lambda; this repository does not contain the backend's authorization, database, backups, or deployment configuration. Read the [API reference](API_REFERENCE.md), [data model](LINEUP_DATA.md), [deployment guide](DEPLOYMENT.md), and [security boundaries](SECURITY.md) before changing shared data.

The user's task and authorization determine which remote operations an agent may perform; this guide does not impose an additional approval workflow. For ordinary development or review, exercise the flows with the mocked requests in [testing](TESTING.md). The configured remote backend must not be assumed to be a disposable test environment, so a real submission is not a routine verification step.

## Agent verification contract

| Trigger or state | Required observable behavior |
| --- | --- |
| Invalid create/edit fields | Show the first validation error, preserve the draft, and send no request. |
| Map changes in create/edit | Clear both positions and the armed placement mode. |
| A mutation is pending | Block additional submissions and field/position changes on that mounted page. |
| A mutation fails | Preserve the draft and saved selection, show an error, and permit retry. |
| Create succeeds | Invalidate cache; clear content and positions; retain map, agent, ability, and API key. |
| Edit succeeds | Update the local saved-record snapshot and video ID; conditionally replace the matching stored selection; invalidate cache. |
| Delete is canceled | Send no request. |
| Delete succeeds | Clear the editor, disable further mutations, conditionally remove the matching stored selection, and invalidate cache. |
| The stored selection is absent or invalid | Explain the condition and disable mutations. |

[LineupAdministration.test.tsx](../src/pages/LineupAdministration.test.tsx) exercises real form components with mocked requests. [SelectLineupPage.test.tsx](../src/pages/SelectLineupPage.test.tsx) covers the selection/storage handoff, and [lineup-admin.test.ts](../src/services/lineup-admin.test.ts) covers payloads and validation. Consult source when changing behavior rather than treating a prose summary as a substitute for the implementation.

## Prerequisites and routes

| Route | Purpose | Prerequisites |
| --- | --- | --- |
| `/send` | Create a record | Backend-authorized API key and completed form. |
| `/select` | Find a record to edit | Read access to lineup data, writable browser local storage, and a browser that permits the new editor tab. |
| `/edit` | Edit or delete the selected record | A valid `editMarker` stored by `/select` on the same origin; backend-authorized API key for submission. |

These routes are absent from the navigation, but anyone who knows the paths can open them. There is no frontend login, role check, or route guard. Backend authorization must enforce who can mutate records; hiding links and checking for a nonblank key are not authorization.

The API endpoint is the `API_URL` constant in [constants.ts](../src/component-utils/constants.ts). Running on localhost still uses that configured remote endpoint. There is no built-in staging selector, dry-run mode, or environment-variable switch. Requests use a JSON `POST`, the entered key in `x-api-key`, and `request-type` set to `add`, `edit`, or `delete`; see [API_REFERENCE.md](API_REFERENCE.md) for exact payloads and response handling.

Obtain a key through the backend owner's process. The password field masks its display, but the browser necessarily holds it in memory and sends it in the request. Application code does not write the key to local storage. Do not place real keys in source, fixtures, issue reports, or screenshots. A valid key and endpoint do not prove that your browser origin is permitted by the service's CORS configuration.

Images are optional: you can save a lineup with a YouTube video and add images later through `/select` and `/edit`. When adding images, host them first: the form stores URLs and has no image upload, hosting, or video upload feature. Confirm that the chosen map, agent, ability, and tags are registered in the [catalog](LINEUP_DATA.md#stable-catalog-ids).

## Fields, defaults, and validation

The create page initially selects the first catalog map, currently **Abyss**. Agent and ability are unselected; text fields, tags, images, and the API key are empty. Both positions are unset. The selector starts on Abyss with Sova selected. A valid editor selection replaces those defaults with the stored record; the API key remains empty.

| Field | Create/edit rule | Submission and display behavior |
| --- | --- | --- |
| Map | A catalog map is selected by the UI | Its permanent numeric ID becomes `mapId`. Changing it clears both positions. |
| Lineup title | Required; whitespace alone is rejected | Trimmed before submission. No form `maxLength` is configured. |
| Description | Optional | Submitted as entered; plain-text instructions in the viewer. |
| Agent | Required selection | Stored as a numeric catalog ID. Changing it clears the ability selection. |
| Ability | Required selection from the selected agent's options | Stored as its agent-scoped numeric ID. |
| Tags | Optional; any selected catalog tags | Stored as numeric IDs. Viewer filters require all selected tags. |
| Images | Optional; committed tags must have nonblank text | URLs are trimmed. Reachability, file type, URL scheme, and image content are not validated by this form. |
| YouTube video ID or URL | Required; accepted syntax below | Normalized for create and edit, retaining a supported playback timestamp. |
| Credits | Optional | Submitted as entered. Valid HTTP(S) URLs become links; other values display as text. |
| Lineup position | Required | Both `x` and `y` must be finite numbers from 0 through 1000. |
| Start position | Required | Both `startX` and `startY` must be finite numbers from 0 through 1000. |
| API key | Required; whitespace alone is rejected | Sent as entered in the request header, not as part of the record. |

Validation stops at the first failing requirement. These checks are implemented in [lineup-admin.ts](../src/services/lineup-admin.ts), with UI behavior in [BaseForm.tsx](../src/component-utils/design-utils/BaseForm.tsx). They are client-side checks and can be bypassed; the backend must independently validate and authorize requests.

The fetch/cache record validator checks field types and finite numbers rather than enforcing every authoring rule. Older records can therefore load even if they lack media or valid start positions. An edit must satisfy the current form rules before it can be submitted. Unknown map, agent, or ability references prevent an editor selection from loading; unknown tag IDs are omitted when the form converts stored IDs to catalog options, so inspect unusual records before saving them.

### Enter image links

Leave **Image links (optional), then press enter** empty to save without images, or paste a URL and press Enter to commit it as a tag. Text left in the input is not yet part of the record. One entry can contain comma-separated links; the handler trims surrounding whitespace, drops empty entries, and ignores exact duplicate strings already present or repeated in that addition.

For example, entering ` https://example.com/first.jpg, https://example.com/second.jpg, ` creates two image tags in that order. The example host is illustrative; use your actual hosted files. Commas are always treated as separators, so avoid unescaped commas within a single URL. Duplicate detection is textual, not URL canonicalization: different URL strings pointing to the same image remain distinct. Existing stored images are not automatically deduplicated when the editor loads them.

Use each tag's remove control to delete it. Drag reordering is disabled; remove and re-add entries when necessary to change their order. Check public image access separately, preferably through HTTPS and without relying on your own authenticated browser session.

### Accepted YouTube input

These examples illustrate supported syntax; `abcdefghijk` is a placeholder ID, not a promise of an available video.

| Input form | Example |
| --- | --- |
| Bare ID | `abcdefghijk` |
| Short link | `https://youtu.be/abcdefghijk?t=30` |
| Watch link | `https://www.youtube.com/watch?v=abcdefghijk` |
| Embed link | `https://www.youtube.com/embed/abcdefghijk` |
| Shorts link | `https://www.youtube.com/shorts/abcdefghijk` |
| Live link | `https://www.youtube.com/live/abcdefghijk` |

URLs require HTTP or HTTPS. Accepted hosts are exactly `youtu.be`, `youtube.com`, `www.youtube.com`, and `m.youtube.com`, with the appropriate paths above. Surrounding whitespace is ignored; the ID must contain exactly 11 letters, digits, underscores, or hyphens. Unrelated hosts, malformed IDs, and extra path segments are rejected. The `youtube-nocookie.com` host and playlist-only URLs are not accepted.

Playback timestamps are preserved: `https://youtu.be/04K6YaRNtE8?t=70` is saved as `04K6YaRNtE8?start=70` and requests playback at 1:10. Watch links with `t=70s` or `t=1m10s` and embed links with `start=70` also work. See [form normalization](LINEUP_DATA.md#form-normalization) for the complete timestamp rules. Playlist values and unrelated settings are discarded. A syntactically valid ID is not checked for existence, permissions, regional availability, or permission to embed.

## Place and revise positions

1. Choose the map first.
2. Select **Set Lineup Position**, then click the ability's landing/effect point on the map image.
3. Select **Set Start Position**, then click the player's starting point.
4. Inspect both icons against the map. Pan or zoom as needed to place them accurately.

Only one placement mode is active at a time, and an accepted map click finishes that placement. To move an icon, arm its placement button again and click the new position. Clicking a placed landing or start icon removes that position. Choosing a different map clears both icons and any armed placement mode, requiring both positions to be chosen again. Changing agent clears its ability selection but retains positions on the same map.

Positions are marker top-left coordinates in the 1000 × 1000 map space. The UI subtracts 12.5 from each click offset to center the 25 × 25 icon. Clicks producing coordinates outside 0–1000 are ignored; clicks very close to the top or left edge can therefore fail to place an icon. Near the opposite edges, an accepted icon can partly extend outside the map. See [coordinate details](LINEUP_DATA.md#coordinates-clustering-and-assets) before editing records outside the UI.

Create and edit offer pan/zoom but no rotation controls. Create uses a maximum map scale of 6; edit uses 10. There are no numeric coordinate inputs or complete keyboard placement controls, so use a pointer-capable browser for authoring.

## Create a lineup

1. Verify the intended backend and prepare the media and instructions. For a rehearsal, use the [mocked administration tests](../src/pages/LineupAdministration.test.tsx).
2. Open `/send`, select the map, and place both positions.
3. Fill the title, agent, ability, and video. Add any optional images, description, tags, or credits.
4. Review the [data QA checklist](#data-qa-checklist), then enter the authorized API key.
5. When the remote create is intended, click **Enter** once and wait for the status.

The add payload omits `id`; the server is expected to assign one. After a successful HTTP response, the page reports **Sent lineup to database**, invalidates the local lineup cache, and clears title, description, tags, images, video, credits, and both positions. It retains the selected map, agent, ability, and API key for continued authoring. It does not parse a created record ID from the response or navigate to the new lineup. Reload `/select` or the viewer to find and verify the saved record.

## Select and edit a lineup

1. Open `/select` and choose the correct map, agent, optional ability, and tags. Filtering and clustering match the [viewer workflow](USER_GUIDE.md#find-a-lineup), including hidden-lineup preferences.
2. Click the target ability marker. A single-record marker opens an editor immediately; a cluster first reveals start icons, one for each record.
3. Click the appropriate start icon if needed. The selector writes the full record to `localStorage.editMarker` and opens `/edit` in a new tab.
4. Verify the loaded title, map, media, and positions before making changes. Enter the API key separately.
5. Make the intended changes and click **Update**. Changing map requires new landing and start positions.
6. After success, reload the viewer or selector and inspect the record again, including its direct URL.

If local storage cannot save the selection, `/select` shows **Unable to open the editor: browser storage is unavailable** and does not open an empty editor. If the browser blocks a popup after storage succeeds, manually open `/edit` on the same origin; there is no dedicated popup-blocked status message.

The editor reads its stored selection when it mounts, not continuously. Opening it without a record shows a selection prompt and disables mutations. Malformed JSON, invalid record shape, or unsupported catalogs produce an inline error and disabled controls. The screen does not fetch a fresh record by ID before editing.

An edit sends a complete record with its unchanged ID and currently selected map ID. On success, the editor updates its saved-record snapshot and displays the normalized video value, including its start time when present. It also replaces `editMarker` if that storage slot still refers to this record, and clears the public data cache. The status shows the backend's response text, or a generic completion message if that text is empty. No backend-normalized record is read back from this response, so a fresh read remains the verification step.

## Delete a lineup

1. Select and verify the record through `/select` and `/edit`.
2. Preserve any record information needed for recovery using the backend owner's backup/export process.
3. Enter the API key, select **Delete**, then select **Yes** to send the deletion. **No** closes confirmation without sending a request.
4. Wait for success, then reload the viewer or selector to verify removal.

Delete requires a selected record and nonblank key, but bypasses title, media, and position validation. It sends only `id` and the last successfully saved record's `mapId`. An unsaved map change therefore does not redirect a delete to that new map; a successful preceding edit updates which map ID deletion uses.

After success, the editor clears the record, form fields, positions, and key, disables further mutations, and removes the matching `editMarker` from storage. It also invalidates the lineup cache. Deleting data is a remote operation; closing the editor or resetting browser storage is not an undo.

## Pending requests, failures, and retries

Create, update, and delete display **Sending...** and disable form and position controls while a request is pending. An immediate in-memory guard also prevents repeated submissions from that mounted page. The guard is not a server idempotency mechanism and does not coordinate other tabs or clients. The frontend has no explicit mutation timeout or cancel control.

Validation failures preserve the draft and send no mutation. Network failures or unsuccessful HTTP responses show an inline error and re-enable the controls; unsuccessful HTTP errors include status and response-text details. Failed create/edit requests retain entered values, and failed edits/deletes keep the original saved selection. See [troubleshooting](TROUBLESHOOTING.md) for network, authorization, and CORS diagnosis.

Before retrying after a lost connection or ambiguous response, check whether the backend applied the operation. A server can commit a change before its response is lost, and this client does not deduplicate a later create request. Leaving the page suppresses later UI updates but does not abort the mutation or reverse a server write. Do not assume a cleared page or a closed tab means that a request was canceled.

## Cache, storage, and multiple tabs

Successful mutations try to remove `savedLineups` and `lastRetrievedTime` from local storage. The next viewer/selector load then fetches records again. Already open tabs retain their own loaded arrays; reload them before verification or another selection. Other browsers and site origins have independent caches, and external backend changes do not invalidate those caches automatically. The normal cache lifetime is ten days.

The Info reset control removes cache keys, hidden IDs, and `editMarker`; it does not roll back a mutation. It can also remove the selection another editor would load on refresh. Unsaved form changes and API keys are not autosaved, so navigating away or reloading loses them.

The `editMarker` slot is shared by same-origin tabs. Selecting another record overwrites that slot, while an already open editor keeps its own record. A successful save/delete only updates/removes the slot if it still contains the same ID, reducing interference between different records. There is no version check, lock, merge, or conflict detection for two editors changing the same record. Refresh and verify the current backend state when coordinating edits.

Storage writes and invalidation are best effort. A successful backend mutation remains successful even if local storage subsequently fails; the UI does not provide a separate persistence-failure result for that case. If a viewer stays stale, use the [cache troubleshooting steps](TROUBLESHOOTING.md) and verify that storage reset actually succeeded.

## Recovery and rollback boundary

The frontend has no undo, version history, export, backup, or transactional rollback UI. Before a material edit or delete, retain the previous record through an authorized operational process. A known old record can inform a corrective edit, but server-side recovery and restoration of deleted IDs depend on backend capabilities outside this repository. Creating a replacement through `/send` does not let you choose the original ID, so it may not restore existing shared links.

Reverting a Git commit or redeploying an older frontend does not revert remote records. Conversely, editing the historical JSON snapshots in `src/resources` does not change runtime data. See [LINEUP_DATA.md](LINEUP_DATA.md) and [SECURITY.md](SECURITY.md) for those boundaries.

## Data QA checklist

Before submitting an intended change:

- Verify the target backend, record identity for edits/deletes, and authorization.
- Check the map and agent/ability pairing against the registered catalog; preserve stable IDs.
- Confirm both positions match the instructions and current map image, including after a map change.
- Give the record a useful title and reproducible instructions; include timing, stance, aim, or bounce details where needed.
- Commit every image tag and verify image URLs, order, and readability without private authentication.
- Check that the video exists, embeds successfully at the intended timestamp, and explains the same lineup. Re-paste timestamps that were discarded by earlier saves.
- Choose tags that describe the record accurately and make sense under AND filtering.
- Check attribution and verify whether credits should be a link or plain text.
- Check for an existing equivalent record before creating another.

After a successful intended change, refresh data and verify the record's detail panel, direct link, map placement, cluster/start selection, relevant filters, media, and credits. For deletion, confirm the record is absent from a fresh read. These checks assess the saved frontend data; testing the lineup in the game remains a separate content-quality step. Automated coverage and safe request mocking are documented in [TESTING.md](TESTING.md).

## Implementation references

- [Create page](../src/pages/DesignLineup.tsx), [selector](../src/pages/SelectLineupPage.tsx), and [editor](../src/pages/EditLineup.tsx).
- [Shared fields and image-tag handling](../src/component-utils/design-utils/BaseForm.tsx) and [delete confirmation](../src/component-utils/edit-utils/EditForm.tsx).
- [Validation, YouTube normalization, payloads, and mutation responses](../src/services/lineup-admin.ts).
- [Runtime record validation and safe storage](../src/services/lineup-data.ts), [domain types](../src/types/lineup.ts), and [catalogs](../src/component-utils/constants.ts).
- [Mocked administration regression tests](../src/pages/LineupAdministration.test.tsx) and [selector tests](../src/pages/SelectLineupPage.test.tsx).
