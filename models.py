from typing import List

from sqlalchemy import func, ARRAY, String
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import JSONB

from datetime import datetime
from database import db_engine

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column(nullable=True)
    last_acrivities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)



class GithubUser(Base):
    __tablename__ = 'github_users'

    username: Mapped[str] = mapped_column(primary_key=True)
    data: Mapped[dict] = mapped_column(JSONB)
    resume: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


async def create_tables():
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Таблицы успешно созданы')
    return

