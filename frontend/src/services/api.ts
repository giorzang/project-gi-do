import axios from 'axios';

const api = axios.create({
  baseURL: '/', // Nhờ proxy nên chỉ cần để /
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động chèn Token từ localStorage vào Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi (Ví dụ 401 -> Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/'; // Đá về trang chủ bắt login lại
    }
    return Promise.reject(error);
  }
);

export default api;