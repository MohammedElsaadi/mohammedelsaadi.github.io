# Railway Tabletop

An isolated multiplayer implementation of the original USA railway game for 2–5 human players. Public branding defaults to **Railway Tabletop**; set the public Vite build variable `VITE_TRAINS_TITLE` to change it. No production deployment, DNS change, remote migration, or Git push is performed by implementation or tests.

## Entry points and architecture

- `/games/trains`: create a table or enter a room code.
- `/games/trains/:code`: persistent room deep link, lobby, private initial selection, gameplay, final results.
- `/api/trains/rooms`: POST creation with `{ "nickname": "Alice" }`.
- `/api/trains/rooms/:code`: GET existence metadata only (code, phase, player count), or 404/410.
- `/api/trains/rooms/:code/ws`: same-origin WebSocket upgrade, followed by JOIN.

`src/features/trains/` owns the React screens, HTML cards/dialogs, responsive CSS, socket client, and lazy-loaded React Three Fiber board. The main router adds only two routes. Board Game Menu stays first on `/games`; Sonora and Splendid Rivalry remain hidden from that listing and retain their existing direct URLs.

`shared/trains/` contains the typed data, Zod wire validation, pure rules reducer, per-player projections, payment options, connectivity, and exact weighted edge-simple trail scoring. No React, Three, Worker, database or storage imports occur in the rules engine. Test RNG is injected; production uses Web Crypto.

`worker/trains/` adds one SQLite-backed `GameSession` Durable Object per room to the **existing Workers Static Assets deployment**. The Board Game Menu dispatcher, D1/R2 bindings, API routes, static assets and SPA fallback remain in place. This is not a Pages migration and does not require a separate Worker or CORS configuration.

## Local commands

Use Node 24 (tested with 24.13.0) and npm. The SQLite integration harness uses the built-in `node:sqlite` module. Playwright uses an installed Microsoft Edge browser by default; change `channel` in `playwright.config.ts` for another installed Chromium browser if needed.

```powershell
npm ci
npm run dev:full
```

This builds the site and starts Wrangler locally at `http://localhost:8787`. Open `/games/trains` in separate browser profiles/devices that can reach that server. All development DO/D1/R2 data is local under the ignored `.wrangler/state`. The railway game needs no API keys, external database creation, or Board Game Menu database migration. To exercise Board Game Menu locally, retain its existing `npm run db:migrate:local` workflow.

For frontend hot reload, leave Wrangler running on 8787 and run `npm run dev` in another terminal. Vite proxies **only** `/api/trains` and its WebSockets to the local Worker. Normal frontend development behavior otherwise remains unchanged.

```powershell
npm run check
npm run test:trains:e2e
```

`check` runs ESLint, the entire Vitest suite, the production frontend build, backend TypeScript checks and the separate SQLite/browser test-harness type check. E2E tests start `dev:full` when 8787 is not already serving; an existing server must serve the current build. Playwright output is ignored in `test-results/` and `playwright-report/`.

## Cloudflare deployment preparation

`wrangler.jsonc` adds these bindings while preserving existing D1/R2 resources:

| Binding | Purpose |
| --- | --- |
| `TRAIN_ROOMS` | `GameSession` SQLite Durable Object namespace |
| `TRAINS_CREATE_LIMIT` | 10 creation requests per IP per 60 seconds; namespace ID 1001 |
| `TRAINS_ACCESS_LIMIT` | 120 room probes/handshakes per IP per 60 seconds; namespace ID 1002 |

The migration tag **`trains-v1`** uses `new_sqlite_classes: ["GameSession"]`. The class is exported by `worker/index.ts`. Its tables initialize synchronously in the DO constructor; there is no remote D1 migration for rooms. Preserve migration history when adding subsequent class migrations; do not remove or reuse an already deployed tag. Native Cloudflare rate limits are per-location abuse controls, supplemented by durable per-room join limits and per-socket message limits.

Compile a deployment bundle without publishing:

```powershell
npm run check
npx wrangler deploy --dry-run --outdir .wrangler/trains-build
```

Only after the owner explicitly authorizes production deployment:

```powershell
npm run build
npx wrangler deploy
```

The authorized deploy applies the new DO namespace migration. Cloudflare authentication and an account/plan supporting SQLite Durable Objects are required. The existing Workers Builds configuration may deploy commits automatically; do not push to its production branch without the intended release decision. This feature introduces no secrets. Do not place room snapshots in D1, KV, public assets or localStorage.

## Authority, persistence and reconnect

Each accepted action reloads the SQLite snapshot, validates its active socket generation and expected version, computes an immutable next state, then persists the snapshot, sanitized journal and action receipt in one synchronous transaction. Personalized snapshots broadcast only after commit. `(playerId, actionId)` receipts survive hibernation and return the original ACK version; changing an action payload under the same ID is rejected. Simultaneous initializers reserve the room atomically; used/expired codes never silently reinitialize.

SQLite tables are `game_state` (schemaVersion 1 JSON), `game_events` (sanitized append-only journal), `processed_actions` (receipts), `seats` (active connection generations), `join_limits`, and `lifecycle` (expiry tombstone). No asynchronous network work occurs inside action transactions.

WebSockets use `ctx.acceptWebSocket`, serialized attachments, `webSocketMessage`, `webSocketClose` and `webSocketError`. No standard `ws.accept()` is used. On wake, `ctx.getWebSockets()` plus attachments and durable generations identify the current seat; no private data depends on a JS connection map.

Names are NFKC-normalized, trimmed, whitespace-collapsed, case-insensitive and restricted to 1–20 display characters of Unicode letters/combining marks/numbers/spaces/hyphens/underscores. Reusing a nickname deliberately takes over that existing seat: the durable generation changes before the old socket is kicked, preventing queued old commands or late close events from affecting the new connection. **Room code plus nickname is the seat credential, not secure personal authentication.** No account, PIN, password, bot, spectator, chat, matchmaking or timer is added.

The browser stores only its last nickname and local camera position for convenience. Cards, tickets, future deck order and gameplay are never persisted in browser storage. It reconnects with exponential backoff/jitter and requests a fresh personalized view. A pending network action retries its original action ID, allowing durable deduplication. A stale unaccepted action is rejected and must be chosen again rather than silently replaying against changed state. Refreshing mid-draw or mid-offer resumes the persisted action exactly; there is no reset or arbitrary END_TURN.

The client sends `ping` every 20 seconds. Cloudflare auto-responds `pong` without waking the DO or extending retention. One shared alarm also checks heartbeat loss (75 seconds), closes silent/unjoined sockets (10-second JOIN deadline), and publishes offline presence after a 3-second grace. This alarm can wake a connected room roughly once per minute; empty rooms have only their expiry alarm. Presence never consumes or skips a turn.

Retention from meaningful user activity: empty lobby 1 day; occupied lobby 30 days; unfinished game 90 days; completed game 30 days. Optional Worker variable `TRAINS_RETENTION_DAYS` overrides all defaults with a positive number of days. Pings, RESYNC and presence changes do not renew retention. New joins/rejoins and accepted gameplay/lobby actions do. Expiry erases private snapshots, receipts, sessions and journals, retains a code tombstone and returns 410 on late access.

## Wire protocol

Client messages are strict objects. Unrecognized fields/discriminants, invalid indexes/counts, messages over 4 KiB and binary messages are rejected. No client-supplied player ID is used for authorization.

```ts
{ type: 'JOIN', nickname: string }
{ type: 'RESYNC' }
{ type: 'ACTION', actionId: string, expectedVersion: number, action: GameAction }
```

Every `JOINED` or `SNAPSHOT` message includes `stateVersion`, `public` and `private`; `private.playerId` identifies the seat. Public views contain player names, colors, counts, presence, route points, owned tracks, face-up market, turn progress and the last 50 timestamped moves. Only the owning socket gets its exact hand, held tickets, completion status, current ticket offer and legal payment options. All destination outcomes reveal only at completion. HTTP metadata does not reveal names or cards. Blind card identities and private ticket choices never appear in the public log.

| Action | Payload beyond `type` | Availability |
| --- | --- | --- |
| `SELECT_COLOR` | `color`: blue/red/green/yellow/black | Own lobby seat; unused color |
| `LEAVE_LOBBY` | none | Lobby only; host transfers by seat order |
| `REMOVE_LOBBY_PLAYER` | `playerId` | Host, lobby only; cannot remove self |
| `START_GAME` | none | Host, 2–5 unique-color seats |
| `KEEP_INITIAL_TICKETS` | `ticketIds`: 2 or 3 offered IDs | Each seat once; all must finish |
| `DRAW_TRAIN_CARD` | `source`: `blind` or face-up index 0–4 | Active player, first or legal second draw |
| `CLAIM_ROUTE` | `routeId`, `payment`: partial map of card kinds to integer counts | Active player awaiting action |
| `DRAW_DESTINATION_TICKETS` | none | Active player awaiting action, nonempty destination deck |
| `KEEP_DESTINATION_TICKETS` | `ticketIds`: 1–3 offered IDs | Active player in destination selection |

Server messages also include `ACK {actionId,stateVersion}`, `ERROR {actionId?,code,message,stateVersion?}`, `SEAT_TAKEN_OVER {message}` and `REMOVED {message}`. Successful claiming and completed draws advance automatically. There is no undo, pass, time-based skip, or arbitrary end-turn message.

## Rule details and explicit policies

- 8 regular card kinds ×12 plus 14 locomotives; pink is canonical. Piece colors are separate from payment colors. Each player has 45 pieces and starts with four train cards and three private ticket offers.
- Initial selections keep at least two; later selections keep at least one. Discards return in original offer order to the bottom of the destination deck. Starting player is randomized, followed by fixed lobby seat order.
- Gray payments use any single regular color plus any chosen number of wilds, including all-wild payments. Payment previews enumerate all legal combinations, preferring fewer wilds. Two-/three-player double-track restrictions and no-self-double ownership are authoritative.
- First face-up locomotive ends the draw; a face-up locomotive cannot be the second draw. Blind wilds count once. Market slots refill immediately when stock exists; discards reshuffle when the train deck empties.
- Exhaustion policy: a market with fewer than five cards keeps actual remaining cards. A full three-wild market refreshes only if at least three regular cards exist across market/deck/discard. If a legal five-card market is mathematically impossible, retain the wild-heavy market; blind draws remain available if stock exists. After 12 unlucky refreshes, deterministically construct a legal market from shuffled available stock. This guarantees termination and card conservation. If no legal second draw remains, the partially completed action ends automatically.
- Final round records every player owing one extra turn only **after** the trigger turn ends. The trigger player takes their extra turn after the others. Final scoring recalculates route points, resolves own-network ticket connectivity and awards +10 to all tied-longest trails.
- Longest trail is exact weighted edge-simple DFS over a multigraph. Cities may repeat; route edges cannot. Reachability provides upper-bound pruning; Eulerian remainders can be scored directly. Tests compare it to an independent exhaustive solver and benchmark 25 generated 45-piece networks.
- Points, completed ticket count, then longest-path bonus decide winners. Remaining ties are co-winners.

## Presentation and accessibility

The board uses original procedural parchment, continental contours, walnut rim, track slots, city markers, high-contrast HTML city labels and miniature 3D trains. Each claimed segment has exactly `route.length` distinct pieces, with separate parallel lanes. Track hover identifies endpoints/color/length; selecting opens an HTML payment dialog and ghost train preview. Committed placements animate briefly and never block gameplay; reduced motion skips movement. Wheel/pinch zoom, drag pan, reset-to-fit and locally persisted camera state are available.

Native dialogs provide modal focus trapping and Escape dismissal. The text route list exposes all 100 tracks to keyboard/touch users, supports search, and permits full play if WebGL fails. Card names, numeric counts, track names, payment descriptions and player colors avoid color-only information. Market/hand trays scroll horizontally on small devices. Player panels and private tickets are collapsible. Sound is opt-in and off by default; no external audio assets are used.

## Verification and remaining limits

Final local verification (2026-11-07): `npm run check` passed with 74 tests across 10 Vitest files, ESLint, the frontend production build, Worker type checks and test-harness type checks. `npm run test:trains:e2e` passed all five browser scenarios. A Worker `wrangler deploy --dry-run` compiled the assets and all configured bindings without publishing. Vite still reports the existing large-main-chunk warning; it is not a failed build.

**Remaining rule-policy edge case (P2): total exhaustion can strand a turn.** If the train deck, discard, face-up market and destination deck are all empty, and the current player cannot pay for any remaining route (for example, they have zero pieces on their final extra turn), none of the three specified actions is legal. This implementation retains the specified no-pass/no-skip protocol. A separate decision is needed about a server-verified forced pass or stalemate result for that degenerate case. Reproduce by constructing a final-round state with an active zero-piece player, moving all 110 train cards into opponents' hands and all 30 tickets into players' kept tickets, then projecting that active seat: every draw/claim control is unavailable and no confirmed action can finish that turn. Ordinary stock shortages resolve as documented above; the tested full 2-/3-/5-player games reach final scores.

Automated tests cover dataset cardinality/topology, conservation, initial tickets, deterministic start order, all payment types, illegal turns, short/exhausted decks, double tracks, destination returns, weighted trail loops/branches/parallel tracks, tie breakers, the complete final round, public/private projections, collisions, deduplication, stale/racing actions, takeover/late-close races, heartbeat loss, retention, expired tombstones and instance recreation using persistent SQLite. Deterministic full games run with 2, 3 and 5 players.

The real local Wrangler/Playwright suite runs a whole 2-player game in **two separate Edge processes**, checks refresh mid-draw, identical final results, takeover, absence of unhandled/console errors, mobile landing/deep-link fallback and existing games listing order. A separate canvas test clicks and verifies every one of the 100 physical tracks. Additional 3-/5-player browser scenarios exercise lobbies, independent initial choices, real turns, mobile layout and the accessible route dialog. Screenshots are generated under `test-results/` for board trains, final results and mobile layouts.

Limits: production has deliberately not been deployed or load-tested; real Cloudflare production hibernation/edge networking must be verified after an authorized release. Instance reconstruction, alarms and SQL transactions are covered locally, but cannot prove every production network failure. Browser verification uses Edge/Chromium on Windows; physical iOS/Android devices, Firefox and Safari are not verified. Dense map areas are inspectable by zoom and the accessible list; this is original schematic artwork rather than a publisher board replica. No independent external assets or publisher artwork are shipped.

## Source and asset provenance

Rules: the user-supplied root `Ticket To Ride Manual.pdf`, read in full, and the approved `TICKET_TO_RIDE_CODEX_SPEC.md` digital adaptations. Dataset facts: the spec’s Appendices A–C (36 cities, 100 physical tracks, original 30 tickets). `scripts/import-trains-data.py` can regenerate the typed static data from those CSV blocks; the application does not need the spec or PDF at runtime.

The spec cross-references [Rob217’s USA data](https://github.com/Rob217/TicketToRideAnalysis/tree/master/data/USA) and [rkdarst’s topology inventory](https://github.com/rkdarst/board-game-networks/blob/master/data/ticket-to-ride/united-states.yaml). These are provenance links supplied in the approved spec, not independently downloaded artwork or independently reverified inventories.

Cloudflare implementation APIs were checked against the official [WebSocket Hibernation example](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/) and [SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), and the installed Workers type declarations. All map textures, train meshes, card SVGs and the small opt-in tone are original procedural code. Typography uses system fonts. No commercial logo, map scan, card illustration or third-party art/audio asset is included.
