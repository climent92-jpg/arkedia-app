'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HorarisPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [weekday, setWeekday] = useState<string>('Dilluns');
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('16:30');
  const [title, setTitle] = useState<string>('');
  const [instrument, setInstrument] = useState<string>('Piano');
  const [saving, setSaving] = useState<boolean>(false);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

  const fetchHoraris = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('schedules').select('*');
      if (!error && data) {
        setSchedules(data);
      }
    } catch (e) {
      console.error('Error carregant horaris:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHoraris();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('schedules').insert([
      {
        title: title || 'Classe',
        weekday: weekday,
        day_of_week: weekday,
        start_time: startTime,
        end_time: endTime,
        instrument: instrument,
      },
    ]);

    setSaving(false);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowForm(false);
      setTitle('');
      fetchHoraris();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vols eliminar aquesta franja horària?')) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchHoraris();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Horaris</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestiona les teves franges horàries actius.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all"
        >
          {showForm ? '✕ Tancar' : '+ Nova franja horària'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Afegir franja</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Títol / Alumne</label>
              <input
                type="text"
                placeholder="Ex: Lucas Baró"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dia</label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              >
                {ALL_DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Instrument</label>
              <input
                type="text"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora inici</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hora fi</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            {saving ? 'Guardant...' : 'Desar Franja'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          Carregant horaris...
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No tens cap franja horària programada.
        </div>
      ) : (
        <div className="space-y-4">
          {ALL_DAYS.map((day) => {
            const daySchedules = schedules.filter(
              (s) =>
                (s.weekday && s.weekday.toLowerCase() === day.toLowerCase()) ||
                (s.day_of_week && s.day_of_week.toLowerCase() === day.toLowerCase())
            );

            // Amagar dies sense classes
            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">{day}</span>
                </div>

                <div className="grid gap-2">
                  {daySchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs">
                          {item.start_time} - {item.end_time}
                        </span>
                        <span className="font-bold text-slate-800">{item.title}</span>
                        {item.instrument && (
                          <span className="text-xs bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {item.instrument}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-500 hover:underline self-end sm:self-auto"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
