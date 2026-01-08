
import React, { useState, useEffect } from 'react';
import { Header, Card } from '../components/Layout';
import { User, WorkLog } from '../types';
import { db } from '../services/supabaseService';
import { Clock, Play, Pause, Square, History, Zap } from 'lucide-react';

interface EmployeePortalProps {
  user: User;
  onLogout: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ user, onLogout }) => {
  const [currentLog, setCurrentLog] = useState<WorkLog | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [recentLogs, setRecentLogs] = useState<WorkLog[]>([]);

  useEffect(() => {
    const log = db.getCurrentLog(user.id);
    setCurrentLog(log);
    setRecentLogs(db.getLogs(user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));

    if (log && log.status === 'WORKING') {
      const startTime = new Date(`${log.date}T${log.start_time}`).getTime();
      const interval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user.id]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startShift = () => {
    const now = new Date();
    const newLog: WorkLog = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      date: now.toISOString().split('T')[0],
      start_time: now.toLocaleTimeString('es-ES', { hour12: false }),
      total_hours: 0,
      status: 'WORKING',
      breaks: []
    };
    db.saveLog(newLog);
    setCurrentLog(newLog);
  };

  const endShift = () => {
    if (!currentLog) return;
    const now = new Date();
    const end_time = now.toLocaleTimeString('es-ES', { hour12: false });
    const startTime = new Date(`${currentLog.date}T${currentLog.start_time}`).getTime();
    const totalHours = (now.getTime() - startTime) / 3600000;
    
    const updatedLog: WorkLog = {
      ...currentLog,
      end_time,
      total_hours: totalHours,
      status: 'FINISHED'
    };
    db.saveLog(updatedLog);
    setCurrentLog(null);
    setSeconds(0);
    setRecentLogs(db.getLogs(user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header user={user} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full space-y-10 animate-in fade-in duration-700">
        
        {/* User Welcome Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tight">Hola, {user.full_name.split(' ')[0]}</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mt-1">
                <Clock size={12} className="text-indigo-500" /> Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
           </div>
           <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Terminal Activo</span>
           </div>
        </div>

        {/* Action Center */}
        <Card className="p-12 md:p-20 text-center space-y-12 relative overflow-hidden bg-white shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          <div className="space-y-4">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Cronómetro de Jornada</h2>
            <div className={`text-7xl md:text-9xl font-black tabular-nums tracking-tighter transition-colors duration-500 ${currentLog ? 'text-indigo-600' : 'text-slate-200'}`}>
              {currentLog ? formatTime(seconds) : "00:00:00"}
            </div>
            {currentLog && (
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Registro en tiempo real habilitado</p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {!currentLog ? (
              <button 
                onClick={startShift}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl flex items-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Play fill="white" size={20} />
                </div>
                INICIAR JORNADA
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-8 py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 transition-all border border-slate-200 active:scale-95 uppercase tracking-widest">
                  <Pause size={20} className="text-amber-500" /> Pausar
                </button>
                <button 
                  onClick={endShift}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-rose-500/30 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <Square fill="white" size={18} /> Finalizar
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* History */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 italic">
                <History size={16} className="text-indigo-400" /> Últimos Fichajes
              </h3>
              <div className="flex items-center gap-2">
                 <Zap size={14} className="text-amber-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase">Sincronizado con RRHH</span>
              </div>
           </div>

           <Card className="divide-y divide-slate-50 shadow-lg">
             {recentLogs.map(log => (
               <div key={log.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="space-y-2">
                    <p className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                      {new Date(log.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${log.status === 'FINISHED' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {log.status === 'FINISHED' ? 'Cerrado' : 'Abierto'}
                       </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-slate-800 text-2xl tracking-tighter">{log.total_hours.toFixed(2)}h</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tabular-nums tracking-widest">
                      {log.start_time} <span className="text-slate-200 mx-1">/</span> {log.end_time || 'Activo'}
                    </p>
                  </div>
               </div>
             ))}
             {recentLogs.length === 0 && (
               <div className="p-20 text-center">
                 <div className="flex flex-col items-center gap-4 opacity-20">
                   <Clock size={40} />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sin registros previos</p>
                 </div>
               </div>
             )}
           </Card>
        </div>
      </main>

      <footer className="p-8 text-center border-t border-slate-100">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">QR LABORAL v2.8 • SISTEMA SEGURO Y CIFRADO</p>
      </footer>
    </div>
  );
};

export default EmployeePortal;
