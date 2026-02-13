import React, { useState, useEffect } from 'react';
import { User, Role, WorkSchedule, EmployeeLeave } from '../types';
import { X, Save, User as UserIcon, Briefcase, Building, Mail, Phone, Shield, Trash2, Key, MapPin, Calendar, Clock, Plane } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { NotificationToast } from './NotificationToast';
import { db } from '../services/supabaseService';

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
    const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'security' | 'attendance'>('profile');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Attendance State
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    useEffect(() => {
        if (employee && activeTab === 'attendance') {
            loadAttendanceData();
        }
    }, [employee, activeTab]);

    const loadAttendanceData = async () => {
        if (!employee) return;
        setLoadingAttendance(true);
        try {
            const [scheds, lvs] = await Promise.all([
                db.getSchedules(employee.id),
                db.getEmployeeLeaves(employee.id)
            ]);
            setSchedules(scheds);
            setLeaves(lvs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleScheduleChange = (id: string, field: 'start_time' | 'end_time' | 'auto_generate', value: any) => {
        setSchedules(prev => {
            return prev.map(s => {
                if (s.id === id) {
                    return { ...s, [field]: value };
                }
                return s;
            });
        });
    };

    const handleAddScheduleSlot = (day: number) => {
        const newSchedule: WorkSchedule = {
            id: `temp-${Date.now()}-${Math.random()}`, // Temp ID for React key
            user_id: employee?.id || '',
            day_of_week: day,
            start_time: '',
            end_time: '',
            auto_generate: false
        };
        setSchedules(prev => [...prev, newSchedule]);
    };

    const handleSaveSchedule = async (scheduleId: string, updates?: Partial<WorkSchedule>) => {
        if (!employee) return;

        const foundSchedule = schedules.find(s => s.id === scheduleId);
        if (!foundSchedule) return;

        // Merge updates (like auto_generate override)
        const schedule = { ...foundSchedule, ...updates };

        const { start_time, end_time, auto_generate, id, day_of_week } = schedule;

        // 1. Delete if empty (or user cleared it)
        if (!start_time && !end_time) {
            // Only delete from DB if it has a real UUID (not temp)
            if (id && !id.startsWith('temp-')) {
                try {
                    await db.deleteSchedule(id);
                    setSchedules(prev => prev.filter(s => s.id !== id));
                    showNotification('Turno eliminado', 'success');
                } catch (e) {
                    console.error(e);
                    showNotification('Error al eliminar turno', 'error');
                }
            } else {
                // Just remove from state
                setSchedules(prev => prev.filter(s => s.id !== id));
            }
            return;
        }

        // 2. Ignore incomplete
        if (!start_time || !end_time) {
            return;
        }

        // 3. Save/Update
        // Remove temp ID before sending to DB if it's new
        const isNew = id.startsWith('temp-');
        const payload: Partial<WorkSchedule> = {
            ...(isNew ? {} : { id }),
            user_id: employee.id,
            day_of_week,
            start_time,
            end_time,
            auto_generate
        };

        try {
            await db.saveSchedule(payload);
            // Refresh to get real IDs
            const updated = await db.getSchedules(employee.id);
            setSchedules(updated);
            showNotification('Turno guardado', 'success');
        } catch (e) {
            console.error(e);
            showNotification('Error al guardar turno', 'error');
        }
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('¿Eliminar este turno?')) return;

        // If real ID, delete from DB
        if (scheduleId && !scheduleId.startsWith('temp-')) {
            try {
                await db.deleteSchedule(scheduleId);
                setSchedules(prev => prev.filter(s => s.id !== scheduleId));
                showNotification('Turno eliminado', 'success');
            } catch (e) {
                console.error(e);
                showNotification('Error al eliminar', 'error');
            }
        } else {
            // Just remove from state
            setSchedules(prev => prev.filter(s => s.id !== scheduleId));
        }
    };

    const handleAddLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const type = (form.elements.namedItem('leaveType') as HTMLSelectElement).value;
        const start = (form.elements.namedItem('leaveStart') as HTMLInputElement).value;
        const end = (form.elements.namedItem('leaveEnd') as HTMLInputElement).value;

        if (!employee || !type || !start || !end) return;

        try {
            await db.saveEmployeeLeave({
                user_id: employee.id,
                type: type as any,
                start_date: start,
                end_date: end,
                status: 'APPROVED' // Admin doing it, so auto-approve
            });
            const updated = await db.getEmployeeLeaves(employee.id);
            setLeaves(updated);
            showNotification('Ausencia registrada', 'success');
            form.reset();
        } catch (err) {
            console.error(err);
            showNotification('Error al registrar ausencia', 'error');
        }
    };

    const handleDeleteLeave = async (id: string) => {
        if (!confirm('¿Eliminar esta ausencia?')) return;
        try {
            await db.deleteEmployeeLeave(id);
            setLeaves(prev => prev.filter(l => l.id !== id));
            showNotification('Ausencia eliminada', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error al eliminar', 'error');
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

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
                    <TabButton id="security" label="Acceso y Seguridad" icon={Key} isActive={activeTab === 'security'} />
                    <TabButton id="attendance" label="Presencia" icon={Calendar} isActive={activeTab === 'attendance'} />
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
                                <div className="space-y-4 pb-6 border-b border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase">Credenciales de Acceso</h3>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIN de Seguridad (4 dígitos)</label>
                                        <div className="relative">
                                            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={formData.pin_code || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setFormData({ ...formData, pin_code: val });
                                                }}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm font-mono"
                                                placeholder="0000"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 pl-1">Usado para fichar en Muro QR y Kiosco.</p>
                                    </div>
                                </div>

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

                        {/* --- ATTENDANCE TAB --- */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* Weekly Schedule */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Clock size={16} className="text-indigo-500" /> Horario Semanal Fijo
                                    </h3>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dName, idx) => {
                                            const dayNum = idx + 1;
                                            const daySchedules = schedules.filter(s => s.day_of_week === dayNum);

                                            // Always show at least one row if empty? Or just the header + add button?
                                            // Let's standard: Row header + list of shifts

                                            return (
                                                <div key={dayNum} className="p-3 flex items-start justify-between hover:bg-slate-50 transition-colors gap-4">
                                                    <div className="w-24 pt-2 text-xs font-bold text-slate-600 shrink-0">{dName}</div>

                                                    <div className="flex-1 space-y-2">
                                                        {daySchedules.map((sched, sIdx) => (
                                                            <div key={sched.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                                                <input type="time"
                                                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                                                                    value={sched.start_time || ''}
                                                                    onChange={(e) => handleScheduleChange(sched.id, 'start_time', e.target.value)}
                                                                    onBlur={() => handleSaveSchedule(sched.id)}
                                                                />
                                                                <span className="text-slate-400 text-xs">-</span>
                                                                <input type="time"
                                                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                                                                    value={sched.end_time || ''}
                                                                    onChange={(e) => handleScheduleChange(sched.id, 'end_time', e.target.value)}
                                                                    onBlur={() => handleSaveSchedule(sched.id)}
                                                                />

                                                                <label className="flex items-center gap-1 cursor-pointer ml-2" title="Auto-generar fichaje">
                                                                    <input type="checkbox"
                                                                        className="accent-indigo-600 w-3 h-3 rounded"
                                                                        checked={sched.auto_generate || false}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            handleScheduleChange(sched.id, 'auto_generate', checked);
                                                                            // Save immediately on checkbox toggle - PASS EXPLICIT OVERRIDE
                                                                            setTimeout(() => handleSaveSchedule(sched.id, { auto_generate: checked }), 100);
                                                                        }}
                                                                    />
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Auto</span>
                                                                </label>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSchedule(sched.id)}
                                                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors ml-auto"
                                                                    title="Eliminar turno"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {daySchedules.length === 0 && (
                                                            <div className="text-[10px] text-slate-400 italic pt-2">Sin horario asignado</div>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddScheduleSlot(dayNum)}
                                                        className="mt-1 p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                                                        title="Añadir turno"
                                                    >
                                                        <span className="w-3.5 h-3.5 font-bold flex items-center justify-center text-lg leading-none pb-0.5" >+</span>
                                                        {/* Using simple text + for reliability if icon issues, but Lucide Plus is standard. 
                                                            Actually, let's use a simple + styling or Plus icon if imported. 
                                                            I didn't see Plus imported. I'll use a text. 
                                                        */}
                                                        <span className="font-bold text-xs leading-none">+</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-slate-400">Si se define, se generarán fichajes automáticos si el empleado olvida fichar (según config).</p>
                                </div>

                                {/* Leaves */}
                                <div className="space-y-4 pt-6 border-t border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Plane size={16} className="text-indigo-500" /> Ausencias y Permisos
                                    </h3>

                                    {/* Add Form */}
                                    <div className="flex gap-2 items-end bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Tipo</label>
                                            <select name="leaveType" form="add-leave-form" className="w-full text-xs p-2 border border-slate-200 rounded">
                                                <option value="VACATION">Vacaciones</option>
                                                <option value="SICK_LEAVE">Baja Médica</option>
                                                <option value="PERSONAL">Asuntos Propios</option>
                                                <option value="OTHER">Otro</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Desde</label>
                                            <input name="leaveStart" type="date" className="w-full text-xs p-2 border border-slate-200 rounded" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Hasta</label>
                                            <input name="leaveEnd" type="date" className="w-full text-xs p-2 border border-slate-200 rounded" />
                                        </div>
                                        <button type="button" onClick={(e) => {
                                            const type = (document.getElementsByName('leaveType')[0] as any).value;
                                            const start = (document.getElementsByName('leaveStart')[0] as any).value;
                                            const end = (document.getElementsByName('leaveEnd')[0] as any).value;

                                            if (!start || !end) {
                                                showNotification('Selecciona fechas para la ausencia', 'error');
                                                return;
                                            }

                                            const fakeE = {
                                                preventDefault: () => { },
                                                target: {
                                                    elements: {
                                                        namedItem: (n: string) => {
                                                            if (n === 'leaveType') return { value: type };
                                                            if (n === 'leaveStart') return { value: start };
                                                            if (n === 'leaveEnd') return { value: end };
                                                            return { value: '' };
                                                        }
                                                    }
                                                }
                                            } as any;
                                            handleAddLeave(fakeE);

                                            // Clear inputs manually after save
                                            (document.getElementsByName('leaveStart')[0] as any).value = '';
                                            (document.getElementsByName('leaveEnd')[0] as any).value = '';

                                        }} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition-colors">
                                            <Save size={16} />
                                        </button>
                                    </div>

                                    {/* List */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Tipo</th>
                                                    <th className="px-4 py-2">Desde</th>
                                                    <th className="px-4 py-2">Hasta</th>
                                                    <th className="px-4 py-2 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {leaves.map(l => (
                                                    <tr key={l.id}>
                                                        <td className="px-4 py-2 font-bold text-slate-700">
                                                            {l.type === 'VACATION' ? '🏖️ Vacaciones' : l.type === 'SICK_LEAVE' ? '💊 Baja' : '📝 Personal'}
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-slate-500">{new Date(l.start_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 font-mono text-slate-500">{new Date(l.end_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button type="button" onClick={() => handleDeleteLeave(l.id)} className="text-rose-400 hover:text-rose-600">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {leaves.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">No hay ausencias registradas.</td></tr>}
                                            </tbody>
                                        </table>
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
