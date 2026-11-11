import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Kredensial Supabase belum diatur di file .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// FUNGSI UTILITY: Haversine Formula (Geofencing Lapis 3)
// ==========================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
};

// ==========================================
// MIDDLEWARE: Autentikasi JWT
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // { id, tenant_id, nik, role }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }
};

// ==========================================
// 1. ENDPOINT AUTH: LOGIN (Super Admin, Company Admin, Employee)
// ==========================================
app.post('/api/v1/auth/login', async (req, res) => {
  const { nik, password, company_license } = req.body;

  if (!nik || !password) {
    return res.status(400).json({ success: false, message: 'NIK dan Password wajib diisi.' });
  }

  try {
    let query = supabase.from('users').select('*, tenants(company_name, license_key, office_lat, office_long)');

    if (!company_license) {
      // Login khusus SUPER_ADMIN tanpa lisensi perusahaan
      query = query.eq('nik', nik).eq('role', 'SUPER_ADMIN');
    } else {
      // Cari user berdasarkan NIK dan pastikan tenant-nya sesuai license key
      const { data: tenantData, error: tenantErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('license_key', company_license)
        .single();

      if (tenantErr || !tenantData) {
        return res.status(404).json({ success: false, message: 'Lisensi perusahaan tidak valid.' });
      }

      query = query.eq('nik', nik).eq('tenant_id', tenantData.id);
    }

    const { data: users, error } = await query;

    if (error || !users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Kredensial tidak ditemukan.' });
    }

    const user = users[0];

    // Verifikasi Password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'NIK atau Password salah.' });
    }

    // Buat JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { id: user.id, tenant_id: user.tenant_id, nik: user.nik, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        company_name: user.tenants?.company_name || 'System Owner',
        nik: user.nik,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. ENDPOINT MANAJEMEN TENANT (Khusus SUPER_ADMIN)
// ==========================================
app.post('/api/v1/tenants', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya SUPER_ADMIN yang dapat membuat perusahaan baru.'
    });
  }

  const {
    company_name,
    license_key,
    max_users,
    active_until,
    office_lat,
    office_long
  } = req.body;

  if (!company_name || !license_key || !active_until) {
    return res.status(400).json({
      success: false,
      message: 'Nama perusahaan, license_key, dan active_until wajib diisi.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('tenants')
      .insert([
        {
          company_name,
          license_key,
          max_users: max_users || 50,
          active_until,
          office_lat,
          office_long
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'License key sudah digunakan perusahaan lain.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Tenant/Perusahaan baru berhasil dibuat.',
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/v1/tenants', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  try {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) return res.status(400).json({ success: false, message: error.message });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. ENDPOINT PROVISIONING USER (Super Admin & Company Admin)
// ==========================================
app.post('/api/v1/employees', authenticateToken, async (req, res) => {
  if (req.user.role !== 'COMPANY_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin.' });
  }

  const { nik, full_name, initial_password, tenant_id: bodyTenantId, role: bodyRole } = req.body;

  // Jika SUPER_ADMIN, wajib menyertakan tenant_id tujuan di body request. Jika COMPANY_ADMIN, gunakan tenant_id dari token.
  const targetTenantId = req.user.role === 'SUPER_ADMIN' ? bodyTenantId : req.user.tenant_id;

  // SUPER_ADMIN bebas menentukan role (COMPANY_ADMIN / EMPLOYEE). COMPANY_ADMIN hanya bisa membuat EMPLOYEE.
  const targetRole = req.user.role === 'SUPER_ADMIN' && bodyRole ? bodyRole : 'EMPLOYEE';

  if (!nik || !full_name || !initial_password || !targetTenantId) {
    return res.status(400).json({ success: false, message: 'Data pengguna atau tenant_id tidak lengkap.' });
  }

  try {
    const password_hash = await bcrypt.hash(initial_password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ tenant_id: targetTenantId, nik, password_hash, role: targetRole, full_name }])
      .select('id, tenant_id, nik, full_name, role');

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'NIK sudah terdaftar di perusahaan ini.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, message: `Akun ${targetRole} berhasil dibuat.`, data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. [CREATE] - Check-In dengan Validasi Geofencing (Lapis 3)
// ==========================================
app.post('/api/attendances/checkin', authenticateToken, async (req, res) => {
  const { lat, long, photo_url } = req.body;
  const { id: user_id, tenant_id, role } = req.user;

  if (role === 'SUPER_ADMIN' || !tenant_id) {
    return res.status(403).json({ success: false, message: 'Akun Super Admin tidak melakukan absensi harian.' });
  }

  if (lat === undefined || long === undefined) {
    return res.status(400).json({ success: false, message: 'Koordinat GPS wajib disertakan.' });
  }

  try {
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('office_lat, office_long')
      .eq('id', tenant_id)
      .single();

    if (tenantErr || !tenant) {
      return res.status(404).json({ success: false, message: 'Data lokasi kantor tenant tidak ditemukan.' });
    }

    const distance = calculateDistance(lat, long, tenant.office_lat, tenant.office_long);
    const MAX_RADIUS_METERS = 50;

    if (distance > MAX_RADIUS_METERS) {
      return res.status(403).json({
        success: false,
        message: `Gagal Check-In: Anda berada di luar radius kantor (${Math.round(distance)} meter dari titik pusat). Maksimal radius adalah 50 meter.`
      });
    }

    const { data, error } = await supabase
      .from('attendances')
      .insert([
        {
          tenant_id,
          user_id,
          check_in_time: new Date().toISOString(),
          lat,
          long,
          photo_url
        }
      ])
      .select();

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.status(201).json({
      success: true,
      message: 'Berhasil Check-In di dalam area kantor!',
      distance_meters: Math.round(distance),
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ==========================================
// 5. [READ] - Mengambil Data Absensi (Terisolasi Tenant)
// ==========================================
app.get('/api/attendances', authenticateToken, async (req, res) => {
  const { tenant_id, role, id: user_id } = req.user;
  try {
    let query = supabase.from('attendances').select('*, users(nik, full_name)');
    if (role !== 'SUPER_ADMIN') {
      query = query.eq('tenant_id', tenant_id);
    }
    if (role === 'EMPLOYEE') {
      query = query.eq('user_id', user_id);
    }
    const { data, error } = await query;
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ==========================================
// 6. [UPDATE] - Check-Out
// ==========================================
app.put('/api/attendances/checkout/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tenant_id, role, id: user_id } = req.user;
  try {
    let query = supabase
      .from('attendances')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', id);
    if (role === 'EMPLOYEE') {
      query = query.eq('user_id', user_id);
    } else if (role !== 'SUPER_ADMIN') {
      query = query.eq('tenant_id', tenant_id);
    }
    const { data, error } = await query.select();
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Data absensi tidak ditemukan atau tidak diizinkan.' });
    }
    res.status(200).json({ success: true, message: 'Berhasil Check-Out!', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ==========================================
// 7. [DELETE] - Menghapus Data Absensi
// ==========================================
app.delete('/api/attendances/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tenant_id, role } = req.user;
  if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  try {
    let query = supabase.from('attendances').delete().eq('id', id);
    if (role !== 'SUPER_ADMIN') {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query.select('id');
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data absensi tidak ditemukan atau tidak diizinkan.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Data absensi dengan ID ${id} berhasil dihapus.`
    });
    
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// Menjalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server HadirIn Multi-Tenant berjalan di http://localhost:${PORT}`);
});
