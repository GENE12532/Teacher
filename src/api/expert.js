import client from './client'

export function listExperts(field) {
  return client.get('/experts', { params: field ? { field } : {} })
}

export function createAppointment(data) {
  return client.post('/experts/appointments', data)
}
