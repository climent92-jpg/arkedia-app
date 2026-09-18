'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MaterialPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'all' | 'custom'>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('partitura');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Carregar alumnes
      const { data: stData } = await supabase.from('students').select('*');
      if (stData) setStudents(stData);

      // Carregar materials
      const { data: matData } = await supabase.from('materials').select('*');
      if (matData) setMaterials(matData);
    }
    loadData();
  }, []);

  const handleToggleStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sId) => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Posa un títol al material');

    setUploading(true);

    const targets = targetType === 'all' ? [null] : selectedStudents;

    if (targetType === 'custom' && selectedStudents.length === 0) {
      alert('Selecciona almenys un alumne.');
      setUploading(false);
      return;
    }

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
      setSelectedStudents([]);

      const { data: matData } = await supabase.from('materials').select('*');
      if (matData) setMaterials(matData);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }

    setUploading(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Material</h1>
        <p className="text-sm text-slate-500 mt-1">Partitures, vídeos i àudios per als teus alumnes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Destinataris</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={targetType === 'all'}
                onChange={() => setTargetType('all')}
              />
              Tots els alumnes
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={targetType === 'custom'}
                onChange={() => setTargetType('custom')}
              />
              Seleccionar alumnes específics
            </label>
          </div>

          {targetType === 'custom' && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-medium text-slate-600">Tria els alumnes:</span>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  {selectedStudents.length === students.length ? 'Desmarcar tots' : 'Marcar tots'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-1">
                {students.map((st) => (
                  <label key={st.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(st.id)}
                      onChange={() => handleToggleStudent(st.id)}
                      className="rounded text-indigo-600"
                    />
                    {st.full_name || st.name || 'Alumne'}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipus</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
            >
              <option value="partitura">Partitura / PDF</option>
              <option value="audio">Àudio</option>
              <option value="video">Vídeo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Títol</label>
            <input
              type="text"
              placeholder="Ex: Exercicis de digitació"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripció (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          {uploading ? 'Penjant material...' : 'Penjar material'}
        </button>
      </form>

      {/* Llista de materials */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 text-base">Materials penjats</h2>
        {materials.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No s'ha penjat cap material.</p>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-slate-800 text-sm">{m.title}</p>
                <p className="text-xs text-slate-400">{m.student_id ? 'Assignat a un o varis alumnes' : 'Per a tots els alumnes'}</p>
              </div>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-medium">{m.type}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
