import client from './client';

const data = (p) => p.then((r) => r.data);
const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null && v !== false));

export const authApi = {
  login: (body) => data(client.post('/api/auth/login', body)),
  register: (body) => data(client.post('/api/auth/register', body)),
  me: () => data(client.get('/api/auth/me')),
  logout: () => data(client.post('/api/auth/logout')),
};

export const catalogApi = { get: () => data(client.get('/api/catalog')) };

export const hospitalApi = {
  search: (params) => data(client.get('/api/hospitals', { params: clean(params) })),
  network: () => data(client.get('/api/hospitals/network')),
  mine: () => data(client.get('/api/hospitals/mine')),
  get: (id) => data(client.get(`/api/hospitals/${id}`)),
  update: (id, body) => data(client.put(`/api/hospitals/${id}`, body)),
};

export const resourceApi = {
  mine: () => data(client.get('/api/resources/mine')),
  update: (updates) => data(client.put('/api/resources/mine', { updates })),
};

export const referralApi = {
  list: (params) => data(client.get('/api/referrals', { params: clean(params) })),
  get: (id) => data(client.get(`/api/referrals/${id}`)),
  create: (body) => data(client.post('/api/referrals', body)),
  timeline: (id) => data(client.get(`/api/referrals/${id}/timeline`)),
  messages: (id) => data(client.get(`/api/referrals/${id}/messages`)),
  postMessage: (id, body) => data(client.post(`/api/referrals/${id}/messages`, { body })),
  preview: (id) => data(client.get(`/api/referrals/${id}/match`)),
  match: (id) => data(client.post(`/api/referrals/${id}/match`, {})),
  send: (id, hospitalId, note) => data(client.post(`/api/referrals/${id}/send`, { hospitalId, note })),
  view: (id) => data(client.post(`/api/referrals/${id}/view`, {})),
  accept: (id, note) => data(client.post(`/api/referrals/${id}/accept`, { note })),
  decline: (id, note) => data(client.post(`/api/referrals/${id}/decline`, { note })),
  requestInfo: (id, note) => data(client.post(`/api/referrals/${id}/request-info`, { note })),
  provideInfo: (id, note) => data(client.post(`/api/referrals/${id}/provide-info`, { note })),
  startTransfer: (id) => data(client.post(`/api/referrals/${id}/start-transfer`, {})),
  complete: (id) => data(client.post(`/api/referrals/${id}/complete`, {})),
  cancel: (id, note) => data(client.post(`/api/referrals/${id}/cancel`, { note })),
};

export const notificationApi = {
  list: (page = 0, size = 20) => data(client.get('/api/notifications', { params: { page, size } })),
  unread: () => data(client.get('/api/notifications/unread-count')),
  read: (id) => data(client.post(`/api/notifications/${id}/read`)),
  readAll: () => data(client.post('/api/notifications/read-all')),
};

export const dashboardApi = { get: () => data(client.get('/api/dashboard')) };
export const searchApi = { search: (q) => data(client.get('/api/search', { params: { q } })) };

export const assistantApi = {
  prompts: () => data(client.get('/api/assistant/prompts')),
  chat: (body) => data(client.post('/api/assistant/chat', body)),
};

export const publicApi = {
  status: () => data(client.get('/api/public/status')),
  help: (q) => data(client.get('/api/public/help', { params: clean({ q }) })),
};

export const adminApi = {
  users: (params) => data(client.get('/api/admin/users', { params: clean(params) })),
  overview: () => data(client.get('/api/admin/overview')),
  settings: () => data(client.get('/api/admin/settings')),
  updateSettings: (body) => data(client.put('/api/admin/settings', body)),
  exceptionState: (id, status, note) => data(client.put('/api/admin/exceptions/state', { id, status, note })),
  createHospital: (hospital, reason) => data(client.post('/api/admin/hospitals', { hospital, reason })),
  editHospital: (id, hospital, reason) => data(client.put(`/api/admin/hospitals/${id}`, { hospital, reason })),
  hospitalResources: (id) => data(client.get(`/api/admin/hospitals/${id}/resources`)),
  correctResources: (id, updates, reason) => data(client.put(`/api/admin/hospitals/${id}/resources`, { updates, reason })),
  resourceHistory: (id) => data(client.get(`/api/admin/hospitals/${id}/resource-history`)),
  reportSummary: (params) => data(client.get('/api/admin/reports/summary', { params: clean(params) })),
  reportExport: (type, params) => client.get(`/api/admin/reports/export/${type}`, { params: clean(params), responseType: 'blob' }).then((r) => r.data),
  exceptions: () => data(client.get('/api/admin/exceptions')),
  setUserActive: (id, active, reason) => data(client.patch(`/api/admin/users/${id}/active`, { active, reason })),
  setHospitalActive: (id, active, reason) => data(client.patch(`/api/admin/hospitals/${id}/active`, { active, reason })),
  editReferral: (id, body) => data(client.put(`/api/admin/referrals/${id}`, body)),
  reassignReferral: (id, hospitalId, reason) => data(client.post(`/api/admin/referrals/${id}/reassign`, { hospitalId, reason })),
  cancelReferral: (id, reason) => data(client.post(`/api/admin/referrals/${id}/cancel`, { reason })),
  flagReferral: (id, reason) => data(client.post(`/api/admin/referrals/${id}/flag`, { reason })),
  resolveFlag: (id, reason) => data(client.post(`/api/admin/referrals/${id}/resolve-flag`, { reason })),
  notes: (id) => data(client.get(`/api/admin/referrals/${id}/notes`)),
  addNote: (id, body) => data(client.post(`/api/admin/referrals/${id}/notes`, { body })),
  audit: (params) => data(client.get('/api/admin/audit', { params: clean(params) })),
  csv: (params) => client.get('/api/admin/reports/referrals.csv', { params: clean(params), responseType: 'blob' }).then((r) => r.data),
};

export const savedFilterApi = {
  list: (scope) => data(client.get('/api/saved-filters', { params: { scope } })),
  save: (name, scope, filter) => data(client.post('/api/saved-filters', { name, scope, filter: JSON.stringify(filter) })),
  remove: (id) => client.delete(`/api/saved-filters/${id}`).then(() => null),
};
