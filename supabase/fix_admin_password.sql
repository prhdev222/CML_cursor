-- ============================================================================
-- แก้ไข Admin Password ให้ login ได้จริง
-- ============================================================================
-- ไฟล์นี้ใช้สำหรับแก้ไข password ของ admin user ให้ login ได้จริง
-- ใช้ pgcrypto extension เพื่อ hash password
-- ============================================================================

-- Enable pgcrypto extension (สำหรับ hash password)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- อัปเดต password ของ admin user
-- Password: admin123
-- ใช้ bcrypt hash (10 rounds)
UPDATE admins 
SET 
  password_hash = crypt('admin123', gen_salt('bf', 10)),
  updated_at = NOW()
WHERE username = 'admin';

-- ตรวจสอบผลลัพธ์
SELECT 
  id, 
  username, 
  LEFT(password_hash, 20) || '...' as password_hash_preview,
  updated_at,
  'Password updated successfully!' as status
FROM admins 
WHERE username = 'admin';

-- ถ้า admin user ยังไม่มี ให้สร้างใหม่
INSERT INTO admins (username, password_hash) 
SELECT 
  'admin',
  crypt('admin123', gen_salt('bf', 10))
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE username = 'admin'
);



