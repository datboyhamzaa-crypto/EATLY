# EATLY — Product Requirements & Progress

## Original Problem Statement
Build EATLY, a production-ready food discovery + dine-in pre-order platform. Two experiences: Diner (mobile-first) and Merchant (desktop-first, later). Core diner flow: Discover → View restaurant → Explore menu → Customize → Add to cart → Dine-in info → Checkout → Payment → Order confirmation → QR verification → Order tracking → Complete → Review. Design source of truth = provided Eatly screenshots (orange brand, warm cream bg, white cards, dark navy text, rounded cards, soft borders, status badges green/yellow/red). Build systematically phase by phase, no fake functionality.

## User Choices
- Build Diner mobile app first (Merchant later).
- Auth: Email + password (custom JWT).
- Payment: Mock/simulated for now (structured to swap for real later).
- Language: Bahasa Indonesia. Currency: Rupiah.
- Phase 1 scope: Foundation + Auth + Discovery/list + full menu browse & customize + Cart.

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT auth (bcrypt + PyJWT). `/api` prefix. Models: User, Restaurant, MenuItem (with option groups), Reel, Favorite. Seed data on startup (6 restaurants, menus with options, 3 reels, demo user).
- Frontend: Expo Router (file-based), React Query for server data, custom AuthContext + CartContext + ToastContext. Theme tokens in src/theme.ts (light+dark). Plus Jakarta Sans via expo-font. Ionicons via @react-native-vector-icons. Bottom sheet via @gorhom/bottom-sheet. Cart persisted locally (single-restaurant scoped) — real orders move server-side in Phase 2.

## User Personas
- Diner (customer) browsing restaurants and pre-ordering for dine-in.
- (Later) Merchant managing restaurant + orders.

## Implemented (2026-06 / Phase 1) — DONE & tested
- Email/password auth: register, login (demo andi@eatly.com/password123), JWT, session bootstrap, logout. (16/16 backend tests pass)
- Beranda/Discovery: food reels ("Lagi Viral"), Pilihan Komunitas + Jelajahi Semua lists, live search, loading/empty/error states, pull-to-refresh.
- Restaurant Detail: full-bleed hero + overlapping info card, HALAL/Buka pills, rating, chips, info row (estimasi/jarak/kapasitas), sticky Menu/Ulasan/Info tabs, menu grouped by category.
- Menu item Customize bottom sheet: single (radio) + multi (checkbox) options with price deltas, required badges, kitchen notes, qty stepper, live total, add-to-cart. (web TextInput crash fixed via platform split)
- Floating orange cart bar + Cart screen: line items with option/notes summary, steppers, remove, subtotal.
- Favorites: toggle on detail, Favorit tab list, count reflected in profile.
- Profil: orange header, stats, dark referral card (copy + WhatsApp share), menu rows, logout.
- 4-tab bottom nav (Beranda, Pesanan, Favorit, Profil); Pesanan is an intentional empty state until Phase 2.

## Implemented (2026-08 / Phase 2) — DONE & verified (frontend arch + checkout flow)
- Clean data/service layer: src/services/checkout.ts (payment methods, table options, time slots, computeTotals, simulatePayment mock) + src/utils/orders.ts (status metadata + tracking timeline). Promo engine in src/utils/promos.ts.
- Checkout screen (app/checkout.tsx): dine-in table + time chips, promo code apply/remove, payment method radio list, live totals, validation (pay disabled until table+time+method), KeyboardAvoidingView, mock pay -> createOrder -> clear cart -> payment-success.
- Payment success (app/payment-success.tsx): QR (react-native-qrcode-svg), order code, dine-in info, total; buttons to track / home. Missing-order guard.
- Order detail + live tracking (app/order/[id].tsx): timeline paid->preparing->ready->completed (auto-advances via orders-context), QR verification card, dine-in info, items, payment summary, "Tandai Selesai" when ready. Invalid id guard.
- Pesanan tab wired to orders-context (Sedang Berjalan vs Riwayat), cards -> order detail.
- Cart checkout button wired to /checkout. Invalid routes -> app/+not-found.tsx.
- CustomizeSheet fix: add-to-cart button now uses @gorhom BottomSheetFooter (was off-screen on web).
- Orders persist locally (eatly_orders) and survive reload.

## Backlog / Remaining
### P0 (next phase)
- Move orders server-side (Order model + endpoints) to replace local persistence; real payment gateway swap-in for simulatePayment().
### P1
- Merchant/Restaurant dashboard (desktop-first).
- Real reviews list on Ulasan tab; ratings write-back.
### P2
- Push notifications (only on request; needs build), promos/loyalty, address/location picker.

## Next Tasks
1. Phase 2: Checkout → mock payment → order confirmation (QR) → tracking → Pesanan tab wiring.
2. Phase 3: Reviews + Ulasan tab.
3. Phase 4: Merchant dashboard.
