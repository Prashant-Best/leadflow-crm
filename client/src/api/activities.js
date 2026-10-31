import api from './client';

export const activitiesApi = {
  list: (params = {}) => api.get('/activities', { params }).then((res) => res.data.data.items),
  create: (payload) => api.post('/activities', payload).then((res) => res.data.data.activity),
  update: (id, payload) => api.patch(`/activities/${id}`, payload).then((res) => res.data.data.activity),
  complete: (id) => api.patch(`/activities/${id}`, { status: 'Completed' }).then((res) => res.data.data.activity),
};
