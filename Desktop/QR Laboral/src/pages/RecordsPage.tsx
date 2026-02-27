import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { WorkLog, User } from '../types';
import { format, isValid, parseISO } from 'date-fns';

import { Download, Printer, Filter } from 'lucide-react';
import { PrintModal } from '../components/PrintModal';

// Helper function to safely format time
const formatTime = (timeValue: string | null | undefined): string => {
    if (!timeValue) return '-';

    try {
        // Try parsing as ISO date
        const date = parseISO(timeValue);
        if (isValid(date)) {
            return format(date, 'HH:mm');
        }

        // If it's already in HH:mm format, return as is
        if (/^\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue;
        }

        // Try creating a new Date object
        const dateObj = new Date(timeValue);
        if (isValid(dateObj)) {
            return format(dateObj, 'HH:mm');
        }
    } catch (error) {
        console.error('Error formatting time:', timeValue, error);
    }

    return '-';
};

export const RecordsPage: React.FC = () => {
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<WorkLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Filters
    const [deptFilter, setDeptFilter] = useState('all');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Print Logic
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [printUser, setPrintUser] = useState<User | undefined>(undefined);
    const [printLogs, setPrintLogs] = useState<WorkLog[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const l = await StorageService.getLogs();
            const u = await StorageService.getUsers();
            setLogs(l);
            setUsers(u);
            setFilteredLogs(l);
        };
        loadData();
    }, []);

    useEffect(() => {
        let res = logs;

        // Filter by Dept (needs joining with users)
        if (deptFilter !== 'all') {
            res = res.filter(log => {
                const user = users.find(u => u.id === log.user_id);
                return user?.department === deptFilter;
            });
        }

        // Filter by Date
        if (dateStart) {
            res = res.filter(log => log.date >= dateStart);
        }
        if (dateEnd) {
            res = res.filter(log => log.date <= dateEnd);
        }

        setFilteredLogs(res);
    }, [logs, users, deptFilter, dateStart, dateEnd]);

    const getUser = (id: string) => users.find(u => u.id === id);
    const departments = Array.from(new Set(users.map(u => u.department)));

    const handleExportCSV = () => {
        const headers = ['ID,User,Date,Start,End,TotalHours,Status'];
        const rows = filteredLogs.map(l => {
            const u = getUser(l.user_id);
            return `${l.id},${u?.full_name},${l.date},${l.start_time},${l.end_time || ''},${l.total_hours},${l.status}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "qrlaboral_logs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenPrint = (user_id: string) => {
        // Determine which logs to print based on context
        // Usually prints monthly report for a specific user
        const userSpecificLogs = filteredLogs.filter(l => l.user_id === user_id);
        setPrintUser(getUser(user_id));
        setPrintLogs(userSpecificLogs);
        setIsPrintOpen(true);
    };

    // Group logs by user for easier list view logic if needed, but requirements said "Table Detailed"
    // We'll stick to a flat log table but add actions per row or group actions.
    // The Prompt mockup shows "Resultados" list with "Imprimir" action on the right.
    // It seems to list Users who have logs, or logs themselves.
    // Let's list Logs, but grouped by User/Date might be cleaner. 
    // Wait, the prompt image 2 shows a list of *Logs* (Ana Desarrolladora - 2023-10-26).
    // Image 3 shows "Empleados" cards with "Firmar Horas (PDF)".

    // I'll implement the Table View here matching Image 2.

    return (
        <div className="space-y-6">

            {/* Search / Filter Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-500" />
                        Filtros de Búsqueda
                    </h2>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Fecha Inicio</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dateStart}
                            onChange={e => setDateStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Fecha Fin</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dateEnd}
                            onChange={e => setDateEnd(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Departamento</label>
                        <div className="relative">
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                value={deptFilter}
                                onChange={e => setDeptFilter(e.target.value)}
                            >
                                <option value="all">Todos los Dptos</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entrada</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Salida</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Horas</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.map(log => {
                                const user = getUser(log.user_id);
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {user?.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                                                    <p className="text-xs text-gray-500">{user?.department}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {log.date}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatTime(log.start_time)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatTime(log.end_time)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {log.total_hours?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
                                                log.status === 'WORKING' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {log.status === 'FINISHED' ? 'Completado' : log.status === 'WORKING' ? 'En Curso' : 'Pausado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenPrint(log.user_id)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-md transition-all"
                                            >
                                                <Printer className="w-3 h-3" /> Imprimir
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <PrintModal
                isOpen={isPrintOpen}
                onClose={() => setIsPrintOpen(false)}
                logs={printLogs}
                user={printUser}
            />
        </div>
    );
};
