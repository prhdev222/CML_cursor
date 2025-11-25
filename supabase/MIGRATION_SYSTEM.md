# Migration System สำหรับ Production

## 📋 ระบบ Migration

### โครงสร้างไฟล์

```
supabase/
├── schema_production.sql          # Schema หลักสำหรับ production
├── migrations/
│   ├── 001_add_new_field.sql     # Migration 1
│   ├── 002_add_index.sql         # Migration 2
│   └── 003_update_policy.sql     # Migration 3
└── MIGRATION_SYSTEM.md           # คู่มือนี้
```

## 🚀 วิธีใช้งาน

### 1. สร้าง Database ใหม่ (ครั้งแรก)

```bash
# รัน schema หลัก
supabase/schema_production.sql
```

### 2. อัปเดต Database (เมื่อมีการเปลี่ยนแปลง)

```bash
# รัน migrations ตามลำดับ
supabase/migrations/001_add_new_field.sql
supabase/migrations/002_add_index.sql
# ... ตามลำดับ
```

### 3. ตรวจสอบ Schema Version

```sql
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY applied_at DESC;
```

## 📝 สร้าง Migration ใหม่

### Template สำหรับ Migration ใหม่

```sql
-- ============================================================================
-- Migration: [ชื่อ migration]
-- Version: [version ใหม่ เช่น 1.0.2]
-- ============================================================================

-- ทำการเปลี่ยนแปลง
DO $$
BEGIN
  -- ตรวจสอบก่อนทำ
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_name' AND column_name = 'column_name'
  ) THEN
    -- ทำการเปลี่ยนแปลง
    ALTER TABLE table_name ADD COLUMN column_name VARCHAR(255);
    RAISE NOTICE 'Migration applied successfully';
  ELSE
    RAISE NOTICE 'Migration already applied';
  END IF;
END $$;

-- Update schema version
INSERT INTO schema_migrations (version, description) 
VALUES ('1.0.2', 'Description of changes')
ON CONFLICT (version) DO NOTHING;
```

## ✅ Best Practices

1. **Idempotent**: Migration ต้องรันซ้ำได้โดยไม่เกิด error
2. **Versioning**: ใช้ version number ที่ชัดเจน
3. **Backward Compatible**: พยายามไม่ลบ column ที่มีข้อมูล
4. **Test First**: ทดสอบใน development ก่อน production
5. **Backup**: Backup database ก่อน migration

## 🔄 Rollback (ถ้าจำเป็น)

```sql
-- ตัวอย่าง rollback
ALTER TABLE patients DROP COLUMN IF EXISTS phone_number;
DELETE FROM schema_migrations WHERE version = '1.0.1';
```

## 📊 ตรวจสอบสถานะ

```sql
-- ดู migrations ที่รันแล้ว
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- ตรวจสอบโครงสร้างตาราง
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```



