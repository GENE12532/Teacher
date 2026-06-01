import client from './client'

export function listClassroomAssets() {
  return client.get('/classroom/assets')
}

export function useClassroomAsset(assetId) {
  return client.post(`/classroom/assets/${assetId}/use`)
}
