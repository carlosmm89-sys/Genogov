import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Coffee } from 'lucide-react';
import { clsx } from 'clsx';
import { StorageService } from '../services/storage';
import { useAuth } from '../stores/AuthContext';
import type { WorkLog } from '../types';

export const Timer: React.FC = () => {
    const { user } = useAuth();
    const [activeLog, setActiveLog] = useState<WorkLog | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        // Load active session from local state or storage if we were persistent per user session
        // For demo, we might check if there is an 'active' log for today in storage
        const loadActiveLog = async () => {
            if (!user) return;
            const logs = await StorageService.getLogs();
            const today = new Date().toISOString().split('T')[0];
            const current = logs.find(l => l.userId === user.id && l.date === today && l.status !== 'completed');

            if (current) {
                setActiveLog(current);
                // Calculate initial elapsed based on start time and breaks
                // Simplified for demo: just showing "running"
            }
        };
        loadActiveLog();
    }, [user]);

    useEffect(() => {
        if (activeLog && activeLog.status === 'active') {
            timerRef.current = window.setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeLog]);

    const handleStart = async () => {
        if (!user) return;
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const newLog: WorkLog = {
            id: crypto.randomUUID(),
            userId: user.id,
            date: today,
            startTime: now.toISOString(),
            breaks: [],
            status: 'active',
            totalHours: 0
        };

        await StorageService.saveLog(newLog);
        setActiveLog(newLog);
        setElapsed(0);
    };

    const handlePause = async () => {
        if (!activeLog) return;
        const updated = { ...activeLog, status: 'paused' as const };
        // In real app, we'd record the break start time here
        updated.breaks.push({ start: new Date().toISOString() });

        await StorageService.saveLog(updated);
        setActiveLog(updated);
    };

    const handleResume = async () => {
        if (!activeLog) return;
        const updated = { ...activeLog, status: 'active' as const };
        // Close the last break
        const lastBreak = updated.breaks[updated.breaks.length - 1];
        if (lastBreak && !lastBreak.end) {
            lastBreak.end = new Date().toISOString();
        }

        await StorageService.saveLog(updated);
        setActiveLog(updated);
    };

    const handleStop = async () => {
        if (!activeLog) return;
        const now = new Date();
        const updated = {
            ...activeLog,
            status: 'completed' as const,
            endTime: now.toISOString(),
            // Calculate total hours roughly for demo
            totalHours: (now.getTime() - new Date(activeLog.startTime).getTime()) / (1000 * 60 * 60)
        };

        await StorageService.saveLog(updated);
        setActiveLog(null);
        setElapsed(0);
    };

    if (!activeLog) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
                    <Play className="w-10 h-10 ml-1" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Comenzar Jornada</h2>
                <p className="text-gray-500 mb-8 text-center">Registra tu entrada para comenzar a contabilizar tus horas de trabajo de hoy.</p>
                <button
                    onClick={handleStart}
                    className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                    <Play className="w-5 h-5" /> INICIAR JORNADA
                </button>
            </div>
        );
    }

    const isPaused = activeLog.status === 'paused';

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto relative overflow-hidden">
            {isPaused && (
                <div className="absolute inset-0 bg-yellow-50/50 flex items-center justify-center pointer-events-none">
                    <div className="text-yellow-600 font-bold opacity-10 uppercase tracking-widest text-6xl rotate-[-15deg]">En Pausa</div>
                </div>
            )}

            <div className={clsx(
                "w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner transition-colors",
                isPaused ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"
            )}>
                {isPaused ? <Coffee className="w-14 h-14" /> : <ClockDisplay seconds={elapsed} />}
            </div>

            <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-mono font-bold text-gray-900 tracking-wider mb-2">
                    {isPaused ? "TOMANDO UN RESPIRO" : "JORNADA EN CURSO"}
                </h2>
                <p className={clsx("font-medium", isPaused ? "text-yellow-600" : "text-green-600")}>
                    {isPaused ? "El cronómetro está detenido" : "Registrando actividad..."}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                {!isPaused ? (
                    <button
                        onClick={handlePause}
                        className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition-all border border-yellow-200"
                    >
                        <Pause className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">PAUSAR</span>
                    </button>
                ) : (
                    <button
                        onClick={handleResume}
                        className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-all border border-green-200"
                    >
                        <Play className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">REANUDAR</span>
                    </button>
                )}

                <button
                    onClick={handleStop}
                    className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all border border-red-200"
                >
                    <Square className="w-6 h-6 mb-2" />
                    <span className="font-bold text-sm">TERMINAR</span>
                </button>
            </div>
        </div>
    );
};

const ClockDisplay: React.FC<{ seconds: number }> = ({ seconds }) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return <div className="text-3xl font-bold font-mono">{timeString}</div>;
};
