'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MaterialPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  
  const [selectAll, setSelectAll] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Partitura / PDF');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const getStudentName = (st: any) => {
    if (!st) return 'Alumne';
    return (
      st.full_name ||
      st.name ||
      st.student_name ||
      (st.first_name ? `${st.first_name} ${st.last_name || ''}`.trim() : null) ||
      st.email
    );
  };

  useEffect(() => {
    async function loadData() {
      // 1. Obtenir l'usuari actual (Professor)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Només carreguem els alumnes ASSIGNATS a aquest professor
        const { data: stData } = await supabase
          .from('students')
          .select('*')
          .eq('teacher_id', user.id);

        if (stData) {
          setStudents(stData);
          setSelectedStudents(stData.map((s) => s.id));
        }
      } else {
        // En cas de no tenir sessió o desenvolupament
        const { data: stData } = await supabase.from('students').select('*');
        if (stData) {
          setStudents(stData);
          setSelectedStudents(stData.map((s) => s.id));
        }
      }

      // Carregar llista de materials
      const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (matData) setMaterials(matData);
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
    if (!title) return alert('Si us plau, introdueix un títol.');

    setUploading(true);
    const targets = selectAll ? [null] : selectedStudents;

    try {
      for (const studentId of targets) {
        await supabase.from('materials').insert([
          {
            title,
            description,
            type,
            file_url: fileUrl,
            student_id: studentId,
          },
        ]);
      }

      setTitle('');
      setDescription('');
      setFileUrl('');
      setShowStudentDropdown(false);

      const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (matData) setMaterials(matData);
    } catch (e: any) {
      alert('Error en desar: ' + e.message);
    }

    setUploading(false);
  };

  const getTypeBadge = (typeStr: string) => {
    if (typeStr.includes('PDF') || typeStr.includes('partitura')) {
      return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">📄 Partitura / PDF</span>;
    }
    if (typeStr.includes('Àudio') || typeStr.includes('audio')) {
      return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">🎵 Àudio</span>;
    }
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">🎬 Vídeo</span>;
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Capçalera */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Material didàctic</h1>
        <p className="text-sm text-slate-500 mt-1">Comparteix partitures, àudios i vídeos amb els teus alumnes assignats.</p>
      </div>

      {/* Targeta de Formulari */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm shadow-slate-100 space-y-5">
        
        {/* Desplegable d'alumnes assignats */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Destinar a</label>
          <button
            type="button"
            onClick={() => setShowStudentDropdown(!showStudentDropdown)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-left flex justify-between items-center text-slate-800 font-semibold transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>
                {selectAll
                  ? `Tots els alumnes assignats (${students.length})`
                  : selectedStudents.length === 1
                  ? getStudentName(students.find((s) => s.id === selectedStudents[0]))
                  : `${selectedStudents.length} alumnes seleccionats`}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-bold">{showStudentDropdown ? '▲' : '▼'}</span>
          </button>

          {showStudentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 space-y-1 max-h-60 overflow-y-auto animate-in fade-in duration-150">
              <label className="flex items-center gap-3 text-sm text-slate-900 font-bold p-2.5 hover:bg-indigo-50/60 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllToggle}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                Tots els alumnes assignats
              </label>
              <div className="h-px bg-slate-100 my-1" />
              {students.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">No tens alumnes assignats directament.</p>
              ) : (
                students.map((st) => (
                  <label key={st.id} className="flex items-center gap-3 text-sm text-slate-700 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!selectAll && selectedStudents.includes(st.id)}
                      onChange={() => handleToggleStudent(st.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="font-medium">{getStudentName(st)}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipus de recurs</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="Partitura / PDF">📄 Partitura / PDF</option>
              <option value="Àudio">🎵 Àudio</option>
              <option value="Vídeo">🎬 Vídeo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Títol del material</label>
            <input
              type="text"
              placeholder="Ex: Exercicis de digitació nº 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Enllaç al fitxer o URL</label>
          <input
            type="text"
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Descripció o observacions (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Afegeix instruccions sobre com practicar..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-indigo-500/10 flex justify-center items-center gap-2"
        >
          {uploading ? (
            <span>Publicant material...</span>
          ) : (
            <>
              <span>Penjar material</span>
              <span>↑</span>
            </>
          )}
        </button>
      </form>

      {/* Llista de Materials Penjats */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <span>Materials enviats</span>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{materials.length}</span>
        </h2>

        {materials.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl border border-slate-200/80 text-slate-400 text-sm">
            Encara no has penjat cap material.
          </div>
        ) : (
          <div className="grid gap-3">
            {materials.map((m) => (
              <div key={m.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-900 text-sm">{m.title}</p>
                    {getTypeBadge(m.type || '')}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {m.student_id ? 'Assignat a alumnes específics' : 'Disponible per a tots els teus alumnes'}
                  </p>
                </div>
                {m.file_url && (
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors"
                  >
                    Obrir ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
