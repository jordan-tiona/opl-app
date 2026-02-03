from typing import Union

from fastapi import FastAPI

from routers.player import router as player_router
from routers.match import router as match_router
from routers.game import router as game_router

app = FastAPI()
app.include_router(player_router)
app.include_router(match_router)
app.include_router(game_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
