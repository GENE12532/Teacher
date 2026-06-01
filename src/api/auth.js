import client from './client'

export function login(username, password) {
  return client.post('/auth/login', { username, password })
}

export function register(data) {
  return client.post('/auth/register', data)
}

export function getMe() {
  return client.get('/auth/me')
}
