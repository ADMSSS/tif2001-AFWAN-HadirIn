const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Zona Waktu & Pool Koneksi PostgreSQL (Supabase)
process.env.TZ = 'Asia/Jakarta';
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// Tes koneksi database saat server dinyalakan
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Koneksi ke Supabase gagal:', err.stack);
    }
    console.log('Berhasil terhubung ke database Supabase!');
    release();
});

// ==========================================
// 1. ENDPOINT REGISTER
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Semua kolom wajib diisi!' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Kata sandi minimal 6 karakter!' });
        }

        const role = 'karyawan'; // Default role aman, ubah ke 'hrd' via DB
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`;
        const values = [name, email, hashedPassword, role];

        const newNuser = await pool.query(query, values);
        res.status(201).json({ message: 'Registrasi berhasil!', user: newNuser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Registrasi gagal, email mungkin sudah terdaftar.', details: err.message });
    }
});

// ==========================================
// 2. ENDPOINT LOGIN
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan kata sandi wajib diisi!' });
        }

        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Email atau kata sandi salah!' });
        }

        const user = userQuery.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email atau kata sandi salah!' });
        }

        res.status(200).json({
            message: `Login berhasil sebagai ${user.role}!`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: err.message });
    }
});

// ==========================================
// 3. ENDPOINT CHECK-IN (Dengan Logika Terlambat Otomatis)
// ==========================================
app.post('/api/attendance/check-in', async (req, res) => {
    try {
        const { user_id } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0]; // Format HH:MM:SS
        const jamMasukKantor = '08:00:00';

        // Tentukan status otomatis
        const status = currentTime > jamMasukKantor ? 'terlambat' : 'hadir';

        const query = `INSERT INTO attendances (user_id, date, check_in_time, status) 
                       VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [user_id, today, currentTime, status];

        const result = await pool.query(query, values);
        res.status(200).json({ message: `Check-in berhasil! Status: ${status.toUpperCase()}`, data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: 'Anda sudah melakukan check-in hari ini atau terjadi kesalahan.', details: err.message });
    }
});

// ==========================================
// 4. ENDPOINT CHECK-OUT
// ==========================================
app.put('/api/attendance/check-out', async (req, res) => {
    try {
        const { user_id } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        const query = `UPDATE attendances SET check_out_time = $1 WHERE user_id = $2 AND date = $3 AND check_out_time IS NULL RETURNING *`;
        const values = [currentTime, user_id, today];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Belum melakukan check-in hari ini atau sudah check-out sebelumnya.' });
        }

        res.status(200).json({ message: `Check-out berhasil dicatat pada pukul ${currentTime}`, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Gagal melakukan check-out.', details: err.message });
    }
});

// ==========================================
// 5. ENDPOINT REKAPITULASI HRD
// ==========================================
app.get('/api/attendance/recap', async (req, res) => {
    try {
        const query = `SELECT attendances.*, users.name, users.email 
                       FROM attendances 
                       JOIN users ON attendances.user_id = users.id 
                       ORDER BY attendances.date DESC, attendances.check_in_time DESC`;
        
        const result = await pool.query(query);
        res.status(200).json({ recap: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data rekapitulasi.', details: err.message });
    }
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend REST API HadirIn berjalan di port ${PORT}`);
});