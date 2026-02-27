import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles } from 'lucide-react';
import { db } from '../services/supabaseService';
import type { WorkLog } from '../types';

export const AdminDashboard: React.FC = () => {
    const [logs, setLogs] = useState<WorkLog[]>([]);

    // Carga de datos reales
    useEffect(() => {
        const loadData = async () => {
            // 1. Obtener logs y usuarios
            const [allLogs, allUsers] = await Promise.all([
                db.getLogs(),
                db.getUsers()
            ]);

            setLogs(allLogs);

            // 2. Agrupar por departamento
            const deptMap: Record<string, number> = {};

            allLogs.forEach(log => {
                const user = allUsers.find(u => u.id === log.user_id);
                const dept = user?.department || 'Sin Departamento';

                if (!deptMap[dept]) deptMap[dept] = 0;
                deptMap[dept] += log.total_hours || 0;
            });

            // 3. Formatear para gráfica
            const chartData = Object.entries(deptMap).map(([name, hours]) => ({
                name,
                hours: parseFloat(hours.toFixed(2))
            }));

            // Si no hay datos, mostrar placeholder
            if (chartData.length === 0) {
                setChartData([{ name: 'Sin datos', hours: 0 }]);
            } else {
                setChartData(chartData);
            }
        };
        loadData();
    }, []);

    const [chartData, setChartData] = useState<{ name: string, hours: number }[]>([]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Panel General</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart Section - Full Width */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 font-primary">
                        Horas Totales por Departamento
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
