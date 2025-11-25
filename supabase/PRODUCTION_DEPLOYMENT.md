# Production Deployment Guide

## 🎯 สำหรับ Production และย้าย Database

### ไฟล์ที่ใช้

1. **`schema_production.sql`** - Schema หลัก (รันครั้งแรก)
2. **`migrations/*.sql`** - Migrations สำหรับอัปเดต

---

## 📋 ขั้นตอนการ Deploy

### 1. Backup Database เดิม (ถ้ามี)

```bash
# Export data
pg_dump -h [host] -U [user] -d [database] > backup.sql
```

### 2. สร้าง Database ใหม่

```sql
-- ใน Supabase Dashboard → SQL Editor
-- รัน schema_production.sql
```

### 3. Import ข้อมูลเดิม (ถ้ามี)

```bash
# Import data
psql -h [host] -U [user] -d [database] < backup.sql
```

### 4. รัน Migrations (ถ้ามี)

```sql
-- รัน migrations ตามลำดับ
-- migrations/001_add_new_field.sql
-- migrations/002_add_index.sql
-- ...
```

### 5. ตรวจสอบ

```sql
-- ตรวจสอบ schema version
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY applied_at DESC;

-- ตรวจสอบข้อมูล
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM hospitals;
```

---

## 🔄 Migration Workflow

### เมื่อมีการเปลี่ยนแปลง Schema

1. **สร้าง Migration File**:
   ```sql
   -- migrations/XXX_description.sql
   ```

2. **เขียน Migration**:
   - ใช้ `IF NOT EXISTS` เพื่อให้รันซ้ำได้
   - Update `schema_migrations` table

3. **Test ใน Development**:
   - รัน migration ใน dev database
   - ทดสอบว่าใช้งานได้

4. **Deploy to Production**:
   - Backup production database
   - รัน migration
   - ตรวจสอบผลลัพธ์

---

## ✅ Checklist สำหรับ Production

- [ ] Backup database ก่อน deploy
- [ ] ทดสอบ migration ใน development ก่อน
- [ ] ตรวจสอบ schema version
- [ ] ตรวจสอบข้อมูลสำคัญ
- [ ] ทดสอบ login admin
- [ ] ทดสอบ CRUD operations
- [ ] ตรวจสอบ RLS policies
- [ ] Monitor errors หลัง deploy

---

## 🆘 Rollback Plan

### ถ้า Migration ล้มเหลว

1. **Restore Backup**:
   ```bash
   psql -h [host] -U [user] -d [database] < backup.sql
   ```

2. **Remove Failed Migration**:
   ```sql
   DELETE FROM schema_migrations WHERE version = 'X.X.X';
   ```

3. **Fix Migration** และลองใหม่

---

## 📊 Monitoring

### ตรวจสอบหลัง Deploy

```sql
-- Schema version
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- Table counts
SELECT 
  'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'hospitals', COUNT(*) FROM hospitals
UNION ALL
SELECT 'admins', COUNT(*) FROM admins;

-- Recent data
SELECT * FROM patients ORDER BY created_at DESC LIMIT 10;
```

---

## 🔐 Security Checklist

- [ ] RLS policies ถูกต้อง
- [ ] Admin password เปลี่ยนจาก default
- [ ] Environment variables ตั้งค่าถูกต้อง
- [ ] API keys ไม่ commit ใน git
- [ ] Database connection ใช้ SSL

---

## 📝 Notes

- **Idempotent**: ทุก migration ต้องรันซ้ำได้
- **Versioning**: ใช้ semantic versioning (1.0.0, 1.0.1, ...)
- **Documentation**: เขียน comment ใน migration
- **Testing**: ทดสอบใน dev ก่อน production



