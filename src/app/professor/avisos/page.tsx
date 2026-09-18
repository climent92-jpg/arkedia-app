'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AvisosPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*');
    if (data) setAnnouncements(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('Omple el títol i el contingut.');

    setSaving(true);
    const { error } = await supabase.from('announcements').insert([{ title, content }]);
    setSaving(false);

    if (!error) {
      setTitle('');
      setContent('');
      loadAnnouncements();
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Avisos</h1>
        <p className="text-sm text-slate-500 mt-1">Avisos generals per a tota l'escola o alumnes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Títol de l'avís</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Missatge / Contingut</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm"
        >
          {saving ? 'Publicant...' : 'Publicar Avís'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 text-base">Avisos publicats</h2>
        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hi ha cap avís publicat.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">{a.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
