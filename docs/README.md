# Documentation index for LLM agents

Start with [AGENTS.md](../AGENTS.md). This index routes an agent to the smallest set of documents needed for a task. Documentation describes the current frontend implementation; actual source, tests, and the user's instructions govern implementation decisions.

## Read by task

| Need | Canonical reference | What it contains |
| --- | --- | --- |
| Establish scope and avoid repository-specific mistakes | [Agent guide](../AGENTS.md) | Task-to-file map, invariants, commands, external-effect boundaries |
| Run, modify, or debug the frontend locally | [Development](DEVELOPMENT.md) | Setup, scripts, TypeScript, dependency pins, file ownership, styles, change recipes |
| Understand modules and state transitions | [Architecture](ARCHITECTURE.md) | Component/service responsibilities, data flow, lifecycle, clustering, map/image transforms |
| Know observable public behavior | [Viewer behavior](USER_GUIDE.md) | Routes, filters, markers, media, hidden records, feedback, device/accessibility limits |
| Understand or change authoring workflows | [Maintainer workflows](MAINTAINER_GUIDE.md) | Create/select/edit/delete steps, validation, pending/failure behavior, cross-tab caveats |
| Change data, catalogs, or assets | [Lineup data](LINEUP_DATA.md) | Types, field meanings, stable IDs, coordinates, historical assets, extension recipes |
| Integrate with or change requests | [API reference](API_REFERENCE.md) | GET/POST contracts, payloads, headers, responses, runtime validation, service helpers |
| Choose and interpret checks | [Testing](TESTING.md) | Suite map, focused commands, fixture/mocking patterns, browser checklist, verification limits |
| Build/release or diagnose hosting | [Deployment](DEPLOYMENT.md) | Confirmed Vercel/AWS Lambda boundaries, build output, routing/CORS, release and rollback guidance, external unknowns |
| Handle credentials, feedback data, or dependency risks | [Security and data handling](SECURITY.md) | Trust boundaries, local storage, public identifiers vs keys, third-party requests, audit interpretation |
| Diagnose a concrete symptom | [Troubleshooting](TROUBLESHOOTING.md) | Symptom → evidence → likely cause → action, with source pointers |
| Review the earlier migration and checks | [Cleanup review](REVIEW.md) | Historical changes, verification counts, limitations, dependency audit snapshot |
| Prepare a contribution/review | [Contributing](../CONTRIBUTING.md) | Development expectations, review checklist, coordination and documentation rules |

## Authority and freshness

| Information | Evidence to use |
| --- | --- |
| Current code behavior | Linked TypeScript source and colocated tests |
| Scripts, versions, resolutions | [package.json](../package.json) and [yarn.lock](../yarn.lock) |
| Compiler settings | [tsconfig.json](../tsconfig.json) |
| Frontend hosted on Vercel; backend on AWS Lambda | Maintainer confirmation during documentation work |
| Vercel project/branch and Lambda deployment details | External configuration; see [deployment inventory](DEPLOYMENT.md#external-configuration-inventory) |
| Test/audit counts in the cleanup report | Snapshot of that review, not a current guarantee |

No Lambda source, infrastructure definitions, checked-in CI workflow, or Vercel configuration is supplied in this repository. Historical references to other AWS services are not sufficient evidence of their current topology.

## Minimal reading paths

- **Bug fix:** agent guide → relevant behavior/reference section → source + existing test → testing matrix.
- **Map or agent addition:** agent guide → data-model catalog and coordinate sections → constants/assets → catalog tests and affected pages.
- **API change:** API reference → data model → services + forms/viewers → service and page integration tests. Determine whether the backend must change before changing the client contract.
- **UI change:** behavior guide → architecture + Sass workflow → component/page tests → browser verification if available.
- **Release:** deployment inventory → frozen install/full verification → release checklist. Preview frontend URLs do not create an isolated backend.
- **Dependency change:** development dependency constraints → tests → full verification → fresh audit. Review existing resolutions rather than deleting them blindly.

## Keeping the documentation maintainable

Use relative links to source files/symbol names rather than fragile line numbers. Update the canonical document for a change and link to it from overview pages. Keep command examples copyable, use synthetic data, and label proposed configurations separately from actual checked-in behavior. When an external detail is unknown, name it and its owner/source instead of fabricating a plausible default.

The guides are intentionally usable by humans too, but emphasize contracts, invariants, exact file paths, and verification so an agent can act without reconstructing the whole project.
