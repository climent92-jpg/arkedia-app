'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Components exportats requerits per altres pàgines (avisos, deures, material, xat)
export function NoStudentAssigned({ message }: { message?: string }) {
  return (
    <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
      {message || 'No s\'ha trobat cap alumne assignat.'}
    </div>
  );
}

export function NoStudentFound({ message }: { message?: string }) {
  return <NoStudentAssigned message={message} />;
}

export function NoStudentSelected({ message }: { message?: string }) {
  return <NoStudentAssigned message={message} />;
}

export function NoStudent({ message }: { message?: string }) {
  return <NoStudentAssigned message={message} />;
}

export default function AlumneAgendaPage() {
  const [userName, setUserName] = useState<string>('Lucas');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const ALL_DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

  useEffect(() => {
    async function fetchAgenda() {
      setLoading(true);
      try {
        // Carregar totes les classes de la taula
        const { data: allSchedules, error } = await supabase
          .from('schedules')
          .select('*');

        if (!error && allSchedules) {
          setSchedules(allSchedules);
        }

        // Carregar el nom de l'usuari actiu
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setUserName(profile.full_name.split(' ')[0]);
          }
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
