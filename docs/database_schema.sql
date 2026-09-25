-- 1. Membuat Tipe Enum untuk Role dan Status Presensi
CREATE TYPE user_role AS ENUM ('hrd', 'karyawan');
CREATE TYPE attendance_status AS ENUM ('hadir', 'terlambat', 'alfa');

-- 2. Membuat Tabel 'users'
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'karyawan',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Membuat Tabel 'attendances'
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    status attendance_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_attendances_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
        
    -- Constraint agar 1 user hanya memiliki 1 entri presensi per hari
    CONSTRAINT unique_user_date_attendance UNIQUE (user_id, date)
);

-- 4. Indeks Tambahan untuk Mengoptimalkan Performa Query
CREATE INDEX idx_attendances_user_id ON attendances(user_id);
CREATE INDEX idx_attendances_date ON attendances(date);
