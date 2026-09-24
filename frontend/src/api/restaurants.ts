import { apiFetch } from "@/src/api/client";
import { MenuItem, Reel, Restaurant } from "@/src/types";

export function fetchRestaurants(params?: { community?: boolean; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.community) qs.set("community", "true");
  if (params?.q) qs.set("q", params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Restaurant[]>(`/restaurants${suffix}`);
}

export function fetchRestaurant(id: string) {
  return apiFetch<Restaurant>(`/restaurants/${id}`);
}

export function fetchMenu(id: string) {
  return apiFetch<MenuItem[]>(`/restaurants/${id}/menu`);
}

export function fetchReels() {
  return apiFetch<Reel[]>("/reels");
}

export function fetchFavorites() {
  return apiFetch<Restaurant[]>("/favorites", {}, true);
}

export function fetchFavoriteIds() {
  return apiFetch<string[]>("/favorites/ids", {}, true);
}

export function toggleFavorite(restaurantId: string) {
  return apiFetch<{ favorited: boolean }>(
    "/favorites/toggle",
    { method: "POST", body: JSON.stringify({ restaurant_id: restaurantId }) },
    true,
  );
}
