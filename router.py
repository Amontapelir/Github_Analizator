from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from repository import Repository

router = APIRouter()

@router.get("/user")
async def get_info(username: str) -> dict:
    full_info = await Repository.get_full_info(username)
    return full_info

@router.get("/auth/login/google")
async def login_google():
    url = Repository.get_google_url()
    return RedirectResponse(url)

@router.get("/auth/login/github")
async def login_github():
    url = Repository.get_github_url()
    return RedirectResponse(url)

@router.get("/auth/google")
async def auth_google(code: str):
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing")

    user_info = await Repository.authenticate_google(code)
    email = user_info.get("email")
    name = user_info.get("name")

    # Сохраняем пользователя
    await Repository.save_or_update_user(email=email, name=name)

    # Перенаправление на главную страницу
    return RedirectResponse("/dashboard")

@router.get("/auth/github")
async def auth_github(code: str):
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing")

    user_info = await Repository.authenticate_github(code)
    email = user_info.get("email")
    name = user_info.get("name")

    # Сохраняем пользователя
    await Repository.save_or_update_user(email=email, name=name)

    return RedirectResponse("/dashboard")
