# Security and data handling

This reference describes actual client behavior and its limits for agents changing or operating the project. It is not a security certification, a privacy policy, or a definition of the external backend's authorization rules. Vercel frontend hosting and AWS Lambda backend hosting are maintainer-confirmed; cloud configuration is outside this repository.

## Trust boundaries

| Boundary | Current client behavior | Implication for changes |
| --- | --- | --- |
| API → browser | `fetchLineups` validates JSON records; cached data is revalidated | Preserve runtime checks even though TypeScript interfaces exist |
| Browser → mutation API | JSON POST with runtime `x-api-key` and `request-type` | Backend must enforce authorization and validation; hidden routes and disabled buttons are not security controls |
| Browser → local storage | Lineup cache, timestamp, hidden IDs, one edit selection | Data is origin-local and accessible to scripts running on that origin; it is not a secret store |
| API → rendered content | React renders text; media and credits use record values | Preserve HTTP(S)-only credit links and avoid adding raw HTML interpretation |
| Browser → feedback providers | IP lookup plus EmailJS send | Changes affect data sent to third parties and must be documented |
| Repository → build/deployment | Client source and static assets become public | Source code, build-time client variables and public identifiers cannot hold server secrets |

Read [API_REFERENCE.md](API_REFERENCE.md) for exact schemas. Read validation is intentionally less strict than authoring validation: accepting a record's field types does not prove its URLs are safe/reachable, IDs belong to a catalog, or content is appropriate.

## Credentials and public identifiers

- The maintainer API key is entered in a password input and retained in component state while the form is mounted. It is sent in the POST header; it is not part of saved lineup payloads or `editMarker`. Browser developer tools can still inspect the request.
- API Gateway URL, EmailJS service/template/public-key identifiers, public domain and media URLs are embedded client configuration. The EmailJS client identifier is not the maintainer API key.
- Do not put a real key in source, docs, test fixtures, screenshots, shell history examples, query strings, or logs. Use synthetic values such as `test-key` only in mocked requests.
- Provisioning, permissions, rotation and revocation are external operations. If a real key is exposed, identify its actual owner and supported revocation process; changing a frontend constant does not rotate it.
- The repository ignores several local environment/credential paths, but an ignore rule is not evidence that a file or Git history contains no secrets. No key or cloud access is required for the automated regression suite.

## Application storage

| Key | Contents | Persistence/removal |
| --- | --- | --- |
| `savedLineups` | API records grouped by map | Used with timestamp for ten-day cache; invalidated after successful mutations |
| `lastRetrievedTime` | Cache timestamp in milliseconds | Removed with cache invalidation |
| `hiddenMarkers` | IDs hidden in this browser origin | Persists until cleared/reset; failures leave current-session behavior only |
| `editMarker` | One selected complete record, without API key | Written by `/select`, updated/removed by the editor when it still owns that selection |

The reset control on `/about` targets these four keys. There is no application account, synchronization service, encrypted storage, or stored draft history. Browsing can continue when storage is blocked; the current selector/editor handoff cannot. Different origins have separate state. See [MAINTAINER_GUIDE.md](MAINTAINER_GUIDE.md) for multi-tab behavior.

## Third-party request inventory

| Trigger | Recipient/configuration | Data involved |
| --- | --- | --- |
| Viewer/selector load when cache is missing/invalid/expired | API Gateway URL in [constants.ts](../src/component-utils/constants.ts) | GET retrieves lineup records; no form API key is sent with GET |
| Authorized create/edit/delete | Same API Gateway endpoint | Lineup mutation body and runtime API-key header |
| Display a lineup screenshot | The record's image host | Browser image request to the supplied URL |
| Display a lineup video | `www.youtube.com` iframe from [YoutubeEmbed.tsx](../src/component-utils/lineup-site-utils/YoutubeEmbed.tsx) | Video ID and browser iframe request; YouTube may load further resources |
| Load styles/fonts | Google Fonts imports in [scss](../src/scss) | Font stylesheet and font resource requests |
| Mount feedback form | `https://geolocation-db.com/json/` | Public-IP lookup; returned `IPv4` is held in component state if present |
| Submit feedback | EmailJS, configured in [EmailForm.tsx](../src/component-utils/lineup-site-utils/EmailForm.tsx) | `from_name`, `message`, optional `reply_to`, `ip_address`, `lineup_id` plus EmailJS identifiers |
| Copy a lineup link | Browser clipboard | Canonical production URL; this is a local clipboard action, not a backend write |

Feedback names/messages/reply addresses are trimmed. Input limits are 25, 500 and 50 characters respectively; name and message cannot be blank. A failed/pending IP lookup does not block sending, and an empty IP may be sent. Lookup is aborted on unmount; the EmailJS send itself is not canceled by closing the form. The frontend does not persist feedback in local storage.

External providers receive normal connection/request metadata. Their retention, logging, cookies, processing locations and account settings cannot be established from this code. The app has no implemented consent/settings UI for these integrations. Do not claim it is anonymous, tracking-free, or covered by a particular retention policy merely because it has no analytics SDK.

## Content and browser controls

Credit values become links only when parsed as HTTP(S) URLs; other values are rendered as text. External credit links use `noopener`/`noreferrer`. Screenshot URLs are not allowlisted or checked for reachability by the form, and the runtime record validator does not normalize arbitrary historical video values. Preserve text rendering; do not add `dangerouslySetInnerHTML` for lineup descriptions without a separate content-sanitization design.

The repository does not define production Content Security Policy or other response headers. If adding a CSP, inventory API/EmailJS/IP requests, dynamic screenshot hosts, YouTube frames, Google Fonts, and styles emitted by React Select and the app before enforcing it. Derive the actual policy from observed traffic and intended supported hosts rather than copying a generic policy that breaks the UI.

## Agent testing and operational scope

Use synthetic fixtures and mocked network/email calls for normal implementation verification. Do not send a feedback message or use an API key merely to prove a button works. Localhost and Vercel previews still use the compiled backend endpoint. CORS failures or hidden routes do not establish that a service is safe to probe with write requests.

Follow the user's actual authorized scope for data operations, deployment and external communication. These docs do not add a blanket confirmation step to local edits/tests or require repeating authorization already given. If a task depends on unspecified external state, request the concrete missing project/function/data-scope information and continue independent local work.

When reporting failures, redact keys and feedback personal data from request dumps. HTTP error bodies are displayed by the client, so a backend should not return internal credentials or sensitive diagnostics to the browser.

## Dependencies and known limitations

[REVIEW.md](REVIEW.md) records the earlier audit and unresolved package chains. It is a dated state of the dependency graph, not proof that today's graph is safe. A fresh `corepack yarn audit --json` requires registry access and may report the same advisory on multiple dependency paths. Investigate actual package usage and compatible fixes; do not force incompatible major transitive versions simply to remove a count.

Current constraints include the CRA/Jest/jsdom stack, router major-version migration work, optional storage, remote services, and no backend implementation in this repository. There is no documented private vulnerability-reporting address or incident owner here; obtain the appropriate maintainer contact before publishing sensitive findings. Repository and asset licensing/attribution are summarized in [README.md](../README.md); documentation does not grant additional rights.
