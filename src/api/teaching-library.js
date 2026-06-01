import client from './client'

export function listVideos(tag) {
  return client.get('/teaching-library/videos', { params: tag ? { tag } : {} })
}

export function favoriteVideo(id) {
  return client.post(`/teaching-library/videos/${id}/favorite`)
}

export function watchVideo(id) {
  return client.post(`/teaching-library/videos/${id}/watched`)
}
