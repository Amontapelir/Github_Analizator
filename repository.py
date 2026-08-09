import httpx
from fastapi import HTTPException
from sqlalchemy import select
from urllib.parse import urlencode
from github import get_info
from mistral_methods import get_resume
from database import new_sessions
from models import GithubUser, User
from datetime import datetime
from random import uniform
import asyncio

from config import (
    GOOGLE_TOKEN_URL,
    GOOGLE_AUTH_URL,
    GOOGLE_USERINFO_URL,
    GITHUB_TOKEN_URL,
    GITHUB_AUTH_URL,
    GITHUB_USERINFO_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GITHUB_REDIRECT_URI,
)


def retry(func, attempts: int = 4):
    last_error = None
    async def wrapper(*args, **kwargs):
        last_error = None
        for attempt in range(attempts):
            print(f'[DEBUG] Попытка {attempt + 1} выполнения функции {func.__name__}')
            delay = 2**attempt + uniform(0, 1.0)
            try:
                return await func(*args, **kwargs)

            except httpx.TimeoutException as e:
                last_error = e
                await asyncio.sleep(delay)

            except httpx.HTTPStatusError as e:
                last_error = e
                if 400 <= e.response.status_code < 600:
                    await asyncio.sleep(delay)
                else:
                    print(f"[ERROR] Ошибка запроса {last_error}")
                    raise last_error

            except Exception as e:
                last_error = e
                print(f"[ERROR] Ошибка запроса {last_error}")
                raise last_error
        print(f"[ERROR] Ошибка запроса {last_error}")
        raise last_error

    return wrapper


class Repository:
    @staticmethod
    @retry
    async def get_full_info(username: str) -> dict:
        async with new_sessions() as session:
            cache = await session.get(GithubUser, username)
            if cache:
                return {
                    'data': cache.data,
                    'resume': cache.resume,
                }

            info = await get_info(username)
            resume = await get_resume(info)

            github_user = GithubUser(
                username=username,
                data=info,
                resume=resume,
            )
            session.add(github_user)

            #session.add(History(username=username, user=user))

            await session.commit()
            return {'data': info, 'resume': resume}

    @staticmethod
    def get_google_url():
        params = {
            "response_type": "code",
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
        return url

    @staticmethod
    def get_github_url():
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": "user",
        }
        url = f"{GITHUB_AUTH_URL}?{urlencode(params)}"
        return url

    @staticmethod
    @retry
    async def authenticate_google(code):
        async with httpx.AsyncClient() as client:
            # Обмен кода на токен
            data = {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
            headers = {"Accept": "application/json"}

            token_response = await client.post(GOOGLE_TOKEN_URL, data=data, headers=headers)
            token_response.raise_for_status()
            token_data = token_response.json()

            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail="Failed to get access token")

            access_token = token_data["access_token"]

            # Получение информации о пользователе
            user_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_response.raise_for_status()
            user_data = user_response.json()

            return user_data

    @staticmethod
    @retry
    async def authenticate_github(code):
        async with httpx.AsyncClient() as client:
            # Обмен кода на токен
            data = {
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            }
            headers = {"Accept": "application/json"}

            token_response = await client.post(GITHUB_TOKEN_URL, data=data, headers=headers)
            token_response.raise_for_status()
            token_data = token_response.json()

            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail="Failed to get access token")

            access_token = token_data["access_token"]

            # Получение информации о пользователе
            user_response = await client.get(
                GITHUB_USERINFO_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            user_response.raise_for_status()
            user_data = user_response.json()

            return user_data

    @staticmethod
    async def save_or_update_user(
            email: str = None,
            github_username: str = None,
            name: str = None,
    ):
        async with new_sessions() as session:

            query = select(User)

            if email:
                query = query.where(User.email == email)
            elif github_username:
                query = query.where(User.name == github_username)

            result = await session.execute(query)

            user = result.scalars().first()

            if not user:
                user = User(
                    name=name or github_username,
                    email=email,
                )

                session.add(user)

                await session.commit()
                await session.refresh(user)

            return user






