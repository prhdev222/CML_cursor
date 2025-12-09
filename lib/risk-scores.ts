/**
 * Risk Scoring Systems for CML Patients
 * 
 * Formulas based on:
 * - Sokal Score (1984)
 * - Hasford Score / Euro Score (1998)
 * - EUTOS Long-Term Survival (ELTS) Score (2016)
 */

interface RiskScoreInputs {
  age: number; // years
  spleenSize: number; // cm below costal margin
  platelet: number; // x10^9/L
  blast: number; // percentage in peripheral blood
  basophil: number; // percentage in peripheral blood
  eosinophil?: number; // percentage in peripheral blood (for Hasford)
}

interface RiskScores {
  sokal: number;
  hasford: number;
  elts: number;
  sokalRisk: 'low' | 'intermediate' | 'high';
  hasfordRisk: 'low' | 'intermediate' | 'high';
  eltsRisk: 'low' | 'intermediate' | 'high';
}

/**
 * Calculate Sokal Score
 * Formula: exp(0.0116 × (age - 43.4) + 0.0345 × (spleen - 7.51) + 0.188 × ((platelet/700)^2 - 0.563) + 0.0887 × (blast - 2.10))
 * Risk groups: <0.8 (low), 0.8-1.2 (intermediate), >1.2 (high)
 */
export function calculateSokalScore(inputs: RiskScoreInputs): { score: number; risk: 'low' | 'intermediate' | 'high' } {
  const { age, spleenSize, platelet, blast } = inputs;
  
  // Default values if missing
  const ageValue = age || 50;
  const spleenValue = spleenSize || 0;
  const plateletValue = platelet || 450;
  const blastValue = blast || 0;
  
  // Sokal formula
  const score = Math.exp(
    0.0116 * (ageValue - 43.4) +
    0.0345 * (spleenValue - 7.51) +
    0.188 * (Math.pow(plateletValue / 700, 2) - 0.563) +
    0.0887 * (blastValue - 2.10)
  );
  
  let risk: 'low' | 'intermediate' | 'high';
  if (score < 0.8) {
    risk = 'low';
  } else if (score <= 1.2) {
    risk = 'intermediate';
  } else {
    risk = 'high';
  }
  
  return { score: parseFloat(score.toFixed(2)), risk };
}

/**
 * Calculate Hasford (Euro) Score
 * Formula: (0.6666 × age [when age ≥50, else 0]) + (0.042 × spleen) + (1.0956 × platelet [when ≥1500, else 0]) + (0.0584 × blast) + (0.2039 × basophil [when ≥3%, else 0]) + (0.0413 × eosinophil [when ≥7%, else 0]) × 1000
 * Risk groups: ≤780 (low), 781-1480 (intermediate), >1480 (high)
 */
export function calculateHasfordScore(inputs: RiskScoreInputs): { score: number; risk: 'low' | 'intermediate' | 'high' } {
  const { age, spleenSize, platelet, blast, basophil, eosinophil } = inputs;
  
  // Default values if missing
  const ageValue = age || 50;
  const spleenValue = spleenSize || 0;
  const plateletValue = platelet || 450;
  const blastValue = blast || 0;
  const basophilValue = basophil || 0;
  const eosinophilValue = eosinophil || 0;
  
  // Hasford formula
  const score = (
    (ageValue >= 50 ? 0.6666 * ageValue : 0) +
    (0.042 * spleenValue) +
    (plateletValue >= 1500 ? 1.0956 * plateletValue : 0) +
    (0.0584 * blastValue) +
    (basophilValue >= 3 ? 0.2039 * basophilValue : 0) +
    (eosinophilValue >= 7 ? 0.0413 * eosinophilValue : 0)
  ) * 1000;
  
  let risk: 'low' | 'intermediate' | 'high';
  if (score <= 780) {
    risk = 'low';
  } else if (score <= 1480) {
    risk = 'intermediate';
  } else {
    risk = 'high';
  }
  
  return { score: Math.round(score), risk };
}

/**
 * Calculate ELTS (EUTOS Long-Term Survival) Score
 * Formula: 0.0025 × (age/10)^3 + 0.0615 × spleen + 0.1052 × platelet + 0.4104 × (blast/100)
 * Risk groups: ≤1.5680 (low), 1.5681-2.2185 (intermediate), >2.2185 (high)
 */
export function calculateELTSScore(inputs: RiskScoreInputs): { score: number; risk: 'low' | 'intermediate' | 'high' } {
  const { age, spleenSize, platelet, blast } = inputs;
  
  // Default values if missing
  const ageValue = age || 50;
  const spleenValue = spleenSize || 0;
  const plateletValue = platelet || 450;
  const blastValue = blast || 0;
  
  // ELTS formula
  const score = (
    0.0025 * Math.pow(ageValue / 10, 3) +
    0.0615 * spleenValue +
    0.1052 * plateletValue +
    0.4104 * (blastValue / 100)
  );
  
  let risk: 'low' | 'intermediate' | 'high';
  if (score <= 1.5680) {
    risk = 'low';
  } else if (score <= 2.2185) {
    risk = 'intermediate';
  } else {
    risk = 'high';
  }
  
  return { score: parseFloat(score.toFixed(4)), risk };
}

/**
 * Calculate all risk scores from patient data
 */
export function calculateAllRiskScores(inputs: RiskScoreInputs): RiskScores {
  const sokal = calculateSokalScore(inputs);
  const hasford = calculateHasfordScore(inputs);
  const elts = calculateELTSScore(inputs);
  
  return {
    sokal: sokal.score,
    hasford: hasford.score,
    elts: elts.score,
    sokalRisk: sokal.risk,
    hasfordRisk: hasford.risk,
    eltsRisk: elts.risk,
  };
}

/**
 * Parse CBC text to extract values
 * Example: "WBC: 50,000, Platelet: 800,000, Blast: 2%, Basophil: 3%"
 */
export function parseCBC(cbcText: string): {
  wbc?: number;
  platelet?: number;
  blast?: number;
  basophil?: number;
  eosinophil?: number;
} {
  const result: any = {};
  
  if (!cbcText) return result;
  
  // Extract WBC
  const wbcMatch = cbcText.match(/WBC[:\s]*([\d,]+)/i);
  if (wbcMatch) {
    result.wbc = parseFloat(wbcMatch[1].replace(/,/g, ''));
  }
  
  // Extract Platelet
  const plateletMatch = cbcText.match(/Platelet[:\s]*([\d,]+)/i);
  if (plateletMatch) {
    result.platelet = parseFloat(plateletMatch[1].replace(/,/g, ''));
  }
  
  // Extract Blast %
  const blastMatch = cbcText.match(/Blast[:\s]*([\d.]+)\s*%/i);
  if (blastMatch) {
    result.blast = parseFloat(blastMatch[1]);
  }
  
  // Extract Basophil %
  const basophilMatch = cbcText.match(/Basophil[:\s]*([\d.]+)\s*%/i);
  if (basophilMatch) {
    result.basophil = parseFloat(basophilMatch[1]);
  }
  
  // Extract Eosinophil %
  const eosinophilMatch = cbcText.match(/Eosinophil[:\s]*([\d.]+)\s*%/i);
  if (eosinophilMatch) {
    result.eosinophil = parseFloat(eosinophilMatch[1]);
  }
  
  return result;
}

/**
 * Parse spleen size from text
 * Example: "5 cm ใต้ชายโครงซ้าย" or "5cm"
 */
export function parseSpleenSize(spleenText: string): number {
  if (!spleenText) return 0;
  
  const match = spleenText.match(/([\d.]+)\s*cm/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return 0;
}






