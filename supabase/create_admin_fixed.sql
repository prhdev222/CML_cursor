-- ============================================================================
-- สร้าง Admin User พร้อม Password Hash จริง (แก้ไขแล้ว)
-- ============================================================================
-- ไฟล์นี้ใช้สำหรับสร้าง admin user พร้อม hash password ที่ถูกต้อง
-- Login ได้แน่นอน!
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

-- สร้างหรืออัปเดต admin user พร้อม hash password จริง
-- Password: admin123
INSERT INTO admins (username, password_hash, updated_at) 
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)), NOW())
ON CONFLICT (username) DO UPDATE 
SET 
  password_hash = crypt('admin123', gen_salt('bf', 10)),
  updated_at = NOW();

-- ตรวจสอบผลลัพธ์
SELECT 
  id, 
  username, 
  LEFT(password_hash, 30) || '...' as password_hash_preview,
  created_at,
  updated_at,
  '✅ Admin user ready! Username: admin, Password: admin123' as status
FROM admins 
WHERE username = 'admin';



