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
        <header className="bg-[#0f172a] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl border-b border-white/5">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 w-12 h-12 flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <ShieldCheck size={24} className="text-white" />
                    )}
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tight leading-none uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">QR LABORAL</h1>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                        {user?.role === 'SUPERADMIN' ? 'Modo Dios ⚡' : user?.role === 'ADMIN' ? 'Empresa Certificada' : 'Acceso Personal'}
                    </p>
                </div>
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && setActiveTab && (
                <nav className="hidden lg:flex bg-slate-800/40 backdrop-blur-md rounded-2xl p-1 border border-white/5">
                    <button
                        onClick={() => setActiveTab('PANEL')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'PANEL' ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutDashboard size={14} /> DASHBOARD
                    </button>
                    <button
                        onClick={() => setActiveTab('REGISTROS')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'REGISTROS' ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ClipboardList size={14} /> REGISTROS
                    </button>
                    <button
                        onClick={() => setActiveTab('PLANTILLA')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'PLANTILLA' ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={14} /> PLANTILLA
                    </button>
                    <button
                        onClick={() => setActiveTab('NORMATIVA')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'NORMATIVA' ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShieldCheck size={14} /> NORMATIVA
                    </button>
                    <button
                        onClick={() => setActiveTab('CONFIG')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'CONFIG' ? 'bg-indigo-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Settings size={14} /> CONFIG
                    </button>
                </nav>
            )}

            <div className="flex items-center gap-4">
                {user && (
                    <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-right">
                            <p className="text-xs font-bold">{user.full_name}</p>
                            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{user.department}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-sm shadow-inner">
                            {user.full_name.charAt(0)}
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 p-2.5 rounded-2xl transition-all border border-rose-500/20 active:scale-90"
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
