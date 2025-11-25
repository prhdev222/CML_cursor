# 🔧 แก้ไข Error: relation "schema_migrations" does not exist

## ❌ ปัญหา

เมื่อรัน migration `002_add_patient_password.sql` ได้ error:
```
ERROR: 42P01: relation "schema_migrations" does not exist
```

## ✅ วิธีแก้ไข

### วิธีที่ 1: ใช้ Standalone Version (แนะนำ)

ใช้ไฟล์: `002_add_patient_password_standalone.sql`

ไฟล์นี้จะสร้างตาราง `schema_migrations` ก่อนถ้ายังไม่มี

**ขั้นตอน:**
1. เปิด Supabase Dashboard → SQL Editor
2. คัดลอกเนื้อหาทั้งหมดจาก `002_add_patient_password_standalone.sql`
3. วางและคลิก **Run**

### วิธีที่ 2: สร้าง schema_migrations ก่อน

รัน SQL นี้ก่อน:

```sql
-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

แล้วค่อยรัน `002_add_patient_password.sql`

### วิธีที่ 3: รัน schema_production.sql ก่อน

ถ้ายังไม่ได้รัน schema หลัก:

1. รัน `schema_production.sql` ก่อน (จะสร้าง schema_migrations ให้อัตโนมัติ)
2. แล้วค่อยรัน `002_add_patient_password.sql`

---

## 🔍 ตรวจสอบผลลัพธ์

หลังจากรัน migration สำเร็จ:

```sql
-- ตรวจสอบว่า schema_migrations table มีอยู่
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- ตรวจสอบว่า password_hash column มีอยู่
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'password_hash';
```

---

## ✅ ควรเห็นผลลัพธ์

### schema_migrations table:
```
version | description                          | applied_at
--------|--------------------------------------|------------
1.0.2   | Add password fields to patients table| 2025-01-...
```

### patients table columns:
```
column_name            | data_type
-----------------------|-----------
password_hash          | character varying
password_reset_token   | character varying
password_reset_expires | timestamp with time zone
```

---

## 📝 หมายเหตุ

- Migration file ปกติ (`002_add_patient_password.sql`) คาดหวังว่า `schema_migrations` จะมีอยู่แล้ว
- Standalone version (`002_add_patient_password_standalone.sql`) จะสร้างให้อัตโนมัติ
- **แนะนำใช้ standalone version** จะปลอดภัยกว่า



