import axiosInstance from './axiosInstance'

export const authApi = {
  register: (data) => axiosInstance.post('/auth/register', data).then(r => r.data),
  login:    (data) => axiosInstance.post('/auth/login', data).then(r => r.data),
  refresh:  (token) => axiosInstance.post('/auth/refresh', { refresh_token: token }).then(r => r.data),
  me:       () => axiosInstance.get('/auth/me').then(r => r.data),
}

export const studentsApi = {
  getAll:   (params) => axiosInstance.get('/students', { params }).then(r => r.data),
  getById:  (id)    => axiosInstance.get(`/students/${id}`).then(r => r.data),
  create:   (data)  => axiosInstance.post('/students', data).then(r => r.data),
  update:   (id, d) => axiosInstance.put(`/students/${id}`, d).then(r => r.data),
  delete:   (id)    => axiosInstance.delete(`/students/${id}`).then(r => r.data),
  stats:    ()      => axiosInstance.get('/students/stats').then(r => r.data),
}

export const coursesApi = {
  getAll:    (params) => axiosInstance.get('/courses', { params }).then(r => r.data),
  getById:   (id)    => axiosInstance.get(`/courses/${id}`).then(r => r.data),
  create:    (data)  => axiosInstance.post('/courses', data).then(r => r.data),
  update:    (id, d) => axiosInstance.put(`/courses/${id}`, d).then(r => r.data),
  delete:    (id)    => axiosInstance.delete(`/courses/${id}`).then(r => r.data),
  stats:     ()      => axiosInstance.get('/courses/stats').then(r => r.data),
  enroll:    (id, d) => axiosInstance.post(`/courses/${id}/enroll`, d).then(r => r.data),
  unenroll:  (id, d) => axiosInstance.post(`/courses/${id}/unenroll`, d).then(r => r.data),
}

export const attendanceApi = {
  getSessions:     (params) => axiosInstance.get('/attendance/sessions', { params }).then(r => r.data),
  getSession:      (id)    => axiosInstance.get(`/attendance/sessions/${id}`).then(r => r.data),
  createSession:   (data)  => axiosInstance.post('/attendance/sessions', data).then(r => r.data),
  updateSession:   (id, d) => axiosInstance.put(`/attendance/sessions/${id}`, d).then(r => r.data),
  deleteSession:   (id)    => axiosInstance.delete(`/attendance/sessions/${id}`).then(r => r.data),
  getStudentAttendance: (id, params) => axiosInstance.get(`/attendance/student/${id}`, { params }).then(r => r.data),
  stats:           ()      => axiosInstance.get('/attendance/stats').then(r => r.data),
}

export const qrApi = {
  generate: (data) => axiosInstance.post('/qr/generate', data).then(r => r.data),
  mark:     (data) => axiosInstance.post('/qr/mark', data).then(r => r.data),
}

export const reportsApi = {
  overview:      ()       => axiosInstance.get('/reports/overview').then(r => r.data),
  courseReport:  (id)     => axiosInstance.get(`/reports/course/${id}`).then(r => r.data),
  studentReport: (id)     => axiosInstance.get(`/reports/student/${id}`).then(r => r.data),
  exportCsv:     (params) => axiosInstance.get('/reports/export/csv', { params, responseType: 'blob' }).then(r => r.data),
}

export const faceApi = {
  status:     () => axiosInstance.get('/face/status').then(r => r.data),
  register:   (d) => axiosInstance.post('/face/register', d).then(r => r.data),
  recognize:  (d) => axiosInstance.post('/face/recognize', d).then(r => r.data),
}
