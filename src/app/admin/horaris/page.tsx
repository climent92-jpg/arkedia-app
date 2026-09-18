'use client';

import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

export default function AdminHorarisPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [weekday, setWeekday] = useState('Dilluns');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('16:30');
  const [instrument, setInstrument] = useState('Piano');
  const [saving, setSaving] = useState(false);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email,role`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeachers(data);
          setStudents(data);
          if (data.length > 0) setSelectedTeacher(data[0].id);
        }
      } catch (err) {
        console.error('Error carregant usuaris:', err);
      }
    }
    if (SUPABASE_URL && SUPABASE_KEY) loadUsers();
  }, []);

  const fetchSchedules = async () => {
    if (!selectedTeacher || !SUPABASE_URL) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/schedules?select=*&teacher_id=eq.${selectedTeacher}`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      if (Array.isArray(data)) setSchedules(data);
    } catch (err) {
      console.error('Error carregant horaris:', err);
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
    const selectedStudent = students.find((s) => s.id === studentId);
    const studentName = selectedStudent ? (selectedStudent.full_name || selectedStudent.email) : 'Alumne';

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify([
          {
            teacher_id: selectedTeacher,
            student_id: studentId,
            title: studentName,
            weekday: weekday,
            day_of_week: weekday,
            start_time: startTime,
            end_time: endTime,
            instrument: instrument,
            course: instrument,
          },
        ]),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert('Error: ' + JSON.stringify(errData));
      } else {
        setShowForm(false);
        fetchSchedules();
      }
    } catch (err: any) {
      alert('Error en crear la franja: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vols eliminar aquesta franja horària?')) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchSchedules();
      } else {
        alert('Error en eliminar la franja.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horaris</h1>
          <p className="text-sm text-gray-500">Gestió manual de franges per professor i alumne.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          {showForm ? '✕ Tancar' : '+ Nova franja horària'}
        </button>
      </div>

      <div className="max-w-xs">
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Professor</label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm bg-white shadow-sm font-medium"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name || t.email}
            </option>
          ))}
        </select>
      </div>

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
                <option value="">-- Selecciona l'alumne --</option>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Instrument</label>
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
            {saving ? 'Guardant...' : 'Crear i guardar'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Carregant horaris...</p>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border text-gray-500 text-sm">
            Aquest professor no té cap franja horària.
          </div>
        ) : (
          ALL_DAYS.map((day) => {
            const daySchedules = schedules.filter(
              (s) => s.weekday === day || s.day_of_week === day
            );

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
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 font-bold px-2 py-1 text-xs border border-red-200 rounded bg-white"
                      >
                        🗑️ Eliminar
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
  );
}
