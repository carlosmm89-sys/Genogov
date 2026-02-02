import React from 'react';
import { User, WorkSite } from '../types';
import { X, UserMinus, Search, User as UserIcon, ClipboardList } from 'lucide-react';

interface SiteEmployeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    site: WorkSite | null;
    employees: User[];
    onUnassignEmployee: (employeeId: string) => Promise<void>;
    onViewLogs?: (employeeId: string) => void;
}

export const SiteEmployeesModal: React.FC<SiteEmployeesModalProps> = ({
    isOpen,
    onClose,
    site,
    employees,
    onUnassignEmployee,
    onViewLogs
}) => {
    if (!isOpen || !site) return null;

    const assignedEmployees = employees.filter(e => e.work_site_id === site.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 leading-tight">{site.name}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {assignedEmployees.length} Empleados Asignados
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {assignedEmployees.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <UserIcon size={32} />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">No hay empleados asignados a este centro.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignedEmployees.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border-2 border-slate-50">
                                            {emp.avatar_url ? (
                                                <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                emp.full_name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-700 text-sm">{emp.full_name}</h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{emp.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {onViewLogs && (
                                            <button
                                                onClick={() => {
                                                    onViewLogs(emp.id);
                                                    onClose();
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ver Registro Laboral"
                                            >
                                                {/* Use Clock or FileText icon */}
                                                <ClipboardList size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (confirm(`¿Desvincular a ${emp.full_name} de esta obra?`)) {
                                                    onUnassignEmployee(emp.id);
                                                }
                                            }}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Desvincular de la obra"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
