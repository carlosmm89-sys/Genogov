import React, { useState, useEffect } from 'react';
import { WorkSite } from '../../types';
import { db } from '../../services/supabaseService';
import { FileText, Download, Calendar, Search } from 'lucide-react';

interface ProjectDocumentsProps {
    workSite: WorkSite;
}

interface ProjectDoc {
    id: string;
    title: string;
    type: 'TASK_ATTACHMENT' | 'EXPENSE_RECEIPT';
    url: string;
    date: string;
    relatedTo: string; // Task title or Expense description
}

export const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ workSite }) => {
    const [documents, setDocuments] = useState<ProjectDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadData();
    }, [workSite.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Aggregate documents from Tasks and Expenses
            const tasks = await db.getProjectTasks(workSite.id);
            const expenses = await db.getProjectExpenses(workSite.id);

            const docs: ProjectDoc[] = [];

            tasks.forEach(task => {
                if (task.attachment_url) {
                    docs.push({
                        id: `doc-task-${task.id}`,
                        title: `Evidencia: ${task.title}`,
                        type: 'TASK_ATTACHMENT',
                        url: task.attachment_url,
                        date: task.created_at,
                        relatedTo: task.title
                    });
                }
            });

            expenses.forEach(exp => {
                if (exp.receipt_url) {
                    docs.push({
                        id: `doc-exp-${exp.id}`,
                        title: `Recibo: ${exp.description}`,
                        type: 'EXPENSE_RECEIPT',
                        url: exp.receipt_url,
                        date: exp.date,
                        relatedTo: exp.description
                    });
                }
            });

            // Mock for demo
            if (docs.length === 0 && workSite.id.startsWith('demo')) {
                docs.push(
                    { id: 'd1', title: 'Plano de Estructura v2.pdf', type: 'TASK_ATTACHMENT', url: '#', date: new Date().toISOString(), relatedTo: 'Revisión Planos' },
                    { id: 'd2', title: 'Factura Materiales #9923', type: 'EXPENSE_RECEIPT', url: '#', date: new Date().toISOString(), relatedTo: 'Compra Cemento' }
                );
            }

            setDocuments(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(filter.toLowerCase()) ||
        doc.relatedTo.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header / Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="font-bold text-slate-700">Repositorio Documental</div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar archivo..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 w-64"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${doc.type === 'TASK_ATTACHMENT' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <FileText size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-700 truncate" title={doc.title}>{doc.title}</h4>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <span className="uppercase font-bold tracking-wider">{doc.type === 'TASK_ATTACHMENT' ? 'Tarea' : 'Gasto'}</span>
                                    <span>•</span>
                                    <span>{new Date(doc.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 truncate">Ref: {doc.relatedTo}</p>
                            </div>
                            <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDocs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No se encontraron documentos.</p>
                </div>
            )}
        </div>
    );
};
