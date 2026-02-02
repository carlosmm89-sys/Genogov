import React, { useState } from 'react';
import { User, Role } from '../types';
import { X, Save, UserPlus, Mail, Briefcase, Lock, Shield, Building, Eye, EyeOff } from 'lucide-react';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Partial<User> & { password?: string }) => void;
    availableSites?: any[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSave, availableSites = [] }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        username: '',
        password: '',
        department: 'General',
        position: 'Empleado',
        role: 'EMPLOYEE' as Role,
        work_site_id: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            // Auto-generate username if empty from email
            username: formData.username || formData.email.split('@')[0]
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-[#0f172a] p-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <UserPlus className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nuevo Empleado</h2>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">Alta en Seguridad Social y Accesos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Full Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Mail size={12} /> Email Corporativo</label>
                            <input
                                required
                                type="email"
                                placeholder="empleado@empresa.com"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password with Eye */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock size={12} /> Contraseña Inicial</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors pr-12"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase size={12} /> Departamento</label>
                            <div className="relative">
                                <input
                                    list="departments"
                                    type="text"
                                    placeholder="Selecciona o escribe uno nuevo"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                                <datalist id="departments">
                                    <option value="General" />
                                    <option value="Ventas" />
                                    <option value="Sistemas" />
                                    <option value="Operaciones" />
                                    <option value="RRHH" />
                                    <option value="Dirección" />
                                </datalist>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Shield size={12} /> Rol de Acceso</label>
                            <select
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                            >
                                <option value="EMPLOYEE">Empleado (Fichar)</option>
                                <option value="ADMIN">Administrador (Total)</option>
                            </select>
                        </div>

                        {/* Work Site */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Building size={12} /> Centro de Trabajo / Obra
                            </label>
                            <select
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                                value={formData.work_site_id}
                                onChange={e => setFormData({ ...formData, work_site_id: e.target.value })}
                            >
                                <option value="">-- Sin asignar (Usar Configuración General) --</option>
                                {availableSites.map((site: any) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                        >
                            <Save size={18} /> Guardar Ficha
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
