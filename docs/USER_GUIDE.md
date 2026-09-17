# Lineup viewer guide

This guide specifies the public viewer's observable behavior for agents maintaining or testing the application. It also serves as a usage reference. Browsing requires no account or API key. Records and media depend on external services; a map or agent being listed does not guarantee that it has saved lineups.

For authoring or removing records, use the separate [maintainer guide](MAINTAINER_GUIDE.md). Use the [documentation task map](README.md) to locate implementation and operational references. The frontend is hosted on Vercel and the backend uses AWS Lambda; deployment configuration and route handling belong in the [deployment guide](DEPLOYMENT.md).

## Agent verification contract

Preserve these behaviors when changing the viewer. Use controlled fixture records and mocked network requests to verify them; this frontend's configured backend must not be assumed to be a disposable test environment. The detailed test commands and their scope are in [TESTING.md](TESTING.md).

| Trigger or state | Expected observable outcome | Source/test entry point |
| --- | --- | --- |
| Fresh `/` visit | Ascent, Sova, no ability or tags, no selected details; loading ends on data or error | [LineupSite.tsx](../src/pages/LineupSite.tsx), [viewer tests](../src/pages/LineupSite.test.tsx) |
| Map selection changes | Markers refresh without waiting for an image-load event; selected details and tags clear | [LineupSite.tsx](../src/pages/LineupSite.tsx) |
| A clustered record is opened | Start choices remain available for its cluster | [viewer tests](../src/pages/LineupSite.test.tsx) |
| Lineup route changes, including Back/Forward | Details follow the current ID; loaded records can be reused | [App route tests](../src/App.test.tsx) |
| Browser storage is blocked | Network browsing remains possible; local preferences cannot be guaranteed | [viewer tests](../src/pages/LineupSite.test.tsx), [data service](../src/services/lineup-data.ts) |
| Clipboard promise rejects | Error feedback appears instead of a success toast | [ContentFrame.tsx](../src/component-utils/lineup-site-utils/ContentFrame.tsx) |
| Feedback submission rejects | Fields remain available and submission can be retried | [EmailForm.tsx](../src/component-utils/lineup-site-utils/EmailForm.tsx) |

The sections below distinguish implemented controls from current limitations. They do not certify live service availability, current game accuracy, or full browser/accessibility coverage.

## Open the viewer

Open `/` on the running application. A fresh visit starts with **Ascent**, **Sova**, all abilities for that agent, and no tag filters. The map initially has no selected lineup. It shows a loading message while records are requested, then displays matching markers or a request error.

The navigation button opens a menu with **Lineups** (`/`) and **Info** (`/about`). Selecting a link closes the menu; its close button or Escape also closes it. The Info page contains project background, attribution, and a browser-data reset control.

The available maps, agents, abilities, and tags come from the checked-in catalog. The app does not automatically add new game content. See the [catalog tables](LINEUP_DATA.md#stable-catalog-ids) when checking whether something is supported.

## Find a lineup

1. Choose a map and agent using the controls above the map.
2. Optionally select an ability. The ability choices depend on the selected agent.
3. Open **Filters...** and check any relevant tags. Its search box narrows the tag choices.
4. Click an ability marker to open a lineup or reveal its starting positions.

All restrictions apply together: map, agent, selected ability, every selected tag, and your hidden-lineup preferences. Tags use **AND** matching. For example, **Attacking** plus **A Site** shows only records containing both tags. Adding tags can reduce the results to zero even when each tag separately has matches.

Changing agent resets the ability selection. To return from one ability to all abilities, reselect the agent; the interface does not expose a separate ability-clear button. Changing map clears selected tags and lineup details while retaining the current agent and ability. Other filter changes update the markers but can leave the last opened lineup's details visible, even when it no longer matches those filters.

### Markers, clusters, and red lines

An ability icon marks its landing or effect position. Nearby landing positions for the same agent and ability can be grouped into one marker. Clustering uses map coordinates, so zooming does not itself split a cluster.

- Hover over an ability marker to see red connectors to its starting positions.
- Click a marker containing one lineup to open its details immediately.
- Click a marker containing several lineups to reveal their start icons, then click a start icon to open that particular lineup.
- The selected cluster and its connectors remain available while you choose between its starting positions. Hovering another marker temporarily adds that marker's connectors.

The red connectors relate the start and landing positions. They are straight lines, without arrowheads; they do not simulate projectile travel, obstacles, bounces, or timing. A cluster's connector begins at its displayed cluster center, which may differ slightly from an individual record's landing coordinate. Registered abilities without a dedicated icon use a generic marker.

## Move the map and inspect media

| Control | Behavior |
| --- | --- |
| Drag the map with a mouse or one finger | Pan the map. |
| Mouse wheel over the map or a two-finger pinch | Zoom the map. Viewer scale is limited to 0.5–16. |
| **Rotate map left/right** buttons | Rotate in 90-degree steps. Ability and start icons remain upright. |
| Wheel or pinch over an instruction image | Zoom that image independently of the map. |
| Drag an instruction image | Pan within its image frame. |
| Double-click or double-tap an instruction image | Zoom in; at the maximum zoom, reset to its initial view. |

Map zoom buttons are not shown. Instruction images use a separate zoom component, start centered at scale 1, and have a configured maximum scale of 15. Selecting different image content resets that image's view. Wheel scrolling over an image is captured for zooming; move the pointer outside the image to scroll the surrounding page.

The details panel shows the selected lineup's title, tags, description, credits, YouTube video, and images where those fields are present. HTTP(S) credits open as links in a new tab; other credit values display as plain text. YouTube videos with a saved [playback timestamp](LINEUP_DATA.md#form-normalization) request playback at that time; videos without one start at the beginning. Video playback and images depend on their hosts and can fail even when the lineup record loads. The viewer does not validate whether instructions still work in the current game version.

## Share links and use browser history

Opening a lineup changes the address to `/:lineupId`. Visiting that link selects the record's map and agent and opens its details. If the record is not already visible under the current filters, the viewer clears ability and tag restrictions when selecting it. Hidden-lineup preferences still apply to its map marker.

The **Copy lineup link** icon beside the title copies a URL beginning with `https://valorant-lineups.com/`, including when you run the app locally or on another host. It shows a success toast only after clipboard access succeeds, or an error toast when copying fails. You can also use the browser address bar to share the current host's URL.

Browser Back and Forward follow lineup selections and page navigation. Links identify a lineup; they do not encode all filter selections, rotation, or pan/zoom state. An unknown lineup ID leaves the viewer usable with its normal “Click a lineup icon to view info” prompt rather than a dedicated not-found page. A known record referring to an unsupported map or agent produces a viewer error.

## Hide, restore, and refresh records

Select **Hide this lineup** in the details panel to remove that record from your map results. Its details remain open, so you can immediately uncheck it to restore it. A direct link can also open a hidden record's details. Use **Clear hidden lineups**, shown when hidden IDs exist, to restore all hidden records in that browser context.

Hidden IDs and the downloaded lineup cache are stored for the current site origin in browser local storage. They are not account settings and do not automatically follow you to another browser, profile, private session, or host. If saving a hide preference fails, a toast explains that it applies for the current visit. Reading records can continue over the network when storage is unavailable.

Downloaded records are cached for **ten days**. A normal reload can reuse a valid cache. There is no background polling, automatic refresh of an already open viewer, or cross-tab synchronization of its in-memory state. A successful maintainer mutation clears the cache for the next load on the same origin; changes made elsewhere may remain hidden by a valid local cache.

An absent, expired, or invalid cache triggers a network request. A failed request produces an error; the app does not fall back to an expired cache or the historical JSON files checked into the repository. An empty result for the current filters is different from a request error and does not necessarily indicate a fault.

To force a fresh load using the UI:

1. Open **Info** (`/about`).
2. Activate the small **↻** button labeled **Clear saved lineups and preferences**.
3. Check the status message, then return to **Lineups** or reload the viewer.

This reset also removes hidden-lineup preferences and the saved selection used by the maintainer editor. It does not delete remote records, clear unrelated storage keys, or update other already open tabs. Storage failures can prevent some keys from being removed; an error message reports that the reset did not fully succeed. For targeted cache troubleshooting, see [troubleshooting](TROUBLESHOOTING.md).

## Send feedback

The **Send feedback** icon opens a popup. Open a lineup first to associate feedback with that record, or open it without a selection for general feedback. Clicking outside the popup closes it.

| Field | Required | Input limit |
| --- | --- | --- |
| Name | Yes; whitespace alone is rejected | 25 characters |
| Message | Yes; whitespace alone is rejected | 500 characters |
| Reply email address | No; the browser checks email syntax when supplied | 50 characters |

Opening the feedback form requests an IPv4 value from `https://geolocation-db.com/json/`. Clicking **Send Feedback** sends the trimmed name, trimmed message, trimmed optional reply address, currently selected lineup ID (or `null`), and that IP value to the configured EmailJS service. The IP field is an empty string if the lookup has failed or has not finished. Failure of that lookup does not prevent feedback submission. See [security and privacy boundaries](SECURITY.md) for integration details.

While sending, the submit button is disabled and a status message is shown. On success, the popup reports success and closes after three seconds. On failure, it preserves the entered values, re-enables submission, and asks you to retry. Feedback is sent to an external service; the app provides no delivery tracking or guarantee of a reply. Closing the popup discards its local draft and does not cancel an already submitted EmailJS request.

## Accessibility and device limits

Navigation, rotation, form controls, copy, and feedback have accessible labels. Copy and feedback support Enter and Space, navigation supports Escape, and submission/reset outcomes use status messages. These features do not make the entire app keyboard accessible: map ability/start markers are clickable images without keyboard activation, and there is no keyboard equivalent for all map or image gestures. Instruction-image alternative text is generic rather than a transcription of each screenshot.

Touch pan/pinch handlers are present, but hover-only previews are unavailable on touch devices. The map and form layouts are not documented as fully verified across every phone, browser, screen reader, or assistive technology. Prefer a pointer-capable browser for tasks that require precise marker selection or placement. For the scope of automated checks and remaining manual checks, see [testing](TESTING.md).

## Implementation references

- [Routes](../src/App.tsx), [navigation](../src/component-utils/navbar/Navbar.tsx), and [viewer state and events](../src/pages/LineupSite.tsx).
- [Filtering, clustering, loading, and cache handling](../src/services/lineup-data.ts).
- [Details, hiding, credits, and copied links](../src/component-utils/lineup-site-utils/ContentFrame.tsx).
- [Instruction-image gestures](../src/component-utils/lineup-site-utils/ImageFrame.tsx) and [map transforms](../src/component-utils/map-utils/MapInteractionCSS.tsx).
- [Feedback fields and requests](../src/component-utils/lineup-site-utils/EmailForm.tsx) and [Info reset](../src/pages/Info.tsx).
