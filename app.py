from contextlib import asynccontextmanager

import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from init_db import create_db_if_not_exist
from models import create_tables
from router import router
from init_db import delete_db_if_exist


@asynccontextmanager
async def lifespan(app: FastAPI):
    # await delete_db_if_exist()
    await create_db_if_not_exist()
    await create_tables()
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.exception_handler(httpx.HTTPError)
async def http_exception_handler(request: Request, exc: httpx.HTTPError):
    return {"error": f"Произошла непредвиденная ошибка {exc}"}

app.include_router(router)

@app.get("/auth", include_in_schema=False)
async def login_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@app.get("/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == '__main__':
    # print(f"templates.env.cache type: {type(templates.env.cache)}")
    # print(f"templates.env.cache: {templates.env.cache}")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)