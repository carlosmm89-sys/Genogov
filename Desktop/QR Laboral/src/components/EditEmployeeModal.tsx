import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { X, Save, User as UserIcon, Briefcase, Building, Mail, Phone, Shield, Trash2, Key, MapPin } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { NotificationToast } from './NotificationToast';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
    onSave: (updatedUser: User) => void;
    onDelete: (userId: string) => void;
    onResetPassword: (email: string) => void;
    availableSites?: any[];
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee, onSave, onDelete, onResetPassword, availableSites = [] }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'security'>('profile');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (employee) {
            setFormData({ ...employee });
            setActiveTab('profile'); // Reset tab on open
        }
    }, [employee, isOpen]);

    if (!isOpen || !employee) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id) {
            onSave(formData as User);
        }
        onClose();
    };

    const departments = ['General', 'Administración', 'Ventas', 'Taller', 'Logística', 'IT', 'Recursos Humanos'];

    const TabButton = ({ id, label, icon: Icon, isActive }: { id: string, label: string, icon: any, isActive: boolean }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${isActive
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <UserIcon size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Editar Empleado</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Gestión de ficha personal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-white">
                    <TabButton id="profile" label="Perfil Personal" icon={UserIcon} isActive={activeTab === 'profile'} />
                    <TabButton id="job" label="Datos Laborales" icon={Briefcase} isActive={activeTab === 'job'} />
                    <TabButton id="security" label="Acceso y Seguridad" icon={Shield} isActive={activeTab === 'security'} />
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* --- PERFIL TAB --- */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="shrink-0 mx-auto md:mx-0">
                                        <ImageUpload
                                            label="Foto"
                                            value={formData.avatar_url || ''}
                                            onChange={(val) => setFormData({ ...formData, avatar_url: val })}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                                            <div className="relative">
                                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.full_name || ''}
                                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                    placeholder="Nombre y Apellidos"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DNI / Identificación</label>
                                            <input
                                                type="text"
                                                value={formData.dni || ''}
                                                onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="Documento de Identidad"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email || ''}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="ejemplo@empresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone || ''}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="+34 600 000 000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- JOB TAB --- */}
                        {activeTab === 'job' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</label>
                                        <div className="relative">
                                            <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                list="departments"
                                                type="text"
                                                required
                                                value={formData.department || ''}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="Seleccionar..."
                                            />
                                            <datalist id="departments">
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo / Puesto</label>
                                        <div className="relative">
                                            <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.position || ''}
                                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="Ej. Técnico"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Centro de Trabajo (Geofencing)</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={formData.work_site_id || ''}
                                            onChange={e => setFormData({ ...formData, work_site_id: e.target.value || undefined })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Usar Configuración General de la Empresa --</option>
                                            {availableSites.map((site: any) => (
                                                <option key={site.id} value={site.id}>
                                                    {site.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-slate-400 pl-1">El empleado solo podrá fichar cerca de esta ubicación.</p>
                                </div>

                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="edit_is_external"
                                        checked={formData.is_external || false}
                                        onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div>
                                        <label htmlFor="edit_is_external" className="text-sm font-bold text-indigo-900 cursor-pointer block">
                                            Personal Externo / Subcontrata
                                        </label>
                                        <p className="text-xs text-indigo-600/70">Marcar si no pertenece a la plantilla fija.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- SECURITY TAB --- */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol de Sistema</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['EMPLOYEE', 'ADMIN'].map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: role as Role })}
                                                className={`py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border-2 text-left flex flex-col gap-1 ${formData.role === role
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                                                    }`}
                                            >
                                                <span>{role === 'ADMIN' ? 'Administrador' : 'Empleado'}</span>
                                                <span className="text-[9px] opacity-70 font-normal capitalize">
                                                    {role === 'ADMIN' ? 'Acceso total al panel' : 'Solo fichaje y consultas propias'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase">Zona de Peligro</h3>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (formData.email) {
                                                    onResetPassword(formData.email);
                                                    setNotification({
                                                        message: `📧 Enviando correo a ${formData.email}...`,
                                                        type: 'success'
                                                    });
                                                    setTimeout(() => setNotification(null), 3000);
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-200/50 rounded-lg text-amber-700 group-hover:bg-amber-200 transition-colors">
                                                    <Key size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold">Restablecer Contraseña</p>
                                                    <p className="text-xs opacity-80">Envía un email para crear una nueva clave.</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded">Enviar Email</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDelete(employee.id)}
                                            className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-200/50 rounded-lg text-rose-700 group-hover:bg-rose-200 transition-colors">
                                                    <Trash2 size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold">Eliminar Empleado</p>
                                                    <p className="text-xs opacity-80">Borra permanentemente todos los datos.</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded">Eliminar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-employee-form"
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>

                {notification && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50 animate-in slide-in-from-top-2">
                        <NotificationToast
                            message={notification.message}
                            type={notification.type}
                            onClose={() => setNotification(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
