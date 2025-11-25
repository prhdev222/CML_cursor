-- ============================================================================
-- CML Management System - Mock Data สำหรับทดสอบ
-- ============================================================================
-- ข้อมูลจำลองนี้ใช้สำหรับทดสอบการแสดงผลในระบบ
-- สามารถรัน script นี้ใน Supabase SQL Editor เพื่อเพิ่มข้อมูลตัวอย่าง
-- ============================================================================

-- 1. เพิ่มโรงพยาบาล (Hospitals)
-- ============================================================================
INSERT INTO hospitals (name, created_at, updated_at)
VALUES 
  ('โรงพยาบาลจุฬาลงกรณ์', NOW(), NOW()),
  ('โรงพยาบาลรามาธิบดี', NOW(), NOW()),
  ('โรงพยาบาลศิริราช', NOW(), NOW()),
  ('โรงพยาบาลพระมงกุฎเกล้า', NOW(), NOW()),
  ('โรงพยาบาลราชวิถี', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. เพิ่มผู้ป่วย (Patients) - ข้อมูลครบถ้วน
-- ============================================================================
-- ผู้ป่วยที่ 1: มีข้อมูลครบถ้วน พร้อมผลการตรวจ
INSERT INTO patients (
  patient_id,
  name,
  age,
  gender,
  diagnosis_date,
  hospital_id,
  current_tki,
  phase,
  next_appointment_date,
  next_appointment_notes,
  next_rq_pcr_date_range_start,
  next_rq_pcr_date_range_end,
  created_at,
  updated_at
)
SELECT 
  'P001',
  'สมชาย ใจดี',
  45,
  'male',
  '2023-01-15',
  h.id,
  'imatinib',
  'chronic',
  '2025-12-15',
  'นัดตรวจ CBC และ RQ-PCR\nตรวจตับ\nถ้ามีอาการผิดปกติให้แจ้งแพทย์',
  '2025-12-10',
  '2025-12-20',
  NOW(),
  NOW()
FROM hospitals h
WHERE h.name = 'โรงพยาบาลจุฬาลงกรณ์'
LIMIT 1
ON CONFLICT (patient_id) DO NOTHING;

-- ผู้ป่วยที่ 2: มีข้อมูลครบถ้วน พร้อมผลการตรวจหลายครั้ง
INSERT INTO patients (
  patient_id,
  name,
  age,
  gender,
  diagnosis_date,
  hospital_id,
  current_tki,
  phase,
  next_appointment_date,
  next_appointment_notes,
  next_rq_pcr_date_range_start,
  next_rq_pcr_date_range_end,
  created_at,
  updated_at
)
SELECT 
  'P002',
  'สมหญิง รักสุขภาพ',
  38,
  'female',
  '2022-06-20',
  h.id,
  'nilotinib',
  'chronic',
  '2025-11-30',
  'นัดตรวจ ECG\nตรวจ CBC และ RQ-PCR\nตรวจไขมันในเลือด',
  '2025-11-25',
  '2025-12-05',
  NOW(),
  NOW()
FROM hospitals h
WHERE h.name = 'โรงพยาบาลรามาธิบดี'
LIMIT 1
ON CONFLICT (patient_id) DO NOTHING;

-- ผู้ป่วยที่ 3: มีข้อมูลพื้นฐาน แต่ยังไม่มีผลการตรวจ
INSERT INTO patients (
  patient_id,
  name,
  age,
  gender,
  diagnosis_date,
  hospital_id,
  current_tki,
  phase,
  next_appointment_date,
  next_appointment_notes,
  created_at,
  updated_at
)
SELECT 
  'P003',
  'วิชัย สุขภาพดี',
  52,
  'male',
  '2024-03-10',
  h.id,
  'dasatinib',
  'chronic',
  '2025-12-20',
  'นัดตรวจ CBC\nถ้ามีอาการหายใจลำบากให้แจ้งแพทย์ทันที',
  NOW(),
  NOW()
FROM hospitals h
WHERE h.name = 'โรงพยาบาลศิริราช'
LIMIT 1
ON CONFLICT (patient_id) DO NOTHING;

-- ผู้ป่วยที่ 4: ผู้ป่วยใหม่ เพิ่งวินิจฉัย
INSERT INTO patients (
  patient_id,
  name,
  age,
  gender,
  diagnosis_date,
  hospital_id,
  current_tki,
  phase,
  created_at,
  updated_at
)
SELECT 
  '68123456',
  'นางสาวมาลี ดีใจ',
  35,
  'female',
  '2025-10-01',
  h.id,
  'imatinib',
  'chronic',
  NOW(),
  NOW()
FROM hospitals h
WHERE h.name = 'โรงพยาบาลจุฬาลงกรณ์'
LIMIT 1
ON CONFLICT (patient_id) DO NOTHING;

-- ผู้ป่วยที่ 5: ผู้ป่วยที่มีค่าผิดปกติ (ต้องเปลี่ยนยา)
INSERT INTO patients (
  patient_id,
  name,
  age,
  gender,
  diagnosis_date,
  hospital_id,
  current_tki,
  phase,
  next_appointment_date,
  next_appointment_notes,
  next_rq_pcr_date_range_start,
  next_rq_pcr_date_range_end,
  created_at,
  updated_at
)
SELECT 
  'P005',
  'ประเสริฐ ต้องระวัง',
  60,
  'male',
  '2021-08-05',
  h.id,
  'imatinib',
  'chronic',
  '2025-12-10',
  'นัดปรึกษาเรื่องการเปลี่ยนยา\nค่า RQ-PCR สูงเกินเกณฑ์',
  '2025-12-05',
  '2025-12-15',
  NOW(),
  NOW()
FROM hospitals h
WHERE h.name = 'โรงพยาบาลพระมงกุฎเกล้า'
LIMIT 1
ON CONFLICT (patient_id) DO NOTHING;

-- 3. เพิ่มผลการตรวจ RQ-PCR (Test Results)
-- ============================================================================

-- ผลการตรวจสำหรับผู้ป่วย P001 (มีหลายครั้ง)
INSERT INTO test_results (
  patient_id,
  test_date,
  test_type,
  bcr_abl_is,
  status,
  created_at
)
VALUES 
  ('P001', '2023-02-15', 'RQ-PCR', 45.5, 'failure', NOW()),
  ('P001', '2023-05-15', 'RQ-PCR', 12.3, 'failure', NOW()),
  ('P001', '2023-08-15', 'RQ-PCR', 3.2, 'warning', NOW()),
  ('P001', '2023-11-15', 'RQ-PCR', 0.8, 'optimal', NOW()),
  ('P001', '2024-02-15', 'RQ-PCR', 0.15, 'optimal', NOW()),
  ('P001', '2024-05-15', 'RQ-PCR', 0.08, 'optimal', NOW()),
  ('P001', '2024-08-15', 'RQ-PCR', 0.05, 'optimal', NOW()),
  ('P001', '2024-11-15', 'RQ-PCR', 0.03, 'optimal', NOW()),
  ('P001', '2025-02-15', 'RQ-PCR', 0.02, 'optimal', NOW()),
  ('P001', '2025-05-15', 'RQ-PCR', 0.015, 'optimal', NOW()),
  ('P001', '2025-08-15', 'RQ-PCR', 0.012, 'optimal', NOW())
ON CONFLICT DO NOTHING;

-- ผลการตรวจสำหรับผู้ป่วย P002 (มีหลายครั้ง)
INSERT INTO test_results (
  patient_id,
  test_date,
  test_type,
  bcr_abl_is,
  status,
  created_at
)
VALUES 
  ('P002', '2022-07-20', 'RQ-PCR', 38.2, 'failure', NOW()),
  ('P002', '2022-10-20', 'RQ-PCR', 8.5, 'failure', NOW()),
  ('P002', '2023-01-20', 'RQ-PCR', 1.2, 'warning', NOW()),
  ('P002', '2023-04-20', 'RQ-PCR', 0.25, 'optimal', NOW()),
  ('P002', '2023-07-20', 'RQ-PCR', 0.12, 'optimal', NOW()),
  ('P002', '2023-10-20', 'RQ-PCR', 0.06, 'optimal', NOW()),
  ('P002', '2024-01-20', 'RQ-PCR', 0.04, 'optimal', NOW()),
  ('P002', '2024-04-20', 'RQ-PCR', 0.025, 'optimal', NOW()),
  ('P002', '2024-07-20', 'RQ-PCR', 0.018, 'optimal', NOW()),
  ('P002', '2024-10-20', 'RQ-PCR', 0.015, 'optimal', NOW()),
  ('P002', '2025-01-20', 'RQ-PCR', 0.01, 'optimal', NOW()),
  ('P002', '2025-04-20', 'RQ-PCR', 0.008, 'optimal', NOW()),
  ('P002', '2025-07-20', 'RQ-PCR', 0.006, 'optimal', NOW())
ON CONFLICT DO NOTHING;

-- ผลการตรวจสำหรับผู้ป่วย P005 (ค่าสูงเกินเกณฑ์)
INSERT INTO test_results (
  patient_id,
  test_date,
  test_type,
  bcr_abl_is,
  status,
  created_at
)
VALUES 
  ('P005', '2021-09-05', 'RQ-PCR', 42.8, 'failure', NOW()),
  ('P005', '2021-12-05', 'RQ-PCR', 15.6, 'failure', NOW()),
  ('P005', '2022-03-05', 'RQ-PCR', 8.2, 'failure', NOW()),
  ('P005', '2022-06-05', 'RQ-PCR', 4.5, 'warning', NOW()),
  ('P005', '2022-09-05', 'RQ-PCR', 2.1, 'warning', NOW()),
  ('P005', '2022-12-05', 'RQ-PCR', 1.5, 'warning', NOW()),
  ('P005', '2023-03-05', 'RQ-PCR', 1.2, 'warning', NOW()),
  ('P005', '2023-06-05', 'RQ-PCR', 1.8, 'warning', NOW()),
  ('P005', '2023-09-05', 'RQ-PCR', 2.5, 'warning', NOW()),
  ('P005', '2023-12-05', 'RQ-PCR', 3.2, 'warning', NOW()),
  ('P005', '2024-03-05', 'RQ-PCR', 4.1, 'warning', NOW()),
  ('P005', '2024-06-05', 'RQ-PCR', 5.8, 'failure', NOW()),
  ('P005', '2024-09-05', 'RQ-PCR', 7.2, 'failure', NOW()),
  ('P005', '2024-12-05', 'RQ-PCR', 8.5, 'failure', NOW()),
  ('P005', '2025-03-05', 'RQ-PCR', 9.8, 'failure', NOW()),
  ('P005', '2025-06-05', 'RQ-PCR', 12.3, 'failure', NOW()),
  ('P005', '2025-09-05', 'RQ-PCR', 15.6, 'failure', NOW())
ON CONFLICT DO NOTHING;

-- 4. เพิ่มแนวทาง (Guidelines)
-- ============================================================================
INSERT INTO guidelines (
  title_en,
  title_th,
  description_en,
  description_th,
  url,
  icon,
  organization,
  is_active,
  sort_order,
  created_at,
  updated_at
)
VALUES 
  (
    'NCCN Guidelines for CML',
    'แนวทาง NCCN สำหรับ CML',
    'Clinical practice guidelines from National Comprehensive Cancer Network for CML management',
    'แนวทางปฏิบัติทางคลินิกจาก National Comprehensive Cancer Network สำหรับการจัดการ CML',
    'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1507',
    'book',
    'NCCN',
    true,
    1,
    NOW(),
    NOW()
  ),
  (
    'ELN 2020 Recommendations',
    'คำแนะนำ ELN 2020',
    'Recommendations from European LeukemiaNet 2020 for CML management',
    'คำแนะนำจาก European LeukemiaNet 2020 สำหรับการจัดการ CML',
    'https://ashpublications.org/blood/article/135/23/2031/454998/European-LeukemiaNet-2020-recommendations-for',
    'book-open',
    'ELN',
    true,
    2,
    NOW(),
    NOW()
  ),
  (
    'Thai Society of Hematology Guidelines',
    'แนวทางสมาคมโลหิตวิทยาประเทศไทย',
    'Clinical practice guidelines for CML management from Thai Society of Hematology',
    'แนวทางปฏิบัติทางคลินิกสำหรับการจัดการ CML จากสมาคมโลหิตวิทยาประเทศไทย',
    'https://www.thaihematology.org/guidelines',
    'heart',
    'Thai Society of Hematology',
    true,
    3,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- 5. เพิ่มโปรโตคอลการรักษา (Protocols)
-- ============================================================================

-- โปรโตคอลการเปลี่ยนยา TKI
INSERT INTO protocols (
  protocol_type,
  title_en,
  title_th,
  content_en,
  content_th,
  is_active,
  created_at,
  updated_at
)
VALUES 
  (
    'tki_switch',
    'TKI Switching Protocol',
    'โปรโตคอลการเปลี่ยนยา TKI',
    'When to switch TKI:\n1. Molecular failure: BCR-ABL1 IS > 1.0% after 12 months\n2. Intolerance: Severe side effects\n3. Resistance: Loss of response\n\nSwitching options:\n- Imatinib → Nilotinib or Dasatinib\n- Nilotinib → Dasatinib or Ponatinib\n- Dasatinib → Nilotinib or Ponatinib',
    'เมื่อไหร่ควรเปลี่ยนยา TKI:\n1. ความล้มเหลวทางโมเลกุล: ค่า BCR-ABL1 IS > 1.0% หลัง 12 เดือน\n2. ทนยาไม่ได้: ผลข้างเคียงรุนแรง\n3. ดื้อยา: สูญเสียการตอบสนอง\n\nตัวเลือกการเปลี่ยนยา:\n- Imatinib → Nilotinib หรือ Dasatinib\n- Nilotinib → Dasatinib หรือ Ponatinib\n- Dasatinib → Nilotinib หรือ Ponatinib',
    true,
    NOW(),
    NOW()
  ),
  (
    'blood_test',
    'Blood Test Monitoring Protocol',
    'โปรโตคอลการตรวจเลือด',
    'Monitoring schedule:\n1. CBC: Every 15 days for first 3 months, then monthly\n2. RQ-PCR for BCR-ABL1: Every 3 months\n3. Liver function: Every 3 months\n4. Lipid profile: Every 6 months (for Nilotinib)\n5. ECG: Before starting Nilotinib, then annually',
    'ตารางการติดตามผล:\n1. CBC: ทุก 15 วันใน 3 เดือนแรก จากนั้นทุกเดือน\n2. RQ-PCR for BCR-ABL1: ทุก 3 เดือน\n3. ตรวจตับ: ทุก 3 เดือน\n4. ตรวจไขมันในเลือด: ทุก 6 เดือน (สำหรับ Nilotinib)\n5. ECG: ก่อนเริ่ม Nilotinib จากนั้นทุกปี',
    true,
    NOW(),
    NOW()
  ),
  (
    'bone_marrow',
    'Bone Marrow Examination Protocol',
    'โปรโตคอลการเจาะไขกระดูก',
    'When to perform bone marrow examination:\n1. At diagnosis: Baseline cytogenetics\n2. At 6 months: Check for CCyR\n3. At 12 months: Confirm MMR\n4. If loss of response: Re-evaluate\n5. If progression: Full workup',
    'เมื่อไหร่ควรเจาะไขกระดูก:\n1. ตอนวินิจฉัย: Baseline cytogenetics\n2. ที่ 6 เดือน: ตรวจ CCyR\n3. ที่ 12 เดือน: ยืนยัน MMR\n4. ถ้าสูญเสียการตอบสนอง: ประเมินใหม่\n5. ถ้าโรคลุกลาม: ตรวจครบถ้วน',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- 6. เพิ่ม Admin (ถ้ายังไม่มี)
-- ============================================================================
-- ใช้ bcrypt hash สำหรับ password "admin123"
-- Hash: $2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq
-- แต่ควรใช้ API endpoint /api/admin/init แทน

-- ============================================================================
-- สรุปข้อมูลที่เพิ่ม
-- ============================================================================
-- ✅ โรงพยาบาล: 5 แห่ง
-- ✅ ผู้ป่วย: 5 คน (P001, P002, P003, 68123456, P005)
-- ✅ ผลการตรวจ RQ-PCR: 41 ครั้ง
-- ✅ แนวทาง: 3 แนวทาง
-- ✅ โปรโตคอล: 3 โปรโตคอล
-- ============================================================================
