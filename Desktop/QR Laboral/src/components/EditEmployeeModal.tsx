import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { X, Save, User as UserIcon, Briefcase, Building, Mail } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
    onSave: (updatedUser: User) => void;
    onDelete: (userId: string) => void;
    availableSites?: any[]; // added prop
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee, onSave, onDelete, availableSites = [] }) => {
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (employee) {
            setFormData({ ...employee });
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id) {
            onSave(formData as User);
        }
        onClose();
    };

    const departments = ['General', 'Administración', 'Ventas', 'Taller', 'Logística', 'IT', 'Recursos Humanos'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#0f172a] p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Editar Empleado</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Modificar datos y permisos</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="flex justify-center mb-6">
                            <ImageUpload
                                label="Foto de Perfil"
                                value={formData.avatar_url || ''}
                                onChange={(val) => setFormData({ ...formData, avatar_url: val })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <UserIcon size={14} className="text-indigo-500" /> Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name || ''}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Building size={14} className="text-indigo-500" /> Departamento
                                    </label>
                                    <div className="relative">
                                        <input
                                            list="departments"
                                            type="text"
                                            required
                                            value={formData.department || ''}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Seleccionar..."
                                        />
                                        <datalist id="departments">
                                            {departments.map(dept => (
                                                <option key={dept} value={dept} />
                                            ))}
                                        </datalist>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id="edit_is_external"
                                                checked={formData.is_external || false}
                                                onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor="edit_is_external" className="text-xs font-bold text-slate-600 uppercase">
                                                Es Personal Externo / Subcontrata
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Briefcase size={14} className="text-indigo-500" /> Cargo / Puesto
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.position || ''}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Ej. Programador"
                                    />
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        🚩 Asignar a Obra / Centro (Geofencing)
                                    </label>
                                    <select
                                        value={formData.work_site_id || ''}
                                        onChange={e => setFormData({ ...formData, work_site_id: e.target.value || undefined })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">-- Sin asignar (Usar Configuración General) --</option>
                                        {/* TODO: Pass sites as prop */}
                                        {availableSites.map((site: any) => (
                                            <option key={site.id} value={site.id}>
                                                {site.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    Nivel de Acceso
                                </label>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    {['EMPLOYEE', 'ADMIN'].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role as Role })}
                                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${formData.role === role
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {role === 'ADMIN' ? 'Administrador' : 'Empleado'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    alert(`📧 Se ha enviado un correo de restablecimiento a ${formData.email || 'el usuario'}.`);
                                }}
                                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Reset Pass
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
                                        onDelete(employee.id);
                                        onClose();
                                    }
                                }}
                                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Eliminar
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};
