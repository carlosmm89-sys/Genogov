import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Company } from '../types';
import { db, supabase } from '../services/supabaseService';
import { Building2, Save, Users, LogOut, ShieldCheck, Plus, Eye, EyeOff, Search, Edit, Trash2, X, AlertTriangle, LogIn } from 'lucide-react';
import { NotificationToast, NotificationType } from '../components/NotificationToast';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';

interface SuperAdminDashboardProps {
    user: User;
    onLogout: () => void;
}

export const SuperAdminDashboardV2: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
    // Navigation State
    const [currentView, setCurrentView] = useState<'dashboard' | 'companies' | 'settings'>('companies');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar State

    // Data State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modals State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Selected Company for Actions
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Form States
    const [newCompany, setNewCompany] = useState({ name: '', code: '' });
    const [editCompanyData, setEditCompanyData] = useState<{ name: string, code: string, is_active: boolean, domain?: string }>({ name: '', code: '', is_active: true, domain: '' });
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Logging Helper
    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = "(" + timestamp + ") " + msg;
        setDebugLogs(prev => [logEntry, ...prev]);
        console.log("[SuperAdminV2] " + msg);
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Initial Load
    useEffect(() => {
        loadCompanies();
    }, []);

    // CARGA DE EMPRESAS (RPC)
    const loadCompanies = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_companies_secure');
            if (error) throw error;
            setCompanies(data || []);
            addLog("Empresas cargadas: " + (data?.length || 0));
        } catch (error: any) {
            console.error(error);
            showNotification("Error cargando: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // CREACIÓN (RPC)
    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (adminEmail === 'superadmin@qrlaboral.com') throw new Error("Email reservado.");

            // 1. Crear Empresa
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('create_new_company_rpc', {
                    company_name: newCompany.name,
                    company_code: newCompany.code?.toUpperCase()
                });
            if (rpcError) throw rpcError;
            const companyId = rpcResult?.id;

            // 2. Crear Admin Auth
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { auth: { persistSession: false } }
            );
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: adminEmail,
                password: adminPassword,
                options: { data: { full_name: "Admin " + newCompany.name, role: 'ADMIN' } }
            });
            if (authError) throw authError;

            // 3. Vincular (RPC)
            if (authData.user?.id) {
                await supabase.rpc('assign_admin_profile_rpc', {
                    p_id: authData.user.id,
                    p_company_id: companyId,
                    p_email: adminEmail,
                    p_full_name: "Admin " + newCompany.name,
                    p_qr_code: Math.random().toString(36).substr(2, 10).toUpperCase()
                });
            }

            showNotification('Empresa creada correctamente', 'success');
            setShowCreateModal(false);
            setNewCompany({ name: '', code: '' });
            setAdminEmail('');
            setAdminPassword('');
            loadCompanies();

        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // EDICIÓN (RPC)
    const handleUpdateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setLoading(true);

        try {
            const { error } = await supabase.rpc('update_company_rpc', {
                p_company_id: selectedCompany.id,
                p_name: editCompanyData.name,
                p_code: editCompanyData.code,
                p_is_active: editCompanyData.is_active,
                p_domain: editCompanyData.domain
            });

            if (error) throw error;

            showNotification('Empresa actualizada', 'success');
            setShowEditModal(false);
            setSelectedCompany(null);
            loadCompanies();
        } catch (error: any) {
            showNotification("Error: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ELIMINACIÓN (RPC)
    const handleDeleteCompany = async () => {
        if (!selectedCompany) return;
        setLoading(true);

        try {
            const { error } = await supabase.rpc('delete_company_rpc', {
                p_company_id: selectedCompany.id
            });

            if (error) throw error;

            showNotification('Empresa eliminada y datos limpiados', 'success');
            setShowDeleteModal(false);
            setSelectedCompany(null);
            loadCompanies();
        } catch (error: any) {
            showNotification("Error eliminando: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = (c: Company) => {
        localStorage.setItem('impersonation_target', JSON.stringify(c));
        showNotification("Cambiando contexto a " + c.name + "...", 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    // Prepared Data
    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'active' ? (c.is_active !== false) : (c.is_active === false);

        return matchesSearch && matchesStatus;
    });

    // Metrics
    const metrics = {
        total: companies.length,
        active: companies.filter(c => c.is_active !== false).length,
        inactive: companies.filter(c => c.is_active === false).length
    };

    // Helpers
    const openEditModal = (c: Company) => {
        setSelectedCompany(c);
        setEditCompanyData({ name: c.name, code: c.code, is_active: c.is_active !== false, domain: c.domain });
        setShowEditModal(true);
    };

    const openDeleteModal = (c: Company) => {
        setSelectedCompany(c);
        setShowDeleteModal(true);
    };

    return (
        <div className="flex min-h-screen bg-slate-900 font-sans text-slate-100">
            {/* Sidebar */}
            <SuperAdminSidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                onLogout={onLogout}
                userFullName={user.full_name}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Header Toggle */}
            <div className="md:hidden fixed top-4 left-4 z-40">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-indigo-600 rounded-lg shadow-lg text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 relative transition-all duration-300">

                {/* VISTA: EMPRESAS */}
                {currentView === 'companies' && (
                    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <Building2 className="text-indigo-500 hidden md:block" />
                                    Gestión de Empresas
                                </h2>
                                <p className="text-slate-400 mt-1">Administración centralizada de tenants y suscripciones.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative group flex-1 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar empresa..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full md:w-64 transition-all"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                                    <button
                                        onClick={() => setFilterStatus('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('active')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Activas
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('inactive')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'inactive' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Inactivas
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total */}
                            <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-950/50 border border-indigo-500/20 p-5 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-900/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Building2 size={60} />
                                </div>
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl backdrop-blur-sm border border-indigo-500/20">
                                    <Building2 size={24} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-indigo-300 text-xs uppercase font-bold tracking-wider">Total Empresas</p>
                                    <p className="text-3xl font-black text-white mt-1">{metrics.total}</p>
                                </div>
                            </div>

                            {/* Active */}
                            <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-5 shadow-lg shadow-emerald-900/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ShieldCheck size={60} />
                                </div>
                                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl backdrop-blur-sm border border-emerald-500/20">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-emerald-300 text-xs uppercase font-bold tracking-wider">Activas</p>
                                    <p className="text-3xl font-black text-white mt-1">{metrics.active}</p>
                                </div>
                            </div>

                            {/* Inactive */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5 rounded-2xl flex items-center gap-5 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <EyeOff size={60} />
                                </div>
                                <div className="p-3 bg-slate-700/50 text-slate-400 rounded-xl backdrop-blur-sm border border-slate-600/50">
                                    <EyeOff size={24} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Inactivas</p>
                                    <p className="text-3xl font-black text-white mt-1">{metrics.inactive}</p>
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCompanies.length === 0 ? (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <p className="text-slate-500">No se encontraron empresas.</p>
                                </div>
                            ) : (
                                filteredCompanies.map(company => (
                                    <div key={company.id} className={`bg-slate-800 border ${company.is_active === false ? 'border-red-500/20 opacity-75' : 'border-white/5'} rounded-xl p-5 hover:border-indigo-500/30 transition-all hover:shadow-xl group relative`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${company.is_active === false ? 'bg-slate-700 text-slate-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white truncate max-w-[150px]">{company.name}</h3>
                                                    <p className="text-xs text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded inline-block mt-1">{company.code}</p>
                                                </div>
                                            </div>
                                            {company.is_active === false ? (
                                                <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-1 rounded">INACTIVA</span>
                                            ) : (
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded">ACTIVA</span>
                                            )}
                                        </div>

                                        <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-4">
                                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]" title={company.id}>ID: {company.id}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleImpersonate(company)} className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Acceder como Admin (Impersonate)">
                                                    <LogIn size={16} />
                                                </button>
                                                <button onClick={() => openEditModal(company)} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => openDeleteModal(company)} className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VISTA: DASHBOARD */}
                {currentView === 'dashboard' && (
                    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
                        <h2 className="text-3xl font-bold text-white">Dashboard General</h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white/10 rounded-xl"><Building2 size={24} className="text-white" /></div>
                                    <h3 className="text-indigo-100 font-bold">Total Empresas</h3>
                                </div>
                                <p className="text-4xl font-bold text-white">{metrics.total}</p>
                                <p className="text-indigo-200 text-xs mt-2">+12% vs mes anterior</p>
                            </div>

                            <div className="bg-slate-800 border border-white/5 p-6 rounded-2xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl"><ShieldCheck size={24} className="text-emerald-400" /></div>
                                    <h3 className="text-slate-300 font-bold">Activas</h3>
                                </div>
                                <p className="text-4xl font-bold text-white">{metrics.active}</p>
                            </div>

                            <div className="bg-slate-800 border border-white/5 p-6 rounded-2xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-users-500/10 rounded-xl"><Users size={24} className="text-blue-400" /></div>
                                    <h3 className="text-slate-300 font-bold">Total Usuarios</h3>
                                </div>
                                <p className="text-4xl font-bold text-white">--</p>
                                <p className="text-slate-500 text-xs mt-2">Calculando...</p>
                            </div>
                        </div>

                        <div className="bg-slate-800 border border-white/5 rounded-2xl p-8 text-center py-20">
                            <p className="text-slate-500">Gráficas de actividad próximamente...</p>
                        </div>
                    </div>
                )}

                {/* VISTA: SETTINGS */}
                {currentView === 'settings' && (
                    <div className="text-center py-20 animate-in fade-in">
                        <h2 className="text-3xl font-bold text-white">Configuración</h2>
                        <p className="text-slate-400 mt-2">Ajustes globales del sistema (Próximamente)</p>
                    </div>
                )}
            </main>

            {/* MODALS */}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Nueva Empresa</h3>
                            <button onClick={() => setShowCreateModal(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Nombre</label>
                                    <input value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} className="w-full mt-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Código</label>
                                    <input value={newCompany.code} onChange={e => setNewCompany({ ...newCompany, code: e.target.value })} className="w-full mt-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white font-mono" required />
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
                                <p className="text-xs font-bold text-indigo-400 uppercase">Admin Inicial</p>
                                <input type="email" placeholder="Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-slate-950 border-slate-800 rounded-lg p-2 text-white text-sm" required />
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-slate-950 border-slate-800 rounded-lg p-2 text-white text-sm" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-slate-500 hover:text-white"><Eye size={14} /></button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancelar</button>
                                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                    {loading ? '...' : <><Plus size={16} /> Crear</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && selectedCompany && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Editar Empresa</h3>
                            <button onClick={() => setShowEditModal(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400">Nombre</label>
                                <input value={editCompanyData.name} onChange={e => setEditCompanyData({ ...editCompanyData, name: e.target.value })} className="w-full mt-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">Código</label>
                                <input value={editCompanyData.code} onChange={e => setEditCompanyData({ ...editCompanyData, code: e.target.value })} className="w-full mt-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white font-mono" required />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400">Dominio (PWA)</label>
                                <input
                                    value={editCompanyData.domain || ''}
                                    onChange={e => setEditCompanyData({ ...editCompanyData, domain: e.target.value })}
                                    className="w-full mt-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white font-mono text-sm placeholder:text-slate-600"
                                    placeholder="ej: cliente.qrlaboral.com"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${editCompanyData.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} onClick={() => setEditCompanyData({ ...editCompanyData, is_active: !editCompanyData.is_active })}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editCompanyData.is_active ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className="text-sm font-bold text-slate-300">
                                    {editCompanyData.is_active ? 'Empresa Activa' : 'Empresa Inactiva (Acceso Bloqueado)'}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancelar</button>
                                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold">
                                    {loading ? '...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedCompany && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/10 flex items-center gap-3 text-rose-500">
                            <AlertTriangle />
                            <h3 className="font-bold text-white">¿Eliminar Empresa?</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-300">
                                Estás a punto de eliminar <strong>{selectedCompany.name}</strong> ({selectedCompany.code}).
                            </p>
                            <p className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                                ⚠️ Esta acción es irreversible. Se eliminarán todos los usuarios, registros y datos asociados.
                            </p>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancelar</button>
                                <button type="button" onClick={handleDeleteCompany} disabled={loading} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg text-sm font-bold">
                                    {loading ? 'Eliminando...' : 'Sí, Eliminar Todo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Logs */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-slate-950 border-t border-white/5 z-50">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Logs</h3>
                    <button onClick={() => setDebugLogs([])} className="text-xs text-slate-500 hover:text-white">Clear</button>
                </div>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs h-24 overflow-y-auto border border-white/5">
                    {debugLogs.length === 0 && <span className="text-slate-600">Ready...</span>}
                    {debugLogs.map((log, i) => (
                        <div key={i} className="mb-1 text-slate-300 border-b border-white/5 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            </div>

            {/* Toast Notification */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5">
                    <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
                </div>
            )}
        </div>
    );
};
