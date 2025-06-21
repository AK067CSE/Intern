import requests
from datetime import datetime

def fetch_user_rating(handle):
    url = f'https://codeforces.com/api/user.info?handles={handle}'
    resp = requests.get(url)
    data = resp.json()
    if data['status'] != 'OK':
        return None
    user = data['result'][0]
    return {
        'current_rating': user.get('rating'),
        'max_rating': user.get('maxRating')
    }

def fetch_contest_history(handle):
    url = f'https://codeforces.com/api/user.rating?handle={handle}'
    resp = requests.get(url)
    data = resp.json()
    if data['status'] != 'OK':
        return []
    contests = data['result'][-100:]
    result = []
    for c in contests:
        result.append({
            'contest_id': c['contestId'],
            'contest_name': c['contestName'],
            'rank': c['rank'],
            'rating_change': c['newRating'] - c['oldRating'],
            'solved_count': None,  # Not available from this endpoint
            'date': datetime.utcfromtimestamp(c['ratingUpdateTimeSeconds']),
            'new_rating': c['newRating']  # Store new rating
        })
    return result

def fetch_submissions(handle):
    url = f'https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000'
    resp = requests.get(url)
    data = resp.json()
    if data['status'] != 'OK':
        return []
    submissions = data['result']
    ac = {}
    for sub in submissions:
        if sub['verdict'] == 'OK':
            pid = f"{sub['problem']['contestId']}-{sub['problem']['index']}"
            if pid not in ac:
                ac[pid] = {
                    'problem_id': pid,
                    'problem_name': sub['problem'].get('name'),
                    'rating': sub['problem'].get('rating'),
                    'date_solved': datetime.utcfromtimestamp(sub['creationTimeSeconds'])
                }
    return list(ac.values()) 