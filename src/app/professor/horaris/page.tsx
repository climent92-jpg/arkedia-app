'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfeHorarisPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Formulari de nova franja
  const [weekday, setWeekday] = useState<string>('Dilluns');
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('16:30');
  const [title, setTitle] = useState<string>('');
  const [instrument, setInstrument] = useState<string>('Piano');
  const [saving, setSaving] = useState<boolean>(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string>('');

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

  const fetchHoraris = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let teacherIds: string[] = [];

      if (user) {
        teacherIds.push(user.id);
        setCurrentTeacherId(user.id);

        // Buscar en la taula teachers o professors
        const { data: tData } = await supabase.from('teachers').select('id').or(`id.eq.${user.id},user_id.eq.${user.id},email.eq.${user.email}`);
        if (tData) tData.forEach((t) => teacherIds.push(t.id));

        const { data: pData } = await supabase.from('professors').select('id').or(`id.eq.${user.id},user_id.eq.${user.id},email.eq.${user.email}`);
        if (pData) pData.forEach((p) => teacherIds.push(p.id));
      }

      // Obtenir tots els horaris
      const { data: allSchedules, error } = await supabase.from('schedules').select('*');

      if (!error && allSchedules) {
        const mySchedules = allSchedules.filter((item) =>
          teacherIds.length > 0 ? teacherIds.includes(item.teacher_id) || teacherIds.includes(item.user_id) : true
        );

        // Si no troba filtres estrictes, mostra tots els horaris assignats
        setSchedules(mySchedules.length > 0 ? mySchedules : allSchedules);
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
        teacher_id: currentTeacherId,
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
      alert('Error en crear franja: ' + error.message);
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Horaris</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona les teves pròpies franges horàries, dia a dia.</p>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Títol / Descripció</label>
              <input
                type="text"
                placeholder="Ex: Classe de Piano"
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
      ) : (
        <div className="space-y-4">
          {ALL_DAYS.map((day) => {
            const daySchedules = schedules.filter(
              (s) =>
                (s.weekday && s.weekday.toLowerCase() === day.toLowerCase()) ||
                (s.day_of_week && s.day_of_week.toLowerCase() === day.toLowerCase())
            );

            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">{day}</span>
                </div>

                {daySchedules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Cap classe.</p>
                ) : (
                  <div className="grid gap-2">
                    {daySchedules.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-3">
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
                          className="text-xs text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
