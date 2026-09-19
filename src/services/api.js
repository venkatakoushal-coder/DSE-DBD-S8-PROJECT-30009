const API_BASE = '/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    throw new Error('Unable to connect to the backend server. Please ensure the backend server is running on port 5000 (npm run server).');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallbackMsg = (response.status === 504 || response.status === 502 || response.status === 500)
      ? 'Backend server error or proxy connection failed. Please ensure the backend is running on port 5000.'
      : 'An error occurred with the request.';
    const error = new Error(data.message || fallbackMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me')
  },
  courses: {
    getAll: () => request('/courses'),
    getById: (id) => request(`/courses/${id}`),
    getTeacherCourses: () => request('/courses/teacher/mine'),
    create: (courseData) => request('/courses', { method: 'POST', body: JSON.stringify(courseData) }),
    update: (id, courseData) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
    delete: (id) => request(`/courses/${id}`, { method: 'DELETE' })
  },
  enrollments: {
    enroll: (course_id) => request('/enrollments', { method: 'POST', body: JSON.stringify({ course_id }) }),
    getMy: () => request('/enrollments/my'),
    check: (courseId) => request(`/enrollments/check/${courseId}`)
  },
  materials: {
    getByCourse: (courseId) => request(`/materials/course/${courseId}`),
    create: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/materials/${id}`, { method: 'DELETE' })
  },
  progress: {
    toggle: (material_id) => request('/progress/toggle', { method: 'POST', body: JSON.stringify({ material_id }) }),
    getCourseProgress: (courseId) => request(`/progress/course/${courseId}`)
  },
  quizzes: {
    getByCourse: (courseId) => request(`/quizzes/course/${courseId}`),
    getById: (quizId) => request(`/quizzes/${quizId}`),
    submit: (quizId, answers) => request(`/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
    getMySubmissions: (quizId) => request(`/quizzes/${quizId}/submissions/my`),
    create: (data) => request('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/quizzes/${id}`, { method: 'DELETE' }),
    addQuestion: (quizId, questionData) => request(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(questionData) }),
    deleteQuestion: (questionId) => request(`/quizzes/questions/${questionId}`, { method: 'DELETE' })
  },
  performance: {
    getTeacherOverview: () => request('/performance/courses'),
    getCourseStudents: (courseId) => request(`/performance/course/${courseId}`)
  },
  interventions: {
    create: (data) => request('/interventions', { method: 'POST', body: JSON.stringify(data) }),
    getStudentInterventions: () => request('/interventions/student'),
    getTeacherInterventions: () => request('/interventions/teacher')
  }
};
