import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('hadirin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  /**
   * Login Karyawan & Admin Perusahaan (Multi-Tenant B2B)
   * Menggunakan Kode Perusahaan (Tenant Code), NIK (16 digit), dan Kata Sandi
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
   * Menggunakan Username dan Kata Sandi
   */
  loginSuperAdmin: async ({ username, password }) => {
    const response = await api.post('/auth/super-admin/login', {
      username: username.trim(),
      password,
    });
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem(
        'user',
        JSON.stringify(response.data.data || { role: 'super_admin' })
      );
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('hadirin_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const attendanceService = {
  /**
   * Kirim data Presensi Masuk ke Database Backend (POST /attendances/check-in)
   */
  checkIn: async ({ lat, lng, distance, accuracy, ip, photo }) => {
    const response = await api.post('/attendances/check-in', {
      lat,
      lng,
      distance_m: distance,
      accuracy_m: accuracy,
      ip_address: ip,
      photo_base64: photo,
    });
    return response.data;
  },

  /**
   * Kirim data Presensi Pulang ke Database Backend (POST /attendances/check-out)
   */
  checkOut: async ({ lat, lng, distance, accuracy, ip, photo }) => {
    const response = await api.post('/attendances/check-out', {
      lat,
      lng,
      distance_m: distance,
      accuracy_m: accuracy,
      ip_address: ip,
      photo_base64: photo,
    });
    return response.data;
  },

  /**
   * Ambil riwayat presensi karyawan dari Database Backend (GET /attendances/me)
   */
  getMyAttendances: async (month) => {
    const response = await api.get('/attendances/me', {
      params: month ? { month } : undefined,
    });
    return response.data;
  },
};

export const journalService = {
  /**
   * Simpan jurnal kerja harian ke Database Backend (POST /journals)
   */
  createJournal: async ({ attendanceId, title, description, minutes, status }) => {
    const response = await api.post('/journals', {
      attendance_id: attendanceId,
      task_title: title,
      description,
      duration_minutes: minutes,
      task_status: status,
    });
    return response.data;
  },
};

export default api;
