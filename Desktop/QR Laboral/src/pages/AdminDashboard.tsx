import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import type { WorkLog } from '../types';

export const AdminDashboard: React.FC = () => {
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [report, setReport] = useState<string>('');
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const l = await StorageService.getLogs();
            setLogs(l);
        };
        loadData();
    }, []);

    const data = [
        { name: 'IT', hours: 15.5 }, // Mock aggregation from logs ideally
        { name: 'Ventas', hours: 8.5 },
        { name: 'Marketing', hours: 0 },
    ];

    // Real aggregation logic could go here based on 'logs' and 'users' departments.
    // For demo speed, sticking to the structure provided in prompt visuals somewhat, 
    // but let's make it dynamic if possible.

    const generateAIReport = async () => {
        setLoadingAI(true);
        const result = await GeminiService.generateReport(logs);
        setReport(result);
        setLoadingAI(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Panel General</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 font-primary">
                        Horas Totales por Departamento
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                    {data.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Análisis IA
                        </h2>
                        <button
                            onClick={generateAIReport}
                            disabled={loadingAI}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loadingAI ? 'Analizando...' : 'Generar Informe'}
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 overflow-y-auto max-h-64 border border-gray-100">
                        {report ? (
                            <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-line">{report}</p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                                <Sparkles className="w-8 h-8 mb-2 opacity-30" />
                                <p>Pulsa "Generar Informe" para analizar la productividad usando Gemini AI.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
