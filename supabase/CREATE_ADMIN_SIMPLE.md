# สร้าง Admin User เพียงอย่างเดียว

## 🎯 วิธีที่ง่ายที่สุด (แนะนำ) ⭐

### ใช้ API Endpoint

1. เริ่ม development server:
   ```bash
   npm run dev
   ```

2. เปิดเบราว์เซอร์:
   ```
   http://localhost:3001/api/admin/init
   ```

✅ **เสร็จแล้ว!** ไม่ต้อง hash password เอง

---

## 📝 วิธีที่ 2: ใช้ SQL (ถ้าไม่มี API)

### ตัวเลือก A: SQL แบบง่าย (Placeholder Hash)

ใช้ไฟล์: `create_admin_only.sql`

```sql
-- สร้าง admin user (hash เป็น placeholder)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq')
ON CONFLICT (username) DO NOTHING;
```

⚠️ **หมายเหตุ**: Hash นี้เป็น placeholder อาจ login ไม่ได้ ควรใช้ API endpoint แทน

---

### ตัวเลือก B: SQL พร้อม Hash จริง (ต้อง pgcrypto)

ใช้ไฟล์: `create_admin_with_hash.sql`

**ข้อกำหนด**: ต้องมี pgcrypto extension

```sql
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- สร้าง admin user พร้อม hash password จริง
INSERT INTO admins (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)))
ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('admin123', gen_salt('bf', 10));
```

✅ **Hash จริง**: Login ได้แน่นอน

---

## 🔍 ตรวจสอบผลลัพธ์

```sql
-- ตรวจสอบว่า admin user สร้างสำเร็จ
SELECT id, username, created_at 
FROM admins 
WHERE username = 'admin';
```

---

## 🔐 Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## ❓ FAQ

### Q: รันทับ admin เดิมได้ไหม?
**A**: ได้! ใช้ `ON CONFLICT DO NOTHING` จะไม่ทับ admin เดิม

### Q: ถ้า admin มีอยู่แล้วจะเกิดอะไร?
**A**: จะไม่ทำอะไร (DO NOTHING) admin เดิมยังอยู่

### Q: วิธีไหนดีที่สุด?
**A**: ใช้ API endpoint (`/api/admin/init`) จะง่ายและปลอดภัยที่สุด

### Q: ถ้าใช้ SQL แล้ว login ไม่ได้?
**A**: ใช้ API endpoint แทน หรือใช้ `create_admin_with_hash.sql` (ต้อง pgcrypto)

---

## 📋 สรุป

| วิธี | ง่าย | ปลอดภัย | แนะนำ |
|------|------|---------|-------|
| API Endpoint | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ ใช่ |
| SQL + pgcrypto | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ ใช่ |
| SQL + placeholder | ⭐⭐⭐⭐ | ⭐⭐ | ❌ ไม่ |

**แนะนำ**: ใช้ API endpoint (`/api/admin/init`) จะดีที่สุด! 🎉



