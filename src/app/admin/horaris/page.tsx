'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminHorarisPage() {
  const supabase = createClientComponentClient();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState('');
  const [weekday, setWeekday] = useState('Dilluns');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:30');
  const [instrument, setInstrument] = useState('Piano');
  const [saving, setSaving] = useState(false);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  // 1. Carregar professors i alumnes
  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase.from('profiles').select('id, full_name, email, role');
      if (data) {
        setTeachers(data);
        if (data.length > 0) setSelectedTeacher(data[0].id);
        setStudents(data);
      }
    }
    loadUsers();
  }, []);

  // 2. Carregar horaris del professor seleccionat
  const fetchSchedules = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('teacher_id', selectedTeacher);

    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedTeacher]);

  // 3. Crear franja horària
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return alert('Selecciona un professor primer.');
    if (!studentId) return alert('Selecciona un alumne.');

    setSaving(true);

    const student = students.find((s) => s.id === studentId);
    const studentName = student ? (student.full_name || student.email) : 'Alumne';

    const { error } = await supabase.from('schedules').insert([
      {
        teacher_id: selectedTeacher, // Assignat correctament al professor actiu
        student_id: studentId,       // Enllaçat directament al perfil de l'alumne
        title: studentName,
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
      fetchSchedules(); // Actualitza la llista a l'instant
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horaris</h1>
          <p className="text-sm text-gray-500">Gestió d'horaris per professor.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          {showForm ? '✕ Tancar' : '+ Nova franja horària'}
        </button>
      </div>

      {/* Selector de Professor */}
      <div className="max-w-xs">
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Professor</label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm bg-white shadow-sm"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name || t.email}
            </option>
          ))}
        </select>
      </div>

      {/* Formulari integrat */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 border rounded-xl shadow-md space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Nova Franja Horària</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alumne</label>
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
              >
                <option value="">-- Selecciona l'alumne del llistat --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dia de la setmana</label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
              >
                {ALL_DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora inici</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora fi</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instrument / Assignatura</label>
              <input
                type="text"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 shadow-sm"
          >
            {saving ? 'Guardant...' : 'Crear franja horària'}
          </button>
        </form>
      )}

      {/* Llista d'horaris (Només mostra els dies AMB classe) */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Carregant horaris...</p>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border text-gray-500 text-sm">
            Aquest professor no té cap classe assignada.
          </div>
        ) : (
          ALL_DAYS.map((day) => {
            const daySchedules = schedules.filter(
              (s) => (s.weekday || s.day_of_week) === day
            );

            // Si el dia no té cap classe, no es mostra a la pantalla
            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-xl border p-4 shadow-sm space-y-2">
                <h2 className="font-bold text-gray-700 text-sm uppercase border-b pb-2">{day}</h2>
                <div className="grid gap-2">
                  {daySchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="font-semibold text-blue-900 mr-3">
                          {item.start_time} - {item.end_time}
                        </span>
                        <span className="font-bold text-gray-800">{item.title}</span>
                        {item.instrument && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {item.instrument}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
