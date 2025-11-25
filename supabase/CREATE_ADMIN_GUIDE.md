# คู่มือการสร้าง Admin User

## 🎯 วิธีที่ง่ายที่สุด (แนะนำ) ⭐

### ใช้ API Endpoint

1. **รัน schema ก่อน** (ถ้ายังไม่รัน):
   - รัน `schema_complete.sql` ใน Supabase

2. **เริ่ม development server**:
   ```bash
   npm run dev
   ```

3. **เปิดเบราว์เซอร์**:
   - ไปที่: `http://localhost:3001/api/admin/init`
   - หรือใช้ curl:
     ```bash
     curl http://localhost:3001/api/admin/init
     ```

4. **ผลลัพธ์**:
   - จะสร้าง admin user อัตโนมัติ
   - Username: `admin`
   - Password: `admin123`
   - Password จะถูก hash ด้วย bcrypt อัตโนมัติ

✅ **เสร็จแล้ว!** สามารถ login ได้เลย

---

## 🔧 วิธีที่ 2: ใช้ SQL โดยตรง

### ขั้นตอนที่ 1: Hash Password

ต้อง hash password `admin123` ด้วย bcrypt ก่อน

#### วิธีที่ 2.1: ใช้ Node.js Script

สร้างไฟล์ `hash-password.js`:

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash:', hash);
  console.log('\nSQL Command:');
  console.log(`INSERT INTO admins (username, password_hash) VALUES ('admin', '${hash}') ON CONFLICT (username) DO NOTHING;`);
}

hashPassword();
```

รัน:
```bash
node hash-password.js
```

#### วิธีที่ 2.2: ใช้ Online Tool

1. ไปที่: https://bcrypt-generator.com/
2. ใส่ password: `admin123`
3. Rounds: `10`
4. คัดลอก hash ที่ได้

#### วิธีที่ 2.3: ใช้ Supabase Function (ถ้ามี)

```sql
-- สร้าง function สำหรับ hash password
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- ต้องติดตั้ง pgcrypto extension ก่อน
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- ใช้ function
INSERT INTO admins (username, password_hash) 
VALUES ('admin', hash_password('admin123'))
ON CONFLICT (username) DO NOTHING;
```

### ขั้นตอนที่ 2: รัน SQL

หลังจากได้ hash แล้ว:

```sql
-- แทนที่ YOUR_HASH_HERE ด้วย hash ที่ได้
INSERT INTO admins (username, password_hash) 
VALUES ('admin', 'YOUR_HASH_HERE')
ON CONFLICT (username) DO NOTHING;
```

---

## 📝 ตัวอย่าง Hash ที่ถูกต้อง

Password: `admin123`  
Hash (bcrypt, rounds=10): `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

**หมายเหตุ**: Hash นี้เป็นตัวอย่าง ควรสร้างใหม่ทุกครั้งเพื่อความปลอดภัย

---

## ✅ ตรวจสอบว่า Admin User สร้างสำเร็จ

```sql
-- ตรวจสอบ admin user
SELECT id, username, created_at FROM admins WHERE username = 'admin';

-- ควรเห็นผลลัพธ์:
-- id | username | created_at
-- ---|----------|------------
-- ...| admin    | 2025-01-...
```

---

## 🔐 เปลี่ยน Password Admin

### วิธีที่ 1: ใช้ API (ถ้ามี endpoint)

### วิธีที่ 2: ใช้ SQL

1. Hash password ใหม่ (เช่น `newpassword123`)
2. รัน SQL:

```sql
UPDATE admins 
SET password_hash = 'NEW_HASH_HERE', updated_at = NOW()
WHERE username = 'admin';
```

---

## 🚨 Troubleshooting

### Error: relation "admins" does not exist
- **แก้ไข**: รัน `schema_complete.sql` ก่อน

### Error: duplicate key value violates unique constraint
- **หมายความ**: Admin user มีอยู่แล้ว
- **แก้ไข**: ไม่ต้องทำอะไร หรือใช้ `ON CONFLICT DO NOTHING`

### Login ไม่ได้
- **ตรวจสอบ**: Password hash ถูกต้องหรือไม่
- **แก้ไข**: ลบ admin เดิมและสร้างใหม่:
  ```sql
  DELETE FROM admins WHERE username = 'admin';
  -- แล้วสร้างใหม่ด้วยวิธีข้างบน
  ```

---

## 💡 คำแนะนำ

1. **ใช้ API Endpoint** (`/api/admin/init`) จะง่ายที่สุด
2. **เปลี่ยน password ทันที** หลังจาก login ครั้งแรก
3. **เก็บ password hash ไว้เป็นความลับ** ไม่ควร commit ลง git
4. **ใช้ environment variables** สำหรับ production

---

## 📚 ข้อมูลเพิ่มเติม

- Bcrypt: https://en.wikipedia.org/wiki/Bcrypt
- Supabase Auth: https://supabase.com/docs/guides/auth
- Password Security: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html



