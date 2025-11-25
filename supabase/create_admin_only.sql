-- ============================================================================
-- สร้าง Admin User เท่านั้น
-- ============================================================================
-- ไฟล์นี้ใช้สำหรับสร้าง admin user เพียงอย่างเดียว
-- ไม่ทับ schema หรือข้อมูลอื่นๆ
-- ============================================================================

-- ตรวจสอบว่าตาราง admins มีอยู่แล้ว
-- ถ้ายังไม่มี ให้สร้างตารางก่อน
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง admin user
-- Password: admin123
-- ⚠️ หมายเหตุ: Hash นี้เป็น placeholder อาจ login ไม่ได้!
-- ✅ แนะนำให้ใช้ API endpoint /api/admin/init เพื่อ hash password อัตโนมัติ
-- หรือใช้ create_admin_fixed.sql แทน

-- Enable pgcrypto extension (สำหรับ hash password จริง)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- สร้าง admin user พร้อม hash password จริง
INSERT INTO admins (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)))
ON CONFLICT (username) DO UPDATE 
SET 
  password_hash = crypt('admin123', gen_salt('bf', 10)),
  updated_at = NOW();

-- ตรวจสอบผลลัพธ์
SELECT 
  id, 
  username, 
  created_at,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password hash exists'
    ELSE 'No password hash'
  END as status
FROM admins 
WHERE username = 'admin';

