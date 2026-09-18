'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DeuresPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const getStudentName = (st: any) => {
    if (!st) return 'Alumne';
    return (
      st.full_name ||
      st.name ||
      st.student_name ||
      (st.first_name ? `${st.first_name} ${st.last_name || ''}`.trim() : null) ||
      st.email ||
      `Alumne ${st.id?.toString().slice(0, 4)}`
    );
  };

  useEffect(() => {
    async function loadData() {
      const { data: stData } = await supabase.from('students').select('*');
      if (stData) {
        setStudents(stData);
        setSelectedStudents(stData.map((s) => s.id));
      }

      const { data: hwData } = await supabase.from('homework').select('*');
      if (hwData) setHomeworks(hwData);
    }
    loadData();
  }, []);

  const handleToggleStudent = (id: string) => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedStudents([id]);
    } else {
      if (selectedStudents.includes(id)) {
        const updated = selectedStudents.filter((sId) => sId !== id);
        if (updated.length === 0) setSelectAll(true);
        setSelectedStudents(updated);
      } else {
        const updated = [...selectedStudents, id];
        if (updated.length === students.length) setSelectAll(true);
        setSelectedStudents(updated);
      }
    }
  };

  const handleSelectAllToggle = () => {
    if (!selectAll) {
      setSelectAll(true);
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Posa un títol als deures.');

    setSaving(true);
    const targets = selectAll ? [null] : selectedStudents;

    try {
      for (const studentId of targets) {
        await supabase.from('homework').insert([
          {
            title,
            description,
            due_date: dueDate || null,
            student_id: studentId,
          },
        ]);
      }

      alert('Deures creats correctament!');
      setTitle('');
      setDescription('');
      setDueDate('');

      const { data: hwData } = await supabase.from('homework').select('*');
      if (hwData) setHomeworks(hwData);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }

    setSaving(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Deures</h1>
        <p className="text-sm text-slate-500 mt-1">Assigna deures i exercicis als teus alumnes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alumne</label>
          <button
            type="button"
            onClick={() => setShowStudentDropdown(!showStudentDropdown)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-left flex justify-between items-center text-slate-800 font-medium"
          >
            <span>
              {selectAll
                ? 'Tots els alumnes'
                : selectedStudents.length === 1
                ? getStudentName(students.find((s) => s.id === selectedStudents[0]))
                : `${selectedStudents.length} Alumnes seleccionats`}
            </span>
            <span className="text-xs text-slate-400">▼</span>
          </button>

          {showStudentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 space-y-2 max-h-56 overflow-y-auto">
              <label className="flex items-center gap-2 text-sm text-slate-800 font-bold p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllToggle}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Tots els alumnes
              </label>
              <hr className="border-slate-100" />
              {students.map((st) => (
                <label key={st.id} className="flex items-center gap-2 text-sm text-slate-700 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!selectAll && selectedStudents.includes(st.id)}
                    onChange={() => handleToggleStudent(st.id)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  {getStudentName(st)}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Títol</label>
            <input
              type="text"
              placeholder="Ex: Escala de Do Major"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data d'entrega (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripció</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm"
        >
          {saving ? 'Guardant...' : 'Crear deures'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 text-base">Deures assignats</h2>
        {homeworks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hi ha deures creats.</p>
        ) : (
          homeworks.map((hw) => (
            <div key={hw.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="font-bold text-slate-800 text-sm">{hw.title}</p>
              {hw.description && <p className="text-xs text-slate-500 mt-1">{hw.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
