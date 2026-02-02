import React, { useState, useEffect } from 'react';
import { ProjectExpense, WorkSite } from '../../types';
import { db } from '../../services/supabaseService';
import { Plus, DollarSign, TrendingUp, TrendingDown, Receipt, Trash2 } from 'lucide-react';

interface ProjectFinancialsProps {
    workSite: WorkSite;
}

export const ProjectFinancials: React.FC<ProjectFinancialsProps> = ({ workSite }) => {
    const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
    const [loading, setLoading] = useState(false);
    const [budget, setBudget] = useState(workSite.budget_estimated || 0);

    useEffect(() => {
        loadData();
    }, [workSite.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const dbExpenses = await db.getProjectExpenses(workSite.id);
            if (dbExpenses.length === 0 && workSite.id.startsWith('demo')) {
                setExpenses([
                    { id: 'e1', work_site_id: workSite.id, description: 'Pago Inicial Contratista', amount: 4500, date: new Date().toISOString(), category: 'LABOR' },
                    { id: 'e2', work_site_id: workSite.id, description: 'Materiales Cimentación', amount: 2300.50, date: new Date().toISOString(), category: 'MATERIAL' },
                    { id: 'e3', work_site_id: workSite.id, description: 'Licencia de Obra', amount: 150, date: new Date().toISOString(), category: 'PERMITS' },
                ]);
            } else {
                setExpenses(dbExpenses);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const deviation = budget - totalExpenses;
    const deviationColor = deviation >= 0 ? 'text-emerald-600' : 'text-rose-600';

    return (
        <div className="space-y-6">
            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presupuesto Inicial</div>
                    <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        {budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                            <DollarSign size={14} />
                        </button>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gastos Ejecutados</div>
                    <div className="text-2xl font-black text-slate-800">
                        {totalExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${deviation < 0 ? 'bg-rose-50 border-rose-100' : ''}`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desviación / Restante</div>
                    <div className={`text-2xl font-black ${deviationColor} flex items-center gap-2`}>
                        {deviation.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        {deviation >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Registro de Gastos</h3>
                    <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors">
                        <Plus size={14} /> Añadir Gasto
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {expenses.map(expense => (
                        <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-slate-100 text-slate-500">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm">{expense.description}</h4>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 mt-1">
                                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className={
                                            expense.category === 'MATERIAL' ? 'text-blue-500' :
                                                expense.category === 'LABOR' ? 'text-amber-500' :
                                                    'text-slate-500'
                                        }>{expense.category}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-slate-700">
                                    -{expense.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                                <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic text-sm">
                            No hay gastos registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
