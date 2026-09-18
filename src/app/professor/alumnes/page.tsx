'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AlumnesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    async function loadStudents() {
      setLoading(true);
      const { data } = await supabase.from('students').select('*');
      if (data) setStudents(data);
      setLoading(false);
    }
    loadStudents();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alumnes</h1>
        <p className="text-sm text-slate-500 mt-1">Llista de tots els teus alumnes assignats.</p>
      </div>

      {loading ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          Carregant alumnes...
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No hi ha cap alumne registrat.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((st) => (
            <div key={st.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shrink-0">
                {getStudentName(st).charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{getStudentName(st)}</h3>
                {st.instrument && <p className="text-xs text-slate-500 mt-0.5">Instrument: {st.instrument}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
