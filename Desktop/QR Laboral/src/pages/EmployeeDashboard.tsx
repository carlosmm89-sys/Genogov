import React, { useEffect, useState } from 'react';
import { Timer } from '../components/Timer';
import { useAuth } from '../stores/AuthContext';
import { StorageService } from '../services/storage';
import type { WorkLog } from '../types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const EmployeeDashboard: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<WorkLog[]>([]);

    useEffect(() => {
        const loadLogs = async () => {
            if (user) {
                const logs = await StorageService.getLogs();
                const userLogs = logs
                    .filter(l => l.userId === user.id && l.status === 'completed')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
                    .slice(0, 5); // Last 5
                setHistory(userLogs);
            }
        };
        loadLogs();
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.name.split(' ')[0]} 👋</h1>
                    <p className="text-gray-500">Registra tu actividad de hoy.</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                </div>
            </div>

            <Timer />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Historial Reciente
                    </h3>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                        Ver todo <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            No hay registros recientes.
                        </div>
                    ) : (
                        history.map(log => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {format(new Date(log.date), "EEEE, d MMM", { locale: es })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Entrada: {format(new Date(log.startTime), "HH:mm")}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-indigo-900">{log.totalHours.toFixed(2)} hrs</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Completado
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
