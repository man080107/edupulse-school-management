import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiry & format errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// API Service Functions
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
};

export const classService = {
  getAll: () => api.get('/classes'),
  getClassStudents: (id) => api.get(`/classes/${id}/students`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

export const subjectService = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const assignmentService = {
  getAll: (params) => api.get('/assignments', { params }),
  getMyClasses: () => api.get('/assignments/my-classes'),
  create: (data) => api.post('/assignments', data),
  delete: (id) => api.delete(`/assignments/${id}`),
};

export const attendanceService = {
  getSheet: (params) => api.get('/attendance', { params }),
  save: (data) => api.post('/attendance', data),
  getDailySummary: (params) => api.get('/attendance/summary/daily', { params }),
  getStudentHistory: (studentId) => api.get(`/attendance/student/${studentId}`),
};

export const examService = {
  getAll: (params) => api.get('/exams', { params }),
  create: (data) => api.post('/exams', data),
  delete: (id) => api.delete(`/exams/${id}`),
  getMarks: (examId) => api.get(`/exams/${examId}/marks`),
  saveMarks: (examId, data) => api.post(`/exams/${examId}/marks`, data),
  getStudentReportCard: (studentId) => api.get(`/exams/student/${studentId}/report-card`),
};

export const feeService = {
  getAll: (params) => api.get('/fees', { params }),
  allocate: (data) => api.post('/fees/allocate', data),
  recordPayment: (data) => api.post('/fees/pay', data),
  getReceipt: (receiptNo) => api.get(`/fees/receipt/${receiptNo}`),
  getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
};

export const reportService = {
  getEnrollment: () => api.get('/reports/enrollment'),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getExams: (params) => api.get('/reports/exams', { params }),
  getFees: (params) => api.get('/reports/fees', { params }),
  exportCsvUrl: (type, classId) => {
    const base = import.meta.env.VITE_API_URL || '/api';
    return `${base}/reports/export-csv?type=${type}${classId ? `&classId=${classId}` : ''}`;
  },
};

export default api;
