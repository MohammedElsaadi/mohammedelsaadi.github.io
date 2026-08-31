# mohammedelsaadi.com

React + TypeScript + Vite portfolio site, including the Board Game Menu planner at `/games/board-game-menu`.

## Board Game Menu

The feature is split into small modules under `src/features/board-game-menu`:

- `packing/`: deterministic, UI-independent 3D cuboid packing with axis-aligned rotations and a two-game overflow limit;
- `filters/`: pure course, vibe, time, player-count, and tote matching;
- `components/`: accessible 3D picker cards, responsive picker layout, and the persistent crate/tote scene;
- `api/`: typed browser API client and fictional development-only preview data;
- `state/`: versioned local draft and edit-token storage;
- `functions/api/board-game-menu`: Cloudflare Pages Functions for the public catalog, saved menus, Admin, R2 media, and notification email;
- `migrations/0001_board_game_menu.sql`: D1 schema plus initial container/tag records.

The production collection is never sourced from the development preview. Active games, real dimensions, covers, tags, container assignments, accessories, and saved menus come from D1/R2 and are managed through `/games/board-game-menu/admin`.

## Development

Install and run the existing fast frontend workflow:

```bash
npm install
npm run dev
```

When the API is not available in Vite-only development, the picker displays clearly labeled fictional data so the 3D/filter/packing UI remains testable. Saving and Admin require the full local stack.

Initialize local D1 once (the migration is idempotent), then run Pages Functions with local D1/R2 persistence:

```bash
npm run db:migrate:local
npm run dev:full
```

Wrangler stores local state in the ignored `.wrangler/state` directory. Email is intentionally skipped locally when server-side email settings are absent; the menu save remains successful and the response reports `notificationSent: false`.

Quality gates:

```bash
npm run check
```

This runs lint, Vitest domain tests, the production Vite build, and the Pages Functions TypeScript check.

## Cloudflare setup

The repository contains the code and binding names, but no account IDs, API tokens, email addresses, or other credentials. Configure the following in the Cloudflare dashboard for both Preview and Production where appropriate.

### 1. D1

1. Create a D1 database, for example `board-game-menu`.
2. Bind it to the Pages project as `BOARD_GAME_DB`.
3. Apply `migrations/0001_board_game_menu.sql` with the D1 dashboard or Wrangler using the real database binding/configuration.
4. Open Admin and configure the Main Crate's measured internal width, height, and depth before publishing crate games.

`wrangler.jsonc` contains the literal `REPLACE_WITH_D1_DATABASE_ID` placeholder. Replace it with the created database ID only if Wrangler configuration is the project's deployment source of truth; Git-based Pages deployments may instead use the dashboard binding. It is intentionally not a fabricated account resource ID.

### 2. R2

1. Create an R2 bucket, for example `board-game-menu-media`.
2. Bind it to the Pages project as `BOARD_GAME_MEDIA`.
3. Keep writes private. Covers are served through the same-origin immutable media Function.

### 3. Email Service

Onboard the Cloudflare-managed sender domain for Email Sending, create a narrowly scoped token with email-send permission, and configure these Pages Function secrets/variables:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_EMAIL_API_TOKEN
BOARD_GAME_NOTIFICATION_TO
BOARD_GAME_NOTIFICATION_FROM
PUBLIC_SITE_ORIGIN
```

Do not prefix any of these with `VITE_`; Vite-prefixed values are client-visible. Notifications use Cloudflare's REST API after the D1 write commits. Notification failure never rolls back the saved menu.

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

The notification recipient and sender are fixed server-side, and public callers cannot provide email content or destinations.

## Deployment notes

Pages Functions use file-based routes from the root `functions/` directory. The existing Vite build output remains `dist`, and current portfolio routes are unchanged. In Cloudflare Pages, use the normal production build command and output directory:

```text
Build command: npm run build
Output directory: dist
```

Reference documentation:

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/)
- [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Email Service REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/)
