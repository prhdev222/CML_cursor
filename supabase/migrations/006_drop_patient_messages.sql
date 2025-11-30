-- Migration: Drop patient_messages table
-- Run this SQL in your Supabase SQL Editor if you want to remove the patient_messages table

-- Drop trigger first
DROP TRIGGER IF EXISTS update_patient_messages_updated_at ON patient_messages;

-- Drop the table
DROP TABLE IF EXISTS patient_messages;

