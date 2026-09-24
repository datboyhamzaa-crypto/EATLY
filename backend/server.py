from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict
from typing import List, Optional, Annotated, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get('JWT_EXPIRE_MINUTES', '43200'))

app = FastAPI()
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Mongo helpers
# ---------------------------------------------------------------------------
def _validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


class BaseDocument(BaseModel):
    id: Optional[str] = None

    @classmethod
    def from_mongo(cls, doc: Optional[dict]):
        if not doc:
            return None
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data.pop("_id"))
        return cls(**data)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class OptionChoice(BaseModel):
    name: str
    price_delta: int = 0


class OptionGroup(BaseModel):
    name: str
    type: str = "single"  # "single" | "multi"
    required: bool = False
    choices: List[OptionChoice] = []


class MenuItem(BaseDocument):
    restaurant_id: str
    name: str
    description: str = ""
    price: int
    image: str = ""
    category: str = "Makanan Utama"
    tags: List[str] = []
    popular: bool = False
    available: bool = True
    options: List[OptionGroup] = []


class Restaurant(BaseDocument):
    name: str
    cuisine: str
    price_level: str = "Rp Rp"
    halal: bool = False
    rating: float = 0
    review_count: int = 0
    status: str = "buka"  # buka | tutup
    availability: str = "available"  # available | limited | full | closed
    description: str = ""
    tags: List[str] = []
    hero_image: str = ""
    avatar_image: str = ""
    estimate_min: int = 10
    estimate_max: int = 15
    distance_km: float = 1.0
    capacity_tables: int = 20
    community_rating: float = 0
    community_pick: bool = False
    address: str = ""
    open_hours: str = ""


class Reel(BaseDocument):
    restaurant_id: str
    restaurant_name: str
    user_name: str
    user_handle: str
    user_avatar: str = ""
    caption: str = ""
    thumb: str = ""
    duration: str = "0:30"
    views: int = 0
    rating: int = 5


class User(BaseDocument):
    email: str
    name: str
    username: str
    avatar_url: str = ""
    referral_code: str = ""
    total_orders: int = 0
    invited_friends: int = 0
    password_hash: str = ""
    created_at: str = ""


# ---------------------------------------------------------------------------
# Auth request/response
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class PublicUser(BaseModel):
    id: str
    email: str
    name: str
    username: str
    avatar_url: str
    referral_code: str
    total_orders: int
    favorites_count: int
    invited_friends: int


class AuthResponse(BaseModel):
    token: str
    user: PublicUser


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "iat": now, "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials or credentials.scheme.lower() != "bearer":
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id or not ObjectId.is_valid(user_id):
            raise unauthorized
    except jwt.PyJWTError:
        raise unauthorized
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise unauthorized
    return doc


async def build_public_user(doc: dict) -> PublicUser:
    fav_count = await db.favorites.count_documents({"user_id": str(doc["_id"])})
    return PublicUser(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc["name"],
        username=doc.get("username", ""),
        avatar_url=doc.get("avatar_url", ""),
        referral_code=doc.get("referral_code", ""),
        total_orders=doc.get("total_orders", 0),
        favorites_count=fav_count,
        invited_friends=doc.get("invited_friends", 0),
    )


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar")
    base_username = email.split("@")[0]
    username = base_username
    if await db.users.find_one({"username": username}):
        username = f"{base_username}{int(datetime.now().timestamp()) % 10000}"
    first = body.name.strip().split(" ")[0].upper() if body.name.strip() else "EATLY"
    referral = f"{first}{datetime.now().year}"
    doc = {
        "email": email,
        "name": body.name.strip(),
        "username": username,
        "avatar_url": "https://i.pravatar.cc/300?img=13",
        "referral_code": referral,
        "total_orders": 0,
        "invited_friends": 0,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return AuthResponse(token=create_token(str(result.inserted_id)), user=await build_public_user(doc))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginIn):
    email = body.email.lower()
    doc = await db.users.find_one({"email": email})
    if not doc or not verify_password(body.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah")
    return AuthResponse(token=create_token(str(doc["_id"])), user=await build_public_user(doc))


@api_router.get("/auth/me", response_model=PublicUser)
async def me(current: dict = Depends(get_current_user)):
    return await build_public_user(current)


# ---------------------------------------------------------------------------
# Restaurant routes
# ---------------------------------------------------------------------------
@api_router.get("/restaurants", response_model=List[Restaurant])
async def list_restaurants(community: Optional[bool] = None, q: Optional[str] = None):
    query: dict = {}
    if community is True:
        query["community_pick"] = True
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    docs = await db.restaurants.find(query).to_list(200)
    return [Restaurant.from_mongo(d) for d in docs]


@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    if not ObjectId.is_valid(restaurant_id):
        raise HTTPException(status_code=404, detail="Restoran tidak ditemukan")
    doc = await db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Restoran tidak ditemukan")
    return Restaurant.from_mongo(doc)


@api_router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_menu(restaurant_id: str):
    docs = await db.menu_items.find({"restaurant_id": restaurant_id}).to_list(500)
    return [MenuItem.from_mongo(d) for d in docs]


@api_router.get("/reels", response_model=List[Reel])
async def list_reels():
    docs = await db.reels.find().to_list(100)
    return [Reel.from_mongo(d) for d in docs]


# ---------------------------------------------------------------------------
# Favorites routes
# ---------------------------------------------------------------------------
class ToggleFavoriteIn(BaseModel):
    restaurant_id: str


@api_router.get("/favorites", response_model=List[Restaurant])
async def list_favorites(current: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": str(current["_id"])}).to_list(500)
    ids = [ObjectId(f["restaurant_id"]) for f in favs if ObjectId.is_valid(f["restaurant_id"])]
    if not ids:
        return []
    docs = await db.restaurants.find({"_id": {"$in": ids}}).to_list(500)
    return [Restaurant.from_mongo(d) for d in docs]


@api_router.get("/favorites/ids", response_model=List[str])
async def list_favorite_ids(current: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": str(current["_id"])}).to_list(500)
    return [f["restaurant_id"] for f in favs]


@api_router.post("/favorites/toggle")
async def toggle_favorite(body: ToggleFavoriteIn, current: dict = Depends(get_current_user)):
    uid = str(current["_id"])
    existing = await db.favorites.find_one({"user_id": uid, "restaurant_id": body.restaurant_id})
    if existing:
        await db.favorites.delete_one({"_id": existing["_id"]})
        return {"favorited": False}
    await db.favorites.insert_one({"user_id": uid, "restaurant_id": body.restaurant_id})
    return {"favorited": True}


@api_router.get("/")
async def root():
    return {"message": "Eatly API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
IMG = {
    "interior": "https://images.unsplash.com/photo-1613274554329-70f997f5789f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "nasi_goreng": "https://images.unsplash.com/photo-1647093953000-9065ed6f85ef?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
    "sate": "https://images.pexels.com/photos/37076559/pexels-photo-37076559.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "rendang": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1000&q=80",
    "sushi": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1000&q=80",
    "laksa": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80",
    "cendol": "https://images.unsplash.com/photo-1541696490-8744a5dc0228?auto=format&fit=crop&w=1000&q=80",
    "coffee": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80",
    "cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80",
    "ayam": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1000&q=80",
    "gado": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=80",
    "esteh": "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=1000&q=80",
    "resto2": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    "resto3": "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    "resto4": "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80",
    "resto5": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    "resto6": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
}


def _spice_group():
    return {
        "name": "Level Pedas",
        "type": "single",
        "required": True,
        "choices": [
            {"name": "Tidak Pedas", "price_delta": 0},
            {"name": "Sedang", "price_delta": 0},
            {"name": "Pedas", "price_delta": 0},
            {"name": "Extra Pedas", "price_delta": 3000},
        ],
    }


def _nasi_group():
    return {
        "name": "Pilihan Nasi",
        "type": "single",
        "required": True,
        "choices": [
            {"name": "Nasi Putih", "price_delta": 0},
            {"name": "Nasi terpisah", "price_delta": 0},
            {"name": "Tanpa Nasi", "price_delta": -5000},
        ],
    }


def _addon_group():
    return {
        "name": "Tambahan",
        "type": "multi",
        "required": False,
        "choices": [
            {"name": "Telur Balado", "price_delta": 8000},
            {"name": "Kerupuk", "price_delta": 5000},
            {"name": "Sambal Ijo", "price_delta": 3000},
        ],
    }


async def seed_data():
    if await db.restaurants.count_documents({}) > 0:
        return
    logger.info("Seeding Eatly data...")

    restaurants = [
        {
            "name": "Warung Sinar Bahagia", "cuisine": "Masakan Nusantara", "price_level": "Rp Rp",
            "halal": True, "rating": 4.8, "review_count": 1284, "status": "buka", "availability": "available",
            "description": "Rumah masakan nusantara sejak 1998. Bumbu diracik segar setiap pagi dari pasar tradisional Kemang.",
            "tags": ["Halal Bersertifikat", "Ramah Keluarga", "Punya Terrace"],
            "hero_image": IMG["interior"], "avatar_image": IMG["rendang"],
            "estimate_min": 10, "estimate_max": 15, "distance_km": 1.2, "capacity_tables": 24,
            "community_rating": 4.8, "community_pick": True,
        },
        {
            "name": "Kedai Laksa Betawi", "cuisine": "Masakan Betawi", "price_level": "Rp Rp",
            "halal": True, "rating": 4.9, "review_count": 876, "status": "buka", "availability": "limited",
            "description": "Laksa Betawi legendaris dengan kuah santan gurih dan rempah pilihan.",
            "tags": ["Halal", "Legendaris", "Cocok Rame-rame"],
            "hero_image": IMG["resto2"], "avatar_image": IMG["laksa"],
            "estimate_min": 6, "estimate_max": 10, "distance_km": 2.8, "capacity_tables": 16,
            "community_rating": 4.9, "community_pick": True,
        },
        {
            "name": "Toko Kue Nusantara", "cuisine": "Pencuci Mulut", "price_level": "Rp",
            "halal": True, "rating": 4.7, "review_count": 421, "status": "buka", "availability": "available",
            "description": "Aneka kue tradisional dan pencuci mulut khas Nusantara yang manis dan legit.",
            "tags": ["Manis", "Take Away", "Ramah Anak"],
            "hero_image": IMG["resto3"], "avatar_image": IMG["cake"],
            "estimate_min": 3, "estimate_max": 5, "distance_km": 1.1, "capacity_tables": 12,
            "community_rating": 4.7, "community_pick": True,
        },
        {
            "name": "Sushi Tei Kemang", "cuisine": "Masakan Jepang", "price_level": "Rp Rp Rp",
            "halal": False, "rating": 4.6, "review_count": 980, "status": "buka", "availability": "available",
            "description": "Sushi dan sashimi segar setiap hari, dengan chef berpengalaman langsung dari Jepang.",
            "tags": ["Fresh", "Fine Dining", "Reservasi"],
            "hero_image": IMG["resto4"], "avatar_image": IMG["sushi"],
            "estimate_min": 12, "estimate_max": 18, "distance_km": 3.4, "capacity_tables": 30,
            "community_rating": 4.6, "community_pick": False,
        },
        {
            "name": "Ayam Bakar Taliwang", "cuisine": "Masakan Lombok", "price_level": "Rp Rp",
            "halal": True, "rating": 4.5, "review_count": 640, "status": "buka", "availability": "limited",
            "description": "Ayam bakar Taliwang autentik dengan sambal khas Lombok yang pedas menggigit.",
            "tags": ["Halal", "Pedas", "Populer"],
            "hero_image": IMG["resto5"], "avatar_image": IMG["ayam"],
            "estimate_min": 15, "estimate_max": 20, "distance_km": 4.1, "capacity_tables": 18,
            "community_rating": 4.5, "community_pick": False,
        },
        {
            "name": "Kopi Senja", "cuisine": "Kafe", "price_level": "Rp Rp",
            "halal": True, "rating": 4.4, "review_count": 512, "status": "buka", "availability": "full",
            "description": "Kafe kopi specialty dengan suasana hangat, cocok untuk kerja dan nongkrong sore.",
            "tags": ["Kopi", "Wifi", "Cozy"],
            "hero_image": IMG["resto6"], "avatar_image": IMG["coffee"],
            "estimate_min": 8, "estimate_max": 12, "distance_km": 0.8, "capacity_tables": 20,
            "community_rating": 4.4, "community_pick": False,
        },
    ]

    inserted = {}
    for r in restaurants:
        r.setdefault("open_hours", "10.00 - 22.00 WIB")
        r.setdefault("address", "Jl. Kemang Raya No. 10, Jakarta Selatan")
        res = await db.restaurants.insert_one(r)
        inserted[r["name"]] = str(res.inserted_id)

    warung = inserted["Warung Sinar Bahagia"]
    laksa = inserted["Kedai Laksa Betawi"]
    kue = inserted["Toko Kue Nusantara"]
    sushi = inserted["Sushi Tei Kemang"]
    ayam = inserted["Ayam Bakar Taliwang"]
    kopi = inserted["Kopi Senja"]

    menu = [
        {"restaurant_id": warung, "name": "Rendang Sapi", "description": "Rendang khas Padang, empuk & kaya rempah.",
         "price": 68000, "image": IMG["rendang"], "category": "Paling Populer", "tags": ["Halal", "Populer"],
         "popular": True, "available": True, "options": [_spice_group(), _nasi_group(), _addon_group()]},
        {"restaurant_id": warung, "name": "Nasi Goreng Spesial", "description": "Nasi goreng dengan ayam, udang, & telur.",
         "price": 45000, "image": IMG["nasi_goreng"], "category": "Paling Populer", "tags": ["Populer"],
         "popular": True, "available": True, "options": [_spice_group(), _addon_group()]},
        {"restaurant_id": warung, "name": "Sate Ayam Madura", "description": "Sate ayam bumbu kacang khas Madura, 10 tusuk.",
         "price": 40000, "image": IMG["sate"], "category": "Makanan Utama", "tags": ["Halal"],
         "popular": False, "available": True, "options": [_nasi_group()]},
        {"restaurant_id": warung, "name": "Gado-Gado", "description": "Sayuran segar dengan siraman bumbu kacang.",
         "price": 35000, "image": IMG["gado"], "category": "Makanan Utama", "tags": ["Vegetarian"],
         "popular": False, "available": True, "options": []},
        {"restaurant_id": warung, "name": "Es Cendol", "description": "Cendol dengan santan dan gula merah asli.",
         "price": 18000, "image": IMG["cendol"], "category": "Minuman", "tags": [],
         "popular": False, "available": True, "options": []},
        {"restaurant_id": warung, "name": "Es Teh Manis", "description": "Teh manis dingin menyegarkan.",
         "price": 8000, "image": IMG["esteh"], "category": "Minuman", "tags": [],
         "popular": False, "available": False, "options": []},
        {"restaurant_id": laksa, "name": "Laksa Betawi Komplit", "description": "Kuah santan gurih dengan bihun, telur, dan perkedel.",
         "price": 42000, "image": IMG["laksa"], "category": "Paling Populer", "tags": ["Halal", "Populer"],
         "popular": True, "available": True, "options": [_spice_group()]},
        {"restaurant_id": laksa, "name": "Soto Betawi", "description": "Soto daging sapi dengan kuah susu yang creamy.",
         "price": 48000, "image": IMG["rendang"], "category": "Makanan Utama", "tags": ["Halal"],
         "popular": True, "available": True, "options": [_nasi_group()]},
        {"restaurant_id": laksa, "name": "Es Selendang Mayang", "description": "Minuman tradisional Betawi yang manis dan segar.",
         "price": 15000, "image": IMG["cendol"], "category": "Minuman", "tags": [],
         "popular": False, "available": True, "options": []},
        {"restaurant_id": kue, "name": "Klappertaart", "description": "Kue kelapa lembut khas Manado.",
         "price": 28000, "image": IMG["cake"], "category": "Paling Populer", "tags": ["Manis", "Populer"],
         "popular": True, "available": True, "options": []},
        {"restaurant_id": kue, "name": "Lapis Legit", "description": "Kue lapis legit klasik dengan rempah.",
         "price": 32000, "image": IMG["cake"], "category": "Makanan Utama", "tags": ["Manis"],
         "popular": False, "available": True, "options": []},
        {"restaurant_id": sushi, "name": "Salmon Sashimi", "description": "Irisan salmon segar premium, 5 pcs.",
         "price": 78000, "image": IMG["sushi"], "category": "Paling Populer", "tags": ["Fresh", "Populer"],
         "popular": True, "available": True, "options": []},
        {"restaurant_id": sushi, "name": "California Roll", "description": "Roll klasik dengan kepiting, alpukat, dan timun.",
         "price": 55000, "image": IMG["sushi"], "category": "Makanan Utama", "tags": [],
         "popular": True, "available": True, "options": []},
        {"restaurant_id": ayam, "name": "Ayam Bakar Taliwang", "description": "Ayam bakar dengan sambal khas Lombok.",
         "price": 52000, "image": IMG["ayam"], "category": "Paling Populer", "tags": ["Halal", "Pedas", "Populer"],
         "popular": True, "available": True, "options": [_spice_group(), _nasi_group()]},
        {"restaurant_id": ayam, "name": "Plecing Kangkung", "description": "Kangkung segar dengan sambal tomat pedas.",
         "price": 22000, "image": IMG["gado"], "category": "Makanan Utama", "tags": ["Pedas"],
         "popular": False, "available": True, "options": []},
        {"restaurant_id": kopi, "name": "Kopi Susu Senja", "description": "Signature es kopi susu dengan gula aren.",
         "price": 25000, "image": IMG["coffee"], "category": "Paling Populer", "tags": ["Populer"],
         "popular": True, "available": True, "options": []},
        {"restaurant_id": kopi, "name": "Croissant Butter", "description": "Croissant renyah dengan mentega premium.",
         "price": 28000, "image": IMG["cake"], "category": "Makanan Utama", "tags": [],
         "popular": False, "available": True, "options": []},
    ]
    await db.menu_items.insert_many(menu)

    reels = [
        {"restaurant_id": warung, "restaurant_name": "Warung Sinar Bahagia", "user_name": "Sari Wibowo",
         "user_handle": "@sarieats", "user_avatar": "https://i.pravatar.cc/150?img=45",
         "caption": "Rendang paling empuk di Kemang! \U0001F525", "thumb": IMG["rendang"], "duration": "0:45",
         "views": 12400, "rating": 5},
        {"restaurant_id": sushi, "restaurant_name": "Sushi Tei Kemang", "user_name": "Budi Hartono",
         "user_handle": "@bhfoodie", "user_avatar": "https://i.pravatar.cc/150?img=12",
         "caption": "Salmon-nya fresh, wajib dicoba!", "thumb": IMG["sushi"], "duration": "0:32",
         "views": 8700, "rating": 5},
        {"restaurant_id": laksa, "restaurant_name": "Kedai Laksa Betawi", "user_name": "Maya Anggraini",
         "user_handle": "@mayaeats", "user_avatar": "https://i.pravatar.cc/150?img=32",
         "caption": "Laksa Betawi legendaris, kuahnya juara!", "thumb": IMG["laksa"], "duration": "0:28",
         "views": 5300, "rating": 5},
    ]
    await db.reels.insert_many(reels)

    if not await db.users.find_one({"email": "andi@eatly.com"}):
        await db.users.insert_one({
            "email": "andi@eatly.com", "name": "Andi Prasetyo", "username": "andipras",
            "avatar_url": "https://i.pravatar.cc/300?img=13", "referral_code": "ANDI2026",
            "total_orders": 47, "invited_friends": 12,
            "password_hash": hash_password("password123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    logger.info("Seed complete.")


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
