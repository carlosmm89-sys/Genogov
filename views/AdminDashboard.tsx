
import React, { useState, useEffect } from 'react';
import { Header, Card } from '../components/Layout';
import { User, WorkLog, Company } from '../types';
import { db } from '../services/supabaseService';
import { generateHRReport } from '../services/geminiService';
import { 
  Users, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  Scale,
  CalendarCheck,
  ArrowRight,
  Settings,
  Building2,
  Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('PANEL');
  const [employees, setEmployees] = useState<User[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [company, setCompany] = useState<Company>(db.getCompany());

  useEffect(() => {
    setEmployees(db.getUsers());
    setLogs(db.getLogs());
  }, []);

  const stats = {
    totalEmployees: employees.length,
    activeNow: logs.filter(l => l.status === 'WORKING').length,
    monthlyHours: logs.reduce((acc, l) => acc + (l.total_hours || 0), 0).toFixed(1)
  };

  const chartData = [
    { name: 'Sistemas', hours: 45, color: '#6366f1' },
    { name: 'Ventas', hours: 120, color: '#8b5cf6' },
    { name: 'Operaciones', hours: 88, color: '#06b6d4' },
    { name: 'Dirección', hours: 32, color: '#f43f5e' },
  ];

  const handleAddEmployee = () => {
    const newName = prompt('Nombre completo del empleado:');
    if (!newName) return;
    const newEmp: User = {
      id: Math.random().toString(36).substr(2, 9),
      company_id: user.company_id,
      username: newName.toLowerCase().replace(/\s/g, '_'),
      full_name: newName,
      role: 'EMPLOYEE',
      department: 'General',
      position: 'Staff'
    };
    db.saveUser(newEmp);
    setEmployees(db.getUsers());
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este empleado? Esta acción no se puede deshacer.')) {
      db.deleteUser(id);
      setEmployees(db.getUsers());
    }
  };

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateCompany(company);
    alert('Configuración de empresa actualizada correctamente.');
  };

  const runAiAnalysis = async () => {
    setIsGenerating(true);
    const report = await generateHRReport(logs, employees);
    setAiReport(report);
    setIsGenerating(false);
  };

  const downloadReport = () => {
    db.exportToCSV(logs, employees);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header 
        user={user} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
        
        {activeTab === 'PANEL' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none shadow-indigo-500/20 shadow-xl">
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Empresa Certificada</p>
                  <h3 className="text-3xl font-black italic tracking-tighter truncate">{company.name}</h3>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">{company.code}</span>
                  </div>
                </Card>
                <Card className="p-8 group hover:shadow-2xl transition-all duration-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Presencia Actual</p>
                  <div className="flex items-center gap-4">
                    <h3 className="text-5xl font-black text-slate-800 tabular-nums">{stats.activeNow}</h3>
                    <div className="relative">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative"></div>
                    </div>
                  </div>
                </Card>
                <Card className="p-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horas Acumuladas</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-black text-slate-800 tabular-nums">{stats.monthlyHours}</h3>
                    <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">horas</span>
                  </div>
                </Card>
              </div>

              {/* Chart */}
              <Card className="p-10 flex flex-col h-[480px]">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-10">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Actividad por Departamentos</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Análisis de carga de trabajo mensual distribuida</p>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-tighter border border-emerald-100 shadow-sm">
                    <TrendingUp size={16} /> +12.4% vs Mes Anterior
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase'}} 
                        dy={20}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}} 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '12px'}}
                      />
                      <Bar dataKey="hours" radius={[14, 14, 0, 0]} barSize={50}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* AI Sidepanel */}
            <div className="space-y-6">
              <Card className="bg-[#0f172a] text-white p-8 border-none shadow-2xl shadow-indigo-500/10 flex flex-col h-full min-h-[600px] group">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_15px_rgba(129,140,248,0.8)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] italic">Asistente Gemini AI</span>
                  </div>
                  <button 
                    onClick={runAiAnalysis}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black px-6 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 uppercase active:scale-95 group-hover:-translate-y-1"
                  >
                    <Zap size={14} className={isGenerating ? 'animate-spin' : ''} /> {isGenerating ? 'Calculando...' : 'Pedir Informe'}
                  </button>
                </div>

                <div className="flex-1 bg-white/[0.03] backdrop-blur-sm rounded-[2.5rem] p-8 border border-white/10 overflow-y-auto scrollbar-hide shadow-inner">
                  {aiReport ? (
                    <div className="prose prose-invert prose-sm">
                      <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-medium text-[14px]">
                        {aiReport}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                      <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                        <Scale className="text-indigo-400" size={40} />
                      </div>
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-3">Consultoría Digital</p>
                        <p className="text-[11px] italic text-indigo-400 leading-relaxed px-6 font-medium">
                          Detecta automáticamente horas extraordinarias no justificadas y riesgos de fatiga laboral mediante inteligencia artificial de última generación.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Configuración de Empresa</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Gestión de identidad corporativa y fiscal</p>
            </div>

            <Card className="p-12 shadow-2xl">
              <form onSubmit={handleUpdateCompany} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text"
                        value={company.name}
                        onChange={e => setCompany({...company, name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-14 py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Empresa (CIF)</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text"
                        value={company.code}
                        onChange={e => setCompany({...company, code: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-14 py-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Parámetros de Seguridad</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md accent-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase">Geolocalización Obligatoria</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded-md accent-indigo-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase">Firma Digital en cada Salida</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0f172a] hover:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 group"
                >
                  <Save size={20} className="group-hover:animate-bounce" /> Guardar Cambios
                </button>
              </form>
            </Card>
          </div>
        )}

        {/* ... Rest of tabs (PLANTILLA, REGISTROS, NORMATIVA) remain with their previous high-quality implementation ... */}
        {activeTab === 'NORMATIVA' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="text-center space-y-2">
               <h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Cumplimiento RD-LEY 8/2019</h2>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.25em]">Su empresa cumple con todas las exigencias de la Inspección de Trabajo.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="p-10 space-y-6 border-l-[6px] border-l-emerald-500 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                    <CalendarCheck size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-[0.2em] mb-3">Garantía de Registro</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                      El sistema registra el inicio y fin de la jornada de forma fehaciente, cumpliendo estrictamente con el Art. 34.9 del Estatuto de los Trabajadores.
                    </p>
                  </div>
               </Card>
               <Card className="p-10 space-y-6 border-l-[6px] border-l-indigo-500 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-[0.2em] mb-3">Custodia Legal 4 Años</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                      Todos los registros se almacenan en la nube con cifrado AES-256 para ser presentados ante cualquier requerimiento de la autoridad laboral.
                    </p>
                  </div>
               </Card>
             </div>
          </div>
        )}

        {activeTab === 'PLANTILLA' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-wrap justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Gestión Humana</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{employees.length} TRABAJADORES EN ACTIVO</p>
              </div>
              <button 
                onClick={handleAddEmployee}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs flex items-center gap-3 shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 uppercase tracking-[0.2em]"
              >
                <Plus size={20} /> Añadir Empleado
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {employees.map(emp => (
                <Card key={emp.id} className="p-10 group hover:border-indigo-300 transition-all duration-500 relative overflow-hidden bg-white hover:shadow-2xl hover:-translate-y-2">
                   <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-indigo-600 font-black text-2xl border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500 shadow-sm">
                       {emp.full_name.charAt(0)}
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm" 
                          title="Eliminar empleado"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   </div>

                   <div className="space-y-2 relative z-10">
                     <h4 className="font-black text-slate-800 uppercase tracking-tighter leading-none text-xl group-hover:text-indigo-600 transition-colors duration-500">{emp.full_name}</h4>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{emp.department}</p>
                   </div>

                   <div className="mt-10 flex justify-between items-center relative z-10 pt-8 border-t border-slate-50">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{emp.position}</span>
                     <span className="bg-slate-50 text-[10px] font-black text-slate-500 px-4 py-2 rounded-xl uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-500">ID: {emp.id.slice(0,4)}</span>
                   </div>

                   <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/5 rounded-full group-hover:bg-indigo-500/10 transition-colors duration-500 blur-2xl"></div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'REGISTROS' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <Card className="p-0 border-none shadow-2xl overflow-hidden rounded-[3rem]">
               <div className="p-12 border-b border-slate-50 flex flex-wrap gap-8 justify-between items-center bg-white">
                 <div>
                   <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Auditoría Laboral</h2>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Historial certificado de accesos</p>
                 </div>
                 <div className="flex items-center gap-5">
                    <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 shadow-inner">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em]">Total: {logs.length} registros oficiales</span>
                    </div>
                    <button 
                      onClick={downloadReport}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4.5 rounded-[1.5rem] font-black text-xs flex items-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 uppercase tracking-[0.2em]"
                    >
                      <Download size={20} /> Exportar Informe
                    </button>
                 </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-slate-50/70">
                     <tr>
                       <th className="text-left py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Trabajador</th>
                       <th className="text-left py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fecha</th>
                       <th className="text-center py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Jornada Real</th>
                       <th className="text-center py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cómputo</th>
                       <th className="text-right py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Estado ITSS</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {logs.length > 0 ? logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                       const emp = employees.find(e => e.id === log.user_id);
                       return (
                         <tr key={log.id} className="hover:bg-indigo-50/40 transition-all duration-300 group">
                           <td className="py-8 px-12">
                             <div className="font-black text-slate-700 text-base group-hover:text-indigo-600 transition-colors">{emp?.full_name}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp?.department}</div>
                           </td>
                           <td className="py-8 px-12 text-sm font-black text-slate-500 uppercase">{log.date}</td>
                           <td className="py-8 px-12">
                             <div className="flex items-center justify-center gap-4 text-xs font-black">
                               <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">{log.start_time}</span>
                               <ArrowRight size={14} className="text-slate-300" />
                               <span className={log.end_time ? 'text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm' : 'text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl'}>
                                 {log.end_time || '--:--'}
                               </span>
                             </div>
                           </td>
                           <td className="py-8 px-12 text-center">
                             <span className="text-lg font-black text-slate-800 tracking-tighter tabular-nums">{log.total_hours.toFixed(2)}h</span>
                           </td>
                           <td className="py-8 px-12 text-right">
                             <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-4 py-2 rounded-2xl border shadow-sm ${
                               log.status === 'FINISHED' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                               log.status === 'WORKING' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse' :
                               'bg-amber-50 text-amber-600 border-amber-200'
                             }`}>
                               {log.status === 'FINISHED' ? 'CERRADO' : 'EN CURSO'}
                             </span>
                           </td>
                         </tr>
                       );
                     }) : (
                        <tr>
                          <td colSpan={5} className="py-40 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-20">
                              <div className="p-8 bg-slate-100 rounded-[2.5rem] shadow-inner">
                                <FileText size={64} className="text-slate-400" />
                              </div>
                              <p className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">Sin registros que auditar</p>
                            </div>
                          </td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
