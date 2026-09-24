# EATLY — PHASE 0: PROJECT BLUEPRINT & DESIGN SYSTEM

## 1. PROJECT STATUS (audit — no fabrication)
Not an empty project. The workspace already contains a **working Diner Phase-1 slice** built earlier this session. Per instructions this is treated as reference context, not a constraint.

Currently present & running:
- **Backend**: FastAPI (`backend/server.py`) + MongoDB (local `test_database`), JWT auth (bcrypt + PyJWT). Live collections: `restaurants` (6), `menu_items` (17), `reels` (3), `users` (3), `favorites` (1).
- **Frontend**: Expo Router app. Routes: `index` (auth redirect), `auth/login`, `auth/register`, `(tabs)` = Beranda/Pesanan/Favorit/Profil, `restaurant/[id]`, `cart`.
- **Working endpoints**: `/api/auth/register|login|me`, `/api/restaurants`, `/api/restaurants/{id}`, `/api/restaurants/{id}/menu`, `/api/reels`, `/api/favorites*`.
- **Tests**: `backend/tests/` pytest suite (16/16 pass).

NOT built yet (honestly): checkout, dine-in config, payment (mock or real), orders/tracking, QR, reviews write, community feed screen, search screen, notifications, merchant app, forgot-password.

## 2. TECHNOLOGY STACK
- **Language**: TypeScript (frontend), Python 3 (backend).
- **Mobile**: Expo SDK 57, React Native 0.86, Expo Router (file-based).
- **State/data**: @tanstack/react-query (server), React Context (auth/cart/toast), local persistence via `@/src/utils/storage`.
- **UI libs**: expo-image, expo-linear-gradient, @react-native-vector-icons/ionicons, @gorhom/bottom-sheet, react-native-reanimated, react-native-keyboard-controller, expo-font (Plus Jakarta Sans), expo-haptics, expo-clipboard.
- **Backend**: FastAPI, motor (async Mongo), pydantic v2, bcrypt, PyJWT.
- **DB**: MongoDB.
- **Package manager**: yarn (frontend, pinned), pip (backend).
- **Env**: `EXPO_PUBLIC_BACKEND_URL` (frontend) → `/api/*` proxied to backend :8001; `MONGO_URL`, `DB_NAME`, `JWT_SECRET` (backend). No secrets hardcoded.

## 3. PROJECT STRUCTURE (target)
```
backend/
  server.py            # app + routers (to be split per-domain as it grows)
  tests/
frontend/
  app/                 # routes only
    (tabs)/            # diner bottom-tab shell
    auth/              # login, register, (forgot)
    restaurant/[id]
    cart, checkout, payment, order/[id]  # (Phase 2+)
    merchant/          # (Phase 4, desktop-first)
  src/
    api/               # typed fetch modules per domain
    components/ + components/ui/   # reusable + primitives
    context/           # auth, cart, toast
    theme.ts, fonts.ts, navigation.ts, types.ts
    utils/
  assets/
memory/                # PRD.md, PHASE0_BLUEPRINT.md, test_credentials.md
```
As backend grows, split `server.py` → `routers/` (auth, restaurants, orders, payments, merchant), `models/`, `db.py`, `auth.py`.

## 4. PRODUCT ARCHITECTURE
Food discovery + dine-in pre-order. Two clients on one backend:
- **Diner** (mobile-first): discover → restaurant → menu → customize → cart → dine-in → checkout → payment → confirmation → QR → tracking → completion → review.
- **Merchant** (desktop-first): incoming orders → prep → ready; menu & availability management.
- **Admin**: considered architecturally (role field on user) but not implemented unless requested.
- Shared REST API under `/api`, JWT bearer auth, role claim distinguishes diner/merchant.

## 5. SCREEN INVENTORY (status: ✅ done · 🟡 partial · ⬜ planned)
**Diner**
- ⬜ Splash / ⬜ Onboarding (optional)
- ✅ Login · ✅ Register · ⬜ Forgot password
- ✅ Home/Beranda · 🟡 Search (inline on Beranda; ⬜ dedicated screen+results) · ⬜ Category listing
- ✅ Restaurant listing (in Beranda) · ✅ Restaurant detail · ✅ Restaurant menu (detail tab) · ✅ Food detail/customization (bottom sheet)
- ✅ Cart · ⬜ Dine-in configuration · ⬜ Checkout · ⬜ Payment selection · ⬜ Payment processing · ⬜ Payment success
- ⬜ Order confirmation · ⬜ QR/order verification · ⬜ Order tracking · 🟡 Order history (empty Pesanan tab) · ⬜ Order detail
- 🟡 Community (reels row exists; ⬜ full screen) · ⬜ Review · ✅ Favorites · ✅ Profile · ⬜ Edit profile · ⬜ Settings · ⬜ Notifications · ⬜ Help/support
**Merchant** (all ⬜, Phase 4): login, dashboard, orders, order detail, menu mgmt, item editor, restaurant info, table/dine-in mgmt, availability, revenue, reports, settings.

## 6. USER FLOWS (with failure states)
- **A. Discovery → cart** ✅ built. Failures: network (retry state), empty search, sold-out item (disabled "Habis"), unauth favorite (prompt login).
- **B. Cart → dine-in → checkout → payment → success** ⬜. Failures: empty cart, table unavailable, promo invalid/expired, payment declined/timeout, price/stock changed at checkout.
- **C. Success → QR → tracking → completed** ⬜. Failures: order not found, QR scan fail, status stuck, cancelled by merchant.
- **D. Completed → review** ⬜. Failures: duplicate review, order not eligible.
- **E. Merchant login → dashboard → order → prep → ready** ⬜. Failures: auth/role denied, realtime disconnect, concurrent status change.
- **F. Merchant → menu mgmt → toggle availability** ⬜. Failures: validation, image upload fail, optimistic rollback.

## 7. DESIGN SYSTEM (source of truth: Eatly screenshots; implemented in `src/theme.ts`)
**Color** — primary orange `#F97316`, secondary/tints `#FFF7ED`/`#FFEDD5` (text `#EA580C`/`#C2410C`), dark text `#1A1D26`, muted `#6B7280`, background (warm cream) `#F7F3EE`, surface (white) `#FFFFFF`, border `#EDE7DF`. Status as soft-tint pills: success bg `#D1FAE5`/txt `#065F46`, warning `#FEF3C7`/`#92400E`, error `#FEE2E2`/`#991B1B`, info uses orange (no blue). Solid accents for dots/icons: green `#16A34A`, amber `#F59E0B`, red `#DC2626`, star `#F59E0B`. Full light + dark themes defined.
**Typography** — Plus Jakarta Sans: display/extrabold, heading/bold, body/regular+medium, label/semibold, caption/regular; scale 12/14/16/20/24.
**Spacing** — 4 · 8 · 12 · 16 · 24 · 32 · 48.
**Radius** — sm 6 · md 12 · lg 16 · card/xl 20 · pill 999.
**Elevation** — soft/minimal shadows only (shadow tier 1).

## 8. COMPONENT ARCHITECTURE (✅ exists · ⬜ to add)
- ✅ Button (variants+states), TextField, Pill/StatusPill/Chip, Stepper (quantity), Skeleton (loading), StateView (empty/error), Toast, CustomizeSheet (bottom sheet), RestaurantCard, MenuItemCard, ReelCard, FloatingCart.
- ⬜ SearchBar (extract), Radio/Checkbox (extract from sheet), FilterChips row, Modal/Alert (confirm), Tabs (extract), PriceSummary, OrderStatusTracker/Timeline, QRDisplay, RatingInput, SegmentedControl, Avatar, ListRow, TopNav/header, MerchantTable/DataGrid (desktop).
Strategy: primitives in `components/ui/`, domain components in `components/`, all styled via `makeStyles`+theme tokens, every interactive element gets a `testID`.

## 9. DATA MODEL BLUEPRINT (entities & relationships)
- **User** (id, email, name, username, role[diner|merchant], password_hash, avatar_url, referral_code, invited_friends) → 1:1 Profile, 1:N Order/Favorite/Review.
- **Restaurant** (id, name, cuisine, price_level, halal, rating, review_count, status, availability, description, tags[], hero/avatar, estimate, distance, capacity, community_pick) — ✅ exists. → 1:N Branch(future), Table, MenuCategory, MenuItem, Review.
- **RestaurantTable** (id, restaurant_id, label, seats, status) ⬜.
- **MenuCategory** (id, restaurant_id, name, order) — currently a string field on item; promote to entity when merchant editing lands.
- **MenuItem** (…, price, image, category, tags[], popular, available, options[]) ✅. **MenuOption group** {name, type single|multi, required, choices[{name, price_delta}]} ✅ (embedded). MenuAddon = multi option (covered).
- **Cart / CartItem** — client-side now (single-restaurant scoped); server Cart optional later. CartItem {menuItemId, unitPrice, qty, options[], notes}.
- **Order** (id, user_id, restaurant_id, table_id, type=dine-in, items[], subtotal, discount, total, promo_code, status[created|paid|preparing|ready|completed|cancelled], qr_token, created_at) ⬜ + **OrderItem** (embedded).
- **Payment** (id, order_id, method[qris|card|...], amount, status, provider_ref) ⬜ (mock first).
- **Promotion** (id, code, type, value, min, first_order_only, valid_until) ⬜.
- **Favorite** (user_id, restaurant_id) ✅.
- **Review** (id, user_id, restaurant_id, order_id, rating, text, created_at) ⬜.
- **Notification** (id, user_id, type, payload, read, created_at) ⬜.
Keep embedded docs for options/order items; separate collections for cross-referenced entities. Avoid premature Branch/Addon tables until needed.

## 10. DEVELOPMENT ROADMAP
- **P1** Mobile UI/UX foundation + functional diner screens — ✅ (auth, discovery, detail, menu, customize, cart, favorites, profile).
- **P2** Frontend architecture & navigation — ✅ core (router, contexts, react-query, theme). Extend with checkout/order routes.
- **P3** Diner functionality — dine-in config → checkout → **mock** payment → order confirmation + QR → tracking → Pesanan history → review. (next)
- **P4** Merchant app (desktop-first) — auth+role, dashboard, live orders, menu & availability mgmt.
- **P5** Backend/DB/auth hardening — split routers, role guards, Order/Payment/Review models, validation, image upload (object storage).
- **P6** Payment/order integration — swap mock for real (Stripe/Razorpay) when requested; order lifecycle + realtime.
- **P7** Testing/security/production readiness — e2e, authz tests, rate limiting.
- **P8** Final polish + deployment (Publish → build iOS/Android).

## 11. RISKS
- Scope is large (2 apps + payments); must stay strictly phase-gated to avoid half-features.
- Cart is client-only today — needs clear migration to server Order at checkout to avoid price/stock drift; validate totals server-side.
- Mock→real payment swap: isolate behind a payment service interface now so it's swappable.
- Merchant desktop-first vs Expo mobile-first: needs responsive/web layout strategy (likely a separate web-optimized route group), not shrunken mobile.
- @gorhom/bottom-sheet web quirks (already hit one crash) — keep platform splits.
- Image hosting: seed uses external URLs; user-uploaded images must use Object Storage integration.
- Realtime order tracking needs polling or websockets decision.

## 12. MISSING INFORMATION (need from you before later phases)
1. Payment: stay mock for now, or integrate real (Stripe / Razorpay) and when?
2. Merchant app: same Expo app (web layout) or separate surface? Which merchant features are MVP?
3. Dine-in specifics: table selection by number, QR-at-table, or time-slot reservation?
4. Promotions/referral: real promo engine now or later?
5. Notifications: needed? (native push requires a build; only on request.)
6. Search/community: dedicated screens priority?
7. Any real menu/restaurant content/branding assets, or continue with seeded demo data?

— END OF PHASE 0. Stopping here; not proceeding to Phase 1 automatically.
