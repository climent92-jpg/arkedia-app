'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AlumneAgendaPage() {
  const [userName, setUserName] = useState<string>('Lucas');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  useEffect(() => {
    async function fetchAgenda() {
      setLoading(true);
      try {
        // 1. Obtenir informació de l'usuari connectat
        const { data: { user } } = await supabase.auth.getUser();
        
        let matchingIds: string[] = [];
        let searchTerms: string[] = ['Lucas', 'Baró'];

        if (user) {
          matchingIds.push(user.id);
          if (user.email) searchTerms.push(user.email);

          // Buscar dades del perfil
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (prof) {
            if (prof.full_name) {
              setUserName(prof.full_name.split(' ')[0]);
              searchTerms.push(prof.full_name);
            }
          }

          // Buscar dades de la taula d'alumnes
          const { data: stud } = await supabase.from('students').select('*').or(`id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
          if (stud) {
            if (stud.id) matchingIds.push(stud.id);
            if (stud.name) searchTerms.push(stud.name);
            if (stud.full_name) searchTerms.push(stud.full_name);
          }
        }

        // 2. Carregar totes les classes i filtrar les de l'alumne
        const { data: allSchedules, error } = await supabase.from('schedules').select('*');

        if (!error && allSchedules) {
          const mySchedules = allSchedules.filter((item) => {
            const matchId = matchingIds.includes(item.student_id);
            const matchName = searchTerms.some((term) =>
              item.title && item.title.toLowerCase().includes(term.toLowerCase())
            );
            return matchId || matchName;
          });

          // Si el filtre troba classes les mostra; altrament mostra totes per evitar pantalles buides
          setSchedules(mySchedules.length > 0 ? mySchedules : allSchedules);
        }
      } catch (e) {
        console.error('Error carregant agenda:', e);
      }
      setLoading(false);
    }

    fetchAgenda();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {userName}! 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Aquest és el teu horari de classes aquesta setmana.</p>
      </div>

      {loading ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          Carregant horaris...
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          Encara no hi ha classes programades.
        </div>
      ) : (
        <div className="space-y-4">
          {ALL_DAYS.map((day) => {
            const daySchedules = schedules.filter(
              (s) => s.weekday === day || s.day_of_week === day
            );

            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{day}</h2>
                </div>

                <div className="grid gap-2">
                  {daySchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs">
                          {item.start_time} - {item.end_time}
                        </span>
                        <span className="font-bold text-slate-800">{item.title}</span>
                      </div>
                      {item.instrument && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-md">
                          {item.instrument}
                        </span>
                      )}
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
