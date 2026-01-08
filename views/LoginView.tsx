
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabaseService';
import { User } from '../types';
import { Keyboard, QrCode, ArrowRight, Camera, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}


const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<'KEYBOARD' | 'QR'>('KEYBOARD');
  // Eliminamos companyCode para simplificar el login SaaS estándar (Email + Pass)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await db.signIn(email, password);

      if (authError) throw authError;
      if (!data.user) throw new Error('No se pudo obtener el usuario');

      // Obtener perfil extendido
      const profile = await db.getProfile(data.user.id);

      if (profile) {
        onLogin(profile);
      } else {
        // Fallback si no tiene perfil creado aún (edge case)
        throw new Error('Usuario sin perfil asociado. Contacte soporte.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const startQRScanner = () => {
    setIsScanning(true);
    // TODO: Implementar escaneo real de QR que contenga un token de sesión o login directo
    // Por ahora mantenemos la simulación visual pero con aviso
    setTimeout(() => {
      setIsScanning(false);
      setError('Login por QR requiere integración con backend (Work in Progress)');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Header Branding */}
        <div className="bg-indigo-600 p-12 text-center text-white space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">QR LABORAL</h1>
          <p className="text-[11px] font-black opacity-70 uppercase tracking-[0.3em]">Registro de Jornada Certificado</p>
        </div>

        {/* Content */}
        <div className="p-10 flex-1 space-y-8">
          {/* Method Toggle */}
          <div className="bg-slate-100 p-1.5 rounded-[1.5rem] flex shadow-inner">
            <button
              onClick={() => { setMethod('KEYBOARD'); setIsScanning(false); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.2rem] text-xs font-black transition-all duration-300 ${method === 'KEYBOARD' ? 'bg-white shadow-xl text-indigo-600 translate-y-[-1px]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Keyboard size={18} /> TECLADO
            </button>
            <button
              onClick={() => setMethod('QR')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.2rem] text-xs font-black transition-all duration-300 ${method === 'QR' ? 'bg-white shadow-xl text-indigo-600 translate-y-[-1px]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <QrCode size={18} /> CÁMARA QR
            </button>
          </div>

          {method === 'KEYBOARD' ? (
            <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-left-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4.5 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4.5 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-700"
                  required
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-500 animate-in slide-in-from-top-2">
                  <ShieldAlert size={18} />
                  <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 group transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'VERIFICANDO...' : 'ENTRAR AL SISTEMA'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <div className="space-y-8 flex flex-col items-center animate-in slide-in-from-right-4 duration-500">
              <div className="w-full aspect-square bg-[#0a0a0a] rounded-[3rem] relative flex items-center justify-center overflow-hidden border-[10px] border-slate-50 shadow-2xl">
                {isScanning ? (
                  <>
                    <div className="scan-line"></div>
                    <div className="absolute inset-0 bg-indigo-500/5 flex flex-col items-center justify-center gap-4 text-white p-12 text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Escaneando Identidad...</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 group cursor-pointer" onClick={startQRScanner}>
                    <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center border-2 border-indigo-500/30 group-hover:scale-110 transition-transform">
                      <Camera size={40} className="text-indigo-400" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600 text-center px-10">Pulsa para activar escáner facial/QR</p>
                  </div>
                )}
                {/* Corner Markers */}
                <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-indigo-500/50 rounded-tl-xl"></div>
                <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-indigo-500/50 rounded-tr-xl"></div>
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-indigo-500/50 rounded-bl-xl"></div>
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-indigo-500/50 rounded-br-xl"></div>
              </div>

              {!isScanning && (
                <button
                  onClick={startQRScanner}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  ABRIR CÁMARA DE ACCESO
                </button>
              )}
            </div>
          )}

          <div className="text-center">
            <a href="#" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">¿No tienes acceso? Contacta a Soporte</a>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-50 flex justify-between items-center px-10 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SISTEMA ONLINE</span>
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">QRL v4.0</span>
        </div>
      </div>
    </div>
  );
};


export default LoginView;
