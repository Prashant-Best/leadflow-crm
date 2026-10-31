import api from './client';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((res) => res.data.data),
};
