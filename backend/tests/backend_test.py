"""Backend regression tests for EATLY Phase 1 (auth, restaurants, menu, reels, favorites)."""
import time
import requests
import pytest


# ---- Auth ----------------------------------------------------------------
class TestAuth:
    def test_login_demo_user(self, base_url, api_client):
        r = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "andi@eatly.com", "password": "password123"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str)
        u = data["user"]
        assert u["email"] == "andi@eatly.com"
        assert u["name"]
        assert "id" in u and "_id" not in u

    def test_login_wrong_password(self, base_url, api_client):
        r = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "andi@eatly.com", "password": "wrongpass"},
        )
        assert r.status_code == 401

    def test_register_new_user_and_me(self, base_url, api_client):
        email = f"test_user{int(time.time()*1000)}@eatly.example.com"
        r = api_client.post(
            f"{base_url}/api/auth/register",
            json={"name": "Test Diner", "email": email, "password": "secret123"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body
        u = body["user"]
        assert "id" in u and "_id" not in u
        assert u["email"] == email
        assert u["referral_code"].startswith("TEST")

        # GET me
        me = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {body['token']}"},
        )
        assert me.status_code == 200
        assert me.json()["id"] == u["id"]

    def test_register_short_password_rejected(self, base_url, api_client):
        r = api_client.post(
            f"{base_url}/api/auth/register",
            json={"name": "X", "email": f"short_{int(time.time())}@eatly.example.com", "password": "abc"},
        )
        assert r.status_code == 422

    def test_register_duplicate_email(self, base_url, api_client):
        r = api_client.post(
            f"{base_url}/api/auth/register",
            json={"name": "Dup", "email": "andi@eatly.com", "password": "password123"},
        )
        assert r.status_code == 409

    def test_me_no_token(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, base_url, api_client):
        r = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert r.status_code == 401


# ---- Restaurants / Menu / Reels -----------------------------------------
class TestRestaurants:
    def test_list_restaurants(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/restaurants")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 3
        for item in data:
            assert "id" in item and "_id" not in item
            assert item["name"]

    def test_list_community_filter(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/restaurants", params={"community": "true"})
        assert r.status_code == 200
        for item in r.json():
            assert item["community_pick"] is True

    def test_search_by_name_laksa(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/restaurants", params={"q": "laksa"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert any("laksa" in item["name"].lower() for item in data)

    def test_get_restaurant_detail_and_menu(self, base_url, api_client):
        lst = api_client.get(f"{base_url}/api/restaurants").json()
        rid = lst[0]["id"]
        detail = api_client.get(f"{base_url}/api/restaurants/{rid}")
        assert detail.status_code == 200
        assert detail.json()["id"] == rid

        menu = api_client.get(f"{base_url}/api/restaurants/{rid}/menu")
        assert menu.status_code == 200
        items = menu.json()
        assert isinstance(items, list) and len(items) >= 1
        for it in items:
            assert "id" in it and "_id" not in it
            assert "options" in it and isinstance(it["options"], list)

    def test_get_restaurant_invalid_id(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/restaurants/invalid-id-xyz")
        assert r.status_code == 404

    def test_get_restaurant_valid_objectid_not_found(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/restaurants/507f1f77bcf86cd799439011")
        assert r.status_code == 404


class TestReels:
    def test_list_reels(self, base_url, api_client):
        r = api_client.get(f"{base_url}/api/reels")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        for reel in data:
            assert "id" in reel and "_id" not in reel
            assert reel["restaurant_id"]


# ---- Favorites (auth required) ------------------------------------------
class TestFavorites:
    def test_toggle_requires_auth(self, base_url, api_client):
        r = api_client.post(
            f"{base_url}/api/favorites/toggle",
            json={"restaurant_id": "507f1f77bcf86cd799439011"},
        )
        assert r.status_code == 401

    def test_toggle_flow_and_counts(self, base_url, api_client, auth_headers):
        restos = api_client.get(f"{base_url}/api/restaurants").json()
        rid = restos[0]["id"]

        # baseline
        me0 = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers).json()
        ids0 = api_client.get(f"{base_url}/api/favorites/ids", headers=auth_headers).json()
        was_fav = rid in ids0

        # toggle once
        r1 = api_client.post(
            f"{base_url}/api/favorites/toggle",
            json={"restaurant_id": rid},
            headers=auth_headers,
        )
        assert r1.status_code == 200
        assert r1.json()["favorited"] == (not was_fav)

        ids1 = api_client.get(f"{base_url}/api/favorites/ids", headers=auth_headers).json()
        assert (rid in ids1) == (not was_fav)

        me1 = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers).json()
        expected_delta = 1 if not was_fav else -1
        assert me1["favorites_count"] == me0["favorites_count"] + expected_delta

        # /api/favorites returns full restaurant docs
        favs = api_client.get(f"{base_url}/api/favorites", headers=auth_headers).json()
        assert isinstance(favs, list)
        if not was_fav:
            assert any(f["id"] == rid for f in favs)

        # toggle back to original state
        r2 = api_client.post(
            f"{base_url}/api/favorites/toggle",
            json={"restaurant_id": rid},
            headers=auth_headers,
        )
        assert r2.status_code == 200
        assert r2.json()["favorited"] == was_fav
        me2 = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers).json()
        assert me2["favorites_count"] == me0["favorites_count"]
