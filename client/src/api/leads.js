import api from './client';

export const leadsApi = {
  list: (params = {}) => api.get('/leads', { params }).then((res) => res.data.data.items),
  get: (id) => api.get(`/leads/${id}`).then((res) => res.data.data.lead),
  create: (payload) => api.post('/leads', payload).then((res) => res.data.data.lead),
  update: (id, payload) => api.patch(`/leads/${id}`, payload).then((res) => res.data.data.lead),
  remove: (id) => api.delete(`/leads/${id}`).then((res) => res.data.data),
};
