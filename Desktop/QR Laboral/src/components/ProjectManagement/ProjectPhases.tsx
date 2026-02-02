import React, { useState, useEffect } from 'react';
import { ProjectPhase, ProjectTask, WorkSite } from '../../types';
import { db } from '../../services/supabaseService';
import { Plus, ChevronDown, ChevronRight, Circle, CheckCircle2, Clock, Upload, Trash2, Calendar } from 'lucide-react';

interface ProjectPhasesProps {
    workSite: WorkSite;
}

export const ProjectPhases: React.FC<ProjectPhasesProps> = ({ workSite }) => {
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [workSite.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Mock data for demo if DB is empty or not yet migrated
            const dbPhases = await db.getProjectPhases(workSite.id);
            const dbTasks = await db.getProjectTasks(workSite.id);

            if (dbPhases.length === 0 && workSite.id.startsWith('demo')) {
                setPhases([
                    { id: 'p1', work_site_id: workSite.id, name: 'Fase 1: Demolición', order_index: 0, status: 'COMPLETED' },
                    { id: 'p2', work_site_id: workSite.id, name: 'Fase 2: Instalaciones', order_index: 1, status: 'IN_PROGRESS' },
                    { id: 'p3', work_site_id: workSite.id, name: 'Fase 3: Acabados', order_index: 2, status: 'PENDING' },
                ]);
                setTasks([
                    { id: 't1', phase_id: 'p1', work_site_id: workSite.id, title: 'Evidencias de demolición (Fotos)', status: 'VALIDATED', priority: 'HIGH', created_at: new Date().toISOString() },
                    { id: 't2', phase_id: 'p1', work_site_id: workSite.id, title: 'Certificado de gestión de residuos', status: 'PENDING', priority: 'MEDIUM', created_at: new Date().toISOString() },
                    { id: 't3', phase_id: 'p2', work_site_id: workSite.id, title: 'Memoria Técnica Instalaciones', status: 'PENDING', priority: 'HIGH', created_at: new Date().toISOString() },
                ]);
                setExpandedPhase('p2');
            } else {
                setPhases(dbPhases);
                setTasks(dbTasks);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const togglePhase = (phaseId: string) => {
        setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Fases del Proyecto</h3>
                <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors">
                    <Plus size={14} /> Nueva Fase
                </button>
            </div>

            <div className="space-y-4">
                {phases.map(phase => {
                    const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
                    const completedTasks = phaseTasks.filter(t => t.status === 'VALIDATED' || t.status === 'DONE').length;
                    const progress = phaseTasks.length > 0 ? (completedTasks / phaseTasks.length) * 100 : 0;
                    const isExpanded = expandedPhase === phase.id;

                    return (
                        <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                            {/* Phase Header */}
                            <div
                                onClick={() => togglePhase(phase.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400">
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{phase.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{Math.round(progress)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${phase.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                    phase.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    {phase.status === 'IN_PROGRESS' ? 'En Curso' : phase.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                                </div>
                            </div>

                            {/* Tasks List */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/30 p-4 space-y-3">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checklist de Justificación</span>
                                        <button className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                            <Plus size={12} /> Añadir Tarea
                                        </button>
                                    </div>

                                    {phaseTasks.map(task => (
                                        <div key={task.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${task.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-500' :
                                                    task.status === 'DONE' ? 'bg-blue-50 text-blue-500' :
                                                        'bg-slate-50 text-slate-400'
                                                    }`}>
                                                    {task.status === 'VALIDATED' ? <CheckCircle2 size={18} /> :
                                                        task.status === 'DONE' ? <CheckCircle2 size={18} /> :
                                                            <Clock size={18} />}
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-700">{task.title}</h5>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] uppercase font-bold ${task.status === 'VALIDATED' ? 'text-emerald-500' :
                                                            task.status === 'DONE' ? 'text-blue-500' :
                                                                'text-amber-500'
                                                            }`}>
                                                            {task.status === 'VALIDATED' ? 'Validado' :
                                                                task.status === 'DONE' ? 'Subido' :
                                                                    'Pendiente'}
                                                        </span>
                                                        {task.status === 'PENDING' && (
                                                            <span className="text-[10px] text-slate-400 font-medium">Sin archivo</span>
                                                        )}
                                                        {task.attachment_url && (
                                                            <span className="text-[10px] text-indigo-500 font-bold underline cursor-pointer">Ver archivo</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors" title="Subir evidencia">
                                                    <Upload size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {phaseTasks.length === 0 && (
                                        <div className="text-center py-4 text-xs text-slate-400 italic">
                                            No hay tareas en esta fase.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {phases.length === 0 && (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p>No hay fases definidas para este proyecto.</p>
                        <button className="mt-2 text-sm font-bold text-indigo-600 hover:underline">
                            Crear primera fase
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
