'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay?: string;
  onSuccess: () => void;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  defaultDay = 'Dilluns',
  onSuccess,
}: ScheduleModalProps) {
  const supabase = createClientComponentClient();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    teacher_id: '',
    weekday: defaultDay,
    start_time: '08:25',
    end_time: '08:55',
    title: '',
    course: '',
    father_email: '',
    mother_email: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Carregar la llista de professors per al desplegable
      supabase.from('profiles').select('id, full_name, email').then(({ data }) => {
        if (data) setTeachers(data);
      });
      setForm((prev) => ({ ...prev, weekday: defaultDay }));
    }
  }, [isOpen, defaultDay]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('schedules').insert([
      {
        teacher_id: form.teacher_id || null,
        weekday: form.weekday,
        day_of_week: form.weekday,
        start_time: form.start_time,
        end_time: form.end_time,
        title: form.title,
        course: form.course,
        notes: form.course,
        father_email: form.father_email,
        mother_email: form.mother_email,
        instrument: 'Música',
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Error en crear la franja: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Nova franja horària</h3>
          <button type="button" onClick={onClose} className="text-gray-500 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Assignar a Professor</label>
            <select
              required
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
            >
              <option value="">-- Selecciona un professor --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dia de la setmana</label>
              <select
                value={form.weekday}
                onChange={(e) => setForm({ ...form, weekday: e.target.value })}
                className="mt-1 w-full border rounded-lg p-2 text-sm bg-white"
              >
                {['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'].map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Curs</label>
              <input
                type="text"
                placeholder="Ex: 5è EPRI A"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Inici</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Fi</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nom de l'Alumne</label>
            <input
              type="text"
              required
              placeholder="Ex: Lucas Baró Bonilla"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Guardant...' : 'Crear Franja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
