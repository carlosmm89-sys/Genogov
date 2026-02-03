import React from 'react';
import { LogOut, ShieldCheck, ClipboardList, LayoutDashboard, Users, Settings } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
    user?: User;
    onLogout: () => void;
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    companyLogo?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, activeTab, setActiveTab, companyLogo }) => {
    return (
        <header className="bg-white text-slate-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm border-b border-slate-200/60 backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-4">
                {companyLogo ? (
                    <div className="w-auto h-10 md:h-16 flex items-center justify-center overflow-hidden transition-all hover:scale-105">
                        <img src={companyLogo} alt="Logo Empresa" className="h-full w-auto object-contain drop-shadow-sm" />
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 w-12 h-12 flex items-center justify-center overflow-hidden text-white">
                        <ShieldCheck size={24} />
                    </div>
                )}

                <div>
                    {!companyLogo && (
                        <h1 className="font-black text-xl tracking-tight leading-none uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">QR LABORAL</h1>
                    )}
                    {companyLogo && (
                        // Ocultamos el título si hay logo grande, o lo mostramos discreto
                        <h1 className="hidden md:block font-black text-lg tracking-tight leading-none uppercase text-slate-800">PORTAL EMPLEADO</h1>
                    )}
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {user?.role === 'SUPERADMIN' ? 'Modo Dios ⚡' : user?.role === 'ADMIN' ? 'Panel de Gestión' : ''}
                    </p>
                </div>
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && setActiveTab && (
                <nav className="hidden lg:flex bg-slate-100 rounded-2xl p-1 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('PANEL')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'PANEL' ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        <LayoutDashboard size={14} /> DASHBOARD
                    </button>
                    <button
                        onClick={() => setActiveTab('REGISTROS')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'REGISTROS' ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        <ClipboardList size={14} /> REGISTROS
                    </button>
                    <button
                        onClick={() => setActiveTab('PLANTILLA')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'PLANTILLA' ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        <Users size={14} /> PLANTILLA
                    </button>
                    <button
                        onClick={() => setActiveTab('NORMATIVA')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'NORMATIVA' ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        <ShieldCheck size={14} /> NORMATIVA
                    </button>
                    <button
                        onClick={() => setActiveTab('CONFIG')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'CONFIG' ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px] ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    >
                        <Settings size={14} /> CONFIG
                    </button>
                </nav>
            )}

            <div className="flex items-center gap-4">
                {user && (
                    <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-default">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-700">{user.full_name}</p>
                            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{user.department || 'General'}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-black text-sm shadow-sm text-indigo-600 border border-slate-100">
                            {user.full_name.charAt(0)}
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-2xl transition-all border border-rose-200 hover:border-rose-300 active:scale-95 shadow-sm"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-hidden ${className}`}>
        {children}
    </div>
);
