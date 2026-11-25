import axios from 'axios';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB sesuai standar Sprint 2 Bagian 1.2
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validasi ukuran (maks 2 MB) dan tipe MIME (image/jpeg, image/png, image/webp)
 * untuk foto presensi / unggahan media Cloud Storage.
 */
export function validatePhotoDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { ok: false, error: 'Berkas foto tidak ditemukan.' };
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: 'Format data foto tidak valid.' };
  }
  const mime = match[1].toLowerCase();
  const base64Body = match[2];
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: 'Tipe berkas ditolak. Hanya menerima image/jpeg, image/png, atau image/webp.',
    };
  }
  const byteSize = Math.ceil((base64Body.length * 3) / 4);
  if (byteSize > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'Ukuran berkas melebihi batas maksimal 2 MB.',
    };
  }
  return { ok: true, mime, byteSize };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') || localStorage.getItem('hadirin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
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

  changePassword: async ({ userId, oldPassword, newPassword }) => {
    const response = await api.patch('/auth/change-password', {
      user_id: userId,
      old_password: oldPassword,
      new_password: newPassword,
    });
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
  checkIn: async ({ lat, lng, distance, accuracy, photo }) => {
    const check = validatePhotoDataUrl(photo);
    if (!check.ok) {
      throw new Error(check.error);
    }
    const response = await api.post('/attendances/check-in', {
      lat,
      lng,
      distance_m: distance,
      accuracy_m: accuracy,
      photo_base64: photo,
    });
    return response.data;
  },

  checkOut: async ({ lat, lng, distance, accuracy, photo }) => {
    if (photo) {
      const check = validatePhotoDataUrl(photo);
      if (!check.ok) {
        throw new Error(check.error);
      }
    }
    const response = await api.post('/attendances/check-out', {
      lat,
      lng,
      distance_m: distance,
      accuracy_m: accuracy,
      photo_base64: photo,
    });
    return response.data;
  },

  getAttendances: async ({
    search = '',
    status = '',
    userId = '',
    from = '',
    to = '',
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await api.get('/attendances', {
      params: { search, status, user_id: userId, from, to, page, limit },
    });
    return response.data;
  },

  getMyAttendances: async (month) => {
    const response = await api.get('/attendances/me', {
      params: month ? { month } : undefined,
    });
    return response.data;
  },
};

export const journalService = {
  createJournal: async ({
    attendanceId,
    title,
    description,
    minutes,
    status,
  }) => {
    const response = await api.post('/journals', {
      attendance_id: attendanceId,
      task_title: title,
      description,
      duration_minutes: minutes,
      task_status: status,
    });
    return response.data;
  },

  updateJournal: async (journalId, patch) => {
    const response = await api.put(`/journals/${journalId}`, patch);
    return response.data;
  },

  getJournals: async ({
    search = '',
    status = '',
    userId = '',
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await api.get('/journals', {
      params: { search, review_status: status, user_id: userId, page, limit },
    });
    return response.data;
  },

  reviewJournal: async (journalId, { decision, note }) => {
    const response = await api.patch(`/journals/${journalId}/review`, {
      review_status: decision,
      admin_note: note,
    });
    return response.data;
  },
};

export const employeeService = {
  getEmployees: async ({
    search = '',
    status = '',
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await api.get('/employees', {
      params: { search, status, page, limit },
    });
    return response.data;
  },

  createEmployee: async ({ nik, fullName, position }) => {
    const response = await api.post('/employees', {
      nik,
      full_name: fullName,
      position,
    });
    return response.data;
  },

  resetPassword: async (userId) => {
    const response = await api.post(`/employees/${userId}/reset-password`);
    return response.data;
  },

  setUserActive: async (userId, active) => {
    const response = await api.patch(`/employees/${userId}/status`, { active });
    return response.data;
  },
};

export const tenantService = {
  getTenants: async ({ search = '', status = '', page = 1, limit = 10 } = {}) => {
    const response = await api.get('/tenants', {
      params: { search, status, page, limit },
    });
    return response.data;
  },

  createTenant: async (payload) => {
    const response = await api.post('/tenants', payload);
    return response.data;
  },

  updateTenant: async (tenantId, patch) => {
    const response = await api.put(`/tenants/${tenantId}`, patch);
    return response.data;
  },

  extendLicense: async (tenantId, months) => {
    const response = await api.patch(`/tenants/${tenantId}/extend`, { months });
    return response.data;
  },
};

export default api;
