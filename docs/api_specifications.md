# API Specifications — HadirIn

## 1. Konfigurasi Lingkungan dan Konektivitas

**Backend Base URL (Local Development):**

`http://localhost:5000/api/v1`

**Database Provider:** Supabase PostgreSQL

**Supabase Project URL:**

`https://eylxzhfudwhmzewaojxl.supabase.co`

**Database Connection String:**

`postgresql://postgres:[YOUR-PASSWORD]@db.eylxzhfudwhmzewaojxl.supabase.co:5432/postgres`

## 2. Authentication Endpoints

### A. Register User

Mendaftarkan akun pengguna baru. Pengguna yang mendaftar melalui endpoint publik akan mendapatkan peran default `karyawan`.

- **HTTP Method:** `POST`
- **Endpoint:** `/auth/register`
- **Authentication:** Public
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "Fahmi Dzulfikar",
  "email": "fahmidzulfikar@email.com",
  "password": "password123"
}
```

**Success Response — 201 Created:**

```json
{
  "success": true,
  "message": "Registrasi pengguna berhasil",
  "data": {
    "id": "c7b33410-1a2b-4c3d-8e9f-112233445566",
    "name": "Fahmi Dzulfikar",
    "email": "fahmidzulfikar@email.com",
    "role": "karyawan"
  }
}
```

**Error Response — 400 Bad Request:**

```json
{
  "success": false,
  "message": "Data input tidak valid"
}
```

**Error Response — 409 Conflict:**

```json
{
  "success": false,
  "message": "Email sudah terdaftar"
}
```

**Ketentuan:**
- Nama, email, dan password wajib diisi.
- Format email dan kebijakan password harus divalidasi oleh backend.
- Email harus unik.
- Role ditetapkan oleh backend, bukan ditentukan oleh pengguna publik.
- Password disimpan dalam bentuk hash yang aman.

### B. Login User

Melakukan autentikasi pengguna dan menghasilkan access token JWT untuk mengakses endpoint yang memerlukan autentikasi.

- **HTTP Method:** `POST`
- **Endpoint:** `/auth/login`
- **Authentication:** Public
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "email": "fahmidzulfikar@email.com",
  "password": "password123"
}
```

**Success Response — 200 OK:**

```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "<JWT_ACCESS_TOKEN>",
  "data": {
    "id": "c7b33410-1a2b-4c3d-8e9f-112233445566",
    "name": "Fahmi Dzulfikar",
    "email": "fahmidzulfikar@email.com",
    "role": "karyawan"
  }
}
```

**Error Response — 401 Unauthorized:**

```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

**Ketentuan:**
- Backend memverifikasi email dan password terhadap data pengguna.
- Password yang dikirim dibandingkan dengan hash password yang tersimpan menggunakan mekanisme verifikasi yang sesuai.
- Token JWT harus memiliki masa berlaku yang ditetapkan.
- Respons login tidak boleh mengembalikan password atau hash password.

### C. Penggunaan Access Token

Untuk mengakses endpoint yang memerlukan autentikasi, klien mengirimkan token melalui header HTTP.

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Backend harus memverifikasi tanda tangan token, masa berlaku, dan identitas pengguna sebelum memberikan akses.
