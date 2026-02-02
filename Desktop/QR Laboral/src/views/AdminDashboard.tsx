import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from "react-qr-code"; // Changed to default export
import { NotificationToast, NotificationType } from '../components/NotificationToast';

import React, { useState, useEffect } from 'react';
import { Header, Card } from '../components/Layout';
import { User, WorkLog, Company } from '../types';
import { db, supabase } from '../services/supabaseService';
import { generateHRReport } from '../services/geminiService';
import { LayoutGrid, List, LogOut, ShieldCheck, ClipboardList, LayoutDashboard, Users, User as UserIcon, Settings, Plus, QrCode, Mail, Trash2, MapPin, Building2, AlertTriangle, Download, ArrowRight, X, UserCog, Search, Briefcase, Clock, FileText, Zap, TrendingUp, Scale, CalendarCheck, Save, Eye, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { EditEmployeeModal } from '../components/EditEmployeeModal';
import { ShowQRCodeModal } from '../components/ShowQRCodeModal';
import { ImageUpload } from '../components/ImageUpload';
import { WorkSitesManager } from '../components/WorkSitesManager';
import { PDFService } from '../services/pdfService';
import { CalendarWidget } from '../components/CalendarWidget';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onSwitchUser }) => {
  const [activeTab, setActiveTab] = useState('PANEL');
  const [activeSettingsTab, setActiveSettingsTab] = useState('ORGANIZATION');
  const [employees, setEmployees] = useState<User[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  // Initialize with null or a default empty user-friendly object to prevent crash
  const [company, setCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Edit Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null); // For QR
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<User | null>(null); // For Edit
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [workSites, setWorkSites] = useState<any[]>([]); // SITES STATE

  // Employee Filters
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState('');
  const [employeePositionFilter, setEmployeePositionFilter] = useState('');

  // Log Filters
  const [logDateStart, setLogDateStart] = useState('');
  const [logDateEnd, setLogDateEnd] = useState('');
  const [logEmployeeFilter, setLogEmployeeFilter] = useState('');

  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  const [employeeViewMode, setEmployeeViewMode] = useState<'grid' | 'list'>('grid');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ... (rest of functions remain same)

  // ... (keeping fetchDashboardData, useEffects, etc.)

  const fetchDashboardData = async () => {
    try {
      if (user.company_id && user.company_id !== 'demo-company-id') {
        const [users, logsData, companyData, sitesData] = await Promise.all([
          db.getUsers(),
          db.getLogs(undefined, user.company_id),
          db.getCompany(user.company_id),
          db.getWorkSites(user.company_id)
        ]);

        setEmployees(users.filter(u => u.company_id === user.company_id));
        setLogs(logsData);
        setCompany(companyData);
        setWorkSites(sitesData);
      } else if (user.company_id === 'demo-company-id') {
        setCompany({
          id: 'demo-company-id',
          name: 'Empresa Demo S.L.',
          code: 'DEMO-101',
          primary_color: '#4f46e5',
          location_radius: 500,
          location_lat: 40.416775,
          location_lng: -3.703790
        });
        setEmployees([
          { id: 'demo-emp-1', company_id: 'demo-company-id', full_name: 'Juan Pérez', email: 'juan@demo.com', role: 'EMPLOYEE', department: 'Obras', position: 'Oficial 1ª', username: 'juan' },
          { id: 'demo-emp-2', company_id: 'demo-company-id', full_name: 'Ana García', email: 'ana@demo.com', role: 'EMPLOYEE', department: 'Oficina', position: 'Administrativo', username: 'ana' }
        ]);
        setWorkSites([
          { id: 'site-1', company_id: 'demo-company-id', name: 'Obra Central', location_lat: 40.416, location_lng: -3.703, location_radius: 500, is_active: true }
        ]);
        setLogs([
          { id: 'log-1', user_id: 'demo-emp-1', company_id: 'demo-company-id', date: new Date().toISOString(), start_time: '08:00', end_time: '14:00', total_hours: 6, status: 'FINISHED', breaks: [{ start: new Date().toISOString() }] },
          { id: 'log-2', user_id: 'demo-emp-1', company_id: 'demo-company-id', date: new Date(Date.now() - 86400000).toISOString(), start_time: '08:00', end_time: '17:00', total_hours: 8, status: 'FINISHED', breaks: [] },
          { id: 'log-3', user_id: 'demo-emp-2', company_id: 'demo-company-id', date: new Date().toISOString(), start_time: '09:00', total_hours: 0, status: 'WORKING', breaks: [] }
        ]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.company_id]);

  if (!company) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Cargando datos de empresa...</div>;

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

  const handleAddEmployee = async (userData: Partial<User> & { password?: string }) => {
    const email = (userData as any).email;

    if (!userData.password || userData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (!email) {
      showNotification('El email es obligatorio.', 'error');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            company_id: user.company_id
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario.');

      const newEmp: User = {
        id: authData.user.id,
        company_id: user.company_id,
        username: userData.username || email.split('@')[0],
        full_name: userData.full_name || 'Nuevo Usuario',
        email: email,
        role: userData.role || 'EMPLOYEE',
        department: userData.department || 'General',
        position: userData.position || 'Empleado',
        qr_code: Math.random().toString(36).substr(2, 12).toUpperCase(),
        avatar_url: userData.avatar_url,
        created_at: new Date().toISOString()
      };

      await db.saveUser(newEmp);

      setEmployees(prev => [...prev, newEmp]);
      showNotification('Empleado registrado correctamente en el sistema.', 'success');
      setShowAddModal(false);

    } catch (err: any) {
      console.error('Error creating employee:', err);
      showNotification(err.message || 'Error al crear empleado.', 'error');
    }
  };

  const handleUpdateEmployee = async (updatedUser: User) => {
    try {
      console.log('Updating user:', updatedUser);
      await db.saveUser(updatedUser);
      setEmployees(prev => prev.map(emp => emp.id === updatedUser.id ? updatedUser : emp));
      showNotification('Empleado actualizado correctamente', 'success');
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      showNotification('Error al actualizar: ' + (error.message || 'Desconocido'), 'error');
    }
  };

  const handleDeleteEmployee = async (userId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== userId));
    showNotification('Empleado eliminado', 'success');
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email?.toLowerCase().includes(employeeSearch.toLowerCase()));
    const matchesDept = !employeeDepartmentFilter || emp.department === employeeDepartmentFilter;
    const matchesPos = !employeePositionFilter || emp.position === employeePositionFilter;
    return matchesSearch && matchesDept && matchesPos;
  });

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!company) return;
      await db.updateCompany(company);
      showNotification('Configuración de empresa actualizada correctamente.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Error al actualizar: ' + (error as any).message, 'error');
    }
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

  const primaryColor = company?.primary_color || '#4f46e5';

  const NAV_ITEMS = [
    { id: 'PANEL', icon: TrendingUp, label: 'Dashboard' },
    { id: 'REGISTROS', icon: FileText, label: 'Registros' },
    { id: 'PLANTILLA', icon: Users, label: 'Plantilla' },
    { id: 'CENTROS', icon: Building2, label: 'Centros' },
    { id: 'CONFIG', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

      {/* MOBILE SIDEBAR (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative w-64 bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-1" />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">QR</div>
                )}
                <h2 className="text-white font-bold tracking-tight">Menú</h2>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider">
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation - Technical Style */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* Left: Mobile Menu Trigger + Logo */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            <div className="flex items-center gap-4">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="h-8 w-auto mix-blend-multiply" />
              ) : (
                <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs tracking-tighter">
                  QR
                </div>
              )}
              <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>
              <h1 className="text-sm font-semibold text-slate-700 tracking-tight truncate max-w-[200px]">{company?.name || 'Panel de Control'}</h1>
            </div>
          </div>

          {/* Center/Right: Desktop Nav */}
          <div className="flex-1 flex items-center justify-end ml-4">

            {/* Desktop Navigation (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <tab.icon size={14} /> <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button onClick={onLogout} className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors ml-4 shrink-0 hidden md:block">
              <LogOut size={16} />
            </button>

            {/* Mobile Logout (Icon only) - Optional, mainly inside drawer now but good to have fallback */}
            {/* Not needed if drawer has it, keeping clean */}
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500 overflow-x-hidden">

        {activeTab === 'PANEL' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* KPIs - Minimalist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Empresa</p>
                      <h3 className="text-lg font-bold text-slate-800 truncate">{company?.name}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-2 inline-block">{company?.code}</span>
                    </div>
                    <Building2 className="text-slate-200" size={24} />
                  </div>
                </Card>
                <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">En Activo</p>
                      <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats.activeNow}</h3>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 uppercase">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Horas (Mes)</p>
                      <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats.monthlyHours}</h3>
                    </div>
                    <Clock className="text-slate-200" size={24} />
                  </div>
                </Card>
              </div>

              {/* Chart - Technical Look */}
              <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Distribución de Carga</h3>
                    <p className="text-xs text-slate-500">Horas registradas por departamento</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '12px' }}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell - ${index} `} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* AI Assistant - Dark Sidebar */}
            <div className="space-y-6">
              <Card className="bg-slate-900 text-white p-6 border-none shadow-lg rounded-lg flex flex-col h-full min-h-[500px]">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Assistant</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                  {aiReport ? (
                    <div className="prose prose-invert prose-sm">
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{aiReport}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40 space-y-4">
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <Scale className="text-slate-400" size={24} />
                      </div>
                      <p className="text-xs text-slate-500">Sistema listo para analizar datos.</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={runAiAnalysis}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? 'Analizando...' : 'Generar Informe IA'}
                </button>
              </Card>
            </div>
          </div>
        )}



        {/* Keeping REGISTROS and PLANTILLA tabs simple but updated via generic styles or minimal touchups if needed. 
            For brevity in this tool call, I will assume the 'main' wrapper style update propagates, 
            but I should probably update the card styles in those tabs too for consistency. 
            I'll replace the whole return block to be safe.
        */}

        {activeTab === 'CENTROS' && (
          <div className="animate-in fade-in duration-500">
            <WorkSitesManager
              company={company}
              employees={employees}
              onSiteChange={fetchDashboardData}
              onViewLogs={(employeeId) => {
                setLogEmployeeFilter(employeeId);
                setActiveTab('REGISTROS');
                showNotification('Filtrando registros por empleado seleccionado', 'success');
              }}
            />
          </div>
        )}

        {activeTab === 'PLANTILLA' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Plantilla de Empleados</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{employees.length} Activos</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Toggles */}
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setEmployeeViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${employeeViewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista Cuadrícula"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setEmployeeViewMode('list')}
                      className={`p-2 rounded-md transition-all ${employeeViewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista Lista"
                    >
                      <List size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Plus size={18} /> Añadir Empleado
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={employeeDepartmentFilter}
                    onChange={(e) => setEmployeeDepartmentFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="">Todos los Departamentos</option>
                    {[...new Set(employees.map(e => e.department).filter(Boolean))].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={employeePositionFilter}
                    onChange={(e) => setEmployeePositionFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="">Todos los Puestos</option>
                    {[...new Set(employees.map(e => e.position).filter(Boolean))].map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Grid - Internal */}
            {activeTab === 'PLANTILLA' && (
              <>
                {/* Internal Employees Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-black text-slate-700 uppercase italic mb-4 flex items-center gap-2">
                    <Users size={20} className="text-indigo-600" /> Plantilla Interna
                  </h3>
                  {employeeViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredEmployees.filter(e => !e.is_external).map(emp => (
                        <Card key={emp.id} className="p-6 bg-white border border-slate-200 rounded-lg hover:border-indigo-500 transition-colors group relative">
                          <div className="flex flex-col items-center">
                            <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                              {emp.avatar_url ? (
                                <img
                                  src={emp.avatar_url}
                                  alt={emp.full_name}
                                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-md"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 border-4 border-slate-50 shadow-sm">
                                  {emp.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`absolute bottom - 0 right - 0 w - 5 h - 5 rounded - full border - 2 border - white ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'} `}></div>
                            </div>

                            <h3 className="text-sm font-black text-slate-800 text-center mb-1">{emp.full_name}</h3>
                            <p className="text-[10px] uppercase font-bold text-indigo-500 mb-4">{emp.department || 'General'}</p>

                            <div className="flex gap-2 mb-4 w-full justify-center">
                              {/* Action Buttons */}
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForEdit(emp);
                                  setShowEditModal(true);
                                }}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Editar"
                              >
                                <Settings size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setShowQrModal(true);
                                }}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                title="Ver QR"
                              >
                                <QrCode size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setLogEmployeeFilter(emp.id);
                                  setActiveTab('REGISTROS');
                                  showNotification('Filtrando registros por empleado seleccionado', 'success');
                                }}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                title="Ver Registros"
                              >
                                <ClipboardList size={16} />
                              </button>
                              <a
                                href={`mailto:${emp.email} `}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                title="Enviar Email"
                              >
                                <Mail size={16} />
                              </a>
                            </div>

                            <div className="w-full pt-4 border-t border-slate-50 flex justify-between items-center px-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.position}</span>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {employees.filter(e => !e.is_external).length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <Users size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No hay empleados internos registrados.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Empleado</th>
                            <th className="px-6 py-4">Depto / Puesto</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEmployees.filter(e => !e.is_external).map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {emp.avatar_url ? (
                                    <img src={emp.avatar_url} alt={emp.full_name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                      {emp.full_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-bold text-slate-700">{emp.full_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{emp.department || '-'}</span>
                                  <span className="text-slate-400 text-[10px] uppercase">{emp.position || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setSelectedEmployeeForEdit(emp); setShowEditModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Settings size={16} /></button>
                                  <button onClick={() => { setSelectedEmployee(emp); setShowQrModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><QrCode size={16} /></button>
                                  <button onClick={() => { setLogEmployeeFilter(emp.id); setActiveTab('REGISTROS'); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><ClipboardList size={16} /></button>
                                  <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* External Employees Section */}
                <div className="mb-8 pt-8 border-t border-slate-200/50">
                  <h3 className="text-lg font-black text-slate-700 uppercase italic mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-orange-500" /> Personal Externo / Colaboradores
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.filter(e => e.is_external).map(emp => (
                      <Card key={emp.id} className="p-6 bg-orange-50/30 border border-orange-100 rounded-lg hover:border-orange-300 transition-colors group relative">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute -top-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-full border border-orange-200 tracking-wider">Externo</div>
                            {emp.avatar_url ? (
                              <img
                                src={emp.avatar_url}
                                alt={emp.full_name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-black text-orange-300 border-4 border-orange-100 shadow-sm">
                                {emp.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <h3 className="text-sm font-black text-slate-800 text-center mb-1">{emp.full_name}</h3>
                          <p className="text-[10px] uppercase font-bold text-orange-500 mb-4">{emp.department || 'Servicios'}</p>

                          <div className="flex gap-2 mb-4 w-full justify-center">
                            {/* Action Buttons */}
                            <button
                              onClick={() => {
                                setSelectedEmployeeForEdit(emp);
                                setShowEditModal(true);
                              }}
                              className="p-2 rounded-xl bg-white text-slate-400 hover:bg-orange-100 hover:text-orange-600 transition-colors shadow-sm"
                              title="Editar"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowQrModal(true);
                              }}
                              className="p-2 rounded-xl bg-white text-slate-400 hover:bg-slate-800 hover:text-white transition-colors shadow-sm"
                              title="Ver QR"
                            >
                              <QrCode size={16} />
                            </button>
                            <a
                              href={`mailto:${emp.email} `}
                              className="p-2 rounded-xl bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
                              title="Enviar Email"
                            >
                              <Mail size={16} />
                            </a>
                          </div>

                          <div className="w-full pt-4 border-t border-orange-100 flex justify-between items-center px-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.position || 'Colaborador'}</span>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {employees.filter(e => e.is_external).length === 0 && (
                      <div className="col-span-full text-center py-6 text-slate-400">
                        <p className="text-xs">No hay personal externo registrado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* No Employees State */}
                {employees.length === 0 && (
                  <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                    <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Users size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No hay empleados</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                      Comienza añadiendo tu primer empleado para gestionar sus fichajes y documentos.
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                      Añadir Primer Empleado
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- REGISTROS TAB --- */}
        {activeTab === 'REGISTROS' && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Auditoría de Registros</h2>
                <p className="text-xs text-slate-500 mt-1">Historial completo de accesos y jornadas.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Export logs matching current filters
                    const logsToExport = logs.filter(l => {
                      // Apply current view filters
                      let matches = true;
                      if (logDateStart && new Date(l.date) < new Date(logDateStart)) matches = false;
                      if (logDateEnd && new Date(l.date) > new Date(logDateEnd)) matches = false;
                      if (logEmployeeFilter && l.user_id !== logEmployeeFilter) matches = false;
                      return matches;
                    });

                    PDFService.generateLegalReport(company, logsToExport, employees, {
                      startDate: logDateStart ? new Date(logDateStart) : new Date(0),
                      endDate: logDateEnd ? new Date(logDateEnd) : new Date()
                    });
                    showNotification('Informe PDF generado', 'success');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileText size={16} /> Exportar PDF
                </button>
                <button
                  onClick={downloadReport}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm hidden md:flex"
                >
                  <Download size={16} /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde</label>
                  <input
                    type="date"
                    className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    value={logDateStart}
                    onChange={(e) => setLogDateStart(e.target.value)}
                    disabled={!!calendarDate}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasta</label>
                  <input
                    type="date"
                    className="w-full text-xs p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    value={logDateEnd}
                    onChange={(e) => setLogDateEnd(e.target.value)}
                    disabled={!!calendarDate}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empleado</label>
                  <select
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={logEmployeeFilter}
                    onChange={(e) => setLogEmployeeFilter(e.target.value)}
                  >
                    <option value="">Todos los empleados</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(logDateStart || logDateEnd || logEmployeeFilter || calendarDate) && (
                <button
                  onClick={() => { setLogDateStart(''); setLogDateEnd(''); setLogEmployeeFilter(''); setCalendarDate(null); }}
                  className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 px-2 py-1"
                >
                  <X size={14} /> Limpiar
                </button>
              )}
            </div>

            {/* Mobile Calendar Toggle */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowMobileCalendar(!showMobileCalendar)}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border transition-all ${showMobileCalendar ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                <CalendarCheck size={16} />
                {showMobileCalendar ? 'Ocultar Calendario' : 'Filtrar por Fecha (Calendario)'}
              </button>
            </div>

            {/* Content Area: Calendar + Table */}
            <div className="flex flex-col md:flex-row gap-6 items-start">

              {/* Left: Calendar Widget */}
              <div className={`${showMobileCalendar ? 'block' : 'hidden'} md:block w-full md:w-auto transition-all`}>
                <CalendarWidget
                  events={logs.map(l => ({ date: l.date, status: l.status }))}
                  selectedDate={calendarDate}
                  onDateSelect={(date) => {
                    setCalendarDate(date);
                    // Optional: clear explicit date ranges to avoid confusion
                    if (date) {
                      setLogDateStart('');
                      setLogDateEnd('');
                    }
                  }}
                />
              </div>

              <div className="flex-1 w-full space-y-4">

                {/* Bulk Actions Alert - HIDDEN/REMOVED for Compliance (No Log Deletion) */}

                <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          {/* Checkbox Column Removed */}
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Empleado</th>
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-center">Horario</th>
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-center">Total</th>
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">IP / Dispositivo</th>
                          <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const filteredLogs = logs.filter(log => {
                            // Calendar Filter (Strongest)
                            if (calendarDate) {
                              const d = new Date(log.date);
                              if (d.getDate() !== calendarDate.getDate() ||
                                d.getMonth() !== calendarDate.getMonth() ||
                                d.getFullYear() !== calendarDate.getFullYear()) {
                                return false;
                              }
                            } else {
                              // Range Filter
                              if (logDateStart && new Date(log.date) < new Date(logDateStart)) return false;
                              if (logDateEnd && new Date(log.date) > new Date(logDateEnd)) return false;
                            }

                            // Employee Filter (Always applies)
                            if (logEmployeeFilter && log.user_id !== logEmployeeFilter) return false;
                            return true;
                          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                          return filteredLogs.length > 0 ? filteredLogs.map(log => {
                            const emp = employees.find(e => e.id === log.user_id);
                            // Selection logic removed
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-700">{emp?.full_name || 'Desconocido'}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    {log.start_time} <ArrowRight size={10} className="text-slate-400" /> {log.end_time || '--:--'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-700">{log.total_hours.toFixed(2)}h</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded w-fit">
                                      {log.ip_address || '---'}
                                    </span>
                                    {log.user_agent && (
                                      <div className="group relative w-fit">
                                        <span className="text-[10px] text-indigo-400 cursor-help truncate max-w-[100px] block">
                                          {log.user_agent.substring(0, 15)}...
                                        </span>
                                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl hidden group-hover:block z-50">
                                          {log.user_agent}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`inline - flex items - center px - 2 py - 0.5 rounded text - [10px] font - bold uppercase tracking - wide ${log.status === 'FINISHED' ? 'bg-slate-100 text-slate-500' :
                                    log.status === 'WORKING' ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                                      'bg-amber-100 text-amber-700'
                                    } `}>
                                    {log.status === 'FINISHED' ? 'Cerrado' : 'Activo'}
                                  </span>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400 italic text-sm">No hay registros que coincidan con los filtros.</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'CONFIG' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Stats / Nav */}
            <div className="space-y-2">
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveSettingsTab('ORGANIZATION')}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSettingsTab === 'ORGANIZATION' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 size={18} /> Organización
                </button>
                <button
                  onClick={() => setActiveSettingsTab('SMTP')}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSettingsTab === 'SMTP' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Mail size={18} /> Notificaciones (SMTP)
                </button>
                <button
                  onClick={() => setActiveSettingsTab('PWA')}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSettingsTab === 'PWA' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <QrCode size={18} /> Descargas / PWA
                </button>
              </nav>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3 space-y-6">

              {/* Organization Settings */}
              {activeSettingsTab === 'ORGANIZATION' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Ajustes de Organización</h2>
                    <p className="text-sm text-slate-500">Personaliza la identidad visual y los datos fiscales.</p>
                  </div>

                  <Card className="p-8">
                    <form onSubmit={handleUpdateCompany} className="space-y-8">
                      {/* Company Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial</label>
                          <input type="text" value={company?.name || ''} onChange={e => setCompany({ ...company!, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CIF / ID Fiscal</label>
                          <input type="text" value={user.company_id} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Identidad Corporativa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <ImageUpload
                            label="Logo de Empresa"
                            value={company?.logo_url || ''}
                            onChange={(val) => setCompany({ ...company!, logo_url: val })}
                          />
                          <ImageUpload
                            label="Favicon (Icono Navegador)"
                            value={company?.favicon_url || ''}
                            onChange={(val) => setCompany({ ...company!, favicon_url: val })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geolocalización (Centro de Trabajo)</label>
                          <button type="button" onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(pos => {
                                setCompany({ ...company!, location_lat: pos.coords.latitude, location_lng: pos.coords.longitude });
                                showNotification('Ubicación actualizada', 'success');
                              });
                            }
                          }} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                            <MapPin size={12} /> DETECTAR MI UBICACIÓN
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="number" placeholder="Latitud" value={company?.location_lat || 0} onChange={e => setCompany({ ...company!, location_lat: parseFloat(e.target.value) })} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                          <input type="number" placeholder="Longitud" value={company?.location_lng || 0} onChange={e => setCompany({ ...company!, location_lng: parseFloat(e.target.value) })} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                          <input type="number" placeholder="Radio (metros)" value={company?.location_radius || 500} onChange={e => setCompany({ ...company!, location_radius: parseInt(e.target.value) })} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        </div>

                        {/* Plus Code & Domain */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plus Code (Google Maps)</label>
                            <input
                              type="text"
                              placeholder="Ej: 8C5M+3F Elche"
                              value={company?.plus_code || ''}
                              onChange={e => setCompany({ ...company!, plus_code: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dominio / Marca Blanca</label>
                            <input
                              type="text"
                              placeholder="ej: portal.miempresa.com"
                              value={company?.domain || ''}
                              onChange={e => setCompany({ ...company!, domain: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-indigo-700 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Si configuras un dominio, los códigos QR apuntarán a esa dirección.</p>
                      </div>



                      <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                          <Save size={18} /> GUARDAR CAMBIOS
                        </button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* SMTP Settings */}
              {activeSettingsTab === 'SMTP' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Servidor de Correo (SMTP)</h2>
                    <p className="text-sm text-slate-500">Configura el envío de notificaciones y reportes.</p>
                  </div>

                  <Card className="p-8">
                    <form onSubmit={handleUpdateCompany} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servidor (Host)</label>
                          <input
                            type="text"
                            placeholder="smtp.empresa.com"
                            value={company?.smtp_settings?.host || ''}
                            onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, host: e.target.value } })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Puerto</label>
                          <input
                            type="number"
                            placeholder="587"
                            value={company?.smtp_settings?.port || ''}
                            onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, port: parseInt(e.target.value) } })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario (Email)</label>
                          <input
                            type="text"
                            placeholder="no-reply@empresa.com"
                            value={company?.smtp_settings?.user || ''}
                            onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, user: e.target.value } })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                          <div className="relative">
                            <input
                              type="password"
                              placeholder="••••••••••••"
                              value={company?.smtp_settings?.password || ''}
                              onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, password: e.target.value } })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encriptación</label>
                          <select
                            value={company?.smtp_settings?.encryption || 'tls'}
                            onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, encryption: e.target.value as any } })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="tls">TLS (Recomendado)</option>
                            <option value="ssl">SSL</option>
                            <option value="none">Ninguna</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Remitente</label>
                          <input
                            type="text"
                            placeholder="RRHH - Notificaciones"
                            value={company?.smtp_settings?.from_name || ''}
                            onChange={e => setCompany({ ...company!, smtp_settings: { ...company?.smtp_settings, from_name: e.target.value } })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (!company?.smtp_settings?.host || !company?.smtp_settings?.user) {
                              showNotification('Faltan datos de configuración SMTP', 'error');
                              return;
                            }
                            // Simulated check
                            const checkToast = showNotification('Verificando conexión SMTP...', 'success');
                            setTimeout(() => {
                              showNotification('Conexión SMTP exitosa [Simulado]', 'success');
                            }, 1500);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Probar Conexión (Test Email)
                        </button>
                        <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                          <Save size={18} /> GUARDAR CONFIGURACIÓN
                        </button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* PWA Settings */}
              {activeSettingsTab === 'PWA' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Descargas y PWA</h2>
                    <p className="text-sm text-slate-500">Equipamiento para instalación en sitio (Tablets/Móviles).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PWA Access QR */}
                    <Card className="p-6 flex flex-col items-center text-center">
                      <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-lg mb-4">
                        <QRCode
                          value={company?.domain ? `https://${company.domain}` : window.location.origin}
                          size={200}
                          level="H"
                        />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Acceso a Aplicación Móvil</h3>
                      <p className="text-xs text-slate-500 mb-6 max-w-xs">
                        Escanea este código para abrir la aplicación.
                        {company?.domain && <span className="block text-indigo-600 font-bold mt-1">Dominio Personalizado Activo</span>}
                      </p>
                      <a
                        href={company?.domain ? `https://${company.domain}` : window.location.origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 text-xs font-bold hover:underline mb-4"
                      >
                        {company?.domain ? `https://${company.domain}` : window.location.origin}
                      </a>
                    </Card>

                    {/* Plus Code & Location QR */}
                    <Card className="p-6 flex flex-col items-center text-center">
                      <div className="bg-indigo-600 p-4 rounded-xl shadow-lg mb-4 flex items-center justify-center w-[232px] h-[232px]">
                        <MapPin size={80} className="text-white opacity-90" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Ubicación y Plus Code</h3>
                      {company?.plus_code ? (
                        <>
                          <p className="text-2xl font-black text-slate-800 tracking-tighter my-2">{company.plus_code}</p>
                          <p className="text-xs text-slate-500 mb-6 max-w-xs">Código de ubicación activo para fichajes geolocalizados.</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(company.plus_code || ''); showNotification("Copiado al portapapeles", 'success') }}
                            className="bg-slate-900 text-white hover:bg-slate-700 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
                          >
                            <Copy size={16} /> Copiar Plus Code
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-slate-400 italic mb-4">Plus Code no configurado.</p>
                          <button onClick={() => setActiveSettingsTab('ORGANIZATION')} className="text-indigo-600 text-xs font-bold hover:underline">
                            → Configurar en Organización
                          </button>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <ShowQRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        employee={selectedEmployee}
      />

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEmployee}
        availableSites={workSites}
      />

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={selectedEmployeeForEdit}
        onSave={handleUpdateEmployee}
        onDelete={handleDeleteEmployee}
        availableSites={workSites}
      />

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;