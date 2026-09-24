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

## Backlog / Remaining
### P0 (next phase)
- Checkout / "Ringkasan & Bayar": dine-in table + time selection, promo code, payment method (QRIS mock), order totals.
- Mock Payment + Order creation (server-side Order model, statuses created→paid→preparing→ready→completed/cancelled).
- Order confirmation with QR + order ID; Order tracking; Pesanan tab shows real orders.
- Review restaurant after completed order (populates Ulasan tab).
### P1
- Merchant/Restaurant dashboard (desktop-first).
- Real reviews list on Ulasan tab; ratings write-back.
### P2
- Push notifications (only on request; needs build), promos/loyalty, address/location picker.

## Next Tasks
1. Phase 2: Checkout → mock payment → order confirmation (QR) → tracking → Pesanan tab wiring.
2. Phase 3: Reviews + Ulasan tab.
3. Phase 4: Merchant dashboard.
