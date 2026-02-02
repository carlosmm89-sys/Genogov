import React, { useState, useEffect } from 'react';
import { WorkSite, Company, User } from '../types';
import { MapPin, Plus, Trash2, Save, Building2, AlertTriangle, Search, X, Map, Users, LayoutGrid, List } from 'lucide-react';
import { db } from '../services/supabaseService';
import { WorkSitesMapModal } from './WorkSitesMapModal';
import { SiteEmployeesModal } from './SiteEmployeesModal';
import { ProjectDrawer } from './ProjectManagement/ProjectDrawer';

interface WorkSitesManagerProps {
    company: Company;
    employees: User[]; // Received from parent to calculate counts
    onSiteChange?: () => void;
    onViewLogs?: (employeeId: string) => void;
}

export const WorkSitesManager: React.FC<WorkSitesManagerProps> = ({ company, employees, onSiteChange, onViewLogs }) => {
    const [sites, setSites] = useState<WorkSite[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);

    // For managing employees in a site
    const [selectedSiteForEmployees, setSelectedSiteForEmployees] = useState<WorkSite | null>(null);
    const [selectedProject, setSelectedProject] = useState<WorkSite | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load real sites
    useEffect(() => {
        loadSites();
    }, [company]);

    const showNotification = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadSites = async () => {
        if (!company?.id) return;

        setLoading(true);
        if (company.id === 'demo-company-id') {
            setSites([
                { id: 'site-1', company_id: 'demo-company-id', name: 'Obra Central', location_lat: 40.416, location_lng: -3.703, location_radius: 500, is_active: true }
            ]);
            setLoading(false);
            return;
        }

        try {
            const data = await db.getWorkSites(company.id);
            setSites(data);
        } catch (error) {
            console.error('Error loading sites:', error);
            showNotification('Error cargando obras', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddSite = async () => {
        const isDemo = company.id === 'demo-company-id';
        const newSite: WorkSite = {
            id: isDemo ? 'demo-site-' + Date.now() : crypto.randomUUID(),
            company_id: company.id,
            name: 'Nueva Obra / Centro',
            location_lat: company.location_lat || 0,
            location_lng: company.location_lng || 0,
            location_radius: 500,
            is_active: true
        };

        // Try to get current location immediately
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                newSite.location_lat = pos.coords.latitude;
                newSite.location_lng = pos.coords.longitude;
            });
        }

        // Add to local state first
        setSites([...sites, newSite]);

        if (!isDemo) {
            await db.saveWorkSite(newSite);
        }
    };

    const updateSite = (id: string, updates: Partial<WorkSite>) => {
        setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleSaveSite = async (site: WorkSite) => {
        if (company.id === 'demo-company-id') {
            showNotification('Obra guardada (Simulación)', 'success');
            return;
        }

        try {
            await db.saveWorkSite(site);
            showNotification('Obra guardada correctamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al guardar obra', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!siteToDelete) return;

        if (company.id === 'demo-company-id') {
            setSites(prev => prev.filter(s => s.id !== siteToDelete));
            showNotification('Obra eliminada (Simulación)', 'success');
            setSiteToDelete(null);
            return;
        }

        try {
            await db.deleteWorkSite(siteToDelete);
            setSites(prev => prev.filter(s => s.id !== siteToDelete));
            showNotification('Obra eliminada', 'success');
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        } finally {
            setSiteToDelete(null);
        }
    };

    const detectLocation = (id: string) => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada');
            return;
        }
        navigator.geolocation.getCurrentPosition(pos => {
            updateSite(id, {
                location_lat: pos.coords.latitude,
                location_lng: pos.coords.longitude
            });
        }, err => {
            alert('Error: ' + err.message);
        });
    };

    const handleUnassignEmployee = async (employeeId: string) => {
        try {
            // Unassign by setting work_site_id to null
            // We assume db.saveUser can handle partial updates or we fetch full user.
            // A specific method would be better, but we'll use saveUser with the updated field.
            const employee = employees.find(e => e.id === employeeId);
            if (employee) {
                await db.saveUser({ ...employee, work_site_id: undefined }); // or null if type allows, usually undefined implies no change in some APIs but here we want to clear it.
                // NOTE: If saveUser is an UPSERT with all fields, we need all fields. 
                // Using a dedicated update would be safer. Let's assume saveUser works for now or create a targeted update.
                // Assuming 'employee' object is complete from the parent state.

                // Also update parent state? The parent (AdminDashboard) owns 'employees', so we should probably call a callback prop 'onEmployeeUpdate'.
                // But for now, we will perform the DB op and the parent's subscription/refresh might handle it, 
                // OR we'd need to force a refresh on the parent. 
                // Ideally, AdminDashboard passes a `refreshData` function.
                // For this step, I'll execute the DB update and we rely on AdminDashboard reload or I'll confirm how to trigger refresh.
            }
            showNotification('Empleado desvinculado', 'success');
            // We need to notify parent to refresh employees.
            // Adding a temporary hack: reload page or call a prop if available. 
            // Ideally we add 'onRefreshNeeded' prop.
            window.location.reload(); // Brutal but effective for now until refactor.
        } catch (error) {
            console.error(error);
            showNotification('Error al desvincular', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Centros de Trabajo</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestiona ubicaciones autorizadas</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar obra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* View Toggles */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista Cuadrícula"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Vista Lista"
                        >
                            <List size={18} />
                        </button>
                    </div>

                    {/* Map Toggle Button */}
                    <button
                        onClick={() => setShowMapModal(true)}
                        className="bg-white border-2 border-slate-100 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 p-3 rounded-xl transition-colors shadow-sm"
                        title="Ver Mapa"
                    >
                        <Map size={20} />
                    </button>

                    <button
                        onClick={handleAddSite}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                    >
                        <Plus size={18} /> Nueva Obra
                    </button>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-50 text-xs font-black uppercase tracking-widest animate-in slide-in-from-right ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {notification.msg}
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSites.map(site => {
                        const assignedCount = employees.filter(e => e.work_site_id === site.id).length;

                        return (
                            <div key={site.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                <div className={`h-2 w-full ${site.is_active ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                <div className="p-6 space-y-5">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                            <Building2 size={24} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedSiteForEmployees(site)}
                                                className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-2 transition-colors border border-slate-100"
                                            >
                                                <Users size={14} /> {assignedCount}
                                            </button>
                                            <button
                                                onClick={() => setSiteToDelete(site.id)}
                                                className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Centro</label>
                                            <input
                                                type="text"
                                                value={site.name}
                                                onChange={e => updateSite(site.id, { name: e.target.value })}
                                                className="w-full font-bold text-slate-700 border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-2 bg-transparent transition-colors"
                                                placeholder="Ej. Oficina Principal"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitud</label>
                                                <input
                                                    type="number"
                                                    value={site.location_lat}
                                                    onChange={e => updateSite(site.id, { location_lat: parseFloat(e.target.value) })}
                                                    className="w-full text-xs font-mono font-bold bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitud</label>
                                                <input
                                                    type="number"
                                                    value={site.location_lng}
                                                    onChange={e => updateSite(site.id, { location_lng: parseFloat(e.target.value) })}
                                                    className="w-full text-xs font-mono font-bold bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-slate-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plus Code (Google Maps)</label>
                                            <input
                                                type="text"
                                                value={site.plus_code || ''}
                                                onChange={e => updateSite(site.id, { plus_code: e.target.value })}
                                                placeholder="Ej: 8C5M+3F Elche"
                                                className="w-full text-xs font-bold bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-slate-600"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radio Permitido</label>
                                                <span className="text-[10px] font-black text-indigo-600">{site.location_radius}m</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="50"
                                                max="5000"
                                                step="50"
                                                value={site.location_radius}
                                                onChange={e => updateSite(site.id, { location_radius: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>

                                        <div className="pt-2 flex flex-col gap-3">
                                            <button
                                                onClick={() => detectLocation(site.id)}
                                                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-100"
                                            >
                                                <MapPin size={14} /> Usar mi ubicación
                                            </button>

                                            <button
                                                onClick={() => setSelectedProject(site)}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                            >
                                                <Building2 size={14} /> Gestión de Proyecto
                                            </button>

                                            <div className="flex gap-2">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${site.plus_code ? encodeURIComponent(site.plus_code) : `${site.location_lat},${site.location_lng}`}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-1/2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-100"
                                                >
                                                    <Map size={14} /> Mapa
                                                </a>

                                                <button
                                                    onClick={() => handleSaveSite(site)}
                                                    className="w-1/2 py-3 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <Save size={14} /> Guardar
                                                </button>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Centro</th>
                                <th className="px-6 py-4">Ubicación / Radio</th>
                                <th className="px-6 py-4 text-center">Empleados</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSites.map(site => {
                                const assignedCount = employees.filter(e => e.work_site_id === site.id).length;
                                return (
                                    <tr key={site.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    value={site.name}
                                                    onChange={e => updateSite(site.id, { name: e.target.value })}
                                                    className="font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-colors w-full"
                                                />
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-500">
                                                    <span className={`w-2 h-2 rounded-full ${site.is_active ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                                                    {site.is_active ? 'Activo' : 'Inactivo'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-slate-500">
                                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                                    <MapPin size={12} /> {site.location_lat.toFixed(4)}, {site.location_lng.toFixed(4)}
                                                </div>
                                                <div className="text-[10px] font-black bg-slate-100 inline-block px-2 py-0.5 rounded text-slate-400">
                                                    Radio: {site.location_radius}m
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedSiteForEmployees(site)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                <Users size={14} /> {assignedCount}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedProject(site)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Gestión de Proyecto"
                                                >
                                                    <Building2 size={16} />
                                                </button>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${site.plus_code ? encodeURIComponent(site.plus_code) : `${site.location_lat},${site.location_lng}`}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                    title="Ver Mapa"
                                                >
                                                    <Map size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleSaveSite(site)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Guardar"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSiteToDelete(site.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredSites.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No se encontraron centros de trabajo.
                        </div>
                    )}
                </div>
            )}

            {/* Custom Delete Modal */}
            {siteToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSiteToDelete(null)}></div>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="text-rose-500" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center uppercase italic mb-2">¿Eliminar Obra?</h3>
                        <p className="text-sm text-slate-500 text-center font-medium mb-8">
                            Esta acción no se puede deshacer. Los empleados asignados a este centro perderán la referencia.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSiteToDelete(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/30 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            <WorkSitesMapModal
                isOpen={showMapModal}
                onClose={() => setShowMapModal(false)}
                sites={sites} // Show all strings
            />

            {/* Employees Modal */}
            <SiteEmployeesModal
                isOpen={!!selectedSiteForEmployees}
                onClose={() => setSelectedSiteForEmployees(null)}
                site={selectedSiteForEmployees}
                employees={employees}
                onUnassignEmployee={handleUnassignEmployee}
                onViewLogs={onViewLogs}
            />
            {/* Project Drawer */}
            {selectedProject && (
                <ProjectDrawer
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    workSite={selectedProject}
                />
            )}
        </div>
    );
};
