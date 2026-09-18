'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminHorarisPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Formularis
  const [studentId, setStudentId] = useState<string>('');
  const [weekday, setWeekday] = useState<string>('Dilluns');
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('16:30');
  const [instrument, setInstrument] = useState<string>('Piano');
  const [saving, setSaving] = useState<boolean>(false);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  // Carregar usuaris provant totes les taules possibles
  useEffect(() => {
    async function loadUsers() {
      try {
        // 1. Buscar Professors
        let profList: any[] = [];
        const resTeachers = await supabase.from('teachers').select('*');
        if (!resTeachers.error && resTeachers.data && resTeachers.data.length > 0) {
          profList = resTeachers.data;
        } else {
          const resProfs = await supabase.from('professors').select('*');
          if (!resProfs.error && resProfs.data && resProfs.data.length > 0) {
            profList = resProfs.data;
          } else {
            const resProfiles = await supabase.from('profiles').select('*');
            if (!resProfiles.error && resProfiles.data) {
              profList = resProfiles.data;
            }
          }
        }

        // 2. Buscar Alumnes
        let studList: any[] = [];
        const resStudents = await supabase.from('students').select('*');
        if (!resStudents.error && resStudents.data && resStudents.data.length > 0) {
          studList = resStudents.data;
        } else {
          const resAlumnes = await supabase.from('alumnes').select('*');
          if (!resAlumnes.error && resAlumnes.data && resAlumnes.data.length > 0) {
            studList = resAlumnes.data;
          } else {
            studList = profList;
          }
        }

        const formatUser = (u: any) => ({
          id: u.id,
          name: u.full_name || u.name || u.nombre || u.email || 'Sense Nom',
        });

        const formattedTeachers = profList.map(formatUser);
        const formattedStudents = studList.map(formatUser);

        setTeachers(formattedTeachers);
        setStudents(formattedStudents);

        if (formattedTeachers.length > 0) {
          setSelectedTeacher(formattedTeachers[0].id);
        }
      } catch (e) {
        console.error('Error carregant usuaris:', e);
      }
    }
    loadUsers();
  }, []);

  // Carregar horaris
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let query = supabase.from('schedules').select('*');
      if (selectedTeacher) {
        query = query.eq('teacher_id', selectedTeacher);
      }
      const { data, error } = await query;
      if (!error && data) {
        setSchedules(data);
      }
    } catch (e) {
      console.error('Error carregant horaris:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedTeacher]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return alert('Selecciona un professor.');
    if (!studentId) return alert('Selecciona un alumne.');

    setSaving(true);
    const selectedStudentObj = students.find((s) => s.id === studentId);
    const studentLabel = selectedStudentObj ? selectedStudentObj.name : 'Alumne';

    const { error } = await supabase.from('schedules').insert([
      {
        teacher_id: selectedTeacher,
        student_id: studentId,
        title: studentLabel,
        weekday: weekday,
        day_of_week: weekday,
        start_time: startTime,
        end_time: endTime,
        instrument: instrument,
        course: instrument,
      },
    ]);

    setSaving(false);

    if (error) {
      alert('Error en crear la franja: ' + error.message);
    } else {
      setShowForm(false);
      fetchSchedules();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vols eliminar aquesta franja horària?')) return;

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      alert('Error en eliminar: ' + error.message);
    } else {
      fetchSchedules();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Capçalera */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestió d'Horaris</h1>
            <p className="text-sm text-slate-500 mt-1">Organitza les classes i franges dels professors i alumnes.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
          >
            {showForm ? '✕ Tancar' : '+ Nova Franja'}
          </button>
        </div>

        {/* Selecció de Professor */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Professor Seleccionat
          </label>
          
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {teachers.length === 0 && <option value="">-- Carregant professors... --</option>}
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Formulari de Creació */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 space-y-5 transition-all">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Afegir Nova Classe</h3>
              <p className="text-xs text-slate-500">Omple les dades per assignar l'horari.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alumne</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
                >
                  <option value="">-- Selecciona l'alumne --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dia de la setmana</label>
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
                >
                  {ALL_DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hora d'inici</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hora de fi</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Instrument / Assignatura</label>
                <input
                  type="text"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              {saving ? 'Guardant classe...' : 'Guardar Franja Horària'}
            </button>
          </form>
        )}

        {/* Llistat d'horaris */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
              Carregant horaris...
            </div>
          ) : schedules.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">No hi ha cap classe programada</p>
              <p className="text-xs text-slate-400">Prem el botó de "+ Nova Franja" per afegir la primera classe.</p>
            </div>
          ) : (
            ALL_DAYS.map((day) => {
              const daySchedules = schedules.filter(
                (s) => s.weekday === day || s.day_of_week === day
              );

              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{day}</h2>
                  </div>
                  
                  <div className="grid gap-2.5">
                    {daySchedules.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex justify-between items-center text-sm hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs">
                            {item.start_time} - {item.end_time}
                          </span>
                          <span className="font-bold text-slate-800">{item.title}</span>
                          {item.instrument && (
                            <span className="text-xs bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-md font-medium">
                              {item.instrument}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
