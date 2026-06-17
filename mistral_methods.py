from mistralai.client import Mistral
from pprint import pprint
from config import MISTRAL_API_KEY


async def get_resume(info: dict) -> str:
    model = 'mistral-small-latest'
    role = 'user'
    promt = f"""
    Ты — технический рекрутер. Проанализируй профиль GitHub пользователя {info.get('username')}.
    
    Статистика:
    - Дата регистрации: {info.get('created_at')}
    - Подписчиков: {info.get('followers')}
    - Публичных репозиториев: {info.get('all_repos')}
    - Языки: {info.get('languages')}
    - Всего звёзд: {info.get('total_stars')}
    - Среднее колличество звёзд на аккаунт: {info.get('mean_count_stars')}
    - Всего форков: {info.get('total_forks')}
    - Всего readmes: {info.get('total_readmes')}
    - Примерная активность: ~{info.get('activ')} коммитов за последний год
    
    
    Напиши краткое резюме в 3-4 предложения: кто этот разработчик (стек, специализация), насколько активен, есть ли популярные проекты, что можно сказать о его опыте.
    """

    try:
        client = Mistral(api_key=MISTRAL_API_KEY)
        res = await client.chat.complete_async(model=model, messages=[
            {
                'content': promt,
                'role': role
            }
        ])

        answer_text = res.choices[0].message.content
        #print(answer_text)
        return answer_text
    except Exception as e:
        raise Exception(f'Ошибка при запросе к Mistral API: {e}')