import os
from dotenv import load_dotenv


load_dotenv()

MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
GITHUB_API_KEY = os.getenv('GITHUB_API_KEY')

YANDEX_CLIENT_ID = os.getenv("YANDEX_CLIENT_ID")
YANDEX_CLIENT_SECRET = os.getenv("YANDEX_CLIENT_SECRET")

YANDEX_AUTH_URL = "https://oauth.yandex.ru/authorize"
YANDEX_TOKEN_URL = "https://oauth.yandex.ru/token"
YANDEX_USERINFO_URL = "https://login.yandex.ru/info"

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"

YANDEX_REDIRECT_URI = "http://127.0.0.1:8000/auth/yandex"
GITHUB_REDIRECT_URI = "http://127.0.0.1:8000/auth/github"

HOST = os.getenv('POSTGRES_HOST')
PORT = os.getenv('POSTGRES_PORT')
USERNAME = os.getenv('POSTGRES_USER')
PASSWORD = os.getenv('POSTGRES_PASSWORD')

DB_NAME = 'api_project'

DB_URL = f'postgresql+asyncpg://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}'
SERVER_URL = f'postgresql+asyncpg://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/postgres'