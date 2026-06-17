from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from config import DB_URL, SERVER_URL


server_engine = create_async_engine(SERVER_URL, echo=True)
server_session = async_sessionmaker(bind=server_engine, expire_on_commit=False)

db_engine = create_async_engine(DB_URL, echo=True)
new_sessions = async_sessionmaker(bind=db_engine, expire_on_commit=False)