import os
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers.auth import router as auth_router
from routers.contact import router as contact_router
from routers.division import router as division_router
from routers.game import router as game_router
from routers.join import router as join_router
from routers.match import router as match_router
from routers.message import router as message_router
from routers.player import router as player_router
from routers.session import router as session_router
from services.auth import DEMO_MODE, JWT_ALGORITHM, JWT_SECRET
from services.scheduler import start_scheduler, stop_scheduler

ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if DEMO_MODE:
    @app.middleware("http")
    async def demo_read_only_middleware(request: Request, call_next):
        if request.method not in ("GET", "HEAD", "OPTIONS") and not request.url.path.startswith("/auth/"):
            # Check if the request has a valid JWT (i.e. a logged-in demo user)
            auth = request.headers.get("authorization", "")
            if auth.startswith("Bearer "):
                try:
                    jwt.decode(auth[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Demo mode: read-only"},
                    )
                except jwt.PyJWTError:
                    pass
        return await call_next(request)

app.include_router(auth_router)
app.include_router(player_router)
app.include_router(match_router)
app.include_router(game_router)
app.include_router(division_router)
app.include_router(message_router)
app.include_router(contact_router)
app.include_router(join_router)
app.include_router(session_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
