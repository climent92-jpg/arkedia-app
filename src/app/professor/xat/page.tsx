'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function XatPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      setLoading(true);
      const { data } = await supabase.from('students').select('*');
      if (data) {
        setChats(data);
      }
      setLoading(false);
    }
    loadChats();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xat</h1>
        <p className="text-sm text-slate-500 mt-1">Converses amb les famílies i alumnes.</p>
      </div>

      {loading ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          Carregant converses...
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No hi ha cap xat actiu.
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0">
                  {(chat.full_name || chat.name || 'F').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    Família {chat.full_name || chat.name || 'Alumne'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Fes clic per obrir la conversa</p>
                </div>
              </div>
              <span className="text-slate-400 text-lg">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
