import { supabase } from './supabase';

export interface TKIMedication {
  id: string;
  medication_key: string;
  name_th: string;
  name_en: string;
  side_effects: string[];
  monitoring: string[];
  is_active: boolean;
  sort_order: number;
}

// Cache for medications
let medicationsCache: Map<string, TKIMedication> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active TKI medications from database
 */
export async function getTKIMedications(): Promise<Map<string, TKIMedication>> {
  const now = Date.now();
  
  if (medicationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return medicationsCache;
  }

  try {
    const { data, error } = await supabase
      .from('tki_medications')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching TKI medications:', error);
      return new Map();
    }

    const medications = new Map<string, TKIMedication>();
    if (data) {
      data.forEach((med) => {
        medications.set(med.medication_key, med);
      });
    }

    medicationsCache = medications;
    cacheTimestamp = now;

    return medications;
  } catch (error) {
    console.warn('Error fetching TKI medications:', error);
    return new Map();
  }
}

/**
 * Get a single medication by key
 */
export async function getTKIMedication(key: string): Promise<TKIMedication | null> {
  const medications = await getTKIMedications();
  return medications.get(key) || null;
}

/**
 * Clear the cache (useful after admin updates)
 */
export function clearTKICache() {
  medicationsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get all medications (for admin page)
 */
export async function getAllTKIMedications(): Promise<TKIMedication[]> {
  try {
    const { data, error } = await supabase
      .from('tki_medications')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching all TKI medications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all TKI medications:', error);
    return [];
  }
}


