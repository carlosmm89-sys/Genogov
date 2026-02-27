import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Save, Loader } from 'lucide-react';
import { supabase, db } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checking, setChecking] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        // Verificar que tenemos un token de recovery en el hash
        const checkSession = async () => {
            console.log('🔐 ResetPasswordPage: Checking session...');
            console.log('URL:', window.location.href);
            console.log('Hash:', window.location.hash);

            // Extraer access_token del hash
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            console.log('Access Token:', accessToken);
            console.log('Type:', type);

            if (accessToken && type === 'recovery') {
                console.log('✅ Recovery token found in URL');

                // Guardar el token para usarlo después
                setAccessToken(accessToken);
                setIsValidSession(true);
            } else {
                console.log('❌ No recovery token in hash');
                setMessage({
                    type: 'error',
                    text: 'Enlace inválido o expirado. Por favor, solicita uno nuevo.'
                });
            }

            setChecking(false);
        };

        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!accessToken) {
            setMessage({ type: 'error', text: 'Sesión inválida. Por favor, solicita un nuevo enlace.' });
            setLoading(false);
            return;
        }

        try {
            // Llamar al endpoint serverless que usa Admin API
            const response = await fetch('/api/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: newPassword,
                    access_token: accessToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setMessage({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err: any) {
            console.error('Password update error:', err);

            if (err.message?.includes('different from the old password')) {
                setMessage({ type: 'error', text: 'Por seguridad, la nueva contraseña no puede ser igual a la anterior.' });
            } else {
                setMessage({ type: 'error', text: 'Error: ' + (err.message || 'No se pudo actualizar la contraseña') });
            }
        }

        setLoading(false);
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl text-center">
                    <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold">Verificando enlace...</p>
                </div>
            </div>
        );
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
                        <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4">Enlace Inválido</h3>
                    <p className="text-slate-600 mb-6">{message?.text}</p>
                    <a
                        href="/"
                        className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Volver al Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                        <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Nueva Contraseña</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Establece tu nueva clave de acceso</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 pr-12"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`px-6 py-4 rounded-[1.5rem] flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            <ShieldCheck size={20} />
                            <p className="text-xs font-black uppercase leading-tight">{message.text}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'} <Save size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
