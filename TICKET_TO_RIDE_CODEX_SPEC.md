# Multiplayer Railway Board Game — Codex One-Shot Implementation Specification

> **Status:** approved product plan; implement the complete working experience, not just a prototype.
> **Date:** 2026-11-07
> **Target:** existing personal React + TypeScript website on Cloudflare.
> **Working feature name:** `ticket-to-ride` (internal). User-facing branding is configurable; see licensing notes.
> **Authority order:** (1) supplied original USA rules PDF for gameplay; (2) explicit decisions in this document for digital adaptations and UX; (3) verified baseline map/ticket datasets in Appendix A–C; (4) documented assumptions for remaining edge cases.

## 0. Instructions to Codex: execute, don't merely propose

You are the implementation agent. Read this entire document first, inspect the repository, and implement this feature end-to-end in **one continuous run** as far as the repository/tools allow. Work in incremental commits or checkpoints internally, **but do not stop after scaffolding or Phase 1**. The user wants a playable multiplayer game, including real rules and a Three.js board. Do not ask for decisions already settled below. Where the repository differs from assumptions, adapt to it while preserving behavior. Perform the implementation, run tests, fix defects, and give a factual final report with remaining blockers.

**Before coding:** inspect `package.json`, routing, framework, design system, Cloudflare configuration, CI/test tools, environment patterns, and existing directories. Do not replace or destabilize the existing website. Prefer adding a well-isolated feature and Worker/DO bindings. Keep all deployment-affecting changes documented. Do not silently deploy to production or modify DNS/accounts; prepare the deployment and explain any approval/credentials needed.

**Completion bar:** Two separate browsers must be able to create/join one game, choose nicknames, start, select initial tickets, play legal turns against the complete original USA dataset, view 3D placed trains, disconnect and rejoin by nickname without losing state, trigger final round, and reach correct final scores. A pretty lobby without real gameplay is NOT complete.

## 1. Product decisions (do not reinterpret)

| Area | Decision |
|---|---|
| Edition | Original classic USA, **30** destination tickets, not USA 1910 / Europe / modern expansion |
| Players | 2–5 human players; no bots, no spectators in v1 |
| Account system | **None**; nickname-only seat ownership, as explicitly requested |
| Rejoin | Enter existing nickname in same room; takeover allowed, old connection kicked |
| Host | Creator controls starting and removing lobby players; host can transfer on departure |
| Start order | Server randomly selects first player, then lobby seating order circulates clockwise (digital adaptation of manual's traveler rule) |
| Disconnection | **No timer and no skip**; game continues to be viewable, waits on disconnected player's turn |
| Session | Short shareable room code + deep link, same URL restores room on refresh |
| Presentation | **Hybrid:** Three.js / React Three Fiber tabletop for board, polished standard React/HTML overlays for all cards/controls |
| Art | Vintage 1900s railway parchment + walnut tabletop; clear modern readable UI and unmistakable high-contrast routes/trains |
| Interaction | Guided tabletop: click route, see cost/valid payments, choose payment, preview, confirm |
| Cards | Original 8 colors **PINK, WHITE, BLUE, YELLOW, ORANGE, BLACK, RED, GREEN** (12 each) + 14 rainbow locomotives = **110** |
| Player pieces | Separate 5 colors **blue/red/green/yellow/black**; 45 pieces per player |
| Hidden info | Hands/destination tickets private to the current nickname connection; no secret state in public payloads/logs |
| Undo | No server undo of confirmed actions; cancel preview before commit |
| Turn timer | None |
| Media | Lightweight animation, audio opt-in/off by default |
| Mobile | Responsive secondary experience; desktop-primary with working touch controls |
| Future extras | No bots, chat, matchmaking, expansions, spectator mode, or player accounts in v1 |

**Nickname-only risk (intentional):** The combination of room code + nickname is effectively the credential. Anyone who learns both can take over a seat and read that player's private cards. Do **not** claim this provides secure personal authentication. Do **not** add mandatory PIN/password as a workaround; user explicitly selected nickname-only. Sanitize inputs, rate-limit joins and flag takeover with a public log entry; keep room codes hard to guess.

## 2. Source manual and exact rules

The user supplied **`74 Ticket to Ride Instructions.pdf`**, four pages, an English reprint of the original USA game rules. If this file is available inside the repository / Codex workspace, use it as the primary rule reference; if not, the source-derived rule summary below is self-contained. **The file is attached in the ChatGPT conversation; do not assume it's already present in the Git checkout.** No need to block implementation if inaccessible.

### 2.1 Setup (manual page 2)

- 2–5 players; each gets **45 colored plastic train pieces** and matching scoring marker at zero.
- Shuffle **110 train car cards**: 12 each of pink, white, blue, yellow, orange, black, red, green, and 14 rainbow locomotive wilds.
- Deal **4 train cards** to every player. Place **5 face-up train cards** in a market; remainder is face-down draw deck.
- Shuffle **30 destination tickets**. Deal **3** privately to each player. Each keeps at least **2**, optionally all 3. Unkept tickets go to the **bottom** of the destination deck. Tickets remain private until final scoring.
- Digital adaptation: initial ticket choices can be made independently; only when everyone confirms do we enter `PLAYING`, announce randomized first player, and enable turns. If someone disconnects during selection, preserve their pending tickets and wait.

### 2.2 One turn, exactly one action (manual pages 2–3)

A player chooses **one** action:

1. **Draw train cards:** draw up to two cards, one at a time, from face-up market or blind deck. Replace a chosen face-up slot immediately when available. A face-up locomotive **as the first selection ends the action immediately**; a face-up locomotive cannot be the **second** selection. A blind-drawn locomotive is just one card, and the player may still make their second draw. With **3 or more of 5** face-up locomotives, discard and refill all five (as stock allows). No hand-size limit. Reshuffle train discard into draw deck when exhausted. If no draw cards can be obtained and there is no discard, drawing is unavailable.
2. **Claim one route:** spend a valid matching set of `route.length` cards, put exactly that many pieces of the player's color onto a single open route, score immediately by length, discard spent cards. Colored routes require their color (substitute locomotives freely). A **gray** route permits any one regular color plus locomotives; an all-locomotive payment is valid. Route need not touch previously claimed routes. A player cannot own both halves of a double route.
3. **Draw destination tickets:** draw **up to 3**, limited by cards remaining in destination deck, keep **at least 1**, return unkept to the **bottom** of the deck. This action consumes the turn only when the player confirms their selection. Tickets stay private until scoring. If no tickets remain, the action is unavailable.

**Double routes:** There are routes between the same city pair with two separate tracks. In a **2–3 player game**, as soon as either is claimed, the other is blocked for everyone. In a **4–5 player game**, separate players may own opposite halves, but no one may claim both.

**Route point table (manual page 4):**

| Train spaces in claimed route | Immediate points |
|---:|---:|
| 1 | 1 |
| 2 | 2 |
| 3 | 4 |
| 4 | 7 |
| 5 | 10 |
| 6 | 15 |

**Endgame:** After a player's turn ends with **0, 1, or 2 trains left**, everyone **including that triggering player** receives **one additional complete turn**. In particular, the triggering turn is NOT that player's final turn. Implement explicit tracking of which players still owe their final turn; complete only after each has taken it.

**Final scoring:** Sum route points plus the face values of **completed** tickets minus the face values of **uncompleted** tickets; add **10** points to each player tied for the **longest continuous path**. A longest path may revisit cities and contain loops but may **not traverse the same owned route segment twice**. The length measured is total individual train spaces, not number of city hops. All tied-longest players receive the bonus. Winner = max final points; tie breaker = most completed destination tickets; next tie breaker = holder(s) of the longest-path bonus. If still tied, report co-winners rather than invent another rule.

### 2.3 Critical rules/edge cases to encode as tests

- Color labels: the provided manual calls the pink/purple train-car color **Purple** in its body text. **Use `pink` as the canonical code/UI color to match the user's original card image; treat `purple` as an import alias only**. This must not produce a ninth regular color.
- Distinguish **route color** (payment requirement), **train card color** (currency) and **player piece color** (ownership). A black player can pay 3 blue cards for a blue route, placing 3 **black** pieces.
- Client never authoritatively determines cost, valid payment, drawn cards, scores, winner, shuffled order or card identities of other players.
- Cards already selected for a partially completed draw remain committed; reconnection cannot restart that draw.
- Empty/short markets: never invent or duplicate cards. After deck/discard depletion, refill only actual remaining cards, adjust draw availability, and avoid infinite auto-refresh loops if a legal 5-card market cannot be formed. This exhaustion behavior is an implementation policy where the manual lacks full detail; make it deterministic and test it.
- Destination returns are appended to the bottom in a defined, deterministic order for reproducible tests; cards never vanish.
- Longest-path search must be **exact weighted edge-simple trail** over each player's owned route multigraph, not a naive longest simple city path. Memoized DFS/backtracking by current vertex + used edge mask is acceptable given 45-piece maximum; benchmark worst cases and add pruning if needed.

## 3. Sessions and state machine

### 3.1 URL/API shape (adapt to the site's existing routing)

- UI landing path: `/games/trains` (or best match to repository's route conventions).
- Room deep link: `/games/trains/:code`, e.g. `/games/trains/K7M4PX`.
- Worker namespace under `/api/trains/` (or equivalent existing backend API).
- Secure random room codes: 6 human-friendly upper-case characters from an unambiguous alphabet, e.g. `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Check for collision by atomically initializing the code's Durable Object only if unused; retry on collision. Never assume `getByName` alone means a session exists. Validate room codes on every request and rate-limit probing.

### 3.2 States

`LOBBY` -> `INITIAL_TICKETS` -> `PLAYING` -> `FINAL_ROUND` -> `COMPLETED`.

`expired` or deleted rooms return a clear not-found/expired response; disconnection is **presence**, not a gameplay state. Maintain additional **turn substate** for `AWAITING_ACTION`, `DRAW_TRAIN_CARDS(0|1 selected)`, `DESTINATION_SELECTION`, and `INITIAL_TICKET_SELECTION`. Distinguish `FINAL_ROUND` from the last-turn action substate. No automatic time-based turn advancement.

### 3.3 Lobby behavior

- Creator enters nickname, is host, joins first. No separate registered account.
- Unique trimmed, case-insensitive names (NFKC-normalized, max 20 display characters, reasonable allowed Unicode letters/numbers/spaces/hyphen/underscore). Preserve sanitized display form; compare a canonical folded key.
- On join with an **existing** nickname, reclaim the existing player ID and slot regardless of device. Kick/revoke the old WebSocket; transmit that player-specific snapshot to the new one. Duplicate nickname takeover is deliberately allowed, with a visible notification. No PIN/token requirement. An optional localStorage `lastNicknameByRoom` is **convenience only**, not proof of ownership.
- One authoritative active socket per player nickname. Stale socket messages must be rejected even during takeover races. Late socket close events must not mark the new socket offline.
- New nicknames can join only in `LOBBY` if fewer than five players. New nicknames attempting to enter an ongoing game see a friendly 'Game already started; only existing players may rejoin' screen.
- Player may select any unused **piece color**: blue, red, green, yellow, black. Color changes allowed only in lobby, always conflict-checked server-side. All players must have a unique color before start.
- Host may remove a player only in lobby; if they later re-enter with a nickname they join as a new seat. If the host leaves the lobby voluntarily, transfer host to the next remaining player by seating order; host disconnect does not count as leaving and cannot block a started game.
- Host can begin only with 2–5 ready players. Seat order freezes at start. Player removal/replacement is not supported once started.
- Consider 'Ready' status optional; if implemented, all joined players must be ready before host starts. Never strand the game because of ambiguous ready state.

### 3.4 Presence and reconnect

- Do not reset or rewind gameplay on page reload, sleep, mobile backgrounding, or WebSocket reconnect.
- On websocket close/heartbeat loss, mark presence offline with a short grace period to prevent flicker; if offline player is active, show 'Waiting for {nickname} to reconnect.' All other players can inspect board/cards but cannot play out of turn.
- Network recovery: exponential backoff + jitter; reconnect, re-enter nickname, request fresh per-player snapshot, and resume exact pending action. Do not rely on unreplayed in-memory messages.
- Multiple tabs with same nickname: latest connection becomes owner. The prior tab gets a visible 'Seat opened elsewhere' message and can no longer submit actions.
- Session persistence independent of connected clients. The game remains viewable when nobody is connected after a later join.

### 3.5 Retention / cleanup (configurable defaults)

- Empty lobby: 24h since creation/activity.
- Lobby with players: 30d inactivity.
- Started, unfinished session: 90d inactivity.
- Completed: 30d inactivity.
- Durable Object alarm at computed expiry; safe idempotent cleanup. Only **meaningful user activity** should extend expiration, not periodic network pings; expired/alarmed state should reject late joins. Avoid frequent timers / worker wakeups. Deleted rooms need to return 404/410, not silently reinitialize with the same code.

## 4. Technology architecture

### 4.1 Preferred stack

- Existing React + TypeScript frontend, current router/build/design system preserved.
- `three`, `@react-three/fiber`, `@react-three/drei` for interactive 3D board.
- HTML/CSS/React UI for player list, market, hand, tickets, dialogs, tooltips, lobby, logs, state indicators.
- Cloudflare Worker HTTP entry, **one SQLite-backed Durable Object per room**, WebSocket Hibernation API for live play.
- Shared **pure TypeScript** rules module with no UI, Three, Worker, or storage imports. Inject test RNG; use crypto-backed shuffle for production.
- Runtime input validation with existing schema library or `zod` if not already provided. Strict TypeScript. Tests: Vitest or existing repo test suite; browser multiplayer e2e: Playwright or existing framework.

**Do not accidentally use the Web Standard `ws.accept()` API**. Follow Cloudflare Hibernation API: `ctx.acceptWebSocket(server)`, `webSocketMessage()`, `webSocketClose()`, `webSocketError()`, `serializeAttachment()` / `deserializeAttachment()`. Persist authoritative state in DO SQLite, not JS fields. Use `blockConcurrencyWhile` for schema initialization if required. Configure a DO binding and `new_sqlite_classes` migration; adapt names to repo conventions.

### 4.2 Deployment integration

First determine whether the site currently uses Cloudflare Pages, a Workers static-assets deployment, or separate frontend/API Workers. **Do not assume they're interchangeable.** Integrate through the existing setup with the smallest safe change; if a separate Worker is needed, document its deployment, routes, CORS and WebSocket config, secrets, and bindings. If existing Vite-based Workers static assets, prefer existing plugin/config conventions and ensure SPA fallback works for deep links. Keep the main site working.

Never store confidential backend state in Cloudflare KV, client localStorage, or a public D1 database. DO SQLite is the room's single authoritative store. A global registry is unnecessary unless required by the existing architecture or analytics.

### 4.3 Suggested code organization (adapt after inspecting repo)

```text
src/features/trains/
  pages/                  # landing, room lobby, game, completed
  components/             # 2D overlays, confirmations, player panels
  board3d/                # Canvas, Board, City, Route, TrainPiece, camera
  hooks/                  # session socket, game selectors, layout
  styles/
shared/trains/
  types.ts                # GameState, Commands, PublicView, PrivateView
  board-data.ts           # derived from Appendix A–C
  rules/                  # pure reducer, validators, scoring, shuffling
  selectors/              # legal payment options, ticket connectivity
  schemas.ts              # validated wire protocol
worker/trains/
  index.ts                # HTTP and websocket routing
  GameSession.ts          # DO state, persistence, messaging, alarms
  migrations/
tests/trains/
  rules/
  integration/
  e2e/
```

### 4.4 Authoritative state representation

Suggested minimum types (shape can be adjusted):

```ts
type TrainCardColor = 'pink'|'white'|'blue'|'yellow'|'orange'|'black'|'red'|'green';
type CardKind = TrainCardColor | 'locomotive';
type RouteColor = TrainCardColor | 'gray';
type PieceColor = 'blue'|'red'|'green'|'yellow'|'black';
type Phase = 'LOBBY'|'INITIAL_TICKETS'|'PLAYING'|'FINAL_ROUND'|'COMPLETED';

type Player = {
  playerId: string; nickname: string; nicknameKey: string;
  seat: number; pieceColor: PieceColor | null; isHost: boolean;
  hand: CardKind[]; destinationTicketIds: string[];
  trainsRemaining: number; routeScore: number;
};
type Route = {
  id: string; cityA: string; cityB: string;
  length: 1|2|3|4|5|6; color: RouteColor;
  parallelGroupId: string | null; variant: number;
};
type GameState = {
  code: string; schemaVersion: number; stateVersion: number;
  createdAt: number; updatedAt: number; lastMeaningfulActivityAt: number;
  phase: Phase; players: Player[]; currentPlayerId: string | null;
  initialTicketChoices: Record<string, string[]>;
  pendingTicketOfferByPlayer: Record<string, string[]>;
  trainDeck: CardKind[]; trainDiscard: CardKind[]; faceUp: CardKind[];
  destinationDeck: string[];
  ownedRoutes: Record<string, string>; // routeId -> playerId
  turn: { action: 'AWAITING_ACTION'|'DRAWING_CARDS'|'SELECTING_TICKETS'; drawsTaken: number };
  finalRound: { triggerPlayerId: string; turnsOwedPlayerIds: string[] } | null;
  publicEvents: PublicGameEvent[];
};
```

Further normalize state if necessary. Keep future deck order, other players' hands, unselected destination tickets, pending ticket offers, and RNG state server-only. Preserve enough state to resume **mid-turn** without relying on WebSocket instances.

### 4.5 SQLite persistence

For simplicity, one room DO can maintain a versioned JSON snapshot (`game_state` single row), an append-only **sanitized** public event log (`game_events`), and action dedupe records (`processed_actions`). Use typed JSON parsing and explicit schema migration/version; store durable room creation and expiry metadata.

Handle each accepted command in one atomic SQLite transaction (`ctx.storage.transactionSync` for synchronous SQL if appropriate): validate against current state and active player connection, compute next state, persist snapshot/version, save idempotency response/event, commit, **then** broadcast personalized views. Never broadcast an uncommitted move. Deduplicate by `(playerId, actionId)` and return the same acknowledgement on retries. Check `expectedVersion` (except documented idempotent handshakes), reject stale requests with fresh snapshot. Do not call external services or await network operations inside the transaction.

When the Durable Object wakes from hibernation, reconstruct live connections using `ctx.getWebSockets()` + serialized per-socket metadata; retrieve state from SQLite and reconstruct per-player views. All new sockets must be mapped to the authoritative nickname/player ID before receiving private data.

### 4.6 Public/private view projections

**Public room view:** room code, phase, seats/nicknames/colors/presence, score markers, trains remaining, number of cards/tickets per opponent, current turn/partial-action progress, 5 face-up cards, deck count if desired, all claimed routes, sanitized event log, available actions for *this* viewer (no card values of opponents).

**Private seat view:** only this seat's exact train hand, held tickets, private selection offer and visible completion indicators, suggested payment options, pending card picks; server may compute legal route payment hints. The client must **never** receive raw `GameState`, deck/discard order, any other hands, or other pending ticket offers. Public log may say `Player drew two cards`, not the values of blind draws. Face-up market picks are observable and can be logged as public facts if desired.

## 5. Network protocol and endpoints

Use WebSocket for synchronized game state and gameplay actions. HTTP is fine for `POST /api/trains/rooms` creation and `GET /api/trains/rooms/:code` existence/status metadata; deep-link SPA route should load independently. A room WebSocket endpoint can be `GET /api/trains/rooms/:code/ws` with Upgrade.

### 5.1 Envelope

```ts
// Client -> server (validated schema)
type ClientMessage =
 | { type: 'JOIN'; nickname: string }
 | { type: 'ACTION'; actionId: string; expectedVersion: number; action: GameAction }
 | { type: 'RESYNC' };

// Server -> client
// JOINED / SNAPSHOT contains this player's public + private projections only.
type ServerMessage =
 | { type: 'JOINED'; playerId: string; stateVersion: number; public: PublicView; private: PrivateView }
 | { type: 'SNAPSHOT'; stateVersion: number; public: PublicView; private: PrivateView }
 | { type: 'ACK'; actionId: string; stateVersion: number }
 | { type: 'ERROR'; actionId?: string; code: string; message: string; stateVersion?: number }
 | { type: 'SEAT_TAKEN_OVER'; message: string };
```

Representative `GameAction` discriminants:

```text
SELECT_COLOR, LEAVE_LOBBY, REMOVE_LOBBY_PLAYER, START_GAME,
KEEP_INITIAL_TICKETS, DRAW_TRAIN_CARD(index | 'blind'),
CLAIM_ROUTE(routeId, paymentByColor), DRAW_DESTINATION_TICKETS,
KEEP_DESTINATION_TICKETS(ticketIds)
```

Select a single clear protocol, document every action payload, and test it end-to-end. Do not rely on client-sent `playerId` for authorization; bind commands to the currently active socket's attached seat identity. `START_GAME` and lobby removals require current host identity.

**Do not add an arbitrary END_TURN command** that lets players dodge mandatory actions. Route claiming auto-ends turn after commit; second train draw auto-ends turn (or first face-up wild); ticket draw ends only upon selection/confirmation. If cards run out mid-draw, resolve action consistently and advance with explicit tested logic.

### 5.2 Idempotency / race safety

- Two clients submit CLAIM for same route simultaneously: only one wins; reject the other.
- Duplicate `ACTION` after lost ACK does not spend cards or advance twice.
- Malformed JSON, unexpected actions, out-of-turn actions, bad indexes, forged payment counts, mismatched ticket IDs, stale versions, excessive message size are rejected without mutation.
- New nickname takeover closes/revokes old socket **before** old socket can mutate state again.
- Do not trust client-side availability hints or client clocks.
- Rate limit room creation, nickname guessing/takeovers, and WebSocket handshakes at a reasonable personal-site threshold. Validate request origin / secure WebSockets, check room-code syntax, don't log private card data or full serialized state in production logs.

## 6. Board data, graph and deterministic correctness

**Appendix A** gives 36 normalized city anchors, **Appendix B** gives **100 actual individual route segments** (not 100 distinct city pairs; multiple tracks are separate), **Appendix C** gives all **30 original destination tickets**. This data is cross-checked against two independent community resources; it is here precisely so Codex does **not** invent routes. No 1910 expansion data.

- Parse Appendix B into stable `Route` objects using the provided IDs. A repeated city pair indicates two separate physical tracks and must be a `parallelGroupId`. Do **not** collapse duplicated gray rows into one edge or use unordered city-pair as a unique route key.
- Run validation at build/test time: exactly 36 unique city IDs; 100 distinct route IDs; 30 distinct ticket IDs; 110-card train deck; 30-card ticket deck; endpoints valid; every route has length 1–6 and correct color; no city-pair has >2 tracks; routes use no locomotive/rainbow color (those are **cards**, not printed routes). Check that every destination pair is graph-connected.
- Normalize names `Montreal` (render as **Montréal** if desired) and `Saint Louis` (render as **St. Louis**), `Sault St. Marie`. Use stable machine-readable IDs (slugs) independent of display accents; avoid duplicate city IDs.
- Appendix A coordinates are approximate anchors for establishing topology, not copyrighted board art. Convert to coordinates in a **top-down map** using `(x, 1-y)` if necessary. Keep route geometry separate from logic; controlled curves, offset track lanes and collision avoidance for parallel lines; small route labels or tooltip if crowded.
- Board routes and destination connectivity are a **multigraph**. Destination completion uses only owned edges via BFS/DFS; it may repeat cities, doesn't require a single unbranched path. Scoring uses exact edge-simple longest trail.
- If source data conflicts with actual manual/board, correct the row with clear verification and add a test; do not silently replace the original 30 ticket set or add expansion features.

## 7. Visual and UX design: vintage, legible, tactile

### 7.1 Art direction

- A bespoke vintage **early-1900s North America railway-tabletop** aesthetic: warm parchment map, subdued geographical contours, walnut/mahogany rim, understated paper grain, soft vignette, elegant but very readable type, directional warm light, shadows for miniature trains.
- **Do not use existing publisher board/map scans or card illustrations** as shipped assets. Render original, procedural maps/lines/city markers/trains; use licensed assets only if license explicitly permits. Keep the commercial game's published imagery/logo out of the release unless permission exists. Internal code may use `ticket-to-ride` for feature naming; public title can be a configurable fan-project name. Never imply endorsement by publisher.
- **Contrast beats vintage fidelity.** Track color saturation/edges should be stronger than geographic texture. Claimed routes have a clearly recognizable row of 3D player-color trains **on every train space**; subtle dark outline/light edge makes even black pieces readable. Selected and hovered routes get strong highlight distinct from ownership.
- Original 8 train car hues strongly differentiated; pink is **pink** (not simply dark purple). Rainbow locomotive shows unmistakable multicolor locomotive and a `WILD` label. UI always shows numeric counts and card-type name; don't rely on color alone. Test legibility at default full-board scale and color-vision deficiencies.
- Suggested initial palette (approximate artistic choices, **not claims of exact physical card printing**): pink `#C75A9D`, white `#F3F1E9`, blue `#286FC3`, yellow `#E4B633`, orange `#E57B30`, black `#26272B`, red `#C94642`, green `#2D915A`, gray `#A7A9A5`; adjust to achieve contrast. Piece colors remain the five separate original ownership colors.

### 7.2 Layout

**Desktop:** dominant Three.js board area (~75–80% of main width), collapsible right player scoreboard (score, piece color, trains left, presence, current player), bottom expandable hand/market/tickets tray; slim header with room code, share link, current turn, settings. Modals/drawers are HTML, not 3D objects.

**Mobile:** WebGL board still pans/zooms, cards and player panel move into accessible bottom sheets. Touch targets >=44 CSS px, safe areas, no hover-only information. Orthographic or gently tilted camera by default; smooth wheel/pinch zoom, drag pan, optional limited tilt, reset-to-fit, no accidental page scrolling while dragging board. Preserve camera position locally across reconnect; never make camera part of server state.

### 7.3 Core interactions

**Lobby:** Create room -> nickname -> link/code -> friends join & choose piece colors -> host starts. Clear '2–5 players' and readiness/selected-color indicators; show copy invite link. Friendly invalid/full/expired room errors.

**Initial tickets:** Show three private tickets as distinct cards (city A, city B, points), checkboxes with minimum-two enforcement, confirm selection; returned ticket(s) go to bottom of deck. Waiting players see progress without card identities.

**Your turn:** Main actions always accessible: choose a route, open train-card market, draw destination tickets. Show exactly which action is partially in progress and what remains. Card tray groups train cards by the eight original colors plus locomotives, with stable ordering and counts; optional expand to detailed visuals.

**Claim route:** Hover/click highlighted route -> show two endpoints, route color (or gray), number of train spaces, point award, current ownership/restrictions, your remaining pieces, **all valid payment options**. Suggest spending *non-wilds first* and select a gray-route regular color based on hand; enable deliberate override to spend some locomotives. Stage a ghost preview of train pieces; **Confirm** only after a server-validatable selection. Server commits; every client then animates pieces appearing slot-by-slot, score and trains remaining update. Animation is purely presentation and skippable; state already committed.

**Train market:** Always visible/expandable: five face-up cards and a face-down deck. Click a face-up slot or blind draw. Show first/second draw status; selected market slot replaces immediately; a face-up locomotive as first draw consumes whole action; a face-up wild is disabled for second pick with explanation; blind-drawn wild doesn't block second draw. If face-up 3-wild refresh triggers, show clear (quick) refresh animation from server event; don't obscure newer state with slow animation.

**Destinations:** Private ticket drawer shows kept tickets and completion status computed from *own* routes; click 'Show on map' to highlight endpoint cities/owned connections, without revealing an optimal future path to other players. Ticket draw shows up to 3 new offers, keep at least one, confirmation. On game completion reveal all ticket outcomes and points.

**Between turns:** Players can inspect board/market, open private hand/tickets, read sanitized game event log, pan/zoom, change settings. All mutation controls disabled for non-active players with explanation. When active player disconnects, show a nonblocking 'Waiting for X to reconnect' status.

**Finish:** Endgame indicator and whose final turns remain, then final results breakdown for each player: route points, each destination (+/-), completed destination count, longest-path length/bonus, total, tie-breakers/winner(s), rematch via **new** room (not resetting existing room).

### 7.4 UI quality

- Clear loading / reconnecting / expired / invalid action / room full / seat takeover states.
- Accessible labels, focus traps in dialogs, keyboard accessible actions, numeric counts and route names in tooltips, 4.5:1 text contrast where applicable; avoid using color as the only signal.
- Show last 50 public moves with server timestamps, optionally load older events; never reveal private blind draws/ticket offers.
- No gameplay-blocking animation. Honor reduced-motion OS preference. Avoid using expensive WebGL scene re-creation for each socket update; memoize/static geometry and use instancing where useful. Dispose of materials/geometries properly on unmount. Canvas fallback for no-WebGL devices is understandable and navigable; offer a textual route list so the game remains usable.

## 8. Exact implementation strategy: finish in one run

**Milestone 0 — inspect/plan locally (do not stop here).** Identify frontend router, Cloudflare delivery model, package manager, testing tools. Decide directory locations and Worker deployment route. No unrequested site rewrite.

**Milestone 1 — shared core + data.** Parse Appendices A–C into typed source modules. Validate data invariants; implement 110-card deck and 30-ticket deck, shuffle injection, turn phases, route claiming, points, destination connectivity, longest route, final round, tie breakers. Add rule tests **before** UI integration.

**Milestone 2 — session backend.** Durable Object with persistent state, create/join/takeover, colors, host, start, initial tickets, rule-engine commands, action deduplication, per-seat views, alarms, WebSocket hibernation, event log. Smoke-test locally with two WebSocket clients.

**Milestone 3 — 2D React game UI.** End-to-end screens: landing, lobby, ticket selection, card hand, market, route selection dialog, game status, completed results. Ensure a complete game can be played with temporarily simple map interactions even before 3D is polished.

**Milestone 4 — Three.js board.** Create original procedural parchment board with normalized city positions, 100 clickable route tracks and city labels, all parallel slots visible, placed 3D miniature trains, zoom/pan/camera reset, selected route previews, strong hover/ownership states, short animations, responsive fallback. Wire to existing state selectors; do not duplicate game rules in render components.

**Milestone 5 — complete integration + resilience.** Multiplayer event synchronization, mid-draw reconnect, rejoin on different browser, two tabs same nickname, full final score flow, responsive UI. Fix race conditions and post-hibernation restoration.

**Milestone 6 — tests/polish/deploy readiness.** Run linters/type checks/tests/build, start local frontend and Worker together, execute 2/3/5-player scenarios, inspect console/network errors, run e2e locally; provide deployment steps / migration details. Do not deploy production without explicit permission.

### 8.1 Required automated test matrix

1. Data counts: 36 cities, 100 route edges, 30 tickets, 110 cards (8x12 + 14), 45 trains/player.
2. Start: each gets four train cards, three initial tickets; keep 2 or 3; returns at deck bottom; initial selections hidden.
3. First player random but deterministic with injected RNG in tests; fixed clockwise lobby seat order.
4. A blue length-3 route costs 3 blue and awards 4; other regular colors rejected, wild substitutions accepted.
5. Gray route can be claimed with any one chosen color + wilds, all wilds, but not mixed regular colors.
6. Exactly 1 route claimed per turn, cannot buy occupied route, cannot buy with insufficient trains/cards.
7. 2-player and 3-player parallel rule blocks both track positions after claim; 4–5 players may claim opposite tracks with different owners only.
8. Train draws: face-up locomotive first ends immediately; second face-up locomotive rejected; blind wild first allows second; market replacements; 3 visible wilds refresh; reshuffle discard; shortage handling without duplication or infinite loops.
9. Destination draws (up to 3), keep at least one, return unkept to bottom; exhausted deck correct; no leaks.
10. Scores: lengths 1..6 -> 1/2/4/7/10/15; routes do not have to connect.
11. Ticket connectivity only through own trains; ticket points positive/negative at finish and hidden beforehand.
12. Exact longest **weighted edge-simple trail** with cycle, revisited vertex, parallel segments, branches and ties; all tied players +10.
13. Final-turn trigger at <=2 pieces, after completed trigger turn; trigger player gets another turn after others; finish only after every player has one more turn; scoring tie breakers.
14. Rejoin on same and different browser by nickname, mid-initial ticket choice, mid-draw, mid-ticket draw, during final round; state unchanged.
15. Same nickname takeover makes old socket powerless immediately; public takeover/presence messages accurate; late socket close cannot disconnect new socket.
16. Duplicate action ID and stale state version handling; concurrent claims; out-of-turn attempts; invalid payments; malformed inputs; oversized messages.
17. Public logs/snapshots do not contain other players' hands, destination ticket IDs/offer values, or deck order; blind draw payload not leaked.
18. Persistence after DO instance recreation/hibernation; alarm expiry; deep-link SPA refresh; 404/410 expired rooms.
19. 3D all 100 routes selectable; 2+ parallel tracks do not overlap; each claimed route shows `length` distinct player-color 3D trains; colors discernible at normal zoom; no broken WebGL interactions.
20. 2-browser Playwright smoke test, at least one complete deterministic game from start to winner, stable retry/reconnect behavior, no unhandled client/server errors.

### 8.2 Deliverables and final response

After finishing, report:

- What was actually implemented, including the playable route, lobby and backend entrypoints.
- Files/directories added or changed and reason for structural decisions.
- Cloudflare bindings/migrations and exact safe development/deployment commands for this repository.
- Tests run, counts passed, typecheck/lint/build status; distinguish passing from not run.
- Any remaining blockers or imperfect features with severity and reproduction steps; no false 'fully complete' claims.
- Asset/license provenance for any third-party materials.

**Non-negotiable:** full classic USA game flow, correct original cards, no hidden-data leak other than deliberate nickname impersonation risk, playable 3D board, and reliable nickname rejoin. If an external dependency is unavailable, finish all local implementation possible and explicitly identify the blocker rather than abandoning the feature or fabricating success.

---

## Appendix A — 36 source city anchors (x,y normalized)

Values approximate the physical board's relative city positions and are **layout seeds only**. y increases **northward**. For CSS/top-down screen use `screenY = 1 - y`. Refine labels and route curves for readability. These coordinate facts come from a public community analysis dataset; **do not copy its board background artwork**.

```csv
city,x,y
Atlanta,0.781,0.367
Boston,0.945,0.794
Calgary,0.235,0.871
Charleston,0.872,0.356
Chicago,0.684,0.596
Dallas,0.555,0.221
Denver,0.390,0.451
Duluth,0.564,0.686
El Paso,0.378,0.185
Helena,0.333,0.677
Houston,0.595,0.163
Kansas City,0.555,0.477
Las Vegas,0.208,0.335
Little Rock,0.623,0.344
Los Angeles,0.145,0.250
Miami,0.904,0.125
Montreal,0.875,0.878
Nashville,0.731,0.419
New Orleans,0.686,0.180
New York,0.894,0.684
Oklahoma City,0.535,0.350
Omaha,0.535,0.551
Phoenix,0.262,0.240
Pittsburgh,0.812,0.618
Portland,0.082,0.691
Raleigh,0.845,0.452
Saint Louis,0.638,0.475
Salt Lake City,0.263,0.497
San Francisco,0.068,0.402
Santa Fe,0.383,0.318
Sault St. Marie,0.688,0.783
Seattle,0.104,0.767
Toronto,0.795,0.752
Vancouver,0.108,0.846
Washington,0.902,0.551
Winnipeg,0.453,0.855
```

## Appendix B — 100 individual USA route tracks

Each row is one claimable track, with a unique route ID. `pink` here corresponds to the `P`/`purple` nomenclature sometimes used in data references; `gray` is a neutral **route**, never a train-car currency color. Parallel tracks share city endpoints but have distinct IDs and must render as separate selectable rows/paths.

```csv
routeId,cityA,cityB,length,color
calgary__vancouver__1,Vancouver,Calgary,3,gray
seattle__vancouver__1,Vancouver,Seattle,1,gray
seattle__vancouver__2,Vancouver,Seattle,1,gray
calgary__seattle__1,Seattle,Calgary,4,gray
helena__seattle__1,Seattle,Helena,6,yellow
portland__seattle__1,Seattle,Portland,1,gray
portland__seattle__2,Seattle,Portland,1,gray
portland__salt-lake-city__1,Portland,Salt Lake City,6,blue
portland__san-francisco__1,Portland,San Francisco,5,green
portland__san-francisco__2,Portland,San Francisco,5,pink
salt-lake-city__san-francisco__1,San Francisco,Salt Lake City,5,orange
salt-lake-city__san-francisco__2,San Francisco,Salt Lake City,5,white
los-angeles__san-francisco__1,San Francisco,Los Angeles,3,yellow
los-angeles__san-francisco__2,San Francisco,Los Angeles,3,pink
las-vegas__los-angeles__1,Los Angeles,Las Vegas,2,gray
los-angeles__phoenix__1,Los Angeles,Phoenix,3,gray
el-paso__los-angeles__1,Los Angeles,El Paso,6,black
calgary__winnipeg__1,Calgary,Winnipeg,6,white
calgary__helena__1,Calgary,Helena,4,gray
helena__winnipeg__1,Helena,Winnipeg,4,blue
helena__salt-lake-city__1,Helena,Salt Lake City,3,pink
denver__helena__1,Helena,Denver,4,green
duluth__helena__1,Helena,Duluth,6,orange
helena__omaha__1,Helena,Omaha,5,red
denver__salt-lake-city__1,Salt Lake City,Denver,3,red
denver__salt-lake-city__2,Salt Lake City,Denver,3,yellow
las-vegas__salt-lake-city__1,Las Vegas,Salt Lake City,3,orange
denver__phoenix__1,Phoenix,Denver,5,white
phoenix__santa-fe__1,Phoenix,Santa Fe,3,gray
el-paso__phoenix__1,Phoenix,El Paso,3,gray
sault-st-marie__winnipeg__1,Winnipeg,Sault St. Marie,6,gray
duluth__winnipeg__1,Winnipeg,Duluth,4,black
duluth__sault-st-marie__1,Duluth,Sault St. Marie,3,gray
duluth__toronto__1,Duluth,Toronto,6,pink
chicago__duluth__1,Duluth,Chicago,3,red
duluth__omaha__1,Duluth,Omaha,2,gray
duluth__omaha__2,Duluth,Omaha,2,gray
chicago__omaha__1,Omaha,Chicago,4,blue
kansas-city__omaha__1,Omaha,Kansas City,1,gray
kansas-city__omaha__2,Omaha,Kansas City,1,gray
kansas-city__saint-louis__1,Kansas City,Saint Louis,2,blue
kansas-city__saint-louis__2,Kansas City,Saint Louis,2,pink
kansas-city__oklahoma-city__1,Kansas City,Oklahoma City,2,gray
kansas-city__oklahoma-city__2,Kansas City,Oklahoma City,2,gray
little-rock__oklahoma-city__1,Oklahoma City,Little Rock,2,gray
dallas__oklahoma-city__1,Oklahoma City,Dallas,2,gray
dallas__oklahoma-city__2,Oklahoma City,Dallas,2,gray
dallas__little-rock__1,Dallas,Little Rock,2,gray
dallas__houston__1,Dallas,Houston,1,gray
dallas__houston__2,Dallas,Houston,1,gray
houston__new-orleans__1,Houston,New Orleans,2,gray
el-paso__houston__1,El Paso,Houston,6,green
dallas__el-paso__1,El Paso,Dallas,4,red
el-paso__oklahoma-city__1,El Paso,Oklahoma City,5,yellow
el-paso__santa-fe__1,El Paso,Santa Fe,2,gray
oklahoma-city__santa-fe__1,Santa Fe,Oklahoma City,3,blue
denver__oklahoma-city__1,Oklahoma City,Denver,4,red
denver__santa-fe__1,Santa Fe,Denver,2,gray
denver__kansas-city__1,Denver,Kansas City,4,black
denver__kansas-city__2,Denver,Kansas City,4,orange
denver__omaha__1,Denver,Omaha,4,pink
miami__new-orleans__1,New Orleans,Miami,6,red
atlanta__new-orleans__1,New Orleans,Atlanta,4,orange
atlanta__new-orleans__2,New Orleans,Atlanta,4,yellow
little-rock__new-orleans__1,New Orleans,Little Rock,3,green
little-rock__nashville__1,Little Rock,Nashville,3,white
little-rock__saint-louis__1,Little Rock,Saint Louis,2,gray
nashville__saint-louis__1,Saint Louis,Nashville,2,gray
pittsburgh__saint-louis__1,Saint Louis,Pittsburgh,5,green
chicago__saint-louis__1,Saint Louis,Chicago,2,green
chicago__saint-louis__2,Saint Louis,Chicago,2,white
chicago__pittsburgh__1,Chicago,Pittsburgh,3,black
chicago__pittsburgh__2,Chicago,Pittsburgh,3,orange
chicago__toronto__1,Chicago,Toronto,4,white
montreal__sault-st-marie__1,Sault St. Marie,Montreal,5,black
montreal__toronto__1,Toronto,Montreal,3,gray
sault-st-marie__toronto__1,Sault St. Marie,Toronto,2,gray
pittsburgh__toronto__1,Toronto,Pittsburgh,2,gray
new-york__pittsburgh__1,Pittsburgh,New York,2,white
new-york__pittsburgh__2,Pittsburgh,New York,2,green
pittsburgh__washington__1,Pittsburgh,Washington,2,gray
pittsburgh__raleigh__1,Pittsburgh,Raleigh,2,gray
nashville__raleigh__1,Nashville,Raleigh,3,black
atlanta__nashville__1,Nashville,Atlanta,1,gray
nashville__pittsburgh__1,Nashville,Pittsburgh,4,yellow
atlanta__miami__1,Atlanta,Miami,5,blue
atlanta__charleston__1,Atlanta,Charleston,2,gray
atlanta__raleigh__1,Atlanta,Raleigh,2,gray
atlanta__raleigh__2,Atlanta,Raleigh,2,gray
charleston__miami__1,Charleston,Miami,4,pink
charleston__raleigh__1,Raleigh,Charleston,2,gray
raleigh__washington__1,Raleigh,Washington,2,gray
raleigh__washington__2,Raleigh,Washington,2,gray
new-york__washington__1,Washington,New York,2,orange
new-york__washington__2,Washington,New York,2,black
boston__new-york__1,New York,Boston,2,yellow
boston__new-york__2,New York,Boston,2,red
montreal__new-york__1,New York,Montreal,3,blue
boston__montreal__1,Boston,Montreal,2,gray
boston__montreal__2,Boston,Montreal,2,gray
```

## Appendix C — Original 30 destination tickets

The identifier is generated from the ordered endpoint slugs. At setup, shuffle all 30, deal three to each player, then retain at least two. Later draws are up to three, retain at least one. Ticket values in this appendix correspond to the original game, **not** the 1910 expansion.

```csv
cityA,cityB,points
Los Angeles,New York,21
Duluth,Houston,8
Sault St. Marie,Nashville,8
New York,Atlanta,6
Portland,Nashville,17
Vancouver,Montreal,20
Duluth,El Paso,10
Toronto,Miami,10
Portland,Phoenix,11
Dallas,New York,11
Calgary,Salt Lake City,7
Calgary,Phoenix,13
Los Angeles,Miami,20
Winnipeg,Little Rock,11
San Francisco,Atlanta,17
Kansas City,Houston,5
Los Angeles,Chicago,16
Denver,Pittsburgh,11
Chicago,Santa Fe,9
Vancouver,Santa Fe,13
Boston,Miami,12
Chicago,New Orleans,7
Montreal,Atlanta,9
Seattle,New York,22
Denver,El Paso,4
Helena,Los Angeles,8
Winnipeg,Houston,12
Montreal,New Orleans,13
Sault St. Marie,Oklahoma City,9
Seattle,Los Angeles,9
```

## Appendix D — Source provenance and conflict resolution

**User-supplied manual, primary rules authority:** `74 Ticket to Ride Instructions.pdf`, English USA rules reprint (4 pages), provided in this ChatGPT conversation. Page 2: components/setup/initial ticket selection. Page 3: turn actions, wild locomotives, train deck recycling, gray and double routes. Page 4: route scoring, destination draws, final round, longest route and tie-breakers.

**Route city pairs, lengths, colors, and normalized locations (cross-check):**
- Rob217, *TicketToRideAnalysis*, USA `routes.csv`: https://raw.githubusercontent.com/Rob217/TicketToRideAnalysis/master/data/USA/routes.csv
- Rob217, city location anchors: https://raw.githubusercontent.com/Rob217/TicketToRideAnalysis/master/data/USA/city_locations.json
- Independent topology cross-check: https://raw.githubusercontent.com/rkdarst/board-game-networks/master/data/ticket-to-ride/united-states.yaml

**All 30 tickets and values (cross-check):**
- Rob217, `tickets.csv`: https://raw.githubusercontent.com/Rob217/TicketToRideAnalysis/master/data/USA/tickets.csv
- Alternative published inventory: https://boardgames.stackexchange.com/questions/8637/where-can-i-find-an-exhaustive-inventory-of-cards-in-ticket-to-ride/8639
- Alternative original ticket list: https://www.supercheats.com/ticket-to-ride/wiki/north-america-map-master-routes-list

**Cloudflare technical implementation references (checked November 2026; use repository's compatible versions):**
- WebSocket Hibernation: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Hibernation example: https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
- SQLite storage / `transactionSync`: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- DO lifecycle/alarms: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workers static assets/SPA integration: https://developers.cloudflare.com/workers/static-assets/

**Artwork and branding:** Above references provide gameplay/topology facts, not authorization to ship publisher logos, card/board images, illustrations or trademarked presentation. Use original procedurally rendered imagery or assets with independently checked licensing. Where in doubt, name the public-facing project generically, e.g. `Railway Tabletop`, while keeping feature code under `trains`.

**Provenance distinction:** The exact gameplay rules above are paraphrased from the user-supplied manual. The 100-route/36-city/30-ticket datasets are *not enumerated by that manual*; they come from independent open-source/community datasets and should be validated by the implemented tests. Coordinates and palette are approximate presentation aids. Session behavior, 90-day retention, random starting player, no undo, guided interactions and action protocol are user-approved or recommended **digital product adaptations**, not original printed rules.
