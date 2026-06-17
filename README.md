```markdown
# GitHub Profile Analyzer 📊

Веб-приложение для анализа профилей GitHub с генерацией AI-резюме через Mistral AI.

## ✨ Возможности

- 🔍 Анализ профиля GitHub: репозитории, языки, звёзды, активность
- 🤖 AI-резюме разработчика через Mistral AI
- 💾 Кэширование результатов в PostgreSQL
- 🔐 OAuth 2.0 авторизация (Google / GitHub)

## 🚀 Быстрый старт

### 1. Требования
- Python 3.11+
- PostgreSQL 14+

### 2. Установка
```bash
git clone <repo-url>
cd project
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

### 3. Настройка `.env`
```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_pass

# APIs
GITHUB_API_KEY=your_github_token
MISTRAL_API_KEY=your_mistral_key

# Google OAuth
GOOGLE_CLIENT_ID_APP=your_client_id
GOOGLE_CLIENT_SECRET_APP=your_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_oauth_id
GITHUB_CLIENT_SECRET=your_oauth_secret
```

### 4. Запуск
```bash
python app.py
```
Откройте: **http://127.0.0.1:8000**

## 📁 Структура

```
project/
├── app.py              # FastAPI entry point
├── router.py           # API routes
├── repository.py       # DB & OAuth logic
├── models.py           # SQLAlchemy models
├── database.py         # DB connection
├── config.py           # Settings & env vars
├── github.py           # GitHub API client
├── mistral_methods.py  # Mistral AI integration
├── init_db.py          # DB initialization
├── templates/          # Jinja2 HTML templates
└── static/             # CSS, JS, images
```

## 🔧 Настройка OAuth

### Google
1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials
2. Создать OAuth 2.0 Client ID
3. Добавить redirect URI: `http://127.0.0.1:8000/auth/google`

### GitHub
1. [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps
2. Создать новое приложение
3. Callback URL: `http://127.0.0.1:8000/auth/github`

### GitHub API Token
1. [Personal Access Tokens](https://github.com/settings/tokens)
2. Scopes: `repo`, `user`, `read:user`

## 📡 API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/user?username={name}` | Анализ профиля GitHub |
| GET | `/auth/login/google` | Вход через Google |
| GET | `/auth/login/github` | Вход через GitHub |

**Пример:**
```bash
curl "http://127.0.0.1:8000/user?username=Amontapelir"
```

## 🗄️ Модели БД

**users**: `id, name, email, password, last_activities`

**github_users**: `username (PK), data (JSONB), resume, created_at, updated_at`

## 🤖 AI-анализ

Приложение отправляет в Mistral AI:
- Статистику профиля и репозиториев
- Языки программирования
- Уровень активности

Модель генерирует краткое резюме о стеке, опыте и активности разработчика.

## 📦 requirements.txt

```txt
fastapi==0.111.0
uvicorn[standard]==0.30.1
starlette==0.37.2
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
httpx>=0.27.0
jinja2==3.1.4
python-dotenv>=1.0.0
mistralai>=0.4.0
pydantic>=2.7.0
```

## 🗒️ Лицензия

MIT — используйте свободно.

---
*Автор: Amontapelir | 2026*
```
