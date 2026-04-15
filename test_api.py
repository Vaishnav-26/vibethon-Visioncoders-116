import requests
import json

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGY1NGEyMjk1YzVjYzZlN2NhNTM4MiIsInN0dWRlbnRJRCI6IlNUVTAwMiIsImVtYWlsIjoiZXhwbG9yZXJAdGVzdC5jb20iLCJpYXQiOjE3NzYyNDM4NzUsImV4cCI6MTc3Njg0ODY3NX0.51ea4WwBlkmknVaGGHcBuQdFqioV4pTWSt5guWMVxVM'
headers = {'Authorization': f'Bearer {token}'}
base_url = 'http://localhost:3000/api'

print('\n=== TEST 2: GET PROFILE ===')
resp = requests.get(f'{base_url}/profile', headers=headers)
print(f'Status: {resp.status_code}')
profile = resp.json()
print(f'Student: {profile.get("name")}')
print(f'XP: {profile.get("xp")}')
print(f'Streak: {profile.get("streak")}')
print(f'Level: {profile.get("level")}')
print()

print('=== TEST 3: UPDATE PROGRESS (Video Watched) ===')
progress_data = {
    'moduleId': 'decision-trees',
    'moduleName': 'Decision Trees 101',
    'completed': 1,
    'total': 10
}
resp = requests.patch(f'{base_url}/progress', json=progress_data, headers=headers)
print(f'Status: {resp.status_code}')
print(json.dumps(resp.json(), indent=2))
print()

print('=== TEST 4: COMPLETE MODULE ===')
module_data = {
    'moduleId': 'decision-trees',
    'moduleName': 'Decision Trees 101',
    'score': 85
}
resp = requests.post(f'{base_url}/complete-module', json=module_data, headers=headers)
print(f'Status: {resp.status_code}')
print(json.dumps(resp.json(), indent=2))
print()

print('=== TEST 5: GENERATE LESSON ===')
lesson_data = {
    'topic': 'Neural Networks',
    'level': 'beginner'
}
resp = requests.post(f'{base_url}/generate-lesson', json=lesson_data, headers=headers)
print(f'Status: {resp.status_code}')
result = resp.json()
print(f'Lesson Title: {result.get("title")}')
print(f'Key Points: {len(result.get("keyPoints", []))}')
print(f'Quiz Questions: {len(result.get("quiz", []))}')
print()

print('=== TEST 6: FINAL PROFILE CHECK ===')
resp = requests.get(f'{base_url}/profile', headers=headers)
profile = resp.json()
print(f'Final XP: {profile.get("xp")}')
print(f'Progress Modules: {len(profile.get("progress", []))}')
print(f'Completed Modules: {len(profile.get("completedModules", []))}')
