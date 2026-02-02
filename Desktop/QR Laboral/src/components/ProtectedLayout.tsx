import React from 'react';
import { useAuth } from '../stores/AuthContext';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, Users, FileText, LogOut, CodeXml, MapPin, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const ProtectedLayout: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Panel General', roles: ['admin'] },
        { to: '/tracker', icon: Clock, label: 'Control Horario', roles: ['employee', 'admin'] }, // Admin can also track time? Yes usually.
        { to: '/records', icon: FileText, label: 'Registros', roles: ['admin'] },
        { to: '/users', icon: Users, label: 'Empleados', roles: ['admin'] },
        { to: '/centers', icon: MapPin, label: 'Centros', roles: ['admin'] },
        { to: '/settings', icon: Settings, label: 'Ajustes', roles: ['admin'] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-2xl z-20 transition-all">
                <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <CodeXml className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">QR Laboral</h1>
                        <p className="text-xs text-indigo-300">Admin Console</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {filteredNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                        : "text-indigo-200 hover:bg-white/5 hover:text-white"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-indigo-800 bg-indigo-950/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-indigo-500/50" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{user.name}</p>
                            <p className="text-xs text-indigo-400 truncate capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-2 bg-indigo-900/50 hover:bg-red-500/10 hover:text-red-200 text-indigo-300 py-2 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden max-w-full">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm lg:hidden">
                    {/* Mobile header content if needed */}
                    <span className="font-bold text-gray-700">QR Laboral</span>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
