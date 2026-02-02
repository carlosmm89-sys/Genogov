import React, { useState, useEffect } from 'react';
import { WorkSite, ProjectPhase, ProjectTask } from '../../types';
import { X, Layout, DollarSign, FileText, CheckSquare, Briefcase, Calendar } from 'lucide-react';
import { ProjectPhases } from './ProjectPhases';
import { ProjectFinancials } from './ProjectFinancials';
import { ProjectDocuments } from './ProjectDocuments';

interface ProjectDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    workSite: WorkSite;
}

type Tab = 'SUMMARY' | 'PHASES' | 'FINANCIAL' | 'DOCUMENTS';

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose, workSite }) => {
    const [activeTab, setActiveTab] = useState<Tab>('SUMMARY');
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter backdrop handler
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-inter animate-in slide-in-from-right">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${workSite.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {workSite.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                                {workSite.project_type && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600">
                                        {workSite.project_type}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight">{workSite.name}</h2>
                            <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1"><Briefcase size={14} /> Gestión de Proyecto</span>
                                {workSite.start_date && (
                                    <span className="flex items-center gap-1"><Calendar size={14} /> Inicio: {new Date(workSite.start_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stats Summary (Mini) */}
                    <div className="flex gap-6 mt-4 pt-4 border-t border-slate-50">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Presupuesto</div>
                            <div className="text-sm font-black text-slate-700">
                                {workSite.budget_estimated ? `${workSite.budget_estimated.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}` : '-'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estado</div>
                            <div className="text-sm font-black text-slate-700">{workSite.project_status || 'PLANNING'}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 gap-6">
                    <TabButton active={activeTab === 'SUMMARY'} onClick={() => setActiveTab('SUMMARY')} icon={<Layout size={16} />} label="Resumen" />
                    <TabButton active={activeTab === 'PHASES'} onClick={() => setActiveTab('PHASES')} icon={<CheckSquare size={16} />} label="Fases y Tareas" />
                    <TabButton active={activeTab === 'FINANCIAL'} onClick={() => setActiveTab('FINANCIAL')} icon={<DollarSign size={16} />} label="Económico" />
                    <TabButton active={activeTab === 'DOCUMENTS'} onClick={() => setActiveTab('DOCUMENTS')} icon={<FileText size={16} />} label="Documentos" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4">Resumen del Proyecto</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {workSite.description || 'No hay descripción definida para este proyecto.'}
                                </p>
                            </div>
                            {/* Placeholder for future widgets */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 py-8">
                                    <span className="text-xs font-bold uppercase">Progreso General</span>
                                    <span className="text-2xl font-black mt-2">0%</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 py-8">
                                    <span className="text-xs font-bold uppercase">Tareas Pendientes</span>
                                    <span className="text-2xl font-black mt-2">0</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PHASES' && (
                        <ProjectPhases workSite={workSite} />
                    )}

                    {activeTab === 'FINANCIAL' && (
                        <ProjectFinancials workSite={workSite} />
                    )}

                    {activeTab === 'DOCUMENTS' && (
                        <ProjectDocuments workSite={workSite} />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                        CerrarPanel
                    </button>
                    <button className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-4 border-b-2 transition-colors text-sm font-bold ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        {label}
    </button>
);
