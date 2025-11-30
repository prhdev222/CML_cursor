-- Migration: Add baseline clinical data fields to patients table

-- RT PCR for BCR-ABL: positive/negative และ type (P190, P210, other)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_rq_pcr_bcr_abl_positive BOOLEAN;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_rq_pcr_bcr_abl_type VARCHAR(10); -- 'P190', 'P210', 'other'

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_rq_pcr_bcr_abl_other TEXT; -- ถ้าเลือก other

-- BM Chromosome: textarea สำหรับกรอกหลายตัว
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_bm_chromosome TEXT;

-- BM Chromosome Ph+ (%): แยกเป็นอีกช่องหนึ่ง
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_bm_ph_percent DECIMAL(5,2);

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_bm_blast_percent DECIMAL(5,2);

-- CBC: แยกเป็นแต่ละค่า
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_hb DECIMAL(5,2); -- g/dL

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_hct DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_wbc DECIMAL(10,2); -- x10^9/L

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_neutrophil DECIMAL(5,2); -- % (N)

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_lymphocyte DECIMAL(5,2); -- % (L)

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_basophil DECIMAL(5,2); -- % (Ba)

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_eosinophil DECIMAL(5,2); -- % (Eo)

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_myelocyte DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_promyelocyte DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_metamyelocyte DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_band DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_blast DECIMAL(5,2); -- %

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_cbc_platelet DECIMAL(10,2); -- x10^9/L (plt)

-- Spleen size: เป็นตัวเลข cm เท่านั้น
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_spleen_size DECIMAL(5,2); -- cm

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS baseline_other_sign_symptom TEXT;


