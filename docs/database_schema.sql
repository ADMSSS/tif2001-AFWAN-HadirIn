-- 1. TABEL TENANTS (Pusat Isolasi Perusahaan & Konfigurasi Titik Koordinat Geofencing)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    max_users INT DEFAULT 50,
    active_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Konfigurasi Geofencing Lapis 3 (Titik Pusat Kantor)
    office_lat DECIMAL(10, 8) NOT NULL,       
    office_long DECIMAL(11, 8) NOT NULL,      
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL USERS (Multi-role: SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE dengan NIK unik per tenant)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nik VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE')) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Mencegah duplikasi NIK di perusahaan/tenant yang sama
    CONSTRAINT unique_tenant_nik UNIQUE (tenant_id, nik)
);

-- 3. TABEL ATTENDANCES (Pencatatan Presensi dengan Partitioning Tenant)
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    lat DECIMAL(10, 8),
    long DECIMAL(11, 8),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat indeks untuk mempercepat kueri pencarian absensi berdasarkan tenant dan waktu
CREATE INDEX idx_attendances_tenant_date ON attendances(tenant_id, check_in_time);

-- 4. TABEL WORK_JOURNALS (Jurnal Aktivitas Harian Karyawan)
CREATE TABLE work_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendances(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL TALENT_CONSENTS (Audit Log Persetujuan UU PDP Lintas Tenant)
CREATE TABLE talent_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requester_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
