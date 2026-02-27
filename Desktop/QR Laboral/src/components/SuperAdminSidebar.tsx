import React from 'react';
import { LayoutDashboard, Building2, Settings, LogOut, ShieldCheck } from 'lucide-react';

interface SidebarProps {
    currentView: 'dashboard' | 'companies' | 'settings';
    onViewChange: (view: 'dashboard' | 'companies' | 'settings') => void;
    onLogout: () => void;
    userFullName: string;
    isOpen: boolean; // NEW
    onClose: () => void; // NEW
}

export const SuperAdminSidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, userFullName, isOpen, onClose }) => {

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'companies', label: 'Empresas', icon: Building2 },
        { id: 'settings', label: 'Configuración', icon: Settings },
    ] as const;

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-slate-950 border-r border-white/10 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Logo Area */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight leading-4">
                                SuperAdmin
                            </h1>
                            <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wide">
                                Master Panel
                            </span>
                        </div>
                    </div>
                    {/* Close Button Mobile */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <LogOut size={20} className="rotate-180" /> {/* Reusing icon efficiently or use X */}
                    </button>
                </div>

                {/* User Info */}
                <div className="p-6 pb-2">
                    <div className="px-3 py-2 bg-slate-900 rounded-lg border border-white/5">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Usuario Activo</p>
                        <p className="text-sm font-bold text-white truncate" title={userFullName}>{userFullName}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = currentView === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onViewChange(item.id);
                                    onClose(); // Close on mobile navigation
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                                <span className="text-sm">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                    <div className="mt-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center justify-center gap-1 inline-flex">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            SYSTEM V2.2
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};
