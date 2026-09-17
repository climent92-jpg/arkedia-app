'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ScheduleModal from '@/components/ScheduleModal';

export default function AdminHorarisPage() {
  const supabase = createClientComponentClient();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Dilluns');

  const days = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  useEffect(() => {
    async function loadTeachers() {
      const { data } = await supabase.from('profiles').select('id, full_name, email');
      if (data && data.length > 0) {
        setTeachers(data);
        setSelectedTeacher(data[0].id);
      }
    }
    loadTeachers();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true });

    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleOpenModal = (day: string) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horaris</h1>
          <p className="text-sm text-gray-500">Tria un professor per veure i gestionar la seva graella setmanal.</p>
        </div>
        <button
          onClick={() => handleOpenModal('Dilluns')}
          className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          + Nova franja horària
        </button>
      </div>

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

      <div className="space-y-6">
        {days.map((day) => {
          const daySchedules = schedules.filter((s) => {
            const matchDay = (s.weekday || s.day_of_week) === day;
            const matchTeacher = !selectedTeacher || String(s.teacher_id) === String(selectedTeacher);
            return matchDay && matchTeacher;
          });

          return (
            <div key={day} className="bg-white rounded-xl border p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="font-bold text-gray-700 text-sm tracking-wider uppercase">{day}</h2>
                <button
                  onClick={() => handleOpenModal(day)}
                  className="text-gray-400 hover:text-gray-800 font-bold text-lg px-2"
                >
                  +
                </button>
              </div>

              {loading ? (
                <p className="text-xs text-gray-400 py-2">Carregant...</p>
              ) : daySchedules.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Cap classe.</p>
              ) : (
                <div className="grid gap-2">
                  {daySchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="font-semibold text-blue-900 mr-2">
                          {item.start_time} - {item.end_time}
                        </span>
                        <span className="font-bold text-gray-800">{item.title || 'Sense nom'}</span>
                        {item.course && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {item.course}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDay={selectedDay}
        selectedTeacherId={selectedTeacher}
        onSuccess={fetchSchedules}
      />
    </div>
  );
}
