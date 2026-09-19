'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Funció per tancar sessió correctament
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Seccions del menú lateral
  const navItems = [
    { name: 'Horaris', href: '/professor/horaris', icon: '🕒' },
    { name: 'Alumnes', href: '/professor/alumnes', icon: '👥' },
    { name: 'Deures', href: '/professor/deures', icon: '📝' },
    { name: 'Material', href: '/professor/material', icon: '📁' },
    { name: 'Xat', href: '/professor/xat', icon: '💬' },
    { name: 'Avisos', href: '/professor/avisos', icon: '📢' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between fixed top-0 bottom-0 left-0 h-screen z-30 shrink-0">
        <div className="space-y-8">
          
          {/* Logo ARK#ÈDIA */}
          <div>
            <h1 className="text-xl font-black text-indigo-950 tracking-wider">ARK#ÈDIA</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">ESCOLA DE MÚSICA</p>
          </div>

          {/* Menú de navegació */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Perfil del professor i botó Tancar Sessió */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              M
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">Manel Ruíz</p>
              <p className="text-xs text-slate-400 font-medium">professor</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-slate-500 hover:text-rose-600 text-xs font-semibold py-2 transition-colors cursor-pointer"
          >
            <span>↪</span> Tancar sessió
          </button>
        </div>
      </aside>

      {/* CONTINGUT PRINCIPAL DE CADA PÀGINA */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>

    </div>
  );
}
