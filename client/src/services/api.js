import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  /**
   * Login Karyawan & Admin Perusahaan (Multi-Tenant B2B)
   * Menggunakan Kode Perusahaan (Tenant ID), NIK, dan Kata Sandi
   */
  loginTenant: async ({ companyCode, nik, password }) => {
    const response = await api.post('/auth/login', {
      company_code: companyCode.trim().toUpperCase(),
      nik: nik.trim(),
      password,
    });
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data || {}));
    }
    return response.data;
  },

  /**
   * Login Khusus Super Admin (Platform Owner)
   */
  loginSuperAdmin: async ({ email, password }) => {
    const response = await api.post('/auth/super-admin/login', {
      email: email.trim(),
      password,
    });
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data || { role: 'super_admin' }));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default api;