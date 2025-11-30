import { supabase } from './supabase';

interface TestResult {
  patient_id: string;
  test_date: string;
  bcr_abl_is: number;
  test_type: string;
  status: string;
}

interface Patient {
  patient_id: string;
  diagnosis_date: string;
}

interface AlertData {
  patient_id: string;
  alert_type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  test_date?: string;
  bcr_abl_is?: number;
  color_name?: string;
  needs_mutation?: boolean;
}

/**
 * Generate alerts based on test results
 */
export async function generateAlertsForTestResult(
  testResult: TestResult,
  patient: Patient
): Promise<void> {
  try {
    // Only generate alerts for RQ-PCR for BCR-ABL tests
    if (testResult.test_type !== 'RQ-PCR for BCR-ABL' || !testResult.bcr_abl_is) {
      return;
    }

    const months = getMonthsSinceDiagnosis(testResult.test_date, patient.diagnosis_date);
    
    // Skip if less than 3 months
    if (months < 3) {
      return;
    }

    const value = testResult.bcr_abl_is;
    const colorName = getCMLColorName(value, months);
    const needsMutation = shouldCheckMutation(value, months);
    const elnStatus = getELNResponseStatus(value, months);

    const alerts: AlertData[] = [];

    // ถ้าเป็น RED: สร้างแค่ tki_switch_recommended (ครอบคลุมทั้ง non-optimal และการเปลี่ยนยา)
    // ถ้าไม่ใช่ RED และไม่ใช่ GREEN: สร้าง non_optimal_result
    if (colorName === 'RED') {
      // RED: สร้างแค่ tki_switch_recommended (ไม่สร้าง non_optimal_result เพื่อไม่ให้ซ้ำ)
      alerts.push({
        patient_id: testResult.patient_id,
        alert_type: 'tki_switch_recommended',
        message: `พิจารณาเปลี่ยนยา! ผลการตรวจแสดง TKI-resistant disease (${value.toFixed(4)}%)`,
        severity: 'high',
        test_date: testResult.test_date,
        bcr_abl_is: value,
        color_name: 'RED',
        needs_mutation: needsMutation,
      });
    } else if (colorName !== 'GREEN') {
      // Non-optimal แต่ไม่ใช่ RED (YELLOW, ORANGE, LIGHT GREEN)
      let message = `ผลการตรวจ RQ-PCR for BCR-ABL ไม่ได้ optimal (${colorName}): ${value.toFixed(4)}%`;
      let severity: 'high' | 'medium' | 'low' = 'medium';

      if (colorName === 'YELLOW' || colorName === 'ORANGE') {
        severity = 'medium';
      } else if (colorName === 'LIGHT GREEN') {
        severity = 'low';
      }

      alerts.push({
        patient_id: testResult.patient_id,
        alert_type: 'non_optimal_result',
        message,
        severity,
        test_date: testResult.test_date,
        bcr_abl_is: value,
        color_name: colorName,
        needs_mutation: needsMutation,
      });
    }

    // Alert: Mutation testing needed (สร้างแยกต่างหาก)
    if (needsMutation) {
      alerts.push({
        patient_id: testResult.patient_id,
        alert_type: 'mutation_test_needed',
        message: `ควรเจาะตรวจ BCR::ABL1 TKD Mutation - ผลการตรวจไม่ผ่าน milestone ที่กำหนด (${value.toFixed(4)}%)`,
        severity: 'high',
        test_date: testResult.test_date,
        bcr_abl_is: value,
        color_name: colorName,
        needs_mutation: true,
      });
    }

    // Insert alerts into database
    for (const alert of alerts) {
      // Check if similar alert already exists (to avoid duplicates)
      const { data: existingAlerts } = await (supabase
        .from('alerts') as any)
        .select('id')
        .eq('patient_id', alert.patient_id)
        .eq('alert_type', alert.alert_type)
        .eq('resolved', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!existingAlerts || existingAlerts.length === 0) {
        await (supabase
          .from('alerts') as any)
          .insert({
            patient_id: alert.patient_id,
            alert_type: alert.alert_type,
            message: alert.message,
            severity: alert.severity,
          });
      }
    }
  } catch (error) {
    console.error('Error generating alerts:', error);
    // Don't throw - alerts are not critical
  }
}

function getMonthsSinceDiagnosis(testDate: string, diagnosisDate: string): number {
  const test = new Date(testDate);
  const diagnosis = new Date(diagnosisDate);
  const diffTime = test.getTime() - diagnosis.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
}

function getCMLColorName(value: number, months: number): string {
  if (value > 10) {
    if (months <= 3) return 'YELLOW';
    return 'RED';
  } else if (value > 1 && value <= 10) {
    if (months >= 12) return 'RED';
    return 'GREEN';
  } else if (value > 0.1 && value <= 1) {
    if (months >= 12) return 'ORANGE';
    return 'LIGHT GREEN';
  } else {
    return 'GREEN';
  }
}

function shouldCheckMutation(value: number, months: number): boolean {
  if (months >= 3 && months < 6) {
    return value > 10;
  }
  if (months >= 6 && months < 12) {
    return value > 1;
  }
  if (months >= 12) {
    return value > 0.1;
  }
  return false;
}

function getELNResponseStatus(value: number, months: number): { status: 'optimal' | 'warning' | 'failure' | 'not-assessed', label: string } {
  if (months < 3) {
    return { status: 'not-assessed', label: 'Not assessed' };
  }
  
  if (months >= 3 && months < 6) {
    if (value <= 10) {
      return { status: 'optimal', label: 'Optimal' };
    } else {
      return { status: 'failure', label: 'Failure' };
    }
  }
  
  if (months >= 6 && months < 12) {
    if (value <= 1) {
      return { status: 'optimal', label: 'Optimal' };
    } else if (value > 1 && value <= 10) {
      return { status: 'warning', label: 'Warning' };
    } else {
      return { status: 'failure', label: 'Failure' };
    }
  }
  
  if (months >= 12) {
    if (value <= 0.1) {
      return { status: 'optimal', label: 'Optimal' };
    } else if (value > 0.1 && value <= 1) {
      return { status: 'warning', label: 'Warning' };
    } else {
      return { status: 'failure', label: 'Failure' };
    }
  }
  
  return { status: 'not-assessed', label: 'Not assessed' };
}

