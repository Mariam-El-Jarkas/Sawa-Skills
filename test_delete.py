import requests

url = 'http://localhost:8080'
session = requests.Session()

import random
email = f'testuser{random.randint(1000,9999)}@example.com'

# Register
r = session.post(url + '/api/auth/register', json={
    'name': 'Test User',
    'email': email,
    'password': 'password',
    'phone': '03123456',
    'isMinor': False
})
print(r.text)
