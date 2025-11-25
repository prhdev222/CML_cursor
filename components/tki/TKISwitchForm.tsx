'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TKISwitchForm() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    patient_id: '',
    current_tki: 'imatinib',
    new_tki: 'nilotinib',
    reason: 'molecularFailure',
    bcr_abl_is: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // End current TKI record
      await (supabase
        .from('tki_records') as any)
        .update({ end_date: new Date().toISOString() })
        .eq('patient_id', formData.patient_id)
        .is('end_date', null);

      // Create new TKI record
      const { error } = await (supabase.from('tki_records') as any).insert([
        {
          patient_id: formData.patient_id,
          tki_name: formData.new_tki,
          start_date: new Date().toISOString(),
          reason: formData.reason,
        },
      ]);

      if (error) throw error;

      // Update patient's current TKI
      await (supabase
        .from('patients') as any)
        .update({ current_tki: formData.new_tki })
        .eq('patient_id', formData.patient_id);

      alert('TKI switch recorded successfully!');
      setFormData({
        patient_id: '',
        current_tki: 'imatinib',
        new_tki: 'nilotinib',
        reason: 'molecularFailure',
        bcr_abl_is: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error switching TKI:', error);
      alert('Error switching TKI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Patient ID
        </label>
        <input
          type="text"
          required
          value={formData.patient_id}
          onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('tki.currentTKI')}
        </label>
        <select
          value={formData.current_tki}
          onChange={(e) => setFormData({ ...formData, current_tki: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="imatinib">{t('tki.imatinib')}</option>
          <option value="nilotinib">{t('tki.nilotinib')}</option>
          <option value="dasatinib">{t('tki.dasatinib')}</option>
          <option value="ponatinib">{t('tki.ponatinib')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New TKI
        </label>
        <select
          value={formData.new_tki}
          onChange={(e) => setFormData({ ...formData, new_tki: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="imatinib">{t('tki.imatinib')}</option>
          <option value="nilotinib">{t('tki.nilotinib')}</option>
          <option value="dasatinib">{t('tki.dasatinib')}</option>
          <option value="ponatinib">{t('tki.ponatinib')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('tki.reason')}
        </label>
        <select
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="molecularFailure">{t('tki.molecularFailure')}</option>
          <option value="intolerance">{t('tki.intolerance')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          BCR-ABL1 IS (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.bcr_abl_is}
          onChange={(e) => setFormData({ ...formData, bcr_abl_is: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 15.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : t('tki.switchTKI')}
      </button>
    </form>
  );
}

