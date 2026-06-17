import os
from dotenv import load_dotenv


load_dotenv()

MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
GITHUB_API_KEY = os.getenv('GITHUB_API_KEY')

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID_APP")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET_APP")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USERINFO_URL = "https://api.github.com/user"

GOOGLE_REDIRECT_URI = "http://127.0.0.1:8000/auth/google"
GITHUB_REDIRECT_URI = "http://127.0.0.1:8000/auth/github"

HOST = os.getenv('POSTGRES_HOST')
PORT = os.getenv('POSTGRES_PORT')
USERNAME = os.getenv('POSTGRES_USER')
PASSWORD = os.getenv('POSTGRES_PASSWORD')

DB_NAME = 'api_project'

DB_URL = f'postgresql+asyncpg://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}'
SERVER_URL = f'postgresql+asyncpg://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/postgres'