from sqlalchemy import text
from config import DB_NAME
from database import server_engine


async def create_db_if_not_exist():
    async with server_engine.connect() as conn:
        await conn.execute(text("COMMIT"))

        query = text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        result = await conn.execute(query)
        exists = result.fetchone()


        if not exists:
            await conn.execute(text("COMMIT"))
            query = text(f'CREATE DATABASE {DB_NAME}')
            await conn.execute(query)
            await conn.execute(text("COMMIT"))
            print(f'База данных {DB_NAME} спешно создана')

        else:
            print(f'База данных {DB_NAME} уже создана')

    return


async def delete_db_if_exist():
    async with server_engine.connect() as conn:
        await conn.execute(text("COMMIT"))

        query = text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        result = await conn.execute(query)
        exists = result.fetchone()

        if exists:
            await conn.execute(text("COMMIT"))
            query = text(f'DROP DATABASE {DB_NAME}')
            await conn.execute(query)
            await conn.execute(text("COMMIT"))
            print(f'База данных {DB_NAME} спешно удалена')

        else:
            print(f'База данных {DB_NAME} уже удалена')

    return