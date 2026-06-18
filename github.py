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

async def get_events(username):
    async with httpx.AsyncClient() as client:
        response = await client.get(url=f'{Base_URL}/users/{username}/events', headers=headers)
        events = []
        for event in response.json()[:10]:
            events.append({
                'type': event['type'],
                'actor': event['actor']['login'],
                'repo': event['repo']['name'],
                'payload': event['payload'],
                'comments': event.get('comments', []),
            })
        return events

async def get_readme(username, repo):
    async with httpx.AsyncClient() as client:
        readme = await client.get(url=f'{Base_URL}/repos/{username}/{repo}/readme', headers=headers)
        return readme.json()

async def get_inf_repos(username, repos):
    sum_stars = 0
    sum_forks = 0
    sum_readmes = 0
    languages = {}
    description = {}
    readmes = {}
    topics = {}
    for repo in repos:
        repo_name = repo['name']

        sum_stars += int(repo['stargazers_count'])
        sum_forks += int(repo['fork'])
        sum_readmes += int(repo['has_wiki'])

        repo_languages = await  get_languages(username, repo_name)
        for key in repo_languages.keys():
            if key in languages:
                languages[key] += repo_languages[key]
            else:
                languages[key] = repo_languages[key]

        description[repo_name] = repo['description']
        readme = await get_readme(username, repo_name)
        readmes[repo_name] = readme.get('content')[:1300] if readme.get('content') else ''
        topics[repo_name] = repo['topics']


    return {
        'languages': dict(sorted(languages.items(), key=lambda item: item[1], reverse=True)),
        'total_stars': sum_stars,
        'mean_count_stars': sum_stars//len(repos) if repos else 0,
        'total_forks': sum_forks,
        'total_readmes': sum_readmes,
        'description': description,
        'readmes': readmes,
        'topics': topics,
    }



async def get_info(username):
    user = await get_user(username)
    repos = await  get_repos(username)
    activ = await get_all_activ(username)
    events = await get_events(username)

    info = {

        'username': user.get('login'),
        'created_at': user.get('created_at'),
        'company': user.get('company'),
        'bio': user.get('bio'),
        'followers': user.get('followers') or 0,
        'all_repos': len(repos) if repos else 0,
        'activ': len(activ),
        'last_10_events': events,
    }
    info.update(await get_inf_repos(username, repos))

    # print(info)

    return info

# import asyncio
# asyncio.run(get_info('DietrichGebert'))