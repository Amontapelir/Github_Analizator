
import httpx
from pprint import pprint
from config import GITHUB_API_KEY


Base_URL = 'https://api.github.com'

user_agent = 'GitHub user app'
headers = {'Authorization': f'Bearer {GITHUB_API_KEY}', 'Accept': 'application/vnd.github+json', 'User-Agent': user_agent}
# cookies = {'': 'has_recent_activity'}

async def get_user(username):
    async with httpx.AsyncClient() as client:
        user = await client.get(url=f'{Base_URL}/users/{username}', headers=headers)
        return user.json()

async def get_repos(username):
    async with httpx.AsyncClient() as client:
        repos = await client.get(url=f'{Base_URL}/users/{username}/repos', headers=headers)
        return repos.json()

async def get_languages(username, repo):
    async with httpx.AsyncClient() as client:
        languages = await client.get(url=f'{Base_URL}/repos/{username}/{repo}/languages', headers=headers)
        return languages.json()

async def get_activity(username, page=1):
    async with httpx.AsyncClient() as client:
        params = {'per_page': 15, 'page': page}
        activity = await client.get(url=f'{Base_URL}/users/{username}/events', headers=headers, params=params)
        return activity.json()

async def get_all_activ(username):
    all_activ = []
    for page in range(1, 16):
        all_activ += await get_activity(username, page)
    return all_activ

async def get_inf_repos(username, repos):
    sum_stars = 0
    sum_forks = 0
    sum_readmes = 0
    languages = {}
    for repo in repos:
        sum_stars += int(repo['stargazers_count'])
        sum_forks += int(repo['fork'])
        sum_readmes += int(repo['has_wiki'])
        repo_languages = await  get_languages(username, repo.get('name'))
        for key in repo_languages.keys():
            if key in languages:
                languages[key] += repo_languages[key]
            else:
                languages[key] = repo_languages[key]

    return {
        'languages': dict(sorted(languages.items(), key=lambda item: item[1], reverse=True)),
        'total_stars': sum_stars,
        'mean_count_stars': sum_stars//len(repos) if repos else 0,
        'total_forks': sum_forks,
        'total_readmes': sum_readmes
    }


async def get_info(username):
    user = await get_user(username)
    repos = await  get_repos(username)
    activ = await get_all_activ(username)

    info = {
        'username': user.get('login'),
        'created_at': user.get('created_at'),
        'followers': user.get('followers') or 0,
        'all_repos': len(repos) if repos else 0,
        'activ': len(activ),
    }
    info.update(await get_inf_repos(username, repos))

    # print(info)

    return info

# import asyncio
# asyncio.run(get_info('Amontapelir'))