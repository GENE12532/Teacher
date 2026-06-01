import client from './client'

export function listResources(params) {
  return client.get('/resources', { params })
}

export function likeResource(id) {
  return client.post(`/resources/${id}/like`)
}

export function favoriteResource(id) {
  return client.post(`/resources/${id}/favorite`)
}
