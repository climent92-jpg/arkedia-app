'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppShellProps {
  children: React.ReactNode;
  role?: string;
  userName?: string;
  badges?: any;
}

export function AppShell({
  children,
  role: initialRole,
  userName: initialUserName,
  badges: initialBadges,
}: AppShellProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>(initialUserName || 'Usuari');
  const [userRole, setUserRole] = useState<string>(initialRole || '');
  const [counts, setCounts] = useState({
    deures: initialBadges?.deures ?? 1,
    material: initialBadges?.material ?? 0,
    xat: initialBadges?.xat ?? 0,
    avisos: initialBadges?.avisos ?? 0,
  });

  // Detecta si la ruta és /professor o /profe dinàmicament
  const profePrefix = pathname.startsWith('/professor') ? '/professor' : '/profe';
  const isProfe = pathname.startsWith('/profe') || pathname.startsWith('/professor');
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (initialUserName) setUserName(initialUserName);
    if (initialRole) setUserRole(initialRole);
    if (initialBadges) {
      setCounts({
        deures: initialBadges.deures ?? 0,
        material: initialBadges.material ?? 0,
        xat: initialBadges.xat ?? 0,
        avisos: initialBadges.avisos ?? 0,
      });
    }
  }, [initialUserName, initialRole, initialBadges]);

  useEffect(() => {
    async function loadData() {
      try {
        if (!initialUserName || !initialRole) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (profile) {
              if (!initialUserName) setUserName(profile.full_name || profile.name || user.email?.split('@')[0] || 'Usuari');
              if (!initialRole) setUserRole(profile.role === 'teacher' ? 'Professor/a' : profile.role === 'admin' ? 'Administrador' : 'Alumne');
            }
          }
        }

        if (!initialBadges) {
          const { count: countMaterial } = await supabase.from('materials').select('*', { count: 'exact', head: true });
          const { count: countXat } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('read', false);
          const { count: countAvisos } = await supabase.from('announcements').select('*', { count: 'exact', head: true });

          setCounts({
            deures: 1,
            material: countMaterial || 0,
            xat: countXat || 0,
            avisos: countAvisos || 0,
          });
        }
      } catch (e) {
        console.error('Error carregant dades del menú:', e);
      }
    }

    loadData();
  }, [pathname, initialUserName, initialRole, initialBadges]);

  const navItems = isProfe
    ? [
        { name: 'Agenda', href: `${profePrefix}/agenda`, icon: '📅' },
        { name: 'Horaris', href: `${profePrefix}/horaris`, icon: '🕒' },
        { name: 'Alumnes', href: `${profePrefix}/alumnes`, icon: '👥' },
        { name: 'Deures', href: `${profePrefix}/deures`, icon: '📝', badge: counts.deures },
        { name: 'Material', href: `${profePrefix}/material`, icon: '📁', badge: counts.material },
        { name: 'Xat', href: `${profePrefix}/xat`, icon: '💬', badge: counts.xat },
        { name: 'Avisos', href: `${profePrefix}/avisos`, icon: '📢', badge: counts.avisos },
      ]
    : isAdmin
    ? [
        { name: 'Horaris', href: '/admin/horaris', icon: '🕒' },
        { name: 'Usuaris', href: '/admin/usuaris', icon: '👥' },
      ]
    : [
        { name: 'Agenda', href: '/alumne/agenda', icon: '📅' },
        { name: 'Deures', href: '/alumne/deures', icon: '📝', badge: counts.deures },
        { name: 'Material', href: '/alumne/material', icon: '📁', badge: counts.material },
        { name: 'Xat', href: '/alumne/xat', icon: '💬', badge: counts.xat },
        { name: 'Avisos', href: '/alumne/avisos', icon: '📢', badge: counts.avisos },
        { name: 'Perfil', href: '/alumne/perfil', icon: '👤' },
      ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col justify-between p-4 shadow-sm z-20">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <span className="font-extrabold text-indigo-900 text-xl tracking-tight">ARK#ÈDIA</span>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Escola de Música</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userRole || 'Usuari'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
          >
            ↪ Tancar sessió
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default AppShell;
