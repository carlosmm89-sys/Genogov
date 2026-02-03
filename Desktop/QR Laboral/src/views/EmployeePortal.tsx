import React, { useState, useEffect } from 'react';
import { Header, Card } from '../components/Layout';
import { User, WorkLog, Company } from '../types';
import { db } from '../services/supabaseService';
import { Clock, Play, Pause, Square, History, Zap, MapPin } from 'lucide-react';
import { calculateDistance } from '../utils/geoloc';

interface EmployeePortalProps {
    user: User;
    onLogout: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ user, onLogout }) => {
    const [currentLog, setCurrentLog] = useState<WorkLog | null>(null);
    const [seconds, setSeconds] = useState(0);
    const [recentLogs, setRecentLogs] = useState<WorkLog[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [verifyingLocation, setVerifyingLocation] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const comp = await db.getCompany(user.company_id);
                setCompany(comp);

                const log = await db.getCurrentLog(user.id);
                setCurrentLog(log);

                const logs = await db.getLogs(user.id);
                setRecentLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
            } catch (err) {
                console.error('Error loading employee data:', err);
            }
        };
        fetchData();
    }, [user.id, user.company_id]);

    const calculateSeconds = (log: WorkLog) => {
        if (!log) return 0;
        const start = new Date(`${log.date}T${log.start_time}`).getTime();
        let total = (Date.now() - start);

        log.breaks?.forEach(b => {
            if (b.end) {
                total -= (new Date(b.end).getTime() - new Date(b.start).getTime());
            }
        });

        const currentBreak = log.breaks?.find(b => !b.end);
        if (currentBreak) {
            total -= (Date.now() - new Date(currentBreak.start).getTime());
        }

        return Math.floor(total / 1000);
    };

    useEffect(() => {
        if (!currentLog) {
            setSeconds(0);
            return;
        }

        setSeconds(calculateSeconds(currentLog));

        if (currentLog.status === 'WORKING') {
            const interval = setInterval(() => {
                setSeconds(calculateSeconds(currentLog));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [currentLog]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const refreshLogs = async () => {
        const logs = await db.getLogs(user.id);
        setRecentLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
        const log = await db.getCurrentLog(user.id);
        setCurrentLog(log);
    };

    const handleStart = async () => {
        const now = new Date();
        const newLog: Partial<WorkLog> = {
            user_id: user.id,
            company_id: user.company_id,
            date: now.toISOString().split('T')[0],
            start_time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'WORKING',
            total_hours: 0,
            breaks: [],
            user_agent: navigator.userAgent
        };

        await db.saveLog(newLog);
        await refreshLogs();
    };

    const handlePause = async () => {
        if (!currentLog) return;

        const isPausing = currentLog.status === 'WORKING';
        const newStatus = isPausing ? 'PAUSED' : 'WORKING';
        const now = new Date().toISOString();

        let updatedBreaks = [...(currentLog.breaks || [])];

        if (isPausing) {
            updatedBreaks.push({ start: now });
        } else {
            const openBreakIndex = updatedBreaks.findIndex(b => !b.end);
            if (openBreakIndex >= 0) {
                updatedBreaks[openBreakIndex] = { ...updatedBreaks[openBreakIndex], end: now };
            }
        }

        await db.saveLog({
            ...currentLog,
            status: newStatus,
            breaks: updatedBreaks
        });
        await refreshLogs();
    };

    const handleStop = async () => {
        if (!currentLog) return;
        const now = new Date();
        const endTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        let updatedBreaks = [...(currentLog.breaks || [])];
        const openBreakIndex = updatedBreaks.findIndex(b => !b.end);
        if (openBreakIndex >= 0) {
            updatedBreaks[openBreakIndex] = { ...updatedBreaks[openBreakIndex], end: now.toISOString() };
        }

        const start = new Date(`${currentLog.date}T${currentLog.start_time}`);
        let totalMs = now.getTime() - start.getTime();

        updatedBreaks.forEach(b => {
            if (b.end && b.start) {
                totalMs -= (new Date(b.end).getTime() - new Date(b.start).getTime());
            }
        });

        const totalHours = totalMs / (1000 * 60 * 60);

        const updatedLog = {
            ...currentLog,
            end_time: endTime,
            status: 'FINISHED' as const,
            total_hours: totalHours,
            breaks: updatedBreaks
        };

        await db.saveLog(updatedLog);

        setCurrentLog(null);
        setSeconds(0);
        await refreshLogs();
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <Header user={user} onLogout={onLogout} companyLogo={company?.logo_url} />

            <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Hola, {user.full_name.split(' ')[0]}</h2>
                        <p className="text-slate-400 font-medium text-xs flex items-center gap-2 mt-0.5">
                            <Clock size={12} className="text-indigo-500" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${currentLog ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {currentLog ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                <Card className="p-8 text-center space-y-8 relative overflow-hidden bg-white shadow-xl border border-slate-100 rounded-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                    <div className="space-y-2">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cronómetro</h2>
                        <div className={`text-6xl md:text-7xl font-mono font-bold tracking-tighter transition-colors duration-500 ${currentLog ? 'text-indigo-600' : 'text-slate-200'}`}>
                            {currentLog ? formatTime(seconds) : "00:00:00"}
                        </div>
                        {currentLog && (
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${currentLog.status === 'PAUSED' ? 'text-amber-500' : 'text-indigo-400'}`}>
                                {currentLog.status === 'PAUSED' ? '🚫 Pausado' : '⚡ En curso'}
                            </p>
                        )}

                        {verifyingLocation && (
                            <p className="text-[10px] font-bold text-indigo-500 animate-pulse flex items-center justify-center gap-2">
                                <MapPin size={12} /> Verificando ubicación GPS...
                            </p>
                        )}

                        {locationError && (
                            <div className="bg-rose-50 text-rose-600 border border-rose-100 p-2 rounded-lg text-[10px] font-bold uppercase tracking-wide animate-in shake">
                                📍 {locationError}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        {!currentLog ? (
                            <button
                                onClick={handleStart}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 hover:-translate-y-0.5"
                            >
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Play fill="white" size={10} />
                                </div>
                                INICIAR JORNADA
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
                                <button
                                    onClick={handlePause}
                                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
                                >
                                    <Pause size={14} className={currentLog.status === 'PAUSED' ? 'text-indigo-500' : 'text-amber-500'} />
                                    {currentLog.status === 'PAUSED' ? 'Reanudar' : 'Pausar'}
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all active:scale-95 uppercase tracking-wide"
                                >
                                    <Square fill="white" size={12} /> Finalizar
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={14} /> Últimos Registros
                        </h3>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
                        {recentLogs.map(log => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-700 text-sm">
                                        {new Date(log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${log.status === 'FINISHED' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {log.status === 'FINISHED' ? 'Cerrado' : 'Abierto'}
                                        </span>
                                        {log.ip_address && (
                                            <span className="text-[9px] font-mono text-slate-400" title={`IP: ${log.ip_address} \nDispositivo: ${log.user_agent}`}>
                                                🖥️ {log.ip_address}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-slate-800 text-lg">{log.total_hours.toFixed(2)}h</p>
                                    <p className="text-[9px] text-slate-400 font-medium tabular-nums">
                                        {log.start_time} - {log.end_time || '...'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentLogs.length === 0 && (
                            <div className="p-8 text-center text-slate-300 text-xs italic">
                                Sin registros recientes
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="p-8 text-center border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">QR LABORAL v2.8 • SISTEMA SEGURO Y CIFRADO</p>
            </footer>
        </div>
    );
};

export default EmployeePortal;
