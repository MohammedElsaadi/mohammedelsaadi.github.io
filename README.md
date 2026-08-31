# mohammedelsaadi.com

React + TypeScript + Vite portfolio site, including the Board Game Menu planner at `/games/board-game-menu`.

## Board Game Menu

The feature is split into small modules under `src/features/board-game-menu`:

- `packing/`: deterministic, UI-independent 3D cuboid packing with axis-aligned rotations and a two-game overflow limit;
- `filters/`: pure course, vibe, time, player-count, and tote matching;
- `components/`: accessible 3D picker cards, responsive picker layout, and the persistent crate/tote scene;
- `api/`: typed browser API client and fictional development-only preview data;
- `state/`: versioned local draft and edit-token storage;
- `worker/index.ts`: Cloudflare Worker entrypoint and API router;
- `functions/api/board-game-menu`: reusable route handlers for the public catalog, saved menus, Admin, R2 media, and Twilio SMS notifications;
- `migrations/`: ordered D1 schema, seed records, and media-option migrations.

The production collection is never sourced from the development preview. Active games, real dimensions, covers, tags, container assignments, accessories, and saved menus come from D1/R2 and are managed through `/games/board-game-menu/admin`.

## Development

Install and run the existing fast frontend workflow:

```bash
npm install
npm run dev
```

When the API is not available in Vite-only development, the picker displays clearly labeled fictional data so the 3D/filter/packing UI remains testable. Saving and Admin require the full local stack.

Apply local D1 migrations, then run the Worker with local D1/R2 persistence:

```bash
npm run db:migrate:local
npm run dev:full
```

Wrangler/Miniflare automatically creates local-only D1 and R2 resources in the ignored `.wrangler/state` directory. No remote preview database or bucket is required. SMS is intentionally skipped locally when Twilio settings are absent; the menu save remains successful and the response reports `notificationSent: false`.

Quality gates:

```bash
npm run check
```

This runs lint, Vitest domain tests, the production Vite build, and the Worker/route-handler TypeScript check.

## Cloudflare setup

The project deploys through Cloudflare Workers Builds using `npm run build` followed by `npx wrangler deploy`. Static assets come from `./dist`; `/api/*` requests run through the Worker entrypoint. Secrets are configured on the deployed Worker and must never be committed.

### 1. D1

1. Create the `board-game-menu` D1 database.
2. Configure its real UUID in the `BOARD_GAME_DB` binding in `wrangler.jsonc`.
3. Apply the ordered files in `migrations/` with `npx wrangler d1 migrations apply BOARD_GAME_DB --remote`.
4. Open Admin and configure the Main Crate's measured internal width, height, and depth before publishing crate games.

### 2. R2

1. Create the `board-game-menu-media` R2 bucket.
2. Keep the `BOARD_GAME_MEDIA` binding in `wrangler.jsonc` pointed at that bucket.
3. Keep writes private. Game covers and tote artwork are served through the same-origin immutable Worker route.

### 3. Twilio SMS

Create a Twilio sender number and a Standard or Restricted API key. Configure these Worker variables/secrets in Cloudflare:

```text
TWILIO_ACCOUNT_SID
TWILIO_API_KEY_SID
TWILIO_API_KEY_SECRET
TWILIO_FROM_NUMBER
BOARD_GAME_NOTIFICATION_TO_PHONE
```

Store all five values as encrypted runtime Worker secrets. An existing assets-only Worker cannot accept runtime secrets: deploy the Worker entrypoint once, then add the secrets under the Worker's Settings > Variables and Secrets section. Phone numbers must use E.164 form, such as `+14165551234`. The non-sensitive `PUBLIC_SITE_ORIGIN` is committed in `wrangler.jsonc` as `https://mohammedelsaadi.com`. Do not prefix any value with `VITE_`; Vite-prefixed values are client-visible. Notification failure never rolls back the saved menu.

### 4. Cloudflare Access

Protect both route families so only the site owner can use Admin:

```text
/games/board-game-menu/admin*
/api/board-game-menu/admin/*
```

Apply the policy to the deployed hostname rather than hardcoding a hostname in source. The public picker and per-menu view remain separate from Admin. Public updates require the raw per-menu edit token held only by the browser that created the menu; D1 stores its SHA-256 hash.

### 5. Production hardening

Before advertising public menu creation broadly, add at least one of:

- Cloudflare Turnstile on create/update;
- Cloudflare rate limiting for `/api/board-game-menu/menus*`;
- Cloudflare Access restricted to the intended friend-facing users.

The notification recipient, sender, and message template are fixed server-side; public callers cannot provide SMS content or destinations.

## Deployment notes

Workers Builds runs:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
Version command: npx wrangler versions upload
```

`wrangler.jsonc` points Static Assets at `./dist` and invokes `worker/index.ts` first for `/api/*`. Local `wrangler dev` uses local emulations of the configured D1 and R2 bindings by default, so `preview_database_id` and `preview_bucket_name` are intentionally omitted.

Reference documentation:

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers local data](https://developers.cloudflare.com/workers/local-development/local-data/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource)
