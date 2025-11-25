# 🏥 คู่มือการเข้าหน้าผู้ป่วย (Patient Portal)

## 📋 สำหรับ Admin/แพทย์

### ขั้นตอนที่ 1: Login เป็น Admin
1. ไปที่ URL: `http://localhost:3001/th/admin/login`
2. กรอกข้อมูล:
   - **Username:** `admin`
   - **Password:** `admin123`
3. กดปุ่ม "เข้าสู่ระบบ"

### ขั้นตอนที่ 2: ไปที่หน้า Admin → Patients
1. หลังจาก login สำเร็จ จะเข้าสู่หน้า Dashboard
2. คลิกเมนู **"จัดการผู้ป่วย"** (หรือไปที่ `/admin/patients`)
3. จะเห็นรายชื่อผู้ป่วยทั้งหมด

### ขั้นตอนที่ 3: สร้าง QR Code หรือ Link สำหรับผู้ป่วย
1. **หาผู้ป่วย** ที่ต้องการในตาราง
2. **คลิกปุ่ม QR Code** (ไอคอนสีเขียว) ในคอลัมน์ "จัดการ"
3. **Modal จะแสดงขึ้นมา** พร้อม:
   - QR Code สำหรับ scan
   - URL สำหรับเข้าถึง Patient Portal
   - ปุ่ม "บันทึกเป็นรูปภาพ" สำหรับดาวน์โหลด QR Code

### ขั้นตอนที่ 4: ส่งให้ผู้ป่วย
**วิธีที่ 1: ส่ง QR Code**
- คลิกปุ่ม "บันทึกเป็นรูปภาพ"
- ส่งรูปภาพ QR Code ให้ผู้ป่วยผ่าน:
  - SMS
  - Email
  - Line
  - เอกสารพิมพ์

**วิธีที่ 2: ส่ง Link**
- คัดลอก URL จาก Modal
- ส่งให้ผู้ป่วยผ่าน SMS/Email/Line
- ตัวอย่าง URL: `http://localhost:3001/th/patient/P001`

---

## 👤 สำหรับผู้ป่วย

### ขั้นตอนที่ 1: เข้าถึง Patient Portal

**วิธีที่ 1: Scan QR Code**
1. เปิดแอป Camera หรือ QR Code Scanner
2. Scan QR Code ที่ได้รับจากแพทย์
3. จะเปิดหน้า Patient Portal อัตโนมัติ

**วิธีที่ 2: ใช้ Link**
1. คลิก Link ที่ได้รับจากแพทย์
2. หรือพิมพ์ URL ใน browser:
   ```
   http://localhost:3001/th/patient/[รหัสผู้ป่วย]
   ```
   ตัวอย่าง: `http://localhost:3001/th/patient/P001`

### ขั้นตอนที่ 2: ตั้งรหัสผ่าน (ครั้งแรกเท่านั้น)

ถ้าเป็นครั้งแรกที่เข้าดู:
1. ระบบจะแสดงหน้า "ตั้งรหัสผ่าน"
2. กรอกรหัสผ่านใหม่:
   - อย่างน้อย 6 ตัวอักษร
   - แนะนำให้ใช้รหัสผ่านที่จำง่ายแต่ปลอดภัย
3. ยืนยันรหัสผ่านอีกครั้ง
4. กดปุ่ม "บันทึก"
5. ระบบจะนำไปหน้า Login อัตโนมัติ

### ขั้นตอนที่ 3: Login

1. กรอก **รหัสผู้ป่วย** (Patient ID)
2. กรอก **รหัสผ่าน** ที่ตั้งไว้
3. กดปุ่ม "เข้าสู่ระบบ"
4. เข้าสู่ Patient Portal สำเร็จ!

### ขั้นตอนที่ 4: ดูข้อมูล

ผู้ป่วยจะเห็น:
- ✅ **ข้อมูลส่วนตัว** (ชื่อ, อายุ, เพศ, โรงพยาบาล)
- ✅ **ยาที่ใช้อยู่** (TKI ปัจจุบัน, ผลข้างเคียง, การติดตามผล)
- ✅ **กราฟ RQ-PCR for BCR-ABL1** (พร้อมเส้นเตือน)
- ✅ **วันนัดครั้งต่อไป** (พร้อมหมายเหตุจากแพทย์)
- ✅ **ช่วงเวลาที่ควรเจาะ RQ-PCR**
- ✅ **การปฏิบัติตัว**

---

## 🔒 ถ้าลืมรหัสผ่าน

### สำหรับผู้ป่วย:
1. ติดต่อแพทย์หรือเจ้าหน้าที่
2. แจ้งรหัสผู้ป่วย
3. แพทย์จะทำการ Reset Password ให้

### สำหรับ Admin:
1. Login เป็น Admin
2. ไปที่ Admin → Patients
3. หาผู้ป่วยที่ต้องการ
4. คลิกปุ่ม "Reset Password" (ไอคอนสีม่วง)
5. กรอกรหัสผ่านใหม่
6. กดปุ่ม "บันทึก"
7. แจ้งรหัสผ่านใหม่ให้ผู้ป่วย

---

## 📱 ตัวอย่าง URL

### Development (Local)
```
http://localhost:3001/th/patient/P001
http://localhost:3001/en/patient/P001
```

### Production (เมื่อ deploy แล้ว)
```
https://yourdomain.com/th/patient/P001
https://yourdomain.com/en/patient/P001
```

---

## 💡 Tips

### สำหรับ Admin:
- ✅ สร้าง QR Code ทุกครั้งที่เพิ่มผู้ป่วยใหม่
- ✅ พิมพ์ QR Code ในเอกสารให้ผู้ป่วย
- ✅ ส่ง Link ผ่าน SMS/Email เพื่อความสะดวก
- ✅ บันทึก QR Code เป็นรูปภาพไว้ในระบบ

### สำหรับผู้ป่วย:
- ✅ Bookmark URL ของตัวเองไว้ใน browser
- ✅ ตรวจสอบข้อมูลเป็นประจำ
- ✅ ติดตามวันนัดและช่วงเวลาที่ควรเจาะเลือด
- ✅ เก็บรหัสผ่านไว้ในที่ปลอดภัย

---

## 🆘 ปัญหาที่พบบ่อย

### ❌ เข้าหน้า Patient Portal ไม่ได้
**สาเหตุ:**
- รหัสผู้ป่วยไม่ถูกต้อง
- URL ไม่ถูกต้อง

**วิธีแก้:**
- ตรวจสอบรหัสผู้ป่วยในระบบ Admin
- ตรวจสอบ URL ว่าถูกต้องหรือไม่

### ❌ ลืมรหัสผ่าน
**วิธีแก้:**
- ติดต่อแพทย์เพื่อ Reset Password
- หรือ Admin ทำการ Reset Password ให้

### ❌ QR Code scan ไม่ได้
**สาเหตุ:**
- QR Code ไม่ชัด
- ใช้ localhost ซึ่งเครื่องอื่น scan ไม่ได้

**วิธีแก้:**
- ตั้งค่า `NEXT_PUBLIC_BASE_URL` ใน `.env.local` เป็น IP address ของเครื่อง
- ดูคู่มือใน `LAN_QR_CODE_GUIDE.md`

---

## 📝 Checklist

### สำหรับ Admin:
- [ ] Login เป็น Admin สำเร็จ
- [ ] ไปที่หน้า Admin → Patients
- [ ] หาผู้ป่วยที่ต้องการ
- [ ] คลิกปุ่ม QR Code
- [ ] ดาวน์โหลด QR Code หรือคัดลอก Link
- [ ] ส่งให้ผู้ป่วย

### สำหรับผู้ป่วย:
- [ ] ได้รับ QR Code หรือ Link จากแพทย์
- [ ] Scan QR Code หรือคลิก Link
- [ ] ตั้งรหัสผ่าน (ครั้งแรก)
- [ ] Login ด้วยรหัสผู้ป่วยและรหัสผ่าน
- [ ] ดูข้อมูลของตัวเองได้

---

## 🔗 Related Files

- `app/[locale]/patient/[patientId]/page.tsx` - Patient Portal Page
- `app/[locale]/patient/[patientId]/login/page.tsx` - Patient Login Page
- `app/[locale]/patient/[patientId]/set-password/page.tsx` - Set Password Page
- `components/admin/PatientQRCode.tsx` - QR Code Component
- `app/[locale]/admin/patients/page.tsx` - Admin Patients Page

---

## ✅ สรุป

**สำหรับ Admin:**
1. Login → Admin → Patients
2. คลิก QR Code ของผู้ป่วย
3. ส่ง QR Code หรือ Link ให้ผู้ป่วย

**สำหรับผู้ป่วย:**
1. Scan QR Code หรือคลิก Link
2. ตั้งรหัสผ่าน (ครั้งแรก)
3. Login และดูข้อมูล

**เสร็จแล้ว!** 🎉



