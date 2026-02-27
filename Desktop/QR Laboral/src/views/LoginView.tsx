import React, { useState, useEffect } from 'react';
import { db, supabase } from '../services/supabaseService';
import { User } from '../types';
import { Mail, Lock, QrCode, ArrowRight, Eye, EyeOff, ShieldCheck, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface LoginViewProps {
    onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [method, setMethod] = useState<'KEYBOARD' | 'QR'>('KEYBOARD');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await db.signIn(email, password);

            if (authError) throw authError;
            if (!data.user) throw new Error('No se pudo obtener el usuario');

            const profile = await db.getProfile(data.user.id);

            if (profile) {
                onLogin(profile);
            } else {
                if (email === 'superadmin@qrlaboral.com') {
                    const fakeProfile: any = {
                        id: data.user.id,
                        email: 'superadmin@qrlaboral.com',
                        role: 'SUPERADMIN',
                        company_id: '00000000-0000-0000-0000-000000000000',
                        full_name: 'Super Admin (Emergency)',
                        username: 'superadmin',
                        department: 'Sistemas',
                        position: 'Root Administrator',
                        created_at: new Date().toISOString()
                    };
                    onLogin(fakeProfile);
                } else {
                    throw new Error('Usuario sin perfil asociado. Contacte soporte.');
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = async (result: any) => {
        let rawValue = result?.[0]?.rawValue || result?.text || result;

        if (!rawValue || loading) return;

        rawValue = rawValue.trim();

        // Validación básica de longitud (ya no exigimos UUID estricto)
        if (rawValue.length < 3) {
            setError('QR Inválido: Código muy corto');
            setIsScanning(false);
            return;
        }

        setLoading(true);
        setIsScanning(false);

        try {
            // 1. Intentar buscar por columna 'qr_code' (Nuevo sistema)
            let profile = await db.getProfileByQR(rawValue);

            // 2. Si falla y parece UUID, intentar buscar por ID (Sistema antiguo / Legado)
            if (!profile) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawValue);
                if (isUUID) {
                    profile = await db.getProfile(rawValue);
                }
            }

            if (!profile) {
                setError('Error: Código QR no reconocido en el sistema.');
                setLoading(false);
                return;
            }

            try {
                // Verificar si ya está fichado hoy
                const currentLog = await db.getCurrentLog(profile.id);
                const now = new Date();

                if (currentLog && currentLog.status === 'WORKING') {
                    // Si ya está trabajando, quizás deberíamos pausar o parar? 
                    // Por ahora, el requisito suele ser "Fichar entrada". 
                    // Si es un kiosco simple, al escanear de nuevo podría cerrar jornada.
                    // Vamos a implementar una lógica inteligente:
                    // Si está WORKING -> Le fichamos SALIDA (o PAUSA?) -> Mejor SALIDA para simplificar Kiosco
                    // Pero LoginView suele ser Plogin. 
                    // ACTUALLY: LoginView logs them IN to the portal using onLogin(profile).
                    // The auto-clock-in (fichaje) happens inside here too.
                }

                if (!currentLog) {
                    await db.saveLog({
                        user_id: profile.id,
                        company_id: profile.company_id,
                        date: now.toISOString().split('T')[0],
                        start_time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        total_hours: 0,
                        status: 'WORKING'
                    });
                }
            } catch (logError) {
                console.warn('Auto-fichaje falló, pero permitimos acceso:', logError);
            }

            onLogin(profile);

        } catch (err: any) {
            console.error(err);
            setError('Error al procesar fichaje: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const startQRScanner = () => {
        setIsScanning(true);
        setError('');
    };

    useEffect(() => {
        // Check for URL errors (e.g. expired links)
        const handleUrlErrors = () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const queryParams = new URLSearchParams(window.location.search);

            const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');

            if (errorDesc) {
                setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
            }
        };

        handleUrlErrors();
    }, []);

    const [showForgotPass, setShowForgotPass] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const handlePasswordResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await db.resetPasswordForEmail(resetEmail);
            if (error) throw error;

            setResetSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError('No se pudo enviar el correo. Verifica que el email sea correcto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Side - Branding */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white p-12 flex flex-col justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 blur-[100px] rounded-full"></div>

                <div className="z-10 flex flex-col items-center justify-center flex-1 text-center space-y-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 mb-4 animate-in zoom-in duration-700">
                        <QrCode size={48} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter">QR Laboral</h1>
                    <p className="text-lg font-medium text-white/80 max-w-md leading-relaxed">
                        Gestión inteligente del control horario impulsada por Tonwy Tech.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck size={20} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Seguro</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><QrCode size={20} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Rápido</span>
                        </div>
                    </div>
                </div>

                <div className="z-10 text-xs font-bold uppercase tracking-widest opacity-50">
                    © 2026 QR Laboral • Enterprise Edition
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-right-8 duration-700 relative">

                    {showForgotPass ? (
                        /* Forgot Password View */
                        resetSuccess ? (
                            <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                    <ShieldCheck size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">¡Correo Enviado!</h3>
                                    <p className="text-sm text-slate-500 mt-3 max-w-xs mx-auto leading-relaxed">
                                        Hemos enviado las instrucciones de recuperación a <span className="font-bold text-slate-700">{resetEmail}</span>.
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">Revisa tu bandeja de entrada y SPAM.</p>
                                </div>
                                <button
                                    onClick={() => { setShowForgotPass(false); setResetSuccess(false); setResetEmail(''); }}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl mt-4"
                                >
                                    Volver al Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordResetRequest} className="space-y-6">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800">Recuperar Acceso</h3>
                                    <p className="text-xs text-slate-500 mt-2">Introduce tu email corporativo para restablecer tu contraseña.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Email Corporativo</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            placeholder="ejemplo@empresa.com"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 text-center animate-pulse">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 duration-200"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setShowForgotPass(false); setError(''); }}
                                    className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2"
                                >
                                    Volver al Inicio de Sesión
                                </button>
                            </form>
                        )
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                                <button
                                    onClick={() => { setMethod('KEYBOARD'); setIsScanning(false); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${method === 'KEYBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Mail size={14} /> Credenciales
                                </button>
                                <button
                                    onClick={() => setMethod('QR')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${method === 'QR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <QrCode size={14} /> Login QR / PIN
                                </button>
                            </div>

                            {method === 'KEYBOARD' ? (
                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="ejemplo@empresa.com"
                                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-bold text-slate-500">Contraseña</label>
                                            <button
                                                type="button"
                                                onClick={() => { setShowForgotPass(true); setError(''); }}
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 text-center animate-pulse">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 duration-200"
                                    >
                                        {loading ? 'Accediendo...' : 'Iniciar Sesión'} <ArrowRight size={18} />
                                    </button>

                                    <p className="text-center text-[10px] text-slate-400 mt-4">Powered by Tonwy Tech v1.0.0</p>

                                    {/* DEV REAL AUTH BUTTON - ONLY LOCALHOST */}
                                    {window.location.hostname === 'localhost' && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const devEmail = 'dev@localhost';
                                                const devPass = '123456';
                                                setLoading(true);

                                                try {
                                                    // 1. Try Login
                                                    let { data: loginData, error: loginError } = await db.signIn(devEmail, devPass);

                                                    // 2. If fails, Try Register
                                                    if (loginError || !loginData.user) {
                                                        const { data: signUpData, error: signUpError } = await supabase!.auth.signUp({
                                                            email: devEmail,
                                                            password: devPass
                                                        });
                                                        if (signUpError) throw signUpError;
                                                        // Auto login usually happens after signup in Supabase local/dev
                                                        if (signUpData.user) {
                                                            // Force Login again just to be sure
                                                            const res = await db.signIn(devEmail, devPass);
                                                            loginData = res.data;
                                                        }
                                                    }

                                                    if (!loginData.user) throw new Error("No se pudo autenticar");

                                                    // 3. Call Setup RPC (to ensure SuperAdmin role)
                                                    const { error: rpcError } = await supabase!.rpc('setup_dev_environment');

                                                    if (rpcError) {
                                                        console.error("RPC Error:", rpcError);
                                                        await supabase!.auth.signOut(); // Force Logout
                                                        alert(`⚠️ Error SQL: ${rpcError.message}\n\nAsegúrate de ejecutar 'dev_setup.sql' y REFRESCA la página.`);
                                                        return;
                                                    }

                                                    // 4. Load Profile & Proceed
                                                    const profile = await db.getProfile(loginData.user.id);

                                                    if (!profile) {
                                                        throw new Error("Perfil no encontrado tras setup. Revisa logs.");
                                                    }

                                                    onLogin(profile);

                                                } catch (err: any) {
                                                    console.error(err);
                                                    if (err.message !== "No se pudo autenticar") await supabase!.auth.signOut();
                                                    setError("Error Dev: " + err.message);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="w-full mt-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 transition-colors"
                                        >
                                            🛠️ MODO DESARROLLADOR (Real Auth)
                                        </button>
                                    )}
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                                    {!isScanning ? (
                                        <button
                                            onClick={startQRScanner}
                                            className="w-40 h-40 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-indigo-400 transition-all group"
                                        >
                                            <Camera size={40} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">Activar Cámara</span>
                                        </button>
                                    ) : (
                                        <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden relative border-4 border-slate-900 shadow-2xl">
                                            <Scanner
                                                onScan={handleQRScan}
                                                onError={(e) => console.log(e)}
                                                components={{ finder: false }}
                                                styles={{ container: { width: '100%', height: '100%' } }}
                                            />
                                            <div className="absolute inset-0 border-[40px] border-black/50 z-10 pointer-events-none"></div>
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 z-20 animate-pulse shadow-[0_0_10px_red]"></div>
                                            <button
                                                onClick={() => setIsScanning(false)}
                                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full z-30"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-center text-slate-500 px-8">
                                        Acerca tu código QR personal o muestra tu credencial al dispositivo.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginView;
