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

  // Funció per obtenir el nom real de l'alumne independentment del camp de Supabase
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

      const { data: matData } = await supabase.from('materials').select('*');
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
    if (!title) return alert('Si us plau, posa un títol al material.');

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

      alert('Material penjat correctament!');
      setTitle('');
      setDescription('');
      setFileUrl('');

      const { data: matData } = await supabase.from('materials').select('*');
      if (matData) setMaterials(matData);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }

    setUploading(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Material</h1>
        <p className="text-sm text-slate-500 mt-1">Partitures, vídeos i àudios per als teus alumnes.</p>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipus</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
            >
              <option value="Partitura / PDF">Partitura / PDF</option>
              <option value="Àudio">Àudio</option>
              <option value="Vídeo">Vídeo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Títol</label>
            <input
              type="text"
              placeholder="Ex: Exercicis de digitació"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Enllaç del fitxer o URL</label>
          <input
            type="text"
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripció (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm"
        >
          {uploading ? 'Penjant material...' : 'Penjar material'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 text-base">Materials penjats</h2>
        {materials.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No s'ha penjat cap material.</p>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-slate-800 text-sm">{m.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {m.student_id ? 'Assignat a alumnes específics' : 'Per a tots els alumnes'}
                </p>
              </div>
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-medium">{m.type}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
