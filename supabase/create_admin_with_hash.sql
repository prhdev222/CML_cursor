-- ============================================================================
-- สร้าง Admin User พร้อม Hash Password จริง
-- ============================================================================
-- ไฟล์นี้ใช้สำหรับสร้าง admin user พร้อม hash password ที่ถูกต้อง
-- ต้องติดตั้ง pgcrypto extension ก่อน
-- ============================================================================

-- Enable pgcrypto extension (สำหรับ hash password)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ตรวจสอบว่าตาราง admins มีอยู่แล้ว
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง admin user พร้อม hash password จริง
-- Password: admin123
-- ใช้ bcrypt hash (10 rounds)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)))
ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('admin123', gen_salt('bf', 10)),
    updated_at = NOW();

-- ตรวจสอบผลลัพธ์
SELECT 
  id, 
  username, 
  created_at,
  'Password: admin123' as note
FROM admins 
WHERE username = 'admin';



