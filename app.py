from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from init_db import create_db_if_not_exist
from models import create_tables
from router import router
from init_db import delete_db_if_exist
from config import APP_HOST, APP_PORT


@asynccontextmanager
async def lifespan(app: FastAPI):
    await delete_db_if_exist()
    await create_db_if_not_exist()
    await create_tables()
    yield 

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(router)

@app.get("/", include_in_schema=False)
async def login_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@app.get("/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == '__main__':
    # print(f"templates.env.cache type: {type(templates.env.cache)}")
    # print(f"templates.env.cache: {templates.env.cache}")
    uvicorn.run("app:app", host=APP_HOST, port=APP_PORT, reload=True)